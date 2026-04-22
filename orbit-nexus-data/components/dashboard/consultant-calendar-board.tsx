"use client";

import { useMemo, useState } from "react";

import { ConsultantCalendarEventForm } from "@/components/dashboard/consultant-calendar-event-form";
import { OperationsPanel } from "@/components/dashboard/operations-panel";
import type {
  ConsultantCalendarEvent,
  ConsultantCalendarEventPriority,
  ConsultantCalendarEventStatus,
  ConsultantCalendarEventType,
  ConsultantCalendarMock,
  CreateConsultantCalendarEventInput
} from "@/lib/dashboard/calendar-data";
import { cn } from "@/lib/utils";

type ConsultantCalendarBoardProps = {
  data: ConsultantCalendarMock;
  composerOpen: boolean;
  onComposerOpenChange: (open: boolean) => void;
  onCreateEvent: (input: CreateConsultantCalendarEventInput) => void;
};

const weekdayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"] as const;

const typeLabels: Record<ConsultantCalendarEventType, string> = {
  delivery: "Entrega",
  meeting: "Reunion",
  review: "Revision",
  follow_up: "Seguimiento",
  deadline: "Fecha limite",
  focus_block: "Bloque",
  reminder: "Recordatorio"
};

const typeToneStyles: Record<ConsultantCalendarEventType, string> = {
  delivery: "bg-cyan-500/10 text-cyan-300",
  meeting: "bg-fuchsia-500/10 text-fuchsia-300",
  review: "bg-emerald-500/10 text-emerald-300",
  follow_up: "bg-sky-500/10 text-sky-300",
  deadline: "bg-rose-500/10 text-rose-300",
  focus_block: "bg-amber-500/10 text-amber-300",
  reminder: "bg-slate-500/10 text-slate-300"
};

const priorityToneStyles: Record<ConsultantCalendarEventPriority, string> = {
  high: "bg-rose-500/12 text-rose-300",
  medium: "bg-amber-500/12 text-amber-300",
  low: "bg-emerald-500/12 text-emerald-300"
};

const priorityLabels: Record<ConsultantCalendarEventPriority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja"
};

const statusLabels: Record<ConsultantCalendarEventStatus, string> = {
  scheduled: "Programado",
  confirmed: "Confirmado",
  pending: "Pendiente",
  at_risk: "En riesgo",
  completed: "Completado"
};

const statusToneStyles: Record<ConsultantCalendarEventStatus, string> = {
  scheduled: "bg-white/[0.06] text-slate-200",
  confirmed: "bg-emerald-500/10 text-emerald-300",
  pending: "bg-amber-500/10 text-amber-300",
  at_risk: "bg-rose-500/10 text-rose-300",
  completed: "bg-cyan-500/10 text-cyan-300"
};

function compareByStart(left: ConsultantCalendarEvent, right: ConsultantCalendarEvent) {
  return `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`);
}

function formatDayLabel(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

function formatEventTime(event: ConsultantCalendarEvent) {
  return `${event.startTime} - ${event.endTime}`;
}

function getPriorityScore(priority: ConsultantCalendarEventPriority) {
  if (priority === "high") {
    return 3;
  }

  if (priority === "medium") {
    return 2;
  }

  return 1;
}

function getDaySummary(event: ConsultantCalendarEvent[]) {
  const deliveries = event.filter((item) => item.type === "delivery" || item.type === "deadline").length;
  const meetings = event.filter(
    (item) => item.type === "meeting" || item.type === "review" || item.type === "follow_up"
  ).length;

  return { deliveries, meetings };
}

function CalendarMiniEventRow({ event }: { event: ConsultantCalendarEvent }) {
  return (
    <article className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                typeToneStyles[event.type]
              )}
            >
              {typeLabels[event.type]}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                priorityToneStyles[event.priority]
              )}
            >
              {priorityLabels[event.priority]}
            </span>
          </div>
          <p className="text-sm font-semibold leading-5 text-white">{event.title}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            {event.projectFolio} | {event.projectName}
          </p>
        </div>

        <div className="min-w-[84px] text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {event.startTime}
          </p>
          <p
            className={cn(
              "mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
              statusToneStyles[event.status]
            )}
          >
            {statusLabels[event.status]}
          </p>
        </div>
      </div>
    </article>
  );
}

