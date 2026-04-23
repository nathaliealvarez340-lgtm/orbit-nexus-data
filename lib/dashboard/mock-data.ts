import {
  AUTHORIZED_CONSULTANT_NAMES,
  AUTHORIZED_LEADER_NAMES,
  consultantDirectoryUsers
} from "@/lib/directory/authorized-users";
import { normalizeName } from "@/lib/normalization";
import type { SessionUser } from "@/types/auth";

export type DashboardLinkAction = {
  label: string;
  href: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "emerald" | "amber" | "slate";
};

export type DashboardProjectStatus =
  | "approved"
  | "in_progress"
  | "at_risk"
  | "rejected_1"
  | "rejected_2"
  | "escalated"
  | "completed";

export type DashboardProjectPriority = "HIGH" | "MEDIUM" | "LOW";

export type DashboardNotificationCategory =
  | "critical"
  | "follow_up"
  | "activity"
  | "assignment"
  | "validation";

export type DashboardConsultantAvailability = "available" | "partial" | "unavailable";
export type DashboardConsultantBadgeTone = "blue" | "emerald" | "amber" | "slate";

export type DashboardConsultantBadge = {
  id: string;
  label: string;
  description: string;
  tone: DashboardConsultantBadgeTone;
};

export type DashboardConsultantKpiSnapshot = {
  deliveryCompliance: number;
  responseTimeMinutes: number;
  qualityScore: number;
};

export type DashboardConsultantKpiItem = {
  id: string;
  label: string;
  value: string;
  note: string;
  progress: number;
  tone: DashboardMetric["tone"];
};

export type DashboardProjectRisk = {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  openedAt: string;
};

export type DashboardProjectMilestone = {
  id: string;
  title: string;
  date: string;
  status: "upcoming" | "in_progress" | "completed";
};

export type DashboardProjectEventType =
  | "created"
  | "assigned"
  | "rejected"
  | "reassigned"
  | "progress"
  | "alert"
  | "approved";

export type DashboardProjectEvent = {
  id: string;
  type: DashboardProjectEventType;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  href?: string;
};

export type DashboardProjectRecord = {
  id: string;
  tenantId: string | null;
  slug: string;
  folio: string;
  name: string;
  client: string;
  description: string;
  status: DashboardProjectStatus;
  priority: DashboardProjectPriority;
  progress: number;
  startDate: string;
  endDate: string;
  leader: string;
  consultantsRequired: number;
  assignedConsultants: number;
  rejectionCount: number;
  lastUpdate: string;
  href: string;
  type?: string;
  requiredSkills: string[];
  attachments: string[];
  openRisks: DashboardProjectRisk[];
  milestones: DashboardProjectMilestone[];
  timeline: DashboardProjectEvent[];
};

export type DashboardTimelineItem = {
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  href?: string;
  priority?: "high" | "medium" | "low";
  actions?: DashboardLinkAction[];
  project?: DashboardProjectRecord;
};

export type DashboardStatusItem = {
  label: string;
  value: string;
  note: string;
  progress?: number;
  tone?: "blue" | "emerald" | "amber" | "slate";
};

export type DashboardRecommendation = {
  eyebrow: string;
  title: string;
  summary: string;
  primaryAction: DashboardLinkAction;
  secondaryAction?: DashboardLinkAction;
};

export type DashboardSearchItem = {
  id: string;
  type: "project" | "action" | "activity" | "user";
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
};

export type LeaderNotification = {
  id: string;
  tenantId: string | null;
  title: string;
  description: string;
  timestamp: string;
  category: DashboardNotificationCategory;
  priority: "high" | "medium" | "low";
  projectFolio?: string;
  relatedLabel?: string;
  href?: string;
  ctaLabel?: string;
  unread?: boolean;
};

export type LeaderChatMessage = {
  id: string;
  sender: "leader" | "consultant";
  text: string;
  timestamp: string;
};

export type LeaderConversation = {
  id: string;
  tenantId: string | null;
  consultantName: string;
  consultantStatus: "active" | "pending" | "busy";
  projectSlug: string;
  projectFolio: string;
  projectName: string;
  projectHref: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  messages: LeaderChatMessage[];
};

export type DashboardConsultantRecord = {
  id: string;
  tenantId: string | null;
  companyId: string | null;
  fullName: string;
  email?: string;
  specialty: string;
  roleLabel: string;
  skills: string[];
  availability: DashboardConsultantAvailability;
  occupancyPercent: number;
  assignedProjectSlugs: string[];
  professionalStatus: string;
  badges: DashboardConsultantBadge[];
  kpiSnapshot: DashboardConsultantKpiSnapshot;
  note: string;
};

export type LeaderDashboardMock = {
  metrics: DashboardMetric[];
  recentProjects: DashboardTimelineItem[];
  interventionProjects: DashboardTimelineItem[];
  alerts: DashboardTimelineItem[];
  teamActivity: DashboardTimelineItem[];
  operationStatus: DashboardStatusItem[];
  recommendedAction: DashboardRecommendation;
  quickActions: DashboardLinkAction[];
  notifications: LeaderNotification[];
  conversations: LeaderConversation[];
};

export type ConsultantDashboardMock = {
  metrics: DashboardMetric[];
  consultantProfile: DashboardConsultantRecord;
  myProjects: DashboardTimelineItem[];
  workflowStatus: DashboardStatusItem[];
  upcomingDeliverables: DashboardTimelineItem[];
  progressHistory: DashboardTimelineItem[];
  recentAssets: DashboardTimelineItem[];
  leaderFeedback: DashboardTimelineItem[];
  recommendedAction: DashboardRecommendation;
  quickActions: DashboardLinkAction[];
};

export type ClientDashboardMock = {
  metrics: DashboardMetric[];
  activeProject: DashboardTimelineItem;
  assignedConsultant: DashboardConsultantRecord | null;
  projectProgress: DashboardStatusItem[];
  recentDeliverables: DashboardTimelineItem[];
  validations: DashboardTimelineItem[];
  recommendedAction: DashboardRecommendation;
  quickActions: DashboardLinkAction[];
};

export type CreateProjectInput = {
  name: string;
  description: string;
  client: string;
  clientEmail?: string;
  consultantsRequired: number;
  startDate: string;
  endDate: string;
  priority: DashboardProjectPriority;
  projectType?: string;
  attachments: string[];
  folio?: string;
};

export type CreateConsultantInput = {
  fullName: string;
  email: string;
  skills: string[];
  specialty: string;
  availability: DashboardConsultantAvailability;
  professionalStatus: string;
  deliveryCompliance: number;
  responseTimeMinutes: number;
  qualityScore: number;
  note?: string;
};

type BaseProjectSeed = Omit<DashboardProjectRecord, "tenantId" | "folio" | "href"> & {
  sequence: number;
};

function resolveTenantId(companyId: string | null | undefined) {
  return companyId ?? null;
}

const [
  valeriaLeaderName,
  lesslieLeaderName,
  yaharaLeaderName,
  paolaLeaderName
] = AUTHORIZED_LEADER_NAMES;
const [maricelaConsultantName, davidConsultantName, claudiaConsultantName, sofiaConsultantName] =
  AUTHORIZED_CONSULTANT_NAMES;

