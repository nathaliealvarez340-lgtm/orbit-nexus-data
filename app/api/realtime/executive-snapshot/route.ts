import { NextResponse } from "next/server";

import { EXECUTIVE_WORKSPACE_ROLES, assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { getExecutiveRealtimeSnapshot } from "@/lib/services/realtime/executive-updates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, EXECUTIVE_WORKSPACE_ROLES);

    const snapshot = await getExecutiveRealtimeSnapshot(session);

    return NextResponse.json(
      {
        message: "Sincronizacion ejecutiva lista.",
        data: snapshot
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
