"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

import { LeaderNotifications } from "@/components/dashboard/leader-notifications";
import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { useWorkspaceProjects } from "@/components/dashboard/workspace-projects-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getLeaderDashboardMock,
  getLeaderDashboardSearchItems,
  type DashboardSearchItem
} from "@/lib/dashboard/mock-data";
import {
  calculateQuoteResult,
  QUOTE_CLIENT_TYPE_LABELS,
  QUOTE_COMPLEXITY_LABELS,
  QUOTE_STATUS_LABELS,
  QUOTE_URGENCY_LABELS,
  type QuoteClientType,
  type QuoteComplexity,
  type QuoteDraftInput,
  type QuoteLineItemInput,
  type QuoteStatus,
  type QuoteUrgency
} from "@/lib/quotes/quote-engine";
import {
  createCatalogItemRecord,
  createClientRecord,
  createEmptyQuoteDraft,
  createEmptyQuoteLine,
  createQuoteRecord,
  createSeedQuotesWorkspace,
  duplicateQuoteRecord,
  QUOTE_CLIENT_TYPE_OPTIONS,
  QUOTE_COMPLEXITY_OPTIONS,
  QUOTE_STATUS_FILTERS,
  QUOTE_URGENCY_OPTIONS,
  updateQuoteRecord,
  type LeaderQuotesWorkspaceState,
  type QuoteCatalogItem,
  type QuoteRecord,
  type QuoteStatusFilter
} from "@/lib/quotes/mock-data";
import type { SessionUser } from "@/types/auth";

type LeaderQuotesViewProps = {
  session: SessionUser;
};

type QuoteClientFormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  sector: string;
  clientType: QuoteClientType;
};

type QuoteCatalogFormState = {
  name: string;
  category: string;
  description: string;
  unitLabel: string;
  basePrice: string;
  taxPercent: string;
};

const STORAGE_QUOTES_KEY = "orbit-nexus-workspace-quotes";

const initialClientForm: QuoteClientFormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  sector: "",
  clientType: "NEW"
};

const initialCatalogForm: QuoteCatalogFormState = {
  name: "",
  category: "",
  description: "",
  unitLabel: "servicio",
  basePrice: "",
  taxPercent: "16"
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsedDate);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getScopedStorageKey(baseKey: string, companyId: string | null) {
  return `${baseKey}:${companyId ?? "public"}`;
}

function buildQuoteSearchItems(quotes: QuoteRecord[]): DashboardSearchItem[] {
  return quotes.map((quote) => ({
    id: `quote-${quote.id}`,
    type: "action",
    title: quote.quoteNumber,
    subtitle: `${quote.companyName} | ${QUOTE_STATUS_LABELS[quote.status]}`,
    href: "/workspace/quotes",
    keywords: [
      quote.quoteNumber,
      quote.clientName,
      quote.companyName,
      QUOTE_STATUS_LABELS[quote.status]
    ]
  }));
}

function createDraftFromQuote(quote: QuoteRecord): QuoteDraftInput {
  return {
    clientId: quote.clientId ?? null,
    clientName: quote.clientName,
    clientEmail: quote.clientEmail,
    companyName: quote.companyName,
    validUntil: quote.validUntil,
    commercialTerms: quote.commercialTerms,
    clientType: quote.clientType,
    complexity: quote.complexity,
    urgency: quote.urgency,
    lineItems: quote.lineItems.map((line) => ({
      ...line
    }))
  };
}

