import type { DashboardStatusItem } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type StatusTone = "blue" | "emerald" | "amber" | "slate";

type StatusGridProps = {
  items: DashboardStatusItem[];
  className?: string;
};

const toneClasses: Record<StatusTone, string> = {
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-700"
};

export function StatusGrid({ items, className }: StatusGridProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
            </div>

            <div
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                toneClasses[item.tone ?? "blue"]
              )}
            >
              Orbit status
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">{item.note}</p>
        </div>
      ))}
    </div>
  );
}
