"use client";

import type { Route } from "next";
import Link from "next/link";

import { ConsultantBadgeRibbon } from "@/components/dashboard/consultant-badge-ribbon";
import { ConsultantCalendarButton } from "@/components/dashboard/consultant-calendar-button";
import { ConsultantChatStrip } from "@/components/dashboard/consultant-chat-strip";
import { ConsultantExecutiveHeader } from "@/components/dashboard/consultant-executive-header";
import { ConsultantExecutionRail } from "@/components/dashboard/consultant-execution-rail";
import { ConsultantProjectGrid } from "@/components/dashboard/consultant-project-grid";
import { NexusIntelligenceFeed } from "@/components/dashboard/nexus-intelligence-feed";
import { OperationsFeed } from "@/components/dashboard/operations-feed";
import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { OperationsStatCard } from "@/components/dashboard/operations-stat-card";
import { useWorkspaceChat } from "@/components/dashboard/workspace-chat-provider";
import { Button } from "@/components/ui/button";
import { consultantIntelligenceFeedItems } from "@/lib/data/intelligence-feed";
import {
  getConsultantDashboardSearchItems,
  type ConsultantDashboardMock
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type ConsultantDashboardProps = {
  session: SessionUser;
  data: ConsultantDashboardMock;
};

export function ConsultantDashboard({ session, data }: ConsultantDashboardProps) {
  const { conversations, getConversationCounterpartData, totalUnreadCount } = useWorkspaceChat();
  const latestConversation = conversations[0];
  const latestCounterpart = latestConversation
    ? getConversationCounterpartData(latestConversation)
    : null;
  const latestMovement = latestConversation
    ? `${latestCounterpart?.fullName ?? "Lider"} movio ${latestConversation.projectFolio} | ${new Date(latestConversation.lastMessageAt).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit"
      })}`
    : null;
  const priorityDeliverable = data.upcomingDeliverables[0] ?? null;
  const riskItem =
    data.myProjects.find((item) => item.project?.status === "at_risk" || item.project?.status === "escalated") ??
    data.leaderFeedback.find((item) => item.priority === "high") ??
    null;
  const primaryActions = [
    data.quickActions[0] ?? { label: "Reportar avance", href: "/workspace/actions/reportar-avance" },
    data.quickActions[1] ?? { label: "Subir entregable", href: "/workspace/actions/subir-entregable" },
    { label: "Abrir chat", href: "/workspace/chat" }
  ];

  return (
    <OperationsShell
      session={session}
      portalLabel="CONSULTANT"
      portalTitle="Centro de ejecucion personal"
      subtitle="Organiza entregables, revisa feedback y ejecuta cada proyecto con una lectura clara de prioridades, capacidad y cumplimiento diario."
      showHero={false}
      navItems={[
        { label: "Resumen", href: "#consultant-overview", active: true },
        { label: "Insignias", href: "#consultant-credentials", badge: String(Math.min(6, data.consultantProfile.badges.length)) },
        { label: "Calendario", href: "/workspace/calendar", badge: String(data.upcomingDeliverables.length) },
        { label: "Proyectos", href: "#consultant-projects", badge: String(data.myProjects.length) },
        {
          label: "Entregables",
          href: "#consultant-deliverables",
          badge: String(data.upcomingDeliverables.length)
        },
        { label: "Foco", href: "#consultant-focus", badge: String(data.workflowStatus.length) },
        { label: "Chat", href: "/workspace/chat", badge: String(conversations.length) },
        { label: "Documentos", href: "#consultant-assets", badge: String(data.recentAssets.length) },
        { label: "Avances", href: "#consultant-history", badge: String(data.progressHistory.length) }
      ]}
      headerActions={
        <>
          <ConsultantCalendarButton eventCount={data.upcomingDeliverables.length} />
          <div className="flex h-16 min-w-[132px] flex-col justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.05] px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Carga visible
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {data.consultantProfile.occupancyPercent}% activa
            </p>
          </div>
        </>
      }
      showProfileCard={false}
      searchItems={getConsultantDashboardSearchItems(data)}
    >
      <ConsultantExecutiveHeader
        actions={primaryActions}
        consultant={data.consultantProfile}
        priorityDeliverable={priorityDeliverable}
        session={session}
      />

      <NexusIntelligenceFeed items={consultantIntelligenceFeedItems} />

      <div id="consultant-overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <OperationsStatCard
            key={metric.label}
            detail={metric.detail}
            label={metric.label}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </div>

      <ConsultantBadgeRibbon badges={data.consultantProfile.badges} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:items-stretch">
        <div id="consultant-projects">
          <OperationsPanel
            className="h-full"
            actions={
              <>
                <Button asChild>
                  <Link href={(data.quickActions[0]?.href ?? "/workspace/actions/reportar-avance") as Route}>
                    {data.quickActions[0]?.label ?? "Reportar avance"}
                  </Link>
                </Button>
                <Button asChild className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]" variant="secondary">
                  <Link href={(data.quickActions[1]?.href ?? "/workspace/actions/subir-entregable") as Route}>
                    {data.quickActions[1]?.label ?? "Subir entregable"}
                  </Link>
                </Button>
              </>
            }
            description="Tus frentes activos con lectura inmediata de prioridad, progreso y siguiente entrega para decidir donde trabajar primero."
            eyebrow="Ejecucion"
            title="Trabajo actual"
          >
            <ConsultantProjectGrid actionLabel="Ver detalle del proyecto" items={data.myProjects} />
          </OperationsPanel>
        </div>

        <div id="consultant-focus" className="min-w-0 self-stretch">
          <ConsultantExecutionRail
            consultant={data.consultantProfile}
            feedbackItems={data.leaderFeedback}
            priorityDeliverable={priorityDeliverable}
            riskItem={riskItem}
            workflowStatus={data.workflowStatus}
          />
        </div>
      </section>

      <ConsultantChatStrip
        conversationCount={conversations.length}
        lastMovement={latestMovement}
        unreadCount={totalUnreadCount}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-stretch">
        <div id="consultant-deliverables" className="min-w-0">
          <OperationsPanel
            className="h-full"
            description="Ventana inmediata de entregables para organizar tu jornada y evitar incidencias."
            eyebrow="Agenda"
            title="Proximos entregables"
          >
            <OperationsFeed items={data.upcomingDeliverables} />
          </OperationsPanel>
        </div>

        <div id="consultant-assets" className="min-w-0">
          <OperationsPanel
            className="h-full"
            actions={
              <Button
                asChild
                className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                size="sm"
                variant="secondary"
              >
                <Link href={(data.quickActions[1]?.href ?? "/workspace/actions/subir-entregable") as Route}>
                  Subir entregable
                </Link>
              </Button>
            }
            description="Documentos y archivos recientes listos para consulta, revision o envio al lider como evidencia operativa."
            eyebrow="Documentos"
            title="Assets recientes"
          >
            <OperationsFeed items={data.recentAssets} />
          </OperationsPanel>
        </div>
      </section>

      <div id="consultant-history">
        <OperationsPanel
          actions={
            <Button
              asChild
              className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
              size="sm"
              variant="secondary"
            >
              <Link href={(data.quickActions[0]?.href ?? "/workspace/actions/reportar-avance") as Route}>
                Reportar avance
              </Link>
            </Button>
          }
          description="Secuencia reciente de avances, comentarios y evidencia de ejecucion para mantener trazabilidad visible."
          eyebrow="Trazabilidad"
          title="Historial de avances"
        >
          <OperationsFeed items={data.progressHistory} />
        </OperationsPanel>
      </div>
    </OperationsShell>
  );
}
