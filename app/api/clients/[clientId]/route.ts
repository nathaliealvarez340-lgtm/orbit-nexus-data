import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { updateWorkspaceClient } from "@/lib/services/finance/clients";
import { workspaceClientSchema } from "@/lib/validation/workspace-clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    const { clientId } = await params;
    const input = workspaceClientSchema.parse(await request.json());
    const client = await updateWorkspaceClient(session, clientId, input);

    return NextResponse.json({
      message: "Empresa cliente actualizada.",
      data: client
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

