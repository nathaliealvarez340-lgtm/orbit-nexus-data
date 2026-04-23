import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { registerUser } from "@/lib/services/auth/register-user";
import { ServiceError } from "@/lib/services/service-error";
import { registerPayloadSchema } from "@/lib/validation/auth-payloads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerPayloadSchema.parse(body);
    const registration = await registerUser(input);

    return NextResponse.json({
      success: true,
      code: registration.accessCode
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message: "El body de la solicitud no es un JSON valido."
        },
        { status: 400 }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message ?? "Datos de registro invalidos."
        },
        { status: 400 }
      );
    }

    if (error instanceof ServiceError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message
        },
        { status: error.statusCode }
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrio un error interno al registrar el usuario."
      },
      { status: 500 }
    );
  }
}
