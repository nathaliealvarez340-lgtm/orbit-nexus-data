"use client";

import { LeaderExecutiveHeader } from "@/components/dashboard/leader-executive-header";
import { LeaderFloatingActions } from "@/components/dashboard/leader-floating-actions";
import { ChatSummaryCard } from "@/components/dashboard/leader-chat-summary-card";
import { LeaderKpiDistribution } from "@/components/dashboard/leader-kpi-distribution";
import { LeaderKpiRow } from "@/components/dashboard/leader-kpi-row";
import { LeaderNotifications } from "@/components/dashboard/leader-notifications";
import { LeaderProjectGrid } from "@/components/dashboard/leader-project-grid";
import { NexusIntelligenceFeed } from "@/components/dashboard/nexus-intelligence-feed";
import {
  LeaderActivityPanel,
  LeaderQuickActionsPanel,
  LeaderStatusPanel
} from "@/components/dashboard/leader-side-rail";
import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { useWorkspaceChat } from "@/components/dashboard/workspace-chat-provider";
import { useWorkspaceProjects } from "@/components/dashboard/workspace-projects-provider";
import { leaderIntelligenceFeedItems } from "@/lib/data/intelligence-feed";
import {
  getLeaderDashboardMock,
  getLeaderDashboardSearchItems
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type LeaderDashboardProps = {
  session: SessionUser;
};

export function LeaderDashboard({ session }: LeaderDashboardProps) {
  const { consultants, projects } = useWorkspaceProjects();
  const { conversations, totalUnreadCount } = useWorkspaceChat();
  const currentData = getLeaderDashboardMock(session, projects);
  const firstName = session.fullName.trim().split(/\s+/)[0] ?? session.fullName;
  const interventionCount = currentData.interventionProjects.length;
  const averageProgress = currentData.operationStatus[0]?.progress ?? 0;
  const capacityProgress = currentData.operationStatus[1]?.progress ?? 0;
  const clientCount = Number(currentData.metrics[2]?.value ?? "0");
  const alertCount = currentData.alerts.length;

  const kpiItems = [
    {
      label: currentData.metrics[0]?.label ?? "Proyectos activos",
      value: currentData.metrics[0]?.value ?? "0",
      progress: averageProgress,
      microcopy: "Lectura consolidada de la cartera activa para decidir foco y capacidad.",
      tone: currentData.metrics[0]?.tone
    },
    {
      label: currentData.metrics[1]?.label ?? "Consultores asignados",
      value: currentData.metrics[1]?.value ?? "0",
      progress: capacityProgress,
      microcopy: "Cobertura visible frente al requerimiento total de consultores activos.",
      tone: currentData.metrics[1]?.tone
    },
    {
      label: currentData.metrics[2]?.label ?? "Clientes activos",
      value: currentData.metrics[2]?.value ?? "0",
      progress: Math.min(100, Math.max(18, clientCount * 22)),
      microcopy: "Clientes con movimiento reciente y seguimiento operativo vigente.",
      tone: currentData.metrics[2]?.tone
    },
    {
      label: currentData.metrics[3]?.label ?? "Alertas abiertas",
      value: currentData.metrics[3]?.value ?? "0",
      progress: alertCount ? Math.min(100, 18 + alertCount * 16) : 12,
      microcopy: interventionCount
        ? `${interventionCount} frentes necesitan decision manual inmediata.`
        : "Sin frentes bloqueados por rechazos multiples.",
      tone: currentData.metrics[3]?.tone
    }
  ];

  const quickActions = [
    {
      label: "Registrar consultor",
      href: "/workspace/consultants/register"
    },
    {
      label: "Cotizaciones",
      href: "/workspace/quotes"
    },
    {
      label: "Ir a chat",
      href: "/workspace/chat"
    },
    {
      label: "Revisar intervencion",
      href: "#leader-intervention"
    },
    currentData.recommendedAction.primaryAction.label === "Crear proyecto" ||
    currentData.recommendedAction.primaryAction.label === "Ver alertas"
      ? {
          label: "Abrir proyecto prioritario",
          href: currentData.recentProjects[0]?.project?.href ?? "/workspace"
        }
      : currentData.recommendedAction.primaryAction
  ];

  const portfolioStatus =
    interventionCount > 0
      ? "intervention"
      : alertCount > 0
        ? "risk"
        : "stable";

  return (
    <OperationsShell
      session={session}
      portalLabel="LEADER"
      portalTitle="Centro de control operativo"
      subtitle="Coordina proyectos, alertas, asignaciones y conversaciones con una lectura ejecutiva clara para decidir rapido, intervenir a tiempo y mantener control total de la operacion."
      navItems={[
        { label: "Resumen", href: "#leader-overview", active: true },
        { label: "Proyectos", href: "#leader-projects", badge: String(currentData.recentProjects.length) },
        { label: "Cotizaciones", href: "/workspace/quotes" },
        {
          label: "Intervencion",
          href: "#leader-intervention",
          badge: String(currentData.interventionProjects.length)
        },
        { label: "Alertas", href: "#leader-alerts", badge: String(currentData.alerts.length) },
        { label: "Equipo", href: "#leader-activity", badge: String(currentData.teamActivity.length) },
        { label: "Chat", href: "/workspace/chat", badge: String(conversations.length) }
      ]}
      headerActions={<LeaderNotifications notifications={currentData.notifications} />}
      showHero={false}
      contentClassName="mx-auto w-full max-w-[1400px]"
      searchItems={getLeaderDashboardSearchItems(currentData)}
    >
      <div className="relative">
        <LeaderFloatingActions />

        <div className="space-y-6">
          <section
            id="leader-overview"
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-stretch"
          >
            <div className="flex h-full flex-col gap-6">
              <LeaderExecutiveHeader
                firstName={firstName}
                portfolioStatus={portfolioStatus}
                subtitle="Visualiza portafolio, detecta riesgos y decide rapido sin salir del contexto operativo."
              />
              <LeaderKpiRow items={kpiItems} />
            </div>

            <div id="leader-alerts" className="h-full">
              <LeaderStatusPanel
                alerts={currentData.alerts}
                className="h-full"
                statusItems={currentData.operationStatus}
              />
            </div>
          </section>

          <NexusIntelligenceFeed items={leaderIntelligenceFeedItems} />

          <LeaderKpiDistribution consultants={consultants} />

          <section
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-stretch"
          >
            <div id="leader-intervention" className="h-full">
              <OperationsPanel
                className="h-full bg-slate-950/84 shadow-[0_18px_44px_rgba(2,6,23,0.22)]"
                description="Frentes que agotaron el flujo automatico y necesitan asignacion manual inmediata."
                eyebrow="Intervencion"
                title="Proyectos con intervencion"
              >
                <LeaderProjectGrid
                  emptyDescription="Cuando un proyecto supere el umbral de rechazos aparecera aqui para accion manual."
                  emptyTitle="Sin proyectos bloqueados"
                  items={currentData.interventionProjects}
                />
              </OperationsPanel>
            </div>

            <div id="leader-chat" className="h-full">
              <ChatSummaryCard
                className="h-full"
                conversationCount={conversations.length}
                unreadCount={totalUnreadCount}
              />
            </div>
          </section>

          <section
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-stretch"
          >
            <div id="leader-activity" className="h-full">
              <LeaderActivityPanel activity={currentData.teamActivity} className="h-full" />
            </div>

            <div className="h-full">
              <LeaderQuickActionsPanel className="h-full" quickActions={quickActions} />
            </div>
          </section>

          <div id="leader-projects">
            <OperationsPanel
              className="bg-slate-950/84 shadow-[0_18px_44px_rgba(2,6,23,0.22)]"
              description="Portafolio activo con lectura ejecutiva limpia para abrir proyectos sin ruido visual."
              eyebrow="Proyectos"
              title="Proyectos activos"
            >
              <LeaderProjectGrid
                emptyDescription="Cuando existan proyectos activos apareceran aqui con su estado operativo."
                emptyTitle="Sin proyectos activos"
                items={currentData.recentProjects}
              />
            </OperationsPanel>
          </div>
        </div>
      </div>
    </OperationsShell>
  );
}
