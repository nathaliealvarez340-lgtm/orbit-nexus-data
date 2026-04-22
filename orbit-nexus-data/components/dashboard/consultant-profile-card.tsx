import type { ReactNode } from "react";

import { ConsultantBadges } from "@/components/dashboard/consultant-badges";
import { ConsultantKpiCard } from "@/components/dashboard/consultant-kpi-card";
import {
  getConsultantAvailabilityLabel,
  getConsultantPrimaryKpis,
  type DashboardConsultantRecord
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type ConsultantProfileCardProps = {
  consultant: DashboardConsultantRecord;
  variant?: "dark" | "light";
  action?: ReactNode;
  compact?: boolean;
  badgeLimit?: number;
  headerLabel?: string;
};

const availabilityStyles = {
  dark: {
    available: "bg-emerald-500/12 text-emerald-200",
    partial: "bg-amber-500/12 text-amber-200",
    unavailable: "bg-rose-500/12 text-rose-200"
  },
  light: {
    available: "bg-emerald-50 text-emerald-700",
    partial: "bg-amber-50 text-amber-700",
    unavailable: "bg-rose-50 text-rose-700"
  }
} as const;

export function ConsultantProfileCard({
  consultant,
  variant = "dark",
  action,
  compact = false,
  badgeLimit = 3,
  headerLabel
}: ConsultantProfileCardProps) {
  const kpis = getConsultantPrimaryKpis(consultant);

  return (
    <article
      className={cn(
        "rounded-[1.55rem] border px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.18)]",
        variant === "dark"
          ? "border-white/10 bg-white/[0.04]"
          : "border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {headerLabel ? (
            <p className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", variant === "dark" ? "text-cyan-400" : "text-blue-700")}>
              {headerLabel}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className={cn("text-base font-semibold", variant === "dark" ? "text-white" : "text-slate-950")}>
              {consultant.fullName}
            </h3>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                availabilityStyles[variant][consultant.availability]
              )}
            >
              {getConsultantAvailabilityLabel(consultant.availability)}
            </span>
          </div>
          <p className={cn("mt-2 text-sm font-medium", variant === "dark" ? "text-cyan-200" : "text-blue-700")}>
            {consultant.specialty}
          </p>
          <p className={cn("mt-1 text-sm", variant === "dark" ? "text-slate-400" : "text-slate-500")}>
            {consultant.roleLabel}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", variant === "dark" ? "text-slate-500" : "text-slate-500")}>
            Carga actual
          </p>
          <p className={cn("mt-2 text-xl font-semibold tracking-tight", variant === "dark" ? "text-white" : "text-slate-950")}>
            {consultant.occupancyPercent}%
          </p>
        </div>
      </div>

      <p className={cn("mt-3 text-sm leading-6", variant === "dark" ? "text-slate-400" : "text-slate-600")}>
        {consultant.note}
      </p>

      <div className="mt-4">
        <ConsultantBadges badges={consultant.badges} limit={badgeLimit} variant={variant} />
      </div>

      <div className={cn("mt-4 grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        {kpis.slice(0, compact ? 2 : 3).map((item) => (
          <ConsultantKpiCard
            key={item.id}
            compact={compact}
            item={item}
            variant={variant}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className={cn("flex flex-wrap gap-x-4 gap-y-2 text-sm", variant === "dark" ? "text-slate-400" : "text-slate-600")}>
          <span>{consultant.assignedProjectSlugs.length} proyectos activos</span>
          <span>{consultant.professionalStatus}</span>
        </div>
        {action}
      </div>
    </article>
  );
}
