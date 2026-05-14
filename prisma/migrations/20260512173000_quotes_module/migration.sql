CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REQUIRES_APPROVAL');
CREATE TYPE "QuoteClientType" AS ENUM ('NEW', 'RECURRING', 'STRATEGIC');
CREATE TYPE "QuoteComplexity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "QuoteUrgency" AS ENUM ('STANDARD', 'PRIORITY', 'CRITICAL');
CREATE TYPE "QuoteInvoiceStatus" AS ENUM ('NOT_READY', 'READY_FOR_INVOICE');

CREATE TABLE "quote_clients" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "sector" TEXT,
    "clientType" "QuoteClientType" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_catalog_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "unitLabel" TEXT NOT NULL DEFAULT 'servicio',
    "unitCents" INTEGER NOT NULL,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "createdById" TEXT,
    "quoteNumber" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceStatus" "QuoteInvoiceStatus" NOT NULL DEFAULT 'NOT_READY',
    "invoicePreparedAt" TIMESTAMP(3),
    "clientName" TEXT NOT NULL,
    "clientCompany" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "commercialTerms" TEXT NOT NULL,
    "clientType" "QuoteClientType" NOT NULL DEFAULT 'NEW',
    "complexity" "QuoteComplexity" NOT NULL DEFAULT 'MEDIUM',
    "urgency" "QuoteUrgency" NOT NULL DEFAULT 'STANDARD',
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "surchargeCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "estimatedProfitCents" INTEGER NOT NULL DEFAULT 0,
    "estimatedMarginPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT NOT NULL,
    "printableSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_line_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitCents" INTEGER NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "surchargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "subtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "surchargeCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_events" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quote_clients_companyId_email_key" ON "quote_clients"("companyId", "email");
CREATE INDEX "quote_clients_companyId_company_idx" ON "quote_clients"("companyId", "company");

CREATE UNIQUE INDEX "quote_catalog_items_companyId_name_key" ON "quote_catalog_items"("companyId", "name");
CREATE INDEX "quote_catalog_items_companyId_category_idx" ON "quote_catalog_items"("companyId", "category");

CREATE UNIQUE INDEX "quotes_shareToken_key" ON "quotes"("shareToken");
CREATE UNIQUE INDEX "quotes_companyId_quoteNumber_key" ON "quotes"("companyId", "quoteNumber");
CREATE INDEX "quotes_companyId_status_updatedAt_idx" ON "quotes"("companyId", "status", "updatedAt");
CREATE INDEX "quotes_companyId_clientEmail_idx" ON "quotes"("companyId", "clientEmail");

CREATE INDEX "quote_line_items_quoteId_idx" ON "quote_line_items"("quoteId");
CREATE INDEX "quote_events_companyId_quoteId_createdAt_idx" ON "quote_events"("companyId", "quoteId", "createdAt");

ALTER TABLE "quote_clients" ADD CONSTRAINT "quote_clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_catalog_items" ADD CONSTRAINT "quote_catalog_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "quote_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "quote_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_events" ADD CONSTRAINT "quote_events_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_events" ADD CONSTRAINT "quote_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_events" ADD CONSTRAINT "quote_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
