"use client";

import Link from "next/link";
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
  type CreateConsultantInput,
  type DashboardConsultantAvailability
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type ConsultantRegisterViewProps = {
  session: SessionUser;
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
  const { consultants, createConsultant, projects } = useWorkspaceProjects();
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaderData = useMemo(() => getLeaderDashboardMock(session, projects), [projects, session]);
  const searchItems = useMemo(() => getLeaderDashboardSearchItems(leaderData), [leaderData]);

  function updateField<Key extends keyof ConsultantRegisterFormState>(
    field: Key,
    value: ConsultantRegisterFormState[Key]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function buildInput(): CreateConsultantInput | null {
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

    if (
      deliveryCompliance < 1 ||
      deliveryCompliance > 100 ||
      qualityScore < 1 ||
      qualityScore > 100 ||
      responseTimeMinutes < 1
    ) {
      setError("Valida los rangos de KPIs antes de registrar al consultor.");
      return null;
    }

    if (
      consultants.some((consultant) => consultant.email?.toLowerCase() === normalizedEmail)
    ) {
      setError("Ya existe un consultor registrado con ese correo.");
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (session.role !== "LEADER") {
      setError("Solo el portal LEADER puede registrar consultores.");
      return;
    }

    const input = buildInput();

    if (!input) {
      return;
    }

    setIsSubmitting(true);
    createConsultant(input);
    setCreatedName(input.fullName);
    setForm(initialFormState);
    setIsSubmitting(false);
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
      subtitle="Registra nuevos consultores internos con skills, disponibilidad y KPIs iniciales para dejarlos listos para matching y asignacion."
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
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <OperationsPanel
          description="Completa solo la informacion operativa que despues alimenta matching, visibilidad y asignacion."
          eyebrow="Registro interno"
          title="Nuevo consultor"
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
                  Cumplimiento inicial
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
                  Tiempo de respuesta
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

              <div className="space-y-2">
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

            {createdName ? (
              <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {createdName} ya forma parte de la base interna y esta listo para ser considerado en asignaciones.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">
                {isSubmitting ? "Registrando consultor..." : "Registrar consultor"}
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
          description="Esta alta no toca auth ni el flujo de Fase 1. Solo deja el perfil listo para matching, KPIs y asignacion interna."
          eyebrow="Lectura operativa"
          title="Que sucede al registrar"
        >
          <div className="space-y-4 text-sm leading-6 text-slate-400">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Matching listo
              </p>
              <p className="mt-2 text-white">
                Skills, disponibilidad, carga y KPIs quedan listos para scoring interno.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Visible para liderazgo
              </p>
              <p className="mt-2 text-white">
                El consultor aparece en la base interna del tenant y en pantallas de asignacion.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Tenant-ready
              </p>
              <p className="mt-2 text-white">
                El registro se guarda dentro de la empresa actual y no se mezcla con otros tenants.
              </p>
            </div>
          </div>
        </OperationsPanel>
      </section>
    </OperationsShell>
  );
}
