"use client";

import {
  Check,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Sparkles,
  Star,
  TrendingUp,
  X,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/language-provider";
import { OrbitBackgroundVideo } from "@/components/ui/orbit-background-video";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CORE_BASE_MXN,
  CORE_INCLUDED_USERS,
  GROWTH_MAX_USERS,
  GROWTH_MONTHLY_MXN,
  buildQuoteSummary
} from "@/lib/commercial/plans";
import {
  orbitInputClassName,
  orbitPrimaryButtonClassName,
  orbitSecondaryButtonClassName
} from "@/lib/ui/orbit-form-styles";

type CompanyPlan = "CORE" | "GROWTH" | "ENTERPRISE";
type ActivationStep = "intro" | "hero" | "plans" | "billing";
type OrganizationAccessType = "COMPANY" | "OWN_BUSINESS";
type CompanyActivationCtaProps = {
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
};

const DISPLAY_CORE_BASE_MXN = CORE_BASE_MXN;
const DISPLAY_CORE_INCLUDED_USERS = CORE_INCLUDED_USERS;
const DISPLAY_GROWTH_BASE_MXN = GROWTH_MONTHLY_MXN;
const DISPLAY_GROWTH_INCLUDED_USERS = GROWTH_MAX_USERS;
const FALLBACK_EXCHANGE_RATE = 18;

const planCards = [
  {
    plan: "CORE" as const,
    label: "Core",
    highlight: "Base operativa",
    subtitle: "Base operativa",
    price: "$1,799 MXN al mes",
    microcopy: "Base operativa para empresas que necesitan ordenar procesos, usuarios y control interno.",
    bullets: [
      "Command Center ejecutivo",
      "Administración básica de usuarios",
      "Proyectos y tareas",
      "Reportes básicos",
      "Alertas operativas",
      "Seguimiento de actividad",
      "Acceso seguro por código empresarial",
      "MAIA por texto en modo básico"
    ]
  },
  {
    plan: "GROWTH" as const,
    label: "Growth",
    highlight: "Más elegido",
    subtitle: "PyME operativa",
    price: "$3,999 MXN al mes",
    microcopy: "Para PyMEs que necesitan operar, vender, cotizar y controlar finanzas con IA.",
    bullets: [
      "Todo lo de Core",
      "Hasta 10 facturas mensuales",
      "Hasta 20 cotizaciones mensuales",
      "Asistente IA por voz",
      "MAIA por texto completa",
      "Clientes / empresas",
      "Datos fiscales",
      "Reportes financieros básicos",
      "Automatizaciones operativas iniciales",
      "Inteligencia de prioridades",
      "Soporte estándar"
    ]
  },
  {
    plan: "ENTERPRISE" as const,
    label: "Business",
    highlight: "Solución empresarial",
    subtitle: "Solución empresarial",
    price: "Cotización personalizada",
    secondaryPrice: "Implementaciones desde $549 USD al mes",
    microcopy:
      "Solución empresarial para equipos que requieren mayor volumen, control avanzado e integraciones.",
    bullets: [
      "Todo lo de Growth",
      "Hasta 100 facturas mensuales",
      "Hasta 140 cotizaciones mensuales",
      "Asistente de voz con IA",
      "Automatizaciones avanzadas",
      "Integraciones con correo",
      "Reportes ejecutivos avanzados",
      "Permisos personalizados",
      "Soporte prioritario",
      "Onboarding asistido",
      "Preparación para integraciones ERP/CRM",
      "Arquitectura escalable multiárea",
      "Implementación estratégica"
    ]
  }
];

