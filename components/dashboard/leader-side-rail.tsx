import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { CircularMetric } from "@/components/dashboard/circular-metric";
import { Button } from "@/components/ui/button";
import type {
  DashboardLinkAction,
  DashboardStatusItem,
  DashboardTimelineItem
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type LeaderSharedPanelProps = {
  className?: string;
};

type LeaderStatusPanelProps = LeaderSharedPanelProps & {
  alerts: DashboardTimelineItem[];
  statusItems: DashboardStatusItem[];
};

type LeaderActivityPanelProps = LeaderSharedPanelProps & {
  activity: DashboardTimelineItem[];
};

type LeaderQuickActionsPanelProps = LeaderSharedPanelProps & {
  quickActions: DashboardLinkAction[];
};

type LeaderSideRailProps = LeaderStatusPanelProps &
  LeaderActivityPanelProps &
  LeaderQuickActionsPanelProps;

const priorityStyles = {
  high: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
} as const;

function SectionFrame({
  title,
  description,
  children,
  className
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.7rem] border border-white/10 bg-slate-950 px-5 py-5 shadow-[0_18px_42px_rgba(2,6,23,0.22)]",
        className
      )}
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AlertCard({ alert }: { alert: DashboardTimelineItem }) {
  const primaryAction = alert.actions?.[0];

  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">{alert.title}</p>
          <p className="text-sm leading-6 text-slate-400">{alert.subtitle}</p>
        </div>
        {alert.priority ? (
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
              priorityStyles[alert.priority]
            )}
          >
            {alert.priority === "high"
              ? "Alta"
              : alert.priority === "medium"
                ? "Media"
                : "Baja"}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {alert.meta}
        </span>
        {primaryAction ? (
          <Button
            asChild
            className="rounded-2xl bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
            size="sm"
            variant="secondary"
          >
            <Link href={primaryAction.href as Route}>{primaryAction.label}</Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function LeaderStatusPanel({
  alerts,
  statusItems,
  className
}: LeaderStatusPanelProps) {
  return (
    <SectionFrame
      className={cn("flex h-full flex-col", className)}
      description="Indicadores circulares y alertas visibles para leer salud operativa y decidir sin salir del dashboard."
      title="Estado general"
    >
      <div className="flex flex-1 flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-3">
          {statusItems.map((item) => (
            <CircularMetric
              key={item.label}
              label={item.label}
              note={item.note}
              progress={item.progress}
              tone={item.tone}
              value={item.value}
            />
          ))}
        </div>

        <div className="border-t border-white/10 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Alertas visibles
            </p>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              {alerts.length}
            </span>
          </div>

          {alerts.length ? (
            <div className="grid gap-3">
              {alerts.slice(0, 2).map((alert) => (
                <AlertCard key={`${alert.title}-${alert.meta}`} alert={alert} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
              No hay alertas operativas visibles en este momento.
            </div>
          )}
        </div>
      </div>
    </SectionFrame>
  );
}

export function LeaderActivityPanel({
  activity,
  className
}: LeaderActivityPanelProps) {
  return (
    <SectionFrame
      className={cn("h-full", className)}
      description="Secuencia reciente del equipo para detectar movimiento, aprobaciones y frentes en seguimiento."
      title="Actividad reciente"
    >
      {activity.length ? (
        <div className="space-y-3">
          {activity.slice(0, 4).map((item) => (
            <article
              key={`${item.title}-${item.meta}`}
              className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.subtitle}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.meta}
                </span>
                {item.href ? (
                  <Link
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300"
                    href={item.href as Route}
                  >
                    Abrir
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
          No hay actividad reciente por mostrar.
        </div>
      )}
    </SectionFrame>
  );
}

export function LeaderQuickActionsPanel({
  quickActions,
  className
}: LeaderQuickActionsPanelProps) {
  return (
    <SectionFrame
      className={cn("h-full", className)}
      description="Acciones directas para moverte rapido por el sistema sin duplicar el header principal."
      title="Acciones rapidas"
    >
      <div className="space-y-3">
        {quickActions.map((action) => (
          <Button
            key={`${action.label}-${action.href}`}
            asChild
            className="w-full justify-between rounded-2xl bg-white/[0.04] px-4 text-slate-100 hover:bg-white/[0.08]"
            variant="secondary"
          >
            <Link href={action.href as Route}>
              <span>{action.label}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Ir
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </SectionFrame>
  );
}

export function LeaderSideRail({
  alerts,
  activity,
  statusItems,
  quickActions
}: LeaderSideRailProps) {
  return (
    <aside className="space-y-6 xl:sticky xl:top-6 xl:z-20 xl:self-start">
      <LeaderStatusPanel alerts={alerts} statusItems={statusItems} />
      <LeaderActivityPanel activity={activity} />
      <LeaderQuickActionsPanel quickActions={quickActions} />
    </aside>
  );
}
