"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  Loader2,
  Mic,
  Radio,
  RefreshCcw,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useVoiceAssistant } from "@/components/dashboard/maia-voice-provider";
import {
  OrbitAiVoiceControl,
  type OrbitAiVoiceStatus
} from "@/components/dashboard/orbit-ai-voice-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionUser } from "@/types/auth";

type WorkspaceAssistantProps = {
  session: SessionUser;
  embeddedLauncher?: boolean;
};

type MaiaActionIntent =
  | "create_quote"
  | "open_quotes"
  | "create_client"
  | "open_clients"
  | "open_tax_profile"
  | "open_invoices"
  | "create_invoice_draft"
  | "open_dashboard"
  | "search_module"
  | "summarize_operation"
  | "create_task"
  | "open_reports";

type OrbitAiIntent =
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

type AssistantVisualStatus = OrbitAiVoiceStatus;

type AssistantAction = {
  type: "navigate" | "navigate_and_start_flow" | "start_flow" | "prepare_draft";
  intent: MaiaActionIntent;
  route: string;
  action?: string;
  message: string;
  requiresConfirmation?: boolean;
  payload?: Record<string, unknown>;
};

type AssistantMessage = {
  id: string;
  sender: "assistant" | "user";
  text: string;
  intent?: OrbitAiIntent;
  contextLabel?: string;
  suggestions?: string[];
  usedData?: boolean;
  action?: AssistantAction;
  tools?: Array<{
    name: string;
    label: string;
    usedData: boolean;
  }>;
};

type MaiaQuotePatch = {
  clientName?: string;
  companyName?: string;
  clientEmail?: string;
  validUntil?: string;
  commercialTerms?: string;
  saveDraft?: boolean;
  lineItem?: {
    name?: string;
    description?: string;
    quantity?: number;
    basePrice?: number;
    discountPercent?: number;
    taxPercent?: number;
  };
};

const INTENT_LABELS: Record<OrbitAiIntent, string> = {
  greeting: "Contexto",
  summary: "Resumen",
  projects: "Proyectos",
  tasks: "Tareas",
  kpis: "KPIs",
  alerts: "Alertas",
  quotes: "Cotizaciones",
  invoices: "Facturas",
  clients: "Clientes",
  tax_profile: "Datos fiscales",
  integrations: "Integraciones",
  reports: "Reportes",
  draft_report: "Borrador",
  recommendations: "Recomendaciones",
  automations: "Automatizaciones",
  priorities: "Prioridades",
  bottlenecks: "Cuellos de botella",
  help: "Guia",
  create_quote: "Crear cotizacion",
  open_quotes: "Abrir cotizaciones",
  create_client: "Crear cliente",
  open_clients: "Abrir clientes",
  open_tax_profile: "Datos fiscales",
  open_invoices: "Abrir facturas",
  create_invoice_draft: "Borrador de factura",
  open_dashboard: "Command Center",
  search_module: "Busqueda",
  summarize_operation: "Resumen",
  create_task: "Crear tarea",
  open_reports: "Reportes",
  unknown: "Asistencia"
};