function CalendarDetailCard({
  event,
  compact = false
}: {
  event: ConsultantCalendarEvent;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-[1.2rem] border border-white/10 bg-white/[0.04]",
        compact ? "px-3.5 py-3" : "px-4 py-4"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                typeToneStyles[event.type]
              )}
            >
              {typeLabels[event.type]}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                statusToneStyles[event.status]
              )}
            >
              {statusLabels[event.status]}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                priorityToneStyles[event.priority]
              )}
            >
              Prioridad {priorityLabels[event.priority]}
            </span>
          </div>
          <p className={cn("font-semibold text-white", compact ? "text-[13px] leading-5" : "text-sm")}>
            {event.title}
          </p>
          <p className={cn("text-slate-400", compact ? "text-xs leading-5" : "text-sm leading-6")}>
            {event.projectFolio} | {event.projectName}
          </p>
        </div>

        <div className={cn("text-right", compact ? "min-w-[96px]" : "min-w-[120px]")}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Horario
          </p>
          <p className={cn("mt-2 font-medium text-white", compact ? "text-xs" : "text-sm")}>
            {formatEventTime(event)}
          </p>
        </div>
      </div>
      {event.description ? (
        <p className={cn("mt-3 text-slate-400", compact ? "text-xs leading-5" : "text-sm leading-6")}>
          {event.description}
        </p>
      ) : null}
    </article>
  );
}

function EmptyEventState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.15rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-slate-400">
      {message}
    </div>
  );
}

function EventListBlock({
  eyebrow,
  title,
  items,
  emptyMessage
}: {
  eyebrow: string;
  title: string;
  items: ConsultantCalendarEvent[];
  emptyMessage: string;
}) {
  return (
    <OperationsPanel
      contentClassName="space-y-3"
      description=""
      eyebrow={eyebrow}
      title={title}
    >
      {items.length ? items.map((event) => <CalendarMiniEventRow key={event.id} event={event} />) : <EmptyEventState message={emptyMessage} />}
    </OperationsPanel>
  );
}

