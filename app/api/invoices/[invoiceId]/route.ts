import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { updateInvoiceStatus } from "@/lib/services/finance/invoices";
import { invoiceStatusUpdateSchema } from "@/lib/validation/invoices";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    const { invoiceId } = await context.params;
    const body = await request.json();
    const input = invoiceStatusUpdateSchema.parse(body);
    const invoice = await updateInvoiceStatus({
      session,
      invoiceId,
      status: input.status,
      failureReason: input.failureReason
    });

    return NextResponse.json({
      message: "Factura actualizada correctamente.",
      data: invoice
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
