"use client";

import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  getConsultantAvailabilityLabel,
  type DashboardConsultantRecord,
  type DashboardLinkAction,
  type DashboardTimelineItem
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type ConsultantExecutiveHeaderProps = {
  session: SessionUser;
  consultant: DashboardConsultantRecord;
  actions: DashboardLinkAction[];
  priorityDeliverable?: DashboardTimelineItem | null;
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function ConsultantExecutiveHeader({
  session,
  consultant,
  actions,
  priorityDeliverable
}: ConsultantExecutiveHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.26),rgba(15,23,42,0.96))] px-6 py-6 shadow-[0_26px_80px_rgba(2,6,23,0.34)]">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-stretch">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
              Consultant workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Hola, {getFirstName(session.fullName)}.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-300">
              Prioriza entregables, responde feedback del lider y manten cada frente operativo bajo control sin perder visibilidad de riesgo ni capacidad.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              {consultant.specialty}
            </span>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              {getConsultantAvailabilityLabel(consultant.availability)}
            </span>
            <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
              {consultant.professionalStatus}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {actions.map((action, index) => (
              <Button
                key={`${action.href}-${action.label}`}
                asChild
                className={index === 0 ? "" : "bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"}
                variant={index === 0 ? "default" : "secondary"}
              >
                <Link href={action.href as Route}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Entrega prioritaria
          </p>

          {priorityDeliverable ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">
                  {priorityDeliverable.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {priorityDeliverable.subtitle}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Fecha clave
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{priorityDeliverable.meta}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Estado
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{priorityDeliverable.status}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-400">
              No hay una entrega prioritaria activa en este momento.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
