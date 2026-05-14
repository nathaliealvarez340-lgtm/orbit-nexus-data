import Link from "next/link";
import type { Route } from "next";

import { NexusIntelligenceFeed } from "@/components/dashboard/nexus-intelligence-feed";
import { OperationsFeed } from "@/components/dashboard/operations-feed";
import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { OperationsStatCard } from "@/components/dashboard/operations-stat-card";
import { OperationsStatusGrid } from "@/components/dashboard/operations-status-grid";
import { Button } from "@/components/ui/button";
import { executiveIntelligenceFeedItems } from "@/lib/data/intelligence-feed";
import type { ExecutiveCommandCenterData } from "@/lib/services/executive/command-center";
import type { SessionUser } from "@/types/auth";

type ExecutiveCommandCenterProps = {
  session: SessionUser;
  data: ExecutiveCommandCenterData;
};

export function ExecutiveCommandCenter({
  session,
  data
}: ExecutiveCommandCenterProps) {
  const navItems = [
    { label: "Command Center", href: "#command-center", active: true },
    { label: "Proyectos", href: "#executive-projects", badge: String(data.activeProjects.length) },
    { label: "Tareas", href: "#executive-tasks", badge: String(data.criticalTasks.length) },
    { label: "Alertas", href: "#executive-alerts", badge: String(data.alerts.length) },
    { label: "Reportes", href: "#executive-reports", badge: String(data.reports.length) },
    {
      label: "Automatizaciones",
      href: "#executive-automations",
      badge: String(data.automations.length)
    },
    { label: "MAIA", href: "/workspace/orbit-ai" },
    { label: "Cotizaciones", href: "/workspace/quotes" },
    { label: "Facturas", href: "/workspace/invoices" },
    { label: "Datos fiscales", href: "/workspace/tax-profile" },
    { label: "Empresas / Clientes", href: "/workspace/clients" },
    { label: "Integraciones", href: "/workspace/integrations" }
  ];

  const topActions = [
    { label: "Nueva cotizacion", href: "/workspace/quotes" },
    { label: "Nuevo cliente", href: "/workspace/clients" },
    { label: "Datos fiscales", href: "/workspace/tax-profile" },
    { label: "Crear proyecto", href: "/workspace/projects/create" },
    { label: "Abrir MAIA", href: "/workspace/orbit-ai" }
  ];

  return (
    <OperationsShell
      session={session}
      portalLabel="CEO OS"
      portalTitle="CEO Command Center"
      subtitle={data.welcomeSubtitle}
      navItems={navItems}
      searchItems={data.searchItems}
      showHero={false}
      contentClassName="mx-auto w-full max-w-[1480px]"
    >
      <section
        id="command-center"
        className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.92fr)]"
      >
        <OperationsPanel
          className="overflow-hidden bg-slate-950/84"
          contentClassName="space-y-6"
          description="Controla proyectos, metricas y prioridades en tiempo real sin perder trazabilidad ni foco ejecutivo."
          eyebrow={data.organizationName}
          title="¿Qué necesita decidir o ejecutar tu empresa hoy?"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                  Tu sistema operativo ejecutivo ya organiza, analiza y muestra resultados operativos
                  en tiempo real. Convierte datos dispersos en decisiones claras con una sola vista.
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-cyan-200">
                    {data.organizationSector ? `Sector ${data.organizationSector}` : "Operacion lista para escalar"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                    {data.voiceStatus.label}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {topActions.map((action, index) => (
                  <Button
                    key={`${action.href}-${action.label}`}
                    asChild
                    className={index === 0 ? "" : "bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"}
                    variant={index === 0 ? "default" : "secondary"}
                  >
                    <Link href={action.href as Route}>{action.label}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid min-w-[15rem] gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Estado ejecutivo
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">{data.metrics[0]?.value ?? "0"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Proyectos operativos visibles y listos para seguimiento.
                </p>
              </article>

              <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Proxima capa
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">Voice ready</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Arquitectura preparada para wake word, speech-to-text y respuesta por voz.
                </p>
              </article>
            </div>
          </div>
        </OperationsPanel>

        <OperationsPanel
          className="bg-slate-950/84"
          contentClassName="space-y-5"
          description="MAIA entiende tu operacion, navega modulos y convierte instrucciones en acciones controladas."
          eyebrow="MAIA"
          title="Asistente CEO"
        >
          <div id="orbit-ai" className="space-y-5">
            <div className="rounded-[1.55rem] border border-cyan-400/20 bg-cyan-500/10 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Estado de la capa IA
              </p>
              <p className="mt-3 text-xl font-semibold text-white">{data.voiceStatus.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{data.voiceStatus.detail}</p>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Preguntas sugeridas
              </p>
              <div className="flex flex-wrap gap-2">
                {data.aiPromptSuggestions.map((prompt) => (
                  <span
                    key={prompt}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300"
                  >
                    {prompt}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Capacidades iniciales
              </p>
              <ul className="space-y-2 text-sm leading-6 text-slate-300">
                <li>Resume el estado operativo, riesgos y prioridades en tiempo real.</li>
                <li>Analiza proyectos, tareas, KPI, alertas, reportes y automatizaciones.</li>
                <li>Puede abrir modulos, preparar borradores y pedir confirmacion antes de acciones sensibles.</li>
              </ul>
            </div>
          </div>
        </OperationsPanel>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <OperationsStatCard
            key={metric.label}
            detail={metric.detail}
            label={metric.label}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </section>

      <OperationsPanel
        className="bg-slate-950/84"
        contentClassName="space-y-5"
        description="Lectura consolidada de salud operativa, equipos, integraciones y reporteo ejecutivo."
        eyebrow="Monitoreo"
        title="Estado operativo en tiempo real"
      >
        <OperationsStatusGrid items={data.operationalStatus} />
      </OperationsPanel>

      <NexusIntelligenceFeed items={executiveIntelligenceFeedItems} />

      <section className="grid gap-6 xl:grid-cols-2">
        <OperationsPanel
          className="bg-slate-950/84"
          description="Frentes activos visibles para coordinar ejecucion, riesgo y prioridades desde una sola vista."
          eyebrow="Proyectos"
          title="Operacion en curso"
        >
          <div id="executive-projects">
            <OperationsFeed
              emptyDescription="Cuando la organizacion tenga proyectos activos, apareceran aqui con contexto ejecutivo."
              emptyTitle="Sin proyectos operativos"
              items={data.activeProjects}
            />
          </div>
        </OperationsPanel>

        <OperationsPanel
          className="bg-slate-950/84"
          description="Tareas con riesgo, bloqueo o vencimiento cercano para intervenir antes de que escalen."
          eyebrow="Tareas"
          title="Prioridades criticas"
        >
          <div id="executive-tasks">
            <OperationsFeed
              emptyDescription="No hay tareas criticas visibles. La operacion se mantiene sin bloqueos inmediatos."
              emptyTitle="Sin tareas urgentes"
              items={data.criticalTasks}
            />
          </div>
        </OperationsPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <OperationsPanel
          className="bg-slate-950/84"
          description="Alertas y riesgos detectados por la capa operativa para actuar antes de perder control."
          eyebrow="Riesgos"
          title="Alertas inteligentes"
        >
          <div id="executive-alerts">
            <OperationsFeed
              emptyDescription="Las alertas aparecera aqui cuando el sistema detecte desviaciones o incidencias."
              emptyTitle="Sin alertas abiertas"
              items={data.alerts}
            />
          </div>
        </OperationsPanel>

        <OperationsPanel
          className="bg-slate-950/84"
          description="Ideas accionables para organizar mejor la operacion, reforzar rendimiento y anticipar cuellos de botella."
          eyebrow="Insights"
          title="Inteligencia ejecutiva"
        >
          <OperationsFeed
            emptyDescription="Carga KPI y metricas para que Orbit Nexus sintetice insights ejecutivos utiles."
            emptyTitle="Sin insights disponibles"
            items={data.keyInsights}
          />
        </OperationsPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <OperationsPanel
          className="bg-slate-950/84"
          description="Reportes listos para lectura directiva con foco en estado actual y siguientes decisiones."
          eyebrow="Reportes"
          title="Reportes ejecutivos"
        >
          <div id="executive-reports">
            <OperationsFeed
              emptyDescription="Todavia no hay reportes generados para esta organizacion."
              emptyTitle="Sin reportes disponibles"
              items={data.reports}
            />
          </div>
        </OperationsPanel>

        <OperationsPanel
          className="bg-slate-950/84"
          description="Rutinas configurables para convertir seguimiento manual en disciplina operativa sostenida."
          eyebrow="Automatizaciones"
          title="Automatizaciones activas"
        >
          <div id="executive-automations">
            <OperationsFeed
              emptyDescription="Activa automatizaciones cuando quieras ampliar seguimiento y reporteo sin friccion."
              emptyTitle="Sin automatizaciones configuradas"
              items={data.automations}
            />
          </div>
        </OperationsPanel>
      </section>

      <OperationsPanel
        className="bg-slate-950/84"
        description="Actividad reciente consolidada para entender como se mueve la operacion y donde conviene intervenir."
        eyebrow="Actividad"
        title="Pulso de la organizacion"
      >
        <OperationsFeed
          emptyDescription="Cuando la organizacion genere actividad operativa, la veras consolidada en este panel."
          emptyTitle="Sin actividad reciente"
          items={data.activityFeed}
        />
      </OperationsPanel>
    </OperationsShell>
  );
}
