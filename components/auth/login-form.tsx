"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccessRecoveryModal } from "@/components/auth/access-recovery-modal";
import { AdminAccessModal } from "@/components/auth/admin-access-modal";
import { PasswordField } from "@/components/auth/password-field";
import { setBrowserSession } from "@/lib/auth/browser-session";

export default function LoginForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    const accessCode = code.trim();

    if (!accessCode || !password.trim()) {
      setError("Completa tu codigo unico y tu contrasena.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessCode,
          password
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible iniciar sesion.");
        return;
      }

      setBrowserSession(payload?.data?.accessCode ?? accessCode);
      router.replace("/workspace");
      router.refresh();
    } catch {
      setError("Ocurrio un error inesperado al iniciar sesion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Accede a tu entorno operativo
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Ingresa con tu codigo unico y contrasena para continuar.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="accessCode">
          Codigo unico
        </label>
        <input
          autoComplete="username"
          className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
          id="accessCode"
          name="accessCode"
          placeholder="Ej: LDR-001"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-200" htmlFor="password">
            Contrasena
          </label>

          <button
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
            type="button"
            onClick={() => setIsRecoveryModalOpen(true)}
          >
            Olvide...
          </button>
        </div>

        <PasswordField
          autoComplete="current-password"
          className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
          id="password"
          name="password"
          placeholder="Ingresa tu contrasena"
          value={password}
          onChange={setPassword}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <button
        aria-busy={isSubmitting}
        className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#5de0e6] to-[#004aad] px-4 font-semibold text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] transition hover:opacity-95"
        type="submit"
      >
        {isSubmitting ? "Ingresando..." : "Iniciar sesion"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">o</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-5 shadow-[0_14px_32px_rgba(2,6,23,0.16)] backdrop-blur-md">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
          Acceso seguro
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Tu sesion esta protegida mediante autenticacion por codigo unico y validacion por
          empresa.
        </p>
      </div>

      <p className="text-center text-sm text-slate-400">
        Aun no tienes acceso?{" "}
        <Link className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline" href="/register">
          Registrate aqui
        </Link>
      </p>

      <button
        className="mx-auto block text-center text-xs font-semibold text-slate-400 transition hover:text-cyan-300"
        type="button"
        onClick={() => setIsAdminModalOpen(true)}
      >
        Eres administrador?
      </button>

      <AccessRecoveryModal
        open={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
      />
      <AdminAccessModal open={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
    </form>
  );
}
