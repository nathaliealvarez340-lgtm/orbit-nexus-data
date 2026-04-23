"use client";

import { CompanyPlan } from "@prisma/client";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CORE_BASE_MXN,
  CORE_EXTRA_USER_MXN,
  CORE_INCLUDED_USERS,
  CORE_MAX_EXTRA_USERS,
  GROWTH_MONTHLY_MXN,
  buildQuoteSummary
} from "@/lib/commercial/plans";

const planCards = [
  {
    plan: "CORE" as const,
    label: "Core",
    highlight: "Mas elegido",
    price: "$5,200 MXN / mes",
    bullets: [
      "Incluye hasta 20 usuarios sin costo adicional",
      "Expande tu equipo por $299 por usuario",
      "Maximo 10 usuarios extra"
    ]
  },
  {
    plan: "GROWTH" as const,
    label: "Growth",
    highlight: "Hasta 50 usuarios",
    price: "$12,900 MXN / mes",
    bullets: [
      "Capacidad operativa ampliada",
      "Ideal para empresas con varias celulas",
      "Suscripcion mensual estable"
    ]
  },
  {
    plan: "ENTERPRISE" as const,
    label: "Enterprise",
    highlight: "Precio personalizado",
    price: "Cotizacion guiada",
    bullets: [
      "Mas de 50 usuarios",
      "Implementacion asistida",
      "Requiere validacion comercial"
    ]
  }
];

