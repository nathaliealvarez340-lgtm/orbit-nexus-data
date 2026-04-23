"use client";

import type { Route } from "next";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminAccessForm } from "@/components/auth/admin-access-modal";
import { PasswordField } from "@/components/auth/password-field";
import {
  orbitInfoPanelClassName,
  orbitInputClassName,
  orbitPrimaryButtonClassName
} from "@/lib/ui/orbit-form-styles";

export default function LoginForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    const accessCode = code.trim();

    if (!accessCode || !password.trim()) {
      setError("Completa tu código único y tu contraseña.");
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
        setError(payload?.message ?? "No fue posible iniciar sesión.");
        return;
      }

      router.replace("/workspace");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado al iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAdminMode) {
    return <AdminAccessForm onBack={() => setIsAdminMode(false)} />;
  }

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Accede a tu entorno operativo
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Ingresa con tu código único y contraseña para continuar.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="accessCode">
          Código único
        </label>
        <input
          autoComplete="username"
          className={orbitInputClassName}
          id="accessCode"
          name="accessCode"
          placeholder="Ej. LDNT-001"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-200" htmlFor="password">
            Contraseña
          </label>

          <Link
            className="text-xs font-semibold tracking-[0.08em] text-cyan-200 transition hover:text-cyan-100 hover:underline"
            href={"/auth/recover-access" as Route}
          >
            Olvidé...
          </Link>
        </div>

        <PasswordField
          autoComplete="current-password"
          className={`${orbitInputClassName} pr-11`}
          id="password"
          name="password"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={setPassword}
        />
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
            Ingresando...
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">o</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className={orbitInfoPanelClassName}>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
          Acceso seguro
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Tu sesión está protegida mediante autenticación por código único y validación por
          empresa.
        </p>
      </div>

      <p className="text-center text-sm text-slate-400">
        ¿Aún no tienes acceso?{" "}
        <Link className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline" href="/register">
          Regístrate aquí
        </Link>
      </p>

      <button
        className="mx-auto block text-center text-xs font-semibold text-slate-400 transition hover:text-cyan-300"
        type="button"
        onClick={() => setIsAdminMode(true)}
      >
        ¿Eres administrador?
      </button>
    </form>
  );
}
