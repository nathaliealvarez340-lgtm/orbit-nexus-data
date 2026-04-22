import { Prisma } from "@prisma/client";

import { generateUniqueAccessCode } from "@/lib/access-code";
import {
  ALREADY_REGISTERED_MESSAGE,
  AMBIGUOUS_DIRECTORY_MATCH_MESSAGE,
  INVALID_PROJECT_FOLIO_MESSAGE,
  UNAUTHORIZED_DIRECTORY_MESSAGE
} from "@/lib/constants";
import { normalizeEmail, normalizeName, normalizeOptionalPhone } from "@/lib/normalization";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import { registerServiceSchema } from "@/lib/validation/auth-payloads";
import type { RegistrableRoleKey } from "@/types/auth";

type RegisterUserInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: RegistrableRoleKey;
  projectFolio?: string;
};

const ACCESS_CODE_RETRY_LIMIT = 5;

function isAccessCodeConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("accessCode")
  );
}

async function reserveAccessCode<T>(
  role: Extract<RegistrableRoleKey, "LEADER" | "CONSULTANT" | "CLIENT">,
  operation: (accessCode: string) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < ACCESS_CODE_RETRY_LIMIT; attempt += 1) {
    const accessCode = await generateUniqueAccessCode(prisma, role);

    try {
      return await operation(accessCode);
    } catch (error) {
      if (isAccessCodeConflict(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new ServiceError(
    "No fue posible generar un codigo unico de acceso. Intenta nuevamente.",
    500
  );
}

async function activateDirectoryUser(
  input: RegisterUserInput,
  roleId: string
) {
  const normalizedFullName = normalizeName(input.fullName);
  const email = normalizeEmail(input.email);

  const matches = await prisma.user.findMany({
    where: {
      roleId,
      normalizedFullName,
      email,
      importedFromDirectory: true
    }
  });

  if (matches.length === 0) {
    throw new ServiceError(UNAUTHORIZED_DIRECTORY_MESSAGE, 403);
  }

  if (matches.length > 1) {
    throw new ServiceError(AMBIGUOUS_DIRECTORY_MATCH_MESSAGE, 409);
  }

  const [authorizedUser] = matches;

  if (authorizedUser.status === "ACTIVE" && authorizedUser.accessCode) {
    throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
  }

  const passwordHash = await hashPassword(input.password);

  return reserveAccessCode(input.role, (accessCode) =>
    prisma.user.update({
      where: {
        id: authorizedUser.id
      },
      data: {
        fullName: input.fullName.trim(),
        normalizedFullName,
        email,
        phone: normalizeOptionalPhone(input.phone),
        passwordHash,
        accessCode,
        status: "ACTIVE",
        registeredAt: new Date()
      },
      include: {
        role: true,
        company: true
      }
    })
  );
}

async function createClientUser(input: RegisterUserInput, roleId: string) {
  const folio = input.projectFolio?.trim();

  if (!folio) {
    throw new ServiceError(INVALID_PROJECT_FOLIO_MESSAGE, 400);
  }

  const project = await prisma.project.findUnique({
    where: {
      folio
    }
  });

  if (!project) {
    throw new ServiceError(INVALID_PROJECT_FOLIO_MESSAGE, 404);
  }

  if (project.clientUserId) {
    throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
  }

  const passwordHash = await hashPassword(input.password);
  const normalizedEmail = normalizeEmail(input.email);
  const existingClient = await prisma.user.findFirst({
    where: {
      companyId: project.companyId,
      roleId,
      email: normalizedEmail
    }
  });

  if (existingClient) {
    throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
  }

  const normalizedFullName = normalizeName(input.fullName);

  const updatedProject = await reserveAccessCode("CLIENT", (accessCode) =>
    prisma.project.update({
      where: {
        id: project.id
      },
      data: {
        clientUser: {
          create: {
            companyId: project.companyId,
            roleId,
            fullName: input.fullName.trim(),
            normalizedFullName,
            email: normalizedEmail,
            phone: normalizeOptionalPhone(input.phone),
            passwordHash,
            accessCode,
            status: "ACTIVE",
            registeredAt: new Date()
          }
        }
      },
      include: {
        clientUser: {
          include: {
            role: true,
            company: true
          }
        }
      }
    }).then((nextProject) => {
      const user = nextProject.clientUser;

      if (!user) {
        throw new ServiceError("No fue posible activar el cliente para el proyecto.", 500);
      }

      return user;
    })
  );

  return updatedProject;
}

export async function registerUser(input: RegisterUserInput) {
  const parsedInput = registerServiceSchema.parse(input);

  const role = await prisma.role.findUniqueOrThrow({
    where: {
      key: parsedInput.role
    }
  });

  if (parsedInput.role === "CLIENT") {
    const user = await createClientUser(parsedInput, role.id);

    return {
      id: user.id,
      accessCode: user.accessCode!,
      role: user.role.key,
      companyName: user.company?.name ?? "Empresa asignada"
    };
  }

  const user = await activateDirectoryUser(parsedInput, role.id);

  return {
    id: user.id,
    accessCode: user.accessCode!,
    role: user.role.key,
    companyName: user.company?.name ?? "Empresa asignada"
  };
}
