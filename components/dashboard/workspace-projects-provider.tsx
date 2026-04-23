"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import {
  createConsultantRecord,
  createProjectRecord,
  type CreateConsultantInput,
  getCompanyScopedConsultants,
  getInitialDashboardConsultants,
  getInitialDashboardProjects,
  getProjectBySlug,
  getTenantScopedProjects,
  normalizeConsultantRecord,
  normalizeProjectRecord,
  type CreateProjectInput,
  type DashboardConsultantRecord,
  type DashboardProjectRecord
} from "@/lib/dashboard/mock-data";

type AssignConsultantResult = {
  ok: boolean;
  message: string;
  project?: DashboardProjectRecord;
  consultant?: DashboardConsultantRecord;
};

type WorkspaceProjectsContextValue = {
  projects: DashboardProjectRecord[];
  consultants: DashboardConsultantRecord[];
  isHydrated: boolean;
  createProject: (input: CreateProjectInput, leaderName: string) => DashboardProjectRecord;
  createConsultant: (input: CreateConsultantInput) => DashboardConsultantRecord;
  removeConsultant: (email: string) => void;
  getProject: (slug: string) => DashboardProjectRecord | undefined;
  getScopedConsultants: (companyId: string | null) => DashboardConsultantRecord[];
  assignConsultant: (
    projectSlug: string,
    consultantId: string,
    actorName: string
  ) => AssignConsultantResult;
};

const STORAGE_PROJECTS_KEY = "orbit-nexus-workspace-projects";
const STORAGE_CONSULTANTS_KEY = "orbit-nexus-workspace-consultants";

const WorkspaceProjectsContext = createContext<WorkspaceProjectsContextValue | null>(null);

function isProjectRecord(value: unknown): value is DashboardProjectRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const project = value as DashboardProjectRecord;

  return (
    typeof project.id === "string" &&
    typeof project.slug === "string" &&
    typeof project.folio === "string" &&
    typeof project.name === "string" &&
    Array.isArray(project.attachments) &&
    Array.isArray(project.timeline)
  );
}

function isConsultantRecord(value: unknown): value is DashboardConsultantRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const consultant = value as DashboardConsultantRecord;

  return (
    typeof consultant.id === "string" &&
    typeof consultant.fullName === "string" &&
    Array.isArray(consultant.skills) &&
    Array.isArray(consultant.assignedProjectSlugs)
  );
}

function deriveAvailability(occupancyPercent: number): DashboardConsultantRecord["availability"] {
  if (occupancyPercent >= 85) {
    return "unavailable";
  }

  if (occupancyPercent >= 60) {
    return "partial";
  }

  return "available";
}

function getScopedStorageKey(baseKey: string, companyId: string | null) {
  return `${baseKey}:${companyId ?? "public"}`;
}

