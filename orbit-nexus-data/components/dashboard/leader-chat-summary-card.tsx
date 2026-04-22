import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatSummaryCardProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  conversationCount: number;
  unreadCount: number;
  buttonLabel?: string;
  href?: string;
  className?: string;
};

export function ChatSummaryCard({
  eyebrow = "Comunicacion",
  title = "Chat con consultores",
  description = "Centraliza seguimientos, aclaraciones y decisiones con el equipo en una vista de mensajeria dedicada.",
  conversationCount,
  unreadCount,
  buttonLabel = "Abrir chat",
  href = "/workspace/chat",
  className
}: ChatSummaryCardProps) {
  return (
    <section
      className={cn(
        "rounded-[1.7rem] border border-white/10 bg-slate-950/84 px-6 py-6 shadow-[0_18px_44px_rgba(2,6,23,0.22)]",
        className
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>

        <Button asChild className="rounded-2xl px-5">
          <Link href={href as Route}>{buttonLabel}</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Conversaciones activas
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{conversationCount}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Mensajes no leidos
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{unreadCount}</p>
        </div>
      </div>
    </section>
  );
}

export const LeaderChatSummaryCard = ChatSummaryCard;
