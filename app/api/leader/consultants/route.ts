import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import {
  createAuthorizedConsultant,
  listLeaderConsultants
} from "@/lib/services/leader/manage-consultants";
import { createConsultantAuthorizationSchema } from "@/lib/validation/auth-payloads";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["LEADER"]);

    const consultants = await listLeaderConsultants(session.companyId);

    return NextResponse.json({
      data: consultants
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

    assertRole(session, ["LEADER"]);

    const body = await request.json();
    const input = createConsultantAuthorizationSchema.parse(body);
    const consultant = await createAuthorizedConsultant({
      leaderId: session.userId,
      companyId: session.companyId,
      ...input
    });

    return NextResponse.json({
      message: "Consultor autorizado correctamente.",
      data: consultant
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

