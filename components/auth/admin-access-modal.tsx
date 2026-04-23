"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { setBrowserSession } from "@/lib/auth/browser-session";
import { PasswordField } from "@/components/auth/password-field";

type AdminAccessModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminAccessModal({ open, onClose }: AdminAccessModalProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [masterCode, setMasterCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) {
    return null;
  }

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

      setBrowserSession(payload?.data?.accessCode ?? "SUPERADMIN");
      router.replace("/workspace");
      router.refresh();
    } catch {
      setError("Ocurrio un error inesperado al validar el acceso administrador.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.8rem] border border-white/12 bg-slate-950/96 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.52)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Administracion
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Acceso administrador</h3>
          </div>
          <button
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            type="button"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="admin-full-name">
              Nombre completo
            </label>
            <input
              id="admin-full-name"
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
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
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="admin-master-code">
              Codigo maestro
            </label>
            <PasswordField
              id="admin-master-code"
              className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 pr-11 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5de0e6]/40"
              value={masterCode}
              onChange={setMasterCode}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#5de0e6] to-[#004aad] px-4 font-semibold text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] transition hover:opacity-95"
            type="submit"
          >
            {isSubmitting ? "Validando..." : "Ingresar como administradora"}
          </button>
        </form>
      </div>
    </div>
  );
}

