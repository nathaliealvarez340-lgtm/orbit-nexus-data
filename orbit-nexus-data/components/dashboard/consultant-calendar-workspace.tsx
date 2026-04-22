"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { ConsultantCalendarBoard } from "@/components/dashboard/consultant-calendar-board";
import { ConsultantCalendarButton } from "@/components/dashboard/consultant-calendar-button";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { OperationsStatCard } from "@/components/dashboard/operations-stat-card";
import { Button } from "@/components/ui/button";
import {
  buildConsultantCalendarMock,
  createConsultantCalendarEvent,
  getConsultantCalendarMock,
  getConsultantCalendarSearchItems,
  type ConsultantCalendarEvent
} from "@/lib/dashboard/calendar-data";
import {
  getConsultantDashboardMock,
  getConsultantDashboardSearchItems
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type ConsultantCalendarWorkspaceProps = {
  session: SessionUser;
};

export function ConsultantCalendarWorkspace({
  session
}: ConsultantCalendarWorkspaceProps) {
  const dashboardData = getConsultantDashboardMock(session);
  const seedCalendar = useMemo(() => getConsultantCalendarMock(session), [session.accessCode]);
  const [events, setEvents] = useState<ConsultantCalendarEvent[]>(seedCalendar.events);
  const calendarData = useMemo(() => buildConsultantCalendarMock(events), [events]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  return (
    <OperationsShell
      session={session}
      portalLabel="CONSULTANT"
      portalTitle="Agenda operativa"
      subtitle="Administra tu semana con una lectura clara de entregables, reuniones, fechas clave y bloques de trabajo."
      showHero={false}
      navItems={[
        { label: "Dashboard", href: "/workspace" },
        { label: "Calendario", href: "/workspace/calendar", active: true },
        { label: "Chat", href: "/workspace/chat" },
        {
          label: "Entregables",
          href: "/workspace#consultant-deliverables",
          badge: String(dashboardData.upcomingDeliverables.length)
        },
        {
          label: "Documentos",
          href: "/workspace#consultant-assets",
          badge: String(dashboardData.recentAssets.length)
        }
      ]}
      headerActions={
        <>
          <ConsultantCalendarButton
            active
            eventCount={calendarData.upcomingEvents.length}
          />
          <div className="flex h-16 min-w-[132px] flex-col justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.05] px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Hoy
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {calendarData.todayEvents.length} eventos
            </p>
          </div>
        </>
      }
      showProfileCard={false}
      contentClassName="mx-auto w-full max-w-[1500px]"
      searchItems={[
        ...getConsultantDashboardSearchItems(dashboardData),
        ...getConsultantCalendarSearchItems(calendarData)
      ]}
    >
      <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/84 px-6 py-6 shadow-[0_18px_44px_rgba(2,6,23,0.22)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              Planeacion visible
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Calendario
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Resuelve rapido que tienes hoy, que vence esta semana y que proyecto necesita atencion antes del siguiente corte.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-2xl px-5"
              onClick={() => setIsComposerOpen((current) => !current)}
              type="button"
            >
              {isComposerOpen ? "Cerrar formulario" : "Agregar evento"}
            </Button>
            <Button asChild className="rounded-2xl bg-white/[0.06] px-5 text-slate-100 hover:bg-white/[0.1]" variant="secondary">
              <Link href="/workspace">Volver al dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/workspace/chat">Abrir chat</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {calendarData.summaries.map((summary) => (
          <OperationsStatCard
            key={summary.label}
            detail={summary.detail}
            label={summary.label}
            tone={summary.tone}
            value={summary.value}
          />
        ))}
      </div>

      <ConsultantCalendarBoard
        composerOpen={isComposerOpen}
        data={calendarData}
        onComposerOpenChange={setIsComposerOpen}
        onCreateEvent={(input) => {
          setEvents((current) => [
            ...current,
            createConsultantCalendarEvent(input, current, session.tenantId ?? session.companyId)
          ]);
          setIsComposerOpen(false);
        }}
      />
    </OperationsShell>
  );
}