const planCardsEn: typeof planCards = [
  {
    plan: "CORE",
    label: "Core",
    highlight: "Operating base",
    subtitle: "Operating base",
    price: "$1,799 MXN per month",
    microcopy: "Operating foundation for companies that need to organize processes, users and internal control.",
    bullets: [
      "Executive Command Center",
      "Basic user administration",
      "Projects and tasks",
      "Basic reports",
      "Operational alerts",
      "Activity tracking",
      "Secure access by company code",
      "MAIA text assistant in basic mode"
    ]
  },
  {
    plan: "GROWTH",
    label: "Growth",
    highlight: "Most chosen",
    subtitle: "SMB operations",
    price: "$3,999 MXN per month",
    microcopy: "For SMBs that need to operate, sell, quote and control finance with AI.",
    bullets: [
      "Everything in Core",
      "Up to 10 monthly invoices",
      "Up to 20 monthly quotes",
      "AI voice assistant",
      "Full MAIA text assistant",
      "Clients / companies",
      "Tax profile",
      "Basic financial reports",
      "Initial operational automations",
      "Priority intelligence",
      "Standard support"
    ]
  },
  {
    plan: "ENTERPRISE",
    label: "Business",
    highlight: "Enterprise solution",
    subtitle: "Enterprise solution",
    price: "Custom quote",
    secondaryPrice: "Implementations from $549 USD per month",
    microcopy:
      "Enterprise solution for teams that require higher volume, advanced control and integrations.",
    bullets: [
      "Everything in Growth",
      "Up to 100 monthly invoices",
      "Up to 140 monthly quotes",
      "AI voice assistant",
      "Advanced automations",
      "Email integrations",
      "Advanced executive reports",
      "Custom permissions",
      "Priority support",
      "Assisted onboarding",
      "Preparation for ERP/CRM integrations",
      "Scalable multi-area architecture",
      "Strategic implementation"
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
  organizationAccessType: OrganizationAccessType | null;
  authorizedEmailDomain: string;
  ownerContactEmail: string;
  extraUsers: number;
};

type ActivationField =
  | "fullName"
  | "email"
  | "companyName"
  | "sector"
  | "organizationAccessType"
  | "authorizedEmailDomain"
  | "ownerContactEmail";
type FieldErrors = Partial<Record<ActivationField, string>>;

const initialFormState: FormState = {
  fullName: "",
  email: "",
  companyName: "",
  sector: "",
  plan: "CORE",
  organizationAccessType: null,
  authorizedEmailDomain: "",
  ownerContactEmail: "",
  extraUsers: 0
};

const sectorOptionsList = [
  "Tecnología / SaaS",
  "Consultoría",
  "Marketing / Publicidad",
  "Educación",
  "Salud",
  "Manufactura",
  "Finanzas",
  "Retail / Ecommerce",
  "Recursos Humanos",
  "Legal",
  "Otro"
] as const;

const activationSupportHref =
  "mailto:soporte@orbitne.com?subject=Soporte%20activacion%20Mikaelson%20OS";
const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "live.com"
]);

