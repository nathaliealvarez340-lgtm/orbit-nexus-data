-- Extend client records with fiscal fields used by the Executive OS.
ALTER TABLE "quote_clients"
  ADD COLUMN IF NOT EXISTS "legalName" TEXT,
  ADD COLUMN IF NOT EXISTS "commercialName" TEXT,
  ADD COLUMN IF NOT EXISTS "rfc" TEXT,
  ADD COLUMN IF NOT EXISTS "personType" TEXT,
  ADD COLUMN IF NOT EXISTS "fiscalRegime" TEXT,
  ADD COLUMN IF NOT EXISTS "cfdiUse" TEXT,
  ADD COLUMN IF NOT EXISTS "fiscalZipCode" TEXT,
  ADD COLUMN IF NOT EXISTS "fiscalAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "additionalEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "primaryContact" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE INDEX IF NOT EXISTS "quote_clients_companyId_rfc_idx" ON "quote_clients"("companyId", "rfc");

-- Fiscal issuer profile. This does not store CSF files until private storage is configured.
CREATE TABLE IF NOT EXISTS "company_tax_profiles" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "rfc" TEXT,
  "legalName" TEXT,
  "personType" TEXT,
  "fiscalRegime" TEXT,
  "fiscalZipCode" TEXT,
  "fiscalAddress" TEXT,
  "fiscalEmail" TEXT,
  "phone" TEXT,
  "commercialName" TEXT,
  "completenessState" TEXT NOT NULL DEFAULT 'INCOMPLETE',
  "storageNotice" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "company_tax_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_tax_profiles_companyId_key" ON "company_tax_profiles"("companyId");
CREATE INDEX IF NOT EXISTS "company_tax_profiles_companyId_completenessState_idx" ON "company_tax_profiles"("companyId", "completenessState");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_tax_profiles_companyId_fkey'
  ) THEN
    ALTER TABLE "company_tax_profiles"
      ADD CONSTRAINT "company_tax_profiles_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
