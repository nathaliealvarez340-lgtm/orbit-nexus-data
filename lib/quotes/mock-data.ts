import {
  calculateQuoteResult,
  createDefaultQuotePricingSettings,
  type QuoteCalculationResult,
  type QuoteClientType,
  type QuoteComplexity,
  type QuoteDraftInput,
  type QuoteLineItemInput,
  type QuotePricingSettings,
  type QuoteStatus,
  type QuoteUrgency
} from "@/lib/quotes/quote-engine";

export type QuoteClientRecord = {
  id: string;
  tenantId: string | null;
  name: string;
  company: string;
  email: string;
  phone: string;
  sector: string;
  clientType: QuoteClientType;
  createdAt: string;
};

export type QuoteCatalogItem = {
  id: string;
  tenantId: string | null;
  name: string;
  category: string;
  description: string;
  unitLabel: string;
  basePrice: number;
  taxPercent: number;
  createdAt: string;
};

export type QuoteHistoryEntry = {
  id: string;
  action: string;
  detail: string;
  actorName: string;
  createdAt: string;
};

export type QuoteRecord = QuoteDraftInput & {
  id: string;
  tenantId: string | null;
  quoteNumber: string;
  status: QuoteStatus;
  calculation: QuoteCalculationResult;
  ownerName: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
  history: QuoteHistoryEntry[];
};

export type LeaderQuotesWorkspaceState = {
  settings: QuotePricingSettings;
  clients: QuoteClientRecord[];
  catalog: QuoteCatalogItem[];
  quotes: QuoteRecord[];
};

export const QUOTE_STATUS_FILTERS = [
  "ALL",
  "DRAFT",
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "REQUIRES_APPROVAL"
] as const;

export type QuoteStatusFilter = (typeof QUOTE_STATUS_FILTERS)[number];

export const QUOTE_CLIENT_TYPE_OPTIONS: QuoteClientType[] = [
  "NEW",
  "RECURRING",
  "STRATEGIC"
];

export const QUOTE_COMPLEXITY_OPTIONS: QuoteComplexity[] = [
  "LOW",
  "MEDIUM",
  "HIGH"
];

export const QUOTE_URGENCY_OPTIONS: QuoteUrgency[] = [
  "STANDARD",
  "PRIORITY",
  "CRITICAL"
];

function createWorkspaceId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function createHistoryEntry(action: string, detail: string, actorName: string): QuoteHistoryEntry {
  return {
    id: createWorkspaceId("quote-history"),
    action,
    detail,
    actorName,
    createdAt: new Date().toISOString()
  };
}

export function createQuoteNumber(quotes: QuoteRecord[], date = new Date()) {
  const year = date.getFullYear();
  const yearPrefix = `ONX-Q-${year}-`;
  const sameYearQuotes = quotes.filter((quote) => quote.quoteNumber.startsWith(yearPrefix));
  const nextSequence = sameYearQuotes.length + 1;
  return `${yearPrefix}${String(nextSequence).padStart(4, "0")}`;
}

export function createQuoteRecord(params: {
  tenantId: string | null;
  ownerName: string;
  status: QuoteStatus;
  draft: QuoteDraftInput;
  settings: QuotePricingSettings;
  existingQuotes: QuoteRecord[];
  historyEntry?: QuoteHistoryEntry;
}) {
  const createdAt = new Date().toISOString();
  const quoteNumber = createQuoteNumber(params.existingQuotes, new Date(createdAt));
  const record: QuoteRecord = {
    id: createWorkspaceId("quote"),
    tenantId: params.tenantId,
    quoteNumber,
    status: params.status,
    ownerName: params.ownerName,
    shareToken: createWorkspaceId("share"),
    createdAt,
    updatedAt: createdAt,
    clientId: params.draft.clientId ?? null,
    clientName: params.draft.clientName.trim(),
    clientEmail: params.draft.clientEmail.trim().toLowerCase(),
    companyName: params.draft.companyName.trim(),
    validUntil: params.draft.validUntil,
    commercialTerms: params.draft.commercialTerms.trim(),
    clientType: params.draft.clientType,
    complexity: params.draft.complexity,
    urgency: params.draft.urgency,
    lineItems: params.draft.lineItems.map((line) => ({
      ...line,
      name: line.name.trim(),
      description: line.description?.trim() || ""
    })),
    calculation: calculateQuoteResult(params.draft, params.settings),
    history: [
      params.historyEntry ??
        createHistoryEntry(
          "Creacion",
          params.status === "DRAFT"
            ? "Cotizacion guardada como borrador."
            : "Cotizacion generada desde el workspace comercial.",
          params.ownerName
        )
    ]
  };

  return record;
}

