"use client";

import {
  getConsultantAvailabilityLabel,
  getConsultantBySession,
  getConsultantExtendedKpis,
  getLeaderDashboardMock,
  getProjectStatusLabel,
  getSuggestedConsultantsForProject,
  normalizeConsultantRecord,
  normalizeProjectRecord,
  requiresManualAssignment,
  type DashboardConsultantRecord,
  type DashboardProjectRecord
} from "@/lib/dashboard/mock-data";
import { normalizeName } from "@/lib/normalization";
import type { SessionUser } from "@/types/auth";

export type AssistantIntent =
  | "greeting"
  | "projects"
  | "consultants"
  | "kpis"
  | "alerts"
  | "assignments"
  | "deliverables"
  | "platform_help"
  | "recommendations"
  | "unknown";

export type AssistantReply = {
  intent: AssistantIntent;
  text: string;
  suggestions: string[];
  contextLabel: string;
  usedData: boolean;
};

export type AssistantRuntimeContext = {
  session: SessionUser;
  pathname: string;
  projects: DashboardProjectRecord[];
  consultants: DashboardConsultantRecord[];
  conversationCount?: number;
  unreadConversationCount?: number;
};

type AssistantSnapshot = {
  session: SessionUser;
  pathname: string;
  contextLabel: string;
  projects: DashboardProjectRecord[];
  activeProjects: DashboardProjectRecord[];
  visibleProjects: DashboardProjectRecord[];
  consultants: DashboardConsultantRecord[];
  currentConsultant: DashboardConsultantRecord | null;
  atRiskProjects: DashboardProjectRecord[];
  interventionProjects: DashboardProjectRecord[];
  coverageGapProjects: DashboardProjectRecord[];
  overloadedConsultants: DashboardConsultantRecord[];
  partiallyLoadedConsultants: DashboardConsultantRecord[];
  upcomingProjects: DashboardProjectRecord[];
  conversationCount: number;
  unreadConversationCount: number;
};

const GREETING_TOKENS = ["hola", "buenas", "hello", "hey", "saludos"];
const KPI_TOKENS = [
  "kpi",
  "kpis",
  "desempeno",
  "desempe",
  "cumplimiento",
  "calidad",
  "respuesta",
  "metric",
  "metricas"
];
const PROJECT_TOKENS = [
  "proyecto",
  "proyectos",
  "folio",
  "estado",
  "avance",
  "hito",
  "cliente",
  "portafolio"
];
const ALERT_TOKENS = [
  "alerta",
  "alertas",
  "riesgo",
  "riesgos",
  "retraso",
  "bloqueo",
  "incidencia",
  "critico",
  "critica",
  "escalado"
];
const ASSIGNMENT_TOKENS = [
  "asign",
  "equipo",
  "match",
  "matching",
  "disponibilidad",
  "consultor ideal",
  "cobertura",
  "capacidad"
];
const DELIVERABLE_TOKENS = [
  "entregable",
  "entregables",
  "documento",
  "subir",
  "archivo",
  "validar",
  "validacion",
  "avance semanal"
];
const PLATFORM_HELP_TOKENS = [
  "como",
  "donde",
  "ayuda",
  "usar",
  "abrir",
  "portal",
  "chat",
  "calendario",
  "dashboard",
  "registrar"
];
const RECOMMENDATION_TOKENS = [
  "recomienda",
  "recomendacion",
  "prioriza",
  "priorizar",
  "mejorar",
  "siguiente paso",
  "accion sugerida",
  "optimizar"
];

