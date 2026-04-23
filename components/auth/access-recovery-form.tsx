"use client";

import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import {
  orbitInputClassName,
  orbitPrimaryButtonClassName
} from "@/lib/ui/orbit-form-styles";

type RecoveryKind = "PASSWORD" | "CODE";

export function AccessRecoveryForm() {
  const [kind, setKind] = useState<RecoveryKind>("PASSWORD");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/recover-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName,
          email,
          kind
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible procesar la recuperación.");
        return;
      }

      setMessage(payload?.message ?? "Revisa tu correo para completar la recuperación.");
    } catch {
      setError("Ocurrió un error inesperado al procesar la recuperación.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Recupera tu acceso</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Valida tu nombre y tu correo para recuperar tu contraseña temporal o tu código
          único.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            kind === "PASSWORD"
              ? "border-cyan-400/35 bg-cyan-500/12 text-cyan-200"
              : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
          }`}
          type="button"
          onClick={() => setKind("PASSWORD")}
        >
          Contraseña
        </button>
        <button
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            kind === "CODE"
              ? "border-cyan-400/35 bg-cyan-500/12 text-cyan-200"
              : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
          }`}
          type="button"
          onClick={() => setKind("CODE")}
        >
          Código
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="recover-full-name">
          Nombre completo
        </label>
        <input
          id="recover-full-name"
          className={orbitInputClassName}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="recover-email">
          Correo
        </label>
        <input
          id="recover-email"
          className={orbitInputClassName}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <button className={orbitPrimaryButtonClassName} disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          "Continuar"
        )}
      </button>

      <p className="text-center text-sm text-slate-400">
        <Link
          className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
          href={"/login" as Route}
        >
          Volver al inicio de sesión
        </Link>
      </p>
    </form>
  );
}