const dashboardProjectSeeds: BaseProjectSeed[] = [
  {
    sequence: 1,
    id: "project-expansion-operativa-norte",
    slug: "expansion-operativa-norte",
    name: "Expansion Operativa Norte",
    client: "Grupo Solaris",
    description:
      "Programa de reorganizacion operativa para estabilizar la region norte y sostener el ritmo de entrega ejecutivo.",
    status: "in_progress",
    priority: "HIGH",
    progress: 76,
    startDate: "2026-03-18",
    endDate: "2026-04-30",
    leader: lesslieLeaderName,
    consultantsRequired: 2,
    assignedConsultants: 2,
    rejectionCount: 0,
    lastUpdate: "Hace 12 min",
    type: "Transformacion operativa",
    requiredSkills: ["Operacion regional", "PMO", "Control ejecutivo", "Calidad"],
    attachments: ["resumen-ejecutivo-v4.pdf", "matriz-riesgos-norte.xlsx"],
    openRisks: [
      {
        id: "risk-expansion-operativa-norte-1",
        title: "Validacion final pendiente",
        description: "El cliente aun no confirma el entregable ejecutivo de la semana y puede retrasar el siguiente hito.",
        severity: "medium",
        openedAt: "Hace 1 h"
      }
    ],
    milestones: [
      {
        id: "milestone-expansion-operativa-norte-1",
        title: "Revision ejecutiva regional",
        date: "2026-04-21",
        status: "upcoming"
      },
      {
        id: "milestone-expansion-operativa-norte-2",
        title: "Cierre de estabilizacion operativa",
        date: "2026-04-30",
        status: "in_progress"
      }
    ],
    timeline: [
      {
        id: "expansion-operativa-norte-created",
        type: "created",
        title: "Proyecto creado",
        description: "Se registro el frente operativo con alcance regional y plan de arranque.",
        timestamp: "18 Mar 2026 | 09:10",
        actor: lesslieLeaderName
      },
      {
        id: "expansion-operativa-norte-assigned",
        type: "assigned",
        title: "Consultores asignados",
        description: "Se confirmaron 4 consultores para cubrir operaciones, PMO y calidad.",
        timestamp: "19 Mar 2026 | 11:30",
        actor: "Coordinacion Orbit Nexus"
      },
      {
        id: "expansion-operativa-norte-progress",
        type: "progress",
        title: "Avance ejecutivo reportado",
        description: `${maricelaConsultantName} cargo la ultima lectura de capacidad y hallazgos del cliente.`,
        timestamp: "Hoy | 09:35",
        actor: maricelaConsultantName,
        href: "/workspace/projects/expansion-operativa-norte"
      }
    ]
  },
  {
    sequence: 2,
    id: "project-transformacion-comercial-q3",
    slug: "transformacion-comercial-q3",
    name: "Transformacion Comercial Q3",
    client: "Atlas Partners",
    description:
      "Frente de alineacion comercial con foco en entregables intermedios, aprobaciones y control de riesgo operativo.",
    status: "at_risk",
    priority: "MEDIUM",
    progress: 58,
    startDate: "2026-04-01",
    endDate: "2026-05-12",
    leader: valeriaLeaderName,
    consultantsRequired: 2,
    assignedConsultants: 1,
    rejectionCount: 1,
    lastUpdate: "Hace 48 min",
    type: "Operacion comercial",
    requiredSkills: ["Pipeline comercial", "Revenue ops", "Visualizacion ejecutiva"],
    attachments: ["mapa-riesgos-comerciales.pptx", "cronograma-comercial-q3.pdf"],
    openRisks: [
      {
        id: "risk-transformacion-comercial-q3-1",
        title: "Retraso en aprobacion intermedia",
        description: "Atlas Partners necesita una decision del lider para liberar el siguiente entregable.",
        severity: "high",
        openedAt: "Hace 48 min"
      },
      {
        id: "risk-transformacion-comercial-q3-2",
        title: "Capacidad incompleta",
        description: "Aun falta cubrir una posicion consultiva para absorber el cierre del trimestre.",
        severity: "medium",
        openedAt: "Hace 3 h"
      }
    ],
    milestones: [
      {
        id: "milestone-transformacion-comercial-q3-1",
        title: "Entrega de narrativa ejecutiva",
        date: "2026-04-22",
        status: "upcoming"
      },
      {
        id: "milestone-transformacion-comercial-q3-2",
        title: "Aprobacion de ajuste comercial",
        date: "2026-04-24",
        status: "in_progress"
      }
    ],
    timeline: [
      {
        id: "transformacion-comercial-q3-created",
        type: "created",
        title: "Proyecto creado",
        description: "Se definio el frente para ajustar el pipeline comercial del trimestre.",
        timestamp: "01 Abr 2026 | 08:45",
        actor: valeriaLeaderName
      },
      {
        id: "transformacion-comercial-q3-rejected-1",
        type: "rejected",
        title: "Asignacion rechazada",
        description: "Un consultor rechazo la primera propuesta por traslape con otro frente.",
        timestamp: "03 Abr 2026 | 16:20",
        actor: "Sistema de matching"
      },
      {
        id: "transformacion-comercial-q3-alert",
        type: "alert",
        title: "Proyecto en riesgo",
        description: "Atlas Partners pidio acelerar el entregable y el proyecto entro en riesgo controlado.",
        timestamp: "Hoy | 07:50",
        actor: "Sistema de incidencias",
        href: "/workspace/actions/atender-alerta?project=transformacion-comercial-q3"
      }
    ]
  },
  {
    sequence: 3,
    id: "project-implementacion-crm-regional",
    slug: "implementacion-crm-regional",
    name: "Implementacion CRM Regional",
    client: "Nova Holding",
    description:
      "Implementacion inicial para unificar el seguimiento comercial y arrancar el nuevo modelo de servicio regional.",
    status: "rejected_2",
    priority: "HIGH",
    progress: 24,
    startDate: "2026-04-09",
    endDate: "2026-05-20",
    leader: yaharaLeaderName,
    consultantsRequired: 2,
    assignedConsultants: 0,
    rejectionCount: 2,
    lastUpdate: "Hace 2 h",
    type: "CRM y servicio",
    requiredSkills: ["CRM", "Adopcion comercial", "Implementacion regional"],
    attachments: ["blueprint-crm-regional.docx"],
    openRisks: [
      {
        id: "risk-implementacion-crm-regional-1",
        title: "Sin consultor confirmado",
        description: "El proyecto ya alcanzo el umbral de rechazo y requiere intervencion manual inmediata.",
        severity: "high",
        openedAt: "Hace 2 h"
      }
    ],
    milestones: [
      {
        id: "milestone-implementacion-crm-regional-1",
        title: "Kickoff con cliente",
        date: "2026-04-23",
        status: "upcoming"
      },
      {
        id: "milestone-implementacion-crm-regional-2",
        title: "Blueprint funcional aprobado",
        date: "2026-04-29",
        status: "upcoming"
      }
    ],
    timeline: [
      {
        id: "implementacion-crm-regional-created",
        type: "created",
        title: "Proyecto creado",
        description: "Se aprobo el arranque del CRM regional con una ventana corta de implementacion.",
        timestamp: "09 Abr 2026 | 10:15",
        actor: yaharaLeaderName
      },
      {
        id: "implementacion-crm-regional-rejected-1",
        type: "rejected",
        title: "Primer rechazo de asignacion",
        description: "La primera propuesta de consultor fue rechazada por incompatibilidad de calendario.",
        timestamp: "10 Abr 2026 | 13:40",
        actor: "Sistema de matching"
      },
      {
        id: "implementacion-crm-regional-rejected-2",
        type: "rejected",
        title: "Segundo rechazo de asignacion",
        description: "El proyecto alcanzo el umbral de rechazo y ya requiere asignacion manual.",
        timestamp: "Hoy | 08:16",
        actor: "Sistema de matching",
        href: "/workspace/projects/implementacion-crm-regional#assignment"
      }
    ]
  },
  {
    sequence: 4,
    id: "project-programa-eficiencia-digital",
    slug: "programa-eficiencia-digital",
    name: "Programa de Eficiencia Digital",
    client: "Nova Holding",
    description:
      "Cierre ejecutivo del programa de eficiencia con KPIs validados, entregables consolidados y trazabilidad operativa completa.",
    status: "completed",
    priority: "LOW",
    progress: 100,
    startDate: "2026-02-10",
    endDate: "2026-04-04",
    leader: paolaLeaderName,
    consultantsRequired: 1,
    assignedConsultants: 1,
    rejectionCount: 0,
    lastUpdate: "08 Abr 2026 | 18:10",
    type: "Eficiencia digital",
    requiredSkills: ["Automatizacion", "Trazabilidad KPI", "Operacion digital"],
    attachments: ["cierre-ejecutivo-vfinal.pdf", "trazabilidad-kpi.xlsx"],
    openRisks: [],
    milestones: [
      {
        id: "milestone-programa-eficiencia-digital-1",
        title: "Cierre final validado",
        date: "2026-04-04",
        status: "completed"
      }
    ],
    timeline: [
      {
        id: "programa-eficiencia-digital-created",
        type: "created",
        title: "Proyecto creado",
        description: "Se abrio el programa para consolidar automatizacion y control ejecutivo.",
        timestamp: "10 Feb 2026 | 09:00",
        actor: paolaLeaderName
      },
      {
        id: "programa-eficiencia-digital-approved",
        type: "approved",
        title: "Cierre aprobado",
        description: "El cliente valido los entregables finales y se cerro el programa.",
        timestamp: "04 Abr 2026 | 17:45",
        actor: "Nova Holding",
        href: "/workspace/projects/programa-eficiencia-digital"
      }
    ]
  }
];

const baseConversationSeeds = [
  {
    id: "leader-conversation-1",
    consultantName: maricelaConsultantName,
    projectSlug: "expansion-operativa-norte",
    lastMessage: "Ya quedo cargado el resumen ejecutivo con los cambios del cliente.",
    time: "09:42",
    consultantStatus: "active" as const,
    unreadCount: 2,
    messages: [
      {
        id: "leader-conversation-1-message-1",
        sender: "consultant" as const,
        text: "Traigo el reporte consolidado y la nueva lectura de capacidad para la region norte.",
        timestamp: "09:18"
      },
      {
        id: "leader-conversation-1-message-2",
        sender: "leader" as const,
        text: "Necesito el foco en riesgos y la siguiente decision sugerida para presentarla al cliente.",
        timestamp: "09:27"
      },
      {
        id: "leader-conversation-1-message-3",
        sender: "consultant" as const,
        text: "Ya quedo cargado el resumen ejecutivo con los cambios del cliente.",
        timestamp: "09:42"
      }
    ]
  },
  {
    id: "leader-conversation-2",
    consultantName: davidConsultantName,
    projectSlug: "implementacion-crm-regional",
    lastMessage: "Necesito tu visto bueno para mover la sesion de kickoff a las 16:00.",
    time: "08:16",
    consultantStatus: "pending" as const,
    unreadCount: 1,
    messages: [
      {
        id: "leader-conversation-2-message-1",
        sender: "consultant" as const,
        text: "El cliente confirmo asistencia parcial para el kickoff y me pide moverlo una hora.",
        timestamp: "08:05"
      },
      {
        id: "leader-conversation-2-message-2",
        sender: "consultant" as const,
        text: "Necesito tu visto bueno para mover la sesion de kickoff a las 16:00.",
        timestamp: "08:16"
      }
    ]
  },
  {
    id: "leader-conversation-3",
    consultantName: claudiaConsultantName,
    projectSlug: "transformacion-comercial-q3",
    lastMessage: "Si aprobamos hoy el ajuste, puedo absorber el riesgo sin escalar a auditoria.",
    time: "Ayer",
    consultantStatus: "busy" as const,
    unreadCount: 0,
    messages: [
      {
        id: "leader-conversation-3-message-1",
        sender: "leader" as const,
        text: "Necesito una lectura clara del riesgo y una propuesta de ajuste antes del corte de esta tarde.",
        timestamp: "Ayer | 18:10"
      },
      {
        id: "leader-conversation-3-message-2",
        sender: "consultant" as const,
        text: "Si aprobamos hoy el ajuste, puedo absorber el riesgo sin escalar a auditoria.",
        timestamp: "Ayer | 18:22"
      }
    ]
  }
];

