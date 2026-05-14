import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { getInvoiceWorkspace } from "@/lib/services/finance/invoices";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    const data = await getInvoiceWorkspace(session);

    return NextResponse.json({
      message: "Modulo de facturas listo.",
      data
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
