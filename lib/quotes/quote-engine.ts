export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "REQUIRES_APPROVAL";

export type QuoteClientType = "NEW" | "RECURRING" | "STRATEGIC";
export type QuoteComplexity = "LOW" | "MEDIUM" | "HIGH";
export type QuoteUrgency = "STANDARD" | "PRIORITY" | "CRITICAL";

export type QuoteLineItemInput = {
  id: string;
  catalogItemId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  basePrice: number;
  discountPercent: number;
  surchargePercent: number;
  taxPercent: number;
};

export type QuotePricingSettings = {
  minMarginPercent: number;
  maxDiscountPercent: number;
  defaultTaxPercent: number;
  defaultValidityDays: number;
  baseCostRatio: number;
  clientTypeDiscountPercent: Record<QuoteClientType, number>;
  complexitySurchargePercent: Record<QuoteComplexity, number>;
  urgencySurchargePercent: Record<QuoteUrgency, number>;
  complexityCostImpact: Record<QuoteComplexity, number>;
  urgencyCostImpact: Record<QuoteUrgency, number>;
};

export type QuoteDraftInput = {
  clientId?: string | null;
  clientName: string;
  clientEmail: string;
  companyName: string;
  validUntil: string;
  commercialTerms: string;
  clientType: QuoteClientType;
  complexity: QuoteComplexity;
  urgency: QuoteUrgency;
  lineItems: QuoteLineItemInput[];
};

export type QuoteCalculationLine = {
  id: string;
  name: string;
  subtotal: number;
  discountAmount: number;
  surchargeAmount: number;
  adjustedSubtotal: number;
  taxPercent: number;
};

export type QuoteTotals = {
  subtotal: number;
  discountAmount: number;
  surchargeAmount: number;
  taxableBase: number;
  taxAmount: number;
  estimatedMarginPercent: number;
  estimatedProfit: number;
  total: number;
  requiresApproval: boolean;
};

export type QuoteValidationIssue = {
  field: string;
  level: "error" | "warning";
  message: string;
};

export type QuoteCalculationResult = {
  lines: QuoteCalculationLine[];
  totals: QuoteTotals;
  issues: QuoteValidationIssue[];
  canSend: boolean;
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  VIEWED: "Vista",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
  REQUIRES_APPROVAL: "Requiere aprobacion"
};

export const QUOTE_CLIENT_TYPE_LABELS: Record<QuoteClientType, string> = {
  NEW: "Nuevo",
  RECURRING: "Recurrente",
  STRATEGIC: "Estrategico"
};

export const QUOTE_COMPLEXITY_LABELS: Record<QuoteComplexity, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta"
};

