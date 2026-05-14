import { NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/http";
import { assertRateLimit } from "@/lib/rate-limit";
import { resetPassword } from "@/lib/services/auth/reset-password";
import { resetPasswordPayloadSchema } from "@/lib/validation/auth-payloads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, {
      key: "auth:reset-password",
      limit: 6,
      windowMs: 60_000
    });

    const body = await request.json();
    const input = resetPasswordPayloadSchema.parse(body);

    await resetPassword({
      accessCode: input.accessCode,
      email: input.email,
      newPassword: input.newPassword
    });

    return NextResponse.json({
      success: true,
      message: "La contrasena se actualizo correctamente."
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
