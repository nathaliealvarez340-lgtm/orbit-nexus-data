import "server-only";

import {
  ActivityLogType,
  AlertLifecycleStatus,
  AlertSeverity,
  InvoiceStatus,
  ProjectPriority,
  ProjectStatus,
  QuoteStatus,
  ReportType,
  TaskPriority,
  TaskStatus,
  type Prisma
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import {
  EXECUTIVE_WORKSPACE_ROLES,
  FINANCE_WORKSPACE_ROLES,
  QUOTES_WORKSPACE_ROLES,
  CLIENTS_WORKSPACE_ROLES
} from "@/lib/auth/authorization";
import type { AppRoleKey, SessionUser } from "@/types/auth";

export type OrbitAiToolName =
  | "operational_summary"
  | "delayed_projects"
  | "priority_tasks"
  | "low_kpis"
  | "operational_risks"
  | "pending_quotes"
  | "pending_invoices"
  | "clients_summary"
  | "tax_profile_status"
  | "integrations_status"
  | "draft_executive_report"
  | "suggest_tasks";

export type OrbitAiToolResult = {
  tool: OrbitAiToolName;
  label: string;
  usedData: boolean;
  findings: string[];
  recommendations: string[];
  data: Record<string, unknown>;
};

type ToolContext = {
  companyId: string;
  userId: string;
  role: AppRoleKey;
};

const OPERATIONS_ROLES: AppRoleKey[] = EXECUTIVE_WORKSPACE_ROLES;
const FINANCE_ROLES: AppRoleKey[] = FINANCE_WORKSPACE_ROLES;
const QUOTE_ROLES: AppRoleKey[] = QUOTES_WORKSPACE_ROLES;
const CLIENT_ROLES: AppRoleKey[] = CLIENTS_WORKSPACE_ROLES;

function asJson(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

function getCompanyId(session: SessionUser) {
  const companyId = session.companyId ?? session.tenantId;

  if (!companyId) {
    throw new ServiceError("MAIA Executive Agent necesita una organizacion activa para consultar datos.", 403);
  }

  return companyId;
}

function createToolContext(session: SessionUser, allowedRoles: AppRoleKey[]): ToolContext {
  if (!allowedRoles.includes(session.role)) {
    throw new ServiceError("No tienes permisos para usar esta herramienta de MAIA Executive Agent.", 403);
  }

  return {
    companyId: getCompanyId(session),
    userId: session.userId,
    role: session.role
  };
}

function formatMoney(cents: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    currency,
    style: "currency"
  }).format(cents / 100);
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(value);
}

function priorityScore(priority: ProjectPriority | TaskPriority) {
  switch (priority) {
    case "CRITICAL":
      return 4;
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    default:
      return 1;
  }
}

function buildResult(params: OrbitAiToolResult) {
  return params;
}

export async function getOperationalSummaryTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, OPERATIONS_ROLES);
  const [projects, tasks, alerts, kpis, reports] = await Promise.all([
    prisma.project.findMany({
      where: { companyId },
      select: { id: true, name: true, status: true, priority: true, endDate: true },
      orderBy: [{ updatedAt: "desc" }],
      take: 20
    }),
    prisma.task.findMany({
      where: { companyId },
      select: { id: true, title: true, status: true, priority: true, dueAt: true },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 30
    }),
    prisma.operationalAlert.findMany({
      where: { companyId, status: { not: AlertLifecycleStatus.RESOLVED } },
      select: { id: true, title: true, severity: true, recommendedAction: true },
      orderBy: [{ detectedAt: "desc" }],
      take: 12
    }),
    prisma.kpi.findMany({
      where: { companyId },
      select: { id: true, name: true, value: true, unit: true, targetValue: true, trend: true },
      orderBy: [{ updatedAt: "desc" }],
      take: 12
    }),
    prisma.executiveReport.findMany({
      where: { companyId },
      select: { id: true, title: true, summary: true, periodLabel: true, generatedAt: true },
      orderBy: [{ generatedAt: "desc" }],
      take: 3
    })
  ]);
  const now = new Date();
  const activeProjects = projects.filter(
    (project) => project.status !== ProjectStatus.COMPLETED && project.status !== ProjectStatus.CANCELLED
  );
  const delayedTasks = tasks.filter((task) => {
    return (
      task.status !== TaskStatus.COMPLETED &&
      (task.status === TaskStatus.BLOCKED || (task.dueAt !== null && task.dueAt < now))
    );
  });
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.HIGH
  );
  const lowestKpi = [...kpis].sort((left, right) => {
    const leftGap = left.targetValue ? left.value / left.targetValue : left.value;
    const rightGap = right.targetValue ? right.value / right.targetValue : right.value;
    return leftGap - rightGap;
  })[0];

  return buildResult({
    tool: "operational_summary",
    label: "Resumen operativo",
    usedData: projects.length > 0 || tasks.length > 0 || alerts.length > 0 || kpis.length > 0,
    findings: [
      `${activeProjects.length} proyectos activos o en seguimiento.`,
      `${delayedTasks.length} tareas atrasadas o bloqueadas.`,
      `${criticalAlerts.length} alertas altas o criticas abiertas.`,
      lowestKpi
        ? `KPI mas bajo: ${lowestKpi.name} (${lowestKpi.value}${lowestKpi.unit ?? ""}).`
        : "No hay KPI suficientes para comparar rendimiento."
    ],
    recommendations: [
      delayedTasks[0]
        ? `Destrabar primero: ${delayedTasks[0].title}.`
        : "Mantener monitoreo diario de tareas criticas.",
      criticalAlerts[0]
        ? `Atender alerta: ${criticalAlerts[0].title}.`
        : "Revisar alertas antes del cierre operativo.",
      reports[0]
        ? `Usar ${reports[0].title} como base del siguiente reporte.`
        : "Crear un reporte ejecutivo cuando haya suficiente actividad."
    ],
    data: {
      activeProjects: activeProjects.length,
      delayedTasks: delayedTasks.length,
      criticalAlerts: criticalAlerts.length,
      latestReport: reports[0] ?? null,
      lowestKpi: lowestKpi ?? null
    }
  });
}

