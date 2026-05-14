import {
  AlertSeverity,
  AutomationStatus,
  MetricTrend,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  type Prisma
} from "@prisma/client";

import type {
  DashboardLinkAction,
  DashboardMetric,
  DashboardSearchItem,
  DashboardStatusItem,
  DashboardTimelineItem
} from "@/lib/dashboard/mock-data";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";

export type ExecutiveCommandCenterData = {
  organizationName: string;
  organizationSector: string | null;
  welcomeTitle: string;
  welcomeSubtitle: string;
  metrics: DashboardMetric[];
  operationalStatus: DashboardStatusItem[];
  activeProjects: DashboardTimelineItem[];
  criticalTasks: DashboardTimelineItem[];
  alerts: DashboardTimelineItem[];
  reports: DashboardTimelineItem[];
  automations: DashboardTimelineItem[];
  activityFeed: DashboardTimelineItem[];
  keyInsights: DashboardTimelineItem[];
  primaryActions: DashboardLinkAction[];
  searchItems: DashboardSearchItem[];
  voiceStatus: {
    available: boolean;
    label: string;
    detail: string;
  };
  aiPromptSuggestions: string[];
};

export type ExecutiveOrganizationSnapshot = Prisma.CompanyGetPayload<{
  include: {
    projects: true;
    tasks: true;
    operationalAlerts: true;
    executiveReports: true;
    automations: true;
    kpis: true;
    operationalMetrics: true;
    teams: {
      include: {
        members: true;
      };
    };
    activityLogs: {
      include: {
        user: true;
      };
    };
    integrations: true;
  };
}>;

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Borrador",
  READY_FOR_MATCHING: "Listo para operar",
  MATCHING_IN_PROGRESS: "Coordinando equipo",
  ASSIGNED: "Asignado",
  ACTIVE: "Activo",
  UNDER_REVIEW: "En revision",
  AT_RISK: "En riesgo",
  AUDIT_IN_PROGRESS: "Auditoria activa",
  ON_HOLD: "En espera",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado"
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Pendiente",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueada",
  COMPLETED: "Completada"
};

const AUTOMATION_STATUS_LABELS: Record<AutomationStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  PAUSED: "Pausada"
};

const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  INFO: "Informativa",
  WARNING: "Advertencia",
  HIGH: "Alta",
  CRITICAL: "Critica"
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short"
  }).format(date);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Sin registro";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function toTaskPriorityLabel(priority: TaskPriority) {
  switch (priority) {
    case TaskPriority.CRITICAL:
      return "Alta";
    case TaskPriority.HIGH:
      return "Alta";
    case TaskPriority.MEDIUM:
      return "Media";
    default:
      return "Baja";
  }
}

function summarizeRole(session: SessionUser) {
  if (session.role === "SUPERADMIN") {
    return "Administracion global";
  }

  return "Operacion ejecutiva";
}

function createFallbackData(session: SessionUser): ExecutiveCommandCenterData {
  return {
    organizationName: "Orbit Nexus",
    organizationSector: null,
    welcomeTitle: `Hola, ${getFirstName(session.fullName)}.`,
    welcomeSubtitle:
      "Tu sistema operativo ejecutivo estara listo cuando la organizacion tenga datos operativos cargados. Puedes empezar creando proyectos, tareas y automatizaciones.",
    metrics: [
      {
        label: "Operacion visible",
        value: "0",
        detail: "Aun no hay entidades operativas suficientes para mostrar lectura ejecutiva.",
        tone: "slate"
      },
      {
        label: "Proyectos activos",
        value: "0",
        detail: "Cuando existan proyectos, apareceran aqui con trazabilidad ejecutiva.",
        tone: "blue"
      },
      {
        label: "Alertas abiertas",
        value: "0",
        detail: "Las alertas inteligentes apareceran cuando el sistema detecte riesgos.",
        tone: "emerald"
      },
      {
        label: "Automatizaciones",
        value: "0",
        detail: "Activa automatizaciones para convertir datos dispersos en acciones visibles.",
        tone: "amber"
      }
    ],
    operationalStatus: [
      {
        label: "Salud operativa",
        value: "Sin datos",
        note: "Carga primero tareas, proyectos y KPI para habilitar la lectura ejecutiva.",
        tone: "slate"
      },
      {
        label: "Asistente MAIA",
        value: "Preparado",
        note: "MAIA ya puede conversar sobre operacion, prioridades y acciones controladas.",
        tone: "blue"
      }
    ],
    activeProjects: [],
    criticalTasks: [],
    alerts: [],
    reports: [],
    automations: [],
    activityFeed: [],
    keyInsights: [],
    primaryActions: [
      { label: "Crear proyecto", href: "/workspace/projects/create" },
      { label: "Abrir MAIA", href: "#orbit-ai" }
    ],
    searchItems: [],
    voiceStatus: {
      available: false,
      label: "Voz preparada",
      detail:
        "La interfaz ya esta lista para integrar wake word, speech-to-text y text-to-speech en una siguiente fase."
    },
    aiPromptSuggestions: [
      "Dame el resumen ejecutivo del dia.",
      "Que proyectos estan en riesgo?",
      "Sugiere proximas acciones."
    ]
  };
}

