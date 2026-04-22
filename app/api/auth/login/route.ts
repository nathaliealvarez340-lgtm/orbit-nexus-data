import { NextResponse } from "next/server";

import { authCookie } from "@/lib/auth/cookies";
import { getRequestMetadata } from "@/lib/auth/request-metadata";
import { createErrorResponse } from "@/lib/http";
import { signSessionToken } from "@/lib/jwt";
import { loginUser } from "@/lib/services/auth/login-user";
import { loginPayloadSchema } from "@/lib/validation/auth-payloads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginPayloadSchema.parse(body);
    const metadata = getRequestMetadata(request);
    const user = await loginUser({
      ...input,
      ...metadata
    });

    const token = await signSessionToken({
      userId: user.id,
      tenantId: user.companyId,
      companyId: user.companyId,
      role: user.role,
      accessCode: user.accessCode,
      fullName: user.fullName
    });

    const response = NextResponse.json({
      message: "Inicio de sesion exitoso.",
      data: user
    });

    response.cookies.set(authCookie.name, token, authCookie.options);

    return response;
  } catch (error) {
    return createErrorResponse(error);
  }
}
