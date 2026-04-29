"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

import { ConsultantProfileCard } from "@/components/dashboard/consultant-profile-card";
import { LeaderNotifications } from "@/components/dashboard/leader-notifications";
import { OperationsFeed } from "@/components/dashboard/operations-feed";
import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { OperationsStatCard } from "@/components/dashboard/operations-stat-card";
import { ProjectAssignmentPanel } from "@/components/dashboard/project-assignment-panel";
import { useWorkspaceProjects } from "@/components/dashboard/workspace-projects-provider";
import { Button } from "@/components/ui/button";
import {
  type DashboardTimelineItem,
  getAssignedConsultantsForProject,
  getClientDashboardMock,
  getClientDashboardSearchItems,
  getCompanyScopedConsultants,
  getConsultantDashboardMock,
  getConsultantDashboardSearchItems,
  getSuggestedConsultantsForProject,
  getLeaderDashboardMock,
  getLeaderDashboardSearchItems,
  getProjectPriorityLabel,
  getProjectStatusLabel,
  requiresManualAssignment
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";

type ProjectDetailViewProps = {
  session: SessionUser;
  projectSlug: string;
};

const riskSeverityStyles = {
  high: "bg-rose-500/12 text-rose-300",
  medium: "bg-amber-500/12 text-amber-300",
  low: "bg-emerald-500/12 text-emerald-300"
} as const;

function getPortalLabel(role: SessionUser["role"]) {
  if (role === "LEADER") return "LEADER";
  if (role === "CONSULTANT") return "CONSULTANT";
  if (role === "CLIENT") return "CLIENT";
  return role;
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;

  const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${day} ${monthLabels[Number(month) - 1] ?? month} ${year}`;
}

export function ProjectDetailView({ session, projectSlug }: ProjectDetailViewProps) {
  const { consultants, getProject, isHydrated, projects } = useWorkspaceProjects();
  const project = getProject(projectSlug);
  const leaderData = useMemo(() => getLeaderDashboardMock(session, projects), [projects, session]);

  const scopedConsultants = useMemo(
    () => getCompanyScopedConsultants(consultants, session.tenantId ?? session.companyId),
    [consultants, session.companyId, session.tenantId]
  );

  const assignedConsultants = useMemo(
    () => (project ? getAssignedConsultantsForProject(scopedConsultants, project.slug) : []),
    [project, scopedConsultants]
  );

  const suggestedConsultants = useMemo(
    () => (project ? getSuggestedConsultantsForProject(project, scopedConsultants, 3) : []),
    [project, scopedConsultants]
  );

  const visibleSuggestedConsultants = useMemo(() => {
    if (!project) return [];

    if (!assignedConsultants.length) {
      return suggestedConsultants.slice(0, 2);
    }

    return suggestedConsultants
      .filter((consultant) => !consultant.assignedProjectSlugs.includes(project.slug))
      .slice(0, 2);
  }, [assignedConsultants.length, project, suggestedConsultants]);

  const searchItems = useMemo(() => {
    if (session.role === "LEADER") {
      return getLeaderDashboardSearchItems(leaderData);
    }

    if (session.role === "CONSULTANT") {
      return getConsultantDashboardSearchItems(getConsultantDashboardMock(session));
    }

    return getClientDashboardSearchItems(getClientDashboardMock(session));
  }, [leaderData, session]);

  const clientProfile = project?.clientProfile ?? null;
  const leadConsultant = assignedConsultants[0] ?? null;

  const headerActions =
    session.role === "LEADER" ? <LeaderNotifications notifications={leaderData.notifications} /> : undefined;

  if (!project && !isHydrated) {
    return (
      <OperationsShell
        session={session}
        portalLabel={getPortalLabel(session.role)}
        portalTitle="Detalle de proyecto"
        subtitle="Cargando contexto operativo del proyecto seleccionado."
        navItems={[{ label: "Volver al workspace", href: "/workspace", active: true }]}
        primaryActions={[{ label: "Volver al dashboard", href: "/workspace" }]}
        headerActions={headerActions}
        searchItems={searchItems}
      >
        <OperationsPanel eyebrow="Cargando" title="Preparando detalle" description="Estamos recuperando el estado local del workspace.">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-400">
            Espera un momento mientras cargamos el proyecto.
          </div>
        </OperationsPanel>
      </OperationsShell>
    );
  }

  if (!project) {
    return (
      <OperationsShell
        session={session}
        portalLabel={getPortalLabel(session.role)}
        portalTitle="Detalle de proyecto"
        subtitle="La ruta sigue protegida, pero no encontramos el proyecto solicitado en el estado actual del workspace."
        navItems={[{ label: "Volver al workspace", href: "/workspace", active: true }]}
        primaryActions={[{ label: "Volver al dashboard", href: "/workspace" }]}
        headerActions={headerActions}
        searchItems={searchItems}
      >
        <OperationsPanel eyebrow="No encontrado" title="Proyecto no disponible">
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/workspace">Volver al dashboard</Link>
            </Button>
          </div>
        </OperationsPanel>
      </OperationsShell>
    );
  }

  const timelineItems: DashboardTimelineItem[] = [...project.timeline]
    .slice()
    .reverse()
    .map((event) => ({
      title: event.title,
      subtitle: event.description,
      meta: event.timestamp,
      status: event.actor,
      href: event.href,
      priority:
        event.type === "alert" || event.type === "rejected"
          ? "high"
          : event.type === "progress"
            ? "medium"
            : "low"
    }));

  const riskItems: DashboardTimelineItem[] = project.openRisks.map((risk) => ({
    title: risk.title,
    subtitle: risk.description,
    meta: risk.openedAt,
    status: risk.severity === "high" ? "Riesgo critico" : risk.severity === "medium" ? "Seguimiento" : "Controlado",
    priority: risk.severity,
    href: project.href
  }));

  const milestoneItems: DashboardTimelineItem[] = project.milestones.map((milestone) => ({
    title: milestone.title,
    subtitle: `${project.folio} | ${project.client}`,
    meta: formatDateLabel(milestone.date),
    status:
      milestone.status === "completed"
        ? "Completado"
        : milestone.status === "in_progress"
          ? "En curso"
          : "Proximo",
    priority: milestone.status === "completed" ? "low" : milestone.status === "in_progress" ? "medium" : "high",
    href: project.href
  }));

  const nextActions = [
    { label: "Volver al dashboard", href: "/workspace" },
    { label: "Abrir asignacion", href: `${project.href}#assignment` },
    project.status === "at_risk" || project.status === "escalated"
      ? { label: "Ver alertas", href: `${project.href}#risks` }
      : undefined
  ].filter((action): action is { label: string; href: string } => Boolean(action));

  return (
    <OperationsShell
      session={session}
      portalLabel={getPortalLabel(session.role)}
      portalTitle="Detalle de proyecto"
      subtitle={project.description}
      navItems={[
        { label: "Workspace", href: "/workspace" },
        { label: "Resumen", href: "#summary", active: true },
        { label: "Asignacion", href: "#assignment", badge: String(project.assignedConsultants) },
        { label: "Riesgos", href: "#risks", badge: String(project.openRisks.length) },
        { label: "Historial", href: "#history", badge: String(project.timeline.length) }
      ]}
      primaryActions={nextActions}
      headerActions={headerActions}
      searchItems={searchItems}
    >
      <section
        id="summary"
        className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.26),rgba(15,23,42,0.94))] px-6 py-6 shadow-[0_24px_70px_rgba(2,6,23,0.34)]"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {project.folio}
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                  project.status === "at_risk" || project.status === "escalated"
                    ? "bg-amber-500/12 text-amber-300"
                    : "bg-cyan-500/12 text-cyan-300"
                )}
              >
                {getProjectStatusLabel(project.status)}
              </span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Prioridad {getProjectPriorityLabel(project.priority)}
              </span>
              {requiresManualAssignment(project) ? (
                <span className="rounded-full bg-rose-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300">
                  Requiere asignacion manual
                </span>
              ) : null}
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {project.name}
              </h1>
              <p className="mt-2 text-base leading-7 text-slate-300">{project.client}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`${project.href}#assignment` as any}>
                {requiresManualAssignment(project) ? "Asignar consultor" : "Elegir consultor"}
              </Link>
            </Button>
            {project.openRisks.length ? (
              <Button asChild className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]" variant="secondary">
                <Link href={`${project.href}#risks` as any}>Ver alertas</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Progreso</p>
            <p className="mt-2 text-xl font-semibold text-white">{project.progress}%</p>
          </div>
          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Consultores requeridos</p>
            <p className="mt-2 text-xl font-semibold text-white">{project.consultantsRequired}</p>
          </div>
          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Consultores asignados</p>
            <p className="mt-2 text-xl font-semibold text-white">{project.assignedConsultants}</p>
          </div>
          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ultima actualizacion</p>
            <p className="mt-2 text-xl font-semibold text-white">{project.lastUpdate}</p>
          </div>
          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tipo</p>
            <p className="mt-2 text-xl font-semibold text-white">{project.type ?? "Operacion especializada"}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OperationsStatCard
          detail={`Estado actual del proyecto ${project.folio}.`}
          label="Estado"
          tone={project.status === "at_risk" || project.status === "escalated" ? "amber" : "blue"}
          value={getProjectStatusLabel(project.status)}
        />
        <OperationsStatCard
          detail="Porcentaje consolidado de avance reportado en el frente actual."
          label="Progreso"
          tone="emerald"
          value={`${project.progress}%`}
        />
        <OperationsStatCard
          detail="Consultores ya confirmados frente al requerimiento definido por el lider."
          label="Cobertura"
          tone="slate"
          value={`${project.assignedConsultants}/${project.consultantsRequired}`}
        />
        <OperationsStatCard
          detail="Rechazos acumulados del flujo de asignacion hasta el momento."
          label="Rechazos"
          tone={project.rejectionCount >= 2 ? "amber" : "blue"}
          value={String(project.rejectionCount)}
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <OperationsPanel
          description="Contexto ejecutivo del proyecto, cliente, asignacion actual y lectura rapida del estado operativo."
          eyebrow="Resumen ejecutivo"
          title="Contexto del proyecto"
        >
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-400">
              <p className="text-base font-semibold text-white">Proyecto</p>
              <p className="mt-2">{project.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-sm font-semibold text-white">Ventana operativa</p>
                <p className="mt-2 text-sm text-slate-400">
                  Inicio {formatDateLabel(project.startDate)} | Entrega {formatDateLabel(project.endDate)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-sm font-semibold text-white">Asignacion</p>
                <p className="mt-2 text-sm text-slate-400">{project.leader}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {leadConsultant
                    ? `Consultor principal: ${leadConsultant.fullName}`
                    : "Aun no hay consultor asignado."}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-sm font-semibold text-white">Cliente</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Nombre</p>
                  <p className="mt-2 text-sm text-slate-300">{clientProfile?.name ?? project.client}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Empresa</p>
                  <p className="mt-2 text-sm text-slate-300">{clientProfile?.company ?? "No registrada"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Correo</p>
                  <p className="mt-2 text-sm text-slate-300">{clientProfile?.email ?? "No registrado"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Telefono</p>
                  <p className="mt-2 text-sm text-slate-300">{clientProfile?.phone ?? "No registrado"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sector</p>
                  <p className="mt-2 text-sm text-slate-300">{clientProfile?.sector ?? "No registrado"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Folio</p>
                  <p className="mt-2 text-sm text-slate-300">{project.folio}</p>
                </div>
              </div>
              {clientProfile?.notes ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Notas relevantes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{clientProfile.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-sm font-semibold text-white">Avance y habilidades</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Progreso actual: {project.progress}% · Ultima lectura: {project.lastUpdate}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.requiredSkills.length ? (
                  project.requiredSkills.map((skill) => (
                    <span
                      key={`${project.id}-${skill}`}
                      className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    Todavia no hay skills definidos para este proyecto.
                  </span>
                )}
              </div>
            </div>
          </div>
        </OperationsPanel>

        <div id="assignment">
          <OperationsPanel
            description="Asigna consultores desde el detalle del proyecto usando solo la cartera activa de la empresa actual."
            eyebrow="Asignacion de consultores"
            title="Elegir consultor"
          >
            {session.role === "LEADER" ? (
              <ProjectAssignmentPanel project={project} session={session} />
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-400">
                La asignacion de consultores solo esta disponible para el portal LEADER.
              </div>
            )}
          </OperationsPanel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <OperationsPanel
          description="Lectura ejecutiva de consultores ya asignados al frente con KPIs, insignias y disponibilidad visible."
          eyebrow="Equipo asignado"
          title="Consultores del proyecto"
        >
          {assignedConsultants.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {assignedConsultants.map((consultant) => (
                <ConsultantProfileCard
                  key={consultant.id}
                  badgeLimit={2}
                  compact
                  consultant={consultant}
                  headerLabel="Perfil operativo"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-400">
              Aun no hay consultores confirmados para este proyecto. En cuanto se asigne uno, aqui se mostrara su perfil con KPIs e insignias.
            </div>
          )}
        </OperationsPanel>

        <OperationsPanel
          description="Perfiles sugeridos para decidir rapido a quien asignar si el frente aun no tiene cobertura completa."
          eyebrow="Candidatos sugeridos"
          title={assignedConsultants.length ? "Refuerzo potencial" : "Consultores recomendados"}
        >
          {visibleSuggestedConsultants.length ? (
            <div className="grid gap-4">
              {visibleSuggestedConsultants.map((consultant) => (
                <ConsultantProfileCard
                  key={consultant.id}
                  action={
                    session.role === "LEADER" ? (
                      <Button asChild className="rounded-2xl" size="sm">
                        <Link href={`${project.href}#assignment` as any}>Asignar desde detalle</Link>
                      </Button>
                    ) : null
                  }
                  badgeLimit={2}
                  compact
                  consultant={consultant}
                  headerLabel="Decision sugerida"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-400">
              No hay candidatos sugeridos adicionales para este frente en este momento.
            </div>
          )}
        </OperationsPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div id="files">
          <OperationsPanel
            description="Archivos mock del proyecto listos para conectarse con backend real y visor posterior."
            eyebrow="Archivos"
            title="Assets del proyecto"
          >
            <div className="space-y-3">
              {project.attachments.length ? (
                project.attachments.map((attachment) => (
                  <div
                    key={attachment}
                    className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-white">{attachment}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Archivo listo para versionado, comentarios y seguimiento posterior.
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-400">
                  No hay archivos cargados para este proyecto.
                </div>
              )}
            </div>
          </OperationsPanel>
        </div>

        <div id="risks">
          <OperationsPanel
            description="Riesgos abiertos y alertas visibles para reaccionar sin salir del contexto del proyecto."
            eyebrow="Alertas abiertas"
            title="Riesgos del proyecto"
          >
            {riskItems.length ? (
              <div className="space-y-3">
                {project.openRisks.map((risk) => (
                  <article
                    key={risk.id}
                    className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-white">{risk.title}</p>
                        <p className="text-sm leading-6 text-slate-400">{risk.description}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                          riskSeverityStyles[risk.severity]
                        )}
                      >
                        {risk.severity === "high" ? "Alta" : risk.severity === "medium" ? "Media" : "Baja"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Abierto {risk.openedAt}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <OperationsFeed
                emptyDescription="No hay alertas activas sobre este proyecto."
                emptyTitle="Sin riesgos abiertos"
                items={riskItems}
              />
            )}
          </OperationsPanel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div id="history">
          <OperationsPanel
            description="Secuencia reciente de eventos para entender creacion, asignacion, rechazo y cambios del proyecto."
            eyebrow="Historial"
            title="Timeline del proyecto"
          >
            <OperationsFeed items={timelineItems} />
          </OperationsPanel>
        </div>

        <OperationsPanel
          description="Proximos hitos para coordinar fechas, seguimiento y ventanas de decision ejecutiva."
          eyebrow="Proximos hitos"
          title="Fechas importantes"
        >
          <OperationsFeed
            emptyDescription="No hay hitos cargados para este proyecto todavia."
            emptyTitle="Sin hitos definidos"
            items={milestoneItems}
          />
        </OperationsPanel>
      </section>
    </OperationsShell>
  );
}
