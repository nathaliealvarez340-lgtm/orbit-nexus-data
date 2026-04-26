import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { signProjectContract } from "@/lib/services/consultant/project-contracts";
import { contractAcceptanceSchema } from "@/lib/validation/operations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["CONSULTANT"]);

    const body = await request.json();
    const input = contractAcceptanceSchema.parse(body);
    const acceptance = await signProjectContract({
      companyId: session.companyId ?? session.tenantId,
      consultantUserId: session.userId,
      consultantName: session.fullName,
      ...input
    });

    return NextResponse.json({
      message: "Contrato firmado correctamente.",
      data: acceptance
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
