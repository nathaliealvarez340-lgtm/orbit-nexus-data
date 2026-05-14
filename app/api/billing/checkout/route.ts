import { NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/http";
import { resolveRequestOrigin } from "@/lib/network/request-origin";
import { assertRateLimit } from "@/lib/rate-limit";
import { startCompanyActivation } from "@/lib/services/commercial/company-activation";
import { companyActivationPayloadSchema } from "@/lib/validation/commercial";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, {
      key: "billing:checkout",
      limit: 12,
      windowMs: 60_000
    });

    const body = await request.json();
    const input = companyActivationPayloadSchema.parse(body);
    const result = await startCompanyActivation(input, {
      requestOrigin: resolveRequestOrigin(request)
    });

    return NextResponse.json({
      message:
        result.mode === "checkout"
          ? "Checkout generado correctamente."
          : "Solicitud enterprise registrada correctamente.",
      data: result
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
