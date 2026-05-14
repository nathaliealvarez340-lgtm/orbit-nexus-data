"use client";

import { Bot, Loader2, Send, Sparkles, Volume2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import {
  OrbitAiVoiceControl,
  type OrbitAiVoiceStatus
} from "@/components/dashboard/orbit-ai-voice-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionUser } from "@/types/auth";

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
  | "open_reports"
  | "unknown";

type VisualStatus = OrbitAiVoiceStatus;

type OrbitAiMessage = {
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
  action?: {
    intent: string;
    route: string;
    action?: string;
  };
};

type OrbitAiConsoleProps = {
  session: SessionUser;
};

const examplePrompts = [
  "Dame el resumen ejecutivo del dia.",
  "Que proyectos estan atrasados?",
  "Que tareas son prioridad?",
  "Que KPIs estan bajos?",
  "Que cotizaciones estan pendientes?",
  "Que facturas estan pendientes?",
  "Genera un borrador de reporte.",
  "Dame recomendaciones de accion."
];

const intentLabels: Record<OrbitAiIntent, string> = {
  greeting: "Contexto",
  summary: "Resumen",
  projects: "Proyectos",
  tasks: "Tareas",
  kpis: "KPIs",
  alerts: "Riesgos",
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

function getWelcomeMessage(fullName: string): OrbitAiMessage {
  const firstName = fullName.trim().split(/\s+/)[0] ?? fullName;

  return {
    id: "orbit-ai-console-welcome",
    sender: "assistant",
    intent: "greeting",
    contextLabel: "MAIA",
    usedData: true,
    text: `Hola, ${firstName}. Esta consola usa herramientas internas seguras para consultar proyectos, tareas, KPIs, cotizaciones, facturas, riesgos y reportes dentro de tu organizacion.`,
    suggestions: examplePrompts.slice(0, 4)
  };
}

function getStatusCopy(status: VisualStatus) {
  switch (status) {
    case "listening":
      return "Escuchando: interfaz preparada para voz futura.";
    case "processing":
      return "Pensando: ejecutando herramientas internas con permisos.";
    case "speaking":
      return "Respondiendo: sintetizando una lectura ejecutiva.";
    case "error":
      return "Error: revisa permisos del microfono o usa texto.";
    default:
      return "Texto activo. Voz preparada para wake word, speech-to-text y respuesta hablada.";
  }
}

export function OrbitAiConsole({ session }: OrbitAiConsoleProps) {
  const router = useRouter();
  const welcomeMessage = useMemo(() => getWelcomeMessage(session.fullName), [session.fullName]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<OrbitAiMessage[]>(() => [welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<VisualStatus>("idle");
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    let isCurrent = true;

    async function loadHistory() {
      try {
        const response = await fetch(
          `/api/orbit-ai/chat?routePath=${encodeURIComponent("/workspace/orbit-ai")}`
        );
        const payload = (await response.json()) as {
          data?: {
            conversationId: string | null;
            messages: OrbitAiMessage[];
          };
        };

        if (isCurrent && response.ok && payload.data?.messages?.length) {
          setConversationId(payload.data.conversationId ?? null);
          setMessages([welcomeMessage, ...payload.data.messages]);
        }
      } catch {
        // History is optional; the console still works without it.
      }
    }

    loadHistory();

    return () => {
      isCurrent = false;
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, [welcomeMessage]);

  function resetStatus(delay = 560) {
    const timeoutId = window.setTimeout(() => setStatus("idle"), delay);
    timeoutsRef.current.push(timeoutId);
  }

  async function ask(question: string, inputMode: "text" | "voice" = "text") {
    const nextQuestion = question.trim();

    if (!nextQuestion || status === "processing" || status === "speaking") {
      return;
    }

    const startedAt = Date.now();

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
          routePath: "/workspace/orbit-ai",
          contextLabel: "MAIA"
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
          action?: OrbitAiMessage["action"];
          tools?: OrbitAiMessage["tools"];
        };
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.message ?? "MAIA no pudo responder.");
      }

      setConversationId(payload.data.conversationId ?? null);
      setStatus("speaking");
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${startedAt + 1}`,
          sender: "assistant",
          text: payload.data!.text,
          intent: payload.data!.intent,
          contextLabel: payload.data!.contextLabel,
          suggestions: payload.data!.suggestions,
          action: payload.data!.action,
          tools: payload.data!.tools,
          usedData: payload.data!.usedData
        }
      ]);
      if (payload.data.action?.route) {
        if (payload.data.action.intent === "create_quote" || payload.data.action.action === "new_quote") {
          window.dispatchEvent(new CustomEvent("maia:quote:new"));
          try {
            window.sessionStorage.setItem("maia-open-after-navigation", "1");
          } catch {
            // Navigation still works if session storage is unavailable.
          }
          router.push("/workspace/quotes?maiaAction=new_quote" as Route);
        } else {
          router.push(payload.data.action.route as Route);
        }
      }
      resetStatus();
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${startedAt + 1}`,
          sender: "assistant",
          intent: "unknown",
          contextLabel: "MAIA",
          usedData: false,
          suggestions: examplePrompts.slice(0, 3),
          text:
            error instanceof Error
              ? `${error.message} Intenta con una consulta mas especifica o revisa que existan datos operativos.`
              : "No pude consultar MAIA en este momento."
        }
      ]);
      setStatus("error");
      resetStatus(1400);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <OperationsPanel
        className="min-h-[42rem] bg-slate-950/84"
        contentClassName="flex min-h-[34rem] flex-col"
        description="Consulta datos internos mediante herramientas controladas. MAIA puede navegar, resumir, recomendar y crear borradores, pero no ejecuta acciones criticas sin confirmacion."
        eyebrow="Asistente ejecutivo interno"
        title="MAIA Chat"
      >
        <div className="mb-4 rounded-[1.4rem] border border-cyan-400/15 bg-cyan-500/10 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Estado
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{getStatusCopy(status)}</p>
            </div>
            <OrbitAiVoiceControl
              disabled={status === "processing" || status === "speaking"}
              onStatusChange={(voiceStatus) => {
                if (voiceStatus === "listening" || voiceStatus === "error") {
                  setStatus(voiceStatus);
                }
              }}
              onTranscript={(transcript) => ask(transcript, "voice")}
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex ${message.sender === "assistant" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[88%] rounded-[1.35rem] px-4 py-3 text-sm leading-6 ${
                  message.sender === "assistant"
                    ? "border border-white/10 bg-slate-950/78 text-slate-100"
                    : "bg-cyan-500 text-slate-950"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {message.sender === "assistant" ? (
                    <>
                      <Bot className="h-3.5 w-3.5 text-cyan-300" />
                      <span className="text-cyan-300">MAIA</span>
                      {message.intent ? (
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200">
                          {intentLabels[message.intent]}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-300">
                        {message.usedData ? "Con datos" : "Sin datos"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-slate-900/80" />
                      <span className="text-slate-900/80">Tu consulta</span>
                    </>
                  )}
                </div>

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

                {message.sender === "assistant" && message.suggestions?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
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
            </article>
          ))}

          {status === "processing" ? (
            <div className="flex items-center gap-2 rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
              Ejecutando herramientas internas...
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Input
            className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
            disabled={status === "processing" || status === "speaking"}
            placeholder="Pregunta: proyectos atrasados, KPIs bajos, cotizaciones, facturas, riesgos..."
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
            className="h-12 rounded-2xl px-5"
            disabled={(status === "processing" || status === "speaking") || !draft.trim()}
            type="button"
            onClick={() => ask(draft)}
          >
            {status === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </OperationsPanel>

      <OperationsPanel
        className="bg-slate-950/84"
        contentClassName="space-y-4"
        description="Prompts internos para probar la capa de tools. Las acciones criticas siguen bloqueadas sin confirmacion."
        eyebrow="Prompts"
        title="Ejemplos ejecutivos"
      >
        <div className="space-y-2">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              className="w-full rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm leading-6 text-slate-300 transition-colors hover:border-cyan-400/25 hover:bg-cyan-400/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status === "processing" || status === "speaking"}
              type="button"
              onClick={() => ask(prompt)}
            >
              <Sparkles className="mr-2 inline h-4 w-4 text-cyan-300" />
              {prompt}
            </button>
          ))}
        </div>

        <div className="rounded-[1.25rem] border border-amber-400/15 bg-amber-500/10 px-4 py-4 text-sm leading-6 text-amber-100">
          MAIA no borra usuarios, no emite facturas, no cambia permisos y no envia informacion externa.
        </div>
      </OperationsPanel>
    </section>
  );
}
