"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { PasswordField } from "@/components/auth/password-field";
import { PasswordRequirements } from "@/components/auth/password-requirements";
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
  orbitSecondaryButtonClassName,
  orbitSelectClassName
} from "@/lib/ui/orbit-form-styles";
import type { RegistrableRoleKey } from "@/types/auth";

type RegisterStep = 1 | 2;

type RegisterFormState = {
  fullName: string;
  email: string;
  countryCode: string;
  localPhone: string;
  password: string;
  role: RegistrableRoleKey | "";
  companyName: string;
  projectFolio: string;
  companyRegistrationCode: string;
};

type RegistrationSuccessState = {
  code: string;
  role: RegistrableRoleKey;
};

const initialFormState: RegisterFormState = {
  fullName: "",
  email: "",
  countryCode: PHONE_COUNTRY_OPTIONS[0]?.value ?? "+52",
  localPhone: "",
  password: "",
  role: "",
  companyName: "",
  projectFolio: "",
  companyRegistrationCode: ""
};

const roleOptions: { value: RegistrableRoleKey; label: string; description: string }[] = [
  {
    value: "LEADER",
    label: "Líder",
    description: "Gestiona proyectos, consultores y la operación de su empresa."
  },
  {
    value: "CONSULTANT",
    label: "Consultor",
    description: "Recibe proyectos, reporta avances y entrega documentos."
  },
  {
    value: "CLIENT",
    label: "Cliente",
    description: "Da seguimiento al proyecto y valida entregables."
  }
];

