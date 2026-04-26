import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { updateSupportTicketStatus } from "@/lib/services/nexus/support-tickets";
import { supportTicketStatusUpdateSchema } from "@/lib/validation/operations";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["SUPERADMIN"]);

    const { ticketId } = await context.params;
    const body = await request.json();
    const input = supportTicketStatusUpdateSchema.parse(body);
    const ticket = await updateSupportTicketStatus({
      ticketId,
      status: input.status,
      resolvedBy: session.fullName
    });

    return NextResponse.json({
      message: "Reporte actualizado correctamente.",
      data: ticket
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
