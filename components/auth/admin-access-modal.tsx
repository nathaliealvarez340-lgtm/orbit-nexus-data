"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/components/auth/password-field";
import {
  orbitInputClassName,
  orbitPrimaryButtonClassName,
  orbitSecondaryButtonClassName
} from "@/lib/ui/orbit-form-styles";

type AdminAccessFormProps = {
  onBack: () => void;
};

export function AdminAccessForm({ onBack }: AdminAccessFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [masterCode, setMasterCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/admin/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName,
          email,
          masterCode
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "No fue posible validar el acceso administrador.");
        return;
      }

      router.replace("/workspace");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado al validar el acceso administrador.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Administración
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          Acceso administrador
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Valida tu identidad con nombre, correo y código maestro para entrar al panel
          global de Orbit Nexus.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="admin-full-name">
            Nombre completo
          </label>
          <input
            id="admin-full-name"
            className={orbitInputClassName}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="admin-email">
            Correo
          </label>
          <input
            id="admin-email"
            className={orbitInputClassName}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="admin-master-code">
            Código maestro
          </label>
          <PasswordField
            id="admin-master-code"
            className={`${orbitInputClassName} pr-11`}
            value={masterCode}
            onChange={setMasterCode}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className={`${orbitSecondaryButtonClassName} sm:w-auto`} type="button" onClick={onBack}>
          Volver al acceso general
        </button>

        <button
          className={`${orbitPrimaryButtonClassName} flex-1`}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Validando...
            </>
          ) : (
            "Ingresar como administradora"
          )}
        </button>
      </div>
    </form>
  );
}
