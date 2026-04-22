"use client";

import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type ConsultantChatStripProps = {
  conversationCount: number;
  unreadCount: number;
  lastMovement?: string | null;
  href?: string;
};

export function ConsultantChatStrip({
  conversationCount,
  unreadCount,
  lastMovement,
  href = "/workspace/chat"
}: ConsultantChatStripProps) {
  return (
    <section
      id="consultant-chat"
      className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.24),rgba(15,23,42,0.94))] px-5 py-5 shadow-[0_22px_60px_rgba(2,6,23,0.28)]"
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.28fr_0.28fr_auto] xl:items-center">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
            Comunicacion
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Chat con liderazgo
          </h2>
          <p className="text-sm leading-6 text-slate-400">
            Manten visible el hilo de decisiones, solicitudes y seguimiento sin comprimir la operacion del dashboard.
          </p>
          <p className="text-sm font-medium text-slate-300">
            {lastMovement ?? "Sin movimiento reciente en el chat de liderazgo."}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Conversaciones
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{conversationCount}</p>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            No leidos
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{unreadCount}</p>
        </div>

        <div className="xl:justify-self-end">
          <Button asChild className="rounded-2xl px-5">
            <Link href={href as Route}>Abrir chat</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
