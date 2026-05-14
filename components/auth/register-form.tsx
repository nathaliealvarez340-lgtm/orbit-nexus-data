"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { PasswordField } from "@/components/auth/password-field";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  buildInternationalPhone,
  isPhoneNumberComplete,
  normalizePhoneLocalNumber,
  PHONE_COUNTRY_OPTIONS
} from "@/lib/phone";
import { getPasswordValidationMessage } from "@/lib/password-policy";
import {
  orbitInfoPanelClassName,
  orbitInputClassName,
  orbitPrimaryButtonClassName,
  orbitSelectClassName
} from "@/lib/ui/orbit-form-styles";

type RegisterFormState = {
  companyName: string;
  fullName: string;
  email: string;
  countryCode: string;
  localPhone: string;
  password: string;
  confirmPassword: string;
};

type RegistrationSuccessState = {
  code: string;
  companyName: string;
};

const initialFormState: RegisterFormState = {
  companyName: "",
  fullName: "",
  email: "",
  countryCode: PHONE_COUNTRY_OPTIONS[0]?.value ?? "+52",
  localPhone: "",
  password: "",
  confirmPassword: ""
};

export default function RegisterForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RegistrationSuccessState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement | null>(null);

  const normalizedPhone = useMemo(
    () => buildInternationalPhone(form.countryCode, form.localPhone),
    [form.countryCode, form.localPhone]
  );
  const passwordValidationMessage = getPasswordValidationMessage(form.password);
  const selectedCountryOption = useMemo(
    () =>
      PHONE_COUNTRY_OPTIONS.find((option) => option.value === form.countryCode) ??
      PHONE_COUNTRY_OPTIONS[0],
    [form.countryCode]
  );

  useEffect(() => {
    if (!isCountryMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!countryMenuRef.current?.contains(event.target as Node)) {
        setIsCountryMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCountryMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCountryMenuOpen]);

  function updateField<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
    setError(null);
  }

  function validateForm() {
    if (!form.companyName.trim()) {
      return "Ingresa el nombre de la empresa.";
    }

    if (!form.fullName.trim()) {
      return "Ingresa el nombre completo del owner o administrador.";
    }

    if (!form.email.trim()) {
      return "Ingresa el correo empresarial.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Ingresa un correo empresarial válido.";
    }

    if (form.localPhone && !isPhoneNumberComplete(form.countryCode, form.localPhone)) {
      return "Ingresa un celular válido o deja el campo vacío.";
    }

    if (!form.password) {
      return "Ingresa una contraseña.";
    }

    if (passwordValidationMessage) {
      return passwordValidationMessage;
    }

    if (form.password !== form.confirmPassword) {
      return "La confirmación de contraseña no coincide.";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    const formError = validateForm();

    if (formError) {
      setError(formError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: normalizedPhone || undefined,
          password: form.password,
          confirmPassword: form.confirmPassword
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible activar la empresa.");
        return;
      }

      setSuccess({
        code: payload?.code ?? "",
        companyName: payload?.companyName ?? form.companyName.trim()
      });
      setCopied(false);
    } catch {
      setError("Ocurrió un error inesperado al activar la empresa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyCode() {
    if (!success?.code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(success.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-7 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            {success.companyName}
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {t("auth.success.title")}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {t("auth.success.text")}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            {t("auth.success.instructions")}
          </p>
        </div>

        <button
          className="w-full rounded-[1.7rem] border border-emerald-500/20 bg-emerald-500/10 p-5 text-left shadow-[0_18px_42px_rgba(4,120,87,0.14)] transition hover:border-cyan-300/35 hover:bg-cyan-500/10"
          type="button"
          onClick={handleCopyCode}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {t("auth.success.codeLabel")}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {success.code}
          </p>
          {copied ? (
            <p className="mt-3 text-sm font-semibold text-cyan-200">
              {t("auth.success.copied")}
            </p>
          ) : null}
        </button>

        <Link className={orbitPrimaryButtonClassName} href="/login">
          {t("auth.success.login")}
        </Link>
      </div>
    );
  }
  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          {t("auth.register.title")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {t("auth.register.description")}
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="companyName">
            {t("auth.register.company")}
          </label>
          <input
            className={orbitInputClassName}
            id="companyName"
            placeholder="Ej. MAIA"
            type="text"
            value={form.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="fullName">
            {t("auth.register.owner")}
          </label>
          <input
            className={orbitInputClassName}
            id="fullName"
            placeholder="Nombre y apellidos"
            type="text"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="email">
            {t("auth.register.email")}
          </label>
          <input
            autoComplete="email"
            className={orbitInputClassName}
            id="email"
            placeholder="owner@empresa.com"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">{t("auth.register.phone")}</label>

          <div className="flex gap-2">
            <div ref={countryMenuRef} className="relative w-[132px] shrink-0 sm:w-[148px]">
              <button
                aria-expanded={isCountryMenuOpen}
                aria-haspopup="listbox"
                className={`${orbitSelectClassName} flex items-center justify-between gap-2 px-3 text-left text-sm`}
                type="button"
                onClick={() => setIsCountryMenuOpen((current) => !current)}
              >
                <span className="truncate">{selectedCountryOption?.label ?? form.countryCode}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 ${
                    isCountryMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCountryMenuOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.55rem)] z-30 w-full overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#07111f]/95 p-2 shadow-[0_24px_54px_rgba(2,6,23,0.45)] backdrop-blur-[20px]">
                  <div className="max-h-64 overflow-y-auto pr-1" role="listbox">
                    {PHONE_COUNTRY_OPTIONS.map((option) => {
                      const isSelected = option.value === form.countryCode;

                      return (
                        <button
                          aria-selected={isSelected}
                          key={option.value}
                          className={`flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-sm transition-all duration-200 ${
                            isSelected
                              ? "bg-cyan-400/12 text-white"
                              : "text-slate-200 hover:bg-cyan-400/10 hover:text-white"
                          }`}
                          role="option"
                          type="button"
                          onClick={() => {
                            updateField("countryCode", option.value);
                            setIsCountryMenuOpen(false);
                          }}
                        >
                          <span>{option.label}</span>
                          {isSelected ? <Check className="h-4 w-4 text-cyan-300" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <input
              className={`${orbitInputClassName} min-w-0 flex-1`}
              placeholder="5512345678"
              type="text"
              value={form.localPhone}
              onChange={(event) =>
                updateField("localPhone", normalizePhoneLocalNumber(event.target.value))
              }
            />
          </div>

          <p className="text-xs text-slate-400">
            {normalizedPhone ? `Se guardará como: ${normalizedPhone}` : "Puedes dejarlo vacío."}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="password">
            {t("auth.register.password")}
          </label>
          <PasswordField
            autoComplete="new-password"
            className={`${orbitInputClassName} pr-11`}
            id="password"
            value={form.password}
            onChange={(value) => updateField("password", value)}
          />
          <PasswordRequirements password={form.password} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="confirmPassword">
            {t("auth.register.confirmPassword")}
          </label>
          <PasswordField
            autoComplete="new-password"
            className={`${orbitInputClassName} pr-11`}
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={(value) => updateField("confirmPassword", value)}
          />
        </div>
      </div>

      <div className={orbitInfoPanelClassName}>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
          Cuenta empresarial
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          El primer usuario se crea como owner con acceso al workspace, usuarios, cotizaciones,
          facturas, Orbit AI y configuracion.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <button className={orbitPrimaryButtonClassName} disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("auth.register.submitting")}
          </>
        ) : (
          t("auth.register.submit")
        )}
      </button>

      <p className="text-center text-sm text-slate-400">
        {t("activation.intro.loginPrompt")}{" "}
        <Link className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline" href="/login">
          {t("activation.intro.loginLink")}
        </Link>
      </p>
    </form>
  );
}

