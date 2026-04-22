import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ServiceError } from "@/lib/services/service-error";

export function createErrorResponse(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { message: "El body de la solicitud no es un JSON valido." },
      { status: 400 }
    );
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: error.issues[0]?.message ?? "La solicitud no es valida." },
      { status: 400 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { message: "Ocurrio un error interno. Intenta nuevamente." },
    { status: 500 }
  );
}