type FormState = {
  fullName: string;
  email: string;
  companyName: string;
  sector: string;
  plan: CompanyPlan;
  extraUsers: number;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  companyName: "",
  sector: "",
  plan: "CORE",
  extraUsers: 0
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

export function CompanyActivationCta() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualReviewMessage, setManualReviewMessage] = useState<string | null>(null);

  const quote = useMemo(
    () =>
      buildQuoteSummary({
        plan: form.plan,
        extraUsers: form.plan === "CORE" ? form.extraUsers : 0
      }),
    [form.extraUsers, form.plan]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setManualReviewMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          companyName: form.companyName,
          sector: form.sector,
          plan: form.plan,
          extraUsers: form.plan === "CORE" ? form.extraUsers : 0
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible iniciar la activacion.");
        return;
      }

      if (payload?.data?.mode === "manual-review") {
        setManualReviewMessage(
          "Recibimos tu solicitud Enterprise. Nuestro equipo comercial te contactara para cerrar una propuesta personalizada."
        );
        return;
      }

      if (payload?.data?.checkoutUrl) {
        window.location.href = payload.data.checkoutUrl;
        return;
      }

      setError("No fue posible redirigir al checkout de Stripe.");
    } catch {
      setError("Ocurrio un error inesperado al generar la activacion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        className="bg-gradient-to-r from-[#5de0e6] to-[#004aad] text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] hover:opacity-95"
        size="lg"
        type="button"
        onClick={() => setOpen(true)}
      >
        Activa tu empresa
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-slate-950/72 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/88 shadow-[0_28px_80px_rgba(2,6,23,0.46)] backdrop-blur-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-8 py-7">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  Activa tu empresa
                </p>
                <div className="origin-left animate-[fade-in_220ms_ease-out] space-y-2">
                  <h2 className="text-4xl font-semibold tracking-tight text-white">
                    Opera tu empresa con control total desde el dia uno.
                  </h2>
                  <p className="text-lg text-slate-300">Cotiza tu plataforma</p>
                </div>
              </div>

              <button
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
                type="button"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid max-h-[calc(92vh-104px)] gap-0 overflow-y-auto xl:grid-cols-[1.05fr_0.95fr]">
              <section className="border-r border-white/10 px-8 py-7">
                <div className="grid gap-4 xl:grid-cols-3">
                  {planCards.map((card) => {
                    const selected = form.plan === card.plan;

                    return (
                      <button
                        key={card.plan}
                        className={`rounded-[1.7rem] border px-5 py-5 text-left transition-all duration-200 ${
                          selected
                            ? "border-cyan-400/35 bg-gradient-to-br from-cyan-500/14 via-slate-950/86 to-blue-500/18 shadow-[0_22px_52px_rgba(8,145,178,0.18)]"
                            : "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.06]"
                        }`}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            plan: card.plan,
                            extraUsers: card.plan === "CORE" ? current.extraUsers : 0
                          }))
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-lg font-semibold text-white">{card.label}</p>
                          <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                            {card.highlight}
                          </span>
                        </div>
                        <p className="mt-4 text-2xl font-semibold text-white">{card.price}</p>
                        <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                          {card.bullets.map((bullet) => (
                            <p key={bullet}>{bullet}</p>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/[0.04] px-6 py-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Cotizacion activa</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {formatCurrency(quote.totalAmountMxn)}
                        <span className="ml-2 text-sm font-medium text-slate-400">/ mes</span>
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Usuarios</p>
                      <p className="mt-2 text-xl font-semibold text-white">{quote.totalUsers}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/70 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Incluidos</p>
                      <p className="mt-2 text-lg font-semibold text-white">{CORE_INCLUDED_USERS}</p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/70 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Extras</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {quote.extraUsers} · {formatCurrency(quote.extraAmountMxn)}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/70 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Base</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatCurrency(quote.baseAmountMxn)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="px-8 py-7">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-200" htmlFor="activation-full-name">
                        Nombre completo
                      </Label>
                      <Input
                        id="activation-full-name"
                        className="h-11 rounded-2xl border-white/12 bg-white/[0.05] text-white placeholder:text-slate-500"
                        value={form.fullName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, fullName: event.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200" htmlFor="activation-email">
                        Correo
                      </Label>
                      <Input
                        id="activation-email"
                        className="h-11 rounded-2xl border-white/12 bg-white/[0.05] text-white placeholder:text-slate-500"
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, email: event.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200" htmlFor="activation-company">
                      Empresa
                    </Label>
                    <Input
                      id="activation-company"
                      className="h-11 rounded-2xl border-white/12 bg-white/[0.05] text-white placeholder:text-slate-500"
                      value={form.companyName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, companyName: event.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200" htmlFor="activation-sector">
                      Sector
                    </Label>
                    <Input
                      id="activation-sector"
                      className="h-11 rounded-2xl border-white/12 bg-white/[0.05] text-white placeholder:text-slate-500"
                      value={form.sector}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, sector: event.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Usuarios incluidos</Label>
                      <div className="flex h-11 items-center rounded-2xl border border-white/12 bg-white/[0.05] px-4 text-sm font-medium text-white">
                        {form.plan === "GROWTH" ? 50 : CORE_INCLUDED_USERS}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200" htmlFor="activation-extra-users">
                        Usuarios extra
                      </Label>
                      <input
                        id="activation-extra-users"
                        className="h-11 w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                        disabled={form.plan !== "CORE"}
                        max={CORE_MAX_EXTRA_USERS}
                        min={0}
                        type="range"
                        value={form.plan === "CORE" ? form.extraUsers : 0}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            extraUsers: Number(event.target.value)
                          }))
                        }
                      />
                      <p className="text-xs text-slate-400">
                        {form.plan === "CORE"
                          ? `${form.extraUsers} usuarios extra · ${formatCurrency(
                              form.extraUsers * CORE_EXTRA_USER_MXN
                            )}`
                          : form.plan === "GROWTH"
                            ? "Growth ya contempla hasta 50 usuarios."
                            : "Enterprise se cotiza de forma personalizada."}
                      </p>
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                      {error}
                    </div>
                  ) : null}

                  {manualReviewMessage ? (
                    <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {manualReviewMessage}
                    </div>
                  ) : null}

                  <Button className="w-full" size="lg" type="submit">
                    {isSubmitting
                      ? "Preparando activacion..."
                      : quote.checkoutEnabled
                        ? "Continuar con activacion"
                        : "Solicitar activacion enterprise"}
                  </Button>

                  <p className="text-xs leading-6 text-slate-500">
                    {quote.checkoutEnabled
                      ? "Tu suscripcion mensual se procesara con Stripe Checkout y la empresa se activara automaticamente cuando Stripe confirme el pago."
                      : "El plan Enterprise requiere validacion comercial para definir capacidad, precio y fecha de activacion."}
                  </p>
                </form>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
