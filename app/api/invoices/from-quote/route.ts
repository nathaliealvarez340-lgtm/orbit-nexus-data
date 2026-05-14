import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { createInvoiceFromQuote } from "@/lib/services/finance/invoices";
import { invoiceCreateFromQuoteSchema } from "@/lib/validation/invoices";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    const body = await request.json();
    const input = invoiceCreateFromQuoteSchema.parse(body);
    const invoice = await createInvoiceFromQuote({
      session,
      quoteId: input.quoteId,
      fiscalData: input.fiscalData
    });

    return NextResponse.json({
      message: "Factura interna preparada correctamente.",
      data: invoice
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
