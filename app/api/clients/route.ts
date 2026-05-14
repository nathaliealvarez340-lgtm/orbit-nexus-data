import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { createWorkspaceClient, getWorkspaceClients } from "@/lib/services/finance/clients";
import { workspaceClientSchema } from "@/lib/validation/workspace-clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    const url = new URL(request.url);
    const clients = await getWorkspaceClients(session, url.searchParams.get("q") ?? undefined);

    return NextResponse.json({
      message: "Empresas y clientes listos.",
      data: clients
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

    const input = workspaceClientSchema.parse(await request.json());
    const client = await createWorkspaceClient(session, input);

    return NextResponse.json(
      {
        message: "Empresa cliente creada.",
        data: client
      },
      { status: 201 }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

