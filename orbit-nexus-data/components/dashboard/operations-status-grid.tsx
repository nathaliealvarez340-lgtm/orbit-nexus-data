import type { DashboardStatusItem } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type OperationsStatusGridProps = {
  items: DashboardStatusItem[];
  className?: string;
};

const toneStyles = {
  blue: "bg-cyan-500/12 text-cyan-300",
  emerald: "bg-emerald-500/12 text-emerald-300",
  amber: "bg-amber-500/12 text-amber-300",
  slate: "bg-white/10 text-slate-200"
} as const;

export function OperationsStatusGrid({ items, className }: OperationsStatusGridProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {items.map((item) => (
        <article
          key={`${item.label}-${item.value}`}
          className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-400">{item.label}</p>
              <p className="text-xl font-semibold text-white">{item.value}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                toneStyles[item.tone ?? "slate"]
              )}
            >
              Estado
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">{item.note}</p>
        </article>
      ))}
    </div>
  );
}
