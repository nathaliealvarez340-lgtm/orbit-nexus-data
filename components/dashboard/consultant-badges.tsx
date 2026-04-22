import type { DashboardConsultantBadge } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type ConsultantBadgesProps = {
  badges: DashboardConsultantBadge[];
  variant?: "dark" | "light";
  limit?: number;
};

const badgeStyles = {
  dark: {
    blue: "border-cyan-400/15 bg-cyan-500/12 text-cyan-200",
    emerald: "border-emerald-400/15 bg-emerald-500/12 text-emerald-200",
    amber: "border-amber-400/15 bg-amber-500/12 text-amber-200",
    slate: "border-white/10 bg-white/[0.05] text-slate-200"
  },
  light: {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700"
  }
} as const;

export function ConsultantBadges({
  badges,
  variant = "dark",
  limit = badges.length
}: ConsultantBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.slice(0, limit).map((badge) => (
        <span
          key={badge.id}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            badgeStyles[variant][badge.tone]
          )}
          title={badge.description}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
