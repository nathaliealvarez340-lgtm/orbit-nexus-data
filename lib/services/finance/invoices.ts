import {
  ActivityLogType,
  InvoiceStatus,
  QuoteInvoiceStatus,
  QuoteStatus,
  type Prisma
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import { isFinanceWorkspaceRole } from "@/lib/auth/authorization";
import type { SessionUser } from "@/types/auth";

type FiscalDataInput = {
  rfc: string;
  legalName: string;
  cfdiUse: string;
  fiscalRegime: string;
  fiscalAddress: string;
  paymentMethod: string;
  paymentForm: string;
  currency: string;
};

const invoiceInclude = {
  quote: {
    select: {
      id: true,
      quoteNumber: true,
      status: true
    }
  },
  lineItems: true
} satisfies Prisma.InvoiceInclude;

function assertFinanceSession(session: SessionUser) {
  const companyId = session.companyId ?? session.tenantId;

  if (!isFinanceWorkspaceRole(session.role)) {
    throw new ServiceError("No tienes permisos financieros para gestionar facturas.", 403);
  }

  if (!companyId) {
    throw new ServiceError("Tu sesion no tiene organizacion asociada.", 403);
  }

  return companyId;
}

function toMoney(cents: number) {
  return cents / 100;
}

function mapInvoice(record: Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>) {
  return {
    id: record.id,
    quoteId: record.quoteId,
    quoteNumber: record.quote?.quoteNumber ?? null,
    invoiceNumber: record.invoiceNumber,
    status: record.status,
    clientName: record.clientName,
    clientCompany: record.clientCompany,
    clientEmail: record.clientEmail,
    rfc: record.rfc,
    legalName: record.legalName,
    cfdiUse: record.cfdiUse,
    fiscalRegime: record.fiscalRegime,
    fiscalAddress: record.fiscalAddress,
    paymentMethod: record.paymentMethod,
    paymentForm: record.paymentForm,
    currency: record.currency,
    subtotal: toMoney(record.subtotalCents),
    tax: toMoney(record.taxCents),
    total: toMoney(record.totalCents),
    providerName: record.providerName,
    providerUuid: record.providerUuid,
    failureReason: record.failureReason,
    issuedAt: record.issuedAt?.toISOString() ?? null,
    paidAt: record.paidAt?.toISOString() ?? null,
    cancelledAt: record.cancelledAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lineItems: record.lineItems.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: line.quantity,
      unit: toMoney(line.unitCents),
      taxPercent: line.taxPercent,
      subtotal: toMoney(line.subtotalCents),
      tax: toMoney(line.taxCents),
      total: toMoney(line.totalCents)
    }))
  };
}

function mapAcceptedQuote(
  record: Prisma.QuoteGetPayload<{
    select: {
      id: true;
      quoteNumber: true;
      clientName: true;
      clientCompany: true;
      clientEmail: true;
      totalCents: true;
      currency: true;
      invoiceStatus: true;
      updatedAt: true;
    };
  }>
) {
  return {
    id: record.id,
    quoteNumber: record.quoteNumber,
    clientName: record.clientName,
    clientCompany: record.clientCompany,
    clientEmail: record.clientEmail,
    total: toMoney(record.totalCents),
    currency: record.currency,
    invoiceStatus: record.invoiceStatus,
    updatedAt: record.updatedAt.toISOString()
  };
}

async function createInvoiceNumber(tx: Prisma.TransactionClient, companyId: string) {
  const year = new Date().getFullYear();
  const prefix = `ONX-INV-${year}-`;
  const count = await tx.invoice.count({
    where: {
      companyId,
      invoiceNumber: {
        startsWith: prefix
      }
    }
  });

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

function buildInternalReceiptSnapshot(params: {
  invoiceNumber: string;
  quoteNumber: string;
  fiscalData: FiscalDataInput;
}) {
  return {
    kind: "INTERNAL_NON_FISCAL_RECEIPT",
    warning:
      "Este documento es un comprobante interno operativo. No sustituye CFDI ni comprobante fiscal valido ante el SAT.",
    invoiceNumber: params.invoiceNumber,
    quoteNumber: params.quoteNumber,
    rfc: params.fiscalData.rfc,
    legalName: params.fiscalData.legalName,
    generatedAt: new Date().toISOString()
  };
}

export async function getInvoiceWorkspace(session: SessionUser) {
  const companyId = assertFinanceSession(session);

  const [invoices, acceptedQuotes] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId },
      include: invoiceInclude,
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.quote.findMany({
      where: {
        companyId,
        status: QuoteStatus.ACCEPTED,
        invoiceStatus: QuoteInvoiceStatus.NOT_READY,
        invoice: null
      },
      select: {
        id: true,
        quoteNumber: true,
        clientName: true,
        clientCompany: true,
        clientEmail: true,
        totalCents: true,
        currency: true,
        invoiceStatus: true,
        updatedAt: true
      },
      orderBy: [{ updatedAt: "desc" }]
    })
  ]);

  return {
    invoices: invoices.map(mapInvoice),
    acceptedQuotes: acceptedQuotes.map(mapAcceptedQuote),
    cfdiProvider: {
      connected: false,
      recommended: ["Facturama", "SW sapien", "Alegra", "Bind ERP API"],
      warning:
        "Facturacion CFDI oficial no esta conectada todavia. Los comprobantes generados aqui son internos y no fiscales."
    }
  };
}

