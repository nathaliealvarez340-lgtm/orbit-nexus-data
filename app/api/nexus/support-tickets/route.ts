import { NextResponse } from "next/server";
import { SupportTicketPriority, SupportTicketSource } from "@prisma/client";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { createSupportTicket } from "@/lib/services/nexus/support-tickets";
import { supportTicketCreateSchema } from "@/lib/validation/operations";

export const runtime = "nodejs";

function inferPriority(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("pago") || normalized.includes("stripe") || normalized.includes("error")) {
    return SupportTicketPriority.HIGH;
  }

  if (normalized.includes("no puedo") || normalized.includes("no veo") || normalized.includes("fallo")) {
    return SupportTicketPriority.MEDIUM;
  }

  return SupportTicketPriority.LOW;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["SUPERADMIN", "LEADER", "CONSULTANT", "CLIENT"]);

    const body = await request.json();
    const input = supportTicketCreateSchema.parse(body);
    const ticket = await createSupportTicket({
      companyId: session.companyId ?? session.tenantId,
      userId: session.userId,
      userRole: session.role,
      userName: session.fullName,
      title: input.title,
      message: input.message,
      contextLabel: input.contextLabel,
      routePath: input.routePath,
      assistantReply: input.assistantReply,
      priority: input.priority ?? inferPriority(input.message),
      source: input.source ?? SupportTicketSource.NEXUS_CHAT
    });

    return NextResponse.json({
      message: "Reporte registrado correctamente.",
      data: ticket
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