export async function getExecutiveOrganizationSnapshot(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      projects: {
        orderBy: [{ updatedAt: "desc" }],
        take: 8
      },
      tasks: {
        orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
        take: 10
      },
      operationalAlerts: {
        orderBy: [{ detectedAt: "desc" }],
        take: 8
      },
      executiveReports: {
        orderBy: [{ generatedAt: "desc" }],
        take: 6
      },
      automations: {
        orderBy: [{ updatedAt: "desc" }],
        take: 6
      },
      kpis: {
        orderBy: [{ updatedAt: "desc" }],
        take: 10
      },
      operationalMetrics: {
        orderBy: [{ updatedAt: "desc" }],
        take: 10
      },
      teams: {
        orderBy: [{ name: "asc" }],
        include: {
          members: true
        }
      },
      activityLogs: {
        orderBy: [{ createdAt: "desc" }],
        take: 10,
        include: {
          user: true
        }
      },
      integrations: {
        orderBy: [{ updatedAt: "desc" }],
        take: 6
      }
    }
  });
}

export async function getExecutiveCommandCenterData(
  session: SessionUser
): Promise<ExecutiveCommandCenterData> {
  const companyId = session.companyId ?? session.tenantId;

  if (!companyId) {
    return createFallbackData(session);
  }

  const organization = await getExecutiveOrganizationSnapshot(companyId);

  if (!organization) {
    return createFallbackData(session);
  }

  const activeProjects = organization.projects.filter(
    (project) => project.status !== ProjectStatus.COMPLETED && project.status !== ProjectStatus.CANCELLED
  );
  const tasksAtRisk = organization.tasks.filter(
    (task) => task.status !== TaskStatus.COMPLETED && (task.status === TaskStatus.BLOCKED || task.riskScore >= 70)
  );
  const openAlerts = organization.operationalAlerts.filter((alert) => alert.resolvedAt === null);
  const activeAutomations = organization.automations.filter(
    (automation) => automation.status === AutomationStatus.ACTIVE
  );
  const topKpis = organization.kpis.slice(0, 4);
  const metricsSource = organization.operationalMetrics.slice(0, 4);
  const overallHealth =
    openAlerts.filter((alert) => alert.severity === AlertSeverity.CRITICAL).length > 0
      ? "Atencion inmediata"
      : tasksAtRisk.length > 0
        ? "Vigilancia activa"
        : "Estable";

  const metrics: DashboardMetric[] = [
    {
      label: "Proyectos activos",
      value: String(activeProjects.length),
      detail: "Frentes operativos visibles con seguimiento en tiempo real y trazabilidad ejecutiva.",
      tone: "blue"
    },
    {
      label: "Tareas criticas",
      value: String(tasksAtRisk.length),
      detail: "Bloqueos, vencimientos cercanos o frentes con riesgo alto que requieren decision.",
      tone: tasksAtRisk.length ? "amber" : "emerald"
    },
    {
      label: "Alertas abiertas",
      value: String(openAlerts.length),
      detail: "Riesgos detectados automaticamente para evitar desorden operativo y escalaciones.",
      tone:
        openAlerts.some((alert) => alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.HIGH)
          ? "amber"
          : "emerald"
    },
    {
      label: "Automatizaciones activas",
      value: String(activeAutomations.length),
      detail: "Rutinas listas para ordenar operacion, seguimiento y reporteo sin friccion.",
      tone: activeAutomations.length ? "emerald" : "slate"
    }
  ];

  const operationalStatus: DashboardStatusItem[] = [
    {
      label: "Salud operativa",
      value: overallHealth,
      note: "Lectura sintetica del estado de la operacion segun alertas, tareas y actividad reciente.",
      tone:
        overallHealth === "Atencion inmediata"
          ? "amber"
          : overallHealth === "Vigilancia activa"
            ? "blue"
            : "emerald"
    },
    {
      label: "Equipos activos",
      value: String(organization.teams.filter((team) => team.status === "ACTIVE").length),
      note: "Equipos organizados para operar por frentes, iniciativas o unidades funcionales.",
      tone: "blue"
    },
    {
      label: "Integraciones",
      value: String(organization.integrations.filter((integration) => integration.status === "CONNECTED").length),
      note: "Conectores visibles para consolidar datos y ampliar la inteligencia operativa.",
      tone:
        organization.integrations.some((integration) => integration.status === "DEGRADED")
          ? "amber"
          : "emerald"
    },
    {
      label: "Reportes ejecutivos",
      value: String(organization.executiveReports.length),
      note: "Reportes listos para lectura directiva con foco en decisiones y proximas acciones.",
      tone: "slate"
    }
  ];

  const activeProjectItems: DashboardTimelineItem[] = activeProjects.map((project) => ({
    title: project.name,
    subtitle: `Estado ${PROJECT_STATUS_LABELS[project.status]} | Folio ${project.folio}`,
    meta: `Actualizado ${formatDateTime(project.updatedAt)}`,
    status: `${project.priority} prioridad`,
    href: `/workspace/projects/${project.id}`,
    priority:
      project.status === ProjectStatus.AT_RISK || project.priority === "CRITICAL"
        ? "high"
        : project.priority === "HIGH"
          ? "medium"
          : "low"
  }));

  const criticalTaskItems: DashboardTimelineItem[] = (
    tasksAtRisk.length ? tasksAtRisk : organization.tasks.slice(0, 6)
  ).map((task) => ({
    title: task.title,
    subtitle:
      task.description ??
      `Tarea en estado ${TASK_STATUS_LABELS[task.status]} dentro de la operacion de ${organization.name}.`,
    meta: task.dueAt ? `Vence ${formatDate(task.dueAt)}` : "Sin fecha limite",
    status: TASK_STATUS_LABELS[task.status],
    priority:
      task.priority === TaskPriority.CRITICAL || task.status === TaskStatus.BLOCKED
        ? "high"
        : task.priority === TaskPriority.HIGH
          ? "medium"
          : "low"
  }));

  const alertItems: DashboardTimelineItem[] = openAlerts.map((alert) => ({
    title: alert.title,
    subtitle: alert.description,
    meta: `Detectada ${formatDateTime(alert.detectedAt)}`,
    status: ALERT_SEVERITY_LABELS[alert.severity],
    priority:
      alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.HIGH
        ? "high"
        : alert.severity === AlertSeverity.WARNING
          ? "medium"
          : "low"
  }));

  const reportItems: DashboardTimelineItem[] = organization.executiveReports.map((report) => ({
    title: report.title,
    subtitle: report.summary,
    meta: `${report.periodLabel} | ${formatDateTime(report.generatedAt)}`,
    status: report.reportType,
    priority: "low"
  }));

  const automationItems: DashboardTimelineItem[] = organization.automations.map((automation) => ({
    title: automation.name,
    subtitle:
      automation.description ??
      "Automatizacion configurada para reducir seguimiento manual y mantener visibilidad continua.",
    meta: automation.nextRunAt
      ? `Proxima ejecucion ${formatDateTime(automation.nextRunAt)}`
      : "Sin proxima ejecucion definida",
    status: AUTOMATION_STATUS_LABELS[automation.status],
    priority: automation.status === AutomationStatus.ACTIVE ? "low" : "medium"
  }));

  const activityFeed: DashboardTimelineItem[] = organization.activityLogs.map((event) => ({
    title: event.title,
    subtitle: event.description,
    meta: `${event.user?.fullName ?? summarizeRole(session)} | ${formatDateTime(event.createdAt)}`,
    status: event.type,
    priority: "low"
  }));

  const keyInsights: DashboardTimelineItem[] = [
    ...topKpis.map((kpi) => ({
      title: kpi.name,
      subtitle:
        kpi.summary ??
        `Valor actual ${kpi.value}${kpi.unit ? ` ${kpi.unit}` : ""}${kpi.targetValue ? ` de objetivo ${kpi.targetValue}` : ""}.`,
      meta: `KPI | ${formatDateTime(kpi.lastMeasuredAt ?? kpi.updatedAt)}`,
      status: kpi.trend,
      priority: (kpi.trend === MetricTrend.DOWN ? "high" : "low") as DashboardTimelineItem["priority"]
    })),
    ...metricsSource.map((metric) => ({
      title: metric.name,
      subtitle: `Impacto visible: ${metric.value}${metric.unit ? ` ${metric.unit}` : ""}${metric.benchmark ? ` frente a benchmark ${metric.benchmark}` : ""}.`,
      meta: `Metrica operativa | ${formatDateTime(metric.updatedAt)}`,
      status: metric.trend,
      priority: (metric.trend === MetricTrend.DOWN ? "medium" : "low") as DashboardTimelineItem["priority"]
    }))
  ].slice(0, 6);

  const primaryActions: DashboardLinkAction[] = [
    { label: "Ver como funciona", href: "#executive-projects" },
    { label: "Abrir MAIA", href: "#orbit-ai" },
    { label: "Crear proyecto", href: "/workspace/projects/create" }
  ];

  const searchItems: DashboardSearchItem[] = [
    ...activeProjects.map((project) => ({
      id: `project-${project.id}`,
      type: "project" as const,
      title: project.name,
      subtitle: `${PROJECT_STATUS_LABELS[project.status]} | ${project.folio}`,
      href: `/workspace/projects/${project.id}`,
      keywords: [project.folio, project.name, project.clientContactName ?? organization.name]
    })),
    ...organization.tasks.map((task) => ({
      id: `task-${task.id}`,
      type: "action" as const,
      title: task.title,
      subtitle: `${TASK_STATUS_LABELS[task.status]} | ${toTaskPriorityLabel(task.priority)}`,
      href: "#executive-tasks",
      keywords: [task.title, task.status, task.priority]
    })),
    ...openAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      type: "activity" as const,
      title: alert.title,
      subtitle: `${ALERT_SEVERITY_LABELS[alert.severity]} | ${alert.status}`,
      href: "#executive-alerts",
      keywords: [alert.title, alert.severity, alert.status]
    })),
    ...organization.teams.map((team) => ({
      id: `team-${team.id}`,
      type: "user" as const,
      title: team.name,
      subtitle: `${team.members.length} miembros | ${team.status}`,
      href: "#executive-teams",
      keywords: [team.name, team.slug, team.description ?? ""]
    }))
  ];

  const aiPromptSuggestions =
    openAlerts.length > 0
      ? [
          "¿Qué proyectos están en riesgo?",
          "Resume el estado operativo.",
          "Sugiere próximas acciones."
        ]
      : [
          "Dame el resumen ejecutivo del día.",
          "¿Qué KPI está más bajo?",
          "Detecta cuellos de botella."
        ];

  return {
    organizationName: organization.name,
    organizationSector: organization.sector ?? null,
    welcomeTitle: `Hola, ${getFirstName(session.fullName)}.`,
    welcomeSubtitle:
      "Organiza, analiza y decide con inteligencia operativa. Orbit Nexus funciona como CEO Operating System para convertir datos dispersos en decisiones claras.",
    metrics,
    operationalStatus,
    activeProjects: activeProjectItems,
    criticalTasks: criticalTaskItems,
    alerts: alertItems,
    reports: reportItems,
    automations: automationItems,
    activityFeed,
    keyInsights,
    primaryActions,
    searchItems,
    voiceStatus: {
      available: false,
      label: "MAIA lista para voz",
      detail:
        "MAIA ya puede evolucionar hacia wake word, speech-to-text y respuestas por voz sin rehacer la interfaz."
    },
    aiPromptSuggestions
  };
}
