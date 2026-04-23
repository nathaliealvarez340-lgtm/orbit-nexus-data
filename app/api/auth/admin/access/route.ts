import { NextResponse } from "next/server";

import { authCookie } from "@/lib/auth/cookies";
import { createErrorResponse } from "@/lib/http";
import { signSessionToken } from "@/lib/jwt";
import { accessSuperadmin } from "@/lib/services/admin/access-superadmin";
import { adminAccessPayloadSchema } from "@/lib/validation/auth-payloads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = adminAccessPayloadSchema.parse(body);
    const user = await accessSuperadmin(input);

    const token = await signSessionToken({
      userId: user.id,
      tenantId: null,
      companyId: null,
      role: user.role,
      accessCode: user.accessCode,
      fullName: user.fullName
    });

    const response = NextResponse.json({
      message: "Acceso de administracion concedido.",
      data: user
    });

    response.cookies.set(authCookie.name, token, authCookie.options);

    return response;
  } catch (error) {
    return createErrorResponse(error);
  }
}