export async function createInvoiceFromQuote(params: {
  session: SessionUser;
  quoteId: string;
  fiscalData: FiscalDataInput;
}) {
  const companyId = assertFinanceSession(params.session);

  const invoice = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({
      where: {
        id: params.quoteId,
        companyId
      },
      include: {
        lineItems: true,
        invoice: true
      }
    });

    if (!quote) {
      throw new ServiceError("No encontramos la cotizacion dentro de tu organizacion.", 404);
    }

    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new ServiceError("Solo puedes preparar factura desde una cotizacion aceptada.", 409);
    }

    if (quote.invoice) {
      throw new ServiceError("Esta cotizacion ya tiene una factura interna preparada.", 409);
    }

    const invoiceNumber = await createInvoiceNumber(tx, companyId);
    const createdInvoice = await tx.invoice.create({
      data: {
        companyId,
        quoteId: quote.id,
        createdById: params.session.userId,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        clientName: quote.clientName,
        clientCompany: quote.clientCompany,
        clientEmail: quote.clientEmail,
        rfc: params.fiscalData.rfc,
        legalName: params.fiscalData.legalName,
        cfdiUse: params.fiscalData.cfdiUse,
        fiscalRegime: params.fiscalData.fiscalRegime,
        fiscalAddress: params.fiscalData.fiscalAddress,
        paymentMethod: params.fiscalData.paymentMethod,
        paymentForm: params.fiscalData.paymentForm,
        currency: params.fiscalData.currency || quote.currency,
        subtotalCents: quote.subtotalCents,
        taxCents: quote.taxCents,
        totalCents: quote.totalCents,
        internalReceiptSnapshot: buildInternalReceiptSnapshot({
          invoiceNumber,
          quoteNumber: quote.quoteNumber,
          fiscalData: params.fiscalData
        }),
        lineItems: {
          create: quote.lineItems.map((line) => ({
            companyId,
            description: line.name,
            quantity: line.quantity,
            unitCents: line.unitCents,
            taxPercent: line.taxPercent,
            subtotalCents: line.subtotalCents,
            taxCents: line.taxCents,
            totalCents: line.totalCents
          }))
        }
      },
      include: invoiceInclude
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: {
        invoiceStatus: QuoteInvoiceStatus.READY_FOR_INVOICE,
        invoicePreparedAt: new Date()
      }
    });

    await tx.activityLog.create({
      data: {
        companyId,
        userId: params.session.userId,
        type: ActivityLogType.SYSTEM,
        title: "Factura interna preparada",
        description: `${createdInvoice.invoiceNumber} se creo desde ${quote.quoteNumber}. Pendiente de integracion CFDI oficial.`,
        routePath: "/workspace/invoices",
        metadata: {
          quoteId: quote.id,
          invoiceId: createdInvoice.id,
          status: createdInvoice.status,
          nonFiscal: true
        }
      }
    });

    return createdInvoice;
  });

  return mapInvoice(invoice);
}

export async function updateInvoiceStatus(params: {
  session: SessionUser;
  invoiceId: string;
  status: InvoiceStatus;
  failureReason?: string;
}) {
  const companyId = assertFinanceSession(params.session);

  const now = new Date();
  const invoice = await prisma.invoice.update({
    where: {
      id: params.invoiceId,
      companyId
    },
    data: {
      status: params.status,
      failureReason: params.status === InvoiceStatus.FAILED ? params.failureReason ?? null : null,
      issuedAt: params.status === InvoiceStatus.ISSUED ? now : undefined,
      paidAt: params.status === InvoiceStatus.PAID ? now : undefined,
      cancelledAt: params.status === InvoiceStatus.CANCELLED ? now : undefined
    },
    include: invoiceInclude
  });

  await prisma.activityLog.create({
    data: {
      companyId,
      userId: params.session.userId,
      type: ActivityLogType.SYSTEM,
      title: "Estado de factura actualizado",
      description: `${invoice.invoiceNumber} cambio a ${params.status}.`,
      routePath: "/workspace/invoices",
      metadata: {
        invoiceId: invoice.id,
        status: params.status,
        nonFiscal: true
      }
    }
  });

  return mapInvoice(invoice);
}

export async function getInvoiceInternalReceipt(session: SessionUser, invoiceId: string) {
  const companyId = assertFinanceSession(session);
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      companyId
    },
    include: invoiceInclude
  });

  if (!invoice) {
    throw new ServiceError("No encontramos la factura dentro de tu organizacion.", 404);
  }

  return mapInvoice(invoice);
}
