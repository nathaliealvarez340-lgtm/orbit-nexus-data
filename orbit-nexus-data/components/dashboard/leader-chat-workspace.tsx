"use client";

import Link from "next/link";

import { LeaderNotifications } from "@/components/dashboard/leader-notifications";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { WorkspaceChatPanel } from "@/components/dashboard/workspace-chat-panel";
import { useWorkspaceChat } from "@/components/dashboard/workspace-chat-provider";
import { useWorkspaceProjects } from "@/components/dashboard/workspace-projects-provider";
import { Button } from "@/components/ui/button";
import {
  getLeaderDashboardMock,
  getLeaderDashboardSearchItems
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type LeaderChatWorkspaceProps = {
  session: SessionUser;
};

export function LeaderChatWorkspace({ session }: LeaderChatWorkspaceProps) {
  const { projects } = useWorkspaceProjects();
  const { conversations, totalUnreadCount } = useWorkspaceChat();
  const currentData = getLeaderDashboardMock(session, projects);

  return (
    <OperationsShell
      session={session}
      portalLabel="LEADER"
      portalTitle="Chat con consultores"
      subtitle="Mensajeria operativa dedicada para coordinar entregables, resolver dudas y sostener seguimiento continuo."
      navItems={[
        { label: "Dashboard", href: "/workspace" },
        { label: "Chat", href: "/workspace/chat", active: true },
        { label: "Alertas", href: "/workspace#leader-alerts", badge: String(currentData.alerts.length) },
        {
          label: "Intervencion",
          href: "/workspace#leader-intervention",
          badge: String(currentData.interventionProjects.length)
        }
      ]}
      headerActions={<LeaderNotifications notifications={currentData.notifications} />}
      showHero={false}
      contentClassName="mx-auto w-full max-w-[1400px]"
      searchItems={getLeaderDashboardSearchItems(currentData)}
    >
      <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/84 px-6 py-6 shadow-[0_18px_44px_rgba(2,6,23,0.22)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              Inbox operativo
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Chat con consultores
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Sigue conversaciones activas, atiende pendientes y coordina proyectos desde una vista de mensajeria real.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Conversaciones
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {conversations.length}
              </p>
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

      <WorkspaceChatPanel
        emptyDescription="Selecciona un consultor para abrir el hilo, responder mensajes y mantener la coordinacion del proyecto."
      />
    </OperationsShell>
  );
}
