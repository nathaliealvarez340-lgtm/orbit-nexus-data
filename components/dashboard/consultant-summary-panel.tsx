import {
  getConsultantExtendedKpis,
  type DashboardConsultantRecord,
  type DashboardProjectRecord
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";
import { ConsultantProfileCard } from "@/components/dashboard/consultant-profile-card";
import { ConsultantKpiCard } from "@/components/dashboard/consultant-kpi-card";

type ConsultantSummaryPanelProps = {
  consultant: DashboardConsultantRecord;
  projects: DashboardProjectRecord[];
  variant?: "dark" | "light";
};

export function ConsultantSummaryPanel({
  consultant,
  projects,
  variant = "dark"
}: ConsultantSummaryPanelProps) {
  const extendedKpis = getConsultantExtendedKpis(consultant);
  const activeProjects = projects.filter((project) =>
    consultant.assignedProjectSlugs.includes(project.slug)
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <ConsultantProfileCard
        badgeLimit={3}
        consultant={consultant}
        headerLabel="Perfil profesional"
        variant={variant}
      />

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {extendedKpis.slice(3).map((item) => (
            <ConsultantKpiCard key={item.id} item={item} variant={variant} />
          ))}
        </div>

        <div
          className={cn(
            "rounded-[1.45rem] border px-4 py-4",
            variant === "dark"
              ? "border-white/10 bg-white/[0.04]"
              : "border-slate-200 bg-white"
          )}
        >
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", variant === "dark" ? "text-slate-500" : "text-slate-500")}>
            Proyectos actuales
          </p>
          <div className="mt-3 space-y-3">
            {activeProjects.length ? (
              activeProjects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "rounded-[1.1rem] border px-3 py-3",
                    variant === "dark"
                      ? "border-white/10 bg-slate-950/70"
                      : "border-slate-200 bg-slate-50"
                  )}
                >
                  <p className={cn("text-sm font-semibold", variant === "dark" ? "text-white" : "text-slate-950")}>
                    {project.folio}
                  </p>
                  <p className={cn("mt-1 text-sm", variant === "dark" ? "text-slate-300" : "text-slate-600")}>
                    {project.name}
                  </p>
                </div>
              ))
            ) : (
              <p className={cn("text-sm leading-6", variant === "dark" ? "text-slate-400" : "text-slate-600")}>
                No hay proyectos activos asignados en este momento.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
