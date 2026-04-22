import { NextResponse } from "next/server";

import { applyProtectedNoStoreHeaders } from "@/lib/auth/cache-control";
import { authCookie } from "@/lib/auth/cookies";

export async function POST() {
  const response = NextResponse.json({
    message: "Sesion cerrada."
  });

  response.cookies.set(authCookie.name, "", {
    ...authCookie.options,
    maxAge: 0,
    expires: new Date(0)
  });

  return applyProtectedNoStoreHeaders(response);
}