const VOICE_PROFILE_OPTIONS = [
  "Voz del navegador",
  "Voz femenina clara",
  "Voz ejecutiva",
  "Voz natural"
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@\s.,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSpokenValue(value: string) {
  return value
    .replace(/^[,:;\s]+/, "")
    .replace(/[.。]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMoney(value: string) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/,/g, "")
    .replace(/pesos|mxn/gi, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function extractAfter(original: string, normalized: string, markers: string[]) {
  for (const marker of markers) {
    const normalizedMarker = normalizeText(marker);
    const index = normalized.indexOf(normalizedMarker);

    if (index >= 0) {
      const start = index + normalizedMarker.length;
      return cleanSpokenValue(original.slice(start));
    }
  }

  return null;
}

function parseQuoteDictation(question: string): { patch: MaiaQuotePatch; reply: string } | null {
  const normalized = normalizeText(question);
  const patch: MaiaQuotePatch = {};
  const updatedFields: string[] = [];

  if (/\bguardar\b.*\bborrador\b/.test(normalized)) {
    patch.saveDraft = true;
    return {
      patch,
      reply: "Guarde la cotizacion como borrador. Revisa el preview y confirma si quieres ajustar algo mas."
    };
  }

  const email = question.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];

  if (email) {
    patch.clientEmail = email.toLowerCase();
    updatedFields.push("correo");
  }

  const clientName = extractAfter(question, normalized, [
    "el cliente es",
    "cliente es",
    "la empresa es",
    "empresa es"
  ]);

  if (clientName && !email) {
    patch.clientName = clientName;
    patch.companyName = clientName;
    updatedFields.push("cliente");
  }

  const concept = extractAfter(question, normalized, [
    "el concepto es",
    "concepto es",
    "el servicio es",
    "servicio es",
    "la partida es",
    "partida es"
  ]);

  if (concept) {
    patch.lineItem = {
      ...patch.lineItem,
      name: concept
    };
    updatedFields.push("concepto");
  }

  const description = extractAfter(question, normalized, [
    "la descripcion es",
    "descripcion es",
    "describe",
    "descripcion"
  ]);

  if (description) {
    patch.lineItem = {
      ...patch.lineItem,
      description
    };
    updatedFields.push("descripcion");
  }

  const quantityAndPrice = normalized.match(
    /(?:son|cantidad)\s+(\d+(?:[.,]\d+)?)\s+(?:unidades|servicios|piezas|items)?\s*(?:de|a|por)?\s*([\d,]+(?:\.\d+)?)(?:\s*(?:pesos|mxn))?/
  );

  if (quantityAndPrice) {
    patch.lineItem = {
      ...patch.lineItem,
      quantity: Number(quantityAndPrice[1].replace(",", ".")),
      basePrice: parseMoney(quantityAndPrice[2]) ?? undefined
    };
    updatedFields.push("cantidad y precio");
  } else {
    const quantity = normalized.match(/(?:cantidad|son)\s+(\d+(?:[.,]\d+)?)/);
    const price = normalized.match(/(?:precio unitario|precio|base)\s*(?:es|de)?\s*([\d,]+(?:\.\d+)?)/);

    if (quantity) {
      patch.lineItem = {
        ...patch.lineItem,
        quantity: Number(quantity[1].replace(",", "."))
      };
      updatedFields.push("cantidad");
    }

    if (price) {
      patch.lineItem = {
        ...patch.lineItem,
        basePrice: parseMoney(price[1]) ?? undefined
      };
      updatedFields.push("precio");
    }
  }

  const discount = normalized.match(/descuento\s*(?:de|es)?\s*(\d+(?:[.,]\d+)?)/);

  if (discount) {
    patch.lineItem = {
      ...patch.lineItem,
      discountPercent: Number(discount[1].replace(",", "."))
    };
    updatedFields.push("descuento");
  }

  const tax = normalized.match(/(?:impuesto|iva)\s*(?:de|es)?\s*(\d+(?:[.,]\d+)?)/);

  if (tax) {
    patch.lineItem = {
      ...patch.lineItem,
      taxPercent: Number(tax[1].replace(",", "."))
    };
    updatedFields.push("impuesto");
  }

  const validityDays = normalized.match(/vigencia\s*(?:de|por)?\s*(\d+)\s*dias/);

  if (validityDays) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + Number(validityDays[1]));
    patch.validUntil = nextDate.toISOString().slice(0, 10);
    updatedFields.push("vigencia");
  }

  const terms = extractAfter(question, normalized, [
    "los terminos son",
    "terminos son",
    "las condiciones son",
    "condiciones son"
  ]);

  if (terms) {
    patch.commercialTerms = terms;
    updatedFields.push("terminos");
  }

  if (!updatedFields.length) {
    return null;
  }

  return {
    patch,
    reply: `Actualice ${updatedFields.join(", ")} en el borrador. El preview ya refleja los cambios.`
  };
}

function deriveContextLabel(pathname: string) {
  if (pathname.includes("/workspace/projects/create")) {
    return "Creacion de proyecto";
  }

  if (pathname.includes("/workspace/projects/")) {
    return "Detalle de proyecto";
  }

  if (pathname.includes("/workspace/quotes")) {
    return "Cotizaciones";
  }

  if (pathname.includes("/workspace/invoices")) {
    return "Facturas";
  }

  if (pathname.includes("/workspace/tax-profile")) {
    return "Datos fiscales";
  }

  if (pathname.includes("/workspace/clients")) {
    return "Empresas / Clientes";
  }

  if (pathname.includes("/workspace/integrations")) {
    return "Integraciones";
  }

  if (pathname.includes("/workspace/orbit-ai")) {
    return "MAIA";
  }

  if (pathname.includes("/workspace/chat")) {
    return "Conversaciones";
  }

  return "Executive Command Center";
}

