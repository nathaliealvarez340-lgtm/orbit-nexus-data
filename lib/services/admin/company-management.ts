import { RoleKey, UserStatus } from "@prisma/client";

import {
  COMPANY_ALREADY_EXISTS_MESSAGE,
  COMPANY_NOT_FOUND_MESSAGE
} from "@/lib/constants";
import {
  deriveCompanyCodePrefix,
  generateCompanyRegistrationCode,
  normalizeCompanyCodePrefix
} from "@/lib/company-code";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";

type CreateCompanyInput = {
  name: string;
  slug?: string;
  codePrefix?: string;
  registrationCode?: string;
};

export type CompanySummary = {
  id: string;
  name: string;
  slug: string;
  codePrefix: string;
  registrationCode: string;
  isActive: boolean;
  leaderCount: number;
  consultantCount: number;
  clientCount: number;
  projectCount: number;
  activeProjectCount: number;
  createdAt: string;
};

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .trim();
}

function normalizeRegistrationCode(value?: string | null, companyCodePrefix?: string) {
  const rawValue = value?.trim().toUpperCase();

  if (rawValue) {
    return rawValue;
  }

  return generateCompanyRegistrationCode(companyCodePrefix ?? "NX");
}

async function ensureUniqueCompanyFields(input: {
  slug: string;
  codePrefix: string;
  registrationCode: string;
  ignoreCompanyId?: string;
}) {
  const existing = await prisma.company.findFirst({
    where: {
      OR: [
        { slug: input.slug },
        { codePrefix: input.codePrefix },
        { registrationCode: input.registrationCode }
      ],
      NOT: input.ignoreCompanyId ? { id: input.ignoreCompanyId } : undefined
    },
    select: {
      id: true
    }
  });

  if (existing) {
    throw new ServiceError(COMPANY_ALREADY_EXISTS_MESSAGE, 409);
  }
}

export async function getCompanySummaryList() {
  const companies = await prisma.company.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      codePrefix: true,
      registrationCode: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          projects: true
        }
      }
    }
  });

  return Promise.all(
    companies.map(async (company) => {
      const [leaderCount, consultantCount, clientCount, activeProjectCount] = await Promise.all([
        prisma.user.count({
          where: {
            companyId: company.id,
            role: { key: RoleKey.LEADER },
            status: UserStatus.ACTIVE
          }
        }),
        prisma.user.count({
          where: {
            companyId: company.id,
            role: { key: RoleKey.CONSULTANT },
            status: UserStatus.ACTIVE
          }
        }),
        prisma.user.count({
          where: {
            companyId: company.id,
            role: { key: RoleKey.CLIENT },
            status: UserStatus.ACTIVE
          }
        }),
        prisma.project.count({
          where: {
            companyId: company.id,
            status: {
              in: ["READY_FOR_MATCHING", "ASSIGNED", "ACTIVE", "UNDER_REVIEW", "AT_RISK"]
            }
          }
        })
      ]);

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        codePrefix: company.codePrefix,
        registrationCode: company.registrationCode,
        isActive: company.isActive,
        leaderCount,
        consultantCount,
        clientCount,
        projectCount: company._count.projects,
        activeProjectCount,
        createdAt: company.createdAt.toISOString()
      } satisfies CompanySummary;
    })
  );
}

export async function createCompany(input: CreateCompanyInput) {
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug || input.name);

  if (!name || !slug) {
    throw new ServiceError("Nombre y slug son obligatorios para registrar una empresa.", 400);
  }

  const codePrefix = normalizeCompanyCodePrefix(input.codePrefix ?? deriveCompanyCodePrefix(name));
  const registrationCode = normalizeRegistrationCode(input.registrationCode, codePrefix);

  await ensureUniqueCompanyFields({
    slug,
    codePrefix,
    registrationCode
  });

  await prisma.company.create({
    data: {
      name,
      slug,
      codePrefix,
      registrationCode,
      isActive: true
    }
  });

  const companies = await getCompanySummaryList();
  return companies.find((company) => company.slug === slug)!;
}

export async function rotateCompanyRegistrationCode(companyId: string) {
  const company = await prisma.company.findUnique({
    where: {
      id: companyId
    },
    select: {
      id: true,
      codePrefix: true
    }
  });

  if (!company) {
    throw new ServiceError(COMPANY_NOT_FOUND_MESSAGE, 404);
  }

  let nextRegistrationCode = generateCompanyRegistrationCode(company.codePrefix);

  while (
    await prisma.company.findFirst({
      where: {
        registrationCode: nextRegistrationCode,
        NOT: { id: company.id }
      },
      select: { id: true }
    })
  ) {
    nextRegistrationCode = generateCompanyRegistrationCode(company.codePrefix);
  }

  await prisma.company.update({
    where: {
      id: company.id
    },
    data: {
      registrationCode: nextRegistrationCode
    }
  });

  return nextRegistrationCode;
}
