import "server-only";

import { ActivityLogType, type Prisma } from "@prisma/client";

import {
  CLIENTS_WORKSPACE_ROLES,
  assertRole,
  canAccessClientsModule
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import type { WorkspaceClientInput } from "@/lib/validation/workspace-clients";
import type { SessionUser } from "@/types/auth";

const CLIENT_WRITE_ROLES = ["OWNER", "ADMIN", "FINANCE", "MANAGER"] as const;

const clientSelect = {
  id: true,
  name: true,
  company: true,
  email: true,
  phone: true,
  sector: true,
  legalName: true,
  commercialName: true,
  rfc: true,
  personType: true,
  fiscalRegime: true,
  cfdiUse: true,
  fiscalZipCode: true,
  fiscalAddress: true,
  additionalEmails: true,
  primaryContact: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      quotes: true
    }
  }
} satisfies Prisma.QuoteClientSelect;

function getCompanyId(session: SessionUser) {
  assertRole(session, CLIENTS_WORKSPACE_ROLES);

  const companyId = session.companyId ?? session.tenantId;

  if (!companyId) {
    throw new ServiceError("Tu sesion no tiene organizacion asociada.", 403);
  }

  return companyId;
}

function assertCanWriteClients(session: SessionUser) {
  if (!canAccessClientsModule(session.role) || !CLIENT_WRITE_ROLES.includes(session.role as (typeof CLIENT_WRITE_ROLES)[number])) {
    throw new ServiceError("No tienes permisos para modificar empresas o clientes.", 403);
  }
}

function mapClient(record: Prisma.QuoteClientGetPayload<{ select: typeof clientSelect }>) {
  return {
    id: record.id,
    legalName: record.legalName ?? record.company,
    commercialName: record.commercialName ?? record.company,
    rfc: record.rfc,
    personType: record.personType,
    fiscalRegime: record.fiscalRegime,
    cfdiUse: record.cfdiUse,
    fiscalZipCode: record.fiscalZipCode,
    fiscalAddress: record.fiscalAddress,
    email: record.email,
    additionalEmails: record.additionalEmails,
    phone: record.phone,
    primaryContact: record.primaryContact ?? record.name,
    sector: record.sector,
    notes: record.notes,
    quotesCount: record._count.quotes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function buildClientData(input: WorkspaceClientInput) {
  const displayName = input.primaryContact ?? input.commercialName ?? input.legalName;
  const companyName = input.commercialName ?? input.legalName;

  return {
    name: displayName,
    company: companyName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    sector: input.sector,
    legalName: input.legalName,
    commercialName: input.commercialName ?? companyName,
    rfc: input.rfc?.toUpperCase(),
    personType: input.personType,
    fiscalRegime: input.fiscalRegime,
    cfdiUse: input.cfdiUse,
    fiscalZipCode: input.fiscalZipCode,
    fiscalAddress: input.fiscalAddress,
    additionalEmails: input.additionalEmails.map((email) => email.toLowerCase()),
    primaryContact: input.primaryContact,
    notes: input.notes
  };
}

export async function getWorkspaceClients(session: SessionUser, query?: string) {
  const companyId = getCompanyId(session);
  const normalizedQuery = query?.trim();

  const clients = await prisma.quoteClient.findMany({
    where: {
      companyId,
      ...(normalizedQuery
        ? {
            OR: [
              { company: { contains: normalizedQuery, mode: "insensitive" } },
              { legalName: { contains: normalizedQuery, mode: "insensitive" } },
              { commercialName: { contains: normalizedQuery, mode: "insensitive" } },
              { email: { contains: normalizedQuery, mode: "insensitive" } },
              { rfc: { contains: normalizedQuery, mode: "insensitive" } }
            ]
          }
        : {})
    },
    select: clientSelect,
    orderBy: [{ updatedAt: "desc" }]
  });

  return clients.map(mapClient);
}

export async function createWorkspaceClient(session: SessionUser, input: WorkspaceClientInput) {
  const companyId = getCompanyId(session);
  assertCanWriteClients(session);

  const created = await prisma.quoteClient.create({
    data: {
      companyId,
      ...buildClientData(input)
    },
    select: clientSelect
  });

  await prisma.activityLog.create({
    data: {
      companyId,
      userId: session.userId,
      type: ActivityLogType.SYSTEM,
      title: "Empresa cliente creada",
      description: `${created.legalName ?? created.company} se agrego al modulo Empresas / Clientes.`,
      routePath: "/workspace/clients",
      metadata: {
        clientId: created.id,
        rfc: created.rfc ?? null
      }
    }
  });

  return mapClient(created);
}

export async function updateWorkspaceClient(
  session: SessionUser,
  clientId: string,
  input: WorkspaceClientInput
) {
  const companyId = getCompanyId(session);
  assertCanWriteClients(session);

  const updated = await prisma.quoteClient.update({
    where: {
      id: clientId,
      companyId
    },
    data: buildClientData(input),
    select: clientSelect
  });

  await prisma.activityLog.create({
    data: {
      companyId,
      userId: session.userId,
      type: ActivityLogType.SYSTEM,
      title: "Empresa cliente actualizada",
      description: `${updated.legalName ?? updated.company} actualizo sus datos comerciales/fiscales.`,
      routePath: "/workspace/clients",
      metadata: {
        clientId: updated.id,
        rfc: updated.rfc ?? null
      }
    }
  });

  return mapClient(updated);
}