const baseConsultantSeeds: Omit<DashboardConsultantRecord, "tenantId" | "companyId">[] = [
  {
    id: "consultant-maricela-fonseca-alvarez",
    fullName: maricelaConsultantName,
    email: consultantDirectoryUsers[0]?.email,
    specialty: "Consultora PMO operativa",
    roleLabel: "Consultora senior",
    skills: ["Operacion regional", "PMO", "Control ejecutivo"],
    availability: "available",
    occupancyPercent: 46,
    assignedProjectSlugs: ["expansion-operativa-norte"],
    professionalStatus: "Disponible para frentes de coordinacion critica",
    badges: [
      {
        id: "badge-maricela-cumplimiento",
        label: "Alto cumplimiento",
        description: "Mantiene consistencia en entregas semanales y validaciones del lider.",
        tone: "emerald"
      },
      {
        id: "badge-maricela-respuesta",
        label: "Respuesta rapida",
        description: "Responde decisiones y aclaraciones con tiempos de reaccion bajos.",
        tone: "blue"
      },
      {
        id: "badge-maricela-recomendada",
        label: "Perfil recomendado",
        description: "Tiene buen ajuste para operaciones con multiples frentes simultaneos.",
        tone: "slate"
      }
    ],
    kpiSnapshot: {
      deliveryCompliance: 96,
      responseTimeMinutes: 18,
      qualityScore: 94
    },
    note: "Disponible para reforzar decisiones ejecutivas y seguimiento regional."
  },
  {
    id: "consultant-david-saavedra-ponce",
    fullName: davidConsultantName,
    email: consultantDirectoryUsers[1]?.email,
    specialty: "Consultor CRM y automatizacion",
    roleLabel: "Consultor especialista",
    skills: ["CRM", "Implementacion regional", "Automatizacion", "Adopcion comercial"],
    availability: "partial",
    occupancyPercent: 64,
    assignedProjectSlugs: ["transformacion-comercial-q3"],
    professionalStatus: "Disponible parcialmente para proyectos de transformacion comercial y CRM",
    badges: [
      {
        id: "badge-david-validado",
        label: "Especialista validado",
        description: "Perfil con experiencia comprobada en frentes de CRM y adopcion comercial.",
        tone: "blue"
      },
      {
        id: "badge-david-ejecucion",
        label: "Ejecucion constante",
        description: "Sostiene seguimiento continuo sobre implementaciones tecnicas.",
        tone: "emerald"
      },
      {
        id: "badge-david-cliente",
        label: "Validado por cliente",
        description: "Recibe buena percepcion en kickoffs y sesiones de alineacion.",
        tone: "amber"
      }
    ],
    kpiSnapshot: {
      deliveryCompliance: 91,
      responseTimeMinutes: 20,
      qualityScore: 91
    },
    note: "Disponible parcialmente para arranques y configuraciones regionales."
  },
  {
    id: "consultant-claudia-jimenez-sanchez",
    fullName: claudiaConsultantName,
    email: consultantDirectoryUsers[2]?.email,
    specialty: "Consultora de revenue operations",
    roleLabel: "Consultora estrategica",
    skills: ["Revenue ops", "Pipeline comercial", "Visualizacion ejecutiva"],
    availability: "partial",
    occupancyPercent: 58,
    assignedProjectSlugs: ["expansion-operativa-norte"],
    professionalStatus: "Disponible con carga parcial y buen criterio para lectura comercial",
    badges: [
      {
        id: "badge-claudia-cumplimiento",
        label: "Alto cumplimiento",
        description: "Mantiene entregas y lecturas ejecutivas bajo presion comercial.",
        tone: "emerald"
      },
      {
        id: "badge-claudia-recomendada",
        label: "Perfil recomendado",
        description: "Aporta criterio para proyectos comerciales en riesgo.",
        tone: "slate"
      },
      {
        id: "badge-claudia-respuesta",
        label: "Respuesta rapida",
        description: "Escala y responde observaciones del lider con rapidez.",
        tone: "blue"
      }
    ],
    kpiSnapshot: {
      deliveryCompliance: 90,
      responseTimeMinutes: 22,
      qualityScore: 92
    },
    note: "Cubre frentes comerciales con foco en riesgo y aprobacion ejecutiva."
  },
  {
    id: "consultant-sofia-jimena-lopez-sanchez",
    fullName: sofiaConsultantName,
    email: consultantDirectoryUsers[3]?.email,
    specialty: "Consultora de calidad y seguimiento",
    roleLabel: "Consultora de control",
    skills: ["Calidad", "Operacion regional", "Automatizacion", "Seguimiento"],
    availability: "partial",
    occupancyPercent: 71,
    assignedProjectSlugs: ["programa-eficiencia-digital"],
    professionalStatus: "Disponible parcialmente para auditoria operativa y seguimiento",
    badges: [
      {
        id: "badge-sofia-especialista",
        label: "Especialista validado",
        description: "Destaca en control de calidad y seguimiento operativo sensible.",
        tone: "blue"
      },
      {
        id: "badge-sofia-ejecucion",
        label: "Ejecucion constante",
        description: "Mantiene continuidad en frentes con trazabilidad fina.",
        tone: "emerald"
      },
      {
        id: "badge-sofia-cliente",
        label: "Validado por cliente",
        description: "Sostiene una relacion clara en cierres y entregables sensibles.",
        tone: "amber"
      }
    ],
    kpiSnapshot: {
      deliveryCompliance: 94,
      responseTimeMinutes: 26,
      qualityScore: 95
    },
    note: "Buen ajuste para operaciones complejas con foco en control y cumplimiento."
  }
];

function createSearchText(value: string) {
  return value.trim().toLowerCase();
}

function dedupeSearchItems(items: DashboardSearchItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.type}:${item.href}:${item.title}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function cloneProjectEvent(event: DashboardProjectEvent): DashboardProjectEvent {
  return { ...event };
}

function cloneConsultant(consultant: DashboardConsultantRecord): DashboardConsultantRecord {
  return normalizeConsultantRecord(consultant);
}

export function normalizeConsultantRecord(
  consultant: DashboardConsultantRecord
): DashboardConsultantRecord {
  const legacySpecialty = consultant.skills?.[0] ?? "Consultoria operativa";
  const assignedProjectSlugs = Array.isArray(consultant.assignedProjectSlugs)
    ? [...consultant.assignedProjectSlugs]
    : [];
  const tenantId = resolveTenantId(consultant.tenantId ?? consultant.companyId);

  return {
    ...consultant,
    tenantId,
    companyId: consultant.companyId ?? tenantId,
    email: consultant.email?.trim().toLowerCase() || undefined,
    specialty: consultant.specialty ?? legacySpecialty,
    roleLabel: consultant.roleLabel ?? "Consultor operativo",
    skills: Array.isArray(consultant.skills) ? [...consultant.skills] : [],
    assignedProjectSlugs,
    professionalStatus:
      consultant.professionalStatus ??
      (consultant.availability === "available"
        ? "Disponible para nuevos frentes"
        : consultant.availability === "partial"
          ? "Con carga parcial y margen controlado"
          : "No disponible actualmente"),
    badges: Array.isArray(consultant.badges)
      ? consultant.badges.map((badge) => ({ ...badge }))
      : [
          {
            id: `${consultant.id}-badge-base`,
            label: "Perfil recomendado",
            description: "Perfil operativo listo para asignacion segun disponibilidad actual.",
            tone: "slate"
          }
        ],
    kpiSnapshot: consultant.kpiSnapshot
      ? {
          deliveryCompliance:
            typeof consultant.kpiSnapshot.deliveryCompliance === "number"
              ? consultant.kpiSnapshot.deliveryCompliance
              : 88,
          responseTimeMinutes:
            typeof consultant.kpiSnapshot.responseTimeMinutes === "number"
              ? consultant.kpiSnapshot.responseTimeMinutes
              : 24,
          qualityScore:
            typeof consultant.kpiSnapshot.qualityScore === "number"
              ? consultant.kpiSnapshot.qualityScore
              : 90
        }
      : {
          deliveryCompliance: 88,
          responseTimeMinutes: 24,
          qualityScore: 90
        },
    note:
      consultant.note ??
      "Perfil operativo listo para asignacion con lectura de capacidad y KPIs visibles."
  };
}

