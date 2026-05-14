import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { getInvoiceInternalReceipt } from "@/lib/services/finance/invoices";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    currency: "MXN",
    style: "currency"
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    const { invoiceId } = await context.params;
    const invoice = await getInvoiceInternalReceipt(session, invoiceId);
    const rows = invoice.lineItems
      .map(
        (line) => `
          <tr>
            <td>${escapeHtml(line.description)}</td>
            <td>${line.quantity}</td>
            <td>${formatCurrency(line.unit)}</td>
            <td>${formatCurrency(line.tax)}</td>
            <td>${formatCurrency(line.total)}</td>
          </tr>
        `
      )
      .join("");
    const html = `<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(invoice.invoiceNumber)} | Comprobante interno Orbit Nexus</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 40px; color: #0f172a; }
            .warning { border: 1px solid #f59e0b; background: #fffbeb; color: #92400e; padding: 16px; border-radius: 16px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            .total { font-size: 20px; font-weight: 700; text-align: right; margin-top: 24px; }
          </style>
        </head>
        <body>
          <p style="letter-spacing: .22em; text-transform: uppercase; color: #0891b2; font-weight: 700;">Orbit Nexus</p>
          <h1>Comprobante interno no fiscal</h1>
          <p>${escapeHtml(invoice.invoiceNumber)} | Estado ${escapeHtml(invoice.status)}</p>
          <div class="warning">
            Este documento es un comprobante interno operativo. No es CFDI, no sustituye factura fiscal y no tiene validez fiscal ante el SAT.
          </div>
          <p><strong>Cliente:</strong> ${escapeHtml(invoice.clientName)} | ${escapeHtml(invoice.clientCompany)}</p>
          <p><strong>RFC:</strong> ${escapeHtml(invoice.rfc)}</p>
          <p><strong>Razon social:</strong> ${escapeHtml(invoice.legalName)}</p>
          <table>
            <thead>
              <tr><th>Concepto</th><th>Cantidad</th><th>Unitario</th><th>Impuesto</th><th>Total</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="total">Total interno: ${formatCurrency(invoice.total)}</p>
        </body>
      </html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
