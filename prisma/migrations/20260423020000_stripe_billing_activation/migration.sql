CREATE TYPE "CompanyPlan" AS ENUM ('CORE', 'GROWTH', 'ENTERPRISE');
CREATE TYPE "CompanyBillingStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'ENTERPRISE_REVIEW');

ALTER TABLE "companies"
ADD COLUMN "sector" TEXT,
ADD COLUMN "contactName" TEXT,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "subscriptionPlan" "CompanyPlan",
ADD COLUMN "includedUsers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "extraUsers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "monthlyAmountMxn" INTEGER,
ADD COLUMN "billingStatus" "CompanyBillingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "activatedAt" TIMESTAMP(3);

CREATE TABLE "company_activation_requests" (
  "id" TEXT NOT NULL,
  "companyId" TEXT,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "sector" TEXT NOT NULL,
  "plan" "CompanyPlan" NOT NULL,
  "includedUsers" INTEGER NOT NULL,
  "extraUsers" INTEGER NOT NULL DEFAULT 0,
  "totalAmountMxn" INTEGER NOT NULL,
  "status" "CompanyBillingStatus" NOT NULL DEFAULT 'PENDING',
  "stripeCheckoutSessionId" TEXT,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "registrationCode" TEXT,
  "companySlug" TEXT NOT NULL,
  "companyCodePrefix" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_activation_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "companies_stripeCustomerId_key" ON "companies"("stripeCustomerId");
CREATE UNIQUE INDEX "companies_stripeSubscriptionId_key" ON "companies"("stripeSubscriptionId");
CREATE UNIQUE INDEX "companies_stripeCheckoutSessionId_key" ON "companies"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "company_activation_requests_stripeCheckoutSessionId_key" ON "company_activation_requests"("stripeCheckoutSessionId");
CREATE INDEX "company_activation_requests_status_createdAt_idx" ON "company_activation_requests"("status", "createdAt");

ALTER TABLE "company_activation_requests"
ADD CONSTRAINT "company_activation_requests_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
