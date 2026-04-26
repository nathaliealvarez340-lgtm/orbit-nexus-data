CREATE TYPE "ContractAcceptanceStatus" AS ENUM ('CONTRACT_SIGNED');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "SupportTicketSource" AS ENUM ('NEXUS_CHAT', 'CONTACT', 'SYSTEM');

CREATE TABLE "contract_acceptances" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "projectId" TEXT,
    "projectExternalId" TEXT NOT NULL,
    "projectSlug" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "assignmentId" TEXT,
    "consultantUserId" TEXT,
    "consultantName" TEXT NOT NULL,
    "leaderUserId" TEXT,
    "leaderName" TEXT,
    "companyName" TEXT,
    "contractVersion" TEXT NOT NULL DEFAULT 'v1',
    "contractTitle" TEXT NOT NULL,
    "contractBody" TEXT NOT NULL,
    "status" "ContractAcceptanceStatus" NOT NULL DEFAULT 'CONTRACT_SIGNED',
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "source" "SupportTicketSource" NOT NULL DEFAULT 'NEXUS_CHAT',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "userId" TEXT,
    "userRole" "RoleKey" NOT NULL,
    "userName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contextLabel" TEXT NOT NULL,
    "routePath" TEXT NOT NULL,
    "assistantReply" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_settings" (
    "id" TEXT NOT NULL,
    "coreMonthlyMxn" INTEGER NOT NULL,
    "growthMonthlyMxn" INTEGER NOT NULL,
    "extraUserMonthlyMxn" INTEGER NOT NULL,
    "enterpriseStartingUsd" INTEGER NOT NULL,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_settings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contract_acceptances_companyId_signedAt_idx" ON "contract_acceptances"("companyId", "signedAt");
CREATE INDEX "contract_acceptances_projectSlug_consultantUserId_idx" ON "contract_acceptances"("projectSlug", "consultantUserId");
CREATE INDEX "support_tickets_companyId_createdAt_idx" ON "support_tickets"("companyId", "createdAt");
CREATE INDEX "support_tickets_status_priority_createdAt_idx" ON "support_tickets"("status", "priority", "createdAt");

ALTER TABLE "contract_acceptances" ADD CONSTRAINT "contract_acceptances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