function normalizeAssistantText(value: string) {
  return normalizeName(value)
    .replace(/[^a-z0-9@\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, tokens: string[]) {
  return tokens.some((token) => text.includes(token));
}

function deriveContextLabel(pathname: string) {
  if (pathname.includes("/workspace/chat")) {
    return "Chat operativo";
  }

  if (pathname.includes("/workspace/calendar")) {
    return "Calendario";
  }

  if (pathname.includes("/workspace/projects/create")) {
    return "Creacion de proyecto";
  }

  if (pathname.includes("/workspace/projects/")) {
    return "Detalle de proyecto";
  }

  if (pathname.includes("/workspace/consultants")) {
    return "Gestion de consultores";
  }

  if (pathname.includes("/workspace/actions/")) {
    return "Accion operativa";
  }

  return "Dashboard";
}

function formatDateLabel(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short"
  }).format(parsedDate);
}

function getProjectAttentionScore(project: DashboardProjectRecord) {
  let score = 0;

  if (requiresManualAssignment(project)) {
    score += 100;
  }

  if (project.status === "escalated") {
    score += 90;
  } else if (project.status === "at_risk") {
    score += 78;
  } else if (project.status === "rejected_2") {
    score += 74;
  } else if (project.status === "rejected_1") {
    score += 54;
  }

  if (project.priority === "HIGH") {
    score += 22;
  } else if (project.priority === "MEDIUM") {
    score += 11;
  }

  score += Math.max(0, 100 - project.progress);
  score += project.openRisks.length * 9;
  score += Math.max(0, project.consultantsRequired - project.assignedConsultants) * 16;

  return score;
}

function buildSnapshot(input: AssistantRuntimeContext): AssistantSnapshot {
  const projects = input.projects.map((project) => normalizeProjectRecord(project));
  const consultants = input.consultants.map((consultant) =>
    normalizeConsultantRecord(consultant)
  );
  const activeProjects = [...projects]
    .filter((project) => project.status !== "completed")
    .sort((left, right) => getProjectAttentionScore(right) - getProjectAttentionScore(left));
  const currentConsultant =
    input.session.role === "CONSULTANT"
      ? getConsultantBySession(input.session, consultants)
      : null;
  const visibleProjects =
    input.session.role === "CONSULTANT" && currentConsultant
      ? activeProjects.filter((project) => currentConsultant.assignedProjectSlugs.includes(project.slug))
      : activeProjects;

  return {
    session: input.session,
    pathname: input.pathname,
    contextLabel: deriveContextLabel(input.pathname),
    projects,
    activeProjects,
    visibleProjects: visibleProjects.length ? visibleProjects : activeProjects,
    consultants,
    currentConsultant,
    atRiskProjects: activeProjects.filter(
      (project) =>
        project.status === "at_risk" ||
        project.status === "escalated" ||
        project.openRisks.length > 0
    ),
    interventionProjects: activeProjects.filter((project) => requiresManualAssignment(project)),
    coverageGapProjects: activeProjects.filter(
      (project) => project.assignedConsultants < project.consultantsRequired
    ),
    overloadedConsultants: consultants.filter(
      (consultant) =>
        consultant.availability === "unavailable" || consultant.occupancyPercent >= 75
    ),
    partiallyLoadedConsultants: consultants.filter(
      (consultant) =>
        consultant.availability === "partial" &&
        consultant.occupancyPercent >= 55 &&
        consultant.occupancyPercent < 75
    ),
    upcomingProjects: [...(visibleProjects.length ? visibleProjects : activeProjects)].sort(
      (left, right) => new Date(left.endDate).getTime() - new Date(right.endDate).getTime()
    ),
    conversationCount: input.conversationCount ?? 0,
    unreadConversationCount: input.unreadConversationCount ?? 0
  };
}