export function WorkspaceProjectsProvider({
  children,
  tenantId
}: {
  children: ReactNode;
  tenantId: string | null;
}) {
  const [projects, setProjects] = useState<DashboardProjectRecord[]>(() =>
    getInitialDashboardProjects(tenantId)
  );
  const [consultants, setConsultants] = useState<DashboardConsultantRecord[]>(() =>
    getInitialDashboardConsultants(tenantId)
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const scopedProjectsKey = getScopedStorageKey(STORAGE_PROJECTS_KEY, tenantId);
      const scopedConsultantsKey = getScopedStorageKey(STORAGE_CONSULTANTS_KEY, tenantId);
      const storedProjects =
        window.localStorage.getItem(scopedProjectsKey) ??
        window.localStorage.getItem(STORAGE_PROJECTS_KEY);
      const storedConsultants =
        window.localStorage.getItem(scopedConsultantsKey) ??
        window.localStorage.getItem(STORAGE_CONSULTANTS_KEY);

      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects) as unknown;

        if (Array.isArray(parsedProjects) && parsedProjects.every(isProjectRecord)) {
          const scopedProjects = getTenantScopedProjects(
            parsedProjects.map((project) => normalizeProjectRecord(project)),
            tenantId
          );

          if (scopedProjects.length) {
            setProjects(scopedProjects);
          } else {
            setProjects(getInitialDashboardProjects(tenantId));
          }
        }
      }

      if (storedConsultants) {
        const parsedConsultants = JSON.parse(storedConsultants) as unknown;

        if (Array.isArray(parsedConsultants) && parsedConsultants.every(isConsultantRecord)) {
          const scopedConsultants = getCompanyScopedConsultants(parsedConsultants, tenantId);

          if (scopedConsultants.length) {
            setConsultants(
              scopedConsultants.map((consultant) => normalizeConsultantRecord(consultant))
            );
          } else {
            setConsultants(getInitialDashboardConsultants(tenantId));
          }
        }
      } else {
        setConsultants(getInitialDashboardConsultants(tenantId));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_PROJECTS_KEY);
      window.localStorage.removeItem(STORAGE_CONSULTANTS_KEY);
      window.localStorage.removeItem(getScopedStorageKey(STORAGE_PROJECTS_KEY, tenantId));
      window.localStorage.removeItem(getScopedStorageKey(STORAGE_CONSULTANTS_KEY, tenantId));
      setProjects(getInitialDashboardProjects(tenantId));
      setConsultants(getInitialDashboardConsultants(tenantId));
    } finally {
      setIsHydrated(true);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      getScopedStorageKey(STORAGE_PROJECTS_KEY, tenantId),
      JSON.stringify(projects)
    );
  }, [tenantId, isHydrated, projects]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      getScopedStorageKey(STORAGE_CONSULTANTS_KEY, tenantId),
      JSON.stringify(consultants)
    );
  }, [tenantId, consultants, isHydrated]);

  const value = useMemo<WorkspaceProjectsContextValue>(
    () => ({
      projects,
      consultants,
      isHydrated,
      createProject(input, leaderName) {
        let nextProject!: DashboardProjectRecord;

        setProjects((currentProjects) => {
          nextProject = createProjectRecord(input, currentProjects, leaderName, tenantId);
          return [nextProject, ...currentProjects];
        });

        return nextProject;
      },
      createConsultant(input) {
        let nextConsultant!: DashboardConsultantRecord;

        setConsultants((currentConsultants) => {
          nextConsultant = createConsultantRecord(input, currentConsultants, tenantId);
          return [nextConsultant, ...currentConsultants];
        });

        return nextConsultant;
      },
      removeConsultant(email) {
        const normalizedEmail = email.trim().toLowerCase();

        setConsultants((currentConsultants) =>
          currentConsultants.filter(
            (consultant) => consultant.email?.trim().toLowerCase() !== normalizedEmail
          )
        );
      },
      getProject(slug) {
        return getProjectBySlug(slug, projects, tenantId);
      },
      getScopedConsultants(nextCompanyId) {
        return getCompanyScopedConsultants(consultants, nextCompanyId);
      },
      assignConsultant(projectSlug, consultantId, actorName) {
        const currentProject = projects.find((project) => project.slug === projectSlug);
        const currentConsultant = consultants.find((consultant) => consultant.id === consultantId);
        const scopedConsultantIds = new Set(
          getCompanyScopedConsultants(consultants, tenantId).map((consultant) => consultant.id)
        );

        if (!currentProject || !currentConsultant) {
          return {
            ok: false,
            message: "No encontramos el proyecto o consultor seleccionado."
          };
        }

        if (currentProject.tenantId !== tenantId) {
          return {
            ok: false,
            message: "El proyecto seleccionado no pertenece a la empresa actual."
          };
        }

        if (!scopedConsultantIds.has(consultantId)) {
          return {
            ok: false,
            message: "El consultor seleccionado no pertenece a la empresa actual."
          };
        }

        if (currentConsultant.assignedProjectSlugs.includes(projectSlug)) {
          return {
            ok: false,
            message: "Este consultor ya esta asignado al proyecto."
          };
        }

        if (currentProject.assignedConsultants >= currentProject.consultantsRequired) {
          return {
            ok: false,
            message: "El proyecto ya cubre el numero de consultores requeridos."
          };
        }

        if (currentConsultant.availability === "unavailable") {
          return {
            ok: false,
            message: "El consultor seleccionado no esta disponible actualmente."
          };
        }

        let updatedProject: DashboardProjectRecord | undefined;
        let updatedConsultant: DashboardConsultantRecord | undefined;

        setProjects((currentProjects) =>
          currentProjects.map((project) => {
            if (project.slug !== projectSlug) {
              return project;
            }

            const nextAssignedCount = Math.min(
              project.consultantsRequired,
              project.assignedConsultants + 1
            );
            const nextStatus =
              nextAssignedCount >= project.consultantsRequired
                ? project.progress > 15
                  ? "in_progress"
                  : "approved"
                : project.rejectionCount >= 2
                  ? "approved"
                  : project.status;

            updatedProject = {
              ...project,
              assignedConsultants: nextAssignedCount,
              status: nextStatus,
              lastUpdate: "Ahora",
              timeline: [
                ...project.timeline,
                {
                  id: `${project.slug}-assignment-${nextAssignedCount}-${consultantId}`,
                  type: project.rejectionCount >= 2 ? "reassigned" : "assigned",
                  title:
                    project.rejectionCount >= 2
                      ? "Asignacion manual completada"
                      : "Consultor asignado",
                  description: `${currentConsultant.fullName} fue asignado por ${actorName} para reforzar el frente.`,
                  timestamp: "Ahora",
                  actor: actorName,
                  href: `${project.href}#assignment`
                }
              ]
            };

            return updatedProject;
          })
        );

        setConsultants((currentConsultants) =>
          currentConsultants.map((consultant) => {
            if (consultant.id !== consultantId) {
              return consultant;
            }

            const nextOccupancy = Math.min(100, consultant.occupancyPercent + 18);

            updatedConsultant = {
              ...consultant,
              occupancyPercent: nextOccupancy,
              availability: deriveAvailability(nextOccupancy),
              assignedProjectSlugs: [...consultant.assignedProjectSlugs, projectSlug]
            };

            return updatedConsultant;
          })
        );

        return {
          ok: true,
          message: `Consultor asignado correctamente a ${currentProject.name}.`,
          project: updatedProject,
          consultant: updatedConsultant
        };
      }
    }),
    [tenantId, consultants, isHydrated, projects]
  );

  return (
    <WorkspaceProjectsContext.Provider value={value}>
      {children}
    </WorkspaceProjectsContext.Provider>
  );
}

export function useWorkspaceProjects() {
  const context = useContext(WorkspaceProjectsContext);

  if (!context) {
    throw new Error("useWorkspaceProjects must be used within WorkspaceProjectsProvider.");
  }

  return context;
}