export function updateQuoteRecord(params: {
  existing: QuoteRecord;
  draft: QuoteDraftInput;
  settings: QuotePricingSettings;
  actorName: string;
  status?: QuoteStatus;
  historyLabel: string;
  historyDetail: string;
}) {
  return {
    ...params.existing,
    status: params.status ?? params.existing.status,
    clientId: params.draft.clientId ?? null,
    clientName: params.draft.clientName.trim(),
    clientEmail: params.draft.clientEmail.trim().toLowerCase(),
    companyName: params.draft.companyName.trim(),
    validUntil: params.draft.validUntil,
    commercialTerms: params.draft.commercialTerms.trim(),
    clientType: params.draft.clientType,
    complexity: params.draft.complexity,
    urgency: params.draft.urgency,
    lineItems: params.draft.lineItems.map((line) => ({
      ...line,
      name: line.name.trim(),
      description: line.description?.trim() || ""
    })),
    calculation: calculateQuoteResult(params.draft, params.settings),
    updatedAt: new Date().toISOString(),
    history: [
      createHistoryEntry(params.historyLabel, params.historyDetail, params.actorName),
      ...params.existing.history
    ]
  } satisfies QuoteRecord;
}

export function duplicateQuoteRecord(params: {
  existing: QuoteRecord;
  actorName: string;
  existingQuotes: QuoteRecord[];
  settings: QuotePricingSettings;
}) {
  return createQuoteRecord({
    tenantId: params.existing.tenantId,
    ownerName: params.actorName,
    status: "DRAFT",
    draft: {
      clientId: params.existing.clientId,
      clientName: params.existing.clientName,
      clientEmail: params.existing.clientEmail,
      companyName: params.existing.companyName,
      validUntil: params.existing.validUntil,
      commercialTerms: params.existing.commercialTerms,
      clientType: params.existing.clientType,
      complexity: params.existing.complexity,
      urgency: params.existing.urgency,
      lineItems: params.existing.lineItems.map((line) => ({
        ...line,
        id: createWorkspaceId("quote-line")
      }))
    },
    settings: params.settings,
    existingQuotes: params.existingQuotes,
    historyEntry: createHistoryEntry(
      "Duplicacion",
      `Copia creada desde ${params.existing.quoteNumber}.`,
      params.actorName
    )
  });
}

export function createClientRecord(params: {
  tenantId: string | null;
  name: string;
  company: string;
  email: string;
  phone: string;
  sector: string;
  clientType: QuoteClientType;
}) {
  return {
    id: createWorkspaceId("quote-client"),
    tenantId: params.tenantId,
    name: params.name.trim(),
    company: params.company.trim(),
    email: params.email.trim().toLowerCase(),
    phone: params.phone.trim(),
    sector: params.sector.trim(),
    clientType: params.clientType,
    createdAt: new Date().toISOString()
  } satisfies QuoteClientRecord;
}

export function createCatalogItemRecord(params: {
  tenantId: string | null;
  name: string;
  category: string;
  description: string;
  unitLabel: string;
  basePrice: number;
  taxPercent: number;
}) {
  return {
    id: createWorkspaceId("quote-catalog"),
    tenantId: params.tenantId,
    name: params.name.trim(),
    category: params.category.trim(),
    description: params.description.trim(),
    unitLabel: params.unitLabel.trim(),
    basePrice: params.basePrice,
    taxPercent: params.taxPercent,
    createdAt: new Date().toISOString()
  } satisfies QuoteCatalogItem;
}

export function createEmptyQuoteLine(
  fallbackTaxPercent = createDefaultQuotePricingSettings().defaultTaxPercent
): QuoteLineItemInput {
  return {
    id: createWorkspaceId("quote-line"),
    catalogItemId: null,
    name: "",
    description: "",
    quantity: 1,
    basePrice: 0,
    discountPercent: 0,
    surchargePercent: 0,
    taxPercent: fallbackTaxPercent
  };
}

export function createEmptyQuoteDraft(
  settings = createDefaultQuotePricingSettings()
): QuoteDraftInput {
  return {
    clientId: null,
    clientName: "",
    clientEmail: "",
    companyName: "",
    validUntil: addDays(new Date(), settings.defaultValidityDays),
    commercialTerms:
      "La cotizacion considera ejecucion operativa, seguimiento ejecutivo y entregables conforme a las condiciones acordadas.",
    clientType: "NEW",
    complexity: "MEDIUM",
    urgency: "STANDARD",
    lineItems: [createEmptyQuoteLine(settings.defaultTaxPercent)]
  };
}