function classifyIntent(question: string, snapshot: AssistantSnapshot): AssistantIntent {
  const normalizedQuestion = normalizeAssistantText(question);

  if (!normalizedQuestion) {
    return "unknown";
  }

  if (
    GREETING_TOKENS.some((token) => normalizedQuestion === token || normalizedQuestion.startsWith(`${token} `))
  ) {
    return "greeting";
  }

  if (includesAny(normalizedQuestion, KPI_TOKENS)) {
    return "kpis";
  }

  if (includesAny(normalizedQuestion, ALERT_TOKENS)) {
    return "alerts";
  }

  if (includesAny(normalizedQuestion, ASSIGNMENT_TOKENS)) {
    return "assignments";
  }

  if (includesAny(normalizedQuestion, DELIVERABLE_TOKENS)) {
    return "deliverables";
  }

  if (includesAny(normalizedQuestion, RECOMMENDATION_TOKENS)) {
    return "recommendations";
  }

  if (
    includesAny(normalizedQuestion, PROJECT_TOKENS) ||
    findProjectMatch(normalizedQuestion, snapshot)
  ) {
    return "projects";
  }

  if (
    normalizedQuestion.includes("consultor") ||
    normalizedQuestion.includes("consultora") ||
    findConsultantMatch(normalizedQuestion, snapshot)
  ) {
    return "consultants";
  }

  if (
    includesAny(normalizedQuestion, PLATFORM_HELP_TOKENS) ||
    snapshot.pathname.includes("/workspace/chat") ||
    snapshot.pathname.includes("/workspace/calendar")
  ) {
    return "platform_help";
  }

  return "unknown";
}

function getDefaultSuggestions(snapshot: AssistantSnapshot) {
  return snapshot.session.role === "LEADER"
    ? [
        "Que proyectos estan en riesgo?",
        "Que consultores tienen carga alta?",
        "Que asignaciones requieren intervencion?"
      ]
    : [
        "Que entregables vencen primero?",
        "Como va mi carga actual?",
        "Que proyecto requiere mas atencion?"
      ];
}