export default function RegisterForm() {
  const [step, setStep] = useState<RegisterStep>(1);
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

  function validateStepOne() {
    if (!form.fullName.trim()) {
      return "Ingresa tu nombre completo.";
    }

    if (!form.email.trim()) {
      return "Ingresa tu correo.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Ingresa un correo válido.";
    }

    if (!isPhoneNumberComplete(form.countryCode, form.localPhone)) {
      return "Ingresa un celular válido.";
    }

    if (!form.password) {
      return "Ingresa una contraseña.";
    }

    if (passwordValidationMessage) {
      return passwordValidationMessage;
    }

    return null;
  }

  function validateStepTwo() {
    if (!form.role) {
      return "Selecciona el tipo de usuario.";
    }

    if (form.role === "CLIENT" && !form.companyName.trim()) {
      return "Ingresa el nombre de la empresa para continuar como cliente.";
    }

    if (form.role === "CLIENT" && !form.projectFolio.trim()) {
      return "Ingresa el folio único del proyecto para registrar al cliente.";
    }

    if (form.role === "LEADER" && !form.companyRegistrationCode.trim()) {
      return "Ingresa el código maestro de empresa para registrar al líder.";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    if (step === 1) {
      const stepOneError = validateStepOne();

      if (stepOneError) {
        setError(stepOneError);
        return;
      }

      setStep(2);
      return;
    }

    const stepOneError = validateStepOne();
    const stepTwoError = validateStepTwo();

    if (stepOneError || stepTwoError) {
      setError(stepOneError ?? stepTwoError);
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
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: normalizedPhone,
          password: form.password,
          role: form.role,
          companyName: form.role === "CLIENT" ? form.companyName.trim() : undefined,
          projectFolio: form.role === "CLIENT" ? form.projectFolio.trim() : undefined,
          companyRegistrationCode:
            form.role === "LEADER" ? form.companyRegistrationCode.trim() : undefined
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible completar el registro.");
        return;
      }

      setSuccess({
        code: payload?.code ?? "",
        role: form.role as RegistrableRoleKey
      });
      setCopied(false);
    } catch {
      setError("Ocurrió un error inesperado al registrar el usuario.");
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
      <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Registro completado</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Tu acceso fue activado correctamente. Guarda este código para iniciar sesión.
        </p>
      </div>

        <div className="rounded-[1.7rem] border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-[0_18px_42px_rgba(4,120,87,0.14)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Código único generado
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {success.code}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Usuario activado como{" "}
            <span className="font-semibold text-white">
              {roleOptions.find((option) => option.value === success.role)?.label ?? success.role}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className={orbitSecondaryButtonClassName}
            type="button"
            onClick={handleCopyCode}
          >
            {copied ? "Código copiado" : "Copiar código"}
          </button>

          <Link
            className={`${orbitPrimaryButtonClassName} sm:flex-1`}
            href="/login"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Activa tu acceso autorizado</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Completa tus datos para activar tu acceso dentro de Orbit Nexus.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold shadow-[0_10px_24px_rgba(2,6,23,0.18)] ${
            step === 1
              ? "border-cyan-400/40 bg-gradient-to-br from-cyan-400 to-blue-600 text-white"
              : "border-white/12 bg-white/[0.05] text-slate-300"
          }`}
        >
          1
        </div>
        <div className="h-px flex-1 bg-white/10" />
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold shadow-[0_10px_24px_rgba(2,6,23,0.18)] ${
              step === 2
              ? "border-cyan-400/40 bg-gradient-to-br from-cyan-400 to-blue-600 text-white"
              : "border-white/12 bg-white/[0.05] text-slate-400"
          }`}
        >
          2
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="fullName">
              Nombre completo
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
              Correo
            </label>
            <input
              className={orbitInputClassName}
              id="email"
              placeholder="correo@empresa.com"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Celular</label>

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
              Se guardará como: {normalizedPhone || `${form.countryCode}...`}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="password">
              Contraseña
            </label>
            <PasswordField
              className={`${orbitInputClassName} pr-11`}
              id="password"
              value={form.password}
              onChange={(value) => updateField("password", value)}
            />
            <PasswordRequirements password={form.password} />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Tipo de usuario</label>
            <div className="grid gap-3">
              {roleOptions.map((option) => {
                const selected = form.role === option.value;

                return (
                  <button
                    key={option.value}
                    className={`rounded-[1.35rem] border px-4 py-4 text-left shadow-[0_12px_30px_rgba(2,6,23,0.14)] transition ${
                      selected
                        ? "border-cyan-400/40 bg-cyan-500/10 ring-1 ring-cyan-400/20"
                        : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]"
                    }`}
                    type="button"
                    onClick={() => updateField("role", option.value as RegisterFormState["role"])}
                  >
                    <p className="text-sm font-semibold text-white">{option.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{option.description}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      {selected ? `${option.label} seleccionado` : `Elegir ${option.label.toLowerCase()}`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {form.role === "CLIENT" ? (
            <div className="grid gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="client-company-name">
                  Nombre de la empresa
                </label>
                <input
                  className={orbitInputClassName}
                  id="client-company-name"
                  placeholder="Empresa asociada al proyecto"
                  type="text"
                  value={form.companyName}
                  onChange={(event) => updateField("companyName", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="projectFolio">
                  Folio único del proyecto
                </label>
                <input
                  className={orbitInputClassName}
                  id="projectFolio"
                  placeholder="PRJ-2026-0001"
                  type="text"
                  value={form.projectFolio}
                  onChange={(event) => updateField("projectFolio", event.target.value)}
                />
              </div>
            </div>
          ) : null}

          {form.role === "LEADER" ? (
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-200"
                htmlFor="companyRegistrationCode"
              >
                Código maestro de empresa
              </label>
              <input
                className={orbitInputClassName}
                id="companyRegistrationCode"
                placeholder="Ej. NTT-LEADER-2026"
                type="text"
                value={form.companyRegistrationCode}
                onChange={(event) =>
                  updateField("companyRegistrationCode", event.target.value)
                }
              />
            </div>
          ) : null}

          <div className={orbitInfoPanelClassName}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Resumen del registro</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>
                <span className="font-medium text-white">Nombre:</span> {form.fullName}
              </p>
              <p>
                <span className="font-medium text-white">Correo:</span> {form.email}
              </p>
              <p>
                <span className="font-medium text-white">Celular:</span> {normalizedPhone}
              </p>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {step === 2 ? (
          <button
            className={orbitSecondaryButtonClassName}
            type="button"
            onClick={() => {
              setError(null);
              setStep(1);
            }}
          >
            Volver
          </button>
        ) : null}

        <button
          className={`${orbitPrimaryButtonClassName} flex-1`}
          disabled={isSubmitting}
          type="submit"
        >
          {step === 1 ? (
            "Continuar al paso 2"
          ) : isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Completando registro...
            </>
          ) : (
            "Completar registro"
          )}
        </button>
      </div>

      <p className="text-center text-sm text-slate-400">
        ¿Ya tienes código de acceso?{" "}
        <Link className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline" href="/login">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
