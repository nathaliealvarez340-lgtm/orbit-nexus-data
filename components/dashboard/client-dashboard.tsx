import Link from "next/link";
import type { Route } from "next";

import { ConsultantProfileCard } from "@/components/dashboard/consultant-profile-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusGrid } from "@/components/dashboard/status-grid";
import { TimelineList } from "@/components/dashboard/timeline-list";
import { Button } from "@/components/ui/button";
import {
  getClientDashboardSearchItems,
  type ClientDashboardMock
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type ClientDashboardProps = {
  session: SessionUser;
  data: ClientDashboardMock;
};

export function ClientDashboard({ session, data }: ClientDashboardProps) {
  return (
    <DashboardShell
      session={session}
      portalTitle="Portal Client"
      subtitle="Supervisa el progreso del proyecto con una experiencia clara, sobria y orientada a confianza, validacion y visibilidad real."
      searchItems={getClientDashboardSearchItems(data)}
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metric.tone}
            />
          ))}
        </section>

        <RecommendationCard recommendation={data.recommendedAction} />

        <SectionCard
          eyebrow="Confianza"
          title="Consultor asignado"
          description="Perfil visible del consultor responsable para reforzar confianza, capacidad y trazabilidad operativa del frente."
        >
          {data.assignedConsultant ? (
            <div className="space-y-4">
              <ConsultantProfileCard
                badgeLimit={2}
                compact
                consultant={data.assignedConsultant}
                headerLabel="Perfil validado para este frente operativo"
                variant="light"
              />
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              Aun no se ha confirmado un consultor para este proyecto. Cuando exista asignacion, el perfil aparecera aqui.
            </div>
          )}
        </SectionCard>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard
            eyebrow="Visibilidad"
            title="Progreso del proyecto"
            description="Lectura ejecutiva del folio activo, su estado, progreso y el nivel de confianza operativo antes de revisar entregables."
            actions={
              <>
                <Button asChild>
                  <Link href={(data.quickActions[0]?.href ?? "/workspace/projects/expansion-operativa-norte") as Route}>
                    {data.quickActions[0]?.label ?? "Revisar avance"}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={(data.quickActions[1]?.href ?? "/workspace/actions/validar-entregable") as Route}>
                    {data.quickActions[1]?.label ?? "Validar entregable"}
                  </Link>
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <TimelineList items={[data.activeProject]} />
              <StatusGrid items={data.projectProgress} className="md:grid-cols-1 xl:grid-cols-1" />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Entregables"
            title="Entregables recientes"
            description="Documentos y avances disponibles para consulta con contexto, version y estado visible."
          >
            <TimelineList items={data.recentDeliverables} />
          </SectionCard>
        </section>

        <SectionCard
          eyebrow="Confianza"
          title="Validaciones y comentarios"
          description="Seguimiento de observaciones, pendientes y cierres para que la conversacion con el consultor se mantenga ordenada."
        >
          <TimelineList items={data.validations} />
        </SectionCard>
      </div>
    </DashboardShell>
  );
}