function AgendaSummaryPanel({
  todayEvents,
  upcomingEvents,
  highPriorityEvent
}: {
  todayEvents: ConsultantCalendarEvent[];
  upcomingEvents: ConsultantCalendarEvent[];
  highPriorityEvent: ConsultantCalendarEvent | null;
}) {
  return (
    <OperationsPanel
      contentClassName="space-y-4"
      description="Lectura concentrada de la agenda inmediata para que veas reuniones, entregas y el hito mas importante sin salir del calendario."
      eyebrow="Agenda operativa"
      title="Panel del dia"
    >
      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Hoy
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">Agenda del dia</h3>
          </div>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            {todayEvents.length} eventos
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {todayEvents.length ? (
            todayEvents.slice(0, 3).map((event) => <CalendarMiniEventRow key={event.id} event={event} />)
          ) : (
            <EmptyEventState message="Hoy no tienes eventos dentro del filtro activo." />
          )}
        </div>
      </div>

      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Proximo
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">Siguiente bloque</h3>
          </div>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            {upcomingEvents.length} visibles
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {upcomingEvents.length ? (
            upcomingEvents.slice(0, 3).map((event) => <CalendarMiniEventRow key={event.id} event={event} />)
          ) : (
            <EmptyEventState message="No hay eventos siguientes visibles para el filtro activo." />
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Prioridad alta
          </p>
          <p className="mt-2 text-base font-semibold text-white">
            {highPriorityEvent ? highPriorityEvent.title : "Sin foco critico"}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {highPriorityEvent
              ? `${highPriorityEvent.projectFolio} | ${highPriorityEvent.startTime}`
              : "No hay eventos en riesgo o de alta prioridad para hoy."}
          </p>
        </div>

        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Siguiente hito
          </p>
          <p className="mt-2 text-base font-semibold text-white">
            {upcomingEvents[0]?.title ?? "Agenda despejada"}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {upcomingEvents[0]
              ? `${upcomingEvents[0].projectFolio} | ${upcomingEvents[0].date} ${upcomingEvents[0].startTime}`
              : "No tienes hitos adicionales dentro del rango visible."}
          </p>
        </div>
      </div>
    </OperationsPanel>
  );
}

export function ConsultantCalendarBoard({
  data,
  composerOpen,
  onComposerOpenChange,
  onCreateEvent
}: ConsultantCalendarBoardProps) {
  const [selectedDate, setSelectedDate] = useState(data.initialSelectedDate);
  const [activeFilter, setActiveFilter] = useState<"all" | ConsultantCalendarEventType>("all");

  const filteredEvents = useMemo(
    () =>
      activeFilter === "all"
        ? data.events
        : data.events.filter((event) => event.type === activeFilter),
    [activeFilter, data.events]
  );

  const selectedDateEvents = useMemo(
    () =>
      filteredEvents
        .filter((event) => event.date === selectedDate)
        .sort(compareByStart),
    [filteredEvents, selectedDate]
  );

  const todayEvents = useMemo(
    () =>
      filteredEvents
        .filter((event) => event.date === data.todayDate)
        .sort(compareByStart),
    [data.todayDate, filteredEvents]
  );

  const upcomingEvents = useMemo(
    () =>
      filteredEvents
        .filter((event) => event.date >= data.todayDate)
        .sort(compareByStart)
        .slice(0, 5),
    [data.todayDate, filteredEvents]
  );

  const selectedDayPriority = useMemo(
    () =>
      [...selectedDateEvents]
        .sort((left, right) => getPriorityScore(right.priority) - getPriorityScore(left.priority))
        .at(0) ?? data.highPriorityEvents[0] ?? null,
    [data.highPriorityEvents, selectedDateEvents]
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(330px,0.95fr)] xl:items-start">
        <OperationsPanel
          actions={
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex h-11 items-center justify-center rounded-[1rem] bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
                onClick={() => onComposerOpenChange(!composerOpen)}
                type="button"
              >
                {composerOpen ? "Cerrar panel" : "Agregar evento"}
              </button>
              <button
                className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
                onClick={() => setSelectedDate(data.todayDate)}
                type="button"
              >
                Ir a hoy
              </button>
            </div>
          }
          className="min-w-0"
          contentClassName="space-y-5"
          description="Vista mensual para ordenar entregas, reuniones, revisiones y bloques de trabajo con mejor lectura de prioridad."
          eyebrow="Calendario principal"
          title={data.monthLabel}
        >
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Leyenda operativa
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.filters.slice(1).map((filter) => {
                  const toneKey = filter.id as ConsultantCalendarEventType;

                  return (
                    <span
                      key={filter.id}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                        typeToneStyles[toneKey]
                      )}
                    >
                      {filter.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Hoy
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{data.weeklyCounts.today}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Semana
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{data.weeklyCounts.thisWeek}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Prioridad alta
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{data.highPriorityEvents.length}</p>
              </div>
            </div>
          </div>

          <ConsultantCalendarEventForm
            defaultDate={selectedDate}
            isOpen={composerOpen}
            onCancel={() => onComposerOpenChange(false)}
            onSubmit={onCreateEvent}
            projectOptions={data.projectOptions}
          />

          <div className="flex flex-wrap gap-2">
            {data.filters.map((filter) => {
              const isActive = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors",
                    isActive
                      ? "bg-cyan-500/15 text-cyan-200"
                      : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                  )}
                  onClick={() => setActiveFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="rounded-[1rem] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                {label}
              </div>
            ))}

            {data.days.map((day) => {
              const dayEvents = day.events.filter(
                (event) => activeFilter === "all" || event.type === activeFilter
              );
              const isSelected = selectedDate === day.date;
              const hasHighPriority = dayEvents.some((event) => event.priority === "high");
              const summary = getDaySummary(dayEvents);
              const leadEvent = dayEvents.find(
                (event) =>
                  event.type === "delivery" ||
                  event.type === "meeting" ||
                  event.type === "deadline"
              );

              return (
                <button
                  key={day.date}
                  className={cn(
                    "min-h-[9.5rem] rounded-[1.15rem] border px-3 py-3 text-left transition-all",
                    day.isCurrentMonth
                      ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                      : "border-white/6 bg-white/[0.02] text-slate-500",
                    isSelected ? "border-cyan-400/40 bg-cyan-500/[0.08]" : "",
                    day.isToday ? "shadow-[inset_0_0_0_1px_rgba(34,211,238,0.28)]" : ""
                  )}
                  onClick={() => setSelectedDate(day.date)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                        day.isToday ? "bg-cyan-500/15 text-cyan-200" : "text-white"
                      )}
                    >
                      {day.dayNumber}
                    </span>

                    <div className="flex items-center gap-2">
                      {hasHighPriority ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]" />
                      ) : null}
                      {dayEvents.length ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {dayEvents.length}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {leadEvent ? (
                    <div className="mt-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          typeToneStyles[leadEvent.type]
                        )}
                      >
                        {typeLabels[leadEvent.type]}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "rounded-[0.85rem] border border-white/6 px-2 py-1 text-[10px] font-medium leading-4",
                          typeToneStyles[event.type]
                        )}
                      >
                        <p className="truncate">{event.title}</p>
                      </div>
                    ))}
                    {dayEvents.length > 3 ? (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        +{dayEvents.length - 3} mas
                      </p>
                    ) : null}
                  </div>

                  {(summary.deliveries || summary.meetings) && day.isCurrentMonth ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {summary.deliveries ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                          {summary.deliveries} entrega{summary.deliveries > 1 ? "s" : ""}
                        </span>
                      ) : null}
                      {summary.meetings ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-300">
                          {summary.meetings} reunion{summary.meetings > 1 ? "es" : ""}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </OperationsPanel>

        <AgendaSummaryPanel
          highPriorityEvent={selectedDayPriority}
          todayEvents={todayEvents}
          upcomingEvents={upcomingEvents}
        />
      </section>

      <section className="space-y-4">
        <OperationsPanel
          contentClassName="space-y-2"
          description="Hito o riesgo mas relevante para mantener atencion operativa sobre el dia seleccionado."
          eyebrow="Prioridad del dia"
          title={selectedDayPriority ? selectedDayPriority.title : "Sin prioridad critica"}
        >
          {selectedDayPriority ? (
            <CalendarDetailCard compact event={selectedDayPriority} />
          ) : (
            <EmptyEventState message="No hay eventos de prioridad alta o media para el rango activo." />
          )}
        </OperationsPanel>

        <OperationsPanel
          contentClassName="space-y-2"
          description="Eventos exactos del dia activo con horario, proyecto asociado y contexto inmediato."
          eyebrow="Detalle"
          title={formatDayLabel(selectedDate)}
        >
          {selectedDateEvents.length ? (
            selectedDateEvents.map((event) => (
              <CalendarDetailCard compact key={event.id} event={event} />
            ))
          ) : (
            <EmptyEventState message="No hay eventos para la fecha seleccionada dentro del filtro activo." />
          )}
        </OperationsPanel>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <EventListBlock
          eyebrow="Vencimientos"
          emptyMessage="No hay vencimientos proximos en este momento."
          items={data.upcomingDeadlines}
          title="Proximos vencimientos"
        />
        <EventListBlock
          eyebrow="Reuniones"
          emptyMessage="No hay reuniones confirmadas para esta semana."
          items={data.confirmedMeetings}
          title="Reuniones de la semana"
        />
        <EventListBlock
          eyebrow="Foco"
          emptyMessage="No tienes bloques de trabajo apartados aun."
          items={data.focusBlocks}
          title="Bloques de trabajo"
        />
        <EventListBlock
          eyebrow="Interno"
          emptyMessage="No hay recordatorios internos pendientes."
          items={data.reminders}
          title="Recordatorios"
        />
      </section>
    </div>
  );
}
