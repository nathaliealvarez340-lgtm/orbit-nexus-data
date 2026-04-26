import { CompanyBillingStatus, CompanyPlan, RoleKey, UserStatus } from "@prisma/client";

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
import { getSupportTicketList, type SupportTicketSummary } from "@/lib/services/nexus/support-tickets";
import { ServiceError } from "@/lib/services/service-error";
import {
  getPricingSettings,
  type PricingSettingsSummary
} from "@/lib/services/admin/platform-settings";

type CreateCompanyInput = {
  name: string;
  slug?: string;
  codePrefix?: string;
  registrationCode?: string;
  sector?: string;
  contactName?: string;
  contactEmail?: string;
  subscriptionPlan?: CompanyPlan;
  includedUsers?: number;
  extraUsers?: number;
  monthlyAmountMxn?: number;
  initialStatus?: "ACTIVE" | "PENDING";
};

export type CompanySummary = {
  id: string;
  name: string;
  slug: string;
  codePrefix: string;
  registrationCode: string;
  isActive: boolean;
  sector: string | null;
  contactName: string | null;
  contactEmail: string | null;
  subscriptionPlan: CompanyPlan | null;
  includedUsers: number;
  extraUsers: number;
  monthlyAmountMxn: number | null;
  billingStatus: CompanyBillingStatus;
  activatedAt: string | null;
  leaderCount: number;
  consultantCount: number;
  clientCount: number;
  projectCount: number;
  activeProjectCount: number;
  createdAt: string;
};

export type ActivationRequestSummary = {
  id: string;
  companyName: string;
  contactEmail: string;
  plan: CompanyPlan;
  totalAmountMxn: number;
  status: CompanyBillingStatus;
  createdAt: string;
  activatedCompanyId: string | null;
  activatedCompanyName: string | null;
  registrationCode: string | null;
};

export type SuperadminOverview = {
  totalCompanies: number;
  activeCompanies: number;
  pendingCompanies: number;
  activeSubscriptions: number;
  enterpriseReviews: number;
  authorizedLeaders: number;
  authorizedConsultants: number;
  totalProjects: number;
  completedProjects: number;
  activeConsultants: number;
  openReports: number;
  estimatedMonthlyRevenueMxn: number;
  totalUsers: number;
};

export async function getRecentActivationRequests(limit = 6) {
  const requests = await prisma.companyActivationRequest.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      companyName: true,
      email: true,
      plan: true,
      totalAmountMxn: true,
      status: true,
      createdAt: true,
      registrationCode: true,
      company: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return requests.map(
    (request) =>
      ({
        id: request.id,
        companyName: request.companyName,
        contactEmail: request.email,
        plan: request.plan,
        totalAmountMxn: request.totalAmountMxn,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        activatedCompanyId: request.company?.id ?? null,
        activatedCompanyName: request.company?.name ?? null,
        registrationCode: request.registrationCode ?? null
      }) satisfies ActivationRequestSummary
  );
}

export async function getSuperadminOverview(companies?: CompanySummary[]) {
  const companySummaries = companies ?? (await getCompanySummaryList());

  const [
    authorizedLeaders,
    authorizedConsultants,
    enterpriseReviews,
    totalProjects,
    completedProjects,
    activeConsultants,
    openReports,
    totalUsers
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: { key: RoleKey.LEADER },
        companyId: { not: null },
        status: {
          in: [UserStatus.PENDING_REGISTRATION, UserStatus.ACTIVE]
        }
      }
    }),
    prisma.user.count({
      where: {
        role: { key: RoleKey.CONSULTANT },
        companyId: { not: null },
        status: {
          in: [UserStatus.PENDING_REGISTRATION, UserStatus.ACTIVE]
        }
      }
    }),
    prisma.companyActivationRequest.count({
      where: {
        status: CompanyBillingStatus.ENTERPRISE_REVIEW
      }
    }),
    prisma.project.count(),
    prisma.project.count({
      where: {
        status: "COMPLETED"
      }
    }),
    prisma.user.count({
      where: {
        role: { key: RoleKey.CONSULTANT },
        status: UserStatus.ACTIVE
      }
    }),
    prisma.supportTicket.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"]
        }
      }
    }),
    prisma.user.count({
      where: {
        status: {
          in: [UserStatus.PENDING_REGISTRATION, UserStatus.ACTIVE]
        }
      }
    })
  ]);

  const estimatedMonthlyRevenueMxn = companySummaries.reduce(
    (total, company) => total + (company.monthlyAmountMxn ?? 0),
    0
  );

  return {
    totalCompanies: companySummaries.length,
    activeCompanies: companySummaries.filter((company) => company.isActive).length,
    pendingCompanies: companySummaries.filter((company) => !company.isActive).length,
    activeSubscriptions: companySummaries.filter(
      (company) => company.billingStatus === CompanyBillingStatus.ACTIVE
    ).length,
    enterpriseReviews,
    authorizedLeaders,
    authorizedConsultants,
    totalProjects,
    completedProjects,
    activeConsultants,
    openReports,
    estimatedMonthlyRevenueMxn,
    totalUsers
  } satisfies SuperadminOverview;
}

export async function getSuperadminDashboardData() {
  const companies = await getCompanySummaryList();
  const [overview, activationRequests, supportTickets, pricingSettings] = await Promise.all([
    getSuperadminOverview(companies),
    getRecentActivationRequests(),
    getSupportTicketList(),
    getPricingSettings()
  ]);

  return {
    companies,
    overview,
    activationRequests,
    supportTickets,
    pricingSettings
  };
}

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
      sector: true,
      contactName: true,
      contactEmail: true,
      subscriptionPlan: true,
      includedUsers: true,
      extraUsers: true,
      monthlyAmountMxn: true,
      billingStatus: true,
      activatedAt: true,
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
        sector: company.sector,
        contactName: company.contactName,
        contactEmail: company.contactEmail,
        subscriptionPlan: company.subscriptionPlan,
        includedUsers: company.includedUsers,
        extraUsers: company.extraUsers,
        monthlyAmountMxn: company.monthlyAmountMxn,
        billingStatus: company.billingStatus,
        activatedAt: company.activatedAt?.toISOString() ?? null,
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
      isActive: input.initialStatus !== "PENDING",
      sector: input.sector?.trim() || null,
      contactName: input.contactName?.trim() || null,
      contactEmail: input.contactEmail?.trim().toLowerCase() || null,
      subscriptionPlan: input.subscriptionPlan ?? null,
      includedUsers: input.includedUsers ?? 0,
      extraUsers: input.extraUsers ?? 0,
      monthlyAmountMxn: input.monthlyAmountMxn ?? null,
      billingStatus:
        input.initialStatus === "PENDING"
          ? CompanyBillingStatus.PENDING
          : CompanyBillingStatus.ACTIVE,
      activatedAt: input.initialStatus === "PENDING" ? null : new Date()
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