export async function getDelayedProjectsTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, OPERATIONS_ROLES);
  const now = new Date();
  const projects = await prisma.project.findMany({
    where: {
      companyId,
      status: { notIn: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED] },
      OR: [
        { status: { in: [ProjectStatus.AT_RISK, ProjectStatus.AUDIT_IN_PROGRESS, ProjectStatus.ON_HOLD] } },
        { priority: ProjectPriority.CRITICAL },
        { endDate: { lt: now } }
      ]
    },
    select: {
      id: true,
      folio: true,
      name: true,
      status: true,
      priority: true,
      endDate: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 8
  });

  const orderedProjects = [...projects].sort((left, right) => {
    return priorityScore(right.priority) - priorityScore(left.priority);
  });

  return buildResult({
    tool: "delayed_projects",
    label: "Proyectos atrasados o en riesgo",
    usedData: orderedProjects.length > 0,
    findings: orderedProjects.length
      ? orderedProjects.map(
          (project) =>
            `${project.name} (${project.folio}) esta ${project.status.toLowerCase()} con prioridad ${project.priority.toLowerCase()}${project.endDate ? ` y fecha objetivo ${formatDate(project.endDate)}` : ""}.`
        )
      : ["No detecte proyectos atrasados o en riesgo con los datos actuales."],
    recommendations: orderedProjects.length
      ? [
          "Revisar dependencias y responsables de los primeros proyectos en riesgo.",
          "Evitar sumar carga nueva al equipo hasta cerrar bloqueos criticos."
        ]
      : ["Mantener seguimiento semanal y alertas tempranas sobre fechas objetivo."],
    data: {
      projects: orderedProjects
    }
  });
}

export async function getPriorityTasksTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, OPERATIONS_ROLES);
  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: {
      companyId,
      status: { not: TaskStatus.COMPLETED },
      OR: [
        { status: TaskStatus.BLOCKED },
        { priority: { in: [TaskPriority.CRITICAL, TaskPriority.HIGH] } },
        { dueAt: { lt: now } }
      ]
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueAt: true,
      progressPercent: true,
      riskScore: true
    },
    orderBy: [{ dueAt: "asc" }, { riskScore: "desc" }],
    take: 8
  });

  return buildResult({
    tool: "priority_tasks",
    label: "Tareas prioritarias",
    usedData: tasks.length > 0,
    findings: tasks.length
      ? tasks.map(
          (task) =>
            `${task.title}: ${task.status.toLowerCase()}, prioridad ${task.priority.toLowerCase()}, riesgo ${task.riskScore}%.`
        )
      : ["No encontre tareas urgentes, bloqueadas o vencidas."],
    recommendations: tasks.length
      ? [
          `Resolver primero ${tasks[0].title}.`,
          "Separar bloqueos reales de tareas solo pendientes para no saturar la operacion."
        ]
      : ["Mantener foco en tareas con fecha proxima y revisar cargas semanalmente."],
    data: {
      tasks
    }
  });
}

