import { cn } from "@/lib/utils";

type LeaderKpiItem = {
  label: string;
  value: string;
  progress: number;
  microcopy: string;
  tone?: "blue" | "emerald" | "amber" | "slate";
};

type LeaderKpiRowProps = {
  items: LeaderKpiItem[];
};

const toneStyles = {
  blue: "from-blue-500 via-cyan-400 to-sky-300",
  emerald: "from-emerald-500 via-teal-400 to-cyan-300",
  amber: "from-amber-400 via-orange-400 to-yellow-300",
  slate: "from-slate-400 via-slate-300 to-slate-100"
} as const;

export function LeaderKpiRow({ items }: LeaderKpiRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="flex h-full flex-col rounded-[1.55rem] border border-white/10 bg-slate-950/78 px-5 py-5 shadow-[0_16px_38px_rgba(2,6,23,0.22)]"
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">{item.label}</p>
            <p className="text-3xl font-semibold tracking-tight text-white">{item.value}</p>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r",
                toneStyles[item.tone ?? "blue"]
              )}
              style={{ width: `${Math.max(8, Math.min(100, item.progress))}%` }}
            />
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-400">{item.microcopy}</p>
        </article>
      ))}
    </div>
  );
}
