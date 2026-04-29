"use client";

import { Bot, Loader2, MessageSquareText, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useWorkspaceChat } from "@/components/dashboard/workspace-chat-provider";
import { useWorkspaceProjects } from "@/components/dashboard/workspace-projects-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAssistantReply,
  getAssistantWelcomeReply,
  type AssistantIntent
} from "@/lib/services/nexus/assistant";
import type { SessionUser } from "@/types/auth";

type WorkspaceAssistantProps = {
  session: SessionUser;
};

type AssistantMessage = {
  id: string;
  sender: "assistant" | "user";
  text: string;
  intent?: AssistantIntent;
  contextLabel?: string;
  suggestions?: string[];
};

const INTENT_LABELS: Record<AssistantIntent, string> = {
  greeting: "Contexto",
  projects: "Proyectos",
  consultants: "Consultores",
  kpis: "KPIs",
  alerts: "Alertas",
  assignments: "Asignaciones",
  deliverables: "Entregables",
  platform_help: "Uso de plataforma",
  recommendations: "Recomendaciones",
  unknown: "Asistencia"
};

function toAssistantMessage(
  id: string,
  message: Omit<AssistantMessage, "id" | "sender"> & { sender?: AssistantMessage["sender"] }
): AssistantMessage {
  return {
    id,
    sender: message.sender ?? "assistant",
    text: message.text,
    intent: message.intent,
    contextLabel: message.contextLabel,
    suggestions: message.suggestions
  };
}

export function WorkspaceAssistant({ session }: WorkspaceAssistantProps) {
  const pathname = usePathname();
  const { consultants, projects } = useWorkspaceProjects();
  const { conversations, totalUnreadCount } = useWorkspaceChat();
  const assistantContext = useMemo(
    () => ({
      session,
      pathname,
      projects,
      consultants,
      conversationCount: conversations.length,
      unreadConversationCount: totalUnreadCount
    }),
    [consultants, conversations.length, pathname, projects, session, totalUnreadCount]
  );
  const welcomeMessage = useMemo(
    () =>
      toAssistantMessage("assistant-welcome", {
        ...getAssistantWelcomeReply(assistantContext)
      }),
    [assistantContext]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [welcomeMessage]);
  const timeoutsRef = useRef<number[]>([]);
  const assistantContextRef = useRef(assistantContext);

  if (session.role !== "LEADER" && session.role !== "CONSULTANT") {
    return null;
  }

  useEffect(() => {
    assistantContextRef.current = assistantContext;
  }, [assistantContext]);

  useEffect(() => {
    setMessages((current) =>
      current.length === 1 && current[0]?.id === "assistant-welcome" ? [welcomeMessage] : current
    );
  }, [welcomeMessage]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutsRef.current = [];
    };
  }, []);

  function ask(question: string) {
    const nextQuestion = question.trim();

    if (!nextQuestion || isThinking) {
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
    setIsThinking(true);

    const timeoutId = window.setTimeout(() => {
      try {
        const reply = createAssistantReply(nextQuestion, assistantContextRef.current);

        setMessages((current) => [
          ...current,
          toAssistantMessage(`assistant-${startedAt + 1}`, reply)
        ]);
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-error-${startedAt + 1}`,
            sender: "assistant",
            intent: "unknown",
            contextLabel: assistantContextRef.current.pathname.includes("/workspace/chat")
              ? "Chat operativo"
              : "Dashboard",
            suggestions:
              session.role === "LEADER"
                ? [
                    "Que proyectos estan en riesgo?",
                    "Que consultores tienen carga alta?",
                    "Que asignaciones requieren intervencion?"
                  ]
                : [
                    "Que entregables vencen primero?",
                    "Como va mi carga actual?",
                    "Que proyecto requiere mas atencion?"
                  ],
            text:
              "No pude analizar el contexto en este intento. Intenta de nuevo o pide revisar proyectos, KPIs, consultores, alertas o entregables."
          }
        ]);
      } finally {
        setIsThinking(false);
      }
    }, 260);

    timeoutsRef.current.push(timeoutId);
  }

  return (
    <>
      <div className="fixed bottom-6 left-4 right-4 z-[180] sm:left-auto sm:right-6">
        <Button
          className="h-12 w-full rounded-2xl border border-cyan-400/20 bg-slate-950/88 px-4 text-cyan-200 shadow-[0_20px_55px_rgba(2,6,23,0.42)] hover:bg-slate-900 sm:w-auto"
          type="button"
          variant="outline"
          onClick={() => setIsOpen((current) => !current)}
        >
          <Sparkles className="h-4 w-4" />
          Ayuda Orbit
        </Button>
      </div>

      {isOpen ? (
        <aside className="fixed bottom-24 left-3 right-3 z-[185] flex h-[min(40rem,calc(100vh-7.5rem))] w-auto max-w-none flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/96 shadow-[0_34px_120px_rgba(2,6,23,0.6)] backdrop-blur-xl sm:left-auto sm:right-6 sm:w-[30rem] sm:max-w-[calc(100vw-1.5rem)]">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Asistente interno
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">Ayuda Orbit Nexus</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Analiza proyectos, KPIs, consultores, alertas, entregables y acciones sugeridas usando el contexto operativo visible de tu cuenta.
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
                          <span className="text-cyan-300">Asistente</span>
                          {message.intent ? (
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] tracking-[0.14em] text-cyan-200">
                              {INTENT_LABELS[message.intent]}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <MessageSquareText className="h-3.5 w-3.5 text-slate-900/80" />
                          <span className="text-slate-900/80">Tu consulta</span>
                        </>
                      )}
                    </div>

                    {message.contextLabel && message.sender === "assistant" ? (
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                        Contexto: {message.contextLabel}
                      </p>
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
                        disabled={isThinking}
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

            {isThinking ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    <Bot className="h-3.5 w-3.5" />
                    <span>Asistente</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                    <span>Analizando contexto operativo...</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 bg-slate-950/90 px-4 py-4">
            <div className="flex items-center gap-3">
              <Input
                className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                disabled={isThinking}
                placeholder={
                  session.role === "LEADER"
                    ? "Pregunta por proyectos, KPIs, consultores o riesgos..."
                    : "Pregunta por entregables, carga, avances o proyectos..."
                }
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
                disabled={isThinking || !draft.trim()}
                type="button"
                onClick={() => ask(draft)}
              >
                {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