function getWelcomeMessage(pathname: string, fullName: string): AssistantMessage {
  const contextLabel = deriveContextLabel(pathname);
  const firstName = fullName.trim().split(/\s+/)[0] ?? fullName;

  return {
    id: "maia-welcome",
    sender: "assistant",
    intent: "greeting",
    contextLabel,
    usedData: true,
    text:
      `Hola, ${firstName}. Soy MAIA. Puedo navegar, abrir modulos, ayudarte a crear cotizaciones, revisar proyectos, tareas, KPIs, alertas, facturas, reportes y siguientes acciones con permisos controlados.`,
    suggestions: [
      "MAIA, ayudame a hacer una cotizacion.",
      "Dame el resumen ejecutivo del dia.",
      "Que facturas estan pendientes?"
    ]
  };
}

function getStatusLabel(status: AssistantVisualStatus) {
  switch (status) {
    case "listening":
      return "Escuchando";
    case "processing":
      return "Procesando";
    case "speaking":
      return "Respondiendo";
    case "error":
      return "Error de voz";
    default:
      return "Texto + voz activa";
  }
}

function getStatusDescription(status: AssistantVisualStatus) {
  switch (status) {
    case "listening":
      return "Puedes dictar una instruccion operativa o activar la voz global desde la pestaña Voz.";
    case "processing":
      return "MAIA esta analizando la instruccion y verificando si debe navegar, consultar o preparar un borrador.";
    case "speaking":
      return "Preparando una respuesta ejecutiva breve y accionable.";
    case "error":
      return "No fue posible capturar voz. Puedes continuar por texto.";
    default:
      return "Escribe o dicta una instruccion. Ejemplo: MAIA, ayudame a hacer una cotizacion.";
  }
}

function MaiaWordmark() {
  return (
    <span className="inline-flex items-baseline tracking-[0.12em]">
      <span>MA</span>
      <span className="font-black text-cyan-300 drop-shadow-[0_0_16px_rgba(34,211,238,0.45)]">
        IA
      </span>
    </span>
  );
}

