import Link from "next/link";
import type { Route } from "next";

import { ProjectCardActions } from "./project-card-actions";
import { Button } from "@/components/ui/button";
import {
  getProjectPriorityLabel,
  getProjectStatusLabel,
  requiresManualAssignment,
  type DashboardProjectStatus,
  type DashboardTimelineItem
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type OperationsProjectGridProps = {
  items: DashboardTimelineItem[];
  actionLabel?: string;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

const statusStyles: Record<DashboardProjectStatus, string> = {
  approved: "bg-blue-500/12 text-blue-300",
  in_progress: "bg-cyan-500/12 text-cyan-300",
  at_risk: "bg-amber-500/12 text-amber-300",
  rejected_1: "bg-orange-500/12 text-orange-300",
  rejected_2: "bg-rose-500/12 text-rose-300",
  escalated: "bg-fuchsia-500/12 text-fuchsia-300",
  completed: "bg-emerald-500/12 text-emerald-300"
};

const priorityStyles = {
  HIGH: "bg-rose-500/12 text-rose-300",
  MEDIUM: "bg-amber-500/12 text-amber-300",
  LOW: "bg-emerald-500/12 text-emerald-300"
} as const;

const progressBarStyles: Record<DashboardProjectStatus, string> = {
  approved: "from-blue-500 via-cyan-400 to-sky-300",
  in_progress: "from-blue-500 via-cyan-400 to-sky-300",
  at_risk: "from-amber-400 via-orange-400 to-yellow-300",
  rejected_1: "from-orange-500 via-amber-400 to-yellow-300",
  rejected_2: "from-rose-500 via-fuchsia-500 to-orange-300",
  escalated: "from-fuchsia-500 via-violet-500 to-cyan-300",
  completed: "from-emerald-500 via-teal-400 to-cyan-300"
};

export function OperationsProjectGrid({
  items,
  actionLabel = "Abrir proyecto",
  className,
  emptyTitle = "Sin proyectos para mostrar",
  emptyDescription = "Cuando existan proyectos activos o en seguimiento apareceran aqui."
}: OperationsProjectGridProps) {
  const projectItems = items.filter((item) => !!item.project);

  if (!projectItems.length) {
    return (
      <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm font-semibold text-white">{emptyTitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 xl:grid-cols-2", className)}>
      {projectItems.map((item) => {
        const project = item.project!;
        const showManualAssignment = requiresManualAssignment(project);
        const showRiskAction = project.status === "at_risk" || project.status === "escalated";

        return (
          <article
            key={project.id}
            className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))] px-5 py-5 shadow-[0_22px_65px_rgba(2,6,23,0.34)]"
          >
            <div className="flex h-full flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      {project.folio}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        statusStyles[project.status]
                      )}
                    >
                      {getProjectStatusLabel(project.status)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        priorityStyles[project.priority]
                      )}
                    >
                      Prioridad {getProjectPriorityLabel(project.priority)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Link
                      className="text-xl font-semibold tracking-tight text-white transition-colors hover:text-cyan-300"
                      href={project.href as Route}
                    >
                      {project.name}
                    </Link>
                    <p className="text-sm font-medium text-slate-400">{project.client}</p>
                  </div>
                </div>

                <ProjectCardActions project={project} />
              </div>

              <p className="text-sm leading-6 text-slate-400">{item.subtitle || project.description}</p>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Estado operativo
                  </p>
                  <p className="text-sm font-medium text-white/90">{item.meta}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Consultores
                  </p>
                  <p className="text-sm font-medium text-white/90">
                    {project.assignedConsultants}/{project.consultantsRequired} asignados
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Ultima actualizacion
                  </p>
                  <p className="text-sm font-medium text-white/90">{project.lastUpdate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tipo
                  </p>
                  <p className="text-sm font-medium text-white/90">{project.type ?? "Operacion especializada"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {project.rejectionCount > 0 ? (
                  <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Rechazado {project.rejectionCount} {project.rejectionCount === 1 ? "vez" : "veces"}
                  </span>
                ) : null}
                {showManualAssignment ? (
                  <span className="rounded-full bg-rose-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300">
                    Requiere asignacion manual
                  </span>
                ) : null}
                {project.requiredSkills.slice(0, 2).map((skill) => (
                  <span
                    key={`${project.id}-${skill}`}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-medium text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Progreso
                  </p>
                  <p className="text-sm font-semibold text-white">{project.progress}%</p>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r",
                      progressBarStyles[project.status]
                    )}
                    style={{ width: `${Math.max(6, project.progress)}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild>
                  <Link href={project.href as Route}>{actionLabel}</Link>
                </Button>
                {showManualAssignment ? (
                  <Button asChild className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]" variant="secondary">
                    <Link href={`${project.href}#assignment` as Route}>Asignar consultor</Link>
                  </Button>
                ) : null}
                {showRiskAction ? (
                  <Button asChild className="bg-amber-500/12 text-amber-200 hover:bg-amber-500/18" variant="secondary">
                    <Link href={`${project.href}#risks` as Route}>Ver alertas</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}