function buildConsultantBadgesFromInput(input: CreateConsultantInput): DashboardConsultantBadge[] {
  const normalizedId = normalizeName(input.fullName).replace(/\s+/g, "-");
  const badges: DashboardConsultantBadge[] = [];

  if (input.deliveryCompliance >= 92) {
    badges.push({
      id: `badge-${normalizedId}-delivery`,
      label: "Alto cumplimiento",
      description: "Historial inicial fuerte de entregas a tiempo y seguimiento operativo consistente.",
      tone: "emerald"
    });
  }

  if (input.responseTimeMinutes <= 20) {
    badges.push({
      id: `badge-${normalizedId}-response`,
      label: "Respuesta rapida",
      description: "Tiempo de respuesta competitivo para decisiones y seguimiento diario.",
      tone: "blue"
    });
  }

  if (input.qualityScore >= 90) {
    badges.push({
      id: `badge-${normalizedId}-quality`,
      label: "Especialista validado",
      description: "Calidad percibida por encima del umbral minimo de asignacion.",
      tone: "amber"
    });
  }

  if (!badges.length) {
    badges.push({
      id: `badge-${normalizedId}-recommended`,
      label: "Perfil recomendado",
      description: "Perfil operativo listo para entrar al matching interno del tenant.",
      tone: "slate"
    });
  }

  return badges.slice(0, 3);
}

export function normalizeProjectRecord(project: DashboardProjectRecord): DashboardProjectRecord {
  return {
    ...project,
    tenantId: resolveTenantId(project.tenantId),
    attachments: Array.isArray(project.attachments) ? [...project.attachments] : [],
    requiredSkills: Array.isArray(project.requiredSkills) ? [...project.requiredSkills] : [],
    openRisks: Array.isArray(project.openRisks) ? project.openRisks.map((risk) => ({ ...risk })) : [],
    milestones: Array.isArray(project.milestones)
      ? project.milestones.map((milestone) => ({
          ...milestone,
          status:
            milestone.status === "completed" || milestone.status === "in_progress"
              ? milestone.status
              : "upcoming"
        }))
      : [],
    timeline: Array.isArray(project.timeline) ? project.timeline.map(cloneProjectEvent) : [],
    consultantsRequired:
      typeof project.consultantsRequired === "number" && Number.isFinite(project.consultantsRequired)
        ? project.consultantsRequired
        : 1,
    assignedConsultants:
      typeof project.assignedConsultants === "number" && Number.isFinite(project.assignedConsultants)
        ? project.assignedConsultants
        : 0,
    rejectionCount:
      typeof project.rejectionCount === "number" && Number.isFinite(project.rejectionCount)
        ? project.rejectionCount
        : 0,
    type: project.type ?? undefined,
    lastUpdate: project.lastUpdate || "Sin actividad reciente"
  };
}

function cloneProject(project: DashboardProjectRecord): DashboardProjectRecord {
  return normalizeProjectRecord(project);
}

function createProjectRecordFromSeed(
  seed: BaseProjectSeed,
  tenantId: string | null
): DashboardProjectRecord {
  return {
    ...seed,
    tenantId,
    folio: `PRJ-2026-${String(seed.sequence).padStart(4, "0")}`,
    href: `/workspace/projects/${seed.slug}`
  };
}

function sortProjectsForLeader(projects: DashboardProjectRecord[]) {
  return [...projects].sort((left, right) => {
    const leftWeight = getProjectPriorityWeight(left.priority) + left.rejectionCount * 20 + left.progress;
    const rightWeight = getProjectPriorityWeight(right.priority) + right.rejectionCount * 20 + right.progress;

    return rightWeight - leftWeight;
  });
}

function getProjectPriorityWeight(priority: DashboardProjectPriority) {
  const weights: Record<DashboardProjectPriority, number> = {
    HIGH: 300,
    MEDIUM: 200,
    LOW: 100
  };

  return weights[priority];
}

function deriveConsultantAvailability(
  occupancyPercent: number
): DashboardConsultantAvailability {
  if (occupancyPercent >= 85) {
    return "unavailable";
  }

  if (occupancyPercent >= 60) {
    return "partial";
  }

  return "available";
}

function getTimelinePriority(priority: DashboardProjectPriority): DashboardTimelineItem["priority"] {
  const priorityMap: Record<DashboardProjectPriority, DashboardTimelineItem["priority"]> = {
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low"
  };

  return priorityMap[priority];
}

function createProjectSearchItems(items: DashboardTimelineItem[]) {
  return items
    .map<DashboardSearchItem | null>((item, index) => {
      const project = item.project ? normalizeProjectRecord(item.project) : undefined;
      const href = project?.href ?? item.href;

      if (!href) {
        return null;
      }

      const title = project ? `${project.folio} | ${project.name}` : item.title;
      const subtitle = project ? `${project.client} | ${getProjectStatusLabel(project.status)}` : item.subtitle;
      const keywords = project
        ? [
            project.folio,
            project.name,
            project.client,
            project.description,
            getProjectStatusLabel(project.status),
            getProjectPriorityLabel(project.priority),
            project.leader,
            project.lastUpdate,
            String(project.rejectionCount),
            ...project.requiredSkills
          ]
        : [item.title, item.subtitle, item.status, item.meta];

      return {
        id: `project-${index}-${href}`,
        type: "project",
        title,
        subtitle,
        href,
        keywords: keywords.map(createSearchText)
      };
    })
    .filter((item): item is DashboardSearchItem => item !== null);
}

function createActivitySearchItems(items: DashboardTimelineItem[]) {
  return items
    .map<DashboardSearchItem | null>((item, index) => {
      const href = item.actions?.[0]?.href ?? item.href;

      if (!href) {
        return null;
      }

      return {
        id: `activity-${index}-${href}`,
        type: "activity",
        title: item.title,
        subtitle: item.subtitle,
        href,
        keywords: [item.title, item.subtitle, item.status, item.meta].map(createSearchText)
      };
    })
    .filter((item): item is DashboardSearchItem => item !== null);
}

function createActionSearchItems(actions: DashboardLinkAction[], context: string) {
  return actions.map<DashboardSearchItem>((action, index) => ({
    id: `action-${context}-${index}-${action.href}`,
    type: "action",
    title: action.label,
    subtitle: context,
    href: action.href,
    keywords: [action.label, context].map(createSearchText)
  }));
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return `${day} ${monthLabels[Number(month) - 1] ?? month} ${year}`;
}

function buildLeaderAlerts(projects: DashboardProjectRecord[]) {
  const alerts: DashboardTimelineItem[] = [];

  const atRiskProjects = projects.filter((project) => project.status === "at_risk" || project.status === "escalated");
  const manualAssignmentProjects = projects.filter((project) => requiresManualAssignment(project));

  for (const project of atRiskProjects) {
    alerts.push({
      title: project.status === "escalated" ? "Proyecto escalado" : "Proyecto en riesgo",
      subtitle: `${project.folio} | ${project.client} requiere una decision de priorizacion hoy.`,
      meta: `Ultima actualizacion ${project.lastUpdate}`,
      status: project.status === "escalated" ? "Escalado" : "Atencion requerida",
      priority: project.priority === "HIGH" ? "high" : "medium",
      actions: [
        {
          label: "Ver alertas",
          href: `${project.href}#risks`
        },
        {
          label: "Abrir proyecto",
          href: project.href
        }
      ],
      project
    });
  }

  for (const project of manualAssignmentProjects) {
    alerts.push({
      title: "Proyecto con asignacion manual requerida",
      subtitle: `${project.folio} | El flujo automatico fue rechazado ${project.rejectionCount} veces.`,
      meta: "Intervencion inmediata",
      status: "Reasignacion manual",
      priority: "high",
      actions: [
        {
          label: "Asignar consultor",
          href: `${project.href}#assignment`
        },
        {
          label: "Abrir proyecto",
          href: project.href
        }
      ],
      project
    });
  }

  if (!alerts.length && projects[0]) {
    alerts.push({
      title: "Operacion estable",
      subtitle: `${projects[0].folio} | El frente prioritario mantiene avance y capacidad controlada.`,
      meta: "Sin alertas criticas",
      status: "Bajo control",
      priority: "low",
      actions: [{ label: "Abrir proyecto", href: projects[0].href }],
      project: projects[0]
    });
  }

  return alerts.slice(0, 4);
}

function buildLeaderActivity(projects: DashboardProjectRecord[]) {
  return sortProjectsForLeader(projects)
    .slice(0, 4)
    .map<DashboardTimelineItem>((project) => {
      const latestEvent = project.timeline[project.timeline.length - 1];

      return {
        title: latestEvent?.title ?? "Actualizacion reciente",
        subtitle: `${project.folio} | ${project.name}`,
        meta: latestEvent?.timestamp ?? project.lastUpdate,
        status: latestEvent?.type === "rejected" ? "Seguimiento abierto" : "Revision sugerida",
        priority: project.priority === "HIGH" ? "high" : project.priority === "MEDIUM" ? "medium" : "low",
        actions: [
          {
            label: "Abrir proyecto",
            href: project.href
          },
          latestEvent?.type === "rejected" || latestEvent?.type === "alert"
            ? {
                label: "Atender accion",
                href: `${project.href}#${latestEvent.type === "rejected" ? "assignment" : "risks"}`
              }
            : {
                label: "Revisar avance",
                href: "/workspace/actions/revisar-avance"
              }
        ],
        project
      };
    });
}

