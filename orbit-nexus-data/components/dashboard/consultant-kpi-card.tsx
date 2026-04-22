import type { DashboardConsultantKpiItem } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type ConsultantKpiCardProps = {
  item: DashboardConsultantKpiItem;
  variant?: "dark" | "light";
  compact?: boolean;
};

const toneBarStyles = {
  blue: "from-cyan-400 via-blue-400 to-sky-300",
  emerald: "from-emerald-400 via-teal-300 to-cyan-300",
  amber: "from-amber-300 via-orange-300 to-yellow-200",
  slate: "from-slate-300 via-slate-200 to-white"
} as const;

export function ConsultantKpiCard({
  item,
  variant = "dark",
  compact = false
}: ConsultantKpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.15rem] border px-3 py-3",
        variant === "dark"
          ? "border-white/10 bg-white/[0.04]"
          : "border-slate-200 bg-white"
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.18em]",
          variant === "dark" ? "text-slate-500" : "text-slate-500"
        )}
      >
        {item.label}
      </p>
      <p className={cn("mt-2 font-semibold tracking-tight", compact ? "text-lg" : "text-xl", variant === "dark" ? "text-white" : "text-slate-950")}>
        {item.value}
      </p>
      <p className={cn("mt-1 text-xs leading-5", variant === "dark" ? "text-slate-400" : "text-slate-500")}>
        {item.note}
      </p>

      <div className={cn("mt-3 h-2 overflow-hidden rounded-full", variant === "dark" ? "bg-white/[0.08]" : "bg-slate-100")}>
        <div
          className={cn("h-full rounded-full bg-gradient-to-r", toneBarStyles[item.tone ?? "slate"])}
          style={{ width: `${Math.max(8, Math.min(100, item.progress))}%` }}
        />
      </div>
    </div>
  );
}