export function WorkspaceAssistant({ session, embeddedLauncher = false }: WorkspaceAssistantProps) {
  const pathname = usePathname();
  const router = useRouter();
  const voice = useVoiceAssistant();
  const welcomeMessage = useMemo(
    () => getWelcomeMessage(pathname, session.fullName),
    [pathname, session.fullName]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "voice">("chat");
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [status, setStatus] = useState<AssistantVisualStatus>("idle");
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [welcomeMessage]);
  const [preferredName, setPreferredName] = useState("Nathalie");
  const [voiceProfile, setVoiceProfile] = useState(VOICE_PROFILE_OPTIONS[0]);
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    setMessages((current) =>
      current.length === 1 && current[0]?.id === "maia-welcome" ? [welcomeMessage] : current
    );
  }, [welcomeMessage]);

  useEffect(() => {
    try {
      setPreferredName(window.localStorage.getItem("maia-preferred-name") ?? "Nathalie");
      setVoiceProfile(window.localStorage.getItem("maia-voice-profile") ?? VOICE_PROFILE_OPTIONS[0]);
    } catch {
      setPreferredName("Nathalie");
      setVoiceProfile(VOICE_PROFILE_OPTIONS[0]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("maia-preferred-name", preferredName);
      window.localStorage.setItem("maia-voice-profile", voiceProfile);
    } catch {
      // Preferences are progressive enhancement; the assistant works without local storage.
    }
  }, [preferredName, voiceProfile]);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("maia-open-after-navigation") === "1") {
        window.sessionStorage.removeItem("maia-open-after-navigation");
        setIsOpen(true);
        setActiveTab("chat");
      }
    } catch {
      // Non-critical; MAIA can still be opened manually.
    }

    function handleOpenAssistant() {
      setIsOpen(true);
      setActiveTab("chat");
    }

    window.addEventListener("orbit-ai:open", handleOpenAssistant);
    window.addEventListener("maia:open", handleOpenAssistant);

    return () => {
      window.removeEventListener("orbit-ai:open", handleOpenAssistant);
      window.removeEventListener("maia:open", handleOpenAssistant);
    };
  }, []);

  useEffect(() => {
    setHasLoadedHistory(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen || hasLoadedHistory) {
      return;
    }

    let isCurrent = true;

    async function loadHistory() {
      try {
        const response = await fetch(
          `/api/orbit-ai/chat?routePath=${encodeURIComponent(pathname)}`,
          {
            method: "GET"
          }
        );
        const payload = (await response.json()) as {
          data?: {
            conversationId: string | null;
            messages: AssistantMessage[];
          };
        };

        if (!isCurrent) {
          return;
        }

        if (response.ok && payload.data?.messages?.length) {
          setConversationId(payload.data.conversationId ?? null);
          setMessages([welcomeMessage, ...payload.data.messages]);
        }
      } catch {
        // History is non-critical; MAIA still works if this request fails.
      } finally {
        if (isCurrent) {
          setHasLoadedHistory(true);
        }
      }
    }

    loadHistory();

    return () => {
      isCurrent = false;
    };
  }, [hasLoadedHistory, isOpen, pathname, welcomeMessage]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutsRef.current = [];
    };
  }, []);

  function scheduleIdleReset(delay = 520) {
    const timeoutId = window.setTimeout(() => {
      setStatus("idle");
    }, delay);

    timeoutsRef.current.push(timeoutId);
  }

  function dispatchQuotePatch(patch: MaiaQuotePatch) {
    window.dispatchEvent(
      new CustomEvent("maia:quote:update", {
        detail: {
          patch
        }
      })
    );
  }

  function startQuoteFlow() {
    window.dispatchEvent(new CustomEvent("maia:quote:new"));

    if (!pathname.startsWith("/workspace/quotes")) {
      try {
        window.sessionStorage.setItem("maia-open-after-navigation", "1");
      } catch {
        // Navigation still works if session storage is unavailable.
      }
      router.push("/workspace/quotes?maiaAction=new_quote" as Route);
    }
  }

  function handleAssistantAction(action: AssistantAction) {
    if (action.intent === "create_quote" || action.action === "new_quote") {
      startQuoteFlow();
      return;
    }

    if (action.route) {
      router.push(action.route as Route);
    }
  }

  async function clearHistory() {
    try {
      const response = await fetch("/api/orbit-ai/chat", {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("No se pudo borrar el historial.");
      }

      setConversationId(null);
      setMessages([welcomeMessage]);
      setHasLoadedHistory(true);
      setHistoryNotice("Historial borrado. MAIA conservara solo nuevas conversaciones.");
    } catch {
      setHistoryNotice("No pude borrar el historial en este momento.");
    }
  }

  async function ask(question: string, inputMode: "text" | "voice" = "text") {
    const nextQuestion = question.trim();

    if (!nextQuestion || status === "processing" || status === "speaking") {
      return;
    }

    const startedAt = Date.now();
    const localQuoteUpdate = pathname.startsWith("/workspace/quotes")
      ? parseQuoteDictation(nextQuestion)
      : null;

    setMessages((current) => [
      ...current,
      {
        id: `user-${startedAt}`,
        sender: "user",
        text: nextQuestion
      }
    ]);
    setDraft("");
    setStatus("processing");

    if (localQuoteUpdate) {
      dispatchQuotePatch(localQuoteUpdate.patch);
      setStatus("speaking");
      setMessages((current) => [
        ...current,
        {
          id: `assistant-local-${startedAt + 1}`,
          sender: "assistant",
          intent: "create_quote",
          contextLabel: "Cotizaciones",
          usedData: true,
          text: localQuoteUpdate.reply,
          suggestions: [
            "El concepto es mantenimiento mensual.",
            "Son 2 unidades de 15000 pesos.",
            "Guardar borrador."
          ]
        }
      ]);
      scheduleIdleReset();
      return;
    }

    try {
      const response = await fetch("/api/orbit-ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationId,
          question: nextQuestion,
          inputMode,
          routePath: pathname,
          contextLabel: deriveContextLabel(pathname)
        })
      });
      const payload = (await response.json()) as {
        message?: string;
        data?: {
          conversationId: string | null;
          intent: OrbitAiIntent;
          contextLabel: string;
          usedData: boolean;
          text: string;
          suggestions: string[];
          action?: AssistantAction;
          tools?: Array<{
            name: string;
            label: string;
            usedData: boolean;
          }>;
        };
      };
      const replyData = payload.data;

      if (!response.ok || !replyData) {
        throw new Error(payload.message ?? "MAIA no pudo responder en este intento.");
      }

      setConversationId(replyData.conversationId ?? null);
      setStatus("speaking");
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${startedAt + 1}`,
          sender: "assistant",
          text: replyData.text,
          intent: replyData.intent,
          contextLabel: replyData.contextLabel,
          suggestions: replyData.suggestions,
          tools: replyData.tools,
          usedData: replyData.usedData,
          action: replyData.action
        }
      ]);

      if (replyData.action) {
        handleAssistantAction(replyData.action);
      }

      scheduleIdleReset();
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${startedAt + 1}`,
          sender: "assistant",
          intent: "unknown",
          contextLabel: deriveContextLabel(pathname),
          usedData: false,
          suggestions: [
            "MAIA, ayudame a hacer una cotizacion.",
            "Dame el resumen ejecutivo del dia.",
            "Que facturas estan pendientes?"
          ],
          text:
            error instanceof Error
              ? `${error.message} Si el problema persiste, intenta de nuevo o revisa el Command Center para validar si faltan datos operativos.`
              : "No pude consultar la capa ejecutiva en este momento. Intenta de nuevo en unos segundos."
        }
      ]);
      setStatus("error");
      scheduleIdleReset(1400);
    }
  }

  return (
    <>
      <div
        id="maia-launcher"
        className={
          embeddedLauncher
            ? "w-full"
            : "fixed bottom-6 left-4 right-4 z-[180] sm:left-auto sm:right-6"
        }
      >
        <Button
          className="h-12 w-full rounded-2xl border border-cyan-400/20 bg-slate-950/88 px-4 text-cyan-100 shadow-[0_20px_55px_rgba(2,6,23,0.42)] hover:bg-slate-900"
          type="button"
          variant="outline"
          onClick={() => setIsOpen((current) => !current)}
        >
          <Sparkles className="h-4 w-4" />
          <MaiaWordmark />
        </Button>
      </div>

      {isOpen ? (
        <aside className="fixed bottom-[14.5rem] left-3 right-3 z-[185] flex h-[min(44rem,calc(100vh-16.5rem))] w-auto max-w-none flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/96 shadow-[0_34px_120px_rgba(2,6,23,0.6)] backdrop-blur-xl sm:bottom-[15.5rem] sm:left-auto sm:right-6 sm:w-[31rem] sm:max-w-[calc(100vw-1.5rem)]">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Executive Intelligence
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    <MaiaWordmark />
                  </h3>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  Asistente operativo para navegar, crear borradores, revisar datos y convertir
                  instrucciones en acciones controladas dentro de Mikaelson OS.
                </p>
              </div>
              <Button
                className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
                size="icon"
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              {(["chat", "voice"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    activeTab === tab
                      ? "bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "chat" ? "Chat" : "Voz / Asistente"}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-cyan-400/15 bg-cyan-500/10 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                {getStatusLabel(status)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {getStatusDescription(status)}
              </p>
            </div>
          </div>

          {activeTab === "chat" ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div
                      className={`flex ${message.sender === "assistant" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
                          message.sender === "assistant"
                            ? "border border-white/10 bg-white/[0.04] text-slate-100"
                            : "bg-cyan-500 text-slate-950"
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                          {message.sender === "assistant" ? (
                            <>
                              <Bot className="h-3.5 w-3.5 text-cyan-300" />
                              <span className="text-cyan-300">MAIA</span>
                              {message.intent ? (
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] tracking-[0.14em] text-cyan-200">
                                  {INTENT_LABELS[message.intent]}
                                </span>
                              ) : null}
                              {typeof message.usedData === "boolean" ? (
                                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] tracking-[0.14em] text-slate-300">
                                  {message.usedData ? "Con datos" : "Sin datos"}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5 text-slate-900/80" />
                              <span className="text-slate-900/80">Tu consulta</span>
                            </>
                          )}
                        </div>

                        {message.contextLabel && message.sender === "assistant" ? (
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                            Contexto: {message.contextLabel}
                          </p>
                        ) : null}

                        {message.action ? (
                          <div className="mb-3 rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
                            Accion: {message.action.action ?? message.action.intent}{" -> "}
                            {message.action.route}
                          </div>
                        ) : null}

                        {message.tools?.length ? (
                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {message.tools.map((tool) => (
                              <span
                                key={`${message.id}-${tool.name}`}
                                className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200"
                              >
                                {tool.label}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="whitespace-pre-line">{message.text}</div>
                      </div>
                    </div>

                    {message.sender === "assistant" && message.suggestions?.length ? (
                      <div className="flex flex-wrap gap-2 pl-1">
                        {message.suggestions.slice(0, 3).map((suggestion) => (
                          <button
                            key={`${message.id}-${suggestion}`}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400/25 hover:bg-cyan-400/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={status === "processing" || status === "speaking"}
                            type="button"
                            onClick={() => ask(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                {status === "processing" ? (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                        <Bot className="h-3.5 w-3.5" />
                        <span>MAIA</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                        <span>Analizando instruccion operativa...</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-white/10 bg-slate-950/90 px-4 py-4">
                <div className="flex items-center gap-3">
                  <OrbitAiVoiceControl
                    compact
                    disabled={status === "processing" || status === "speaking"}
                    onStatusChange={(voiceStatus) => {
                      if (voiceStatus === "listening" || voiceStatus === "error") {
                        setStatus(voiceStatus);
                      }
                    }}
                    onTranscript={(transcript) => ask(transcript, "voice")}
                  />
                  <Input
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                    disabled={status === "processing" || status === "speaking"}
                    placeholder="Ej: MAIA, ayudame a hacer una cotizacion..."
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        ask(draft);
                      }
                    }}
                  />
                  <Button
                    className="h-11 rounded-2xl px-4"
                    disabled={(status === "processing" || status === "speaking") || !draft.trim()}
                    type="button"
                    onClick={() => ask(draft)}
                  >
                    {status === "processing" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Control de voz MAIA</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Estado global: {voice.state}. Di &quot;MAIA&quot; o &quot;Maya&quot; despues de permitir el microfono.
                      </p>
                    </div>
                    {voice.state === "processing" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                    ) : (
                      <Radio className="h-5 w-5 text-cyan-300" />
                    )}
                  </div>

                  {voice.transcript ? (
                    <p className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                      {voice.transcript}
                    </p>
                  ) : null}

                  {voice.errorMessage ? (
                    <p className="mt-3 rounded-xl border border-amber-400/15 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                      {voice.errorMessage}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      className="rounded-2xl"
                      type="button"
                      onClick={() => void voice.start()}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Reactivar MAIA
                    </Button>
                    <Button
                      className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                      type="button"
                      variant="secondary"
                      onClick={voice.stop}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Detener conversacion
                    </Button>
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">Ajustes</p>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Que voz quieres usar?
                      </label>
                      <select
                        className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                        value={voiceProfile}
                        onChange={(event) => setVoiceProfile(event.target.value)}
                      >
                        {VOICE_PROFILE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs leading-5 text-slate-500">
                        MVP: MAIA usa SpeechSynthesis del navegador. La seleccion queda guardada
                        para mapear voces del navegador y futuras voces ElevenLabs/OpenAI TTS.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Como quieres que te llame?
                      </label>
                      <Input
                        className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                        value={preferredName}
                        onChange={(event) => setPreferredName(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">Historial de conversacion</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    MAIA recuerda conversaciones recientes por hasta 3 dias.
                  </p>
                  {historyNotice ? (
                    <p className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                      {historyNotice}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                      type="button"
                      variant="secondary"
                      onClick={clearHistory}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Borrar historial
                    </Button>
                    <Button
                      className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setMessages([welcomeMessage]);
                        setHistoryNotice("Historial local reiniciado en este panel.");
                      }}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Reiniciar panel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      ) : null}
    </>
  );
}