export async function getLowKpisTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, OPERATIONS_ROLES);
  const kpis = await prisma.kpi.findMany({
    where: { companyId },
    select: { id: true, name: true, value: true, unit: true, targetValue: true, trend: true, summary: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 20
  });
  const lowKpis = kpis
    .map((kpi) => ({
      ...kpi,
      ratio: kpi.targetValue && kpi.targetValue > 0 ? kpi.value / kpi.targetValue : kpi.value / 100
    }))
    .filter((kpi) => kpi.ratio < 0.8 || kpi.trend === "DOWN")
    .sort((left, right) => left.ratio - right.ratio)
    .slice(0, 6);

  return buildResult({
    tool: "low_kpis",
    label: "KPIs bajos",
    usedData: lowKpis.length > 0,
    findings: lowKpis.length
      ? lowKpis.map(
          (kpi) =>
            `${kpi.name}: ${kpi.value}${kpi.unit ?? ""}${kpi.targetValue ? ` de meta ${kpi.targetValue}` : ""}, tendencia ${kpi.trend.toLowerCase()}.`
        )
      : ["No detecte KPI por debajo del umbral operativo."],
    recommendations: lowKpis.length
      ? [
          `Investigar causa del KPI ${lowKpis[0].name}.`,
          "Cruzar KPI bajos contra tareas bloqueadas y alertas abiertas."
        ]
      : ["Mantener revisiones de tendencia para anticipar deterioro."],
    data: {
      kpis: lowKpis
    }
  });
}

export async function getOperationalRisksTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, OPERATIONS_ROLES);
  const alerts = await prisma.operationalAlert.findMany({
    where: {
      companyId,
      status: { not: AlertLifecycleStatus.RESOLVED }
    },
    select: {
      id: true,
      title: true,
      description: true,
      severity: true,
      recommendedAction: true,
      detectedAt: true
    },
    orderBy: [{ detectedAt: "desc" }],
    take: 10
  });
  const risks = alerts
    .filter(
      (alert) =>
        alert.severity === AlertSeverity.CRITICAL ||
        alert.severity === AlertSeverity.HIGH ||
        alert.severity === AlertSeverity.WARNING
    )
    .slice(0, 8);

  return buildResult({
    tool: "operational_risks",
    label: "Riesgos operativos",
    usedData: risks.length > 0,
    findings: risks.length
      ? risks.map((risk) => `${risk.title}: severidad ${risk.severity.toLowerCase()}. ${risk.description}`)
      : ["No hay riesgos operativos abiertos con severidad relevante."],
    recommendations: risks.length
      ? risks
          .map((risk) => risk.recommendedAction)
          .filter((action): action is string => Boolean(action))
          .slice(0, 3)
      : ["Mantener monitoreo preventivo sobre proyectos, tareas y KPI."],
    data: {
      risks
    }
  });
}

export async function getPendingQuotesTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, QUOTE_ROLES);
  const quotes = await prisma.quote.findMany({
    where: {
      companyId,
      status: {
        in: [QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.VIEWED, QuoteStatus.REQUIRES_APPROVAL]
      }
    },
    select: {
      id: true,
      quoteNumber: true,
      status: true,
      clientCompany: true,
      clientEmail: true,
      totalCents: true,
      currency: true,
      validUntil: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 8
  });

  return buildResult({
    tool: "pending_quotes",
    label: "Cotizaciones pendientes",
    usedData: quotes.length > 0,
    findings: quotes.length
      ? quotes.map(
          (quote) =>
            `${quote.quoteNumber} para ${quote.clientCompany}: ${quote.status.toLowerCase()}, total ${formatMoney(quote.totalCents, quote.currency)}${quote.validUntil ? `, vence ${formatDate(quote.validUntil)}` : ""}.`
        )
      : ["No hay cotizaciones pendientes visibles para tu organizacion."],
    recommendations: quotes.length
      ? [
          "Priorizar cotizaciones vistas o por vencer.",
          "Revisar las que requieren aprobacion antes de enviarlas al cliente."
        ]
      : ["Mantener seguimiento comercial desde el modulo de Cotizaciones."],
    data: {
      quotes
    }
  });
}

