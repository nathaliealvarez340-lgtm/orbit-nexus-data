"use client";

import { useEffect, useMemo, useState } from "react";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanySummary } from "@/lib/services/admin/company-management";
import type { SessionUser } from "@/types/auth";

type SuperadminDashboardProps = {
  session: SessionUser;
  companies: CompanySummary[];
};

type CompanyFormState = {
  name: string;
  slug: string;
  codePrefix: string;
  registrationCode: string;
};

type AuthorizedLeaderRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  accessCode: string | null;
  createdAt: string;
  importedFromDirectory: boolean;
  disabledAt: string | null;
};

type LeaderAuthorizationFormState = {
  companyId: string;
  fullName: string;
  email: string;
  phone: string;
};

const initialFormState: CompanyFormState = {
  name: "",
  slug: "",
  codePrefix: "",
  registrationCode: ""
};

const initialLeaderAuthorizationState: LeaderAuthorizationFormState = {
  companyId: "",
  fullName: "",
  email: "",
  phone: ""
};

export function SuperadminDashboard({
  session,
  companies: initialCompanies
}: SuperadminDashboardProps) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rotatingCompanyId, setRotatingCompanyId] = useState<string | null>(null);
  const [leaderForm, setLeaderForm] = useState<LeaderAuthorizationFormState>({
    ...initialLeaderAuthorizationState,
    companyId: initialCompanies[0]?.id ?? ""
  });
  const [authorizedLeaders, setAuthorizedLeaders] = useState<AuthorizedLeaderRecord[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const [isAuthorizingLeader, setIsAuthorizingLeader] = useState(false);

  const searchItems = useMemo(
    () =>
      companies.map((company) => ({
        id: company.id,
        type: "user" as const,
        title: company.name,
        subtitle: `${company.codePrefix} | ${company.projectCount} proyectos`,
        href: "#superadmin-companies",
        keywords: [company.name, company.slug, company.codePrefix, company.registrationCode]
      })),
    [companies]
  );

  const metrics = [
    {
      label: "Empresas activas",
      value: String(companies.filter((company) => company.isActive).length),
      detail: "Tenants listos para operar con aislamiento real."
    },
    {
      label: "Lideres activos",
      value: String(companies.reduce((total, company) => total + company.leaderCount, 0)),
      detail: "Cuentas lider activas dentro de la plataforma."
    },
    {
      label: "Consultores activos",
      value: String(companies.reduce((total, company) => total + company.consultantCount, 0)),
      detail: "Capacidad operativa visible por empresa."
    },
    {
      label: "Proyectos activos",
      value: String(companies.reduce((total, company) => total + company.activeProjectCount, 0)),
      detail: "Proyectos en seguimiento operativo hoy."
    }
  ];

  useEffect(() => {
    if (!leaderForm.companyId) {
      setAuthorizedLeaders([]);
      return;
    }

    let isMounted = true;
    setIsLoadingLeaders(true);

    fetch(`/api/admin/companies/${leaderForm.companyId}/leaders`)
      .then(async (response) => {
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "No fue posible cargar los lideres autorizados.");
        }

        if (isMounted) {
          setAuthorizedLeaders(payload?.data ?? []);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No fue posible cargar los lideres autorizados."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLeaders(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [leaderForm.companyId]);

  async function handleCreateCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible registrar la empresa.");
        return;
      }

      setCompanies((current) => [...current, payload.data]);
      setSuccess(`Empresa ${payload.data.name} creada correctamente.`);
      setForm(initialFormState);
      setLeaderForm((current) => ({
        ...current,
        companyId: current.companyId || payload.data.id
      }));
    } catch {
      setError("Ocurrio un error inesperado al registrar la empresa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRotateRegistrationCode(companyId: string) {
    setError(null);
    setSuccess(null);
    setRotatingCompanyId(companyId);

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/registration-code`, {
        method: "PATCH"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible actualizar el codigo maestro.");
        return;
      }

      setCompanies((current) =>
        current.map((company) =>
          company.id === companyId
            ? {
                ...company,
                registrationCode: payload.data.registrationCode
              }
            : company
        )
      );
      setSuccess("Codigo maestro actualizado correctamente.");
    } catch {
      setError("Ocurrio un error inesperado al actualizar el codigo maestro.");
    } finally {
      setRotatingCompanyId(null);
    }
  }

  async function handleAuthorizeLeader(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isAuthorizingLeader || !leaderForm.companyId) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsAuthorizingLeader(true);

    try {
      const response = await fetch(`/api/admin/companies/${leaderForm.companyId}/leaders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: leaderForm.fullName,
          email: leaderForm.email,
          phone: leaderForm.phone
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible autorizar al lider.");
        return;
      }

      setAuthorizedLeaders((current) => [...current, payload.data]);
      setSuccess("Lider autorizado correctamente para completar su registro.");
      setLeaderForm((current) => ({
        ...current,
        fullName: "",
        email: "",
        phone: ""
      }));
    } catch {
      setError("Ocurrio un error inesperado al autorizar al lider.");
    } finally {
      setIsAuthorizingLeader(false);
    }
  }

  return (
    <OperationsShell
      session={session}
      portalLabel="SUPERADMIN"
      portalTitle="Administracion global"
      subtitle="Administra empresas, codigos maestros y estado general de la plataforma sin entrar a la operacion de un tenant especifico."
      navItems={[
        { label: "Resumen", href: "#superadmin-overview", active: true },
        { label: "Empresas", href: "#superadmin-companies", badge: String(companies.length) },
        { label: "Nueva empresa", href: "#superadmin-create" }
      ]}
      primaryActions={[{ label: "Actualizar empresas", href: "/workspace" }]}
      searchItems={searchItems}
    >
      <section id="superadmin-overview" className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <OperationsPanel
            key={metric.label}
            className="bg-slate-950/84"
            description={metric.detail}
            eyebrow="Plataforma"
            title={metric.label}
          >
            <p className="text-3xl font-semibold text-white">{metric.value}</p>
          </OperationsPanel>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div id="superadmin-create">
        <OperationsPanel
          className="bg-slate-950/84"
          description="Crea un tenant nuevo, define su prefijo y deja listo su codigo maestro para el registro de lideres."
          eyebrow="Nueva empresa"
          title="Registrar empresa"
        >
          <form className="space-y-5" onSubmit={handleCreateCompany}>
            <div className="space-y-2">
              <Label className="text-slate-200" htmlFor="company-name">
                Nombre
              </Label>
              <Input
                id="company-name"
                className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="company-slug">
                  Slug
                </Label>
                <Input
                  id="company-slug"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  placeholder="maia"
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="company-code-prefix">
                  Prefijo
                </Label>
                <Input
                  id="company-code-prefix"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  placeholder="NT"
                  value={form.codePrefix}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, codePrefix: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200" htmlFor="company-registration-code">
                Codigo maestro de lideres
              </Label>
              <Input
                id="company-registration-code"
                className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                placeholder="Se genera automaticamente si lo dejas vacio"
                value={form.registrationCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    registrationCode: event.target.value
                  }))
                }
              />
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

            <Button type="submit">
              {isSubmitting ? "Registrando empresa..." : "Registrar empresa"}
            </Button>
          </form>
        </OperationsPanel>
        </div>

        <div id="superadmin-companies">
        <OperationsPanel
          className="bg-slate-950/84"
          description="Cada empresa mantiene su companyId, su codigo maestro y su prefijo de access codes sin mezclarse con otros tenants."
          eyebrow="Empresas"
          title="Empresas registradas"
        >
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-white">{company.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                      {company.codePrefix} | {company.slug}
                    </p>
                    <p className="text-sm text-slate-300">
                      Codigo maestro:{" "}
                      <span className="font-semibold text-white">
                        {company.registrationCode}
                      </span>
                    </p>
                  </div>

                  <Button
                    className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                    type="button"
                    variant="secondary"
                    onClick={() => handleRotateRegistrationCode(company.id)}
                  >
                    {rotatingCompanyId === company.id
                      ? "Actualizando..."
                      : "Generar nuevo codigo"}
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lideres</p>
                    <p className="mt-2 text-xl font-semibold text-white">{company.leaderCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Consultores</p>
                    <p className="mt-2 text-xl font-semibold text-white">{company.consultantCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Clientes</p>
                    <p className="mt-2 text-xl font-semibold text-white">{company.clientCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Proyectos activos</p>
                    <p className="mt-2 text-xl font-semibold text-white">{company.activeProjectCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </OperationsPanel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <OperationsPanel
            className="bg-slate-950/84"
            description="Preautoriza lideres por empresa para que despues completen su registro con el codigo maestro del tenant."
            eyebrow="Usuarios autorizados"
            title="Autorizar lider"
          >
            <form className="space-y-5" onSubmit={handleAuthorizeLeader}>
              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="leader-company">
                  Empresa
                </Label>
                <select
                  id="leader-company"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                  value={leaderForm.companyId}
                  onChange={(event) =>
                    setLeaderForm((current) => ({ ...current, companyId: event.target.value }))
                  }
                >
                  <option value="" disabled>
                    Selecciona una empresa
                  </option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="leader-name">
                  Nombre completo
                </Label>
                <Input
                  id="leader-name"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  value={leaderForm.fullName}
                  onChange={(event) =>
                    setLeaderForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="leader-email">
                  Correo
                </Label>
                <Input
                  id="leader-email"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  value={leaderForm.email}
                  onChange={(event) =>
                    setLeaderForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="leader-phone">
                  Telefono
                </Label>
                <Input
                  id="leader-phone"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  value={leaderForm.phone}
                  onChange={(event) =>
                    setLeaderForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>

              <Button type="submit">
                {isAuthorizingLeader ? "Autorizando..." : "Autorizar lider"}
              </Button>
            </form>
          </OperationsPanel>
        </div>

        <div>
          <OperationsPanel
            className="bg-slate-950/84"
            description="Revisa que cada lider pendiente quede asociado al tenant correcto antes de compartir el codigo maestro."
            eyebrow="Lideres autorizados"
            title="Base de lideres por empresa"
          >
            {isLoadingLeaders ? (
              <p className="text-sm text-slate-400">Cargando lideres autorizados...</p>
            ) : authorizedLeaders.length === 0 ? (
              <p className="text-sm text-slate-400">
                Aun no hay lideres autorizados para la empresa seleccionada.
              </p>
            ) : (
              <div className="space-y-3">
                {authorizedLeaders.map((leader) => (
                  <div
                    key={leader.id}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{leader.fullName}</p>
                        <p className="mt-1 text-sm text-slate-300">{leader.email}</p>
                        {leader.phone ? (
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                            {leader.phone}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                          {leader.status}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {leader.accessCode ?? "Pendiente de registro"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </OperationsPanel>
        </div>
      </section>
    </OperationsShell>
  );
}