export function createSeedQuotesWorkspace(tenantId: string | null): LeaderQuotesWorkspaceState {
  const settings = createDefaultQuotePricingSettings();
  const clients: QuoteClientRecord[] = [
    createClientRecord({
      tenantId,
      name: "Mariana Torres",
      company: "Grupo Solaris",
      email: "mariana.torres@solaris.mx",
      phone: "+52 55 5102 8831",
      sector: "Operacion regional",
      clientType: "STRATEGIC"
    }),
    createClientRecord({
      tenantId,
      name: "Jose Ignacio Vega",
      company: "Atlas Partners",
      email: "jvega@atlaspartners.mx",
      phone: "+52 81 2244 1130",
      sector: "Revenue operations",
      clientType: "RECURRING"
    }),
    createClientRecord({
      tenantId,
      name: "Daniela Rojas",
      company: "Nova Holding",
      email: "drojas@novaholding.com",
      phone: "+52 33 1988 4107",
      sector: "Transformacion digital",
      clientType: "NEW"
    })
  ];

  const catalog: QuoteCatalogItem[] = [
    createCatalogItemRecord({
      tenantId,
      name: "Diagnostico operativo ejecutivo",
      category: "Operacion",
      description: "Levantamiento, lectura de riesgos y plan de accion ejecutivo.",
      unitLabel: "frente",
      basePrice: 18500,
      taxPercent: 16
    }),
    createCatalogItemRecord({
      tenantId,
      name: "PMO y seguimiento semanal",
      category: "Productividad",
      description: "Gobernanza, control de entregables y seguimiento con liderazgo.",
      unitLabel: "semana",
      basePrice: 9200,
      taxPercent: 16
    }),
    createCatalogItemRecord({
      tenantId,
      name: "Implementacion de trazabilidad KPI",
      category: "Operacion",
      description: "Configuracion de lectura KPI, tableros y estructura de evidencias.",
      unitLabel: "implementacion",
      basePrice: 24500,
      taxPercent: 16
    }),
    createCatalogItemRecord({
      tenantId,
      name: "Celula de reasignacion critica",
      category: "Riesgo",
      description: "Intervencion premium para frentes en riesgo alto o bloqueo operativo.",
      unitLabel: "bloque",
      basePrice: 13800,
      taxPercent: 16
    })
  ];

  const quotes: QuoteRecord[] = [];

  quotes.push(
    createQuoteRecord({
      tenantId,
      ownerName: "Orbit Nexus",
      status: "SENT",
      settings,
      existingQuotes: quotes,
      draft: {
        clientId: clients[0].id,
        clientName: clients[0].name,
        clientEmail: clients[0].email,
        companyName: clients[0].company,
        validUntil: addDays(new Date(), 12),
        commercialTerms:
          "Incluye sesiones ejecutivas semanales, soporte operativo y evidencia de avances.",
        clientType: clients[0].clientType,
        complexity: "HIGH",
        urgency: "PRIORITY",
        lineItems: [
          {
            ...createEmptyQuoteLine(settings.defaultTaxPercent),
            catalogItemId: catalog[0].id,
            name: catalog[0].name,
            description: catalog[0].description,
            quantity: 1,
            basePrice: catalog[0].basePrice,
            discountPercent: 0,
            surchargePercent: 6,
            taxPercent: catalog[0].taxPercent
          },
          {
            ...createEmptyQuoteLine(settings.defaultTaxPercent),
            catalogItemId: catalog[1].id,
            name: catalog[1].name,
            description: catalog[1].description,
            quantity: 4,
            basePrice: catalog[1].basePrice,
            discountPercent: 5,
            surchargePercent: 0,
            taxPercent: catalog[1].taxPercent
          }
        ]
      }
    })
  );

  quotes.push(
    createQuoteRecord({
      tenantId,
      ownerName: "Orbit Nexus",
      status: "REQUIRES_APPROVAL",
      settings,
      existingQuotes: quotes,
      draft: {
        clientId: clients[1].id,
        clientName: clients[1].name,
        clientEmail: clients[1].email,
        companyName: clients[1].company,
        validUntil: addDays(new Date(), 8),
        commercialTerms:
          "Contempla acompanamiento diario, respuesta prioritaria y lectura premium de riesgos.",
        clientType: clients[1].clientType,
        complexity: "HIGH",
        urgency: "CRITICAL",
        lineItems: [
          {
            ...createEmptyQuoteLine(settings.defaultTaxPercent),
            catalogItemId: catalog[3].id,
            name: catalog[3].name,
            description: catalog[3].description,
            quantity: 2,
            basePrice: catalog[3].basePrice,
            discountPercent: 12,
            surchargePercent: 4,
            taxPercent: catalog[3].taxPercent
          }
        ]
      }
    })
  );

  quotes.push(
    createQuoteRecord({
      tenantId,
      ownerName: "Orbit Nexus",
      status: "ACCEPTED",
      settings,
      existingQuotes: quotes,
      draft: {
        clientId: clients[2].id,
        clientName: clients[2].name,
        clientEmail: clients[2].email,
        companyName: clients[2].company,
        validUntil: addDays(new Date(), 18),
        commercialTerms:
          "Incluye implementacion, acompanamiento y tablero ejecutivo para cierre de visibilidad.",
        clientType: clients[2].clientType,
        complexity: "MEDIUM",
        urgency: "STANDARD",
        lineItems: [
          {
            ...createEmptyQuoteLine(settings.defaultTaxPercent),
            catalogItemId: catalog[2].id,
            name: catalog[2].name,
            description: catalog[2].description,
            quantity: 1,
            basePrice: catalog[2].basePrice,
            discountPercent: 0,
            surchargePercent: 3,
            taxPercent: catalog[2].taxPercent
          }
        ]
      }
    })
  );

  return {
    settings,
    clients,
    catalog,
    quotes
  };
}
