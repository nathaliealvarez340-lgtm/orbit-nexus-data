"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo } from "react";

import { LeaderNotifications } from "@/components/dashboard/leader-notifications";
import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { OperationsStatCard } from "@/components/dashboard/operations-stat-card";
import { useWorkspaceProjects } from "@/components/dashboard/workspace-projects-provider";
import { Button } from "@/components/ui/button";
import {
  getClientDashboardMock,
  getClientDashboardSearchItems,
  getConsultantDashboardMock,
  getConsultantDashboardSearchItems,
  getLeaderDashboardMock,
  getLeaderDashboardSearchItems,
  requiresManualAssignment
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type ActionDetailViewProps = {
  session: SessionUser;
  actionSlug: string;
  projectSlug?: string;
};

type ActionDefinition = {
  eyebrow: string;
  title: string;
  summary: string;
  primaryLabel: string;
  checklist: string[];
};

function getContextActionHref(actionSlug: string, projectHref?: string): Route {
  if (!projectHref) {
    return "/workspace" as Route;
  }

  if (actionSlug === "asignar-consultor") {
    return `${projectHref}#assignment` as Route;
  }

  if (actionSlug === "atender-alerta") {
    return `${projectHref}#risks` as Route;
  }

  if (actionSlug === "abrir-historial") {
    return `${projectHref}#history` as Route;
  }

  return projectHref as Route;
}

function getContextActionLabel(actionSlug: string) {
  if (actionSlug === "asignar-consultor") {
    return "Abrir asignacion";
  }

  if (actionSlug === "atender-alerta") {
    return "Ver alertas";
  }

  if (actionSlug === "abrir-historial") {
    return "Ver historial";
  }

  return "Abrir proyecto";
}

function getPortalLabel(role: SessionUser["role"]) {
  if (role === "LEADER") {
    return "LEADER";
  }

  if (role === "CONSULTANT") {
    return "CONSULTANT";
  }

  if (role === "CLIENT") {
    return "CLIENT";
  }

  return role;
}

function getActionDefinition(actionSlug: string): ActionDefinition {
  const catalog: Record<string, ActionDefinition> = {
    "asignar-consultor": {
      eyebrow: "Asignacion manual",
      title: "Coordina la reasignacion del proyecto",
      summary:
        "Esta accion queda disponible cuando el proyecto ya no puede continuar por matching automatico y el lider debe intervenir.",
      primaryLabel: "Asignar consultor",
      checklist: [
        "Confirmar capacidad real del consultor disponible.",
        "Revisar el historial de rechazos y el motivo operativo.",
        "Cerrar la reasignacion dejando trazabilidad en el timeline."
      ]
    },
    "atender-alerta": {
      eyebrow: "Riesgo operativo",
      title: "Resolver la alerta abierta del proyecto",
      summary:
        "Usa esta vista para revisar el frente en riesgo, decidir prioridad y activar seguimiento con el equipo.",
      primaryLabel: "Ver alertas",
      checklist: [
        "Revisar la causa del riesgo y el ultimo evento registrado.",
        "Confirmar al responsable y la siguiente decision requerida.",
        "Dejar seguimiento visible para el lider y el consultor."
      ]
    },
    "reportar-avance": {
      eyebrow: "Seguimiento",
      title: "Preparar el siguiente avance",
      summary:
        "Estructura el reporte para mantener trazabilidad de entregables, comentarios y aprobaciones.",
      primaryLabel: "Reportar avance",
      checklist: [
        "Consolidar hallazgos y entregables del periodo.",
        "Validar observaciones del lider antes de enviar.",
        "Subir el avance con fecha y contexto claro."
      ]
    },
    "subir-entregable": {
      eyebrow: "Entrega",
      title: "Cargar entregable del proyecto",
      summary:
        "Esta accion deja la estructura lista para conectar upload real de archivos en la siguiente iteracion.",
      primaryLabel: "Subir entregable",
      checklist: [
        "Confirmar version final del documento.",
        "Validar nombre del archivo y comentarios activos.",
        "Notificar al lider y al cliente cuando aplique."
      ]
    },
    "validar-entregable": {
      eyebrow: "Validacion",
      title: "Confirmar entregable y comentarios",
      summary:
        "Centraliza la revision del cliente y la devolucion de comentarios sobre un entregable puntual.",
      primaryLabel: "Validar entregable",
      checklist: [
        "Revisar el documento y la trazabilidad mas reciente.",
        "Confirmar si hay observaciones abiertas o aprobacion final.",
        "Actualizar el estado para que el equipo vea el siguiente paso."
      ]
    },
    "revisar-avance": {
      eyebrow: "Revision",
      title: "Analizar el avance reportado",
      summary:
        "Pantalla de trabajo intermedia para revisar contenido, riesgo y comentarios antes de validar.",
      primaryLabel: "Revisar avance",
      checklist: [
        "Validar el contenido del avance y los KPI involucrados.",
        "Confirmar si existen comentarios pendientes del lider o cliente.",
        "Decidir si el avance se aprueba, comenta o corrige."
      ]
    }
  };

  return (
    catalog[actionSlug] ?? {
      eyebrow: "Flujo operativo",
      title: "Accion disponible en el workspace",
      summary:
        "Esta ruta queda lista para reemplazar el mock por la logica real del proceso sin romper la navegacion actual.",
      primaryLabel: "Continuar",
      checklist: [
        "Revisar el contexto relacionado.",
        "Confirmar responsables y siguiente paso.",
        "Persistir el cambio cuando el backend real este disponible."
      ]
    }
  );
}

export function ActionDetailView({ session, actionSlug, projectSlug }: ActionDetailViewProps) {
  const { getProject, projects } = useWorkspaceProjects();
  const leaderData = useMemo(() => getLeaderDashboardMock(session, projects), [projects, session]);

  const searchItems = useMemo(() => {
    if (session.role === "LEADER") {
      return getLeaderDashboardSearchItems(leaderData);
    }

    if (session.role === "CONSULTANT") {
      return getConsultantDashboardSearchItems(getConsultantDashboardMock(session));
    }

    return getClientDashboardSearchItems(getClientDashboardMock(session));
  }, [leaderData, session]);

  const definition = getActionDefinition(actionSlug);
  const fallbackProject =
    (projectSlug ? getProject(projectSlug) : undefined) ??
    projects.find((project) => requiresManualAssignment(project)) ??
    projects.find((project) => project.status === "at_risk" || project.status === "escalated") ??
    projects[0];
  const contextActionHref = getContextActionHref(actionSlug, fallbackProject?.href);
  const contextActionLabel = getContextActionLabel(actionSlug);

  return (
    <OperationsShell
      session={session}
      portalLabel={getPortalLabel(session.role)}
      portalTitle={definition.eyebrow}
      subtitle={definition.summary}
      navItems={[
        { label: "Workspace", href: "/workspace" },
        { label: "Acciones", href: `/workspace/actions/${actionSlug}`, active: true }
      ]}
      primaryActions={[
        { label: "Volver al dashboard", href: "/workspace" },
        fallbackProject
          ? {
              label: contextActionLabel,
              href: contextActionHref
            }
          : {
              label: "Seguir operando",
              href: "/workspace"
            }
      ]}
      headerActions={
        session.role === "LEADER" ? <LeaderNotifications notifications={leaderData.notifications} /> : undefined
      }
      searchItems={searchItems}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OperationsStatCard
          detail="Ruta preparada para convertirse en un proceso real sin cambiar la navegacion del workspace."
          label="Estado del flujo"
          tone="blue"
          value="Mock activo"
        />
        <OperationsStatCard
          detail="Cada accion ya puede enlazarse con un proyecto concreto dentro del estado local."
          label="Proyecto relacionado"
          tone="emerald"
          value={fallbackProject ? fallbackProject.folio : "Sin contexto"}
        />
        <OperationsStatCard
          detail="La misma shell y topbar del dashboard se reutilizan en esta vista."
          label="UI unificada"
          tone="slate"
          value="100%"
        />
        <OperationsStatCard
          detail="Listo para conectar backend real, formularios y persistencia posterior."
          label="Escalabilidad"
          tone="amber"
          value="Preparado"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <OperationsPanel
          description="Resumen del flujo actual y del resultado esperado antes de conectar logica real."
          eyebrow={definition.eyebrow}
          title={definition.title}
        >
          <div className="space-y-4 text-sm leading-6 text-slate-400">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-base font-semibold text-white">Resumen</p>
              <p className="mt-2">{definition.summary}</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-base font-semibold text-white">Checklist sugerida</p>
              <ul className="mt-3 space-y-2 text-slate-300">
                {definition.checklist.map((item) => (
                  <li key={item} className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </OperationsPanel>

        <OperationsPanel
          description="Contexto del proyecto mas cercano a esta accion para mantener continuidad visual y operativa."
          eyebrow="Contexto"
          title="Proyecto relacionado"
        >
          {fallbackProject ? (
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-400">
                <p className="text-base font-semibold text-white">{fallbackProject.name}</p>
                <p className="mt-2">
                  {fallbackProject.folio} | {fallbackProject.client}
                </p>
                <p className="mt-2">{fallbackProject.description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={fallbackProject.href as Route}>Abrir proyecto</Link>
                </Button>
                {requiresManualAssignment(fallbackProject) ? (
                  <Button asChild className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]" variant="secondary">
                    <Link href={`${fallbackProject.href}#assignment` as Route}>Asignar consultor</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-400">
              No encontramos un proyecto vinculado a esta accion todavia.
            </div>
          )}
        </OperationsPanel>
      </section>
    </OperationsShell>
  );
}