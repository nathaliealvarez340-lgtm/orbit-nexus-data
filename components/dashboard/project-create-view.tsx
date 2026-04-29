"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { LeaderNotifications } from "@/components/dashboard/leader-notifications";
import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { useWorkspaceProjects } from "@/components/dashboard/workspace-projects-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getLeaderDashboardMock,
  getLeaderDashboardSearchItems,
  type DashboardProjectPriority
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type ProjectCreateViewProps = {
  session: SessionUser;
};

type ProjectCreateFormState = {
  name: string;
  description: string;
  client: string;
  clientEmail: string;
  clientCompany: string;
  clientPhone: string;
  clientSector: string;
  clientNotes: string;
  consultantsRequired: string;
  startDate: string;
  endDate: string;
  priority: DashboardProjectPriority;
  projectType: string;
};

const initialFormState: ProjectCreateFormState = {
  name: "",
  description: "",
  client: "",
  clientEmail: "",
  clientCompany: "",
  clientPhone: "",
  clientSector: "",
  clientNotes: "",
  consultantsRequired: "1",
  startDate: "",
  endDate: "",
  priority: "MEDIUM",
  projectType: ""
};

export function ProjectCreateView({ session }: ProjectCreateViewProps) {
  const router = useRouter();
  const { createProject, projects } = useWorkspaceProjects();
  const [form, setForm] = useState(initialFormState);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaderData = useMemo(() => getLeaderDashboardMock(session, projects), [projects, session]);
  const searchItems = useMemo(() => getLeaderDashboardSearchItems(leaderData), [leaderData]);

  function updateField<Key extends keyof ProjectCreateFormState>(
    field: Key,
    value: ProjectCreateFormState[Key]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (session.role !== "LEADER") {
      setError("Solo el portal LEADER puede crear proyectos en esta fase.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.client.trim() ||
      !form.clientEmail.trim() ||
      !form.startDate ||
      !form.endDate ||
      !form.consultantsRequired
    ) {
      setError("Completa todos los campos obligatorios para crear el proyecto.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("La fecha estimada de entrega no puede ser anterior a la fecha de inicio.");
      return;
    }

    const consultantsRequired = Number(form.consultantsRequired);

    if (!Number.isFinite(consultantsRequired) || consultantsRequired < 1) {
      setError("Indica al menos un consultor requerido.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail.trim())) {
      setError("Ingresa un correo valido para el cliente.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    void (async () => {
      try {
        const response = await fetch("/api/leader/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            clientName: form.client.trim(),
            clientEmail: form.clientEmail.trim(),
            clientCompany: form.clientCompany.trim() || undefined,
            clientPhone: form.clientPhone.trim() || undefined,
            clientSector: form.clientSector.trim() || undefined,
            clientNotes: form.clientNotes.trim() || undefined,
            startDate: form.startDate,
            endDate: form.endDate,
            priority: form.priority
          })
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          setError(payload?.message ?? "No fue posible crear el proyecto.");
          return;
        }

        const nextProject = createProject(
          {
            name: form.name,
            description: form.description,
            client: form.client,
            clientEmail: form.clientEmail,
            clientCompany: form.clientCompany,
            clientPhone: form.clientPhone,
            clientSector: form.clientSector,
            clientNotes: form.clientNotes,
            consultantsRequired,
            startDate: form.startDate,
            endDate: form.endDate,
            priority: form.priority,
            projectType: form.projectType,
            attachments,
            folio: payload?.data?.folio
          },
          session.fullName
        );

        router.push(nextProject.href as Route);
      } catch {
        setError("Ocurrio un error inesperado al crear el proyecto.");
      } finally {
        setIsSubmitting(false);
      }
    })();
  }

  if (session.role !== "LEADER") {
    return (
      <OperationsShell
        session={session}
        portalLabel={session.role}
        portalTitle="Creacion de proyectos"
        subtitle="Esta vista forma parte del flujo del lider. Tu sesion sigue protegida, pero esta accion no esta disponible para tu rol."
        navItems={[
          { label: "Volver al workspace", href: "/workspace", active: true }
        ]}
        primaryActions={[{ label: "Ir al dashboard", href: "/workspace" }]}
        searchItems={searchItems}
      >
        <OperationsPanel
          description="Mantuvimos la ruta protegida y visible, pero el alta de proyectos solo existe para el portal LEADER."
          eyebrow="Acceso restringido"
          title="Sin permisos para crear proyectos"
        >
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/workspace">Volver al dashboard</Link>
            </Button>
          </div>
        </OperationsPanel>
      </OperationsShell>
    );
  }

  return (
    <OperationsShell
      session={session}
      portalLabel="LEADER"
      portalTitle="Creacion de proyectos"
      subtitle="Activa nuevos frentes operativos con la misma lectura ejecutiva del dashboard principal y deja el proyecto listo para seguimiento real."
      navItems={[
        { label: "Resumen", href: "/workspace" },
        { label: "Proyectos", href: "/workspace#leader-projects", badge: String(leaderData.recentProjects.length) },
        {
          label: "Intervencion",
          href: "/workspace#leader-intervention",
          badge: String(leaderData.interventionProjects.length)
        },
        { label: "Nuevo proyecto", href: "/workspace/projects/create", active: true }
      ]}
      primaryActions={[{ label: "Volver al dashboard", href: "/workspace" }]}
      headerActions={<LeaderNotifications notifications={leaderData.notifications} />}
      searchItems={searchItems}
    >
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <OperationsPanel
          description="Completa la informacion minima del frente, genera el folio unico y deja el proyecto listo para seguimiento y asignacion."
          eyebrow="Alta operativa"
          title="Nuevo proyecto"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200" htmlFor="project-name">
                  Nombre del proyecto
                </Label>
                <Input
                  id="project-name"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Ej. Reordenamiento logistico metropolitano"
                  value={form.name}
                  onChange={(event) => {
                    updateField("name", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200" htmlFor="project-description">
                  Descripcion breve
                </Label>
                <textarea
                  id="project-description"
                  className="min-h-[120px] w-full rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                  placeholder="Describe alcance, problema de negocio y objetivo principal del proyecto."
                  value={form.description}
                  onChange={(event) => {
                    updateField("description", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-client">
                  Cliente
                </Label>
                <Input
                  id="project-client"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Ej. Nova Holding"
                  value={form.client}
                  onChange={(event) => {
                    updateField("client", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-client-email">
                  Correo del cliente
                </Label>
                <Input
                  id="project-client-email"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="cliente@empresa.com"
                  type="email"
                  value={form.clientEmail}
                  onChange={(event) => {
                    updateField("clientEmail", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-client-company">
                  Empresa del cliente
                </Label>
                <Input
                  id="project-client-company"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Ej. Nova Holding"
                  value={form.clientCompany}
                  onChange={(event) => {
                    updateField("clientCompany", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-client-phone">
                  Telefono del cliente
                </Label>
                <Input
                  id="project-client-phone"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Opcional"
                  value={form.clientPhone}
                  onChange={(event) => {
                    updateField("clientPhone", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-client-sector">
                  Sector del cliente
                </Label>
                <Input
                  id="project-client-sector"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Opcional"
                  value={form.clientSector}
                  onChange={(event) => {
                    updateField("clientSector", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-consultants">
                  Consultores requeridos
                </Label>
                <Input
                  id="project-consultants"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  inputMode="numeric"
                  min="1"
                  type="number"
                  value={form.consultantsRequired}
                  onChange={(event) => {
                    updateField("consultantsRequired", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-start-date">
                  Fecha de inicio
                </Label>
                <Input
                  id="project-start-date"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => {
                    updateField("startDate", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-end-date">
                  Fecha estimada de entrega
                </Label>
                <Input
                  id="project-end-date"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => {
                    updateField("endDate", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-priority">
                  Prioridad
                </Label>
                <select
                  id="project-priority"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                  value={form.priority}
                  onChange={(event) => {
                    updateField("priority", event.target.value as DashboardProjectPriority);
                  }}
                >
                  <option className="bg-slate-950" value="HIGH">
                    Alta
                  </option>
                  <option className="bg-slate-950" value="MEDIUM">
                    Media
                  </option>
                  <option className="bg-slate-950" value="LOW">
                    Baja
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="project-type">
                  Tipo de proyecto
                </Label>
                <Input
                  id="project-type"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Opcional"
                  value={form.projectType}
                  onChange={(event) => {
                    updateField("projectType", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200" htmlFor="project-client-notes">
                  Notas del cliente
                </Label>
                <textarea
                  id="project-client-notes"
                  className="min-h-[110px] w-full rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                  placeholder="Contexto relevante, observaciones o restricciones del cliente."
                  value={form.clientNotes}
                  onChange={(event) => {
                    updateField("clientNotes", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200" htmlFor="project-files">
                  Upload de archivos (mock)
                </Label>
                <Input
                  id="project-files"
                  className="cursor-pointer rounded-2xl border-white/10 bg-white/[0.04] text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-cyan-200"
                  multiple
                  type="file"
                  onChange={(event) => {
                    const nextFiles = Array.from(event.target.files ?? []).map((file) => file.name);
                    setAttachments(nextFiles);
                  }}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">{isSubmitting ? "Creando proyecto..." : "Crear proyecto"}</Button>
              <Button asChild className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]" variant="secondary">
                <Link href="/workspace">Cancelar</Link>
              </Button>
            </div>
          </form>
        </OperationsPanel>

        <OperationsPanel
          description="El folio se genera automaticamente y el proyecto queda listo para detalle, alertas y futuras conexiones reales de backend."
          eyebrow="Vista previa"
          title="Lo que va a suceder"
        >
          <div className="space-y-4 text-sm leading-6 text-slate-400">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Folio
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                Se genera al hacer click en Crear proyecto
              </p>
              <p className="mt-2">
                El folio unico aparece despues del alta y queda guardado en el detalle del proyecto.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Estado inicial
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Aprobado</p>
              <p className="mt-2">
                El proyecto queda listo para abrir detalle, revisar timeline y continuar con asignacion de consultores.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Archivos mock
              </p>
              {attachments.length ? (
                <ul className="mt-3 space-y-2">
                  {attachments.map((attachment) => (
                    <li key={attachment} className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white/90">
                      {attachment}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">Todavia no hay archivos seleccionados.</p>
              )}
            </div>
          </div>
        </OperationsPanel>
      </section>
    </OperationsShell>
  );
}
