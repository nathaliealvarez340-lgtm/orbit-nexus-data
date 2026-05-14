"use client";

import { useMemo, useState } from "react";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { getInvoiceWorkspace } from "@/lib/services/finance/invoices";
import type { SessionUser } from "@/types/auth";

type InvoiceWorkspaceData = Awaited<ReturnType<typeof getInvoiceWorkspace>>;
type InvoiceRecord = InvoiceWorkspaceData["invoices"][number];
type InvoiceStatus = InvoiceRecord["status"];

type InvoicesViewProps = {
  session: SessionUser;
  initialData: InvoiceWorkspaceData;
};

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Borrador",
  PENDING_CFDI: "Pendiente CFDI",
  ISSUED: "Emitida",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
  FAILED: "Fallida"
};

const statusOptions: InvoiceStatus[] = [
  "DRAFT",
  "PENDING_CFDI",
  "ISSUED",
  "PAID",
  "CANCELLED",
  "FAILED"
];

const initialFiscalForm = {
  rfc: "",
  legalName: "",
  cfdiUse: "G03 - Gastos en general",
  fiscalRegime: "601 - General de Ley Personas Morales",
  fiscalAddress: "",
  paymentMethod: "PUE - Pago en una sola exhibicion",
  paymentForm: "03 - Transferencia electronica",
  currency: "MXN"
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    currency: "MXN",
    style: "currency"
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function buildSearchItems(invoices: InvoiceRecord[]) {
  return invoices.map((invoice) => ({
    id: `invoice-${invoice.id}`,
    type: "action" as const,
    title: invoice.invoiceNumber,
    subtitle: `${invoice.clientCompany} | ${invoiceStatusLabels[invoice.status]}`,
    href: "/workspace/invoices",
    keywords: [invoice.invoiceNumber, invoice.clientCompany, invoice.rfc, invoice.status]
  }));
}

export function InvoicesView({ session, initialData }: InvoicesViewProps) {
  const [invoices, setInvoices] = useState(initialData.invoices);
  const [acceptedQuotes, setAcceptedQuotes] = useState(initialData.acceptedQuotes);
  const [selectedQuoteId, setSelectedQuoteId] = useState(acceptedQuotes[0]?.id ?? "");
  const [fiscalForm, setFiscalForm] = useState(initialFiscalForm);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedQuote = acceptedQuotes.find((quote) => quote.id === selectedQuoteId) ?? null;
  const selectedInvoice =
    invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? invoices[0] ?? null;
  const searchItems = useMemo(() => buildSearchItems(invoices), [invoices]);
  const totals = useMemo(
    () => ({
      draft: invoices.filter((invoice) => invoice.status === "DRAFT").length,
      pendingCfdi: invoices.filter((invoice) => invoice.status === "PENDING_CFDI").length,
      paid: invoices.filter((invoice) => invoice.status === "PAID").length,
      total: invoices.reduce((sum, invoice) => sum + invoice.total, 0)
    }),
    [invoices]
  );

  async function createFromQuote() {
    if (!selectedQuoteId) {
      setError("Selecciona una cotizacion aceptada para preparar la factura interna.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/invoices/from-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          quoteId: selectedQuoteId,
          fiscalData: fiscalForm
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? "No fue posible preparar la factura interna.");
      }

      const invoice = payload.data as InvoiceRecord;
      setInvoices((current) => [invoice, ...current]);
      setAcceptedQuotes((current) => current.filter((quote) => quote.id !== selectedQuoteId));
      setSelectedInvoiceId(invoice.id);
      setSelectedQuoteId("");
      setNotice(`${invoice.invoiceNumber} se preparo como comprobante interno no fiscal.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateStatus(invoiceId: string, status: InvoiceStatus) {
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? "No fue posible actualizar la factura.");
      }

      const invoice = payload.data as InvoiceRecord;
      setInvoices((current) => current.map((item) => (item.id === invoice.id ? invoice : item)));
      setNotice(`${invoice.invoiceNumber} cambio a ${invoiceStatusLabels[invoice.status]}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Error inesperado.");
    }
  }

  return (
    <OperationsShell
      session={session}
      portalLabel="Executive OS"
      portalTitle="Facturas"
      subtitle="Prepara comprobantes internos desde cotizaciones aceptadas y deja lista la integracion futura con CFDI."
      navItems={[
        { label: "Command Center", href: "/workspace" },
        { label: "Cotizaciones", href: "/workspace/quotes" },
        { label: "Facturas", href: "/workspace/invoices", active: true },
        { label: "Orbit AI", href: "/workspace/orbit-ai" }
      ]}
      searchItems={searchItems}
      showHero={false}
      contentClassName="mx-auto w-full max-w-[1480px]"
    >
      <div className="space-y-6">
        <OperationsPanel
          className="border-amber-400/20 bg-amber-500/8"
          description="Este modulo no emite CFDI oficial todavia. Para facturacion fiscal valida se debe conectar un PAC/proveedor externo autorizado."
          eyebrow="Advertencia fiscal"
          title="Comprobante interno no fiscal"
        >
          <p className="text-sm leading-7 text-amber-100">
            Orbit Nexus puede preparar datos, importes y trazabilidad para la factura, pero no simula
            timbrado SAT. La integracion recomendada es con Facturama, SW sapien, Alegra, Bind ERP API
            u otro proveedor CFDI.
          </p>
        </OperationsPanel>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Facturas internas", invoices.length],
            ["Borradores", totals.draft],
            ["Pendientes CFDI", totals.pendingCfdi],
            ["Total operativo", formatCurrency(totals.total)]
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-[1.5rem] border border-white/10 bg-slate-950/82 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.32)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <OperationsPanel
            description="Selecciona una cotizacion aceptada y captura datos fiscales para preparar un comprobante interno."
            eyebrow="Desde cotizacion"
            title="Preparar factura"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-200">Cotizacion aceptada</Label>
                <select
                  className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                  value={selectedQuoteId}
                  onChange={(event) => setSelectedQuoteId(event.target.value)}
                >
                  <option value="">Selecciona una cotizacion</option>
                  {acceptedQuotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.quoteNumber} | {quote.clientCompany} | {formatCurrency(quote.total)}
                    </option>
                  ))}
                </select>
                {selectedQuote ? (
                  <p className="text-sm text-slate-400">
                    {selectedQuote.clientName} | {selectedQuote.clientEmail}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["RFC", "rfc"],
                  ["Razon social", "legalName"],
                  ["Uso CFDI", "cfdiUse"],
                  ["Regimen fiscal", "fiscalRegime"],
                  ["Metodo de pago", "paymentMethod"],
                  ["Forma de pago", "paymentForm"],
                  ["Moneda", "currency"]
                ].map(([label, field]) => (
                  <div key={field} className="space-y-2">
                    <Label className="text-slate-200">{label}</Label>
                    <Input
                      className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                      value={fiscalForm[field as keyof typeof fiscalForm]}
                      onChange={(event) =>
                        setFiscalForm((current) => ({
                          ...current,
                          [field]: event.target.value
                        }))
                      }
                    />
                  </div>
                ))}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-200">Domicilio fiscal</Label>
                  <textarea
                    className="min-h-[96px] w-full rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                    value={fiscalForm.fiscalAddress}
                    onChange={(event) =>
                      setFiscalForm((current) => ({
                        ...current,
                        fiscalAddress: event.target.value
                      }))
                    }
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-[1.35rem] border border-rose-400/20 bg-rose-500/8 px-4 py-4 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}
              {notice ? (
                <div className="rounded-[1.35rem] border border-cyan-400/20 bg-cyan-500/8 px-4 py-4 text-sm text-cyan-100">
                  {notice}
                </div>
              ) : null}

              <Button className="rounded-2xl" disabled={isSubmitting} onClick={createFromQuote}>
                {isSubmitting ? "Preparando..." : "Crear factura interna"}
              </Button>
            </div>
          </OperationsPanel>

          <OperationsPanel
            description="Controla estado, trazabilidad y comprobante interno mientras la conexion CFDI queda pendiente."
            eyebrow="Control financiero"
            title="Facturas"
          >
            <div className="space-y-4">
              {invoices.length ? (
                invoices.map((invoice) => (
                  <article
                    key={invoice.id}
                    className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {invoice.clientCompany} | RFC {invoice.rfc}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {invoice.quoteNumber ? `Desde ${invoice.quoteNumber}` : "Sin cotizacion vinculada"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">{formatCurrency(invoice.total)}</p>
                        <p className="text-xs text-slate-500">Actualizada {formatDate(invoice.updatedAt)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <select
                        className="h-10 rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                        value={invoice.status}
                        onChange={(event) => updateStatus(invoice.id, event.target.value as InvoiceStatus)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {invoiceStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                      <Button asChild className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]" variant="secondary">
                        <a href={`/api/invoices/${invoice.id}/internal-receipt`} target="_blank">
                          Comprobante interno
                        </a>
                      </Button>
                      <button
                        className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                        type="button"
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-6 text-slate-400">
                  Aun no hay facturas internas. Acepta una cotizacion y preparala desde este modulo.
                </div>
              )}
            </div>
          </OperationsPanel>
        </section>

        {selectedInvoice ? (
          <OperationsPanel
            description="Resumen ejecutivo de datos fiscales capturados y totales internos."
            eyebrow="Detalle"
            title={selectedInvoice.invoiceNumber}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Cliente", selectedInvoice.clientName],
                ["Razon social", selectedInvoice.legalName],
                ["RFC", selectedInvoice.rfc],
                ["Uso CFDI", selectedInvoice.cfdiUse],
                ["Regimen", selectedInvoice.fiscalRegime],
                ["Estado", invoiceStatusLabels[selectedInvoice.status]]
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </OperationsPanel>
        ) : null}
      </div>
    </OperationsShell>
  );
}
