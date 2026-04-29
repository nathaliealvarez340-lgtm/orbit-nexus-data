"use client";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import type { DashboardConsultantRecord } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type LeaderKpiDistributionProps = {
  consultants: DashboardConsultantRecord[];
};

type ConsultantKpiBar = {
  id: string;
  fullName: string;
  specialty: string;
  score: number;
  deliveryCompliance: number;
  qualityScore: number;
  responseTimeMinutes: number;
  band: "high" | "medium" | "low";
};

const bandStyles = {
  high: {
    chip: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    bar: "from-emerald-400 via-teal-400 to-cyan-300"
  },
  medium: {
    chip: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    bar: "from-amber-400 via-orange-400 to-yellow-300"
  },
  low: {
    chip: "border-rose-400/20 bg-rose-500/10 text-rose-200",
    bar: "from-rose-500 via-fuchsia-500 to-orange-300"
  }
} as const;

function getResponseScore(minutes: number) {
  return Math.max(0, 100 - Math.min(minutes * 3, 100));
}

function buildConsultantBars(consultants: DashboardConsultantRecord[]): ConsultantKpiBar[] {
  return [...consultants]
    .map((consultant) => {
      const score = Math.round(
        (consultant.kpiSnapshot.deliveryCompliance +
          consultant.kpiSnapshot.qualityScore +
          getResponseScore(consultant.kpiSnapshot.responseTimeMinutes)) /
          3
      );
      const band: ConsultantKpiBar["band"] =
        score >= 80 ? "high" : score >= 60 ? "medium" : "low";

      return {
        id: consultant.id,
        fullName: consultant.fullName,
        specialty: consultant.specialty,
        score,
        deliveryCompliance: consultant.kpiSnapshot.deliveryCompliance,
        qualityScore: consultant.kpiSnapshot.qualityScore,
        responseTimeMinutes: consultant.kpiSnapshot.responseTimeMinutes,
        band
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function LeaderKpiDistribution({ consultants }: LeaderKpiDistributionProps) {
  const bars = buildConsultantBars(consultants);
  const highPerformers = bars.filter((consultant) => consultant.band === "high");
  const mediumPerformers = bars.filter((consultant) => consultant.band === "medium");
  const lowPerformers = bars.filter((consultant) => consultant.band === "low");
  const averageScore = bars.length
    ? Math.round(bars.reduce((total, consultant) => total + consultant.score, 0) / bars.length)
    : 0;

  return (
    <OperationsPanel
      description="Lectura ejecutiva de desempeno para decidir capacidad, seguimiento y riesgo antes de reasignar talento."
      eyebrow="KPIs"
      title="Distribucion de KPIs por consultor"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Alto desempeno",
              value: String(highPerformers.length),
              note: "Consultores con score >= 80",
              tone: "emerald"
            },
            {
              label: "Zona media",
              value: String(mediumPerformers.length),
              note: "Consultores con score entre 60 y 79",
              tone: "amber"
            },
            {
              label: "En riesgo",
              value: String(lowPerformers.length),
              note: "Consultores por debajo de 60",
              tone: "rose"
            },
            {
              label: "Promedio general",
              value: `${averageScore}%`,
              note: "Lectura consolidada de desempeno visible",
              tone: "blue"
            }
          ].map((summary) => (
            <article
              key={summary.label}
              className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {summary.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">{summary.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{summary.note}</p>
            </article>
          ))}
        </div>

        {bars.length ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-400">
              La barra combina cumplimiento, calidad y velocidad de respuesta para mostrar
              rapidamente que consultores sostienen mejor el ritmo operativo.
            </p>

            <div className="space-y-4">
              {bars.map((consultant) => (
                <article key={consultant.id} className="group rounded-[1.45rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{consultant.fullName}</p>
                      <p className="text-sm text-slate-400">{consultant.specialty}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                          bandStyles[consultant.band].chip
                        )}
                      >
                        {consultant.band === "high"
                          ? "Alto"
                          : consultant.band === "medium"
                            ? "Medio"
                            : "Riesgo"}
                      </span>
                      <span className="text-sm font-semibold text-white">{consultant.score}%</span>
                    </div>
                  </div>

                  <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r", bandStyles[consultant.band].bar)}
                      style={{ width: `${Math.max(8, consultant.score)}%` }}
                    />
                    <div className="pointer-events-none absolute inset-x-0 top-[-3.1rem] hidden rounded-2xl border border-white/10 bg-slate-950/94 px-3 py-2 text-xs leading-5 text-slate-300 shadow-[0_18px_40px_rgba(2,6,23,0.32)] group-hover:block">
                      Cumplimiento {consultant.deliveryCompliance}% | Calidad {consultant.qualityScore}% | Respuesta {consultant.responseTimeMinutes} min
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-6 text-slate-400">
            Aun no hay consultores visibles para construir la distribucion de KPIs.
          </div>
        )}
      </div>
    </OperationsPanel>
  );
}