function findConsultantMatch(
  normalizedQuestion: string,
  snapshot: AssistantSnapshot
): DashboardConsultantRecord | null {
  const matches = snapshot.consultants
    .map((consultant) => {
      const fullName = normalizeAssistantText(consultant.fullName);
      const tokens = fullName.split(" ").filter((token) => token.length >= 3);
      let score = 0;

      if (normalizedQuestion.includes(fullName)) {
        score += 6;
      }

      for (const token of tokens) {
        if (normalizedQuestion.includes(token)) {
          score += 2;
        }
      }

      if (normalizedQuestion.includes(normalizeAssistantText(consultant.specialty))) {
        score += 1;
      }

      return {
        consultant,
        score
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return matches[0]?.consultant ?? null;
}

function findProjectMatch(
  normalizedQuestion: string,
  snapshot: AssistantSnapshot
): DashboardProjectRecord | null {
  const matches = snapshot.activeProjects
    .map((project) => {
      const normalizedName = normalizeAssistantText(project.name);
      const normalizedClient = normalizeAssistantText(project.client);
      let score = 0;

      if (normalizedQuestion.includes(project.folio.toLowerCase())) {
        score += 6;
      }

      if (normalizedQuestion.includes(normalizedName)) {
        score += 5;
      }

      if (normalizedQuestion.includes(normalizedClient)) {
        score += 2;
      }

      for (const token of normalizedName.split(" ").filter((token) => token.length >= 4)) {
        if (normalizedQuestion.includes(token)) {
          score += 1;
        }
      }

      return {
        project,
        score
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return matches[0]?.project ?? null;
}

function getTopRiskReason(project: DashboardProjectRecord) {
  if (requiresManualAssignment(project)) {
    return "ya requiere asignacion manual por rechazos o cobertura incompleta";
  }

  if (project.openRisks[0]) {
    return project.openRisks[0].title.toLowerCase();
  }

  if (project.progress < 60) {
    return "muestra avance por debajo del umbral esperado";
  }

  if (project.assignedConsultants < project.consultantsRequired) {
    return "sigue con cobertura parcial de consultores";
  }

  return "requiere seguimiento operativo cercano";
}

function buildWelcomeReply(snapshot: AssistantSnapshot): AssistantReply {
  if (snapshot.session.role === "LEADER") {
    const leaderData = getLeaderDashboardMock(snapshot.session, snapshot.activeProjects);

    return {
      intent: "greeting",
      contextLabel: snapshot.contextLabel,
      usedData: true,
      suggestions: getDefaultSuggestions(snapshot),
      text: `Hola. Puedo ayudarte a revisar proyectos, KPIs, consultores, asignaciones y alertas desde tu contexto actual.\n\nHoy veo ${leaderData.metrics[0]?.value ?? "0"} proyectos activos, ${snapshot.atRiskProjects.length} con riesgo visible y ${snapshot.interventionProjects.length} que ya requieren intervencion manual.`
    };
  }

  const consultant = snapshot.currentConsultant;

  return {
    intent: "greeting",
    contextLabel: snapshot.contextLabel,
    usedData: Boolean(consultant),
    suggestions: getDefaultSuggestions(snapshot),
    text: consultant
      ? `Hola. Puedo ayudarte a revisar entregables, KPIs, carga, proyectos y siguientes pasos sin salir del workspace.\n\nHoy tienes ${snapshot.visibleProjects.length} frentes visibles y una carga operativa de ${consultant.occupancyPercent}%.`
      : "Hola. Puedo ayudarte a revisar entregables, KPIs, carga, proyectos y siguientes pasos dentro del workspace."
  };
}

function buildKpiReply(question: string, snapshot: AssistantSnapshot): AssistantReply {
  const normalizedQuestion = normalizeAssistantText(question);
  const consultant =
    findConsultantMatch(normalizedQuestion, snapshot) ??
    (normalizedQuestion.includes("mi ") || normalizedQuestion.includes("mis ")
      ? snapshot.currentConsultant
      : null) ??
    (snapshot.session.role === "CONSULTANT" ? snapshot.currentConsultant : null);

  if (!consultant) {
    return {
      intent: "kpis",
      contextLabel: snapshot.contextLabel,
      usedData: false,
      suggestions: [
        "Que KPIs tiene Maricela?",
        "Que consultores tienen carga alta?",
        "Que proyectos estan en riesgo?"
      ],
      text: "Puedo revisar KPIs, pero necesito el nombre del consultor o que me indiques si quieres ver tus metricas actuales."
    };
  }

  const kpis = getConsultantExtendedKpis(consultant);
  const activeProjectCount = consultant.assignedProjectSlugs.length;
  let recommendation =
    consultant.occupancyPercent >= 75
      ? "Detecto carga alta. Conviene revisar proximas asignaciones antes de sumarle otro frente."
      : consultant.kpiSnapshot.deliveryCompliance < 90
        ? "El cumplimiento esta por debajo del umbral premium esperado. Conviene revisar entregables recientes y tiempos de respuesta."
        : activeProjectCount >= 2
          ? "El perfil mantiene buen desempeno, pero ya opera en varios frentes. Vale la pena cuidar capacidad antes de asignar mas trabajo."
          : "El perfil se ve estable y con margen operativo sano para sostener el ritmo actual.";

  return {
    intent: "kpis",
    contextLabel: snapshot.contextLabel,
    usedData: true,
    suggestions: [
      `Que proyectos tiene ${consultant.fullName.split(" ")[0]}?`,
      "Que consultores tienen carga alta?",
      "Que proyectos estan en riesgo?"
    ],
    text: `Estos son los KPIs visibles de ${consultant.fullName}:\n- Cumplimiento: ${kpis[0]?.value ?? "N/D"}\n- Tiempo de respuesta: ${kpis[1]?.value ?? "N/D"}\n- Calidad: ${kpis[2]?.value ?? "N/D"}\n- Carga actual: ${kpis[3]?.value ?? "N/D"}\n- Proyectos activos: ${kpis[4]?.value ?? "N/D"}\n\n${recommendation}`
  };
}

function buildConsultantReply(question: string, snapshot: AssistantSnapshot): AssistantReply {
  const normalizedQuestion = normalizeAssistantText(question);
  const matchedConsultant = findConsultantMatch(normalizedQuestion, snapshot);

  if (matchedConsultant) {
    const assignedProjects = snapshot.activeProjects.filter((project) =>
      matchedConsultant.assignedProjectSlugs.includes(project.slug)
    );

    return {
      intent: "consultants",
      contextLabel: snapshot.contextLabel,
      usedData: true,
      suggestions: [
        `Que KPIs tiene ${matchedConsultant.fullName.split(" ")[0]}?`,
        assignedProjects[0] ? `Que pasa con ${assignedProjects[0].folio}?` : "Que proyectos estan en riesgo?",
        "Que consultores tienen disponibilidad?"
      ],
      text: `${matchedConsultant.fullName} opera como ${matchedConsultant.specialty}.\n- Disponibilidad: ${getConsultantAvailabilityLabel(matchedConsultant.availability)}\n- Carga actual: ${matchedConsultant.occupancyPercent}%\n- Proyectos activos: ${assignedProjects.length}\n- Skills clave: ${matchedConsultant.skills.slice(0, 3).join(", ")}\n\n${matchedConsultant.note}`
    };
  }

  const visibleConsultants = snapshot.consultants
    .filter((consultant) => consultant.availability !== "unavailable")
    .sort((left, right) => left.occupancyPercent - right.occupancyPercent)
    .slice(0, 3);

  if (!visibleConsultants.length) {
    return {
      intent: "consultants",
      contextLabel: snapshot.contextLabel,
      usedData: false,
      suggestions: getDefaultSuggestions(snapshot),
      text: "No veo consultores disponibles en este contexto operativo. Revisa el modulo de consultores o valida si el tenant actual ya tiene perfiles cargados."
    };
  }

  return {
    intent: "consultants",
    contextLabel: snapshot.contextLabel,
    usedData: true,
    suggestions: [
      "Que consultores tienen carga alta?",
      "Que proyectos requieren cobertura?",
      `Que KPIs tiene ${visibleConsultants[0].fullName.split(" ")[0]}?`
    ],
    text: `Estos son los consultores con mejor disponibilidad visible ahora mismo:\n${visibleConsultants
      .map(
        (consultant) =>
          `- ${consultant.fullName}: ${getConsultantAvailabilityLabel(consultant.availability)}, carga ${consultant.occupancyPercent}% y foco en ${consultant.skills.slice(0, 2).join(", ")}`
      )
      .join("\n")}`
  };
}

function buildProjectReply(question: string, snapshot: AssistantSnapshot): AssistantReply {
  const normalizedQuestion = normalizeAssistantText(question);
  const matchedProject = findProjectMatch(normalizedQuestion, snapshot);

  if (matchedProject) {
    const nextMilestone = matchedProject.milestones[0];

    return {
      intent: "projects",
      contextLabel: snapshot.contextLabel,
      usedData: true,
      suggestions: [
        `Que riesgos tiene ${matchedProject.folio}?`,
        `Que equipo sugieres para ${matchedProject.folio}?`,
        "Que proyectos estan en riesgo?"
      ],
      text: `${matchedProject.folio} | ${matchedProject.name}\n- Estado: ${getProjectStatusLabel(matchedProject.status)}\n- Avance: ${matchedProject.progress}%\n- Cobertura: ${matchedProject.assignedConsultants}/${matchedProject.consultantsRequired} consultores\n- Cliente: ${matchedProject.client}\n- Proximo hito: ${nextMilestone ? `${nextMilestone.title} (${formatDateLabel(nextMilestone.date)})` : "Sin hito visible"}\n\n${
        matchedProject.openRisks[0]
          ? `Riesgo principal: ${matchedProject.openRisks[0].title}.`
          : requiresManualAssignment(matchedProject)
            ? "Necesita intervencion manual para completar asignacion."
            : "No veo riesgos criticos abiertos en este momento."
      }`
    };
  }

  if (!snapshot.visibleProjects.length) {
    return {
      intent: "projects",
      contextLabel: snapshot.contextLabel,
      usedData: false,
      suggestions: getDefaultSuggestions(snapshot),
      text: "No hay proyectos visibles en tu contexto actual. Si esperabas ver uno, conviene revisar el tenant activo o abrir el listado de proyectos."
    };
  }

  return {
    intent: "projects",
    contextLabel: snapshot.contextLabel,
    usedData: true,
    suggestions: [
      "Que proyectos estan en riesgo?",
      "Que asignaciones requieren intervencion?",
      "Que entregables vencen primero?"
    ],
    text: `Estos son los proyectos que hoy concentran la operacion:\n${snapshot.visibleProjects
      .slice(0, 3)
      .map(
        (project) =>
          `- ${project.folio} | ${project.name}: ${getProjectStatusLabel(project.status)}, ${project.progress}% de avance y cierre objetivo el ${formatDateLabel(project.endDate)}`
      )
      .join("\n")}`
  };
}

function buildAlertReply(snapshot: AssistantSnapshot): AssistantReply {
  const riskPool = [...snapshot.interventionProjects, ...snapshot.atRiskProjects].filter(
    (project, index, collection) =>
      collection.findIndex((item) => item.slug === project.slug) === index
  );

  if (!riskPool.length) {
    return {
      intent: "alerts",
      contextLabel: snapshot.contextLabel,
      usedData: true,
      suggestions: getDefaultSuggestions(snapshot),
      text: "No detecto alertas criticas abiertas ahora mismo. La operacion visible se mantiene controlada y sin frentes escalados."
    };
  }

  return {
    intent: "alerts",
    contextLabel: snapshot.contextLabel,
    usedData: true,
    suggestions: [
      "Que accion sugieres para el proyecto mas critico?",
      "Que asignaciones requieren intervencion?",
      "Que consultores tienen carga alta?"
    ],
    text: `Detecte estos frentes con mayor riesgo operativo:\n${riskPool
      .slice(0, 3)
      .map(
        (project) =>
          `- ${project.folio} | ${project.name}: ${getTopRiskReason(project)}.`
      )
      .join("\n")}\n\nTe recomiendo revisar primero los proyectos marcados para intervencion manual o con riesgos abiertos antes de sumar nuevas asignaciones.`
  };
}

function buildAssignmentReply(question: string, snapshot: AssistantSnapshot): AssistantReply {
  const normalizedQuestion = normalizeAssistantText(question);
  const matchedProject = findProjectMatch(normalizedQuestion, snapshot);

  if (matchedProject) {
    const suggestedConsultants = getSuggestedConsultantsForProject(
      matchedProject,
      snapshot.consultants,
      3
    ).filter((consultant) => consultant.availability !== "unavailable");

    if (!suggestedConsultants.length) {
      return {
        intent: "assignments",
        contextLabel: snapshot.contextLabel,
        usedData: true,
        suggestions: [
          "Que consultores tienen carga alta?",
          "Que proyectos estan en riesgo?",
          "Que accion sugieres ahora?"
        ],
        text: "No hay suficientes consultores con disponibilidad optima para este proyecto."
      };
    }

    return {
      intent: "assignments",
      contextLabel: snapshot.contextLabel,
      usedData: true,
      suggestions: [
        `Que riesgos tiene ${matchedProject.folio}?`,
        `Que KPIs tiene ${suggestedConsultants[0].fullName.split(" ")[0]}?`,
        "Que proyectos requieren cobertura?"
      ],
      text: `Equipo sugerido para ${matchedProject.folio}:\n${suggestedConsultants
        .map((consultant) => {
          const matchScore = Math.max(
            0,
            Math.round(
              100 -
                Math.abs(consultant.occupancyPercent - 38) * 0.4 +
                consultant.kpiSnapshot.deliveryCompliance * 0.18
            )
          );

          return `- ${consultant.fullName}: match ${matchScore}, ${getConsultantAvailabilityLabel(consultant.availability)}, carga ${consultant.occupancyPercent}% y skills ${consultant.skills.slice(0, 2).join(", ")}`
        })
        .join("\n")}`
    };
  }

  if (!snapshot.coverageGapProjects.length) {
    return {
      intent: "assignments",
      contextLabel: snapshot.contextLabel,
      usedData: true,
      suggestions: getDefaultSuggestions(snapshot),
      text: "No veo proyectos con huecos de cobertura en este momento. La asignacion visible esta completa para los frentes activos."
    };
  }

  return {
    intent: "assignments",
    contextLabel: snapshot.contextLabel,
    usedData: true,
    suggestions: [
      `Que equipo sugieres para ${snapshot.coverageGapProjects[0].folio}?`,
      "Que consultores tienen carga alta?",
      "Que proyectos estan en riesgo?"
    ],
    text: `Estos frentes necesitan atencion de asignacion:\n${snapshot.coverageGapProjects
      .slice(0, 3)
      .map(
        (project) =>
          `- ${project.folio}: cobertura ${project.assignedConsultants}/${project.consultantsRequired} y estado ${getProjectStatusLabel(project.status)}`
      )
      .join("\n")}`
  };
}

function buildDeliverablesReply(snapshot: AssistantSnapshot): AssistantReply {
  const deliverableProjects = snapshot.upcomingProjects.slice(0, 3);

  if (!deliverableProjects.length) {
    return {
      intent: "deliverables",
      contextLabel: snapshot.contextLabel,
      usedData: false,
      suggestions: getDefaultSuggestions(snapshot),
      text: "No encuentro entregables visibles en este contexto. Conviene revisar el calendario o abrir el detalle del proyecto para validar proximos hitos."
    };
  }

  return {
    intent: "deliverables",
    contextLabel: snapshot.contextLabel,
    usedData: true,
    suggestions: [
      "Que proyecto requiere mas atencion?",
      "Que riesgos debo revisar primero?",
      "Como va mi carga actual?"
    ],
    text: `Estos son los entregables o cierres mas cercanos:\n${deliverableProjects
      .map(
        (project) =>
          `- ${project.folio} | ${project.name}: cierre objetivo ${formatDateLabel(project.endDate)} con ${project.progress}% de avance`
      )
      .join("\n")}`
  };
}

function buildPlatformHelpReply(snapshot: AssistantSnapshot): AssistantReply {
  if (snapshot.pathname.includes("/workspace/chat")) {
    return {
      intent: "platform_help",
      contextLabel: snapshot.contextLabel,
      usedData: true,
      suggestions: [
        "Que proyectos estan en riesgo?",
        "Que consultores tienen carga alta?",
        "Que entregables vencen primero?"
      ],
      text: `Estas en el modulo de chat. Aqui puedes abrir conversaciones activas, responder seguimientos y revisar el estado del hilo.\n\nAhora mismo veo ${snapshot.conversationCount} conversaciones visibles y ${snapshot.unreadConversationCount} mensajes sin leer.`
    };
  }

  if (snapshot.pathname.includes("/workspace/calendar")) {
    return {
      intent: "platform_help",
      contextLabel: snapshot.contextLabel,
      usedData: true,
      suggestions: [
        "Que entregables vencen primero?",
        "Como va mi carga actual?",
        "Que proyecto requiere mas atencion?"
      ],
      text: "Estas en calendario. Desde aqui conviene revisar vencimientos, bloques de trabajo y recordatorios antes de cargar avances o entregables."
    };
  }

  if (snapshot.pathname.includes("/workspace/projects/")) {
    return {
      intent: "platform_help",
      contextLabel: snapshot.contextLabel,
      usedData: true,
      suggestions: [
        "Que riesgos tiene este proyecto?",
        "Que equipo sugieres para este proyecto?",
        "Que entregables estan pendientes?"
      ],
      text: "Estas dentro del detalle de un proyecto. Usa esta vista para revisar avance, riesgos, asignacion, cliente y timeline sin perder trazabilidad."
    };
  }

  return {
    intent: "platform_help",
    contextLabel: snapshot.contextLabel,
    usedData: true,
    suggestions: getDefaultSuggestions(snapshot),
    text:
      snapshot.session.role === "LEADER"
        ? "Puedo orientarte dentro del dashboard, el listado de proyectos, la intervencion manual, el chat y el registro de consultores."
        : "Puedo orientarte dentro de tus proyectos, el calendario, el chat, los entregables y el historial de avances."
  };
}

function buildRecommendationReply(snapshot: AssistantSnapshot): AssistantReply {
  const recommendations: string[] = [];

  if (snapshot.interventionProjects[0]) {
    recommendations.push(
      `Prioriza ${snapshot.interventionProjects[0].folio} porque ya requiere asignacion manual inmediata.`
    );
  }

  if (snapshot.atRiskProjects[0]) {
    recommendations.push(
      `Revisa ${snapshot.atRiskProjects[0].folio} para contener el riesgo principal: ${getTopRiskReason(snapshot.atRiskProjects[0])}.`
    );
  }

  if (snapshot.overloadedConsultants[0]) {
    recommendations.push(
      `Evita sumar carga a ${snapshot.overloadedConsultants[0].fullName}; hoy opera al ${snapshot.overloadedConsultants[0].occupancyPercent}% de capacidad.`
    );
  }

  if (!recommendations.length && snapshot.upcomingProjects[0]) {
    recommendations.push(
      `Mantente sobre ${snapshot.upcomingProjects[0].folio} porque tiene el hito mas cercano en ${formatDateLabel(snapshot.upcomingProjects[0].endDate)}.`
    );
  }

  return {
    intent: "recommendations",
    contextLabel: snapshot.contextLabel,
    usedData: recommendations.length > 0,
    suggestions: [
      "Que proyectos estan en riesgo?",
      "Que consultores tienen carga alta?",
      "Que entregables vencen primero?"
    ],
    text: `Estas son mis recomendaciones operativas ahora mismo:\n${recommendations
      .slice(0, 3)
      .map((item) => `- ${item}`)
      .join("\n")}`
  };
}

function buildUnknownReply(snapshot: AssistantSnapshot): AssistantReply {
  return {
    intent: "unknown",
    contextLabel: snapshot.contextLabel,
    usedData: false,
    suggestions: getDefaultSuggestions(snapshot),
    text:
      "Puedo ayudarte, pero necesito un poco mas de precision. Dime si quieres revisar proyectos, consultores, KPIs, alertas, asignaciones o entregables."
  };
}

export function getAssistantWelcomeReply(context: AssistantRuntimeContext) {
  return buildWelcomeReply(buildSnapshot(context));
}

export function getAssistantPromptSuggestions(context: AssistantRuntimeContext) {
  return getDefaultSuggestions(buildSnapshot(context));
}

export function createAssistantReply(
  question: string,
  context: AssistantRuntimeContext
): AssistantReply {
  const snapshot = buildSnapshot(context);
  const intent = classifyIntent(question, snapshot);

  switch (intent) {
    case "greeting":
      return buildWelcomeReply(snapshot);
    case "kpis":
      return buildKpiReply(question, snapshot);
    case "consultants":
      return buildConsultantReply(question, snapshot);
    case "projects":
      return buildProjectReply(question, snapshot);
    case "alerts":
      return buildAlertReply(snapshot);
    case "assignments":
      return buildAssignmentReply(question, snapshot);
    case "deliverables":
      return buildDeliverablesReply(snapshot);
    case "platform_help":
      return buildPlatformHelpReply(snapshot);
    case "recommendations":
      return buildRecommendationReply(snapshot);
    default:
      return buildUnknownReply(snapshot);
  }
}
