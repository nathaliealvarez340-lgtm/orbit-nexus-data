import "server-only";

import {
  ActivityLogType,
  AIConversationStatus,
  AIMessageRole,
  Prisma
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import {
  runOrbitAiTool,
  type OrbitAiToolName,
  type OrbitAiToolResult
} from "@/lib/services/orbit-ai/tools";
import {
  detectMaiaAction,
  getMaiaActionSuggestions,
  type MaiaAction,
  type MaiaActionIntent
} from "@/lib/services/orbit-ai/action-router";
import { canAccessFinanceModule, canAccessQuotesModule } from "@/lib/auth/authorization";
import type { SessionUser } from "@/types/auth";

export type OrbitAiIntent =
  | "greeting"
  | "summary"
  | "projects"
  | "tasks"
  | "kpis"
  | "alerts"
  | "quotes"
  | "invoices"
  | "clients"
  | "tax_profile"
  | "integrations"
  | "reports"
  | "draft_report"
  | "recommendations"
  | "automations"
  | "priorities"
  | "bottlenecks"
  | "help"
  | MaiaActionIntent
  | "unknown";

export type OrbitAiReply = {
  conversationId: string | null;
  intent: OrbitAiIntent;
  contextLabel: string;
  usedData: boolean;
  tools: Array<{
    name: OrbitAiToolName;
    label: string;
    usedData: boolean;
  }>;
  text: string;
  suggestions: string[];
  action?: MaiaAction;
  voice: {
    wakeWord: string;
    ready: boolean;
    providers: string[];
  };
};

export type OrbitAiHistoryMessage = {
  id: string;
  sender: "assistant" | "user";
  text: string;
  intent?: OrbitAiIntent;
  contextLabel?: string;
  suggestions?: string[];
  usedData?: boolean;
  tools?: Array<{
    name: string;
    label: string;
    usedData: boolean;
  }>;
  action?: MaiaAction;
  createdAt: string;
};

type OrbitAiInput = {
  conversationId?: string;
  question: string;
  inputMode?: "text" | "voice";
  routePath?: string;
  contextLabel?: string;
};

type OrbitAiConversationRecord = {
  id: string | null;
  companyId: string | null;
  contextLabel: string;
  routePath: string;
};

type SafeToolResult = OrbitAiToolResult & {
  denied?: boolean;
};

const GREETING_TOKENS = ["hola", "buenas", "hello", "hey", "saludos"];
const SUMMARY_TOKENS = ["resumen", "estado operativo", "dia", "hoy", "overview", "dashboard"];
const PROJECT_TOKENS = ["proyecto", "proyectos", "portafolio", "folio", "atrasado", "atrasados"];
const TASK_TOKENS = ["tarea", "tareas", "bloqueadas", "pendientes", "backlog", "prioridad"];
const KPI_TOKENS = ["kpi", "kpis", "metrica", "metricas", "desempeno", "indicador"];
const ALERT_TOKENS = ["alerta", "alertas", "riesgo", "riesgos", "incidencia"];
const QUOTE_TOKENS = ["cotizacion", "cotizaciones", "quote", "quotes", "propuesta"];
const INVOICE_TOKENS = ["factura", "facturas", "invoice", "invoices", "cfdi", "cobro"];
const CLIENT_TOKENS = ["cliente", "clientes", "empresa cliente", "empresas", "receptor", "receptores"];
const TAX_PROFILE_TOKENS = ["datos fiscales", "rfc", "razon social", "regimen fiscal", "csf"];
const INTEGRATION_TOKENS = ["integracion", "integraciones", "gmail", "outlook", "correo", "imap", "microsoft"];
const REPORT_TOKENS = ["reporte", "reportes", "semanal", "mensual", "ejecutivo"];
const DRAFT_REPORT_TOKENS = ["borrador de reporte", "genera un reporte", "crear reporte", "prepara reporte"];
const AUTOMATION_TOKENS = ["automatizacion", "automatizaciones", "automatiza", "workflow"];
const RECOMMENDATION_TOKENS = ["recomienda", "recomendacion", "recomendaciones", "accion", "acciones"];
const BOTTLENECK_TOKENS = ["cuello", "cuellos", "bloqueo", "bloqueos", "bottleneck"];
const HELP_TOKENS = ["como", "ayuda", "que puedes hacer", "que haces", "uso"];
const SENSITIVE_ACTION_TOKENS = [
  "borrar",
  "eliminar",
  "suspender",
  "emitir factura",
  "timbrar",
  "cancelar factura",
  "cambiar permisos",
  "dar permisos",
  "enviar informacion",
  "enviar correo",
  "modificar precio",
  "cobrar",
  "pagar"
];

const MAIA_MEMORY_DAYS = 3;

function getMemoryCutoffDate() {
  return new Date(Date.now() - MAIA_MEMORY_DAYS * 24 * 60 * 60 * 1000);
}

function asJson(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, tokens: string[]) {
  return tokens.some((token) => text.includes(normalizeText(token)));
}

function deriveContextLabel(routePath?: string, provided?: string) {
  if (provided?.trim()) {
    return provided.trim();
  }

  if (!routePath) {
    return "Command Center";
  }

  if (routePath.includes("/workspace/orbit-ai")) {
    return "MAIA Executive Agent";
  }

  if (routePath.includes("/workspace/projects/create")) {
    return "Creacion de proyecto";
  }

  if (routePath.includes("/workspace/projects/")) {
    return "Detalle de proyecto";
  }

  if (routePath.includes("/workspace/quotes")) {
    return "Cotizaciones";
  }

  if (routePath.includes("/workspace/invoices")) {
    return "Facturas";
  }

  if (routePath.includes("/workspace/tax-profile")) {
    return "Datos fiscales";
  }

  if (routePath.includes("/workspace/clients")) {
    return "Empresas / Clientes";
  }

  if (routePath.includes("/workspace/integrations")) {
    return "Integraciones";
  }

  if (routePath.includes("/workspace/chat")) {
    return "Conversaciones";
  }

  if (routePath.includes("/workspace")) {
    return "Command Center";
  }

  return "Operacion";
}

function classifyIntent(question: string): OrbitAiIntent {
  const normalized = normalizeText(question);

  if (!normalized) {
    return "unknown";
  }

  if (GREETING_TOKENS.some((token) => normalized === token || normalized.startsWith(`${token} `))) {
    return "greeting";
  }

  if (includesAny(normalized, DRAFT_REPORT_TOKENS)) {
    return "draft_report";
  }

  if (includesAny(normalized, QUOTE_TOKENS)) {
    return "quotes";
  }

  if (includesAny(normalized, INVOICE_TOKENS)) {
    return "invoices";
  }

  if (includesAny(normalized, TAX_PROFILE_TOKENS)) {
    return "tax_profile";
  }

  if (includesAny(normalized, CLIENT_TOKENS)) {
    return "clients";
  }

  if (includesAny(normalized, INTEGRATION_TOKENS)) {
    return "integrations";
  }

  if (includesAny(normalized, SUMMARY_TOKENS)) {
    return "summary";
  }

  if (includesAny(normalized, KPI_TOKENS)) {
    return "kpis";
  }

  if (includesAny(normalized, PROJECT_TOKENS)) {
    return "projects";
  }

  if (includesAny(normalized, TASK_TOKENS)) {
    return "tasks";
  }

  if (includesAny(normalized, ALERT_TOKENS)) {
    return "alerts";
  }

  if (includesAny(normalized, REPORT_TOKENS)) {
    return "reports";
  }

  if (includesAny(normalized, AUTOMATION_TOKENS)) {
    return "automations";
  }

  if (includesAny(normalized, RECOMMENDATION_TOKENS)) {
    return "recommendations";
  }

  if (includesAny(normalized, BOTTLENECK_TOKENS)) {
    return "bottlenecks";
  }

  if (includesAny(normalized, HELP_TOKENS)) {
    return "help";
  }

  return "unknown";
}

function requiresExplicitConfirmation(question: string, inputMode: "text" | "voice") {
  if (inputMode !== "voice") {
    return false;
  }

  const normalized = normalizeText(question);
  return includesAny(normalized, SENSITIVE_ACTION_TOKENS);
}

function getDefaultSuggestions() {
  return [
    "Dame el resumen ejecutivo del dia.",
    "Que proyectos estan atrasados?",
    "Que facturas estan pendientes?"
  ];
}

function getSuggestionsForIntent(intent: OrbitAiIntent) {
  switch (intent) {
    case "create_quote":
    case "open_quotes":
      return getMaiaActionSuggestions(intent === "create_quote" ? "create_quote" : "open_quotes");
    case "create_client":
    case "open_clients":
      return getMaiaActionSuggestions(intent === "create_client" ? "create_client" : "open_clients");
    case "create_task":
      return getMaiaActionSuggestions("create_task");
    case "open_tax_profile":
      return ["Revisar RFC.", "Completar datos fiscales.", "Abrir facturas."];
    case "open_invoices":
    case "create_invoice_draft":
      return ["Que facturas estan pendientes?", "Abrir datos fiscales.", "Abrir cotizaciones."];
    case "open_dashboard":
    case "summarize_operation":
      return getDefaultSuggestions();
    case "open_reports":
      return ["Genera un borrador de reporte.", "Dame riesgos operativos.", "Que tareas son prioridad?"];
    case "quotes":
      return ["Que cotizaciones estan pendientes?", "Que facturas estan pendientes?", "Dame recomendaciones de accion."];
    case "invoices":
      return ["Que facturas estan pendientes?", "Que cotizaciones estan pendientes?", "Genera un borrador de reporte."];
    case "clients":
      return ["Que clientes tienen datos fiscales incompletos?", "Que cotizaciones estan pendientes?", "Revisa datos fiscales."];
    case "tax_profile":
      return ["Revisa datos fiscales.", "Que falta para facturacion futura?", "Que facturas estan pendientes?"];
    case "integrations":
      return ["Que integraciones estan conectadas?", "Como preparo Gmail?", "Dame recomendaciones de accion."];
    case "projects":
      return ["Que tareas son prioridad?", "Detecta riesgos operativos.", "Dame el resumen ejecutivo del dia."];
    case "tasks":
      return ["Sugiere tareas.", "Que proyectos estan atrasados?", "Que KPI estan bajos?"];
    case "kpis":
      return ["Que area necesita atencion?", "Dame recomendaciones de accion.", "Detecta riesgos operativos."];
    case "draft_report":
      return ["Dame el resumen ejecutivo del dia.", "Que tareas son prioridad?", "Que facturas estan pendientes?"];
    default:
      return getDefaultSuggestions();
  }
}

function selectTools(intent: OrbitAiIntent, session: SessionUser): OrbitAiToolName[] {
  const quoteTools: OrbitAiToolName[] = canAccessQuotesModule(session.role) ? ["pending_quotes"] : [];
  const invoiceTools: OrbitAiToolName[] = canAccessFinanceModule(session.role) ? ["pending_invoices"] : [];
  const financeTools: OrbitAiToolName[] = [...quoteTools, ...invoiceTools];

  switch (intent) {
    case "summary":
      return ["operational_summary", "priority_tasks", "low_kpis", "operational_risks", ...financeTools];
    case "projects":
      return ["delayed_projects"];
    case "tasks":
      return ["priority_tasks"];
    case "kpis":
      return ["low_kpis"];
    case "alerts":
    case "bottlenecks":
      return ["operational_risks", "priority_tasks", "low_kpis"];
    case "quotes":
      return ["pending_quotes"];
    case "invoices":
      return ["pending_invoices"];
    case "clients":
      return ["clients_summary"];
    case "tax_profile":
      return ["tax_profile_status"];
    case "integrations":
      return ["integrations_status"];
    case "reports":
      return ["operational_summary", "operational_risks", "priority_tasks"];
    case "draft_report":
      return ["draft_executive_report"];
    case "recommendations":
    case "priorities":
      return ["suggest_tasks", "operational_summary", ...financeTools];
    case "automations":
      return ["operational_summary"];
    default:
      return ["operational_summary"];
  }
}

function buildPermissionDeniedResult(tool: OrbitAiToolName, message: string): SafeToolResult {
  return {
    tool,
    label: "Permiso requerido",
    usedData: false,
    denied: true,
    findings: [message],
    recommendations: ["Solicita acceso operativo o financiero si necesitas revisar este modulo."],
    data: {}
  };
}

async function runToolSafely(session: SessionUser, toolName: OrbitAiToolName): Promise<SafeToolResult> {
  try {
    return await runOrbitAiTool(session, toolName);
  } catch (error) {
    if (error instanceof ServiceError) {
      return buildPermissionDeniedResult(toolName, error.message);
    }

    return buildPermissionDeniedResult(
      toolName,
      "No pude ejecutar esta herramienta interna de forma segura."
    );
  }
}

function formatToolFindings(results: SafeToolResult[], maxItems = 7) {
  return results
    .flatMap((result) => result.findings.map((finding) => ({ finding, label: result.label })))
    .slice(0, maxItems)
    .map((item) => `- ${item.finding}`)
    .join("\n");
}

function formatRecommendations(results: SafeToolResult[], maxItems = 4) {
  const recommendations = Array.from(
    new Set(results.flatMap((result) => result.recommendations))
  ).slice(0, maxItems);

  if (!recommendations.length) {
    return "";
  }

  return `\n\nAcciones sugeridas:\n${recommendations.map((item) => `- ${item}`).join("\n")}`;
}

function buildReplyText(intent: OrbitAiIntent, results: SafeToolResult[]) {
  if (intent === "greeting") {
    return "Hola. Puedo ayudarte a revisar proyectos atrasados, tareas prioritarias, KPIs bajos, cotizaciones, facturas, riesgos operativos y reportes ejecutivos. Preguntame que necesitas analizar y usare herramientas internas con permisos controlados.";
  }

  if (intent === "help") {
    return "MAIA Executive Agent trabaja como copiloto ejecutivo interno: consulta datos por organizacion, resume operacion, recomienda acciones y puede preparar borradores de reportes. No puede borrar usuarios, emitir facturas, cambiar permisos ni enviar informacion externa sin una capa de confirmacion futura.";
  }

  if (intent === "unknown") {
    return "Puedo ayudarte mejor si precisas si quieres revisar proyectos, tareas, KPIs, cotizaciones, facturas, riesgos o reportes. Las herramientas internas solo consultan datos autorizados de tu organizacion.";
  }

  const findings = formatToolFindings(results);
  const recommendations = formatRecommendations(results);

  if (!findings) {
    return "Todavia no encontre datos suficientes en tu operacion. Puedes crear proyectos, clientes, cotizaciones o facturas para que pueda analizar mejor.";
  }

  switch (intent) {
    case "summary":
      return `Resumen ejecutivo del dia:\n${findings}${recommendations}`;
    case "projects":
      return `Proyectos atrasados o en riesgo:\n${findings}${recommendations}`;
    case "tasks":
      return `Tareas prioritarias:\n${findings}${recommendations}`;
    case "kpis":
      return `KPIs con atencion requerida:\n${findings}${recommendations}`;
    case "alerts":
    case "bottlenecks":
      return `Riesgos operativos detectados:\n${findings}${recommendations}`;
    case "quotes":
      return `Cotizaciones pendientes:\n${findings}${recommendations}`;
    case "invoices":
      return `Facturas pendientes:\n${findings}${recommendations}`;
    case "clients":
      return `Empresas y clientes:\n${findings}${recommendations}`;
    case "tax_profile":
      return `Datos fiscales:\n${findings}${recommendations}`;
    case "integrations":
      return `Integraciones:\n${findings}${recommendations}`;
    case "draft_report":
      return `Reporte ejecutivo preparado:\n${findings}${recommendations}`;
    case "reports":
      return `Lectura para reporte ejecutivo:\n${findings}${recommendations}`;
    case "recommendations":
    case "priorities":
      return `Recomendaciones de accion:\n${findings}${recommendations}`;
    default:
      return `${findings}${recommendations}`;
  }
}

async function ensureConversation(params: {
  companyId: string | null;
  userId: string;
  routePath: string;
  contextLabel: string;
  conversationId?: string;
}) {
  const { companyId, userId, routePath, contextLabel, conversationId } = params;
  const memoryCutoff = getMemoryCutoffDate();

  if (!companyId) {
    return {
      id: null,
      companyId: null,
      routePath,
      contextLabel
    } satisfies OrbitAiConversationRecord;
  }

  if (conversationId) {
    const existingConversation = await prisma.aIConversation.findFirst({
      where: {
        id: conversationId,
        companyId,
        userId,
        updatedAt: {
          gte: memoryCutoff
        }
      }
    });

    if (existingConversation) {
      return {
        id: existingConversation.id,
        companyId,
        routePath: existingConversation.routePath ?? routePath,
        contextLabel: existingConversation.contextLabel ?? contextLabel
      } satisfies OrbitAiConversationRecord;
    }
  }

  const activeConversation = await prisma.aIConversation.findFirst({
    where: {
      companyId,
      userId,
      status: AIConversationStatus.ACTIVE,
      routePath,
      updatedAt: {
        gte: memoryCutoff
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (activeConversation) {
    return {
      id: activeConversation.id,
      companyId,
      routePath: activeConversation.routePath ?? routePath,
      contextLabel: activeConversation.contextLabel ?? contextLabel
    } satisfies OrbitAiConversationRecord;
  }

  const createdConversation = await prisma.aIConversation.create({
    data: {
      companyId,
      userId,
      title: `MAIA Executive Agent | ${contextLabel}`,
      status: AIConversationStatus.ACTIVE,
      contextLabel,
      routePath,
      lastMessageAt: new Date(),
      metadata: asJson({
        architecture: "internal-tools",
        voice: {
          wakeWord: "MAIA",
          providers: ["Web Speech API", "Whisper", "Deepgram", "ElevenLabs"]
        }
      })
    }
  });

  return {
    id: createdConversation.id,
    companyId,
    routePath,
    contextLabel
  } satisfies OrbitAiConversationRecord;
}

async function persistMessage(params: {
  conversationId: string | null;
  companyId: string | null;
  userId: string;
  role: AIMessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  const { conversationId, companyId, userId, role, content, metadata } = params;

  if (!conversationId || !companyId) {
    return;
  }

  await prisma.aIMessage.create({
    data: {
      conversationId,
      companyId,
      userId: role === AIMessageRole.ASSISTANT ? null : userId,
      role,
      content,
      metadata: asJson(metadata)
    }
  });

  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      updatedAt: new Date()
    }
  });
}

async function recordActivity(params: {
  companyId: string | null;
  userId: string;
  routePath: string;
  question: string;
  intent: OrbitAiIntent;
  tools: SafeToolResult[];
  inputMode: "text" | "voice";
  requiresConfirmation?: boolean;
}) {
  const { companyId, userId, routePath, question, intent, tools, inputMode, requiresConfirmation } = params;

  if (!companyId) {
    return;
  }

  await prisma.activityLog.create({
    data: {
      companyId,
      userId,
      type: ActivityLogType.AI,
      title: "MAIA Executive Agent uso herramientas internas",
      description: `Consulta registrada: ${question}`,
      routePath,
      metadata: asJson({
        intent,
        inputMode,
        requiresConfirmation: Boolean(requiresConfirmation),
        tools: tools.map((tool) => ({
          name: tool.tool,
          usedData: tool.usedData,
          denied: Boolean(tool.denied)
        }))
      })
    }
  });
}

export async function getOrbitAiHistory(
  session: SessionUser,
  params: { conversationId?: string; routePath?: string }
) {
  const companyId = session.companyId ?? session.tenantId;
  const memoryCutoff = getMemoryCutoffDate();

  if (!companyId) {
    return {
      conversationId: null,
      messages: [] satisfies OrbitAiHistoryMessage[]
    };
  }

  const conversation = params.conversationId
    ? await prisma.aIConversation.findFirst({
        where: {
          id: params.conversationId,
          companyId,
          userId: session.userId,
          updatedAt: {
            gte: memoryCutoff
          }
        }
      })
    : await prisma.aIConversation.findFirst({
        where: {
          companyId,
          userId: session.userId,
          status: AIConversationStatus.ACTIVE,
          routePath: params.routePath || "/workspace",
          updatedAt: {
            gte: memoryCutoff
          }
        },
        orderBy: { updatedAt: "desc" }
      });

  if (!conversation) {
    return {
      conversationId: null,
      messages: [] satisfies OrbitAiHistoryMessage[]
    };
  }

  const messages = await prisma.aIMessage.findMany({
    where: {
      conversationId: conversation.id,
      companyId,
      createdAt: {
        gte: memoryCutoff
      }
    },
    orderBy: { createdAt: "asc" },
    take: 40
  });

  return {
    conversationId: conversation.id,
    messages: messages.map((message) => {
      const metadata = message.metadata as {
        intent?: OrbitAiIntent;
        contextLabel?: string;
        suggestions?: string[];
        usedData?: boolean;
        tools?: Array<{
          name: string;
          label: string;
          usedData: boolean;
        }>;
        action?: MaiaAction;
      } | null;

      return {
        id: message.id,
        sender: message.role === AIMessageRole.USER ? "user" : "assistant",
        text: message.content,
        intent: metadata?.intent,
        contextLabel: metadata?.contextLabel,
        suggestions: metadata?.suggestions,
        tools: metadata?.tools,
        usedData: metadata?.usedData,
        action: metadata?.action,
        createdAt: message.createdAt.toISOString()
      } satisfies OrbitAiHistoryMessage;
    })
  };
}

export async function clearOrbitAiHistory(session: SessionUser) {
  const companyId = session.companyId ?? session.tenantId;

  if (!companyId) {
    return {
      conversationsDeleted: 0,
      messagesDeleted: 0
    };
  }

  const conversations = await prisma.aIConversation.findMany({
    where: {
      companyId,
      userId: session.userId
    },
    select: {
      id: true
    }
  });
  const conversationIds = conversations.map((conversation) => conversation.id);

  if (!conversationIds.length) {
    return {
      conversationsDeleted: 0,
      messagesDeleted: 0
    };
  }

  const deletedMessages = await prisma.aIMessage.deleteMany({
    where: {
      companyId,
      conversationId: {
        in: conversationIds
      }
    }
  });
  const deletedConversations = await prisma.aIConversation.deleteMany({
    where: {
      companyId,
      userId: session.userId,
      id: {
        in: conversationIds
      }
    }
  });

  await prisma.activityLog.create({
    data: {
      companyId,
      userId: session.userId,
      type: ActivityLogType.AI,
      title: "MAIA limpio historial conversacional",
      description: "El usuario borro el historial reciente del asistente sin afectar datos operativos.",
      routePath: "/workspace/orbit-ai",
      metadata: asJson({
        conversationsDeleted: deletedConversations.count,
        messagesDeleted: deletedMessages.count
      })
    }
  });

  return {
    conversationsDeleted: deletedConversations.count,
    messagesDeleted: deletedMessages.count
  };
}

export async function runOrbitAi(session: SessionUser, input: OrbitAiInput): Promise<OrbitAiReply> {
  const question = input.question.trim();

  if (!question) {
    throw new ServiceError("Escribe una consulta valida para MAIA Executive Agent.", 400);
  }

  const companyId = session.companyId ?? session.tenantId;
  const inputMode = input.inputMode ?? "text";
  const routePath = input.routePath?.trim() || "/workspace";
  const contextLabel = deriveContextLabel(routePath, input.contextLabel);
  const conversation = await ensureConversation({
    companyId,
    userId: session.userId,
    routePath,
    contextLabel,
    conversationId: input.conversationId
  });
  const intent = classifyIntent(question);
  const needsConfirmation = requiresExplicitConfirmation(question, inputMode);

  await persistMessage({
    conversationId: conversation.id,
    companyId: conversation.companyId,
    userId: session.userId,
    role: AIMessageRole.USER,
    content: question,
    metadata: {
      routePath,
      contextLabel,
      inputMode
    }
  });

  if (!companyId) {
    const text =
      "No encuentro una organizacion activa asociada a esta sesion. MAIA Executive Agent necesita organizationId para consultar datos de forma segura.";

    await persistMessage({
      conversationId: conversation.id,
      companyId: conversation.companyId,
      userId: session.userId,
      role: AIMessageRole.ASSISTANT,
      content: text,
      metadata: {
        intent,
        contextLabel,
        suggestions: getDefaultSuggestions(),
        usedData: false,
        inputMode,
        tools: []
      }
    });

    return {
      conversationId: conversation.id,
      intent,
      contextLabel,
      usedData: false,
      tools: [],
      text,
      suggestions: getDefaultSuggestions(),
      voice: {
        wakeWord: "MAIA",
        ready: true,
        providers: ["Web Speech API", "Whisper", "Deepgram", "ElevenLabs"]
      }
    };
  }

  if (needsConfirmation) {
    const suggestions = [
      "Que facturas estan pendientes?",
      "Dame el resumen ejecutivo del dia.",
      "Dame recomendaciones de accion."
    ];
    const text =
      "Detecte una accion sensible solicitada por voz. No ejecute ningun cambio. Para proteger la operacion, borrar datos, emitir o cancelar facturas, cambiar permisos, cobrar, pagar o enviar informacion externa requerira confirmacion explicita y una herramienta segura en una fase posterior.";

    await persistMessage({
      conversationId: conversation.id,
      companyId: conversation.companyId,
      userId: session.userId,
      role: AIMessageRole.ASSISTANT,
      content: text,
      metadata: {
        intent,
        contextLabel,
        suggestions,
        usedData: false,
        inputMode,
        requiresConfirmation: true,
        tools: []
      }
    });

    await recordActivity({
      companyId,
      userId: session.userId,
      routePath,
      question,
      intent,
      tools: [],
      inputMode,
      requiresConfirmation: true
    });

    return {
      conversationId: conversation.id,
      intent,
      contextLabel,
      usedData: false,
      tools: [],
      text,
      suggestions,
      voice: {
        wakeWord: "MAIA",
        ready: true,
        providers: ["Web Speech API", "Whisper", "Deepgram", "ElevenLabs"]
      }
    };
  }

  const maiaAction = detectMaiaAction(question);

  if (maiaAction) {
    const actionIntent = maiaAction.intent;
    const suggestions = getMaiaActionSuggestions(actionIntent);
    const text = maiaAction.message;

    await persistMessage({
      conversationId: conversation.id,
      companyId: conversation.companyId,
      userId: session.userId,
      role: AIMessageRole.ASSISTANT,
      content: text,
      metadata: {
        intent: actionIntent,
        contextLabel,
        suggestions,
        usedData: false,
        inputMode,
        action: maiaAction,
        tools: []
      }
    });

    await recordActivity({
      companyId,
      userId: session.userId,
      routePath,
      question,
      intent: actionIntent,
      tools: [],
      inputMode,
      requiresConfirmation: maiaAction.requiresConfirmation
    });

    return {
      conversationId: conversation.id,
      intent: actionIntent,
      contextLabel,
      usedData: false,
      tools: [],
      text,
      suggestions,
      action: maiaAction,
      voice: {
        wakeWord: "MAIA",
        ready: true,
        providers: ["Web Speech API", "Whisper", "Deepgram", "ElevenLabs"]
      }
    };
  }

  const toolsToRun = intent === "greeting" || intent === "help" || intent === "unknown"
    ? []
    : selectTools(intent, session);
  const toolResults = await Promise.all(toolsToRun.map((toolName) => runToolSafely(session, toolName)));
  const text = buildReplyText(intent, toolResults);
  const suggestions = getSuggestionsForIntent(intent);
  const usedData = toolResults.some((tool) => tool.usedData);

  await persistMessage({
    conversationId: conversation.id,
    companyId: conversation.companyId,
    userId: session.userId,
    role: AIMessageRole.ASSISTANT,
    content: text,
    metadata: {
      intent,
      contextLabel,
      suggestions,
      usedData,
      inputMode,
      tools: toolResults.map((tool) => ({
        name: tool.tool,
        label: tool.label,
        usedData: tool.usedData,
        denied: Boolean(tool.denied)
      }))
    }
  });

  await recordActivity({
    companyId,
    userId: session.userId,
    routePath,
    question,
    intent,
    tools: toolResults,
    inputMode
  });

  return {
    conversationId: conversation.id,
    intent,
    contextLabel,
    usedData,
    tools: toolResults.map((tool) => ({
      name: tool.tool,
      label: tool.label,
      usedData: tool.usedData
    })),
    text,
    suggestions,
    voice: {
      wakeWord: "MAIA",
      ready: true,
      providers: ["Web Speech API", "Whisper", "Deepgram", "ElevenLabs"]
    }
  };
}
