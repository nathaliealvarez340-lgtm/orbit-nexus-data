import Link from "next/link";
import type { Route } from "next";

import { Button } from "@/components/ui/button";
import type { DashboardTimelineItem } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type OperationsFeedProps = {
  items: DashboardTimelineItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

const priorityStyles = {
  high: "bg-rose-500/12 text-rose-300",
  medium: "bg-amber-500/12 text-amber-300",
  low: "bg-emerald-500/12 text-emerald-300"
} as const;

const priorityLabels = {
  high: "Alta",
  medium: "Media",
  low: "Baja"
} as const;

export function OperationsFeed({
  items,
  emptyTitle = "Sin movimiento reciente",
  emptyDescription = "No hay eventos relevantes por mostrar en este momento.",
  className
}: OperationsFeedProps) {
  if (!items.length) {
    return (
      <div className={cn("rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6", className)}>
        <p className="text-sm font-semibold text-white">{emptyTitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const actions =
          item.actions?.length
            ? item.actions
            : item.href
              ? [{ label: "Abrir detalle", href: item.href }]
              : [];

        return (
          <article
            key={`${item.title}-${item.meta}`}
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-white">{item.title}</p>
                    {item.priority ? (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          priorityStyles[item.priority]
                        )}
                      >
                        {priorityLabels[item.priority]}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-slate-400">{item.subtitle}</p>
                </div>

                <div className="space-y-2 md:text-right">
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                    {item.status}
                  </span>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    {item.meta}
                  </p>
                </div>
              </div>

              {actions.length ? (
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button
                      key={`${item.title}-${action.href}`}
                      asChild
                      className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                      size="sm"
                      variant="secondary"
                    >
                      <Link href={action.href as Route}>{action.label}</Link>
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}