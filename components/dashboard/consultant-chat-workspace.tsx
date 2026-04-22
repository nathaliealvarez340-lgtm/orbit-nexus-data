"use client";

import Link from "next/link";

import { OperationsShell } from "@/components/dashboard/operations-shell";
import { WorkspaceChatPanel } from "@/components/dashboard/workspace-chat-panel";
import { useWorkspaceChat } from "@/components/dashboard/workspace-chat-provider";
import { Button } from "@/components/ui/button";
import {
  getConsultantDashboardMock,
  getConsultantDashboardSearchItems
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type ConsultantChatWorkspaceProps = {
  session: SessionUser;
};

export function ConsultantChatWorkspace({ session }: ConsultantChatWorkspaceProps) {
  const { conversations, totalUnreadCount } = useWorkspaceChat();
  const currentData = getConsultantDashboardMock(session);

  return (
    <OperationsShell
      session={session}
      portalLabel="CONSULTANT"
      portalTitle="Chat operativo"
      subtitle="Responde indicaciones del lider, da seguimiento a proyectos y manten la coordinacion diaria desde una bandeja de mensajeria dedicada."
      navItems={[
        { label: "Dashboard", href: "/workspace" },
        { label: "Chat", href: "/workspace/chat", active: true },
        {
          label: "Entregables",
          href: "/workspace#consultant-deliverables",
          badge: String(currentData.upcomingDeliverables.length)
        },
        {
          label: "Feedback",
          href: "/workspace#consultant-feedback",
          badge: String(currentData.leaderFeedback.length)
        }
      ]}
      headerActions={
        <div className="flex h-16 min-w-[132px] flex-col justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.05] px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Mensajes
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{totalUnreadCount} pendientes</p>
        </div>
      }
      showProfileCard={false}
      showHero={false}
      contentClassName="mx-auto w-full max-w-[1400px]"
      searchItems={getConsultantDashboardSearchItems(currentData)}
    >
      <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/84 px-6 py-6 shadow-[0_18px_44px_rgba(2,6,23,0.22)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              Inbox de trabajo
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Chat con liderazgo
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Sigue indicaciones, responde al lider y documenta decisiones del proyecto desde una
              vista de mensajeria clara y util.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Conversaciones
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{conversations.length}</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                No leidos
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{totalUnreadCount}</p>
            </div>
            <Button
              asChild
              className="rounded-2xl bg-white/[0.06] px-5 text-slate-100 hover:bg-white/[0.1]"
              variant="secondary"
            >
              <Link href="/workspace">Volver al dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <WorkspaceChatPanel emptyDescription="Selecciona una conversacion con liderazgo para revisar instrucciones, responder y mantener seguimiento sobre el proyecto." />
    </OperationsShell>
  );
}
