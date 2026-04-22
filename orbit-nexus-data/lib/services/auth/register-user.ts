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

  return prisma.$transaction(
    async (tx) => {
      const accessCode = await generateUniqueAccessCode(tx, input.role);

      const user = await tx.user.update({
        where: {
          id: authorizedUser.id
        },
        data: {
          fullName: input.fullName.trim(),
          normalizedFullName,
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
      });

      return user;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
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

  return prisma.$transaction(
    async (tx) => {
      const existingClient = await tx.user.findFirst({
        where: {
          companyId: project.companyId,
          roleId,
          email: normalizeEmail(input.email)
        }
      });

      if (existingClient) {
        throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
      }

      const accessCode = await generateUniqueAccessCode(tx, "CLIENT");

      const user = await tx.user.create({
        data: {
          companyId: project.companyId,
          roleId,
          fullName: input.fullName.trim(),
          normalizedFullName: normalizeName(input.fullName),
          email: normalizeEmail(input.email),
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
      });

      await tx.project.update({
        where: {
          id: project.id
        },
        data: {
          clientUserId: user.id
        }
      });

      return user;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
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
