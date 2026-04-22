"use client";

import type { Route } from "next";
import Link from "next/link";
import { MessageSquareText, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ChatMessageStatus } from "@/components/dashboard/chat-message-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatChatTimestamp,
  type WorkspaceChatPresence
} from "@/lib/dashboard/chat-data";
import { cn } from "@/lib/utils";
import { useWorkspaceChat } from "@/components/dashboard/workspace-chat-provider";

const statusStyles = {
  active: "bg-emerald-500/12 text-emerald-300 border-emerald-400/20",
  pending: "bg-amber-500/12 text-amber-300 border-amber-400/20",
  busy: "bg-rose-500/12 text-rose-300 border-rose-400/20"
} as const;

const statusLabels = {
  active: "Activo",
  pending: "Pendiente",
  busy: "Ocupado"
} as const;

const statusDots = {
  active: "bg-emerald-400",
  pending: "bg-amber-400",
  busy: "bg-rose-400"
} as const;

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusLabel(status: WorkspaceChatPresence) {
  return statusLabels[status];
}

type WorkspaceChatPanelProps = {
  emptyTitle?: string;
  emptyDescription?: string;
};

export function WorkspaceChatPanel({
  emptyTitle = "Selecciona una conversacion",
  emptyDescription = "Elige una conversacion del panel izquierdo para revisar el hilo, responder mensajes y mantener la coordinacion operativa."
}: WorkspaceChatPanelProps) {
  const {
    conversations,
    currentUserId,
    getConversationCounterpartData,
    getConversationUnreadCount,
    openConversation,
    sendMessage
  } = useWorkspaceChat();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setSelectedId((currentSelectedId) => {
      if (!currentSelectedId) {
        return null;
      }

      return conversations.some((conversation) => conversation.id === currentSelectedId)
        ? currentSelectedId
        : null;
    });
  }, [conversations]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  if (!conversations.length) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/88 p-8 shadow-[0_18px_44px_rgba(2,6,23,0.22)]">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-300">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-white">Sin conversaciones disponibles</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Cuando exista coordinacion entre lideres y consultores, las conversaciones apareceran aqui.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-[0_24px_80px_rgba(2,6,23,0.34)]">
      <div className="grid min-h-[calc(100vh-12rem)] lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex min-h-[32rem] flex-col border-b border-white/10 bg-slate-950 lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
              Bandeja operativa
            </p>
            <div className="mt-3">
              <h2 className="text-xl font-semibold text-white">Conversaciones activas</h2>
              <p className="mt-1 text-sm text-slate-400">
                Cambia entre hilos y responde desde una vista de trabajo limpia y enfocada.
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {conversations.map((conversation) => {
              const counterpart = getConversationCounterpartData(conversation);
              const unreadCount = getConversationUnreadCount(conversation);
              const isSelected = conversation.id === selectedConversation?.id;

              return (
                <button
                  key={conversation.id}
                  className={cn(
                    "w-full rounded-[1.35rem] border px-4 py-4 text-left transition-all",
                    isSelected
                      ? "border-cyan-400/30 bg-cyan-500/10 shadow-[0_12px_35px_rgba(8,145,178,0.18)]"
                      : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]"
                  )}
                  type="button"
                  onClick={() => {
                    setSelectedId(conversation.id);
                    openConversation(conversation.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/12 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      {getInitials(counterpart.fullName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex h-2.5 w-2.5 rounded-full",
                                statusDots[counterpart.status]
                              )}
                            />
                            <p className="truncate text-sm font-semibold text-white">
                              {counterpart.fullName}
                            </p>
                          </div>
                          <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            {conversation.projectFolio}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-medium text-slate-500">
                            {formatChatTimestamp(conversation.lastMessageAt)}
                          </p>
                          {unreadCount > 0 ? (
                            <span className="mt-2 inline-flex min-w-6 items-center justify-center rounded-full bg-cyan-400 px-2 py-1 text-[10px] font-bold text-slate-950">
                              {unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-3 truncate text-sm text-slate-300">
                        {conversation.projectName}
                      </p>
                      <p className="mt-1 truncate text-sm leading-6 text-slate-500">
                        {conversation.messages[conversation.messages.length - 1]?.text ?? ""}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-[32rem] flex-col bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(2,6,23,0.96))]">
          {selectedConversation ? (
            <>
              <header className="border-b border-white/10 px-6 py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">
                        {getConversationCounterpartData(selectedConversation).fullName}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                          statusStyles[getConversationCounterpartData(selectedConversation).status]
                        )}
                      >
                        {getStatusLabel(getConversationCounterpartData(selectedConversation).status)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-400">
                      <span>{selectedConversation.projectFolio}</span>
                      <span className="text-slate-600">•</span>
                      <span>{selectedConversation.projectName}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-slate-500">
                      Ultimo movimiento {formatChatTimestamp(selectedConversation.lastMessageAt, "detail")}
                    </p>
                    <Button
                      asChild
                      className="rounded-2xl bg-white/[0.06] px-4 text-slate-100 hover:bg-white/[0.1]"
                      size="sm"
                      variant="secondary"
                    >
                      <Link href={selectedConversation.projectHref as Route}>Abrir proyecto</Link>
                    </Button>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto flex max-w-4xl flex-col gap-4">
                  {selectedConversation.messages.map((message) => {
                    const isCurrentUserMessage = message.senderId === currentUserId;

                    return (
                      <div
                        key={message.id}
                        className={cn("flex", isCurrentUserMessage ? "justify-end" : "justify-start")}
                      >
                        <div className="max-w-[75%]">
                          <div
                            className={cn(
                              "rounded-[1.35rem] px-4 py-3 text-sm leading-6 shadow-sm",
                              isCurrentUserMessage
                                ? "rounded-br-md bg-cyan-500 text-slate-950"
                                : "rounded-bl-md border border-white/10 bg-white/[0.05] text-slate-100"
                            )}
                          >
                            {message.text}
                          </div>
                          <div
                            className={cn(
                              "mt-2 flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em]",
                              isCurrentUserMessage
                                ? "justify-end text-cyan-100/80"
                                : "justify-start text-slate-500"
                            )}
                          >
                            <span>{formatChatTimestamp(message.createdAt, "detail")}</span>
                            {isCurrentUserMessage ? <ChatMessageStatus status={message.status} /> : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <footer className="border-t border-white/10 bg-slate-950/90 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Input
                    className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                    placeholder="Escribe una instruccion, contexto o seguimiento..."
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const nextMessage = draft.trim();

                        if (!nextMessage || !selectedConversation) {
                          return;
                        }

                        sendMessage(selectedConversation.id, nextMessage);
                        setDraft("");
                      }
                    }}
                  />
                  <Button
                    className="h-12 rounded-2xl px-5"
                    type="button"
                    onClick={() => {
                      const nextMessage = draft.trim();

                      if (!nextMessage || !selectedConversation) {
                        return;
                      }

                      sendMessage(selectedConversation.id, nextMessage);
                      setDraft("");
                    }}
                  >
                    <Send className="h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-12">
              <div className="max-w-md text-center">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/[0.04] text-cyan-300">
                  <MessageSquareText className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-white">{emptyTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{emptyDescription}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
