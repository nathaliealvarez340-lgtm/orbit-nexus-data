import { RoleKey, UserStatus } from "@prisma/client";

import { ALREADY_REGISTERED_MESSAGE, COMPANY_NOT_FOUND_MESSAGE } from "@/lib/constants";
import { normalizeEmail, normalizeName, normalizeOptionalPhone } from "@/lib/normalization";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";

type CreateAuthorizedLeaderInput = {
  companyId: string;
  fullName: string;
  email: string;
  phone?: string | null;
};

async function getLeaderRoleId() {
  const role = await prisma.role.findUniqueOrThrow({
    where: {
      key: RoleKey.LEADER
    },
    select: {
      id: true
    }
  });

  return role.id;
}

export async function listAuthorizedLeaders(companyId: string) {
  const consultantRoleId = await getLeaderRoleId();

  return prisma.user.findMany({
    where: {
      companyId,
      roleId: consultantRoleId
    },
    orderBy: [{ status: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      accessCode: true,
      createdAt: true,
      importedFromDirectory: true,
      disabledAt: true
    }
  });
}

export async function createAuthorizedLeader(input: CreateAuthorizedLeaderInput) {
  const company = await prisma.company.findUnique({
    where: {
      id: input.companyId
    },
    select: {
      id: true,
      isActive: true
    }
  });

  if (!company || !company.isActive) {
    throw new ServiceError(COMPANY_NOT_FOUND_MESSAGE, 404);
  }

  const leaderRoleId = await getLeaderRoleId();
  const email = normalizeEmail(input.email);
  const normalizedFullName = normalizeName(input.fullName);

  const crossTenantLeader = await prisma.user.findFirst({
    where: {
      roleId: leaderRoleId,
      email,
      NOT: {
        companyId: company.id
      }
    },
    select: {
      id: true
    }
  });

  if (crossTenantLeader) {
    throw new ServiceError(
      "El correo del lider ya esta autorizado en otra empresa y no puede duplicarse entre tenants.",
      409
    );
  }

  const existingLeader = await prisma.user.findFirst({
    where: {
      companyId: company.id,
      roleId: leaderRoleId,
      email
    }
  });

  if (existingLeader?.status === UserStatus.ACTIVE) {
    throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
  }

  if (existingLeader?.status === UserStatus.PENDING_REGISTRATION) {
    throw new ServiceError("El lider ya esta autorizado y pendiente de registro.", 409);
  }

  if (existingLeader?.status === UserStatus.DISABLED) {
    throw new ServiceError("El lider existe pero fue deshabilitado. Reactivalo desde soporte.", 409);
  }

  return prisma.user.create({
    data: {
      companyId: company.id,
      roleId: leaderRoleId,
      fullName: input.fullName.trim(),
      normalizedFullName,
      email,
      phone: normalizeOptionalPhone(input.phone),
      importedFromDirectory: true,
      status: UserStatus.PENDING_REGISTRATION
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      accessCode: true,
      createdAt: true,
      importedFromDirectory: true,
      disabledAt: true
    }
  });
}
