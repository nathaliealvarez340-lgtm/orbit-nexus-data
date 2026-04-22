-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('SUPERADMIN', 'LEADER', 'CONSULTANT', 'CLIENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_REGISTRATION', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'READY_FOR_MATCHING', 'MATCHING_IN_PROGRESS', 'ASSIGNED', 'ACTIVE', 'UNDER_REVIEW', 'AT_RISK', 'AUDIT_IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('COMPLIANCE', 'QUALITY', 'SPEED', 'TRUST');

-- CreateEnum
CREATE TYPE "AssignmentMode" AS ENUM ('SMART', 'MANUAL');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'MANUAL_LOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('PENDING', 'DELIVERED', 'LATE', 'COMMENTED', 'CORRECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'AUTH', 'PROJECT', 'INCIDENT', 'AUDIT');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('MISSED_DELIVERY', 'WARNING', 'ESCALATED_TO_AUDIT');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'WARNING', 'AUDIT_SCHEDULED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoginStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ChatThreadStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RejectionReason" AS ENUM ('CAPACITY', 'TIMELINE_CONFLICT', 'SCOPE_MISMATCH', 'SKILL_MISMATCH', 'PRIORITY_CONFLICT', 'OTHER');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "key" "RoleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "roleId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "normalizedFullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "specializationSummary" TEXT,
    "passwordHash" TEXT,
    "accessCode" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_REGISTRATION',
    "importedFromDirectory" BOOLEAN NOT NULL DEFAULT false,
    "directorySyncedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leaderId" TEXT,
    "clientUserId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationLabel" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "requirements" JSONB,
    "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
    "folio" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assignments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "mode" "AssignmentMode" NOT NULL DEFAULT 'SMART',
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionCount" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "lastRejectedAt" TIMESTAMP(3),
    "manualAssignmentRequiredAt" TIMESTAMP(3),
    "manualAssignmentLockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiencyPercent" INTEGER NOT NULL,
    "yearsExperience" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_skills" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "minimumProficiency" INTEGER NOT NULL DEFAULT 60,
    "importanceWeight" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_kpis" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "complianceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeProjectsCount" INTEGER NOT NULL DEFAULT 0,
    "completedProjectsCount" INTEGER NOT NULL DEFAULT 0,
    "incidentsCount" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultant_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "BadgeCategory" NOT NULL,
    "awardedById" TEXT,
    "note" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "consultantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT,
    "status" "ChatThreadStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_status_history" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "changedById" TEXT,
    "fromStatus" "ProjectStatus",
    "toStatus" "ProjectStatus" NOT NULL,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "consultantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "status" "ProgressStatus" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "progressId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "selectedText" TEXT,
    "pageNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "warningIssuedAt" TIMESTAMP(3),
    "auditEligibleAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "incidentId" TEXT,
    "scheduledById" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "message" TEXT,
    "meetingLink" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "auditId" TEXT,
    "scheduledById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "meetingUrl" TEXT,
    "notes" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assignment_rejections" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "rejectionNumber" INTEGER NOT NULL,
    "reason" "RejectionReason" NOT NULL,
    "detail" TEXT,
    "rejectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredManualAssignment" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "project_assignment_rejections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "roleId" TEXT,
    "companyId" TEXT,
    "accessCodeAttempt" TEXT,
    "ipAddress" TEXT,
    "device" TEXT,
    "status" "LoginStatus" NOT NULL,
    "failureReason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_accessCode_key" ON "users"("accessCode");

-- CreateIndex
CREATE INDEX "users_companyId_roleId_idx" ON "users"("companyId", "roleId");

