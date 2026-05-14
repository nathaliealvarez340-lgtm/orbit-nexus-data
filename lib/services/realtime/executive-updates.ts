import "server-only";

import {
  AlertLifecycleStatus,
  AlertSeverity,
  InvoiceStatus,
  ProjectStatus,
  QuoteStatus,
  TaskPriority,
  TaskStatus
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { canAccessFinanceModule, canAccessQuotesModule } from "@/lib/auth/authorization";
import { ServiceError } from "@/lib/services/service-error";
import type { SessionUser } from "@/types/auth";

type RealtimeModuleState = {
  count: number;
  criticalCount?: number;
  latestAt: string | null;
};

export type ExecutiveRealtimeSnapshot = {
  organizationId: string;
  version: string;
  generatedAt: string;
  polling: {
    recommendedMs: number;
    hiddenTabMs: number;
  };
  modules: {
    projects: RealtimeModuleState;
    tasks: RealtimeModuleState;
    kpis: RealtimeModuleState;
    alerts: RealtimeModuleState;
    quotes: RealtimeModuleState;
    invoices: RealtimeModuleState;
    activity: RealtimeModuleState;
    notifications: RealtimeModuleState;
  };
};

function getCompanyId(session: SessionUser) {
  const companyId = session.companyId ?? session.tenantId;

  if (!companyId) {
    throw new ServiceError("No hay organizacion activa para sincronizar datos.", 403);
  }

  if (session.role === "SUPERADMIN") {
    throw new ServiceError("La sincronizacion ejecutiva requiere una organizacion especifica.", 403);
  }

  return companyId;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function latestTimestamp(values: Array<string | null>) {
  const latest = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((left, right) => right - left)[0];

  return latest ? new Date(latest).toISOString() : "empty";
}

function buildVersion(params: {
  latestAt: string;
  counts: number[];
}) {
  return `${params.latestAt}:${params.counts.join(".")}`;
}

export async function getExecutiveRealtimeSnapshot(
  session: SessionUser
): Promise<ExecutiveRealtimeSnapshot> {
  const companyId = getCompanyId(session);
  const canReadQuotes = canAccessQuotesModule(session.role);
  const canReadInvoices = canAccessFinanceModule(session.role);

  const [
    activeProjects,
    criticalProjects,
    projectsLatest,
    activeTasks,
    criticalTasks,
    tasksLatest,
    kpis,
    lowKpis,
    kpisLatest,
    openAlerts,
    criticalAlerts,
    alertsLatest,
    activity,
    notifications,
    quotes,
    quotesLatest,
    invoices,
    invoicesLatest
  ] = await Promise.all([
    prisma.project.count({
      where: {
        companyId,
        status: { notIn: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED] }
      }
    }),
    prisma.project.count({
      where: {
        companyId,
        OR: [
          { status: { in: [ProjectStatus.AT_RISK, ProjectStatus.AUDIT_IN_PROGRESS, ProjectStatus.ON_HOLD] } },
          { priority: "CRITICAL" }
        ]
      }
    }),
    prisma.project.aggregate({
      where: { companyId },
      _max: { updatedAt: true }
    }),
    prisma.task.count({
      where: {
        companyId,
        status: { not: TaskStatus.COMPLETED }
      }
    }),
    prisma.task.count({
      where: {
        companyId,
        status: { not: TaskStatus.COMPLETED },
        OR: [
          { status: TaskStatus.BLOCKED },
          { priority: { in: [TaskPriority.CRITICAL, TaskPriority.HIGH] } }
        ]
      }
    }),
    prisma.task.aggregate({
      where: { companyId },
      _max: { updatedAt: true }
    }),
    prisma.kpi.count({
      where: { companyId }
    }),
    prisma.kpi.count({
      where: {
        companyId,
        OR: [
          { trend: "DOWN" },
          {
            AND: [
              { targetValue: { not: null } },
              { value: { lt: 80 } }
            ]
          }
        ]
      }
    }),
    prisma.kpi.aggregate({
      where: { companyId },
      _max: { updatedAt: true }
    }),
    prisma.operationalAlert.count({
      where: {
        companyId,
        status: { not: AlertLifecycleStatus.RESOLVED }
      }
    }),
    prisma.operationalAlert.count({
      where: {
        companyId,
        status: { not: AlertLifecycleStatus.RESOLVED },
        severity: { in: [AlertSeverity.CRITICAL, AlertSeverity.HIGH] }
      }
    }),
    prisma.operationalAlert.aggregate({
      where: { companyId },
      _max: { updatedAt: true }
    }),
    prisma.activityLog.aggregate({
      where: { companyId },
      _count: { _all: true },
      _max: { createdAt: true }
    }),
    prisma.notification.aggregate({
      where: {
        companyId,
        userId: session.userId,
        readAt: null
      },
      _count: { _all: true },
      _max: { createdAt: true }
    }),
    canReadQuotes
      ? prisma.quote.count({
          where: {
            companyId,
            status: { in: [QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.VIEWED, QuoteStatus.REQUIRES_APPROVAL] }
          }
        })
      : Promise.resolve(0),
    canReadQuotes
      ? prisma.quote.aggregate({
          where: { companyId },
          _max: { updatedAt: true }
        })
      : Promise.resolve({ _max: { updatedAt: null } }),
    canReadInvoices
      ? prisma.invoice.count({
          where: {
            companyId,
            status: {
              in: [InvoiceStatus.DRAFT, InvoiceStatus.PENDING_CFDI, InvoiceStatus.ISSUED, InvoiceStatus.FAILED]
            }
          }
        })
      : Promise.resolve(0),
    canReadInvoices
      ? prisma.invoice.aggregate({
          where: { companyId },
          _max: { updatedAt: true }
        })
      : Promise.resolve({ _max: { updatedAt: null } })
  ]);

  const modules: ExecutiveRealtimeSnapshot["modules"] = {
    projects: {
      count: activeProjects,
      criticalCount: criticalProjects,
      latestAt: toIso(projectsLatest._max.updatedAt)
    },
    tasks: {
      count: activeTasks,
      criticalCount: criticalTasks,
      latestAt: toIso(tasksLatest._max.updatedAt)
    },
    kpis: {
      count: kpis,
      criticalCount: lowKpis,
      latestAt: toIso(kpisLatest._max.updatedAt)
    },
    alerts: {
      count: openAlerts,
      criticalCount: criticalAlerts,
      latestAt: toIso(alertsLatest._max.updatedAt)
    },
    quotes: {
      count: quotes,
      latestAt: toIso(quotesLatest._max.updatedAt)
    },
    invoices: {
      count: invoices,
      latestAt: toIso(invoicesLatest._max.updatedAt)
    },
    activity: {
      count: activity._count._all,
      latestAt: toIso(activity._max.createdAt)
    },
    notifications: {
      count: notifications._count._all,
      latestAt: toIso(notifications._max.createdAt)
    }
  };
  const latestAt = latestTimestamp(Object.values(modules).map((module) => module.latestAt));
  const version = buildVersion({
    latestAt,
    counts: Object.values(modules).flatMap((module) => [
      module.count,
      module.criticalCount ?? 0
    ])
  });

  return {
    organizationId: companyId,
    version,
    generatedAt: new Date().toISOString(),
    polling: {
      recommendedMs: 30000,
      hiddenTabMs: 120000
    },
    modules
  };
}
