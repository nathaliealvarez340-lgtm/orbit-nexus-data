"use client";

import { Sparkles, UserPlus2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { ConsultantProfileCard } from "@/components/dashboard/consultant-profile-card";
import { useWorkspaceProjects } from "@/components/dashboard/workspace-projects-provider";
import { Button } from "@/components/ui/button";
import {
  getAssignedConsultantsForProject,
  getCompanyScopedConsultants,
  getSuggestedMatchScore,
  isSuggestedConsultant,
  requiresManualAssignment,
  type DashboardProjectRecord
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";

type ProjectAssignmentPanelProps = {
  project: DashboardProjectRecord;
  session: SessionUser;
};

export function ProjectAssignmentPanel({ project, session }: ProjectAssignmentPanelProps) {
  const { consultants, assignConsultant } = useWorkspaceProjects();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null
  );

  const scopedConsultants = useMemo(
    () => getCompanyScopedConsultants(consultants, session.tenantId ?? session.companyId),
    [consultants, session.companyId, session.tenantId]
  );

  const assignedConsultants = useMemo(
    () => getAssignedConsultantsForProject(scopedConsultants, project.slug),
    [project.slug, scopedConsultants]
  );

  const sortedConsultants = useMemo(
    () =>
      [...scopedConsultants].sort((left, right) => {
        const leftScore = getSuggestedMatchScore(project, left);
        const rightScore = getSuggestedMatchScore(project, right);

        return rightScore - leftScore;
      }),
    [project, scopedConsultants]
  );

  const needsManualAssignment = requiresManualAssignment(project);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Cobertura del proyecto</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {project.assignedConsultants}/{project.consultantsRequired} consultores asignados
                actualmente.
              </p>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-300">
              <Users className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-400 to-sky-300"
              style={{
                width: `${Math.min(
                  100,
                  (project.assignedConsultants / Math.max(project.consultantsRequired, 1)) * 100
                )}%`
              }}
            />
          </div>

          {assignedConsultants.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {assignedConsultants.map((consultant) => (
                <span
                  key={consultant.id}
                  className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-200"
                >
                  {consultant.fullName}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Todavia no hay consultores confirmados para este frente.
            </p>
          )}
        </div>

        <div
          className={cn(
            "rounded-[1.5rem] border px-4 py-4",
            needsManualAssignment
              ? "border-rose-500/20 bg-rose-500/10"
              : "border-white/10 bg-white/[0.04]"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">
                {needsManualAssignment
                  ? "Requiere asignacion manual"
                  : "Matching sugerido disponible"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {needsManualAssignment
                  ? `El proyecto acumula ${project.rejectionCount} rechazos y necesita intervencion del lider para reactivar la asignacion.`
                  : "La lista ordena consultores por skills, disponibilidad y carga actual para acelerar la decision."}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
                needsManualAssignment
                  ? "bg-rose-500/12 text-rose-300"
                  : "bg-cyan-500/12 text-cyan-300"
              )}
            >
              <Sparkles className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      {feedback ? (
        <div
          className={cn(
            "rounded-[1.3rem] border px-4 py-3 text-sm",
            feedback.tone === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/20 bg-rose-500/10 text-rose-200"
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {sortedConsultants.map((consultant) => {
          const suggested = isSuggestedConsultant(project, consultant);
          const alreadyAssigned = consultant.assignedProjectSlugs.includes(project.slug);
          const canAssign =
            !alreadyAssigned &&
            consultant.availability !== "unavailable" &&
            project.assignedConsultants < project.consultantsRequired;

          return (
            <ConsultantProfileCard
              key={consultant.id}
              action={
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-2xl"
                    disabled={!canAssign}
                    type="button"
                    onClick={() => {
                      const result = assignConsultant(project.slug, consultant.id, session.fullName);

                      setFeedback({
                        tone: result.ok ? "success" : "error",
                        message: result.message
                      });
                    }}
                  >
                    <UserPlus2 className="h-4 w-4" />
                    {alreadyAssigned ? "Ya asignado" : "Elegir consultor"}
                  </Button>
                  {alreadyAssigned ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      Confirmado
                    </span>
                  ) : null}
                </div>
              }
              consultant={consultant}
              headerLabel={`${suggested ? "Match sugerido" : "Lectura operativa"} · ${Math.round(
                getSuggestedMatchScore(project, consultant)
              )} pts`}
            />
          );
        })}
      </div>
    </div>
  );
}