-- CreateIndex
CREATE INDEX "users_normalizedFullName_email_idx" ON "users"("normalizedFullName", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_companyId_roleId_email_key" ON "users"("companyId", "roleId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_companyId_key" ON "users"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_folio_key" ON "projects"("folio");

-- CreateIndex
CREATE INDEX "projects_companyId_status_idx" ON "projects"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_id_companyId_key" ON "projects"("id", "companyId");

-- CreateIndex
CREATE INDEX "project_assignments_companyId_status_idx" ON "project_assignments"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "project_assignments_id_companyId_key" ON "project_assignments"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "project_assignments_projectId_consultantId_key" ON "project_assignments"("projectId", "consultantId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_companyId_slug_key" ON "skills"("companyId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "skills_id_companyId_key" ON "skills"("id", "companyId");

-- CreateIndex
CREATE INDEX "user_skills_companyId_userId_idx" ON "user_skills"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillId_key" ON "user_skills"("userId", "skillId");

-- CreateIndex
CREATE INDEX "project_skills_companyId_projectId_idx" ON "project_skills"("companyId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_skills_projectId_skillId_key" ON "project_skills"("projectId", "skillId");

-- CreateIndex
CREATE INDEX "consultant_kpis_companyId_overallScore_idx" ON "consultant_kpis"("companyId", "overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_kpis_consultantId_companyId_key" ON "consultant_kpis"("consultantId", "companyId");

-- CreateIndex
CREATE INDEX "user_badges_companyId_userId_idx" ON "user_badges"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_category_key" ON "user_badges"("userId", "category");

-- CreateIndex
CREATE INDEX "reviews_companyId_revieweeId_idx" ON "reviews"("companyId", "revieweeId");

-- CreateIndex
CREATE INDEX "reviews_companyId_projectId_idx" ON "reviews"("companyId", "projectId");

-- CreateIndex
CREATE INDEX "chat_threads_companyId_projectId_idx" ON "chat_threads"("companyId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_threads_id_companyId_key" ON "chat_threads"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_threads_projectId_consultantId_clientId_key" ON "chat_threads"("projectId", "consultantId", "clientId");

-- CreateIndex
CREATE INDEX "chat_messages_companyId_threadId_sentAt_idx" ON "chat_messages"("companyId", "threadId", "sentAt");

-- CreateIndex
CREATE INDEX "project_status_history_companyId_projectId_changedAt_idx" ON "project_status_history"("companyId", "projectId", "changedAt");

-- CreateIndex
CREATE INDEX "progress_companyId_status_idx" ON "progress"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "progress_id_companyId_key" ON "progress"("id", "companyId");

-- CreateIndex
CREATE INDEX "comments_companyId_projectId_idx" ON "comments"("companyId", "projectId");

-- CreateIndex
CREATE INDEX "notifications_companyId_userId_idx" ON "notifications"("companyId", "userId");

-- CreateIndex
CREATE INDEX "incidents_companyId_status_idx" ON "incidents"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_id_companyId_key" ON "incidents"("id", "companyId");

-- CreateIndex
CREATE INDEX "audits_companyId_status_idx" ON "audits"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "audits_id_companyId_key" ON "audits"("id", "companyId");

-- CreateIndex
CREATE INDEX "meetings_companyId_projectId_startsAt_idx" ON "meetings"("companyId", "projectId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_id_companyId_key" ON "meetings"("id", "companyId");

-- CreateIndex
CREATE INDEX "project_assignment_rejections_companyId_consultantId_idx" ON "project_assignment_rejections"("companyId", "consultantId");

-- CreateIndex
CREATE UNIQUE INDEX "project_assignment_rejections_assignmentId_rejectionNumber_key" ON "project_assignment_rejections"("assignmentId", "rejectionNumber");

-- CreateIndex
CREATE INDEX "login_activity_companyId_occurredAt_idx" ON "login_activity"("companyId", "occurredAt");

-- CreateIndex
CREATE INDEX "login_activity_accessCodeAttempt_idx" ON "login_activity"("accessCodeAttempt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_leaderId_companyId_fkey" FOREIGN KEY ("leaderId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientUserId_companyId_fkey" FOREIGN KEY ("clientUserId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_consultantId_companyId_fkey" FOREIGN KEY ("consultantId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_companyId_fkey" FOREIGN KEY ("userId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_companyId_fkey" FOREIGN KEY ("skillId", "companyId") REFERENCES "skills"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skillId_companyId_fkey" FOREIGN KEY ("skillId", "companyId") REFERENCES "skills"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_kpis" ADD CONSTRAINT "consultant_kpis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_kpis" ADD CONSTRAINT "consultant_kpis_consultantId_companyId_fkey" FOREIGN KEY ("consultantId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_companyId_fkey" FOREIGN KEY ("userId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_awardedById_companyId_fkey" FOREIGN KEY ("awardedById", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_assignmentId_companyId_fkey" FOREIGN KEY ("assignmentId", "companyId") REFERENCES "project_assignments"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_companyId_fkey" FOREIGN KEY ("reviewerId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_revieweeId_companyId_fkey" FOREIGN KEY ("revieweeId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_assignmentId_companyId_fkey" FOREIGN KEY ("assignmentId", "companyId") REFERENCES "project_assignments"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_consultantId_companyId_fkey" FOREIGN KEY ("consultantId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_clientId_companyId_fkey" FOREIGN KEY ("clientId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_threadId_companyId_fkey" FOREIGN KEY ("threadId", "companyId") REFERENCES "chat_threads"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_companyId_fkey" FOREIGN KEY ("senderId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_changedById_companyId_fkey" FOREIGN KEY ("changedById", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_assignmentId_companyId_fkey" FOREIGN KEY ("assignmentId", "companyId") REFERENCES "project_assignments"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_consultantId_companyId_fkey" FOREIGN KEY ("consultantId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_progressId_companyId_fkey" FOREIGN KEY ("progressId", "companyId") REFERENCES "progress"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_companyId_fkey" FOREIGN KEY ("authorId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_companyId_fkey" FOREIGN KEY ("userId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assignmentId_companyId_fkey" FOREIGN KEY ("assignmentId", "companyId") REFERENCES "project_assignments"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_incidentId_companyId_fkey" FOREIGN KEY ("incidentId", "companyId") REFERENCES "incidents"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_scheduledById_companyId_fkey" FOREIGN KEY ("scheduledById", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_auditId_companyId_fkey" FOREIGN KEY ("auditId", "companyId") REFERENCES "audits"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_scheduledById_companyId_fkey" FOREIGN KEY ("scheduledById", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignment_rejections" ADD CONSTRAINT "project_assignment_rejections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignment_rejections" ADD CONSTRAINT "project_assignment_rejections_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignment_rejections" ADD CONSTRAINT "project_assignment_rejections_assignmentId_companyId_fkey" FOREIGN KEY ("assignmentId", "companyId") REFERENCES "project_assignments"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignment_rejections" ADD CONSTRAINT "project_assignment_rejections_consultantId_companyId_fkey" FOREIGN KEY ("consultantId", "companyId") REFERENCES "users"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_activity" ADD CONSTRAINT "login_activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_activity" ADD CONSTRAINT "login_activity_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_activity" ADD CONSTRAINT "login_activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

