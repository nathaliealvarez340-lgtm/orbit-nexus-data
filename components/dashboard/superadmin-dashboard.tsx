"use client";

import { Copy, RotateCw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  ActivationRequestSummary,
  CompanySummary,
  SuperadminOverview
} from "@/lib/services/admin/company-management";
import type { SessionUser } from "@/types/auth";

type SuperadminDashboardProps = {
  session: SessionUser;
  companies: CompanySummary[];
  overview: SuperadminOverview;
  activationRequests: ActivationRequestSummary[];
};

type CompanyFormState = {
  name: string;
  slug: string;
  codePrefix: string;
  registrationCode: string;
  sector: string;
  contactName: string;
  contactEmail: string;
  subscriptionPlan: "" | "CORE" | "GROWTH" | "ENTERPRISE";
  includedUsers: string;
  extraUsers: string;
  monthlyAmountMxn: string;
  initialStatus: "ACTIVE" | "PENDING";
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
  registrationCode: "",
  sector: "",
  contactName: "",
  contactEmail: "",
  subscriptionPlan: "",
  includedUsers: "20",
  extraUsers: "0",
  monthlyAmountMxn: "",
  initialStatus: "ACTIVE"
};

const initialLeaderAuthorizationState: LeaderAuthorizationFormState = {
  companyId: "",
  fullName: "",
  email: "",
  phone: ""
};

