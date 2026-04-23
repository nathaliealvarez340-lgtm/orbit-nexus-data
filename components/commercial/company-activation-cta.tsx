"use client";

import { ArrowRight, ChevronLeft, Sparkles, Star, TrendingUp, X, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
type ActivationStep = "hero" | "plans" | "billing";

const planCards = [
  {
    plan: "CORE" as const,
    label: "Core",
    highlight: "Mas elegido",
    subtitle: "Base operativa",
    price: "$5,200 MXN / mes",
    bullets: [
      "Reduce hasta 30% el desorden operativo en las primeras semanas",
      "Centraliza 100% de accesos y usuarios en una sola plataforma",
      "Visibilidad completa de actividad en tiempo real",
      "Implementación funcional en menos de 7 días",
      "Base lista para escalar sin rediseñar procesos"
    ]
  },
  {
    plan: "GROWTH" as const,
    label: "Growth",
    highlight: "IDEAL PARA EQUIPOS",
    subtitle: "Impulsa tu crecimiento",
    price: "$12,900 MXN / mes",
    bullets: [
      "Aumenta hasta 40% la eficiencia operativa entre equipos",
      "Coordinación centralizada de múltiples áreas en tiempo real",
      "Reduce cuellos de botella en procesos críticos",
      "Automatiza flujos clave para crecer sin fricción",
      "Soporta operaciones de hasta 50 usuarios activos sin pérdida de control"
    ]
  },
  {
    plan: "ENTERPRISE" as const,
    label: "Enterprise",
    highlight: "HECHO PARA TU OPERACION",
    subtitle: "SOLUCION EMPRESARIAL",
    price: "Implementación estratégica",
    bullets: [
      "Arquitectura diseñada específicamente para tu operación",
      "Integración con sistemas internos existentes",
      "Control avanzado sobre procesos críticos de negocio",
      "Soporte dedicado en implementación y evolución",
      "Escalabilidad sin límites estructurales"
    ]
  }
];

const planIcons = {
  CORE: Zap,
  GROWTH: TrendingUp,
  ENTERPRISE: Star
} as const;

const planAccentClasses = {
  CORE: {
    icon: "text-[#22D3EE] drop-shadow-[0_0_16px_rgba(34,211,238,0.28)]",
    badge: "border border-cyan-400/25 bg-cyan-500/12 text-cyan-200"
  },
  GROWTH: {
    icon: "text-[#60A5FA] drop-shadow-[0_0_16px_rgba(96,165,250,0.28)]",
    badge: "border border-sky-400/20 bg-sky-500/10 text-sky-200"
  },
  ENTERPRISE: {
    icon: "text-[#A78BFA] drop-shadow-[0_0_16px_rgba(167,139,250,0.28)]",
    badge: "border border-violet-400/20 bg-violet-500/10 text-violet-200"
  }
} as const;

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
  const [countdownComplete, setCountdownComplete] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualReviewMessage, setManualReviewMessage] = useState<string | null>(null);

  const plansRef = useRef<HTMLDivElement | null>(null);
  const billingRef = useRef<HTMLDivElement | null>(null);

  const quote = useMemo(
    () =>
      buildQuoteSummary({
        plan: form.plan,
        extraUsers: form.plan === "CORE" || form.plan === "GROWTH" ? form.extraUsers : 0
      }),
    [form.extraUsers, form.plan]
  );

  const selectedPlan = useMemo(
    () => planCards.find((card) => card.plan === form.plan) ?? planCards[0],
    [form.plan]
  );

  useEffect(() => {
    if (!open || step !== "hero" || countdownComplete) {
      return;
    }

    if (secondsLeft <= 0) {
      setCountdownComplete(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdownComplete, open, secondsLeft, step]);

  useEffect(() => {
    if (step === "plans") {
      window.setTimeout(() => {
        plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }

    if (step === "billing") {
      window.setTimeout(() => {
        billingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [step]);

  function openActivation() {
    setOpen(true);
    setStep("hero");
    setCountdownComplete(false);
    setSecondsLeft(4);
    setError(null);
    setManualReviewMessage(null);
    setIsSubmitting(false);
  }

  function closeActivation() {
    setOpen(false);
    setStep("hero");
    setCountdownComplete(false);
    setSecondsLeft(4);
    setError(null);
    setManualReviewMessage(null);
    setIsSubmitting(false);
  }

  function handleShowPlans() {
    if (!countdownComplete) {
      return;
    }

    setStep("plans");
  }

  function handleContinueFromPlans() {
    setStep("billing");
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
          extraUsers: form.plan === "CORE" || form.plan === "GROWTH" ? form.extraUsers : 0
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
              className="absolute inset-0 h-full w-full object-cover saturate-[1.08] contrast-[1.06]"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source src={ORBIT_BACKGROUND_VIDEO_URL} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,15,30,0.16),rgba(3,8,20,0.76))]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,11,27,0.34),rgba(7,19,40,0.58))]" />
            <div className="absolute inset-0 bg-slate-950/34 backdrop-blur-[2px]" onClick={closeActivation} />
          </div>

          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 md:px-6 md:py-8">
            <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/[0.14] bg-slate-950/34 shadow-[0_34px_110px_rgba(2,6,23,0.52)] backdrop-blur-[20px]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_28%,transparent_74%,rgba(93,224,230,0.06))]" />
              <div className="absolute -right-28 top-[-120px] h-80 w-80 rounded-full bg-[#5de0e6]/10 blur-3xl" />
              <div className="absolute -left-24 bottom-[-160px] h-96 w-96 rounded-full bg-[#004aad]/14 blur-3xl" />

              <div className="relative z-10 flex items-center justify-between px-6 py-5 md:px-8 md:py-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Activacion comercial
                </div>

                <button
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
                  type="button"
                  onClick={closeActivation}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <section className="max-h-[calc(100vh-104px)] overflow-y-auto px-6 pb-10 pt-2 md:px-8 md:pb-12">
                <div className="mx-auto max-w-6xl space-y-8">
                  {step === "hero" ? (
                    <div className="flex min-h-[720px] items-center justify-center">
                      <div className="mx-auto max-w-5xl space-y-10 text-center">
                        <div className="space-y-6">
                          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                            ACTIVA TU EMPRESA
                          </p>

                          <div className="relative mx-auto min-h-[154px] max-w-4xl md:min-h-[184px]">
                            <h2
                              className={`text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-white transition-all duration-500 md:text-5xl xl:text-6xl ${
                                countdownComplete
                                  ? "pointer-events-none -translate-y-3 opacity-0"
                                  : "translate-y-0 opacity-100"
                              }`}
                            >
                              Más control. Menos caos.
                              <br />
                              Tu empresa,{" "}
                              <span className="bg-gradient-to-r from-[#5de0e6] via-[#3ab8ff] to-[#004aad] bg-clip-text text-transparent">
                                en modo órbita
                              </span>
                              . 🚀
                            </h2>

                            <h2
                              className={`absolute inset-0 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-white transition-all duration-500 md:text-5xl xl:text-6xl ${
                                countdownComplete
                                  ? "translate-y-0 opacity-100"
                                  : "pointer-events-none translate-y-3 opacity-0"
                              }`}
                            >
                              Estás a un paso de operar como empresa de alto nivel.
                            </h2>
                          </div>

                          <p className="mx-auto max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                            Una sola plataforma para operar, crecer y tomar decisiones con claridad.
                            <br className="hidden md:block" />
                            Centraliza todo. Automatiza lo importante. Escala sin límites.
                          </p>
                        </div>

                        <div className="space-y-3 text-center">
                          <p className="text-sm font-medium text-slate-300">Descubre cómo en:</p>
                          <div className="text-5xl font-semibold tracking-[0.18em] text-cyan-300 drop-shadow-[0_0_22px_rgba(93,224,230,0.32)] animate-pulse md:text-6xl">
                            {`00:0${Math.max(secondsLeft, 0)}`}
                          </div>
                        </div>

                        <div>
                          <Button
                            aria-disabled={!countdownComplete}
                            className={`h-12 rounded-full bg-gradient-to-r from-[#5de0e6] to-[#004aad] px-7 text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] transition-all duration-300 ${
                              countdownComplete
                                ? "scale-100 hover:scale-[1.02] hover:shadow-[0_22px_52px_rgba(0,74,173,0.42)]"
                                : "cursor-not-allowed opacity-60"
                            }`}
                            disabled={!countdownComplete}
                            size="lg"
                            type="button"
                            onClick={handleShowPlans}
                          >
                            {countdownComplete ? "Ver planes ahora →" : "Ver planes"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === "plans" ? (
                    <div ref={plansRef} className="space-y-8 pt-4">
                      <div className="space-y-3 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                          Paso 2 · Seleccion de plan
                        </p>
                        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                          Elige la capacidad operativa que mejor encaja con tu empresa.
                        </h2>
                      </div>

                      <div className="grid gap-5 xl:grid-cols-3">
                        {planCards.map((card) => {
                          const selected = form.plan === card.plan;
                          const isCore = card.plan === "CORE";
                          const PlanIcon = planIcons[card.plan];
                          const accents = planAccentClasses[card.plan];

                          return (
                            <button
                              key={card.plan}
                              className={`group relative overflow-hidden rounded-[2rem] border p-6 text-left transition-all duration-200 ${
                                selected
                                  ? "border-sky-400/35 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(99,102,241,0.2))] shadow-[0_26px_60px_rgba(99,102,241,0.18)]"
                                  : "border-white/10 bg-white/[0.05] shadow-[0_18px_50px_rgba(2,6,23,0.18)] hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.08]"
                              } ${isCore ? "xl:scale-[1.015]" : ""}`}
                              type="button"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  plan: card.plan,
                                  extraUsers:
                                    card.plan === "CORE" || card.plan === "GROWTH"
                                      ? current.extraUsers
                                      : 0
                                }))
                              }
                            >
                              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),transparent_36%,transparent_72%,rgba(167,139,250,0.12))] opacity-70 transition-opacity duration-200 group-hover:opacity-100" />
                              <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <PlanIcon className={`mt-0.5 h-6 w-6 ${accents.icon}`} />
                                    <div>
                                      <p className="text-lg font-semibold text-white">{card.label}</p>
                                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                                        {card.subtitle}
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${accents.badge}`}
                                  >
                                    {card.highlight}
                                  </span>
                                </div>
                                <p className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                  {card.price}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-[2rem] border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(9,25,48,0.88),rgba(6,31,57,0.74))] p-6 shadow-[0_26px_60px_rgba(8,145,178,0.12)] backdrop-blur-[18px]">
                          <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                              Plan seleccionado
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                {selectedPlan.label}
                              </h3>
                              <span className="rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                {selectedPlan.price}
                              </span>
                            </div>
                            <ul className="space-y-3 pt-2 text-sm leading-6 text-slate-200">
                              {selectedPlan.bullets.map((bullet) => (
                                <li key={bullet} className="flex items-start gap-3">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-300" />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.18)] backdrop-blur-[18px]">
                          <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                              Capacidad seleccionada
                            </p>

                            {(form.plan === "CORE" || form.plan === "GROWTH") ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm text-slate-300">
                                  <span>Usuarios extra</span>
                                  <span className="font-semibold text-white">
                                    {form.extraUsers} · {formatCurrency(form.extraUsers * CORE_EXTRA_USER_MXN)}
                                  </span>
                                </div>
                                <input
                                  className="h-11 w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                                  max={CORE_MAX_EXTRA_USERS}
                                  min={0}
                                  type="range"
                                  value={form.extraUsers}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      extraUsers: Number(event.target.value)
                                    }))
                                  }
                                />
                                <p className="text-xs leading-6 text-slate-400">
                                  {form.plan === "CORE"
                                    ? "Core mantiene 20 usuarios incluidos y permite sumar hasta 10 adicionales."
                                    : "Growth muestra la misma ampliacion operativa y permite sumar hasta 10 usuarios extra en este flujo."}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm leading-7 text-slate-300">
                                Enterprise requiere acompañamiento comercial. Al continuar,
                                prepararemos la solicitud personalizada con el flujo existente.
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 pt-3">
                              <Button
                                className="border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                                type="button"
                                variant="outline"
                                onClick={() => setStep("hero")}
                              >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Volver
                              </Button>

                              <Button
                                className="bg-gradient-to-r from-[#5de0e6] to-[#004aad] text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] hover:opacity-95"
                                type="button"
                                onClick={handleContinueFromPlans}
                              >
                                {form.plan === "ENTERPRISE" ? "Contactar" : "Siguiente"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === "billing" ? (
                    <div ref={billingRef} className="space-y-8 pt-4">
                      <div className="space-y-3 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                          Paso 3 · Configuracion mensual
                        </p>
                        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                          Configura la activación mensual
                        </h2>
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
                                    {form.plan === "GROWTH" ? 50 : CORE_INCLUDED_USERS}
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
                                  disabled={form.plan === "ENTERPRISE"}
                                  max={CORE_MAX_EXTRA_USERS}
                                  min={0}
                                  type="range"
                                  value={form.plan === "ENTERPRISE" ? 0 : form.extraUsers}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      extraUsers: Number(event.target.value)
                                    }))
                                  }
                                />
                                <p className="text-xs text-slate-400">
                                  {form.plan === "ENTERPRISE"
                                    ? "Enterprise se cotiza de forma personalizada."
                                    : `${form.extraUsers} usuarios extra · ${formatCurrency(
                                        form.extraUsers * CORE_EXTRA_USER_MXN
                                      )}`}
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

                            <div className="flex flex-wrap items-center gap-3">
                              <Button
                                className="border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                                type="button"
                                variant="outline"
                                onClick={() => setStep("plans")}
                              >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Volver
                              </Button>

                              <Button className="flex-1" size="lg" type="submit">
                                {isSubmitting
                                  ? "Preparando activacion..."
                                  : quote.checkoutEnabled
                                    ? "Continuar con activacion"
                                    : "Solicitar activacion enterprise"}
                              </Button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
