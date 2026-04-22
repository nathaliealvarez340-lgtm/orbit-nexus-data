"use client";

import { Bot, MessageSquareText, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionUser } from "@/types/auth";

type WorkspaceAssistantProps = {
  session: SessionUser;
};

type AssistantMessage = {
  id: string;
  sender: "assistant" | "user";
  text: string;
};

function createAssistantResponse(role: SessionUser["role"], pathname: string, question: string) {
  const normalized = question.toLowerCase();

  if (role === "LEADER") {
    if (normalized.includes("consultor") && normalized.includes("asign")) {
      return "Abre el proyecto desde el dashboard y entra a la seccion de asignacion. Ahi veras candidatos del tenant actual con skills, KPIs, disponibilidad y match sugerido.";
    }

    if (normalized.includes("registr") || normalized.includes("nuevo consultor")) {
      return "Usa el boton Registrar consultor desde el dashboard o desde la ruta /workspace/consultants/register. El alta guarda skills, KPIs iniciales, estado y disponibilidad para matching posterior.";
    }

    if (normalized.includes("alert") || normalized.includes("riesgo")) {
      return "Las alertas viven en el panel de notificaciones y en la seccion de proyectos con intervencion. Desde cada proyecto puedes abrir riesgos o asignacion manual segun el estado.";
    }
  }

  if (role === "CONSULTANT") {
    if (normalized.includes("avance")) {
      return "Puedes reportar avance desde el CTA principal del dashboard, desde el historial de avances o desde las acciones del proyecto si necesitas mas contexto antes de enviarlo.";
    }

    if (normalized.includes("entregable") || normalized.includes("sub")) {
      return "La carga de entregables se hace desde Subir entregable. Tambien puedes ubicar tus ventanas en el calendario y abrir el proyecto relacionado para validar el contexto antes de enviarlo.";
    }

    if (normalized.includes("carga") || normalized.includes("capacidad")) {
      return "La carga visible resume tu ocupacion operativa actual. Te ayuda a ver si aun puedes absorber otra tarea sin comprometer fechas, reuniones o bloques de trabajo.";
    }
  }

  if (pathname.includes("/chat")) {
    return "En chat puedes abrir una conversacion, responder y seguir el estado del mensaje. La lista lateral muestra no leidos y el panel derecho conserva el hilo activo.";
  }

  if (pathname.includes("/calendar")) {
    return "En calendario puedes revisar lo de hoy, eventos de la semana y agregar nuevos eventos desde Agregar evento. Los bloques inferiores muestran vencimientos, reuniones, recordatorios y carga semanal.";
  }

  return role === "LEADER"
    ? "Puedo ayudarte a ubicar proyectos, alertas, asignaciones, KPIs o la alta de consultores dentro del entorno actual."
    : "Puedo ayudarte a ubicar entregables, avances, chat, calendario o el significado de tus KPIs dentro del dashboard.";
}

export function WorkspaceAssistant({ session }: WorkspaceAssistantProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "assistant-welcome",
      sender: "assistant",
      text:
        session.role === "LEADER"
          ? "Te acompano a ubicar asignaciones, alertas, KPIs y flujos del portal de liderazgo."
          : "Te acompano a ubicar entregables, avances, calendario, chat y focos operativos del consultor."
    }
  ]);

  if (session.role !== "LEADER" && session.role !== "CONSULTANT") {
    return null;
  }

  function ask(question: string) {
    const nextQuestion = question.trim();

    if (!nextQuestion) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: nextQuestion
      },
      {
        id: `assistant-${Date.now() + 1}`,
        sender: "assistant",
        text: createAssistantResponse(session.role, pathname, nextQuestion)
      }
    ]);
    setDraft("");
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[180]">
        <Button
          className="h-12 rounded-2xl border border-cyan-400/20 bg-slate-950/88 px-4 text-cyan-200 shadow-[0_20px_55px_rgba(2,6,23,0.42)] hover:bg-slate-900"
          type="button"
          variant="outline"
          onClick={() => setIsOpen((current) => !current)}
        >
          <Sparkles className="h-4 w-4" />
          Ayuda Orbit
        </Button>
      </div>

      {isOpen ? (
        <aside className="fixed bottom-24 right-6 z-[185] flex h-[40rem] w-[30rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/96 shadow-[0_34px_120px_rgba(2,6,23,0.6)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Asistente interno
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">Ayuda Orbit Nexus</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Resuelve dudas de uso, KPIs, alertas, entregables y flujos operativos sin salir de la plataforma.
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
              <div
                key={message.id}
                className={`flex ${message.sender === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
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
                      </>
                    ) : (
                      <>
                        <MessageSquareText className="h-3.5 w-3.5 text-slate-900/80" />
                        <span className="text-slate-900/80">Tu consulta</span>
                      </>
                    )}
                  </div>
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 bg-slate-950/90 px-4 py-4">
            <div className="flex items-center gap-3">
              <Input
                className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                placeholder="Pregunta algo sobre la plataforma..."
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
                type="button"
                onClick={() => ask(draft)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
