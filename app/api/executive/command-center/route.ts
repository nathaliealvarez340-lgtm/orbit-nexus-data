import { NextResponse } from "next/server";

import { EXECUTIVE_WORKSPACE_ROLES, assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { getExecutiveCommandCenterData } from "@/lib/services/executive/command-center";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, EXECUTIVE_WORKSPACE_ROLES);

    const data = await getExecutiveCommandCenterData(session);

    return NextResponse.json({
      message: "Executive Command Center listo.",
      data
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
