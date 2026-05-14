import {
  ActivityLogType,
  CompanyBillingStatus,
  CompanyPlan,
  OrganizationAccessType,
  Prisma,
  RoleKey,
  UserStatus
} from "@prisma/client";

import { normalizeEmail, normalizeName, normalizeOptionalPhone } from "@/lib/normalization";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import { registerServiceSchema } from "@/lib/validation/auth-payloads";

type RegisterUserInput = {
  companyName: string;
  fullName: string;
  email: string;
  phone?: string;
  password: string;
};

const IDENTIFIER_RETRY_LIMIT = 5;
const ACCESS_CODE_RETRY_LIMIT = 5;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .trim();
}

function buildCompanyPrefix(value: string) {
  const sanitized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return (sanitized.slice(0, 6) || "ORBIT").slice(0, 6);
}

async function buildUniqueSlug(companyName: string) {
  const baseSlug = slugify(companyName) || "empresa";

  for (let attempt = 0; attempt < IDENTIFIER_RETRY_LIMIT; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    const existing = await prisma.company.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${baseSlug}-${randomSuffix}`;
}

async function buildUniqueCompanyPrefix(companyName: string) {
  const basePrefix = buildCompanyPrefix(companyName);

  for (let attempt = 0; attempt < IDENTIFIER_RETRY_LIMIT; attempt += 1) {
    const candidate = attempt === 0 ? basePrefix : `${basePrefix}${attempt}`;
    const existing = await prisma.company.findUnique({
      where: { codePrefix: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${basePrefix}${Math.floor(1000 + Math.random() * 9000)}`;
}

async function buildUniqueRegistrationCode(companyPrefix: string) {
  for (let attempt = 0; attempt < ACCESS_CODE_RETRY_LIMIT; attempt += 1) {
    const candidate = `${companyPrefix}-OWNER-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const existing = await prisma.company.findUnique({
      where: { registrationCode: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new ServiceError(
    "No fue posible generar el codigo interno de la empresa. Intenta nuevamente.",
    500
  );
}

async function buildUniqueEnterpriseAccessCode(companyPrefix: string) {
  for (let attempt = 0; attempt < ACCESS_CODE_RETRY_LIMIT; attempt += 1) {
    const randomChunk = String(Math.floor(Math.random() * 10_000)).padStart(4, "0");
    const candidate = `${companyPrefix}-00${randomChunk}`;
    const existing = await prisma.user.findUnique({
      where: { accessCode: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new ServiceError(
    "No fue posible generar un codigo unico de acceso. Intenta nuevamente.",
    500
  );
}

function isUniqueConstraintConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function registerUser(input: RegisterUserInput) {
  const parsedInput = registerServiceSchema.parse(input);
  const companyName = parsedInput.companyName.trim();
  const fullName = parsedInput.fullName.trim();
  const email = normalizeEmail(parsedInput.email);
  const normalizedFullName = normalizeName(fullName);
  const passwordHash = await hashPassword(parsedInput.password);

  for (let attempt = 0; attempt < IDENTIFIER_RETRY_LIMIT; attempt += 1) {
    const slug = await buildUniqueSlug(companyName);
    const codePrefix = await buildUniqueCompanyPrefix(companyName);
    const registrationCode = await buildUniqueRegistrationCode(codePrefix);
    const accessCode = await buildUniqueEnterpriseAccessCode(codePrefix);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const ownerRole = await tx.role.upsert({
          where: { key: RoleKey.OWNER },
          update: {
            name: "Owner",
            description: "Acceso propietario al sistema operativo ejecutivo de la organizacion."
          },
          create: {
            key: RoleKey.OWNER,
            name: "Owner",
            description: "Acceso propietario al sistema operativo ejecutivo de la organizacion."
          }
        });

        const company = await tx.company.create({
          data: {
            name: companyName,
            slug,
            codePrefix,
            registrationCode,
            isActive: true,
            contactName: fullName,
            contactEmail: email,
            ownerContactEmail: email,
            authorizedEmailDomain: email.split("@")[1] ?? null,
            organizationAccessType: OrganizationAccessType.COMPANY,
            subscriptionPlan: CompanyPlan.CORE,
            billingStatus: CompanyBillingStatus.ACTIVE,
            activatedAt: new Date()
          }
        });

        const user = await tx.user.create({
          data: {
            companyId: company.id,
            roleId: ownerRole.id,
            fullName,
            normalizedFullName,
            email,
            phone: normalizeOptionalPhone(parsedInput.phone),
            passwordHash,
            accessCode,
            status: UserStatus.ACTIVE,
            registeredAt: new Date()
          },
          include: {
            role: true,
            company: true
          }
        });

        await tx.activityLog.create({
          data: {
            companyId: company.id,
            userId: user.id,
            type: ActivityLogType.SYSTEM,
            title: "Empresa activada",
            description:
              "Se activo la organizacion y se creo el primer owner del sistema operativo ejecutivo.",
            routePath: "/workspace",
            metadata: {
              role: ownerRole.key
            }
          }
        });

        return {
          id: user.id,
          accessCode,
          role: user.role.key,
          companyName: user.company?.name ?? companyName
        };
      });

      return result;
    } catch (error) {
      if (isUniqueConstraintConflict(error) && attempt < IDENTIFIER_RETRY_LIMIT - 1) {
        console.warn("[auth/register] Identifier collision while activating company", {
          companyName,
          attempt: attempt + 1
        });
        continue;
      }

      throw error;
    }
  }

  throw new ServiceError(
    "No fue posible activar la empresa con un identificador unico. Intenta nuevamente.",
    409
  );
}
