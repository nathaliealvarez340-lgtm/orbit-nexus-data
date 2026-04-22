"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PasswordRequirements } from "@/components/auth/password-requirements";
import {
  buildInternationalPhone,
  isPhoneNumberComplete,
  normalizePhoneLocalNumber,
  PHONE_COUNTRY_OPTIONS
} from "@/lib/phone";
import { getPasswordValidationMessage } from "@/lib/password-policy";
import type { RegistrableRoleKey } from "@/types/auth";

type RegisterStep = 1 | 2;

type RegisterFormState = {
  fullName: string;
  email: string;
  countryCode: string;
  localPhone: string;
  password: string;
  role: RegistrableRoleKey | "";
  projectFolio: string;
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
  projectFolio: ""
};

const roleOptions: { value: RegistrableRoleKey; label: string; description: string }[] = [
  {
    value: "LEADER",
    label: "Lider",
    description: "Gestiona proyectos, consultores y la operacion de su empresa."
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

  const normalizedPhone = useMemo(
    () => buildInternationalPhone(form.countryCode, form.localPhone),
    [form.countryCode, form.localPhone]
  );
  const passwordValidationMessage = getPasswordValidationMessage(form.password);

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
      return "Ingresa un correo valido.";
    }

    if (!isPhoneNumberComplete(form.countryCode, form.localPhone)) {
      return "Ingresa un celular valido.";
    }

    if (!form.password) {
      return "Ingresa una contrasena.";
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

    if (form.role === "CLIENT" && !form.projectFolio.trim()) {
      return "Ingresa el folio unico del proyecto para registrar al cliente.";
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
          projectFolio: form.role === "CLIENT" ? form.projectFolio.trim() : undefined
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
      setError("Ocurrio un error inesperado al registrar el usuario.");
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
          Tu acceso fue activado correctamente. Guarda este codigo para iniciar sesion.
        </p>
      </div>

        <div className="rounded-[1.7rem] border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-[0_18px_42px_rgba(4,120,87,0.14)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Codigo unico generado
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
            className="h-12 rounded-2xl border border-white/12 bg-white/[0.06] px-5 font-semibold text-slate-100 transition hover:bg-white/[0.08]"
            type="button"
            onClick={handleCopyCode}
          >
            {copied ? "Codigo copiado" : "Copiar codigo"}
          </button>

          <Link
            className="h-12 rounded-2xl bg-gradient-to-r from-[#5de0e6] to-[#004aad] px-5 text-center font-semibold text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] transition hover:opacity-95"
            href="/login"
          >
            Ir a iniciar sesion
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
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
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
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
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
              <select
                className="h-12 rounded-2xl border border-white/15 bg-white/[0.07] px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
                value={form.countryCode}
                onChange={(event) => updateField("countryCode", event.target.value)}
              >
                {PHONE_COUNTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                className="h-12 flex-1 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
                placeholder="5512345678"
                type="text"
                value={form.localPhone}
                onChange={(event) =>
                  updateField("localPhone", normalizePhoneLocalNumber(event.target.value))
                }
              />
            </div>

            <p className="text-xs text-slate-400">
              Se guardara como: {normalizedPhone || `${form.countryCode}...`}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="password">
              Contrasena
            </label>
            <input
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
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
                  </button>
                );
              })}
            </div>
          </div>

          {form.role === "CLIENT" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="projectFolio">
                Folio unico del proyecto
              </label>
              <input
                className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
                id="projectFolio"
                placeholder="PRJ-2026-0001"
                type="text"
                value={form.projectFolio}
                onChange={(event) => updateField("projectFolio", event.target.value)}
              />
            </div>
          ) : null}

          <div className="rounded-[1.35rem] border border-white/12 bg-white/[0.06] p-5 shadow-[0_14px_32px_rgba(2,6,23,0.16)] backdrop-blur-md">
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
            className="h-12 rounded-2xl border border-white/12 bg-white/[0.06] px-5 font-semibold text-slate-100 transition hover:bg-white/[0.08]"
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
          aria-busy={isSubmitting}
          className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-[#5de0e6] to-[#004aad] px-5 font-semibold text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] transition hover:opacity-95"
          type="submit"
        >
          {step === 1
            ? "Continuar al paso 2"
            : isSubmitting
              ? "Completando registro..."
              : "Completar registro"}
        </button>
      </div>

      <p className="text-center text-sm text-slate-400">
        Ya tienes codigo de acceso?{" "}
        <Link className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline" href="/login">
          Volver a iniciar sesion
        </Link>
      </p>
    </form>
  );
}