export const QUOTE_URGENCY_LABELS: Record<QuoteUrgency, string> = {
  STANDARD: "Normal",
  PRIORITY: "Prioritaria",
  CRITICAL: "Critica"
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function calculateWeightedTaxPercent(lines: QuoteCalculationLine[], fallbackTaxPercent: number) {
  const adjustedSubtotal = lines.reduce((total, line) => total + line.adjustedSubtotal, 0);

  if (!adjustedSubtotal) {
    return fallbackTaxPercent;
  }

  return (
    lines.reduce((total, line) => total + line.adjustedSubtotal * line.taxPercent, 0) /
    adjustedSubtotal
  );
}

export function createDefaultQuotePricingSettings(): QuotePricingSettings {
  return {
    minMarginPercent: 24,
    maxDiscountPercent: 35,
    defaultTaxPercent: 16,
    defaultValidityDays: 15,
    baseCostRatio: 0.58,
    clientTypeDiscountPercent: {
      NEW: 0,
      RECURRING: 3,
      STRATEGIC: 5
    },
    complexitySurchargePercent: {
      LOW: 0,
      MEDIUM: 5,
      HIGH: 11
    },
    urgencySurchargePercent: {
      STANDARD: 0,
      PRIORITY: 6,
      CRITICAL: 12
    },
    complexityCostImpact: {
      LOW: 0,
      MEDIUM: 0.04,
      HIGH: 0.09
    },
    urgencyCostImpact: {
      STANDARD: 0,
      PRIORITY: 0.03,
      CRITICAL: 0.07
    }
  };
}

export function calculateQuoteResult(
  draft: QuoteDraftInput,
  settings: QuotePricingSettings
): QuoteCalculationResult {
  const issues: QuoteValidationIssue[] = [];
  const validUntil = draft.validUntil ? new Date(draft.validUntil) : null;

  if (!draft.clientName.trim()) {
    issues.push({
      field: "clientName",
      level: "error",
      message: "Agrega el nombre del cliente antes de guardar la cotizacion."
    });
  }

  if (!draft.companyName.trim()) {
    issues.push({
      field: "companyName",
      level: "error",
      message: "Agrega la empresa asociada a la cotizacion."
    });
  }

  if (!draft.clientEmail.trim() || !isValidEmail(draft.clientEmail)) {
    issues.push({
      field: "clientEmail",
      level: "error",
      message: "Ingresa un correo valido para el cliente."
    });
  }

  if (!draft.commercialTerms.trim()) {
    issues.push({
      field: "commercialTerms",
      level: "error",
      message: "Define condiciones comerciales antes de continuar."
    });
  }

  if (!validUntil || Number.isNaN(validUntil.getTime())) {
    issues.push({
      field: "validUntil",
      level: "error",
      message: "Define una vigencia valida para la cotizacion."
    });
  }

  if (!draft.lineItems.length) {
    issues.push({
      field: "lineItems",
      level: "error",
      message: "Agrega al menos una partida a la cotizacion."
    });
  }

  const lines = draft.lineItems.map((line) => {
    const quantity = Number.isFinite(line.quantity) ? line.quantity : 0;
    const basePrice = Number.isFinite(line.basePrice) ? line.basePrice : 0;
    const discountPercent = clampPercent(line.discountPercent);
    const surchargePercent = clampPercent(line.surchargePercent);
    const taxPercent = clampPercent(line.taxPercent || settings.defaultTaxPercent);
    const subtotal = roundCurrency(quantity * basePrice);
    const discountAmount = roundCurrency(subtotal * (discountPercent / 100));
    const surchargeAmount = roundCurrency(subtotal * (surchargePercent / 100));
    const adjustedSubtotal = roundCurrency(subtotal - discountAmount + surchargeAmount);

    if (!line.name.trim()) {
      issues.push({
        field: `lineItems.${line.id}.name`,
        level: "error",
        message: "Cada partida debe tener nombre."
      });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      issues.push({
        field: `lineItems.${line.id}.quantity`,
        level: "error",
        message: "La cantidad debe ser mayor que cero."
      });
    }

    if (!Number.isFinite(basePrice) || basePrice < 0) {
      issues.push({
        field: `lineItems.${line.id}.basePrice`,
        level: "error",
        message: "El precio base no puede ser negativo."
      });
    }

    if (discountPercent > settings.maxDiscountPercent) {
      issues.push({
        field: `lineItems.${line.id}.discountPercent`,
        level: "error",
        message: `El descuento supera el limite permitido de ${settings.maxDiscountPercent}%.`
      });
    }

    if (surchargePercent > 55) {
      issues.push({
        field: `lineItems.${line.id}.surchargePercent`,
        level: "error",
        message: "El recargo capturado es excesivo para una cotizacion estandar."
      });
    }

    return {
      id: line.id,
      name: line.name.trim(),
      subtotal,
      discountAmount,
      surchargeAmount,
      adjustedSubtotal,
      taxPercent
    };
  });

  const subtotal = roundCurrency(lines.reduce((total, line) => total + line.subtotal, 0));
  const lineDiscountAmount = roundCurrency(
    lines.reduce((total, line) => total + line.discountAmount, 0)
  );
  const lineSurchargeAmount = roundCurrency(
    lines.reduce((total, line) => total + line.surchargeAmount, 0)
  );
  const adjustedSubtotal = roundCurrency(subtotal - lineDiscountAmount + lineSurchargeAmount);
  const clientTypeDiscountAmount = roundCurrency(
    adjustedSubtotal * (settings.clientTypeDiscountPercent[draft.clientType] / 100)
  );
  const complexitySurchargeAmount = roundCurrency(
    adjustedSubtotal * (settings.complexitySurchargePercent[draft.complexity] / 100)
  );
  const urgencySurchargeAmount = roundCurrency(
    adjustedSubtotal * (settings.urgencySurchargePercent[draft.urgency] / 100)
  );
  const surchargeAmount = roundCurrency(
    lineSurchargeAmount + complexitySurchargeAmount + urgencySurchargeAmount
  );
  const discountAmount = roundCurrency(lineDiscountAmount + clientTypeDiscountAmount);
  const taxableBase = roundCurrency(
    Math.max(0, adjustedSubtotal - clientTypeDiscountAmount + complexitySurchargeAmount + urgencySurchargeAmount)
  );
  const weightedTaxPercent = calculateWeightedTaxPercent(lines, settings.defaultTaxPercent);
  const taxAmount = roundCurrency(taxableBase * (weightedTaxPercent / 100));
  const total = roundCurrency(taxableBase + taxAmount);
  const estimatedCostRatio = Math.min(
    0.92,
    settings.baseCostRatio +
      settings.complexityCostImpact[draft.complexity] +
      settings.urgencyCostImpact[draft.urgency]
  );
  const estimatedCost = roundCurrency(taxableBase * estimatedCostRatio);
  const estimatedProfit = roundCurrency(Math.max(0, taxableBase - estimatedCost));
  const estimatedMarginPercent = taxableBase
    ? roundCurrency((estimatedProfit / taxableBase) * 100)
    : 0;
  const requiresApproval = estimatedMarginPercent < settings.minMarginPercent;

  if (subtotal <= 0 || total <= 0) {
    issues.push({
      field: "totals",
      level: "error",
      message: "La cotizacion debe generar un total mayor que cero."
    });
  }

  if (requiresApproval) {
    issues.push({
      field: "margin",
      level: "warning",
      message: `La rentabilidad estimada quedo en ${estimatedMarginPercent}%. Esto requiere aprobacion antes de enviarse.`
    });
  }

  return {
    lines,
    totals: {
      subtotal,
      discountAmount,
      surchargeAmount,
      taxableBase,
      taxAmount,
      estimatedMarginPercent,
      estimatedProfit,
      total,
      requiresApproval
    },
    issues,
    canSend:
      !issues.some((issue) => issue.level === "error") &&
      !requiresApproval
  };
}