function formatCurrency(value: number | null) {
  if (typeof value !== "number") {
    return "Manual";
  }

  return `$${value.toLocaleString("es-MX")}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Pendiente";
  }

  return new Date(value).toLocaleDateString("es-MX");
}

export function SuperadminDashboard({
  session,
  companies: initialCompanies,
  overview: initialOverview,
  activationRequests: initialActivationRequests
}: SuperadminDashboardProps) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [overview, setOverview] = useState(initialOverview);
  const [activationRequests] = useState(initialActivationRequests);
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rotatingCompanyId, setRotatingCompanyId] = useState<string | null>(null);
  const [copyingCodeId, setCopyingCodeId] = useState<string | null>(null);
  const [leaderForm, setLeaderForm] = useState<LeaderAuthorizationFormState>({
    ...initialLeaderAuthorizationState,
    companyId: initialCompanies[0]?.id ?? ""
  });
  const [authorizedLeaders, setAuthorizedLeaders] = useState<AuthorizedLeaderRecord[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const [isAuthorizingLeader, setIsAuthorizingLeader] = useState(false);
  const [removingLeaderId, setRemovingLeaderId] = useState<string | null>(null);

  const searchItems = useMemo(
    () =>
      companies.map((company) => ({
        id: company.id,
        type: "user" as const,
        title: company.name,
        subtitle: `${company.codePrefix} | ${company.projectCount} proyectos`,
        href: "#superadmin-companies",
        keywords: [
          company.name,
          company.slug,
          company.codePrefix,
          company.registrationCode,
          company.contactEmail ?? "",
          company.subscriptionPlan ?? ""
        ]
      })),
    [companies]
  );

  const metrics = [
    {
      label: "Empresas registradas",
      value: String(overview.totalCompanies),
      detail: "Tenants dados de alta en la plataforma."
    },
    {
      label: "Empresas activas",
      value: String(overview.activeCompanies),
      detail: "Empresas listas para operar hoy."
    },
    {
      label: "Empresas pendientes",
      value: String(overview.pendingCompanies),
      detail: "Altas manuales o activaciones pendientes."
    },
    {
      label: "Suscripciones activas",
      value: String(overview.activeSubscriptions),
      detail: "Cobros activos sincronizados con la capa comercial."
    },
    {
      label: "Enterprise review",
      value: String(overview.enterpriseReviews),
      detail: "Solicitudes manuales o enterprise en revisión."
    },
    {
      label: "Lideres autorizados",
      value: String(overview.authorizedLeaders),
      detail: "Lideres globales autorizados por empresa."
    },
    {
      label: "Consultores autorizados",
      value: String(overview.authorizedConsultants),
      detail: "Consultores activos o pendientes a nivel plataforma."
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
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          codePrefix: form.codePrefix || undefined,
          registrationCode: form.registrationCode || undefined,
          sector: form.sector || undefined,
          contactName: form.contactName || undefined,
          contactEmail: form.contactEmail || undefined,
          subscriptionPlan: form.subscriptionPlan || undefined,
          includedUsers: Number(form.includedUsers || 0),
          extraUsers: Number(form.extraUsers || 0),
          monthlyAmountMxn: form.monthlyAmountMxn ? Number(form.monthlyAmountMxn) : undefined,
          initialStatus: form.initialStatus
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible registrar la empresa.");
        return;
      }

      setCompanies((current) => [...current, payload.data]);
      setOverview((current) => ({
        ...current,
        totalCompanies: current.totalCompanies + 1,
        activeCompanies:
          form.initialStatus === "ACTIVE" ? current.activeCompanies + 1 : current.activeCompanies,
        pendingCompanies:
          form.initialStatus === "PENDING"
            ? current.pendingCompanies + 1
            : current.pendingCompanies,
        activeSubscriptions:
          form.initialStatus === "ACTIVE"
            ? current.activeSubscriptions + 1
            : current.activeSubscriptions
      }));
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

  async function handleCopyCode(companyId: string, code: string) {
    try {
      setCopyingCodeId(companyId);
      await navigator.clipboard.writeText(code);
      setSuccess("Codigo maestro copiado correctamente.");
    } catch {
      setError("No fue posible copiar el codigo maestro.");
    } finally {
      setCopyingCodeId(null);
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
      setOverview((current) => ({
        ...current,
        authorizedLeaders: current.authorizedLeaders + 1
      }));
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

  async function handleRemoveLeader(leaderId: string) {
    if (removingLeaderId) {
      return;
    }

    setError(null);
    setSuccess(null);
    setRemovingLeaderId(leaderId);

    try {
      const response = await fetch(`/api/admin/companies/${leaderForm.companyId}/leaders`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          leaderId
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible actualizar el lider.");
        return;
      }

      setAuthorizedLeaders((current) =>
        payload?.data?.mode === "deleted"
          ? current.filter((leader) => leader.id !== leaderId)
          : current.map((leader) =>
              leader.id === leaderId
                ? {
                    ...leader,
                    status: "DISABLED",
                    disabledAt: new Date().toISOString()
                  }
                : leader
            )
      );
      setOverview((current) => ({
        ...current,
        authorizedLeaders: Math.max(current.authorizedLeaders - 1, 0)
      }));
      setSuccess(payload?.message ?? "Lider actualizado correctamente.");
    } catch {
      setError("Ocurrio un error inesperado al actualizar el lider.");
    } finally {
      setRemovingLeaderId(null);
    }
  }

  return (
    <OperationsShell
      session={session}
      portalLabel="SUPERADMIN"
      portalTitle="Administracion global"
      subtitle="Administra empresas, altas comerciales, codigos maestros y acceso de lideres sin entrar a la operacion de un tenant especifico."
      navItems={[
        { label: "Resumen", href: "#superadmin-overview", active: true },
        { label: "Empresas", href: "#superadmin-companies", badge: String(companies.length) },
        { label: "Suscripciones", href: "#superadmin-subscriptions" },
        { label: "Nueva empresa", href: "#superadmin-create" }
      ]}
      primaryActions={[{ label: "Ir al resumen", href: "/workspace" }]}
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div id="superadmin-subscriptions">
          <OperationsPanel
            className="bg-slate-950/84"
            description="Visibilidad ejecutiva sobre activaciones recientes, solicitudes enterprise y empresas creadas desde la capa comercial."
            eyebrow="Nuevas empresas suscritas"
            title="Activaciones recientes"
          >
            <div className="space-y-4">
              {activationRequests.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Aun no hay activaciones comerciales registradas.
                </p>
              ) : (
                activationRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">{request.companyName}</p>
                        <p className="text-sm text-slate-300">{request.contactEmail}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">
                          {request.plan}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCurrency(request.totalAmountMxn)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                          {request.status}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">
                      Empresa activada:{" "}
                      <span className="font-semibold text-white">
                        {request.activatedCompanyName ?? "Pendiente de creación"}
                      </span>
                      {request.registrationCode ? (
                        <>
                          {" · "}Código maestro:{" "}
                          <span className="font-semibold text-white">{request.registrationCode}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </OperationsPanel>
        </div>

        <div id="superadmin-companies">
          <OperationsPanel
            className="bg-slate-950/84"
            description="Cada empresa mantiene su companyId, su codigo fijo para lideres y su capa comercial aislada del resto de tenants."
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
                        Sector: <span className="font-semibold text-white">{company.sector ?? "No asignado"}</span>
                      </p>
                      <p className="text-sm text-slate-300">
                        Contacto:{" "}
                        <span className="font-semibold text-white">
                          {company.contactName ?? "No asignado"}
                        </span>
                        {" · "}
                        <span className="font-semibold text-white">
                          {company.contactEmail ?? "Sin correo"}
                        </span>
                      </p>
                      <p className="text-sm text-slate-300">
                        Codigo fijo / registro actual:{" "}
                        <span className="font-semibold text-white">{company.registrationCode}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                        type="button"
                        variant="secondary"
                        onClick={() => handleCopyCode(company.id, company.registrationCode)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copyingCodeId === company.id ? "Copiando..." : "Copiar codigo"}
                      </Button>
                      <Button
                        className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                        type="button"
                        variant="secondary"
                        onClick={() => handleRotateRegistrationCode(company.id)}
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        {rotatingCompanyId === company.id ? "Actualizando..." : "Rotar codigo"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Plan</p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {company.subscriptionPlan ?? "Manual"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Usuarios</p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {company.includedUsers + company.extraUsers}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Monto mensual</p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {formatCurrency(company.monthlyAmountMxn)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Billing status</p>
                      <p className="mt-2 text-xl font-semibold text-white">{company.billingStatus}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-4">
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
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Activada</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatDate(company.activatedAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </OperationsPanel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div id="superadmin-create">
          <OperationsPanel
            className="bg-slate-950/84"
            description="Registra una empresa manualmente, define su estado inicial y deja listo su codigo fijo para el registro de lideres."
            eyebrow="Nueva empresa"
            title="Registrar empresa manualmente"
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
                    value={form.codePrefix}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, codePrefix: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="company-sector">
                    Sector
                  </Label>
                  <Input
                    id="company-sector"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                    value={form.sector}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, sector: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="company-contact-name">
                    Contacto
                  </Label>
                  <Input
                    id="company-contact-name"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                    value={form.contactName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, contactName: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="company-contact-email">
                  Correo de contacto
                </Label>
                <Input
                  id="company-contact-email"
                  className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contactEmail: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="company-registration-code">
                  Codigo fijo de lideres
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="company-plan">
                    Plan
                  </Label>
                  <select
                    id="company-plan"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                    value={form.subscriptionPlan}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subscriptionPlan: event.target.value as CompanyFormState["subscriptionPlan"]
                      }))
                    }
                  >
                    <option value="">Sin plan definido</option>
                    <option value="CORE">CORE</option>
                    <option value="GROWTH">GROWTH</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="company-status">
                    Estado inicial
                  </Label>
                  <select
                    id="company-status"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                    value={form.initialStatus}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        initialStatus: event.target.value as CompanyFormState["initialStatus"]
                      }))
                    }
                  >
                    <option value="ACTIVE">Activa</option>
                    <option value="PENDING">Pendiente</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="company-included-users">
                    Usuarios incluidos
                  </Label>
                  <Input
                    id="company-included-users"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                    type="number"
                    value={form.includedUsers}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, includedUsers: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="company-extra-users">
                    Usuarios extra
                  </Label>
                  <Input
                    id="company-extra-users"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                    type="number"
                    value={form.extraUsers}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, extraUsers: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="company-monthly-amount">
                    Monto mensual
                  </Label>
                  <Input
                    id="company-monthly-amount"
                    className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                    type="number"
                    value={form.monthlyAmountMxn}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, monthlyAmountMxn: event.target.value }))
                    }
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

              <Button type="submit">
                {isSubmitting ? "Registrando empresa..." : "Registrar empresa"}
              </Button>
            </form>
          </OperationsPanel>
        </div>

        <div>
          <OperationsPanel
            className="bg-slate-950/84"
            description="Preautoriza lideres por empresa, revisa su estado actual y aplica baja segura sin mezclar tenants."
            eyebrow="Lideres por empresa"
            title="Autorizacion y control de lideres"
          >
            <div className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
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

              <div>
                {isLoadingLeaders ? (
                  <p className="text-sm text-slate-400">Cargando lideres autorizados...</p>
                ) : authorizedLeaders.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Aun no hay lideres autorizados para la empresa seleccionada.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {authorizedLeaders.map((leader) => {
                      const isPending = leader.status === "PENDING_REGISTRATION";
                      const isDisabled = leader.status === "DISABLED";

                      return (
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

                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-right">
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                                  {leader.status}
                                </p>
                                <p className="mt-2 text-sm text-slate-300">
                                  {leader.accessCode ?? "Pendiente de registro"}
                                </p>
                              </div>

                              {!isDisabled ? (
                                <Button
                                  className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                                  size="sm"
                                  type="button"
                                  variant="secondary"
                                  onClick={() => handleRemoveLeader(leader.id)}
                                >
                                  {removingLeaderId === leader.id ? (
                                    "Actualizando..."
                                  ) : (
                                    <>
                                      {isPending ? (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                      ) : (
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                      )}
                                      {isPending ? "Eliminar" : "Desactivar"}
                                    </>
                                  )}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </OperationsPanel>
        </div>
      </section>
    </OperationsShell>
  );
}
