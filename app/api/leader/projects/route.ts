import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { createLeaderProject } from "@/lib/services/leader/create-project";
import { createProjectPayloadSchema } from "@/lib/validation/auth-payloads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["LEADER"]);

    const body = await request.json();
    const input = createProjectPayloadSchema.parse(body);
    const project = await createLeaderProject({
      leaderId: session.userId,
      companyId: session.companyId,
      ...input
    });

    return NextResponse.json({
      message: "Proyecto creado correctamente.",
      data: project
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

