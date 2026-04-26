import { NextResponse } from "next/server";

import { getMxnUsdExchangeRate } from "@/lib/currency/exchange-rate";
import { createErrorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rate = await getMxnUsdExchangeRate();

    return NextResponse.json(rate, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