function buildLeaderNotifications(
  projects: DashboardProjectRecord[],
  tenantId: string | null
) {
  const notifications: LeaderNotification[] = [];

  for (const project of sortProjectsForLeader(projects)) {
    if (project.status === "at_risk" || project.status === "escalated") {
      notifications.push({
        id: `notification-risk-${project.id}`,
        tenantId,
        title: project.status === "escalated" ? "Proyecto escalado" : "Proyecto en riesgo",
        description: `${project.name} necesita una decision del lider para evitar retrasos en cascada.`,
        timestamp: project.lastUpdate,
        category: "critical",
        priority: "high",
        projectFolio: project.folio,
        relatedLabel: project.client,
        href: `${project.href}#risks`,
        ctaLabel: "Ver alerta",
        unread: true
      });
    }

    if (requiresManualAssignment(project)) {
      notifications.push({
        id: `notification-manual-${project.id}`,
        tenantId,
        title: "Requiere asignacion manual",
        description: `El proyecto fue rechazado ${project.rejectionCount} veces y ya no puede seguir en matching automatico.`,
        timestamp: project.lastUpdate,
        category: "assignment",
        priority: "high",
        projectFolio: project.folio,
        relatedLabel: project.client,
        href: `${project.href}#assignment`,
        ctaLabel: "Asignar consultor",
        unread: true
      });
    }

    notifications.push({
      id: `notification-activity-${project.id}`,
      tenantId,
      title: "Actividad reciente del proyecto",
      description: `${project.name} mantiene ${project.progress}% de progreso con ultima actualizacion activa.`,
      timestamp: project.lastUpdate,
      category: "activity",
      priority: project.priority === "HIGH" ? "medium" : "low",
      projectFolio: project.folio,
      relatedLabel: project.client,
      href: project.href,
      ctaLabel: "Abrir proyecto",
      unread: project.priority === "HIGH"
    });
  }

  notifications.push({
    id: "notification-follow-up-validation",
    tenantId,
    title: "Validacion pendiente",
    description: "Grupo Solaris todavia no confirma el ultimo entregable ejecutivo del frente norte.",
    timestamp: "Hace 1 h",
    category: "validation",
    priority: "medium",
    projectFolio: "PRJ-2026-0001",
    relatedLabel: "Grupo Solaris",
    href: "/workspace/projects/expansion-operativa-norte#files",
    ctaLabel: "Validar entregable"
  });

  return notifications.slice(0, 6);
}

function buildLeaderConversations(
  projects: DashboardProjectRecord[],
  tenantId: string | null
) {
  const projectMap = new Map(projects.map((project) => [project.slug, project]));

  return baseConversationSeeds.map<LeaderConversation>((seed) => {
    const project = projectMap.get(seed.projectSlug);
    const fallbackProjectName = seed.projectSlug
      .split("-")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");

    return {
      id: seed.id,
      tenantId,
      consultantName: seed.consultantName,
      consultantStatus: seed.consultantStatus,
      projectSlug: seed.projectSlug,
      projectFolio: project?.folio ?? "PRJ-2026-0000",
      projectName: project?.name ?? fallbackProjectName,
      projectHref: project?.href ?? `/workspace/projects/${seed.projectSlug}`,
      lastMessage: seed.lastMessage,
      time: seed.time,
      unreadCount: seed.unreadCount,
      messages: seed.messages.map((message) => ({ ...message }))
    };
  });
}

function getProjectDetailMetadata(project: DashboardProjectRecord) {
  return `Inicio ${formatDateLabel(project.startDate)} | Cierre ${formatDateLabel(project.endDate)}`;
}

export function slugifyProjectName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getProjectStatusLabel(status: DashboardProjectStatus) {
  const labels: Record<DashboardProjectStatus, string> = {
    approved: "Aprobado",
    in_progress: "En progreso",
    at_risk: "En riesgo",
    rejected_1: "Rechazado 1 vez",
    rejected_2: "Rechazado 2 veces",
    escalated: "Escalado",
    completed: "Completado"
  };

  return labels[status];
}

export function getProjectPriorityLabel(priority: DashboardProjectPriority) {
  const labels: Record<DashboardProjectPriority, string> = {
    HIGH: "Alta",
    MEDIUM: "Media",
    LOW: "Baja"
  };

  return labels[priority];
}

export function getNotificationCategoryLabel(category: DashboardNotificationCategory) {
  const labels: Record<DashboardNotificationCategory, string> = {
    critical: "Alerta critica",
    follow_up: "Seguimiento",
    activity: "Actividad",
    assignment: "Asignacion",
    validation: "Validacion"
  };

  return labels[category];
}

export function requiresManualAssignment(project: DashboardProjectRecord) {
  return (
    (project.rejectionCount >= 2 && project.assignedConsultants < project.consultantsRequired) ||
    ((project.status === "rejected_2" || project.status === "escalated") &&
      project.assignedConsultants < project.consultantsRequired)
  );
}

export function getInitialDashboardProjects(tenantId: string | null = null) {
  return dashboardProjectSeeds.map((seed) =>
    cloneProject(createProjectRecordFromSeed(seed, tenantId))
  );
}

export function getInitialDashboardConsultants(companyId: string | null = null) {
  const tenantId = resolveTenantId(companyId);

  return baseConsultantSeeds.map((consultant) =>
    cloneConsultant({
      ...consultant,
      tenantId,
      companyId: tenantId
    })
  );
}

export function getCompanyScopedConsultants(
  consultants: DashboardConsultantRecord[],
  companyId: string | null
) {
  const tenantId = resolveTenantId(companyId);

  if (!companyId) {
    return consultants.filter(
      (consultant) => resolveTenantId(consultant.tenantId ?? consultant.companyId) === null
    );
  }

  const exactMatches = consultants.filter(
    (consultant) => resolveTenantId(consultant.tenantId ?? consultant.companyId) === tenantId
  );

  if (exactMatches.length) {
    return exactMatches;
  }

  return consultants.filter(
    (consultant) => resolveTenantId(consultant.tenantId ?? consultant.companyId) === null
  );
}

export function getTenantScopedProjects(
  projects: DashboardProjectRecord[],
  tenantId: string | null
) {
  const normalizedTenantId = resolveTenantId(tenantId);

  if (!normalizedTenantId) {
    return projects
      .filter((project) => resolveTenantId(project.tenantId) === null)
      .map((project) => normalizeProjectRecord(project));
  }

  const exactMatches = projects.filter(
    (project) => resolveTenantId(project.tenantId) === normalizedTenantId
  );

  if (exactMatches.length) {
    return exactMatches.map((project) => normalizeProjectRecord(project));
  }

  return projects
    .filter((project) => resolveTenantId(project.tenantId) === null)
    .map((project) => normalizeProjectRecord(project));
}

export function getConsultantAvailabilityLabel(availability: DashboardConsultantAvailability) {
  const labels: Record<DashboardConsultantAvailability, string> = {
    available: "Disponible",
    partial: "Parcialmente ocupado",
    unavailable: "No disponible"
  };

  return labels[availability];
}

export function getConsultantBadges(
  consultant: DashboardConsultantRecord,
  limit?: number
) {
  const normalizedConsultant = normalizeConsultantRecord(consultant);

  return typeof limit === "number"
    ? normalizedConsultant.badges.slice(0, limit)
    : normalizedConsultant.badges;
}

export function getConsultantPrimaryKpis(
  consultant: DashboardConsultantRecord
): DashboardConsultantKpiItem[] {
  const normalizedConsultant = normalizeConsultantRecord(consultant);

  return [
    {
      id: `${normalizedConsultant.id}-kpi-delivery`,
      label: "Cumplimiento",
      value: `${normalizedConsultant.kpiSnapshot.deliveryCompliance}%`,
      note: "Entregas cumplidas",
      progress: normalizedConsultant.kpiSnapshot.deliveryCompliance,
      tone: "emerald"
    },
    {
      id: `${normalizedConsultant.id}-kpi-response`,
      label: "Respuesta",
      value: `${normalizedConsultant.kpiSnapshot.responseTimeMinutes} min`,
      note: "Tiempo medio",
      progress: Math.max(
        16,
        100 - Math.min(normalizedConsultant.kpiSnapshot.responseTimeMinutes, 60)
      ),
      tone: "blue"
    },
    {
      id: `${normalizedConsultant.id}-kpi-quality`,
      label: "Calidad",
      value: `${normalizedConsultant.kpiSnapshot.qualityScore}/100`,
      note: "Score validado",
      progress: normalizedConsultant.kpiSnapshot.qualityScore,
      tone: "slate"
    }
  ];
}

export function getConsultantExtendedKpis(
  consultant: DashboardConsultantRecord
): DashboardConsultantKpiItem[] {
  const normalizedConsultant = normalizeConsultantRecord(consultant);

  return [
    ...getConsultantPrimaryKpis(normalizedConsultant),
    {
      id: `${normalizedConsultant.id}-kpi-load`,
      label: "Carga actual",
      value: `${normalizedConsultant.occupancyPercent}%`,
      note: "Nivel de ocupacion",
      progress: normalizedConsultant.occupancyPercent,
      tone:
        normalizedConsultant.occupancyPercent >= 75
          ? "amber"
          : normalizedConsultant.occupancyPercent >= 50
            ? "blue"
            : "emerald"
    },
    {
      id: `${normalizedConsultant.id}-kpi-projects`,
      label: "Proyectos activos",
      value: String(normalizedConsultant.assignedProjectSlugs.length),
      note: "Frentes simultaneos",
      progress: Math.min(100, normalizedConsultant.assignedProjectSlugs.length * 35),
      tone: "slate"
    }
  ];
}

export function getAssignedConsultantsForProject(
  consultants: DashboardConsultantRecord[],
  projectSlug: string
) {
  return consultants.filter((consultant) =>
    consultant.assignedProjectSlugs.includes(projectSlug)
  );
}

export function getSuggestedConsultantsForProject(
  project: DashboardProjectRecord,
  consultants: DashboardConsultantRecord[],
  limit = 3
) {
  return [...consultants]
    .sort((left, right) => getSuggestedMatchScore(project, right) - getSuggestedMatchScore(project, left))
    .slice(0, limit);
}

