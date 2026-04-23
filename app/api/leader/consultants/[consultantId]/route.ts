import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { removeLeaderConsultant } from "@/lib/services/leader/manage-consultants";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    consultantId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["LEADER"]);

    const { consultantId } = await context.params;
    const result = await removeLeaderConsultant({
      leaderCompanyId: session.companyId,
      consultantId
    });

    return NextResponse.json({
      message:
        result.strategy === "hard-delete"
          ? "Consultor pendiente eliminado correctamente."
          : "Consultor activo deshabilitado correctamente.",
      data: result
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

