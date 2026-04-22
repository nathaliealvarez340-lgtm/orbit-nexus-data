"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LeaderExecutiveHeaderProps = {
  firstName: string;
  subtitle: string;
  portfolioStatus: "stable" | "risk" | "intervention";
};

const portfolioStatusStyles = {
  stable: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  risk: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  intervention: "border-rose-500/20 bg-rose-500/10 text-rose-300"
} as const;

const portfolioStatusLabels = {
  stable: "Portafolio estable",
  risk: "Portafolio en riesgo",
  intervention: "Requiere intervencion"
} as const;

export function LeaderExecutiveHeader({
  firstName,
  subtitle,
  portfolioStatus
}: LeaderExecutiveHeaderProps) {
  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-slate-950/88 px-6 py-6 shadow-[0_20px_50px_rgba(2,6,23,0.28)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
              Centro de control
            </span>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                portfolioStatusStyles[portfolioStatus]
              )}
            >
              {portfolioStatusLabels[portfolioStatus]}
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-[3.2rem]">
            Hola, {firstName}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-stretch gap-3">
          <Button asChild className="h-11 min-w-[170px] rounded-2xl px-5">
            <Link href="/workspace/projects/create">Crear proyecto</Link>
          </Button>
          <Button
            asChild
            className="h-11 min-w-[170px] rounded-2xl bg-white/[0.06] px-5 text-slate-100 hover:bg-white/[0.1]"
            variant="secondary"
          >
            <Link href="#leader-alerts">Ver alertas</Link>
          </Button>
          <Button
            asChild
            className="h-11 min-w-[170px] rounded-2xl bg-white/[0.06] px-5 text-slate-100 hover:bg-white/[0.1]"
            variant="secondary"
          >
            <Link href="/workspace/consultants/register">Registrar consultor</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