export function getLeadConsultantForProject(
  project: DashboardProjectRecord,
  consultants: DashboardConsultantRecord[]
) {
  return getAssignedConsultantsForProject(consultants, project.slug)[0] ?? null;
}

export function getConsultantBySession(
  session: SessionUser,
  consultants: DashboardConsultantRecord[] = getInitialDashboardConsultants(session.tenantId ?? session.companyId ?? null)
) {
  const normalizedSessionName = normalizeName(session.fullName);
  const scopedConsultants = getCompanyScopedConsultants(
    consultants,
    session.tenantId ?? session.companyId
  );
  const matchedConsultant = scopedConsultants.find(
    (consultant) => normalizeName(consultant.fullName) === normalizedSessionName
  );

  if (matchedConsultant) {
    return normalizeConsultantRecord(matchedConsultant);
  }

  const fallbackConsultant = scopedConsultants[0];

  if (fallbackConsultant) {
    return normalizeConsultantRecord({
      ...fallbackConsultant,
      id: `consultant-${normalizedSessionName.replace(/\s+/g, "-")}`,
      fullName: session.fullName
    });
  }

  return normalizeConsultantRecord({
    id: `consultant-${normalizedSessionName.replace(/\s+/g, "-")}`,
    tenantId: session.tenantId ?? session.companyId,
    companyId: session.tenantId ?? session.companyId,
    fullName: session.fullName,
    specialty: "Consultoria operativa",
    roleLabel: "Consultor",
    skills: ["Operacion", "Seguimiento", "Entrega"],
    availability: "available",
    occupancyPercent: 38,
    assignedProjectSlugs: [],
    professionalStatus: "Disponible para nuevos frentes",
    badges: [
      {
        id: `badge-${normalizedSessionName.replace(/\s+/g, "-")}-base`,
        label: "Perfil recomendado",
        description: "Perfil operativo listo para seguimiento y coordinacion.",
        tone: "slate"
      }
    ],
    kpiSnapshot: {
      deliveryCompliance: 90,
      responseTimeMinutes: 22,
      qualityScore: 91
    },
    note: "Perfil operativo disponible en el entorno actual."
  });
}

export function getSuggestedMatchScore(
  project: DashboardProjectRecord,
  consultant: DashboardConsultantRecord
) {
  const normalizedProject = normalizeProjectRecord(project);
  const skillOverlap = normalizedProject.requiredSkills.filter((skill) =>
    consultant.skills.some((consultantSkill) => consultantSkill.toLowerCase() === skill.toLowerCase())
  ).length;
  const requiredSkillCoverage = normalizedProject.requiredSkills.length
    ? (skillOverlap / normalizedProject.requiredSkills.length) * 48
    : 28;
  const availabilityBoost =
    consultant.availability === "available"
      ? 18
      : consultant.availability === "partial"
        ? 8
        : -28;
  const deliveryScore = consultant.kpiSnapshot.deliveryCompliance * 0.16;
  const qualityScore = consultant.kpiSnapshot.qualityScore * 0.18;
  const responseScore = Math.max(
    0,
    22 - Math.min(consultant.kpiSnapshot.responseTimeMinutes, 22)
  ) * 1.4;
  const occupancyPenalty = consultant.occupancyPercent * 0.22;
  const projectLoadPenalty = consultant.assignedProjectSlugs.length >= 2 ? 18 : 0;

  return Math.max(
    0,
    Math.round(
      requiredSkillCoverage +
        availabilityBoost +
        deliveryScore +
        qualityScore +
        responseScore -
        occupancyPenalty -
        projectLoadPenalty
    )
  );
}

export function isSuggestedConsultant(
  project: DashboardProjectRecord,
  consultant: DashboardConsultantRecord
) {
  return (
    consultant.availability !== "unavailable" &&
    consultant.assignedProjectSlugs.length < 2 &&
    getSuggestedMatchScore(project, consultant) >= 60
  );
}

export function getProjectTimelineItem(
  project: DashboardProjectRecord,
  config?: {
    subtitle?: string;
    meta?: string;
    status?: string;
  }
): DashboardTimelineItem {
  const normalizedProject = normalizeProjectRecord(project);

  return {
    title: normalizedProject.name,
    subtitle: config?.subtitle ?? normalizedProject.description,
    meta: config?.meta ?? getProjectDetailMetadata(normalizedProject),
    status: config?.status ?? getProjectStatusLabel(normalizedProject.status),
    href: normalizedProject.href,
    priority: getTimelinePriority(normalizedProject.priority),
    project: normalizedProject
  };
}

export function getProjectBySlug(
  projectSlug: string,
  projects: DashboardProjectRecord[] = getInitialDashboardProjects(),
  tenantId?: string | null
) {
  return projects.find(
    (project) =>
      project.slug === projectSlug &&
      (typeof tenantId === "undefined" || resolveTenantId(project.tenantId) === resolveTenantId(tenantId))
  );
}

export function createProjectRecord(
  input: CreateProjectInput,
  projects: DashboardProjectRecord[],
  leaderName: string,
  tenantId: string | null
): DashboardProjectRecord {
  const slugBase = slugifyProjectName(input.name) || `proyecto-${projects.length + 1}`;
  let slug = slugBase;
  let sequence = 2;

  while (projects.some((project) => project.slug === slug)) {
    slug = `${slugBase}-${sequence}`;
    sequence += 1;
  }

  const folio = input.folio?.trim() || getNextProjectFolio(projects, input.startDate);

  return {
    id: `project-${slug}`,
    tenantId: resolveTenantId(tenantId),
    slug,
    folio,
    name: input.name.trim(),
    client: input.client.trim(),
    description: input.description.trim(),
    status: "approved" as const,
    priority: input.priority,
    progress: 8,
    startDate: input.startDate,
    endDate: input.endDate,
    leader: leaderName,
    consultantsRequired: input.consultantsRequired,
    assignedConsultants: 0,
    rejectionCount: 0,
    lastUpdate: "Ahora",
    href: `/workspace/projects/${slug}`,
    type: input.projectType?.trim() || "Operacion especializada",
    requiredSkills: input.projectType?.trim() ? [input.projectType.trim()] : [],
    attachments: [...input.attachments],
    openRisks: [],
    milestones: [
      {
        id: `${slug}-milestone-1`,
        title: "Kickoff operativo",
        date: input.startDate,
        status: "upcoming"
      },
      {
        id: `${slug}-milestone-2`,
        title: "Entrega estimada",
        date: input.endDate,
        status: "upcoming"
      }
    ],
    timeline: [
      {
        id: `${slug}-created`,
        type: "created",
        title: "Proyecto creado",
        description: "Se registro un nuevo proyecto en el portal LEADER y quedo listo para asignacion.",
        timestamp: "Ahora",
        actor: leaderName,
        href: `/workspace/projects/${slug}`
      },
      {
        id: `${slug}-approved`,
        type: "approved",
        title: "Proyecto aprobado para arranque",
        description: "El proyecto quedo disponible para coordinacion operativa y seguimiento del equipo.",
        timestamp: "Ahora",
        actor: "Orbit Nexus",
        href: `/workspace/projects/${slug}#assignment`
      }
    ]
  };
}

export function getNextProjectFolio(
  projects: DashboardProjectRecord[],
  startDate?: string
) {
  const year =
    Number((startDate || new Date().toISOString().slice(0, 10)).slice(0, 4)) ||
    new Date().getFullYear();
  const sameYearProjects = projects.filter((project) => project.folio.startsWith(`PRJ-${year}-`));
  const nextSequence =
    sameYearProjects.reduce((currentMax, project) => {
      const currentSequence = Number(project.folio.split("-")[2] ?? "0");
      return Math.max(currentMax, currentSequence);
    }, 0) + 1;

  return `PRJ-${year}-${String(nextSequence).padStart(4, "0")}`;
}

export function createConsultantRecord(
  input: CreateConsultantInput,
  consultants: DashboardConsultantRecord[],
  tenantId: string | null
) {
  const normalizedName = normalizeName(input.fullName);
  const baseId = `consultant-${normalizedName.replace(/\s+/g, "-")}`;
  let id = baseId;
  let sequence = 2;

  while (consultants.some((consultant) => consultant.id === id)) {
    id = `${baseId}-${sequence}`;
    sequence += 1;
  }

  return normalizeConsultantRecord({
    id,
    tenantId: resolveTenantId(tenantId),
    companyId: resolveTenantId(tenantId),
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    specialty: input.specialty.trim(),
    roleLabel: "Consultor registrado",
    skills: input.skills,
    availability: input.availability,
    occupancyPercent:
      input.availability === "available"
        ? 24
        : input.availability === "partial"
          ? 58
          : 88,
    assignedProjectSlugs: [],
    professionalStatus: input.professionalStatus.trim(),
    badges: buildConsultantBadgesFromInput(input),
    kpiSnapshot: {
      deliveryCompliance: input.deliveryCompliance,
      responseTimeMinutes: input.responseTimeMinutes,
      qualityScore: input.qualityScore
    },
    note:
      input.note?.trim() ||
      "Perfil interno listo para matching, asignacion y futuras activaciones en la plataforma."
  });
}

