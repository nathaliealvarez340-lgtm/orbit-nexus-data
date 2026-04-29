CREATE TYPE "OrganizationAccessType" AS ENUM ('COMPANY', 'OWN_BUSINESS');

ALTER TABLE "companies"
ADD COLUMN "organizationAccessType" "OrganizationAccessType",
ADD COLUMN "authorizedEmailDomain" TEXT,
ADD COLUMN "ownerContactEmail" TEXT;

ALTER TABLE "company_activation_requests"
ADD COLUMN "organizationAccessType" "OrganizationAccessType" NOT NULL DEFAULT 'COMPANY',
ADD COLUMN "authorizedEmailDomain" TEXT,
ADD COLUMN "ownerContactEmail" TEXT;

