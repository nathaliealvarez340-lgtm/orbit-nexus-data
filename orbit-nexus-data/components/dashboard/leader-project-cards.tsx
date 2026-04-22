import Link from "next/link";
import type { Route } from "next";

import { Button } from "@/components/ui/button";
import {
  getProjectStatusLabel,
  type DashboardProjectStatus,
  type DashboardTimelineItem
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type LeaderProjectCardsProps = {
  items: DashboardTimelineItem[];
  className?: string;
};

const statusStyles: Record<DashboardProjectStatus, string> = {
  approved: "bg-blue-50 text-blue-700",
  in_progress: "bg-cyan-50 text-cyan-700",
  at_risk: "bg-amber-50 text-amber-700",
  rejected_1: "bg-orange-50 text-orange-700",
  rejected_2: "bg-rose-50 text-rose-700",
  escalated: "bg-fuchsia-50 text-fuchsia-700",
  completed: "bg-emerald-50 text-emerald-700"
};

const priorityStyles = {
  HIGH: "bg-rose-50 text-rose-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  LOW: "bg-emerald-50 text-emerald-700"
} as const;

const priorityLabels = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja"
} as const;

const progressBarStyles: Record<DashboardProjectStatus, string> = {
  approved: "from-blue-700 via-blue-500 to-cyan-400",
  in_progress: "from-blue-700 via-blue-500 to-cyan-400",
  at_risk: "from-amber-600 via-orange-500 to-yellow-400",
  rejected_1: "from-orange-600 via-amber-500 to-yellow-400",
  rejected_2: "from-rose-700 via-fuchsia-500 to-orange-400",
  escalated: "from-fuchsia-700 via-violet-500 to-cyan-400",
  completed: "from-emerald-700 via-emerald-500 to-teal-400"
};

export function LeaderProjectCards({ items, className }: LeaderProjectCardsProps) {
  const projectItems = items.filter((item) => !!item.project);

  return (
    <div className={cn("grid gap-4 xl:grid-cols-2", className)}>
      {projectItems.map((item) => {
        const project = item.project!;

        return (
          <article
            key={project.id}
            className="group rounded-[1.8rem] border border-slate-200/80 bg-white px-5 py-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-float"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
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
                      Prioridad {priorityLabels[project.priority]}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Link
                      className="text-xl font-semibold tracking-tight text-slate-950 transition-colors hover:text-blue-700"
                      href={project.href as Route}
                    >
                      {project.name}
                    </Link>
                    <p className="text-sm font-medium text-slate-500">Cliente {project.client}</p>
                  </div>
                </div>

                <Button asChild className="rounded-full px-4" variant="outline">
                  <Link href={project.href as Route}>Abrir proyecto</Link>
                </Button>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                {item.subtitle || project.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span>
                  {project.assignedConsultants}/{project.consultantsRequired} consultores asignados
                </span>
                <span>{item.meta}</span>
                <span>Ultima actualizacion {project.lastUpdate}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Progreso
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{project.progress}%</p>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r transition-all",
                      progressBarStyles[project.status]
                    )}
                    style={{ width: `${Math.max(6, project.progress)}%` }}
                  />
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}