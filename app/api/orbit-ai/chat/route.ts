import { NextResponse } from "next/server";

import { EXECUTIVE_WORKSPACE_ROLES, assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { clearOrbitAiHistory, getOrbitAiHistory, runOrbitAi } from "@/lib/services/orbit-ai/chat";
import { orbitAiChatSchema } from "@/lib/validation/orbit-ai";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, EXECUTIVE_WORKSPACE_ROLES);

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId") ?? undefined;
    const routePath = url.searchParams.get("routePath") ?? undefined;
    const history = await getOrbitAiHistory(session, {
      conversationId,
      routePath
    });

    return NextResponse.json({
      message: "Historial de MAIA Executive Agent listo.",
      data: history
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, EXECUTIVE_WORKSPACE_ROLES);

    const body = await request.json();
    const input = orbitAiChatSchema.parse(body);
    const reply = await runOrbitAi(session, input);

    return NextResponse.json({
      message: "MAIA Executive Agent respondio correctamente.",
      data: reply
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, EXECUTIVE_WORKSPACE_ROLES);

    const result = await clearOrbitAiHistory(session);

    return NextResponse.json({
      message: "Historial de MAIA eliminado.",
      data: result
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