export function getLeaderDashboardMock(
  session: SessionUser,
  projects: DashboardProjectRecord[] = getInitialDashboardProjects(session.tenantId ?? session.companyId ?? null)
): LeaderDashboardMock {
  const sortedProjects = sortProjectsForLeader(projects);
  const activeProjects = sortedProjects.filter((project) => project.status !== "completed");
  const interventionProjects = activeProjects.filter((project) => requiresManualAssignment(project));
  const alerts = buildLeaderAlerts(activeProjects);
  const teamActivity = buildLeaderActivity(activeProjects);
  const recommendedProject = interventionProjects[0] ?? activeProjects.find((project) => project.status === "at_risk") ?? activeProjects[0];

  return {
    metrics: [
      {
        label: "Proyectos activos",
        value: String(activeProjects.length),
        detail: "Lectura consolidada de los frentes que hoy requieren coordinacion activa.",
        tone: "blue"
      },
      {
        label: "Consultores asignados",
        value: String(activeProjects.reduce((total, project) => total + project.assignedConsultants, 0)),
        detail: "Cobertura visible por proyecto para detectar huecos antes de que escalen.",
        tone: "emerald"
      },
      {
        label: "Clientes activos",
        value: String(new Set(activeProjects.map((project) => project.client)).size),
        detail: "Clientes con movimiento reciente y seguimiento operativo desde el dashboard.",
        tone: "slate"
      },
      {
        label: "Alertas abiertas",
        value: String(alerts.length),
        detail: `${interventionProjects.length} proyectos ya requieren una decision manual del lider.`,
        tone: "amber"
      }
    ],
    recentProjects: activeProjects.slice(0, 4).map((project) => getProjectTimelineItem(project)),
    interventionProjects: interventionProjects.map((project) =>
      getProjectTimelineItem(project, {
        subtitle:
          "El matching automatico ya no puede seguir sobre este frente. Requiere decision manual inmediata.",
        status: "Intervencion requerida"
      })
    ),
    alerts,
    teamActivity,
    operationStatus: [
      {
        label: "Cumplimiento operativo",
        value: `${Math.round(
          activeProjects.reduce((total, project) => total + project.progress, 0) /
            Math.max(activeProjects.length, 1)
        )}%`,
        note: "Promedio consolidado de avance para tomar decisiones rapidas sin abrir cada proyecto.",
        progress: Math.round(
          activeProjects.reduce((total, project) => total + project.progress, 0) /
            Math.max(activeProjects.length, 1)
        ),
        tone: "emerald"
      },
      {
        label: "Capacidad visible",
        value: `${activeProjects.reduce((total, project) => total + project.assignedConsultants, 0)}/${activeProjects.reduce((total, project) => total + project.consultantsRequired, 0)}`,
        note: "Relacion entre consultores asignados y requeridos en la cartera activa.",
        progress: Math.round(
          (activeProjects.reduce((total, project) => total + project.assignedConsultants, 0) /
            Math.max(
              activeProjects.reduce((total, project) => total + project.consultantsRequired, 0),
              1
            )) *
            100
        ),
        tone: "blue"
      },
      {
        label: "Intervencion manual",
        value: interventionProjects.length ? "Activa" : "Controlada",
        note: interventionProjects.length
          ? "Hay proyectos que ya no pueden seguir por matching automatico."
          : "No hay frentes bloqueados por rechazos multiples.",
        progress: interventionProjects.length
          ? Math.min(90, 25 + interventionProjects.length * 20)
          : 14,
        tone: interventionProjects.length ? "amber" : "slate"
      }
    ],
    recommendedAction: recommendedProject
      ? {
          eyebrow: "Accion recomendada",
          title: requiresManualAssignment(recommendedProject)
            ? `Asigna manualmente ${recommendedProject.folio}`
            : `Prioriza ${recommendedProject.folio}`,
          summary: requiresManualAssignment(recommendedProject)
            ? "El proyecto ya alcanzo el umbral de rechazo y necesita una decision directa del lider para seguir avanzando."
            : "Resolver hoy el frente prioritario mantiene estable la operacion y reduce el riesgo de escalacion.",
          primaryAction: requiresManualAssignment(recommendedProject)
            ? {
                label: "Asignar consultor",
                href: `${recommendedProject.href}#assignment`
              }
            : {
                label: "Abrir proyecto",
                href: recommendedProject.href
              },
          secondaryAction: {
            label: "Ver alertas",
            href:
              recommendedProject.status === "at_risk" || recommendedProject.status === "escalated"
                ? `${recommendedProject.href}#risks`
                : recommendedProject.href
          }
        }
      : {
          eyebrow: "Accion recomendada",
          title: "Operacion estable",
          summary: "No hay riesgos abiertos. Mantener seguimiento sobre los frentes activos es suficiente por ahora.",
          primaryAction: {
            label: "Volver al dashboard",
            href: "/workspace"
          }
        },
    quickActions: [
      {
        label: "Crear proyecto",
        href: "/workspace/projects/create"
      }
    ],
    notifications: buildLeaderNotifications(activeProjects, session.tenantId ?? session.companyId ?? null),
    conversations: buildLeaderConversations(activeProjects, session.tenantId ?? session.companyId ?? null)
  };
}

export function getConsultantDashboardMock(session: SessionUser): ConsultantDashboardMock {
  const tenantId = session.tenantId ?? session.companyId ?? null;
  const projects = getInitialDashboardProjects(tenantId);
  const consultants = getInitialDashboardConsultants(tenantId);
  const expansionProject = getProjectBySlug("expansion-operativa-norte", projects)!;
  const riskProject = getProjectBySlug("transformacion-comercial-q3", projects)!;
  const crmProject = getProjectBySlug("implementacion-crm-regional", projects)!;
  const completedProject = getProjectBySlug("programa-eficiencia-digital", projects)!;
  const baseConsultantProfile = getConsultantBySession(session, consultants);
  const assignedProjects = baseConsultantProfile.assignedProjectSlugs
    .map((slug) => getProjectBySlug(slug, projects))
    .filter((project): project is DashboardProjectRecord => Boolean(project));
  const visibleProjects = assignedProjects.length ? assignedProjects : [expansionProject];
  const [primaryProject, secondaryProject, tertiaryProject] = [
    visibleProjects[0] ?? expansionProject,
    visibleProjects[1] ?? riskProject,
    visibleProjects[2] ?? crmProject
  ];
  const nextOccupancy = Math.max(
    baseConsultantProfile.occupancyPercent,
    24 + visibleProjects.length * 18
  );
  const consultantProfile = normalizeConsultantRecord({
    ...baseConsultantProfile,
    assignedProjectSlugs: visibleProjects.map((project) => project.slug),
    occupancyPercent: nextOccupancy,
    availability: deriveConsultantAvailability(nextOccupancy),
    professionalStatus:
      visibleProjects.length > 1
        ? "Activo en frentes visibles con seguimiento y carga controlada"
        : "Activo en un frente prioritario con seguimiento claro y capacidad disponible"
  });
  const projectForHistory = visibleProjects.length > 1 ? visibleProjects : [primaryProject, completedProject];

  return {
    metrics: [
      {
        label: "Proyectos asignados",
        value: String(consultantProfile.assignedProjectSlugs.length),
        detail: `Carga actual para ${session.fullName}`,
        tone: "blue"
      },
      {
        label: "Entregas pendientes",
        value: String(Math.max(visibleProjects.length, 1) * 2),
        detail:
          visibleProjects.length > 1
            ? "Hay entregables visibles para esta semana en mas de un frente activo."
            : "Tu frente actual tiene entregables visibles antes del siguiente corte.",
        tone: "amber"
      },
      {
        label: "Avances reportados",
        value: String(8 + visibleProjects.length * 2),
        detail: "Historial reciente listo para revision por liderazgo y cliente.",
        tone: "emerald"
      },
      {
        label: "Proxima fecha clave",
        value: formatDateLabel(primaryProject.endDate).slice(0, 6),
        detail: `Siguiente ventana visible en ${primaryProject.name}.`,
        tone: "slate"
      }
    ],
    consultantProfile,
    myProjects: visibleProjects.map((project, index) =>
      getProjectTimelineItem(project, {
        subtitle:
          index === 0
            ? "Frente principal asignado con seguimiento semanal, validacion del lider y comentarios activos del cliente."
            : "Frente activo con seguimiento visible, entregables intermedios y foco de ejecucion definido.",
        meta:
          index === 0
            ? `Corte semanal | ${formatDateLabel(project.endDate)}`
            : `Seguimiento operativo | ${formatDateLabel(project.endDate)}`
      })
    ),
    workflowStatus: [
      {
        label: "Foco actual",
        value: primaryProject.priority === "HIGH" ? "Entrega ejecutiva" : "Seguimiento operativo",
        note: `El frente ${primaryProject.folio} concentra hoy la mayor parte del impacto operativo.`,
        tone: "blue"
      },
      {
        label: "Estado de trabajo",
        value: "En curso",
        note: visibleProjects.some((project) => project.status === "at_risk")
          ? "La ejecucion va en curso, pero uno de tus frentes necesita control extra de riesgo."
          : "La ejecucion se mantiene dentro de tiempos y seguimiento esperado.",
        tone: "emerald"
      },
      {
        label: "Capacidad restante",
        value: `${Math.max(0, 100 - consultantProfile.occupancyPercent)}%`,
        note: "Lectura visible de carga para anticipar si puedes absorber otra solicitud esta semana.",
        tone: "amber"
      }
    ],
    upcomingDeliverables: [primaryProject, secondaryProject, tertiaryProject]
      .filter((project, index, collection) => project && collection.findIndex((item) => item.slug === project.slug) === index)
      .map((project, index) => ({
        title: "Documento de hallazgos operativos",
        subtitle: `${project.folio} | ${project.name}`,
        meta: `Entrega: ${formatDateLabel(project.endDate)} - ${index === 0 ? "10:00" : index === 1 ? "12:00" : "13:00"}`,
        status: index === 0 ? "Pendiente" : index === 1 ? "Listo para carga" : "En preparacion",
        priority: project.priority === "HIGH" ? "high" : project.priority === "MEDIUM" ? "medium" : "low",
        actions: [
          {
            label: "Subir entregable",
            href: "/workspace/actions/subir-entregable"
          },
          {
            label: "Abrir proyecto",
            href: project.href
          }
        ]
      })),
    progressHistory: projectForHistory.map((project, index) => ({
        title: "Avance semanal entregado",
        subtitle: `${project.folio} | ${project.name}`,
        meta: index === 0 ? "Ayer - PDF comentado" : "Hace 2 dias",
        status: index === 0 ? "Corregido" : "Entregado",
        priority: project.priority === "HIGH" ? "medium" : "low",
        href: project.href
      })),
    recentAssets: visibleProjects.map((project, index) => ({
        title: "Resumen ejecutivo v4",
        subtitle: `${project.folio} | Documento listo para compartir con liderazgo y cliente.`,
        meta: index === 0 ? "PDF | Actualizado hace 40 min" : "PPT | Actualizado hoy",
        status: index === 0 ? "Listo" : "En revision",
        priority: project.priority === "HIGH" ? "high" : "medium",
        href: project.href
      })),
    leaderFeedback: visibleProjects.map((project, index) => ({
        title: "Feedback sobre hallazgos operativos",
        subtitle: `${project.leader} pide reforzar la lectura de riesgo y el siguiente paso recomendado.`,
        meta: index === 0 ? "Hace 25 min" : "Hace 2 h",
        status: index === 0 ? "Pendiente de ajuste" : "Listo para responder",
        priority: project.priority === "HIGH" ? "high" : "medium",
        actions: [
          {
            label: "Abrir proyecto",
            href: project.href
          }
        ]
      })),
    recommendedAction: {
      eyebrow: "Accion recomendada",
      title: "Carga hoy el hallazgo operativo prioritario",
      summary:
        "Es el entregable con vencimiento mas cercano y desbloquea la revision del lider y del cliente sin generar retrasos en cascada.",
      primaryAction: {
        label: "Subir entregable",
        href: "/workspace/actions/subir-entregable"
      },
      secondaryAction: {
        label: "Abrir proyecto",
        href: primaryProject.href
      }
    },
    quickActions: [
      {
        label: "Reportar avance",
        href: "/workspace/actions/reportar-avance"
      },
      {
        label: "Subir entregable",
        href: "/workspace/actions/subir-entregable"
      }
    ]
  };
}

