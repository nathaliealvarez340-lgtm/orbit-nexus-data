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

  return (
    <div className="w-full rounded-[2rem] border border-white/12 bg-slate-950/80 p-8 shadow-[0_28px_80px_rgba(2,6,23,0.42)] backdrop-blur-2xl">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
          Activación comercial
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          {status?.companyReady ? "Empresa activada correctamente" : "Estamos confirmando tu pago"}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">
          {status?.companyReady
            ? "Tu empresa ya existe dentro de Orbit Nexus y el código maestro ya está listo para registrar a tus líderes."
            : "El pago ya regresó correctamente. Estamos esperando la confirmación final de Stripe para terminar la activación automática."}
        </p>
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

      <div className="mt-6 rounded-[1.65rem] border border-white/10 bg-gradient-to-br from-cyan-500/12 via-slate-950/70 to-blue-500/14 px-6 py-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Código maestro</p>
        <p className="mt-3 text-3xl font-semibold tracking-[0.04em] text-white">
          {status?.registrationCode ?? "Generando..."}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Este código es privado y sirve para registrar líderes dentro de tu empresa. Comparte el código solo con usuarios previamente autorizados.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-[1.35rem] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <a href="/login">Ir a iniciar sesión</a>
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
