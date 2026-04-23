import { Prisma } from "@prisma/client";

import { generateUniqueAccessCode } from "@/lib/access-code";
import {
  ALREADY_REGISTERED_MESSAGE,
  AMBIGUOUS_DIRECTORY_MATCH_MESSAGE,
  CLIENT_EMAIL_MISMATCH_MESSAGE,
  INVALID_COMPANY_REGISTRATION_CODE_MESSAGE,
  INVALID_PROJECT_FOLIO_MESSAGE,
  UNAUTHORIZED_CONSULTANT_REGISTRATION_MESSAGE,
  UNAUTHORIZED_DIRECTORY_MESSAGE,
  UNAUTHORIZED_LEADER_REGISTRATION_MESSAGE
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
  companyRegistrationCode?: string;
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
  companyCodePrefix: string,
  operation: (accessCode: string) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < ACCESS_CODE_RETRY_LIMIT; attempt += 1) {
    const accessCode = await generateUniqueAccessCode(prisma, role, companyCodePrefix);

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

async function activateLeaderUser(input: RegisterUserInput, roleId: string) {
  const registrationCode = input.companyRegistrationCode?.trim().toUpperCase();

  if (!registrationCode) {
    throw new ServiceError("El codigo maestro de la empresa es obligatorio para registrar un lider.", 400);
  }

  const company = await prisma.company.findUnique({
    where: {
      registrationCode
    },
    select: {
      id: true,
      name: true,
      codePrefix: true,
      isActive: true
    }
  });

  if (!company || !company.isActive) {
    throw new ServiceError(INVALID_COMPANY_REGISTRATION_CODE_MESSAGE, 403);
  }

  const normalizedFullName = normalizeName(input.fullName);
  const email = normalizeEmail(input.email);

  const matches = await prisma.user.findMany({
    where: {
      companyId: company.id,
      roleId,
      normalizedFullName,
      email,
      importedFromDirectory: true
    }
  });

  if (matches.length === 0) {
    throw new ServiceError(UNAUTHORIZED_LEADER_REGISTRATION_MESSAGE, 403);
  }

  if (matches.length > 1) {
    throw new ServiceError(AMBIGUOUS_DIRECTORY_MATCH_MESSAGE, 409);
  }

  const [authorizedUser] = matches;

  if (authorizedUser.status === "ACTIVE" && authorizedUser.accessCode) {
    throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
  }

  const passwordHash = await hashPassword(input.password);

  return reserveAccessCode("LEADER", company.codePrefix, (accessCode) =>
    prisma.user.update({
      where: {
        id: authorizedUser.id
      },
      data: {
        companyId: company.id,
        roleId,
        fullName: input.fullName.trim(),
        normalizedFullName,
        email,
        phone: normalizeOptionalPhone(input.phone),
        passwordHash,
        accessCode,
        status: "ACTIVE",
        disabledAt: null,
        registeredAt: new Date()
      },
      include: {
        role: true,
        company: true
      }
    })
  );
}

async function activateConsultantUser(input: RegisterUserInput, roleId: string) {
  const normalizedFullName = normalizeName(input.fullName);
  const email = normalizeEmail(input.email);

  const matches = await prisma.user.findMany({
    where: {
      roleId,
      normalizedFullName,
      email,
      importedFromDirectory: true
    },
    include: {
      company: true
    }
  });

  if (matches.length === 0) {
    throw new ServiceError(UNAUTHORIZED_CONSULTANT_REGISTRATION_MESSAGE, 403);
  }

  if (matches.length > 1) {
    throw new ServiceError(AMBIGUOUS_DIRECTORY_MATCH_MESSAGE, 409);
  }

  const [authorizedUser] = matches;

  if (!authorizedUser.company || !authorizedUser.company.isActive) {
    throw new ServiceError(UNAUTHORIZED_DIRECTORY_MESSAGE, 403);
  }

  if (authorizedUser.status === "ACTIVE" && authorizedUser.accessCode) {
    throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
  }

  const passwordHash = await hashPassword(input.password);

  return reserveAccessCode("CONSULTANT", authorizedUser.company.codePrefix, (accessCode) =>
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
        disabledAt: null,
        registeredAt: new Date()
      },
      include: {
        role: true,
        company: true
      }
    })
  );
}