export async function getPendingInvoicesTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, CLIENT_ROLES);
  const invoices = await prisma.invoice.findMany({
    where: {
      companyId,
      status: {
        in: [InvoiceStatus.DRAFT, InvoiceStatus.PENDING_CFDI, InvoiceStatus.ISSUED, InvoiceStatus.FAILED]
      }
    },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      clientCompany: true,
      rfc: true,
      totalCents: true,
      currency: true,
      failureReason: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 8
  });

  return buildResult({
    tool: "pending_invoices",
    label: "Facturas pendientes",
    usedData: invoices.length > 0,
    findings: invoices.length
      ? invoices.map(
          (invoice) =>
            `${invoice.invoiceNumber} para ${invoice.clientCompany}: ${invoice.status.toLowerCase()}, total ${formatMoney(invoice.totalCents, invoice.currency)}${invoice.failureReason ? `, detalle: ${invoice.failureReason}` : ""}.`
        )
      : ["No hay facturas internas pendientes para la organizacion."],
    recommendations: invoices.length
      ? [
          "Separar facturas internas pendientes de CFDI oficial hasta conectar proveedor autorizado.",
          "Atender primero facturas fallidas o pendientes de CFDI."
        ]
      : ["Mantener trazabilidad entre cotizaciones aceptadas y facturas internas."],
    data: {
      invoices
    }
  });
}

export async function getClientsSummaryTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, FINANCE_ROLES);
  const clients = await prisma.quoteClient.findMany({
    where: { companyId },
    select: {
      id: true,
      legalName: true,
      company: true,
      email: true,
      rfc: true,
      fiscalRegime: true,
      updatedAt: true,
      _count: {
        select: {
          quotes: true
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 8
  });
  const incompleteFiscalData = clients.filter((client) => !client.rfc || !client.fiscalRegime);

  return buildResult({
    tool: "clients_summary",
    label: "Empresas / Clientes",
    usedData: clients.length > 0,
    findings: clients.length
      ? clients.map(
          (client) =>
            `${client.legalName ?? client.company}: ${client._count.quotes} cotizaciones, RFC ${client.rfc ?? "pendiente"}.`
        )
      : ["No hay empresas o clientes registrados todavia."],
    recommendations: incompleteFiscalData.length
      ? [`Completar datos fiscales de ${incompleteFiscalData[0].legalName ?? incompleteFiscalData[0].company}.`]
      : ["Mantener directorio actualizado para cotizar y preparar facturas sin recaptura."],
    data: {
      clients,
      incompleteFiscalData: incompleteFiscalData.length
    }
  });
}

export async function getTaxProfileStatusTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, FINANCE_ROLES);
  const profile = await prisma.companyTaxProfile.findUnique({
    where: { companyId },
    select: {
      rfc: true,
      legalName: true,
      fiscalRegime: true,
      fiscalZipCode: true,
      fiscalAddress: true,
      fiscalEmail: true,
      completenessState: true,
      updatedAt: true
    }
  });

  return buildResult({
    tool: "tax_profile_status",
    label: "Datos fiscales",
    usedData: Boolean(profile),
    findings: profile
      ? [
          `Estado fiscal: ${profile.completenessState}.`,
          `RFC ${profile.rfc ?? "pendiente"} y razon social ${profile.legalName ?? "pendiente"}.`
        ]
      : ["No hay perfil fiscal de empresa emisora registrado todavia."],
    recommendations: profile
      ? [
          profile.completenessState === "READY_FOR_FUTURE_INVOICING"
            ? "Datos listos para preparar integracion CFDI futura con PAC autorizado."
            : "Completar RFC, regimen, codigo postal, domicilio y correo fiscal."
        ]
      : ["Capturar datos fiscales antes de preparar facturacion futura."],
    data: {
      profile
    }
  });
}

export async function getIntegrationsStatusTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId } = createToolContext(session, OPERATIONS_ROLES);
  const integrations = await prisma.integration.findMany({
    where: { companyId },
    select: {
      provider: true,
      name: true,
      status: true,
      lastSyncedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  });
  const connected = integrations.filter((integration) => integration.status === "CONNECTED");

  return buildResult({
    tool: "integrations_status",
    label: "Integraciones",
    usedData: integrations.length > 0,
    findings: integrations.length
      ? integrations.map(
          (integration) =>
            `${integration.name}: ${integration.status.toLowerCase()}${integration.lastSyncedAt ? `, ultima sincronizacion ${formatDate(integration.lastSyncedAt)}` : ""}.`
        )
      : ["No hay integraciones conectadas. Gmail, Outlook e IMAP estan preparados para OAuth futuro."],
    recommendations: connected.length
      ? ["Revisar que las sincronizaciones no procesen correos sin consentimiento explicito."]
      : ["Conectar correo mediante OAuth cuando la configuracion de proveedor este lista."],
    data: {
      integrations,
      connected: connected.length
    }
  });
}

