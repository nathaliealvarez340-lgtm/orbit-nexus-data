import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardTone = "blue" | "emerald" | "amber" | "slate";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: StatCardTone;
};

const toneStyles: Record<StatCardTone, { accent: string; chip: string }> = {
  blue: {
    accent: "from-blue-600 via-sky-500 to-cyan-400",
    chip: "bg-blue-50 text-blue-700"
  },
  emerald: {
    accent: "from-emerald-600 via-emerald-500 to-teal-400",
    chip: "bg-emerald-50 text-emerald-700"
  },
  amber: {
    accent: "from-amber-500 via-orange-400 to-yellow-300",
    chip: "bg-amber-50 text-amber-700"
  },
  slate: {
    accent: "from-slate-900 via-slate-700 to-slate-400",
    chip: "bg-slate-100 text-slate-700"
  }
};

export function StatCard({ label, value, detail, tone = "blue" }: StatCardProps) {
  const palette = toneStyles[tone];

  return (
    <Card className="border-white/90 bg-white/92">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          </div>

          <div
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
              palette.chip
            )}
          >
            Orbit KPI
          </div>
        </div>

        <div className={cn("h-1.5 w-full rounded-full bg-gradient-to-r", palette.accent)} />

        <p className="text-sm leading-6 text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}
