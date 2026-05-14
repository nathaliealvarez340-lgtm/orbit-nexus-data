"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type ActivationSuccessStatusProps = {
  sessionId: string;
};

type ActivationStatus = {
  companyName: string;
  plan: "CORE" | "GROWTH" | "ENTERPRISE";
  totalAmountMxn: number;
  status: string;
  contactEmail: string;
  registrationCode: string | null;
  companyReady: boolean;
  companyId: string | null;
};

export function ActivationSuccessStatus({ sessionId }: ActivationSuccessStatusProps) {
  const [status, setStatus] = useState<ActivationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function pollStatus() {
      try {
        const response = await fetch(`/api/billing/activation-status?session_id=${sessionId}`, {
          cache: "no-store"
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "No fue posible cargar la activación.");
        }

        if (!active) {
          return;
        }

        setStatus(payload?.data ?? null);
        setError(null);

        if (!payload?.data?.companyReady) {
          timeoutId = setTimeout(pollStatus, 3000);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "No fue posible confirmar la activación."
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    pollStatus();

    return () => {
      active = false;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sessionId]);

  async function handleCopyCode() {
    if (!status?.registrationCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(status.registrationCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="w-full rounded-[2rem] border border-white/12 bg-slate-950/80 p-8 shadow-[0_28px_80px_rgba(2,6,23,0.42)] backdrop-blur-2xl">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
          Activación comercial
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          {status?.companyReady ? "¡FELICIDADES!" : "Estamos confirmando tu pago"}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">
          {status?.companyReady
            ? "Tu empresa se activó correctamente. Ahora podrás disfrutar de los beneficios exclusivos que tenemos para ti."
            : "El pago ya regresó correctamente. Estamos esperando la confirmación final de Stripe para terminar la activación automática."}
        </p>
        {status?.companyReady ? (
          <p className="max-w-2xl text-sm leading-7 text-slate-400">
            Para poder ingresar a tu cuenta copia el siguiente código único de autenticación.
            Es importante que lo guardes en un lugar seguro, ya que es tu clave de acceso a
            ORBIT NEXUS.
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Empresa</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {status?.companyName ?? "Confirmando..."}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Plan</p>
          <p className="mt-3 text-lg font-semibold text-white">{status?.plan ?? "Confirmando..."}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Total mensual</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {typeof status?.totalAmountMxn === "number"
              ? `$${status.totalAmountMxn.toLocaleString("es-MX")} MXN`
              : "Confirmando..."}
          </p>
        </div>
      </div>

      <button
        className="mt-6 w-full rounded-[1.65rem] border border-white/10 bg-gradient-to-br from-cyan-500/12 via-slate-950/70 to-blue-500/14 px-6 py-6 text-left transition hover:border-cyan-300/35 hover:from-cyan-500/16"
        type="button"
        onClick={handleCopyCode}
      >
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
          Código único de autenticación
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-[0.04em] text-white">
          {status?.registrationCode ?? "Generando..."}
        </p>
        {copied ? (
          <p className="mt-3 text-sm font-semibold text-cyan-200">Código copiado correctamente</p>
        ) : null}
      </button>

      {error ? (
        <div className="mt-6 rounded-[1.35rem] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <a href="/login">INICIAR SESIÓN</a>
        </Button>
        {!status?.companyReady || isLoading ? (
          <Button
            className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
            type="button"
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Actualizar estado
          </Button>
        ) : null}
      </div>
    </div>
  );
}
