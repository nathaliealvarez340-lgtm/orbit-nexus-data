import { NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/http";
import { getActivationStatusBySessionId } from "@/lib/services/commercial/company-activation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { message: "Debes indicar el session_id del checkout." },
        { status: 400 }
      );
    }

    const status = await getActivationStatusBySessionId(sessionId);

    return NextResponse.json({
      data: status
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
