"use client";

import { ArrowRight, ChevronLeft, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CORE_EXTRA_USER_MXN,
  CORE_INCLUDED_USERS,
  CORE_MAX_EXTRA_USERS,
  buildQuoteSummary
} from "@/lib/commercial/plans";
import { ORBIT_BACKGROUND_VIDEO_URL } from "@/lib/ui/background-media";

type CompanyPlan = "CORE" | "GROWTH" | "ENTERPRISE";
type ActivationStep = "hero" | "plans";

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
  const [step, setStep] = useState<ActivationStep>("hero");
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

  function openActivation() {
    setOpen(true);
    setStep("hero");
  }

  function closeActivation() {
    setOpen(false);
    setStep("hero");
    setError(null);
    setManualReviewMessage(null);
    setIsSubmitting(false);
  }

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
        onClick={openActivation}
      >
        Activa tu empresa
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source src={ORBIT_BACKGROUND_VIDEO_URL} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,15,30,0.34),rgba(3,8,20,0.86))]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,11,27,0.58),rgba(7,19,40,0.74))]" />
            <div className="absolute inset-0 bg-slate-950/58 backdrop-blur-md" onClick={closeActivation} />
          </div>

          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 md:px-6 md:py-8">
            <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/[0.14] bg-slate-950/36 shadow-[0_34px_110px_rgba(2,6,23,0.52)] backdrop-blur-[24px]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_28%,transparent_74%,rgba(93,224,230,0.08))]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <div className="absolute -right-28 top-[-120px] h-80 w-80 rounded-full bg-[#5de0e6]/10 blur-3xl" />
              <div className="absolute -left-24 bottom-[-160px] h-96 w-96 rounded-full bg-[#004aad]/14 blur-3xl" />

              <div className="relative z-10 flex items-center justify-between px-6 py-5 md:px-8 md:py-6">
                <div className="flex items-center gap-3 text-slate-300">
                  {step === "plans" ? (
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm font-medium transition hover:bg-white/[0.08] hover:text-white"
                      type="button"
                      onClick={() => setStep("hero")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Volver
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      Activacion comercial
                    </div>
                  )}
                </div>

                <button
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
                  type="button"
                  onClick={closeActivation}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {step === "hero" ? (
                <section className="grid min-h-[720px] items-center gap-10 px-6 pb-10 pt-4 md:px-10 md:pb-12 lg:grid-cols-[1.08fr_0.92fr] lg:px-12">
                  <div className="mx-auto max-w-3xl space-y-7 text-center lg:mx-0 lg:text-left">
                    <div className="space-y-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                        Activa tu empresa
                      </p>
                      <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-white md:text-5xl xl:text-6xl">
                        Convierte la complejidad operativa en una ventaja competitiva.
                      </h2>
                      <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                        Orbit Nexus centraliza acceso, operacion y trazabilidad en una sola
                        arquitectura empresarial.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button
                        className="h-12 rounded-full bg-gradient-to-r from-[#5de0e6] to-[#004aad] px-7 text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] hover:opacity-95"
                        size="lg"
                        type="button"
                        onClick={() => setStep("plans")}
                      >
                        Ver planes
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
                    {planCards.map((card) => {
                      const isCore = card.plan === "CORE";

                      return (
                        <article
                          key={card.plan}
                          className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_20px_60px_rgba(2,6,23,0.22)] backdrop-blur-[18px] ${
                            isCore
                              ? "border-cyan-400/30 bg-[linear-gradient(135deg,rgba(11,22,46,0.88),rgba(8,28,54,0.76))]"
                              : "border-white/10 bg-white/[0.06]"
                          }`}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_40%,transparent_72%,rgba(93,224,230,0.10))]" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-lg font-semibold text-white">{card.label}</p>
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                  isCore
                                    ? "border border-cyan-400/25 bg-cyan-500/12 text-cyan-200"
                                    : "border border-white/10 bg-white/[0.08] text-slate-300"
                                }`}
                              >
                                {card.highlight}
                              </span>
                            </div>
                            <p className="mt-4 text-2xl font-semibold text-white">{card.price}</p>
                            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                              {card.bullets.map((bullet) => (
                                <p key={bullet}>{bullet}</p>
                              ))}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <section className="max-h-[calc(100vh-104px)] overflow-y-auto px-6 pb-10 pt-2 md:px-8 md:pb-12">
                  <div className="mx-auto max-w-6xl space-y-8">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                        Activa tu empresa
                      </p>
                      <h2 className="max-w-4xl text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                        Convierte la complejidad operativa en una ventaja competitiva.
                      </h2>
                      <p className="max-w-3xl text-base leading-7 text-slate-300">
                        Selecciona el plan que mejor encaja con tu operacion y cotiza la activacion
                        mensual de Orbit Nexus sin salir de la plataforma.
                      </p>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-3">
                      {planCards.map((card) => {
                        const selected = form.plan === card.plan;
                        const isCore = card.plan === "CORE";

                        return (
                          <button
                            key={card.plan}
                            className={`group relative overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-200 ${
                              selected
                                ? "border-cyan-400/35 bg-[linear-gradient(135deg,rgba(9,25,48,0.92),rgba(6,31,57,0.82))] shadow-[0_26px_60px_rgba(8,145,178,0.18)]"
                                : "border-white/10 bg-white/[0.05] shadow-[0_18px_50px_rgba(2,6,23,0.18)] hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.08]"
                            } ${isCore ? "xl:scale-[1.015]" : ""}`}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                plan: card.plan,
                                extraUsers: card.plan === "CORE" ? current.extraUsers : 0
                              }))
                            }
                          >
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_36%,transparent_72%,rgba(93,224,230,0.10))] opacity-70 transition-opacity duration-200 group-hover:opacity-100" />
                            <div className="relative z-10">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-lg font-semibold text-white">{card.label}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                                    {isCore ? "Core operativo" : card.highlight}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                    isCore
                                      ? "border border-cyan-400/25 bg-cyan-500/12 text-cyan-200"
                                      : "border border-white/10 bg-white/[0.08] text-slate-300"
                                  }`}
                                >
                                  {card.highlight}
                                </span>
                              </div>
                              <p className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white">
                                {card.price}
                              </p>
                              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                                {card.bullets.map((bullet) => (
                                  <p key={bullet}>{bullet}</p>
                                ))}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
                      <div className="space-y-5">
                        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.18)] backdrop-blur-[18px]">
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_44%,transparent_74%,rgba(93,224,230,0.08))]" />
                          <div className="relative z-10">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                                  Cotizacion activa
                                </p>
                                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
                                  {formatCurrency(quote.totalAmountMxn)}
                                  <span className="ml-2 text-sm font-medium text-slate-400">
                                    / mes
                                  </span>
                                </p>
                              </div>
                              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/72 px-5 py-4 text-right">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                                  Usuarios
                                </p>
                                <p className="mt-2 text-xl font-semibold text-white">
                                  {quote.totalUsers}
                                </p>
                              </div>
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-3">
                              <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/72 px-4 py-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                  Incluidos
                                </p>
                                <p className="mt-2 text-lg font-semibold text-white">
                                  {CORE_INCLUDED_USERS}
                                </p>
                              </div>
                              <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/72 px-4 py-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                  Extras
                                </p>
                                <p className="mt-2 text-lg font-semibold text-white">
                                  {quote.extraUsers} · {formatCurrency(quote.extraAmountMxn)}
                                </p>
                              </div>
                              <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/72 px-4 py-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                  Base
                                </p>
                                <p className="mt-2 text-lg font-semibold text-white">
                                  {formatCurrency(quote.baseAmountMxn)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[1.85rem] border border-white/10 bg-slate-950/64 px-6 py-5 text-sm leading-7 text-slate-300 backdrop-blur-[18px]">
                          {quote.checkoutEnabled
                            ? "Tu suscripcion mensual se procesara con Stripe Checkout y la empresa se activara automaticamente cuando Stripe confirme el pago."
                            : "El plan Enterprise requiere validacion comercial para definir capacidad, precio y fecha de activacion."}
                        </div>
                      </div>

                      <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.18)] backdrop-blur-[18px]">
                        <form className="space-y-5" onSubmit={handleSubmit}>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                              Cotiza tu plataforma
                            </p>
                            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                              Configura la activacion mensual
                            </h3>
                          </div>

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
                                  setForm((current) => ({
                                    ...current,
                                    fullName: event.target.value
                                  }))
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
                                  setForm((current) => ({
                                    ...current,
                                    email: event.target.value
                                  }))
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
                                setForm((current) => ({
                                  ...current,
                                  companyName: event.target.value
                                }))
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
                                setForm((current) => ({
                                  ...current,
                                  sector: event.target.value
                                }))
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
                        </form>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
