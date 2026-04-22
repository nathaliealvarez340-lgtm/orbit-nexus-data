import { cn } from "@/lib/utils";

type OperationsStatCardTone = "blue" | "emerald" | "amber" | "slate";

type OperationsStatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: OperationsStatCardTone;
};

const toneStyles: Record<
  OperationsStatCardTone,
  { accent: string; glow: string; chip: string }
> = {
  blue: {
    accent: "from-blue-500 via-cyan-400 to-sky-300",
    glow: "shadow-[0_0_0_1px_rgba(56,189,248,0.16)]",
    chip: "bg-cyan-500/12 text-cyan-300"
  },
  emerald: {
    accent: "from-emerald-500 via-teal-400 to-cyan-300",
    glow: "shadow-[0_0_0_1px_rgba(45,212,191,0.16)]",
    chip: "bg-emerald-500/12 text-emerald-300"
  },
  amber: {
    accent: "from-amber-400 via-orange-400 to-yellow-300",
    glow: "shadow-[0_0_0_1px_rgba(251,191,36,0.16)]",
    chip: "bg-amber-500/12 text-amber-300"
  },
  slate: {
    accent: "from-slate-400 via-slate-300 to-white",
    glow: "shadow-[0_0_0_1px_rgba(148,163,184,0.16)]",
    chip: "bg-white/10 text-slate-200"
  }
};

export function OperationsStatCard({
  label,
  value,
  detail,
  tone = "blue"
}: OperationsStatCardProps) {
  const palette = toneStyles[tone];

  return (
    <article
      className={cn(
        "rounded-[1.6rem] border border-white/10 bg-slate-950/80 px-5 py-5 shadow-[0_20px_55px_rgba(2,6,23,0.32)]",
        palette.glow
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>

        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
            palette.chip
          )}
        >
          Orbit KPI
        </span>
      </div>

      <div className={cn("mt-4 h-1.5 w-full rounded-full bg-gradient-to-r", palette.accent)} />

      <p className="mt-4 text-sm leading-6 text-slate-400">{detail}</p>
    </article>
  );
}
