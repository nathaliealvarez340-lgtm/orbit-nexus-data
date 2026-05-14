import "server-only";

import { EXECUTIVE_WORKSPACE_ROLES, assertRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import type { SessionUser } from "@/types/auth";

export async function getWorkspaceIntegrations(session: SessionUser) {
  assertRole(session, EXECUTIVE_WORKSPACE_ROLES);

  const companyId = session.companyId ?? session.tenantId;

  if (!companyId) {
    throw new ServiceError("Tu sesion no tiene organizacion asociada.", 403);
  }

  const existing = await prisma.integration.findMany({
    where: { companyId },
    orderBy: [{ updatedAt: "desc" }]
  });

  const byProvider = new Map(existing.map((integration) => [integration.provider, integration]));

  return [
    {
      provider: "gmail",
      name: "Gmail",
      status: byProvider.get("gmail")?.status ?? "DISCONNECTED",
      description: "Detecta correos importantes y preparalos como tareas, alertas o seguimiento.",
      scopes: ["correo.readonly", "perfil.email"],
      lastSyncedAt: byProvider.get("gmail")?.lastSyncedAt?.toISOString() ?? null
    },
    {
      provider: "outlook",
      name: "Outlook / Microsoft 365",
      status: byProvider.get("outlook")?.status ?? "DISCONNECTED",
      description: "Prepara conexion OAuth para mensajes ejecutivos y seguimiento comercial.",
      scopes: ["Mail.Read", "User.Read"],
      lastSyncedAt: byProvider.get("outlook")?.lastSyncedAt?.toISOString() ?? null
    },
    {
      provider: "imap",
      name: "IMAP personalizado",
      status: byProvider.get("imap")?.status ?? "DISCONNECTED",
      description: "Canal futuro para bandejas corporativas con reglas privadas de sincronizacion.",
      scopes: ["lectura controlada"],
      lastSyncedAt: byProvider.get("imap")?.lastSyncedAt?.toISOString() ?? null
    }
  ];
}

