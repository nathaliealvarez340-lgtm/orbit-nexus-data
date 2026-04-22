import { NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/http";
import { resetPassword } from "@/lib/services/auth/reset-password";
import { resetPasswordPayloadSchema } from "@/lib/validation/auth-payloads";

export async function POST(request: Request) {
  try {
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