type ExchangeRateState = {
  rate: number;
  source: string;
  updatedAt: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

function formatEstimatedUsd(amountMxn: number, rate: number) {
  return `≈ $${Math.round(amountMxn / rate)} USD estimado`;
}

function normalizeDomainValue(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

function isValidCorporateDomain(value: string) {
  return /^[a-z0-9]+([.-]?[a-z0-9]+)*\.[a-z]{2,}$/i.test(value);
}

export function CompanyActivationCta({
  triggerClassName,
  triggerLabel,
  triggerVariant = "default"
}: CompanyActivationCtaProps = {}) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ActivationStep>("hero");
  const [countdownComplete, setCountdownComplete] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSectorMenuOpen, setIsSectorMenuOpen] = useState(false);
  const [manualReviewMessage, setManualReviewMessage] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateState>({
    rate: FALLBACK_EXCHANGE_RATE,
    source: "fallback",
    updatedAt: null
  });
  const [hasLoadedExchangeRate, setHasLoadedExchangeRate] = useState(false);

  const plansRef = useRef<HTMLDivElement | null>(null);
  const billingRef = useRef<HTMLDivElement | null>(null);
  const sectorMenuRef = useRef<HTMLDivElement | null>(null);

  const quote = useMemo(
    () =>
      buildQuoteSummary({
        plan: form.plan,
        extraUsers: 0
      }),
    [form.plan]
  );

  const displayQuote = useMemo(() => {
    if (form.plan === "CORE") {
      return {
        baseAmountMxn: DISPLAY_CORE_BASE_MXN,
        extraAmountMxn: 0,
        totalAmountMxn: DISPLAY_CORE_BASE_MXN,
        includedUsers: DISPLAY_CORE_INCLUDED_USERS,
        totalUsers: DISPLAY_CORE_INCLUDED_USERS
      };
    }

    if (form.plan === "GROWTH") {
      return {
        baseAmountMxn: DISPLAY_GROWTH_BASE_MXN,
        extraAmountMxn: 0,
        totalAmountMxn: DISPLAY_GROWTH_BASE_MXN,
        includedUsers: DISPLAY_GROWTH_INCLUDED_USERS,
        totalUsers: DISPLAY_GROWTH_INCLUDED_USERS
      };
    }

    return {
      baseAmountMxn: null,
      extraAmountMxn: null,
      totalAmountMxn: null,
      includedUsers: null,
      totalUsers: null
    };
  }, [form.plan]);

  const localizedPlanCards = language === "en" ? planCardsEn : planCards;
  const selectedPlan = useMemo(
    () => localizedPlanCards.find((card) => card.plan === form.plan) ?? localizedPlanCards[0],
    [form.plan, localizedPlanCards]
  );

  function getPlanUsdReference(plan: CompanyPlan) {
    if (plan === "ENTERPRISE") {
      return "Implementaciones desde $549 USD al mes";
    }

    const monthlyAmount = plan === "CORE" ? DISPLAY_CORE_BASE_MXN : DISPLAY_GROWTH_BASE_MXN;
    return formatEstimatedUsd(monthlyAmount, exchangeRate.rate);
  }

  useEffect(() => {
    if (!open || hasLoadedExchangeRate) {
      return;
    }

    let active = true;

    async function loadExchangeRate() {
      try {
        const response = await fetch("/api/currency/mxn-usd", {
          method: "GET",
          headers: {
            Accept: "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`Exchange rate request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as ExchangeRateState;

        if (!active || !payload.rate || !Number.isFinite(payload.rate)) {
          return;
        }

        setExchangeRate({
          rate: payload.rate,
          source: payload.source,
          updatedAt: payload.updatedAt
        });
      } catch (exchangeRateError) {
        console.warn("[activation/pricing] Falling back to static MXN/USD reference", exchangeRateError);
      } finally {
        if (active) {
          setHasLoadedExchangeRate(true);
        }
      }
    }

    void loadExchangeRate();

    return () => {
      active = false;
    };
  }, [hasLoadedExchangeRate, open]);

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

  useEffect(() => {
    if (!isSectorMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!sectorMenuRef.current?.contains(event.target as Node)) {
        setIsSectorMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSectorMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSectorMenuOpen]);

  function openActivation() {
    setOpen(true);
    setStep("intro");
    setCountdownComplete(false);
    setSecondsLeft(4);
    setError(null);
    setFieldErrors({});
    setIsSectorMenuOpen(false);
    setManualReviewMessage(null);
    setIsSubmitting(false);
  }

  function closeActivation() {
    setOpen(false);
    setStep("intro");
    setCountdownComplete(false);
    setSecondsLeft(4);
    setError(null);
    setFieldErrors({});
    setIsSectorMenuOpen(false);
    setManualReviewMessage(null);
    setIsSubmitting(false);
  }

  function clearFieldError(field: ActivationField) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validateBillingForm() {
    const nextErrors: FieldErrors = {};

    if (form.fullName.trim().length < 3) {
      nextErrors.fullName = "Ingresa el nombre completo del contacto.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Ingresa un correo válido.";
    }

    if (form.companyName.trim().length < 2) {
      nextErrors.companyName = "Ingresa el nombre de la empresa.";
    }

    if (!form.sector.trim()) {
      nextErrors.sector = "Selecciona el sector de tu empresa.";
    }

    if (!form.organizationAccessType) {
      nextErrors.organizationAccessType = "Selecciona cómo operará tu acceso.";
    }

    if (form.organizationAccessType === "COMPANY") {
      const normalizedDomain = normalizeDomainValue(form.authorizedEmailDomain);

      if (!normalizedDomain || !isValidCorporateDomain(normalizedDomain)) {
        nextErrors.authorizedEmailDomain = "Ingresa un dominio corporativo válido.";
      } else if (PUBLIC_EMAIL_DOMAINS.has(normalizedDomain)) {
        nextErrors.authorizedEmailDomain = "Usa un dominio corporativo, no un correo público.";
      }
    }

    if (
      form.organizationAccessType === "OWN_BUSINESS" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerContactEmail.trim())
    ) {
      nextErrors.ownerContactEmail = "Ingresa el correo principal del acceso.";
    }

    return nextErrors;
  }

  function handleShowPlans() {
    if (!countdownComplete) {
      return;
    }

    setStep("plans");
  }

  function handleStartCountdown() {
    setCountdownComplete(false);
    setSecondsLeft(4);
    setStep("hero");
  }

  function handleContinueFromPlans() {
    setIsSectorMenuOpen(false);
    setStep("billing");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateBillingForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError(nextErrors.sector ?? Object.values(nextErrors)[0] ?? "Completa los campos requeridos.");
      return;
    }

    setError(null);
    setFieldErrors({});
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
          contactName: form.fullName,
          email: form.email,
          contactEmail: form.email,
          companyName: form.companyName,
          sector: form.sector,
          plan: form.plan,
          organizationAccessType: form.organizationAccessType,
          authorizedEmailDomain:
            form.organizationAccessType === "COMPANY"
              ? normalizeDomainValue(form.authorizedEmailDomain)
              : undefined,
          ownerContactEmail:
            form.organizationAccessType === "OWN_BUSINESS"
              ? form.ownerContactEmail.trim()
              : undefined,
          includedUsers: quote.includedUsers,
          totalUsers: quote.totalUsers,
          extraUsers: 0,
          monthlyAmount: quote.baseAmountMxn
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const nextError =
          response.status === 400
            ? typeof payload?.message === "string" && payload.message.trim().length > 0
              ? payload.message
              : "Faltan datos para iniciar el checkout."
            : response.status === 503
              ? payload?.message ?? "Stripe no está configurado correctamente. Revisa STRIPE_SECRET_KEY."
              : response.status === 502
                ? payload?.message ?? "Stripe no pudo iniciar el checkout. Revisa logs del servidor."
                : typeof payload?.message === "string" && payload.message.trim().length > 0
                  ? payload.message
                  : "No fue posible iniciar la activación.";
        setError(nextError);
        return;
      }

      if (payload?.data?.mode === "manual-review") {
        setManualReviewMessage(
          "Recibimos tu solicitud Enterprise. Nuestro equipo comercial te contactará para cerrar una propuesta personalizada."
        );
        return;
      }

      if (payload?.data?.checkoutUrl) {
        window.location.href = payload.data.checkoutUrl;
        return;
      }

      setError("No fue posible redirigir al checkout de Stripe.");
    } catch (checkoutError) {
      console.error("[activation/billing] Checkout request failed", checkoutError);
      setError("Ocurrió un error inesperado al generar la activación.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        className={
          triggerClassName ??
          "bg-gradient-to-r from-[#5de0e6] to-[#004aad] text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] hover:opacity-95"
        }
        size="lg"
        type="button"
        variant={triggerVariant}
        onClick={openActivation}
      >
        {triggerLabel ?? t("activation.trigger")}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0">
            <OrbitBackgroundVideo
              primaryOverlayClassName="bg-[radial-gradient(circle_at_center,rgba(10,15,30,0.14),rgba(3,8,20,0.72))]"
              secondaryOverlayClassName="bg-[linear-gradient(135deg,rgba(3,11,27,0.26),rgba(7,19,40,0.52))]"
              videoClassName="saturate-[1.08] contrast-[1.06]"
            />
            <button
              aria-label="Cerrar activación comercial"
              className="absolute inset-0 bg-slate-950/28 backdrop-blur-[1px]"
              type="button"
              onClick={closeActivation}
            />
          </div>

          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-start px-4 py-6 md:px-6 md:py-8">
            <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/[0.14] bg-slate-950/30 shadow-[0_34px_110px_rgba(2,6,23,0.52)] backdrop-blur-[18px]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_28%,transparent_74%,rgba(93,224,230,0.06))]" />
              <div className="absolute -right-28 top-[-120px] h-80 w-80 rounded-full bg-[#5de0e6]/10 blur-3xl" />
              <div className="absolute -left-24 bottom-[-160px] h-96 w-96 rounded-full bg-[#004aad]/14 blur-3xl" />

              <div className="relative z-10 flex items-center justify-between px-6 py-5 md:px-8 md:py-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("activation.intro.badge")}
                </div>

                <button
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition-all duration-300 ease-in-out hover:bg-white/[0.1] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/30"
                  type="button"
                  onClick={closeActivation}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <section className="px-6 pb-10 pt-2 md:px-8 md:pb-12">
                <div className="mx-auto max-w-6xl space-y-8">
                  {step === "intro" ? (
                    <div className="grid min-h-[720px] items-center gap-8 py-4 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="space-y-8">
                        <button
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                          type="button"
                          onClick={closeActivation}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t("common.back")}
                        </button>

                        <div className="space-y-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                            {t("activation.intro.badge")}
                          </p>
                          <h2 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white md:text-5xl xl:text-6xl">
                            {t("activation.intro.title")}
                          </h2>
                          <p className="whitespace-pre-line text-2xl font-semibold leading-tight text-cyan-200 md:text-3xl">
                            {t("activation.intro.subtitle")}
                          </p>
                          <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                            {t("activation.intro.body")}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {[
                            ["activation.card.guided.title", "activation.card.guided.text"],
                            ["activation.card.rbac.title", "activation.card.rbac.text"],
                            ["activation.card.system.title", "activation.card.system.text"],
                            ["activation.card.fluid.title", "activation.card.fluid.text"]
                          ].map(([titleKey, textKey]) => (
                            <div
                              key={titleKey}
                              className="group relative overflow-hidden rounded-[1.55rem] border border-white/12 bg-white/[0.055] p-5 shadow-[0_16px_40px_rgba(2,6,23,0.18)] backdrop-blur-[18px] transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.08]"
                            >
                              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(93,224,230,0.10),transparent_45%,rgba(0,74,173,0.08))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                              <div className="relative z-10">
                                <h3 className="text-base font-semibold text-white">
                                  {t(titleKey as Parameters<typeof t>[0])}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                  {t(textKey as Parameters<typeof t>[0])}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-[2.15rem] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(9,25,48,0.9),rgba(7,37,70,0.68))] p-7 shadow-[0_30px_85px_rgba(0,74,173,0.24)] backdrop-blur-[22px]">
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_38%,rgba(93,224,230,0.10))]" />
                        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
                        <div className="relative z-10 space-y-7">
                          <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                              {t("activation.intro.panelTitle")}
                            </p>
                            <p className="text-base leading-7 text-slate-200">
                              {t("activation.intro.panelText")}
                            </p>
                          </div>

                          <Button
                            className="h-12 w-full rounded-full bg-gradient-to-r from-[#5de0e6] to-[#004aad] text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_22px_52px_rgba(0,74,173,0.42)]"
                            type="button"
                            onClick={handleStartCountdown}
                          >
                            {t("activation.intro.viewPlans")}
                          </Button>

                          <p className="text-center text-sm text-slate-400">
                            {t("activation.intro.loginPrompt")}{" "}
                            <a
                              className="font-semibold text-cyan-300 transition hover:text-cyan-200 hover:underline"
                              href="/login"
                            >
                              {t("activation.intro.loginLink")}
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

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
                          {t("activation.plans.step")}
                        </p>
                        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                          {t("activation.plans.title")}
                        </h2>
                      </div>

                      <div className="grid gap-5 xl:grid-cols-3">
                        {localizedPlanCards.map((card) => {
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
                                  extraUsers: 0
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
                                <p className="text-sm leading-6 text-slate-300">
                                  {getPlanUsdReference(card.plan)}
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
                              {t("activation.plans.selected")}
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                {selectedPlan.label}
                              </h3>
                              <span className="rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                {selectedPlan.price}
                              </span>
                            </div>
                            <p className="text-sm leading-7 text-slate-300">
                              {getPlanUsdReference(selectedPlan.plan)}
                            </p>
                            <p className="text-sm leading-7 text-slate-300/90">
                              {selectedPlan.microcopy}
                            </p>
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
                              {t("activation.plans.includes")}
                            </p>

                            <div className="space-y-3 text-sm leading-6 text-slate-300">
                              {selectedPlan.bullets.slice(0, 5).map((bullet) => (
                                <div key={bullet} className="flex items-start gap-3">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-300" />
                                  <span>{bullet}</span>
                                </div>
                              ))}
                            </div>

                            <p className="rounded-[1.35rem] border border-cyan-400/14 bg-slate-950/56 px-4 py-4 text-xs leading-6 text-slate-400">
                              {form.plan === "ENTERPRISE"
                                ? "Business requiere acompañamiento comercial. Al continuar, prepararemos la solicitud personalizada con el flujo existente."
                                : "El precio del plan es fijo. No se agregan costos variables en este flujo."}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-3">
                              <button
                                className={orbitSecondaryButtonClassName}
                                type="button"
                                onClick={() => setStep("hero")}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                {t("common.back")}
                              </button>

                              <Button
                                className="bg-gradient-to-r from-[#5de0e6] to-[#004aad] text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] hover:opacity-95"
                                type="button"
                                onClick={handleContinueFromPlans}
                              >
                                {form.plan === "ENTERPRISE"
                                  ? t("activation.plans.contact")
                                  : t("activation.plans.continue")}
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
                          {t("activation.billing.step")}
                        </p>
                        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
                          {t("activation.billing.title")}
                        </h2>
                      </div>

                      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
                        <div className="space-y-4">
                          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.18)] backdrop-blur-[18px]">
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_44%,transparent_74%,rgba(93,224,230,0.08))]" />
                            <div className="relative z-10 space-y-6">
                              <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                                    {t("activation.billing.summary")}
                                  </p>
                                  {form.plan === "ENTERPRISE" ? (
                                    <div className="mt-2 space-y-2">
                                      <p className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                        Cotización personalizada
                                      </p>
                                      <p className="text-sm font-medium text-slate-400">
                                        Implementaciones desde $549 USD al mes
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="mt-2 space-y-2">
                                      <p className="text-3xl font-semibold tracking-[-0.03em] text-white">
                                        {formatCurrency(displayQuote.totalAmountMxn ?? 0)}
                                        <span className="ml-2 text-sm font-medium text-slate-400">
                                          MXN al mes
                                        </span>
                                      </p>
                                      <p className="text-sm font-medium text-slate-400">
                                        {formatEstimatedUsd(
                                          displayQuote.totalAmountMxn ?? 0,
                                          exchangeRate.rate
                                        )}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/72 px-5 py-4 text-right">
                                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                                    Modalidad
                                  </p>
                                  <p className="mt-2 text-xl font-semibold text-white">
                                    {form.plan === "ENTERPRISE" ? "A medida" : "Mensual"}
                                  </p>
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/72 px-4 py-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    Plan seleccionado
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-white">
                                    {form.plan === "ENTERPRISE" ? "Enterprise" : selectedPlan.label}
                                  </p>
                                </div>
                                <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/72 px-4 py-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    {t("activation.billing.base")}
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-white">
                                    {form.plan === "ENTERPRISE"
                                      ? "A medida"
                                      : formatCurrency(displayQuote.baseAmountMxn ?? 0)}
                                  </p>
                                </div>
                                <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/72 px-4 py-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    {t("activation.billing.total")}
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-white">
                                    {form.plan === "ENTERPRISE"
                                      ? "Cotización guiada"
                                      : formatCurrency(displayQuote.totalAmountMxn ?? 0)}
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-[1.6rem] border border-cyan-400/14 bg-slate-950/56 px-5 py-5">
                                <p className="text-sm font-medium text-white">
                                  {t("activation.billing.autoNote")}
                                </p>
                                <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                                  <li className="flex items-start gap-3">
                                    <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300" />
                                    <span>Se confirma el pago.</span>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300" />
                                    <span>Se activa la empresa.</span>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300" />
                                    <span>Se genera el código de acceso.</span>
                                  </li>
                                  <li className="flex items-start gap-3">
                                    <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300" />
                                    <span>Se habilita el entorno operativo.</span>
                                  </li>
                                </ol>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.18)] backdrop-blur-[18px]">
                          <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                                Activa tu operación
                              </p>
                              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                                Activa tu operación
                              </h3>
                              <p className="text-sm leading-7 text-slate-300">
                                Estás a un paso de habilitar tu entorno con control, usuarios y
                                trazabilidad en tiempo real.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                  Identidad
                                </p>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label className="text-slate-200" htmlFor="activation-full-name">
                                      Nombre completo
                                    </Label>
                                    <Input
                                      id="activation-full-name"
                                      className={`${orbitInputClassName} ${
                                        fieldErrors.fullName
                                          ? "border-rose-400/40 focus:border-rose-400/40 focus:ring-rose-400/25"
                                          : ""
                                      }`}
                                      value={form.fullName}
                                      onChange={(event) =>
                                        setForm((current) => ({
                                          ...current,
                                          fullName: event.target.value
                                        }))
                                      }
                                      onChangeCapture={() => clearFieldError("fullName")}
                                      onBlur={() => clearFieldError("fullName")}
                                    />
                                    {fieldErrors.fullName ? (
                                      <p className="text-xs text-rose-200">{fieldErrors.fullName}</p>
                                    ) : null}
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-slate-200" htmlFor="activation-email">
                                      Correo
                                    </Label>
                                    <Input
                                      id="activation-email"
                                      className={`${orbitInputClassName} ${
                                        fieldErrors.email
                                          ? "border-rose-400/40 focus:border-rose-400/40 focus:ring-rose-400/25"
                                          : ""
                                      }`}
                                      value={form.email}
                                      onChange={(event) =>
                                        setForm((current) => ({
                                          ...current,
                                          email: event.target.value
                                        }))
                                      }
                                      onChangeCapture={() => clearFieldError("email")}
                                      onBlur={() => clearFieldError("email")}
                                    />
                                    {fieldErrors.email ? (
                                      <p className="text-xs text-rose-200">{fieldErrors.email}</p>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                  Configuración
                                </p>
                                <div className="space-y-3">
                                  <Label className="text-slate-200">¿Cómo operará tu acceso?</Label>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <button
                                      className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
                                        form.organizationAccessType === "COMPANY"
                                          ? "border-cyan-400/40 bg-cyan-500/10 ring-1 ring-cyan-400/20"
                                          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]"
                                      }`}
                                      type="button"
                                      onClick={() => {
                                        setForm((current) => ({
                                          ...current,
                                          organizationAccessType: "COMPANY",
                                          ownerContactEmail: ""
                                        }));
                                        clearFieldError("organizationAccessType");
                                        clearFieldError("authorizedEmailDomain");
                                      }}
                                    >
                                      <p className="text-sm font-semibold text-white">Empresa</p>
                                      <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Acceso para un equipo con dominio corporativo reconocido por Mikaelson OS.
                                      </p>
                                    </button>

                                    <button
                                      className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
                                        form.organizationAccessType === "OWN_BUSINESS"
                                          ? "border-cyan-400/40 bg-cyan-500/10 ring-1 ring-cyan-400/20"
                                          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]"
                                      }`}
                                      type="button"
                                      onClick={() => {
                                        setForm((current) => ({
                                          ...current,
                                          organizationAccessType: "OWN_BUSINESS",
                                          authorizedEmailDomain: "",
                                          ownerContactEmail: current.ownerContactEmail || current.email
                                        }));
                                        clearFieldError("organizationAccessType");
                                        clearFieldError("ownerContactEmail");
                                      }}
                                    >
                                      <p className="text-sm font-semibold text-white">Negocio propio</p>
                                      <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Acceso principal para una operación independiente con contacto centralizado.
                                      </p>
                                    </button>
                                  </div>
                                  {fieldErrors.organizationAccessType ? (
                                    <p className="text-xs text-rose-200">
                                      {fieldErrors.organizationAccessType}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-slate-200" htmlFor="activation-company">
                                    Empresa
                                  </Label>
                                  <Input
                                    id="activation-company"
                                    className={`${orbitInputClassName} ${
                                      fieldErrors.companyName
                                        ? "border-rose-400/40 focus:border-rose-400/40 focus:ring-rose-400/25"
                                        : ""
                                    }`}
                                    value={form.companyName}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        companyName: event.target.value
                                      }))
                                    }
                                    onChangeCapture={() => clearFieldError("companyName")}
                                    onBlur={() => clearFieldError("companyName")}
                                  />
                                  {fieldErrors.companyName ? (
                                    <p className="text-xs text-rose-200">{fieldErrors.companyName}</p>
                                  ) : null}
                                </div>

                                {form.organizationAccessType === "COMPANY" ? (
                                  <div className="space-y-2">
                                    <Label className="text-slate-200" htmlFor="activation-domain">
                                      Dominio corporativo
                                    </Label>
                                    <div
                                      className={`flex h-12 items-center overflow-hidden rounded-2xl border bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 ease-in-out ${
                                        fieldErrors.authorizedEmailDomain
                                          ? "border-rose-400/40 focus-within:ring-2 focus-within:ring-rose-400/25"
                                          : "border-white/15 hover:border-white/20 focus-within:border-[#60A5FA]/45 focus-within:ring-2 focus-within:ring-[#38BDF8]/40"
                                      }`}
                                    >
                                      <span className="flex h-full items-center border-r border-white/10 px-4 text-sm font-medium text-cyan-300">
                                        @
                                      </span>
                                      <input
                                        id="activation-domain"
                                        className="h-full w-full bg-transparent px-4 text-sm text-white placeholder:text-slate-400 focus:outline-none"
                                        placeholder="empresa.com"
                                        type="text"
                                        value={form.authorizedEmailDomain}
                                        onChange={(event) =>
                                          setForm((current) => ({
                                            ...current,
                                            authorizedEmailDomain: event.target.value
                                          }))
                                        }
                                        onChangeCapture={() => clearFieldError("authorizedEmailDomain")}
                                        onBlur={() => clearFieldError("authorizedEmailDomain")}
                                      />
                                    </div>
                                    {fieldErrors.authorizedEmailDomain ? (
                                      <p className="text-xs text-rose-200">
                                        {fieldErrors.authorizedEmailDomain}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-slate-400">
                                        Usaremos este dominio para reconocer usuarios autorizados de tu organización.
                                      </p>
                                    )}
                                  </div>
                                ) : null}

                                {form.organizationAccessType === "OWN_BUSINESS" ? (
                                  <div className="space-y-2">
                                    <Label className="text-slate-200" htmlFor="activation-owner-email">
                                      Correo principal del acceso
                                    </Label>
                                    <Input
                                      id="activation-owner-email"
                                      className={`${orbitInputClassName} ${
                                        fieldErrors.ownerContactEmail
                                          ? "border-rose-400/40 focus:border-rose-400/40 focus:ring-rose-400/25"
                                          : ""
                                      }`}
                                      placeholder="contacto@negocio.com"
                                      type="email"
                                      value={form.ownerContactEmail}
                                      onChange={(event) =>
                                        setForm((current) => ({
                                          ...current,
                                          ownerContactEmail: event.target.value
                                        }))
                                      }
                                      onChangeCapture={() => clearFieldError("ownerContactEmail")}
                                      onBlur={() => clearFieldError("ownerContactEmail")}
                                    />
                                    {fieldErrors.ownerContactEmail ? (
                                      <p className="text-xs text-rose-200">
                                        {fieldErrors.ownerContactEmail}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-slate-400">
                                        Este correo quedará asociado como contacto principal del acceso.
                                      </p>
                                    )}
                                  </div>
                                ) : null}

                                <div className="space-y-2">
                                  <Label className="text-slate-200" htmlFor="activation-sector">
                                    Sector
                                  </Label>
                                  <div ref={sectorMenuRef} className="relative">
                                    <button
                                      aria-expanded={isSectorMenuOpen}
                                      aria-haspopup="listbox"
                                      className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 ease-in-out ${
                                        fieldErrors.sector
                                          ? "border-rose-400/40 bg-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-rose-400/25"
                                          : "border-white/15 bg-white/[0.08] text-white hover:border-white/20 hover:bg-white/[0.10] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40"
                                      }`}
                                      id="activation-sector"
                                      type="button"
                                      onClick={() => setIsSectorMenuOpen((current) => !current)}
                                    >
                                      <span className={form.sector ? "text-white" : "text-slate-400"}>
                                        {form.sector || "Selecciona un sector"}
                                      </span>
                                      <ChevronDown
                                        className={`h-4 w-4 text-slate-300 transition-transform duration-200 ${
                                          isSectorMenuOpen ? "rotate-180" : ""
                                        }`}
                                      />
                                    </button>

                                    {isSectorMenuOpen ? (
                                      <div className="absolute left-0 top-[calc(100%+0.55rem)] z-30 w-full overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#07111f]/95 p-2 shadow-[0_24px_54px_rgba(2,6,23,0.45)] backdrop-blur-[20px]">
                                        <div className="max-h-64 overflow-y-auto pr-1" role="listbox">
                                          {sectorOptionsList.map((sector) => {
                                            const isSelected = form.sector === sector;

                                            return (
                                              <button
                                                aria-selected={isSelected}
                                                key={sector}
                                                className={`flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-sm transition-all duration-200 ${
                                                  isSelected
                                                    ? "bg-cyan-400/12 text-white"
                                                    : "text-slate-200 hover:bg-cyan-400/10 hover:text-white"
                                                }`}
                                                role="option"
                                                type="button"
                                                onClick={() => {
                                                  setForm((current) => ({
                                                    ...current,
                                                    sector
                                                  }));
                                                  clearFieldError("sector");
                                                  setError((current) =>
                                                    current === "Selecciona el sector de tu empresa."
                                                      ? null
                                                      : current
                                                  );
                                                  setIsSectorMenuOpen(false);
                                                }}
                                              >
                                                <span>{sector}</span>
                                                {isSelected ? (
                                                  <Check className="h-4 w-4 text-cyan-300" />
                                                ) : null}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                  {fieldErrors.sector ? (
                                    <p className="text-xs text-rose-200">{fieldErrors.sector}</p>
                                  ) : (
                                    <p className="text-xs text-slate-400">
                                      Selecciona el sector principal de tu empresa.
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-[1.35rem] border border-cyan-400/14 bg-slate-950/56 px-4 py-4 text-sm leading-6 text-slate-300">
                                  {form.plan === "ENTERPRISE"
                                    ? "Business se cotiza de forma personalizada y no abre checkout automático."
                                    : "El plan seleccionado se activa con precio mensual fijo, sin cargos variables dentro de este flujo."}
                                </div>
                              </div>
                            </div>

                            {error ? (
                              <div className="space-y-3">
                                <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                                  {error}
                                </div>
                                <a
                                  className="inline-flex text-sm font-medium text-cyan-300 transition-colors duration-200 hover:text-cyan-200"
                                  href={activationSupportHref}
                                >
                                  ¿Necesitas ayuda? Contactar soporte
                                </a>
                              </div>
                            ) : null}

                            {manualReviewMessage ? (
                              <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                {manualReviewMessage}
                              </div>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                className={orbitSecondaryButtonClassName}
                                type="button"
                                onClick={() => setStep("plans")}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Volver
                              </button>

                              <button
                                className={`${orbitPrimaryButtonClassName} flex-1`}
                                disabled={isSubmitting}
                                type="submit"
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Activando plataforma...
                                  </>
                                ) : quote.checkoutEnabled ? (
                                  "Activar plataforma"
                                ) : (
                                  "Solicitar activación enterprise"
                                )}
                              </button>
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