export function getClientDashboardMock(session: SessionUser): ClientDashboardMock {
  const tenantId = session.tenantId ?? session.companyId ?? null;
  const projects = getInitialDashboardProjects(tenantId);
  const consultants = getInitialDashboardConsultants(tenantId);
  const activeProject = getProjectBySlug("expansion-operativa-norte", projects)!;
  const assignedConsultant = getLeadConsultantForProject(activeProject, consultants);

  return {
    metrics: [
      {
        label: "Proyecto activo",
        value: "1 activo",
        detail: `Expansion Operativa Norte visible para ${session.fullName}`,
        tone: "blue"
      },
      {
        label: "Estado general",
        value: "En tiempo",
        detail: "La ejecucion se mantiene alineada con el calendario comprometido",
        tone: "emerald"
      },
      {
        label: "Ultimo avance",
        value: "Ayer",
        detail: "Documento ejecutivo con comentarios integrados",
        tone: "slate"
      },
      {
        label: "Proximo hito",
        value: "16 Abr",
        detail: "Revision de resultados intermedios con el consultor",
        tone: "amber"
      }
    ],
    activeProject: getProjectTimelineItem(activeProject, {
      subtitle:
        "Vista ejecutiva del proyecto activo con el contexto minimo necesario para validar avance, riesgo y siguiente hito.",
      meta: "Siguiente revision | 16 Abr 2026"
    }),
    assignedConsultant,
    projectProgress: [
      {
        label: "Planeacion",
        value: "Completa",
        note: "Los requisitos y responsables ya fueron alineados por el lider del proyecto.",
        tone: "emerald"
      },
      {
        label: "Ejecucion",
        value: "76%",
        note: "La mayor parte de los entregables intermedios ya esta disponible para consulta.",
        tone: "blue"
      },
      {
        label: "Riesgos",
        value: "Bajos",
        note: "No hay incidencias criticas abiertas al momento.",
        tone: "slate"
      }
    ],
    recentDeliverables: [
      {
        title: "Resumen de avance ejecutivo",
        subtitle: `${activeProject.folio} | Compartido por el consultor principal`,
        meta: "Ayer - Version 3",
        status: "Disponible para revision",
        priority: "high",
        href: activeProject.href
      },
      {
        title: "Anexo de seguimiento operativo",
        subtitle: `${activeProject.folio} | Observaciones integradas por el equipo`,
        meta: "Hace 3 dias - PDF comentado",
        status: "Actualizado",
        priority: "medium",
        href: activeProject.href
      },
      {
        title: "Cronograma refinado",
        subtitle: `${activeProject.folio} | Validado por lider y consultor`,
        meta: "Hace 5 dias",
        status: "Aprobado",
        priority: "low",
        href: activeProject.href
      }
    ],
    validations: [
      {
        title: "Comentario pendiente sobre entregable ejecutivo",
        subtitle: `${activeProject.folio} | Se espera tu confirmacion final`,
        meta: "Vence manana",
        status: "Accion requerida",
        priority: "high",
        actions: [
          {
            label: "Validar entregable",
            href: "/workspace/actions/validar-entregable"
          },
          {
            label: "Revisar avance",
            href: activeProject.href
          }
        ]
      },
      {
        title: "Observaciones sobre cronograma",
        subtitle: `${activeProject.folio} | Respondidas por el consultor`,
        meta: "Hace 2 dias",
        status: "Resuelto",
        priority: "low",
        actions: [
          {
            label: "Ver proyecto",
            href: activeProject.href
          }
        ]
      },
      {
        title: "Validacion de alcance parcial",
        subtitle: `${activeProject.folio} | Cerrada con conformidad del lider`,
        meta: "Hace 1 semana",
        status: "Cerrado",
        priority: "low",
        actions: [
          {
            label: "Abrir historial",
            href: "/workspace/actions/abrir-historial"
          }
        ]
      }
    ],
    recommendedAction: {
      eyebrow: "Accion recomendada",
      title: "Revisa el entregable ejecutivo mas reciente",
      summary:
        "Tu validacion confirma el siguiente hito del proyecto y mantiene la conversacion con el consultor dentro del tiempo esperado.",
      primaryAction: {
        label: "Revisar avance",
        href: activeProject.href
      },
      secondaryAction: {
        label: "Validar entregable",
        href: "/workspace/actions/validar-entregable"
      }
    },
    quickActions: [
      {
        label: "Revisar avance",
        href: activeProject.href
      },
      {
        label: "Validar entregable",
        href: "/workspace/actions/validar-entregable"
      }
    ]
  };
}

export function getLeaderDashboardSearchItems(data: LeaderDashboardMock) {
  return dedupeSearchItems([
    ...createProjectSearchItems([...data.recentProjects, ...data.interventionProjects]),
    ...createActivitySearchItems(data.alerts),
    ...createActivitySearchItems(data.teamActivity),
    ...createActionSearchItems(data.quickActions, "Acciones del portal Leader"),
    ...createActionSearchItems(
      [data.recommendedAction.primaryAction, data.recommendedAction.secondaryAction].filter(
        (action): action is DashboardLinkAction => !!action
      ),
      data.recommendedAction.title
    ),
    ...createActionSearchItems(
      data.teamActivity.flatMap((item) => item.actions ?? []),
      "Actividad reciente"
    )
  ]);
}

export function getConsultantDashboardSearchItems(data: ConsultantDashboardMock) {
  return dedupeSearchItems([
    ...createProjectSearchItems(data.myProjects),
    ...createActivitySearchItems(data.recentAssets),
    ...createActivitySearchItems(data.leaderFeedback),
    ...createActivitySearchItems(data.progressHistory),
    ...createActionSearchItems(data.quickActions, "Acciones del portal Consultant"),
    ...createActionSearchItems(
      [data.recommendedAction.primaryAction, data.recommendedAction.secondaryAction].filter(
        (action): action is DashboardLinkAction => !!action
      ),
      data.recommendedAction.title
    ),
    ...createActionSearchItems(
      data.upcomingDeliverables.flatMap((item) => item.actions ?? []),
      "Entregables proximos"
    )
  ]);
}

export function getClientDashboardSearchItems(data: ClientDashboardMock) {
  return dedupeSearchItems([
    ...createProjectSearchItems([data.activeProject]),
    ...createActivitySearchItems(data.recentDeliverables),
    ...createActivitySearchItems(data.validations),
    ...createActionSearchItems(data.quickActions, "Acciones del portal Client"),
    ...createActionSearchItems(
      [data.recommendedAction.primaryAction, data.recommendedAction.secondaryAction].filter(
        (action): action is DashboardLinkAction => !!action
      ),
      data.recommendedAction.title
    ),
    ...createActionSearchItems(
      data.validations.flatMap((item) => item.actions ?? []),
      "Validaciones"
    )
  ]);
}
