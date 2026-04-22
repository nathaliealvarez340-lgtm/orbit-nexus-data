import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  getProjectStatusLabel,
  type DashboardProjectStatus,
  type DashboardTimelineItem
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type TimelineListProps = {
  items: DashboardTimelineItem[];
  className?: string;
};

export function TimelineList({ items, className }: TimelineListProps) {
  const priorityStyles = {
    high: "bg-rose-50 text-rose-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-emerald-50 text-emerald-700"
  } as const;

  const priorityLabels = {
    high: "Alto",
    medium: "Medio",
    low: "Bajo"
  } as const;

  const projectStatusStyles: Record<DashboardProjectStatus, string> = {
    approved: "bg-blue-50 text-blue-700",
    in_progress: "bg-cyan-50 text-cyan-700",
    at_risk: "bg-amber-50 text-amber-700",
    rejected_1: "bg-orange-50 text-orange-700",
    rejected_2: "bg-rose-50 text-rose-700",
    escalated: "bg-fuchsia-50 text-fuchsia-700",
    completed: "bg-emerald-50 text-emerald-700"
  };

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const project = item.project;
        const actionItems =
          item.actions?.length
            ? item.actions
            : item.href
              ? [{ label: project ? "Abrir proyecto" : "Abrir detalle", href: item.href }]
              : [];

        return (
          <div
            key={`${item.title}-${item.meta}`}
            className={cn(
              "rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 transition-colors",
              item.href ? "hover:border-blue-200 hover:bg-blue-50/60" : "hover:border-slate-300"
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {project ? (
                      <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        {project.folio}
                      </span>
                    ) : null}

                    {item.href ? (
                      <Link
                        className="text-base font-semibold text-slate-900 transition-colors hover:text-blue-700"
                        href={item.href as Route}
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="text-base font-semibold text-slate-900">{item.title}</p>
                    )}

                    {item.priority ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                          priorityStyles[item.priority]
                        )}
                      >
                        {priorityLabels[item.priority]}
                      </span>
                    ) : null}
                  </div>

                  {item.href ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      {project ? "Abrir proyecto" : "Abrir detalle"}
                    </p>
                  ) : null}

                  <p className="text-sm leading-6 text-slate-500">{item.subtitle}</p>

                  {project ? (
                    <div className="grid gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Cliente
                        </p>
                        <p className="mt-1 font-medium text-slate-900">{project.client}</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Estado
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {getProjectStatusLabel(project.status)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Progreso
                        </p>
                        <p className="mt-1 font-medium text-slate-900">{project.progress}%</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Ultima actualizacion
                        </p>
                        <p className="mt-1 font-medium text-slate-900">{project.lastUpdate}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 md:text-right">
                  {project ? (
                    <div
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                        projectStatusStyles[project.status]
                      )}
                    >
                      {getProjectStatusLabel(project.status)}
                    </div>
                  ) : (
                    <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                      {item.status}
                    </div>
                  )}
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    {item.meta}
                  </p>
                </div>
              </div>

              {actionItems.length ? (
                <div className="flex flex-wrap gap-2">
                  {actionItems.map((action) => (
                    <Button key={`${item.title}-${action.href}`} asChild size="sm" variant="outline">
                      <Link href={action.href as Route}>{action.label}</Link>
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
