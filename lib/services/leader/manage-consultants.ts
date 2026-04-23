import { RoleKey, UserStatus } from "@prisma/client";

import {
  ALREADY_REGISTERED_MESSAGE,
  CONSULTANT_ALREADY_EXISTS_MESSAGE,
  CONSULTANT_PENDING_EXISTS_MESSAGE,
  TENANT_ACCESS_DENIED_MESSAGE
} from "@/lib/constants";
import { normalizeEmail, normalizeName, normalizeOptionalPhone } from "@/lib/normalization";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";

type CreateAuthorizedConsultantInput = {
  leaderId: string;
  companyId: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  specializationSummary?: string | null;
};

function ensureLeaderCompany(companyId: string | null): string {
  if (!companyId) {
    throw new ServiceError(TENANT_ACCESS_DENIED_MESSAGE, 403);
  }

  return companyId;
}

async function getConsultantRoleId() {
  const role = await prisma.role.findUniqueOrThrow({
    where: {
      key: RoleKey.CONSULTANT
    },
    select: {
      id: true
    }
  });

  return role.id;
}

export async function listLeaderConsultants(companyId: string | null) {
  const scopedCompanyId = ensureLeaderCompany(companyId);
  const consultantRoleId = await getConsultantRoleId();

  return prisma.user.findMany({
    where: {
      companyId: scopedCompanyId,
      roleId: consultantRoleId
    },
    orderBy: [{ status: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      specializationSummary: true,
      status: true,
      accessCode: true,
      createdAt: true,
      disabledAt: true
    }
  });
}

export async function createAuthorizedConsultant(input: CreateAuthorizedConsultantInput) {
  const companyId = ensureLeaderCompany(input.companyId);
  const consultantRoleId = await getConsultantRoleId();
  const email = normalizeEmail(input.email);
  const normalizedFullName = normalizeName(input.fullName);

  const crossTenantConsultant = await prisma.user.findFirst({
    where: {
      roleId: consultantRoleId,
      email,
      NOT: {
        companyId
      }
    },
    select: {
      id: true
    }
  });

  if (crossTenantConsultant) {
    throw new ServiceError(
      "El correo del consultor ya esta autorizado en otra empresa y no puede duplicarse entre tenants.",
      409
    );
  }

  const existingConsultant = await prisma.user.findFirst({
    where: {
      companyId,
      roleId: consultantRoleId,
      email
    }
  });

  if (existingConsultant?.status === UserStatus.ACTIVE) {
    throw new ServiceError(CONSULTANT_ALREADY_EXISTS_MESSAGE, 409);
  }

  if (existingConsultant?.status === UserStatus.PENDING_REGISTRATION) {
    throw new ServiceError(CONSULTANT_PENDING_EXISTS_MESSAGE, 409);
  }

  if (existingConsultant?.status === UserStatus.DISABLED) {
    throw new ServiceError(ALREADY_REGISTERED_MESSAGE, 409);
  }

  return prisma.user.create({
    data: {
      companyId,
      roleId: consultantRoleId,
      createdByLeaderId: input.leaderId,
      fullName: input.fullName.trim(),
      normalizedFullName,
      email,
      phone: normalizeOptionalPhone(input.phone),
      specializationSummary: input.specializationSummary?.trim() || null,
      importedFromDirectory: true,
      status: UserStatus.PENDING_REGISTRATION
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      specializationSummary: true,
      status: true,
      accessCode: true,
      createdAt: true,
      disabledAt: true
    }
  });
}

export async function removeLeaderConsultant(params: {
  leaderCompanyId: string | null;
  consultantId: string;
}) {
  const companyId = ensureLeaderCompany(params.leaderCompanyId);
  const consultantRoleId = await getConsultantRoleId();

  const consultant = await prisma.user.findFirst({
    where: {
      id: params.consultantId,
      companyId,
      roleId: consultantRoleId
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!consultant) {
    throw new ServiceError("No encontramos al consultor solicitado dentro de tu empresa.", 404);
  }

  if (consultant.status === UserStatus.PENDING_REGISTRATION) {
    await prisma.user.delete({
      where: {
        id: consultant.id
      }
    });

    return {
      strategy: "hard-delete" as const
    };
  }

  await prisma.user.update({
    where: {
      id: consultant.id
    },
    data: {
      status: UserStatus.DISABLED,
      disabledAt: new Date()
    }
  });

  return {
    strategy: "disabled" as const
  };
}
