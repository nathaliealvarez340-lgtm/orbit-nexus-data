import Link from "next/link";
import type { Route } from "next";

import { Button } from "@/components/ui/button";
import {
  getProjectPriorityLabel,
  getProjectStatusLabel,
  requiresManualAssignment,
  type DashboardProjectStatus,
  type DashboardTimelineItem
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type LeaderProjectGridProps = {
  items: DashboardTimelineItem[];
  emptyTitle: string;
  emptyDescription: string;
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

const progressStyles: Record<DashboardProjectStatus, string> = {
  approved: "from-blue-500 via-cyan-400 to-sky-300",
  in_progress: "from-blue-500 via-cyan-400 to-sky-300",
  at_risk: "from-amber-400 via-orange-400 to-yellow-300",
  rejected_1: "from-orange-500 via-amber-400 to-yellow-300",
  rejected_2: "from-rose-500 via-fuchsia-500 to-orange-300",
  escalated: "from-fuchsia-500 via-violet-500 to-cyan-300",
  completed: "from-emerald-500 via-teal-400 to-cyan-300"
};

function formatDateRange(startDate: string, endDate: string) {
  const format = (value: string) => {
    const [year, month, day] = value.split("-");

    if (!year || !month || !day) {
      return value;
    }

    const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${day} ${monthLabels[Number(month) - 1] ?? month}`;
  };

  return `${format(startDate)} - ${format(endDate)}`;
}

export function LeaderProjectGrid({
  items,
  emptyTitle,
  emptyDescription
}: LeaderProjectGridProps) {
  const projects = items.filter((item) => !!item.project);

  if (!projects.length) {
    return (
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-6">
        <p className="text-sm font-semibold text-white">{emptyTitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {projects.map((item) => {
        const project = item.project!;
        const showManualAssignment = requiresManualAssignment(project);

        return (
          <article
            key={project.id}
            className="flex h-full flex-col rounded-[1.6rem] border border-white/10 bg-slate-950/78 px-5 py-5 shadow-[0_14px_34px_rgba(2,6,23,0.2)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                {project.folio}
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
                  statusStyles[project.status]
                )}
              >
                {getProjectStatusLabel(project.status)}
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
                  priorityStyles[project.priority]
                )}
              >
                Prioridad {getProjectPriorityLabel(project.priority)}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <Link
                className="block text-2xl font-semibold tracking-tight text-white transition-colors hover:text-cyan-300 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden"
                href={project.href as Route}
              >
                {project.name}
              </Link>
              <p className="text-sm font-medium text-slate-400">{project.client}</p>
              <p className="text-sm text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1] overflow-hidden">
                {project.description}
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fechas</p>
                <p className="text-sm text-slate-200">{formatDateRange(project.startDate, project.endDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Consultores</p>
                <p className="text-sm text-slate-200">
                  {project.assignedConsultants}/{project.consultantsRequired}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Actualizacion</p>
                <p className="text-sm text-slate-200">{project.lastUpdate}</p>
              </div>
            </div>

            <div className="mt-auto space-y-4 pt-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Progreso</p>
                  <p className="text-sm font-semibold text-white">{project.progress}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r", progressStyles[project.status])}
                    style={{ width: `${Math.max(6, project.progress)}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild className="rounded-2xl">
                  <Link href={project.href as Route}>Abrir proyecto</Link>
                </Button>

                {showManualAssignment ? (
                  <Button
                    asChild
                    className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                    variant="secondary"
                  >
                    <Link href={`${project.href}#assignment` as Route}>
                      Asignar consultor
                    </Link>
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
