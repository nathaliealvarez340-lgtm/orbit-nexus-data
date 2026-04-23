import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { rotateCompanyRegistrationCode } from "@/lib/services/admin/company-management";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    companyId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["SUPERADMIN"]);

    const { companyId } = await context.params;
    const registrationCode = await rotateCompanyRegistrationCode(companyId);

    return NextResponse.json({
      message: "Codigo maestro actualizado.",
      data: {
        registrationCode
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