async function createOrActivateClientUser(input: RegisterUserInput, roleId: string) {
  const folio = input.projectFolio?.trim().toUpperCase();

  if (!folio) {
    throw new ServiceError(INVALID_PROJECT_FOLIO_MESSAGE, 400);
  }

  const project = await prisma.project.findUnique({
    where: {
      folio
    },
    include: {
      company: true,
      clientUser: true
    }
  });

  if (!project || !project.company.isActive) {
    throw new ServiceError(INVALID_PROJECT_FOLIO_MESSAGE, 404);
  }

  if (project.clientUserId) {
    throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
  }

  const normalizedEmail = normalizeEmail(input.email);
  const normalizedFullName = normalizeName(input.fullName);
  const normalizedProjectEmail = project.clientContactEmail
    ? normalizeEmail(project.clientContactEmail)
    : null;
  const normalizedProjectContactName = project.clientContactName
    ? normalizeName(project.clientContactName)
    : null;

  if (normalizedProjectEmail && normalizedProjectEmail !== normalizedEmail) {
    throw new ServiceError(CLIENT_EMAIL_MISMATCH_MESSAGE, 403);
  }

  if (normalizedProjectContactName && normalizedProjectContactName !== normalizedFullName) {
    throw new ServiceError("El nombre no coincide con el contacto autorizado para este proyecto.", 403);
  }

  const existingPendingClient = await prisma.user.findFirst({
    where: {
      companyId: project.companyId,
      roleId,
      email: normalizedEmail
    },
    include: {
      company: true
    }
  });

  if (existingPendingClient?.status === "ACTIVE" && existingPendingClient.accessCode) {
    throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
  }

  if (!existingPendingClient && !normalizedProjectEmail) {
    throw new ServiceError(
      "Este proyecto no tiene un cliente autorizado para completar el registro.",
      403
    );
  }

  const passwordHash = await hashPassword(input.password);

  if (existingPendingClient) {
    return reserveAccessCode("CLIENT", project.company.codePrefix, (accessCode) =>
      prisma.user
        .update({
          where: {
            id: existingPendingClient.id
          },
          data: {
            fullName: input.fullName.trim(),
            normalizedFullName,
            email: normalizedEmail,
            phone: normalizeOptionalPhone(input.phone),
            passwordHash,
            accessCode,
            status: "ACTIVE",
            disabledAt: null,
            registeredAt: new Date()
          },
          include: {
            role: true,
            company: true
          }
        })
        .then(async (user) => {
          await prisma.project.update({
            where: {
              id: project.id
            },
            data: {
              clientUserId: user.id
            }
          });

          return user;
        })
    );
  }

  return reserveAccessCode("CLIENT", project.company.codePrefix, (accessCode) =>
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
}

export async function registerUser(input: RegisterUserInput) {
  const parsedInput = registerServiceSchema.parse(input);

  const role = await prisma.role.findUniqueOrThrow({
    where: {
      key: parsedInput.role
    }
  });

  if (parsedInput.role === "LEADER") {
    const user = await activateLeaderUser(parsedInput, role.id);

    return {
      id: user.id,
      accessCode: user.accessCode!,
      role: user.role.key,
      companyName: user.company?.name ?? "Empresa asignada"
    };
  }

  if (parsedInput.role === "CONSULTANT") {
    const user = await activateConsultantUser(parsedInput, role.id);

    return {
      id: user.id,
      accessCode: user.accessCode!,
      role: user.role.key,
      companyName: user.company?.name ?? "Empresa asignada"
    };
  }

  const user = await createOrActivateClientUser(parsedInput, role.id);

  return {
    id: user.id,
    accessCode: user.accessCode!,
    role: user.role.key,
    companyName: user.company?.name ?? "Empresa asignada"
  };
}