function buildPrintableQuoteHtml(quote: QuoteRecord) {
  const linesHtml = quote.lineItems
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.name)}</td>
          <td>${line.quantity}</td>
          <td>${formatCurrency(line.basePrice)}</td>
          <td>${line.discountPercent}%</td>
          <td>${line.surchargePercent}%</td>
          <td>${formatCurrency(line.quantity * line.basePrice)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(quote.quoteNumber)} | Orbit Nexus</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 40px; color: #0f172a; }
          h1, h2, h3, p { margin: 0; }
          .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
          .brand { font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: #0ea5e9; font-weight: 700; }
          .hero { margin-top: 12px; }
          .hero h1 { font-size: 28px; margin-bottom: 8px; }
          .meta, .terms { margin-top: 24px; padding: 18px; border-radius: 18px; background: #f8fafc; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 10px; text-align: left; font-size: 14px; }
          th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; }
          .totals { margin-top: 24px; margin-left: auto; width: min(100%, 340px); }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .totals-row.total { font-size: 18px; font-weight: 700; color: #0f172a; }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #e0f2fe; color: #075985; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Orbit Nexus</div>
            <div class="hero">
              <h1>Cotizacion operativa</h1>
              <p>${escapeHtml(quote.quoteNumber)} | ${escapeHtml(QUOTE_STATUS_LABELS[quote.status])}</p>
            </div>
          </div>
          <div>
            <span class="badge">Emitida ${escapeHtml(formatDate(quote.createdAt))}</span>
          </div>
        </div>

        <div class="meta">
          <p><strong>Cliente:</strong> ${escapeHtml(quote.clientName)}</p>
          <p><strong>Empresa:</strong> ${escapeHtml(quote.companyName)}</p>
          <p><strong>Correo:</strong> ${escapeHtml(quote.clientEmail)}</p>
          <p><strong>Vigencia:</strong> ${escapeHtml(formatDate(quote.validUntil))}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Partida</th>
              <th>Cantidad</th>
              <th>Base</th>
              <th>Descuento</th>
              <th>Recargo</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>${linesHtml}</tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(quote.calculation.totals.subtotal)}</span></div>
          <div class="totals-row"><span>Descuentos</span><span>${formatCurrency(quote.calculation.totals.discountAmount)}</span></div>
          <div class="totals-row"><span>Recargos</span><span>${formatCurrency(quote.calculation.totals.surchargeAmount)}</span></div>
          <div class="totals-row"><span>Impuestos</span><span>${formatCurrency(quote.calculation.totals.taxAmount)}</span></div>
          <div class="totals-row total"><span>Total</span><span>${formatCurrency(quote.calculation.totals.total)}</span></div>
        </div>

        <div class="terms">
          <h3>Condiciones comerciales</h3>
          <p style="margin-top: 10px; line-height: 1.7">${escapeHtml(quote.commercialTerms)}</p>
        </div>
      </body>
    </html>
  `;
}

export function LeaderQuotesView({ session }: LeaderQuotesViewProps) {
  const tenantId = session.tenantId ?? session.companyId ?? null;
  const { projects } = useWorkspaceProjects();
  const leaderData = useMemo(() => getLeaderDashboardMock(session, projects), [projects, session]);
  const baseSearchItems = useMemo(() => getLeaderDashboardSearchItems(leaderData), [leaderData]);
  const [workspaceState, setWorkspaceState] = useState<LeaderQuotesWorkspaceState>(() =>
    createSeedQuotesWorkspace(tenantId)
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>("ALL");
  const [quoteForm, setQuoteForm] = useState<QuoteDraftInput>(() =>
    createEmptyQuoteDraft(createSeedQuotesWorkspace(tenantId).settings)
  );
  const [quoteEditorMode, setQuoteEditorMode] = useState<"create" | "edit">("create");
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [catalogForm, setCatalogForm] = useState(initialCatalogForm);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [quoteNotice, setQuoteNotice] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = getScopedStorageKey(STORAGE_QUOTES_KEY, tenantId);

    try {
      const storedState = window.localStorage.getItem(storageKey);

      if (storedState) {
        setWorkspaceState(JSON.parse(storedState) as LeaderQuotesWorkspaceState);
      } else {
        setWorkspaceState(createSeedQuotesWorkspace(tenantId));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
      setWorkspaceState(createSeedQuotesWorkspace(tenantId));
    } finally {
      setIsHydrated(true);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      getScopedStorageKey(STORAGE_QUOTES_KEY, tenantId),
      JSON.stringify(workspaceState)
    );
  }, [isHydrated, tenantId, workspaceState]);

  useEffect(() => {
    if (selectedQuoteId) {
      return;
    }

    setSelectedQuoteId(workspaceState.quotes[0]?.id ?? null);
  }, [selectedQuoteId, workspaceState.quotes]);

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return workspaceState.quotes.filter((quote) => {
      const matchesStatus = statusFilter === "ALL" || quote.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        quote.quoteNumber.toLowerCase().includes(normalizedSearch) ||
        quote.clientName.toLowerCase().includes(normalizedSearch) ||
        quote.companyName.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, workspaceState.quotes]);

  const selectedQuote =
    workspaceState.quotes.find((quote) => quote.id === selectedQuoteId) ??
    filteredQuotes[0] ??
    workspaceState.quotes[0] ??
    null;
  const quoteCalculation = useMemo(
    () => calculateQuoteResult(quoteForm, workspaceState.settings),
    [quoteForm, workspaceState.settings]
  );
  const searchItems = useMemo(
    () => [...baseSearchItems, ...buildQuoteSearchItems(workspaceState.quotes)],
    [baseSearchItems, workspaceState.quotes]
  );
  const quotesRequiringApproval = workspaceState.quotes.filter(
    (quote) => quote.status === "REQUIRES_APPROVAL"
  );
  const acceptedQuotes = workspaceState.quotes.filter((quote) => quote.status === "ACCEPTED");
  const totalPipelineMxn = workspaceState.quotes.reduce(
    (total, quote) => total + quote.calculation.totals.total,
    0
  );

  function resetQuoteEditor() {
    setQuoteForm(createEmptyQuoteDraft(workspaceState.settings));
    setQuoteEditorMode("create");
    setEditingQuoteId(null);
    setQuoteError(null);
    setQuoteNotice(null);
  }

  function syncClientIntoDraft(clientId: string) {
    const client = workspaceState.clients.find((item) => item.id === clientId);

    if (!client) {
      return;
    }

    setQuoteForm((current) => ({
      ...current,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      companyName: client.company,
      clientType: client.clientType
    }));
  }

  function loadQuoteIntoEditor(quote: QuoteRecord) {
    setQuoteForm(createDraftFromQuote(quote));
    setQuoteEditorMode("edit");
    setEditingQuoteId(quote.id);
    setSelectedQuoteId(quote.id);
    setQuoteError(null);
    setQuoteNotice(`Editando ${quote.quoteNumber}.`);
  }

  function updateLineItem(
    lineId: string,
    field: keyof QuoteLineItemInput,
    value: string | number | null
  ) {
    setQuoteForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((line) =>
        line.id === lineId
          ? {
              ...line,
              [field]:
                field === "name" || field === "description"
                  ? String(value ?? "")
                  : field === "catalogItemId"
                    ? (value as string | null)
                    : Number(value ?? 0)
            }
          : line
      )
    }));
  }

  function addBlankLine() {
    setQuoteForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, createEmptyQuoteLine(workspaceState.settings.defaultTaxPercent)]
    }));
  }

  function addCatalogLine(item: QuoteCatalogItem) {
    setQuoteForm((current) => ({
      ...current,
      lineItems: [
        ...current.lineItems,
        {
          ...createEmptyQuoteLine(item.taxPercent),
          catalogItemId: item.id,
          name: item.name,
          description: item.description,
          quantity: 1,
          basePrice: item.basePrice,
          taxPercent: item.taxPercent
        }
      ]
    }));
    setQuoteNotice(`Se agrego ${item.name} a la cotizacion.`);
  }

  function removeLine(lineId: string) {
    setQuoteForm((current) => ({
      ...current,
      lineItems:
        current.lineItems.length > 1
          ? current.lineItems.filter((line) => line.id !== lineId)
          : current.lineItems
    }));
  }

  function persistQuote(
    nextStatus: QuoteStatus,
    historyLabel: string,
    historyDetail: string
  ): QuoteRecord {
    let nextRecord: QuoteRecord | null = null;

    setWorkspaceState((current) => {
      if (quoteEditorMode === "edit" && editingQuoteId) {
        const existing = current.quotes.find((quote) => quote.id === editingQuoteId);

        if (!existing) {
          return current;
        }

        const updatedRecord = updateQuoteRecord({
          existing,
          draft: quoteForm,
          settings: current.settings,
          actorName: session.fullName,
          status: nextStatus,
          historyLabel,
          historyDetail
        });
        nextRecord = updatedRecord;

        return {
          ...current,
          quotes: current.quotes.map((quote) => (quote.id === editingQuoteId ? updatedRecord : quote))
        };
      }

      const createdRecord = createQuoteRecord({
        tenantId,
        ownerName: session.fullName,
        status: nextStatus,
        draft: quoteForm,
        settings: current.settings,
        existingQuotes: current.quotes
      });
      nextRecord = createdRecord;

      return {
        ...current,
        quotes: [createdRecord, ...current.quotes]
      };
    });

    if (!nextRecord) {
      throw new Error("No fue posible persistir la cotizacion actual.");
    }

    const persistedRecord = nextRecord as QuoteRecord;

    setSelectedQuoteId(persistedRecord.id);
    setEditingQuoteId(persistedRecord.id);
    setQuoteEditorMode("edit");
    return persistedRecord;
  }

  function saveDraft() {
    const nextRecord = persistQuote(
      "DRAFT",
      "Borrador actualizado",
      "La cotizacion se guardo como borrador para continuar despues."
    );

    setQuoteNotice(`${nextRecord.quoteNumber} se guardo como borrador.`);
    setQuoteError(null);
  }

  function sendQuote() {
    const blockingIssue = quoteCalculation.issues.find((issue) => issue.level === "error");

    if (blockingIssue) {
      setQuoteError(blockingIssue.message);
      setQuoteNotice(null);
      return;
    }

    if (quoteCalculation.totals.requiresApproval) {
      const nextRecord = persistQuote(
        "REQUIRES_APPROVAL",
        "Requiere aprobacion",
        "La rentabilidad quedo debajo del margen minimo y se marco para revision."
      );

      setQuoteError(
        "La cotizacion quedo debajo del margen minimo. Se marco como Requiere aprobacion."
      );
      setQuoteNotice(`Se actualizo ${nextRecord.quoteNumber} para revision interna.`);
      return;
    }

    const nextRecord = persistQuote(
      "SENT",
      "Cotizacion enviada",
      "La cotizacion se preparo como enviada desde el workspace Leader."
    );

    setQuoteNotice(`${nextRecord.quoteNumber} quedo lista como enviada.`);
    setQuoteError(null);
  }

  function duplicateQuote(quote: QuoteRecord) {
    const nextRecord = duplicateQuoteRecord({
      existing: quote,
      actorName: session.fullName,
      existingQuotes: workspaceState.quotes,
      settings: workspaceState.settings
    });

    setWorkspaceState((current) => ({
      ...current,
      quotes: [nextRecord, ...current.quotes]
    }));
    setSelectedQuoteId(nextRecord.id);
    loadQuoteIntoEditor(nextRecord);
    setQuoteNotice(`Se creo una copia nueva desde ${quote.quoteNumber}.`);
  }

  function changeQuoteStatus(quote: QuoteRecord, status: QuoteStatus) {
    setWorkspaceState((current) => ({
      ...current,
      quotes: current.quotes.map((currentQuote) =>
        currentQuote.id === quote.id
          ? updateQuoteRecord({
              existing: currentQuote,
              draft: createDraftFromQuote(currentQuote),
              settings: current.settings,
              actorName: session.fullName,
              status,
              historyLabel: "Cambio de estado",
              historyDetail: `La cotizacion paso a ${QUOTE_STATUS_LABELS[status]}.`
            })
          : currentQuote
      )
    }));
    setQuoteNotice(`${quote.quoteNumber} ahora esta en ${QUOTE_STATUS_LABELS[status]}.`);
  }

  function saveClient() {
    if (!clientForm.name.trim() || !clientForm.company.trim() || !clientForm.email.trim()) {
      setClientError("Completa nombre, empresa y correo del cliente.");
      return;
    }

    const nextClient = createClientRecord({
      tenantId,
      name: clientForm.name,
      company: clientForm.company,
      email: clientForm.email,
      phone: clientForm.phone,
      sector: clientForm.sector,
      clientType: clientForm.clientType
    });

    setWorkspaceState((current) => ({
      ...current,
      clients: [nextClient, ...current.clients]
    }));
    setClientForm(initialClientForm);
    setClientError(null);
    setQuoteNotice(`Se agrego el cliente ${nextClient.name}.`);
  }

  function saveCatalogItem() {
    const basePrice = Number(catalogForm.basePrice);
    const taxPercent = Number(catalogForm.taxPercent);

    if (!catalogForm.name.trim() || !catalogForm.category.trim() || !catalogForm.unitLabel.trim()) {
      setCatalogError("Completa nombre, categoria y unidad del servicio.");
      return;
    }

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setCatalogError("Define un precio base valido para el item.");
      return;
    }

    if (!Number.isFinite(taxPercent) || taxPercent < 0) {
      setCatalogError("Define un porcentaje de impuesto valido.");
      return;
    }

    const nextItem = createCatalogItemRecord({
      tenantId,
      name: catalogForm.name,
      category: catalogForm.category,
      description: catalogForm.description,
      unitLabel: catalogForm.unitLabel,
      basePrice,
      taxPercent
    });

    setWorkspaceState((current) => ({
      ...current,
      catalog: [nextItem, ...current.catalog]
    }));
    setCatalogForm(initialCatalogForm);
    setCatalogError(null);
    setQuoteNotice(`Se agrego ${nextItem.name} al catalogo.`);
  }

  function openPrintPreview(quote: QuoteRecord) {
    const previewWindow = window.open("", "_blank", "noopener,noreferrer,width=1080,height=900");

    if (!previewWindow) {
      setQuoteError("No fue posible abrir la vista imprimible. Revisa si tu navegador bloqueo la ventana.");
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(buildPrintableQuoteHtml(quote));
    previewWindow.document.close();
    previewWindow.focus();
  }

  if (session.role !== "LEADER") {
    return (
      <OperationsShell
        session={session}
        portalLabel={session.role}
        portalTitle="Cotizaciones"
        subtitle="Esta seccion pertenece al workspace comercial de liderazgo. Tu sesion sigue protegida sin exponer funciones fuera de tu rol."
        navItems={[{ label: "Volver al workspace", href: "/workspace", active: true }]}
        primaryActions={[{ label: "Ir al dashboard", href: "/workspace" }]}
        searchItems={searchItems}
      >
        <OperationsPanel
          description="La ruta queda protegida para que solo el rol LEADER use el modulo de cotizaciones."
          eyebrow="Acceso restringido"
          title="Sin permisos para cotizaciones"
        >
          <Button asChild>
            <Link href="/workspace">Volver al dashboard</Link>
          </Button>
        </OperationsPanel>
      </OperationsShell>
    );
  }

  return (
    <OperationsShell
      session={session}
      portalLabel="LEADER"
      portalTitle="Cotizaciones"
      subtitle="Configura propuestas comerciales con lectura financiera clara, control de margen y trazabilidad sin salir del workspace ejecutivo."
      navItems={[
        { label: "Resumen", href: "/workspace" },
        { label: "Cotizaciones", href: "/workspace/quotes", active: true, badge: String(workspaceState.quotes.length) },
        { label: "Clientes", href: "#quote-clients", badge: String(workspaceState.clients.length) },
        { label: "Catalogo", href: "#quote-catalog", badge: String(workspaceState.catalog.length) }
      ]}
      primaryActions={[
        { label: "Volver al dashboard", href: "/workspace" },
        { label: "Nueva cotizacion", href: "/workspace/quotes" }
      ]}
      headerActions={<LeaderNotifications notifications={leaderData.notifications} />}
      searchItems={searchItems}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Cotizaciones activas",
              value: String(workspaceState.quotes.length),
              detail: "Borradores, enviadas y propuestas en seguimiento."
            },
            {
              label: "Requieren aprobacion",
              value: String(quotesRequiringApproval.length),
              detail: "Propuestas con margen menor al minimo configurado."
            },
            {
              label: "Aceptadas",
              value: String(acceptedQuotes.length),
              detail: "Cotizaciones cerradas con confirmacion comercial."
            },
            {
              label: "Pipeline estimado",
              value: formatCurrency(totalPipelineMxn),
              detail: "Total visible considerando todas las cotizaciones registradas."
            }
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-[1.55rem] border border-white/10 bg-white/[0.04] px-5 py-5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <OperationsPanel
            description="Pipeline visible con filtros, busqueda y acciones para duplicar, retomar borradores o revisar estados comerciales."
            eyebrow="Seguimiento"
            title="Vista principal de cotizaciones"
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
                  <Input
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                    placeholder="Buscar por numero, cliente o empresa..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <select
                    className="h-11 rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as QuoteStatusFilter)}
                  >
                    {QUOTE_STATUS_FILTERS.map((status) => (
                      <option key={status} value={status}>
                        {status === "ALL" ? "Todos los estados" : QUOTE_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                <Button className="rounded-2xl" type="button" onClick={resetQuoteEditor}>
                  Nueva cotizacion
                </Button>
              </div>

              {filteredQuotes.length ? (
                <div className="space-y-3">
                  {filteredQuotes.map((quote) => (
                    <article
                      key={quote.id}
                      className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] px-4 py-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                              {quote.quoteNumber}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                              {QUOTE_STATUS_LABELS[quote.status]}
                            </span>
                            {quote.calculation.totals.requiresApproval ? (
                              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                                Margen bajo
                              </span>
                            ) : null}
                          </div>

                          <div>
                            <button
                              className="text-left text-lg font-semibold text-white transition-colors hover:text-cyan-200"
                              type="button"
                              onClick={() => setSelectedQuoteId(quote.id)}
                            >
                              {quote.companyName}
                            </button>
                            <p className="text-sm text-slate-400">
                              {quote.clientName} | Vigencia {formatDate(quote.validUntil)}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Total
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
                              {formatCurrency(quote.calculation.totals.total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Margen
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
                              {quote.calculation.totals.estimatedMarginPercent}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Actualizacion
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
                              {formatDate(quote.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          className="rounded-2xl"
                          size="sm"
                          type="button"
                          onClick={() => setSelectedQuoteId(quote.id)}
                        >
                          Ver historial
                        </Button>
                        <Button
                          className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                          size="sm"
                          type="button"
                          variant="secondary"
                          onClick={() => loadQuoteIntoEditor(quote)}
                        >
                          {quote.status === "DRAFT" || quote.status === "REQUIRES_APPROVAL"
                            ? "Editar borrador"
                            : "Usar como base"}
                        </Button>
                        <Button
                          className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                          size="sm"
                          type="button"
                          variant="secondary"
                          onClick={() => duplicateQuote(quote)}
                        >
                          Duplicar
                        </Button>
                        <Button
                          className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                          size="sm"
                          type="button"
                          variant="secondary"
                          onClick={() => openPrintPreview(quote)}
                        >
                          Vista imprimible
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] px-5 py-6 text-sm leading-6 text-slate-400">
                  No hay cotizaciones que coincidan con tu busqueda o filtro actual.
                </div>
              )}
            </div>
          </OperationsPanel>

          <OperationsPanel
            description="Construye la propuesta con control financiero, reglas de rentabilidad y validaciones antes de enviarla."
            eyebrow="Constructor"
            title={quoteEditorMode === "edit" ? "Editar cotizacion" : "Nueva cotizacion"}
          >
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-200" htmlFor="quote-client">
                    Cliente
                  </Label>
                  <select
                    id="quote-client"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                    value={quoteForm.clientId ?? ""}
                    onChange={(event) => syncClientIntoDraft(event.target.value)}
                  >
                    <option value="">Selecciona un cliente registrado</option>
                    {workspaceState.clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company} | {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="quote-client-name">
                    Nombre del cliente
                  </Label>
                  <Input
                    id="quote-client-name"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                    value={quoteForm.clientName}
                    onChange={(event) =>
                      setQuoteForm((current) => ({ ...current, clientName: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="quote-client-email">
                    Correo del cliente
                  </Label>
                  <Input
                    id="quote-client-email"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                    value={quoteForm.clientEmail}
                    onChange={(event) =>
                      setQuoteForm((current) => ({ ...current, clientEmail: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="quote-company-name">
                    Empresa
                  </Label>
                  <Input
                    id="quote-company-name"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                    value={quoteForm.companyName}
                    onChange={(event) =>
                      setQuoteForm((current) => ({ ...current, companyName: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="quote-valid-until">
                    Vigencia
                  </Label>
                  <Input
                    id="quote-valid-until"
                    type="date"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                    value={quoteForm.validUntil}
                    onChange={(event) =>
                      setQuoteForm((current) => ({ ...current, validUntil: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="quote-client-type">
                    Tipo de cliente
                  </Label>
                  <select
                    id="quote-client-type"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                    value={quoteForm.clientType}
                    onChange={(event) =>
                      setQuoteForm((current) => ({
                        ...current,
                        clientType: event.target.value as QuoteClientType
                      }))
                    }
                  >
                    {QUOTE_CLIENT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {QUOTE_CLIENT_TYPE_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="quote-complexity">
                    Complejidad
                  </Label>
                  <select
                    id="quote-complexity"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                    value={quoteForm.complexity}
                    onChange={(event) =>
                      setQuoteForm((current) => ({
                        ...current,
                        complexity: event.target.value as QuoteComplexity
                      }))
                    }
                  >
                    {QUOTE_COMPLEXITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {QUOTE_COMPLEXITY_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="quote-urgency">
                    Urgencia
                  </Label>
                  <select
                    id="quote-urgency"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                    value={quoteForm.urgency}
                    onChange={(event) =>
                      setQuoteForm((current) => ({
                        ...current,
                        urgency: event.target.value as QuoteUrgency
                      }))
                    }
                  >
                    {QUOTE_URGENCY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {QUOTE_URGENCY_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Partidas</p>
                    <p className="text-sm text-slate-400">
                      Calcula subtotal, descuentos, recargos e impuestos en tiempo real.
                    </p>
                  </div>
                  <Button
                    className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                    size="sm"
                    type="button"
                    variant="secondary"
                    onClick={addBlankLine}
                  >
                    Agregar partida
                  </Button>
                </div>

                <div className="space-y-3">
                  {quoteForm.lineItems.map((line) => (
                    <article
                      key={line.id}
                      className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                          placeholder="Servicio o producto"
                          value={line.name}
                          onChange={(event) => updateLineItem(line.id, "name", event.target.value)}
                        />
                        <Input
                          className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                          placeholder="Descripcion breve"
                          value={line.description ?? ""}
                          onChange={(event) =>
                            updateLineItem(line.id, "description", event.target.value)
                          }
                        />
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-5">
                        {[
                          {
                            label: "Cantidad",
                            value: line.quantity,
                            field: "quantity"
                          },
                          {
                            label: "Precio base",
                            value: line.basePrice,
                            field: "basePrice"
                          },
                          {
                            label: "Descuento %",
                            value: line.discountPercent,
                            field: "discountPercent"
                          },
                          {
                            label: "Recargo %",
                            value: line.surchargePercent,
                            field: "surchargePercent"
                          },
                          {
                            label: "Impuestos %",
                            value: line.taxPercent,
                            field: "taxPercent"
                          }
                        ].map((field) => (
                          <div key={`${line.id}-${field.field}`} className="space-y-2">
                            <Label className="text-slate-300">{field.label}</Label>
                            <Input
                              type="number"
                              className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                              value={field.value}
                              onChange={(event) =>
                                updateLineItem(line.id, field.field as keyof QuoteLineItemInput, Number(event.target.value))
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-400">
                          Subtotal visual:{" "}
                          <span className="font-semibold text-white">
                            {formatCurrency(line.quantity * line.basePrice)}
                          </span>
                        </p>
                        <Button
                          className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                          size="sm"
                          type="button"
                          variant="secondary"
                          onClick={() => removeLine(line.id)}
                        >
                          Quitar
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="quote-terms">
                  Condiciones comerciales
                </Label>
                <textarea
                  id="quote-terms"
                  className="min-h-[120px] w-full rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                  value={quoteForm.commercialTerms}
                  onChange={(event) =>
                    setQuoteForm((current) => ({
                      ...current,
                      commercialTerms: event.target.value
                    }))
                  }
                />
              </div>

              <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Subtotal
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(quoteCalculation.totals.subtotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Descuentos
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(quoteCalculation.totals.discountAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Recargos
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(quoteCalculation.totals.surchargeAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Impuestos
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(quoteCalculation.totals.taxAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Margen estimado
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {quoteCalculation.totals.estimatedMarginPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Utilidad estimada
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(quoteCalculation.totals.estimatedProfit)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Total final
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatCurrency(quoteCalculation.totals.total)}
                  </p>
                </div>
              </div>

              {quoteCalculation.issues.length ? (
                <div className="space-y-2 rounded-[1.35rem] border border-amber-400/20 bg-amber-500/8 px-4 py-4 text-sm text-amber-100">
                  {quoteCalculation.issues.map((issue) => (
                    <p key={`${issue.field}-${issue.message}`}>- {issue.message}</p>
                  ))}
                </div>
              ) : null}

              {quoteError ? (
                <div className="rounded-[1.35rem] border border-rose-400/20 bg-rose-500/8 px-4 py-4 text-sm text-rose-100">
                  {quoteError}
                </div>
              ) : null}

              {quoteNotice ? (
                <div className="rounded-[1.35rem] border border-cyan-400/20 bg-cyan-500/8 px-4 py-4 text-sm text-cyan-100">
                  {quoteNotice}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button className="rounded-2xl" type="button" onClick={saveDraft}>
                  Guardar borrador
                </Button>
                <Button
                  className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                  type="button"
                  variant="secondary"
                  onClick={sendQuote}
                >
                  {quoteCalculation.totals.requiresApproval ? "Marcar para aprobacion" : "Enviar cotizacion"}
                </Button>
                <Button
                  className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                  type="button"
                  variant="secondary"
                  onClick={resetQuoteEditor}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </OperationsPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <OperationsPanel
            className="h-full"
            description="Registra clientes comerciales y reutilizalos para futuras propuestas sin duplicar captura."
            eyebrow="CRM ligero"
            title="Clientes"
          >
            <div id="quote-clients" className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Nombre", "name"],
                  ["Empresa", "company"],
                  ["Correo", "email"],
                  ["Telefono", "phone"],
                  ["Sector", "sector"]
                ].map(([label, field]) => (
                  <div key={field} className="space-y-2">
                    <Label className="text-slate-200">{label}</Label>
                    <Input
                      className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                      value={clientForm[field as keyof QuoteClientFormState] as string}
                      onChange={(event) =>
                        setClientForm((current) => ({
                          ...current,
                          [field]: event.target.value
                        }))
                      }
                    />
                  </div>
                ))}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-200">Tipo de cliente</Label>
                  <select
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                    value={clientForm.clientType}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        clientType: event.target.value as QuoteClientType
                      }))
                    }
                  >
                    {QUOTE_CLIENT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {QUOTE_CLIENT_TYPE_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {clientError ? (
                <div className="rounded-[1.35rem] border border-rose-400/20 bg-rose-500/8 px-4 py-4 text-sm text-rose-100">
                  {clientError}
                </div>
              ) : null}

              <Button className="rounded-2xl" type="button" onClick={saveClient}>
                Crear cliente
              </Button>

              <div className="space-y-3 border-t border-white/10 pt-5">
                {workspaceState.clients.map((client) => (
                  <article
                    key={client.id}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{client.company}</p>
                        <p className="text-sm text-slate-400">
                          {client.name} | {client.email}
                        </p>
                      </div>
                      <Button
                        className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                        size="sm"
                        type="button"
                        variant="secondary"
                        onClick={() => syncClientIntoDraft(client.id)}
                      >
                        Usar
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </OperationsPanel>

          <OperationsPanel
            className="h-full"
            description="Arma un catalogo reutilizable de productos o servicios para acelerar nuevas cotizaciones y cuidar consistencia de precios."
            eyebrow="Catalogo"
            title="Productos y servicios"
          >
            <div id="quote-catalog" className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Nombre", "name"],
                  ["Categoria", "category"],
                  ["Unidad", "unitLabel"],
                  ["Precio base", "basePrice"],
                  ["Impuestos %", "taxPercent"]
                ].map(([label, field]) => (
                  <div key={field} className="space-y-2">
                    <Label className="text-slate-200">{label}</Label>
                    <Input
                      className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                      value={catalogForm[field as keyof QuoteCatalogFormState]}
                      onChange={(event) =>
                        setCatalogForm((current) => ({
                          ...current,
                          [field]: event.target.value
                        }))
                      }
                    />
                  </div>
                ))}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-200">Descripcion</Label>
                  <textarea
                    className="min-h-[110px] w-full rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                    value={catalogForm.description}
                    onChange={(event) =>
                      setCatalogForm((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                  />
                </div>
              </div>

              {catalogError ? (
                <div className="rounded-[1.35rem] border border-rose-400/20 bg-rose-500/8 px-4 py-4 text-sm text-rose-100">
                  {catalogError}
                </div>
              ) : null}

              <Button className="rounded-2xl" type="button" onClick={saveCatalogItem}>
                Crear item de catalogo
              </Button>

              <div className="space-y-3 border-t border-white/10 pt-5">
                {workspaceState.catalog.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-slate-400">{item.category}</p>
                        <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {formatCurrency(item.basePrice)}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          por {item.unitLabel}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                        size="sm"
                        type="button"
                        variant="secondary"
                        onClick={() => addCatalogLine(item)}
                      >
                        Agregar a cotizacion
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </OperationsPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <OperationsPanel
            className="h-full"
            description="Historial, estados y seguimiento para no perder trazabilidad de cada propuesta."
            eyebrow="Control"
            title="Historial y acciones"
          >
            {selectedQuote ? (
              <div className="space-y-5">
                <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedQuote.quoteNumber}</p>
                      <p className="text-sm text-slate-400">
                        {selectedQuote.companyName} | {selectedQuote.clientName}
                      </p>
                    </div>
                    <select
                      className="h-10 rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                      value={selectedQuote.status}
                      onChange={(event) =>
                        changeQuoteStatus(selectedQuote, event.target.value as QuoteStatus)
                      }
                    >
                      {QUOTE_STATUS_FILTERS.filter((status) => status !== "ALL").map((status) => (
                        <option key={status} value={status}>
                          {QUOTE_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Total final
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatCurrency(selectedQuote.calculation.totals.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Margen estimado
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {selectedQuote.calculation.totals.estimatedMarginPercent}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button className="rounded-2xl" type="button" onClick={() => loadQuoteIntoEditor(selectedQuote)}>
                      Editar
                    </Button>
                    <Button
                      className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                      type="button"
                      variant="secondary"
                      onClick={() => duplicateQuote(selectedQuote)}
                    >
                      Duplicar
                    </Button>
                    <Button
                      className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                      type="button"
                      variant="secondary"
                      onClick={() => openPrintPreview(selectedQuote)}
                    >
                      Vista imprimible
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedQuote.history.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{entry.action}</p>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{entry.detail}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-cyan-300">
                        {entry.actorName}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-6 text-slate-400">
                Selecciona una cotizacion para revisar historial y acciones disponibles.
              </div>
            )}
          </OperationsPanel>

          <OperationsPanel
            className="h-full"
            description="Version ejecutiva lista para compartir internamente o abrir en una ventana imprimible sin dependencias extra."
            eyebrow="Preview"
            title="Vista imprimible"
          >
            {selectedQuote ? (
              <div className="space-y-5">
                <div className="rounded-[1.55rem] border border-white/10 bg-slate-950/90 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
                        Orbit Nexus
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-white">
                        {selectedQuote.quoteNumber}
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">
                        {selectedQuote.companyName} | {selectedQuote.clientName}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      {QUOTE_STATUS_LABELS[selectedQuote.status]}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Fecha de emision
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {formatDate(selectedQuote.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Vigencia
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {formatDate(selectedQuote.validUntil)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {selectedQuote.lineItems.map((line) => (
                      <div
                        key={line.id}
                        className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{line.name}</p>
                            <p className="text-sm text-slate-400">{line.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">
                              {formatCurrency(line.basePrice)}
                            </p>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                              x {line.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center justify-between gap-3">
                        <span>Subtotal</span>
                        <span>{formatCurrency(selectedQuote.calculation.totals.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Descuentos</span>
                        <span>{formatCurrency(selectedQuote.calculation.totals.discountAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Recargos</span>
                        <span>{formatCurrency(selectedQuote.calculation.totals.surchargeAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Impuestos</span>
                        <span>{formatCurrency(selectedQuote.calculation.totals.taxAmount)}</span>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between gap-3 text-lg font-semibold text-white">
                        <span>Total</span>
                        <span>{formatCurrency(selectedQuote.calculation.totals.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-slate-300">
                    {selectedQuote.commercialTerms}
                  </div>

                  <div className="mt-5">
                    <Button className="rounded-2xl" type="button" onClick={() => openPrintPreview(selectedQuote)}>
                      Abrir vista imprimible
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-6 text-slate-400">
                Selecciona una cotizacion para preparar una version imprimible.
              </div>
            )}
          </OperationsPanel>
        </section>
      </div>
    </OperationsShell>
  );
}
