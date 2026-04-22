"use client";

import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  getProjectPriorityLabel,
  getProjectStatusLabel,
  type DashboardProjectStatus,
  type DashboardTimelineItem
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type ConsultantProjectGridProps = {
  items: DashboardTimelineItem[];
  actionLabel?: string;
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

export function ConsultantProjectGrid({
  items,
  actionLabel = "Ver detalle del proyecto"
}: ConsultantProjectGridProps) {
  const projectItems = items.filter((item) => !!item.project);

  if (!projectItems.length) {
    return (
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-5">
        <p className="text-sm font-semibold text-white">Sin proyectos asignados</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Cuando recibas frentes activos apareceran aqui con prioridad, progreso y fecha clave visible.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {projectItems.map((item) => {
        const project = item.project!;

        return (
          <article
            key={project.id}
            className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-5 shadow-[0_18px_44px_rgba(2,6,23,0.22)]"
          >
            <div className="flex h-full flex-col gap-4">
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
                  className="text-lg font-semibold tracking-tight text-white transition-colors hover:text-cyan-300"
                  href={project.href as Route}
                >
                  {project.name}
                </Link>
                <p className="text-sm font-medium text-slate-400">{project.client}</p>
                <p className="truncate text-sm text-slate-500">{item.subtitle || project.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Proxima entrega
                  </p>
                  <p className="text-sm text-slate-200">{item.meta}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Consultores
                  </p>
                  <p className="text-sm text-slate-200">
                    {project.assignedConsultants}/{project.consultantsRequired} asignados
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Ultima actualizacion
                  </p>
                  <p className="text-sm text-slate-200">{project.lastUpdate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Fecha limite
                  </p>
                  <p className="text-sm text-slate-200">{project.endDate}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Progreso
                  </p>
                  <p className="text-sm font-semibold text-white">{project.progress}%</p>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    aria-hidden="true"
                    className={cn("h-full rounded-full bg-gradient-to-r", progressBarStyles[project.status])}
                    style={{ width: `${Math.max(6, project.progress)}%` }}
                  />
                </div>
              </div>

              <div className="pt-1">
                <Button asChild className="rounded-2xl">
                  <Link href={project.href as Route}>{actionLabel}</Link>
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
