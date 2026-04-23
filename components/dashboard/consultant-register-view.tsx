"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  type CreateConsultantInput,
  type DashboardConsultantAvailability
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type ConsultantRegisterViewProps = {
  session: SessionUser;
};

type AuthorizedConsultantSummary = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  specializationSummary: string | null;
  status: "PENDING_REGISTRATION" | "ACTIVE" | "DISABLED";
  accessCode: string | null;
  createdAt: string;
  disabledAt: string | null;
};

type ConsultantRegisterFormState = {
  fullName: string;
  email: string;
  specialty: string;
  availability: DashboardConsultantAvailability;
  professionalStatus: string;
  skills: string;
  deliveryCompliance: string;
  responseTimeMinutes: string;
  qualityScore: string;
  note: string;
};

const initialFormState: ConsultantRegisterFormState = {
  fullName: "",
  email: "",
  specialty: "",
  availability: "available",
  professionalStatus: "",
  skills: "",
  deliveryCompliance: "90",
  responseTimeMinutes: "20",
  qualityScore: "90",
  note: ""
};

export function ConsultantRegisterView({ session }: ConsultantRegisterViewProps) {
  const { consultants, createConsultant, projects, removeConsultant } = useWorkspaceProjects();
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [directoryConsultants, setDirectoryConsultants] = useState<AuthorizedConsultantSummary[]>(
    []
  );
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(true);
  const [deletingConsultantId, setDeletingConsultantId] = useState<string | null>(null);

  const leaderData = useMemo(() => getLeaderDashboardMock(session, projects), [projects, session]);
  const searchItems = useMemo(() => getLeaderDashboardSearchItems(leaderData), [leaderData]);

  useEffect(() => {
    if (session.role !== "LEADER") {
      return;
    }

    let ignore = false;

    async function loadConsultants() {
      setIsLoadingConsultants(true);

      try {
        const response = await fetch("/api/leader/consultants", {
          cache: "no-store"
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          if (!ignore) {
            setError(payload?.message ?? "No fue posible cargar los consultores de tu empresa.");
          }
          return;
        }

        if (!ignore) {
          setDirectoryConsultants(payload?.data ?? []);
        }
      } catch {
        if (!ignore) {
          setError("Ocurrio un error inesperado al cargar los consultores.");
        }
      } finally {
        if (!ignore) {
          setIsLoadingConsultants(false);
        }
      }
    }

    loadConsultants();

    return () => {
      ignore = true;
    };
  }, [session.role]);

  function updateField<Key extends keyof ConsultantRegisterFormState>(
    field: Key,
    value: ConsultantRegisterFormState[Key]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
    setSuccess(null);
  }

  function buildLocalConsultantInput(): CreateConsultantInput | null {
    const normalizedName = form.fullName.trim();
    const normalizedEmail = form.email.trim().toLowerCase();
    const parsedSkills = form.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const deliveryCompliance = Number(form.deliveryCompliance);
    const responseTimeMinutes = Number(form.responseTimeMinutes);
    const qualityScore = Number(form.qualityScore);

    if (!normalizedName || !normalizedEmail || !form.specialty.trim() || !parsedSkills.length) {
      setError("Completa nombre, correo, especialidad y al menos una habilidad.");
      return null;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Ingresa un correo valido para el consultor.");
      return null;
    }

    if (
      !Number.isFinite(deliveryCompliance) ||
      !Number.isFinite(responseTimeMinutes) ||
      !Number.isFinite(qualityScore)
    ) {
      setError("Los KPIs iniciales deben ser numericos.");
      return null;
    }

    return {
      fullName: normalizedName,
      email: normalizedEmail,
      specialty: form.specialty.trim(),
      availability: form.availability,
      professionalStatus:
        form.professionalStatus.trim() ||
        (form.availability === "available"
          ? "Disponible para nuevas asignaciones"
          : form.availability === "partial"
            ? "Disponible con carga parcial"
            : "No disponible temporalmente"),
      skills: parsedSkills,
      deliveryCompliance,
      responseTimeMinutes,
      qualityScore,
      note: form.note.trim()
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const input = buildLocalConsultantInput();

    if (!input) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/leader/consultants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: input.fullName,
          email: input.email,
          specializationSummary:
            form.note.trim() || `${input.specialty} | ${input.professionalStatus}`
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible autorizar al consultor.");
        return;
      }

      createConsultant(input);
      setDirectoryConsultants((current) => [payload.data, ...current]);
      setSuccess(
        `${input.fullName} quedo autorizado en la empresa y podra activar su cuenta desde register.`
      );
      setForm(initialFormState);
    } catch {
      setError("Ocurrio un error inesperado al autorizar al consultor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConsultant(consultant: AuthorizedConsultantSummary) {
    setError(null);
    setSuccess(null);
    setDeletingConsultantId(consultant.id);

    try {
      const response = await fetch(`/api/leader/consultants/${consultant.id}`, {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible actualizar el consultor.");
        return;
      }

      if (payload?.data?.strategy === "hard-delete") {
        setDirectoryConsultants((current) =>
          current.filter((currentConsultant) => currentConsultant.id !== consultant.id)
        );
        removeConsultant(consultant.email);
        setSuccess(`${consultant.fullName} fue eliminado antes de completar su registro.`);
        return;
      }

      setDirectoryConsultants((current) =>
        current.map((currentConsultant) =>
          currentConsultant.id === consultant.id
            ? {
                ...currentConsultant,
                status: "DISABLED",
                disabledAt: new Date().toISOString()
              }
            : currentConsultant
        )
      );
      removeConsultant(consultant.email);
      setSuccess(`${consultant.fullName} fue deshabilitado de forma segura.`);
    } catch {
      setError("Ocurrio un error inesperado al actualizar el consultor.");
    } finally {
      setDeletingConsultantId(null);
    }
  }

  if (session.role !== "LEADER") {
    return (
      <OperationsShell
        session={session}
        portalLabel={session.role}
        portalTitle="Alta de consultores"
        subtitle="Esta vista forma parte del flujo de coordinacion del lider."
        navItems={[{ label: "Volver al workspace", href: "/workspace", active: true }]}
        primaryActions={[{ label: "Ir al dashboard", href: "/workspace" }]}
        searchItems={searchItems}
      >
        <OperationsPanel
          description="Mantuvimos la ruta protegida, pero solo el portal LEADER puede registrar consultores."
          eyebrow="Acceso restringido"
          title="Sin permisos para continuar"
        >
          <Button asChild>
            <Link href="/workspace">Volver al dashboard</Link>
          </Button>
        </OperationsPanel>
      </OperationsShell>
    );
  }

  return (
    <OperationsShell
      session={session}
      portalLabel="LEADER"
      portalTitle="Alta de consultores"
      subtitle="Autoriza consultores internos con datos operativos iniciales y mantenlos visibles para matching, asignacion y seguimiento."
      navItems={[
        { label: "Resumen", href: "/workspace" },
        { label: "Equipo", href: "/workspace#leader-activity", badge: String(consultants.length) },
        { label: "Nuevo consultor", href: "/workspace/consultants/register", active: true }
      ]}
      primaryActions={[
        { label: "Volver al dashboard", href: "/workspace" },
        { label: "Crear proyecto", href: "/workspace/projects/create" }
      ]}
      headerActions={<LeaderNotifications notifications={leaderData.notifications} />}
      searchItems={searchItems}
    >
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <OperationsPanel
          description="La autorizacion deja al consultor en estado pendiente para que despues complete su registro y reciba accessCode automaticamente."
          eyebrow="Registro interno"
          title="Autorizar consultor"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200" htmlFor="consultant-full-name">
                  Nombre completo
                </Label>
                <Input
                  id="consultant-full-name"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Nombre del consultor"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="consultant-email">
                  Correo
                </Label>
                <Input
                  id="consultant-email"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="correo@empresa.com"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="consultant-specialty">
                  Especialidad principal
                </Label>
                <Input
                  id="consultant-specialty"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Ej. CRM y automatizacion"
                  value={form.specialty}
                  onChange={(event) => updateField("specialty", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200" htmlFor="consultant-skills">
                  Habilidades detectadas
                </Label>
                <Input
                  id="consultant-skills"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Ej. CRM, automatizacion, control ejecutivo"
                  value={form.skills}
                  onChange={(event) => updateField("skills", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="consultant-availability">
                  Disponibilidad
                </Label>
                <select
                  id="consultant-availability"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                  value={form.availability}
                  onChange={(event) =>
                    updateField(
                      "availability",
                      event.target.value as DashboardConsultantAvailability
                    )
                  }
                >
                  <option className="bg-slate-950" value="available">
                    Disponible
                  </option>
                  <option className="bg-slate-950" value="partial">
                    Parcial
                  </option>
                  <option className="bg-slate-950" value="unavailable">
                    No disponible
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="consultant-status">
                  Estado profesional
                </Label>
                <Input
                  id="consultant-status"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                  placeholder="Disponible para frentes criticos"
                  value={form.professionalStatus}
                  onChange={(event) => updateField("professionalStatus", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="consultant-kpi-delivery">
                  KPI cumplimiento
                </Label>
                <Input
                  id="consultant-kpi-delivery"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  inputMode="numeric"
                  max="100"
                  min="1"
                  type="number"
                  value={form.deliveryCompliance}
                  onChange={(event) => updateField("deliveryCompliance", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="consultant-kpi-response">
                  Respuesta (min)
                </Label>
                <Input
                  id="consultant-kpi-response"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  inputMode="numeric"
                  min="1"
                  type="number"
                  value={form.responseTimeMinutes}
                  onChange={(event) => updateField("responseTimeMinutes", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200" htmlFor="consultant-kpi-quality">
                  Score de calidad
                </Label>
                <Input
                  id="consultant-kpi-quality"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  inputMode="numeric"
                  max="100"
                  min="1"
                  type="number"
                  value={form.qualityScore}
                  onChange={(event) => updateField("qualityScore", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-200" htmlFor="consultant-note">
                  Nota operativa
                </Label>
                <textarea
                  id="consultant-note"
                  className="min-h-[110px] w-full rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
                  placeholder="Contexto inicial para liderazgo y matching."
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">
                {isSubmitting ? "Autorizando consultor..." : "Autorizar consultor"}
              </Button>
              <Button
                asChild
                className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                variant="secondary"
              >
                <Link href="/workspace">Cancelar</Link>
              </Button>
            </div>
          </form>
        </OperationsPanel>

        <OperationsPanel
          description="Los pendientes se pueden eliminar fisicamente. Los activos se deshabilitan para no perder trazabilidad ni relaciones historicas."
          eyebrow="Base autorizada"
          title="Consultores de la empresa"
        >
          <div className="space-y-4">
            {isLoadingConsultants ? (
              <p className="text-sm text-slate-400">Cargando consultores autorizados...</p>
            ) : directoryConsultants.length ? (
              directoryConsultants.map((consultant) => (
                <div
                  key={consultant.id}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-white">{consultant.fullName}</p>
                      <p className="text-sm text-slate-300">{consultant.email}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                        {consultant.status === "PENDING_REGISTRATION"
                          ? "Pendiente"
                          : consultant.status === "ACTIVE"
                            ? consultant.accessCode ?? "Activo"
                            : "Deshabilitado"}
                      </p>
                      {consultant.specializationSummary ? (
                        <p className="text-sm text-slate-400">{consultant.specializationSummary}</p>
                      ) : null}
                    </div>

                    <Button
                      className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                      type="button"
                      variant="secondary"
                      onClick={() => handleDeleteConsultant(consultant)}
                    >
                      {deletingConsultantId === consultant.id ? "Actualizando..." : "Eliminar"}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                Aun no hay consultores autorizados en esta empresa.
              </p>
            )}
          </div>
        </OperationsPanel>
      </section>
    </OperationsShell>
  );
}

