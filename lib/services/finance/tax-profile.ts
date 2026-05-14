import "server-only";

import { ActivityLogType, type Prisma } from "@prisma/client";

import { EXECUTIVE_WORKSPACE_ROLES, assertRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import type { TaxProfileInput } from "@/lib/validation/tax-profile";
import type { SessionUser } from "@/types/auth";

const TAX_PROFILE_WRITE_ROLES = ["OWNER", "ADMIN", "FINANCE"] as const;

const taxProfileSelect = {
  id: true,
  rfc: true,
  legalName: true,
  personType: true,
  fiscalRegime: true,
  fiscalZipCode: true,
  fiscalAddress: true,
  fiscalEmail: true,
  phone: true,
  commercialName: true,
  completenessState: true,
  storageNotice: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.CompanyTaxProfileSelect;

function getCompanyId(session: SessionUser) {
  assertRole(session, EXECUTIVE_WORKSPACE_ROLES);

  const companyId = session.companyId ?? session.tenantId;

  if (!companyId) {
    throw new ServiceError("Tu sesion no tiene organizacion asociada.", 403);
  }

  return companyId;
}

function assertCanWriteTaxProfile(session: SessionUser) {
  if (!TAX_PROFILE_WRITE_ROLES.includes(session.role as (typeof TAX_PROFILE_WRITE_ROLES)[number])) {
    throw new ServiceError("No tienes permisos para modificar datos fiscales.", 403);
  }
}

function resolveCompleteness(input: TaxProfileInput) {
  const hasMinimumQuoteData = Boolean(input.rfc && input.legalName && input.fiscalEmail);
  const hasFutureInvoiceData = Boolean(
    input.rfc &&
      input.legalName &&
      input.personType &&
      input.fiscalRegime &&
      input.fiscalZipCode &&
      input.fiscalAddress
  );

  if (hasFutureInvoiceData) {
    return "READY_FOR_FUTURE_INVOICING";
  }

  if (hasMinimumQuoteData) {
    return "READY_FOR_QUOTES";
  }

  return "INCOMPLETE";
}

function mapTaxProfile(record: Prisma.CompanyTaxProfileGetPayload<{ select: typeof taxProfileSelect }> | null) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    rfc: record.rfc,
    legalName: record.legalName,
    personType: record.personType,
    fiscalRegime: record.fiscalRegime,
    fiscalZipCode: record.fiscalZipCode,
    fiscalAddress: record.fiscalAddress,
    fiscalEmail: record.fiscalEmail,
    phone: record.phone,
    commercialName: record.commercialName,
    completenessState: record.completenessState,
    storageNotice: record.storageNotice,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function getTaxProfile(session: SessionUser) {
  const companyId = getCompanyId(session);
  const profile = await prisma.companyTaxProfile.findUnique({
    where: { companyId },
    select: taxProfileSelect
  });

  return mapTaxProfile(profile);
}

export async function upsertTaxProfile(session: SessionUser, input: TaxProfileInput) {
  const companyId = getCompanyId(session);
  assertCanWriteTaxProfile(session);

  const completenessState = resolveCompleteness(input);
  const storageNotice =
    "La carga segura de CSF requiere storage privado configurado. Por ahora puedes guardar los datos fiscales manualmente.";

  const profile = await prisma.companyTaxProfile.upsert({
    where: { companyId },
    create: {
      companyId,
      ...input,
      rfc: input.rfc?.toUpperCase(),
      completenessState,
      storageNotice
    },
    update: {
      ...input,
      rfc: input.rfc?.toUpperCase(),
      completenessState,
      storageNotice
    },
    select: taxProfileSelect
  });

  await prisma.activityLog.create({
    data: {
      companyId,
      userId: session.userId,
      type: ActivityLogType.SYSTEM,
      title: "Datos fiscales actualizados",
      description: "El perfil fiscal de la empresa emisora fue actualizado para cotizaciones y facturacion futura.",
      routePath: "/workspace/tax-profile",
      metadata: {
        taxProfileId: profile.id,
        completenessState
      }
    }
  });

  return mapTaxProfile(profile);
}