export async function suggestTasksTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const [tasks, risks, kpis] = await Promise.all([
    getPriorityTasksTool(session),
    getOperationalRisksTool(session),
    getLowKpisTool(session)
  ]);
  const suggestions = [
    ...tasks.recommendations,
    ...risks.recommendations,
    ...kpis.recommendations
  ].filter(Boolean).slice(0, 6);

  return buildResult({
    tool: "suggest_tasks",
    label: "Sugerencias de tareas",
    usedData: tasks.usedData || risks.usedData || kpis.usedData,
    findings: suggestions.length
      ? suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`)
      : ["No hay suficiente senal operativa para sugerir tareas nuevas."],
    recommendations: suggestions.length
      ? ["Convertir estas sugerencias en tareas solo despues de validarlas con el responsable operativo."]
      : ["Cargar mas actividad operativa para mejorar sugerencias."],
    data: {
      suggestions
    }
  });
}

export async function createDraftExecutiveReportTool(session: SessionUser): Promise<OrbitAiToolResult> {
  const { companyId, userId } = createToolContext(session, FINANCE_ROLES);
  const [summary, risks, tasks, kpis] = await Promise.all([
    getOperationalSummaryTool(session),
    getOperationalRisksTool(session),
    getPriorityTasksTool(session),
    getLowKpisTool(session)
  ]);
  const now = new Date();
  const title = `Borrador ejecutivo MAIA Executive Agent | ${formatDate(now)}`;
  const summaryText = [
    ...summary.findings.slice(0, 4),
    ...risks.findings.slice(0, 2),
    ...tasks.findings.slice(0, 2),
    ...kpis.findings.slice(0, 2)
  ].join(" ");
  const report = await prisma.executiveReport.create({
    data: {
      companyId,
      generatedById: userId,
      title,
      summary: summaryText || "Borrador ejecutivo generado por MAIA Executive Agent.",
      reportType: ReportType.DAILY,
      periodLabel: "Borrador diario",
      body: asJson({
        draft: true,
        generatedBy: "MAIA Executive Agent",
        findings: {
          summary: summary.findings,
          risks: risks.findings,
          tasks: tasks.findings,
          kpis: kpis.findings
        },
        recommendations: [
          ...summary.recommendations,
          ...risks.recommendations,
          ...tasks.recommendations,
          ...kpis.recommendations
        ].slice(0, 8)
      })
    }
  });

  await prisma.activityLog.create({
    data: {
      companyId,
      userId,
      reportId: report.id,
      type: ActivityLogType.AI,
      title: "MAIA Executive Agent creo un borrador de reporte",
      description: `${report.title} quedo preparado para revision humana.`,
      routePath: "/workspace/orbit-ai",
      metadata: asJson({
        tool: "draft_executive_report",
        reportId: report.id,
        requiresHumanReview: true
      })
    }
  });

  return buildResult({
    tool: "draft_executive_report",
    label: "Borrador de reporte",
    usedData: true,
    findings: [`Cree el borrador ${report.title}.`, "Queda como reporte interno y requiere revision humana antes de compartirlo."],
    recommendations: ["Revisar hallazgos, confirmar responsables y validar datos antes de enviarlo."],
    data: {
      reportId: report.id,
      title: report.title,
      routePath: "/workspace"
    }
  });
}

export async function runOrbitAiTool(
  session: SessionUser,
  toolName: OrbitAiToolName
): Promise<OrbitAiToolResult> {
  switch (toolName) {
    case "operational_summary":
      return getOperationalSummaryTool(session);
    case "delayed_projects":
      return getDelayedProjectsTool(session);
    case "priority_tasks":
      return getPriorityTasksTool(session);
    case "low_kpis":
      return getLowKpisTool(session);
    case "operational_risks":
      return getOperationalRisksTool(session);
    case "pending_quotes":
      return getPendingQuotesTool(session);
    case "pending_invoices":
      return getPendingInvoicesTool(session);
    case "clients_summary":
      return getClientsSummaryTool(session);
    case "tax_profile_status":
      return getTaxProfileStatusTool(session);
    case "integrations_status":
      return getIntegrationsStatusTool(session);
    case "draft_executive_report":
      return createDraftExecutiveReportTool(session);
    case "suggest_tasks":
      return suggestTasksTool(session);
    default:
      throw new ServiceError("Herramienta de MAIA Executive Agent no disponible.", 400);
  }
}
