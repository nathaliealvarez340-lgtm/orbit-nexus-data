import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import {
  createAuthorizedLeader,
  listAuthorizedLeaders
} from "@/lib/services/admin/manage-authorized-leaders";
import { createConsultantAuthorizationSchema } from "@/lib/validation/auth-payloads";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    companyId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["SUPERADMIN"]);

    const { companyId } = await context.params;
    const leaders = await listAuthorizedLeaders(companyId);

    return NextResponse.json({
      data: leaders
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["SUPERADMIN"]);

    const { companyId } = await context.params;
    const body = await request.json();
    const input = createConsultantAuthorizationSchema.parse(body);
    const leader = await createAuthorizedLeader({
      companyId,
      ...input
    });

    return NextResponse.json({
      message: "Lider autorizado correctamente.",
      data: leader
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
