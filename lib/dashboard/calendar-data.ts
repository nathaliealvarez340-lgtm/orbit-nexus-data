import type { Route } from "next";

import {
  getInitialDashboardProjects,
  getProjectBySlug,
  type DashboardSearchItem
} from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

export type ConsultantCalendarEventType =
  | "delivery"
  | "meeting"
  | "review"
  | "follow_up"
  | "deadline"
  | "focus_block"
  | "reminder";

export type ConsultantCalendarEventStatus =
  | "scheduled"
  | "confirmed"
  | "pending"
  | "at_risk"
  | "completed";

export type ConsultantCalendarEventPriority = "high" | "medium" | "low";

export type ConsultantCalendarEvent = {
  id: string;
  tenantId: string | null;
  title: string;
  type: ConsultantCalendarEventType;
  date: string;
  startTime: string;
  endTime: string;
  projectFolio: string;
  projectName: string;
  projectSlug: string;
  status: ConsultantCalendarEventStatus;
  priority: ConsultantCalendarEventPriority;
  description?: string;
  href: Route;
};

export type ConsultantCalendarProjectOption = {
  tenantId: string | null;
  slug: string;
  folio: string;
  name: string;
  href: Route;
};

export type CreateConsultantCalendarEventInput = {
  title: string;
  type: ConsultantCalendarEventType;
  projectSlug: string;
  date: string;
  startTime: string;
  endTime: string;
  priority: ConsultantCalendarEventPriority;
  description?: string;
  status: Extract<ConsultantCalendarEventStatus, "pending" | "confirmed" | "completed">;
};

export type ConsultantCalendarDay = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: ConsultantCalendarEvent[];
};

export type ConsultantCalendarSummary = {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "emerald" | "amber" | "slate";
};

export type ConsultantCalendarMock = {
  monthLabel: string;
  initialSelectedDate: string;
  todayDate: string;
  days: ConsultantCalendarDay[];
  events: ConsultantCalendarEvent[];
  upcomingEvents: ConsultantCalendarEvent[];
  todayEvents: ConsultantCalendarEvent[];
  summaries: ConsultantCalendarSummary[];
  projectOptions: ConsultantCalendarProjectOption[];
  upcomingDeadlines: ConsultantCalendarEvent[];
  confirmedMeetings: ConsultantCalendarEvent[];
  focusBlocks: ConsultantCalendarEvent[];
  reminders: ConsultantCalendarEvent[];
  highPriorityEvents: ConsultantCalendarEvent[];
  weeklyCounts: {
    today: number;
    thisWeek: number;
    deliveries: number;
    meetings: number;
  };
  filters: Array<{ id: "all" | ConsultantCalendarEventType; label: string }>;
};

const TODAY_DATE = "2026-04-20";
const MONTH_YEAR = 2026;
const MONTH_INDEX = 3;

const monthLabels = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
] as const;

function createDateKey(year: number, monthIndex: number, day: number) {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function parseDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function compareEventsByStart(left: ConsultantCalendarEvent, right: ConsultantCalendarEvent) {
  return (
    parseDateTime(left.date, left.startTime).getTime() -
    parseDateTime(right.date, right.startTime).getTime()
  );
}

function getWeekdayIndex(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day).getDay();
}

function createEvent(params: Omit<ConsultantCalendarEvent, "href"> & { href: string }) {
  return {
    ...params,
    href: params.href as Route
  };
}

function isSameOrAfterToday(event: ConsultantCalendarEvent) {
  return parseDateTime(event.date, event.startTime).getTime() >= parseDateTime(TODAY_DATE, "00:00").getTime();
}

function getCurrentWeekRange() {
  return {
    start: TODAY_DATE,
    end: "2026-04-26"
  };
}

function getProjectOptions(tenantId: string | null): ConsultantCalendarProjectOption[] {
  return getInitialDashboardProjects(tenantId).map((project) => ({
    tenantId: project.tenantId,
    slug: project.slug,
    folio: project.folio,
    name: project.name,
    href: project.href as Route
  }));
}

function buildCalendarDays(events: ConsultantCalendarEvent[]) {
  const firstDayOfMonth = getWeekdayIndex(MONTH_YEAR, MONTH_INDEX, 1);
  const normalizedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(MONTH_YEAR, MONTH_INDEX + 1, 0).getDate();
  const daysInPreviousMonth = new Date(MONTH_YEAR, MONTH_INDEX, 0).getDate();
  const totalCells = 35;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayOffset = index - normalizedFirstDay + 1;
    const isCurrentMonth = dayOffset > 0 && dayOffset <= daysInMonth;

    let dayNumber = dayOffset;
    let year = MONTH_YEAR;
    let monthIndex = MONTH_INDEX;

    if (!isCurrentMonth) {
      if (dayOffset <= 0) {
        dayNumber = daysInPreviousMonth + dayOffset;
        monthIndex = MONTH_INDEX - 1;
      } else {
        dayNumber = dayOffset - daysInMonth;
        monthIndex = MONTH_INDEX + 1;
      }
    }

    if (monthIndex < 0) {
      monthIndex = 11;
      year -= 1;
    }

    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }

    const date = createDateKey(year, monthIndex, dayNumber);

    return {
      date,
      dayNumber,
      isCurrentMonth,
      isToday: date === TODAY_DATE,
      events: events.filter((event) => event.date === date).sort(compareEventsByStart)
    };
  });
}

function createCalendarEvents(tenantId: string | null) {
  const projects = getInitialDashboardProjects(tenantId);
  const expansionProject = getProjectBySlug("expansion-operativa-norte", projects)!;
  const riskProject = getProjectBySlug("transformacion-comercial-q3", projects)!;
  const crmProject = getProjectBySlug("implementacion-crm-regional", projects)!;

  return [
    createEvent({
      id: "cal-evt-1",
      tenantId,
      title: "Entrega de hallazgos operativos",
      type: "delivery",
      date: "2026-04-20",
      startTime: "10:00",
      endTime: "10:30",
      projectFolio: expansionProject.folio,
      projectName: expansionProject.name,
      projectSlug: expansionProject.slug,
      status: "pending",
      priority: "high",
      description: "Version final para el corte semanal con lectura ejecutiva y siguiente paso recomendado.",
      href: expansionProject.href
    }),
    createEvent({
      id: "cal-evt-2",
      tenantId,
      title: "Bloque de trabajo CRM",
      type: "focus_block",
      date: "2026-04-20",
      startTime: "14:00",
      endTime: "16:00",
      projectFolio: crmProject.folio,
      projectName: crmProject.name,
      projectSlug: crmProject.slug,
      status: "scheduled",
      priority: "medium",
      description: "Ventana de concentracion para cerrar blueprint funcional y riesgos de arranque.",
      href: crmProject.href
    }),
    createEvent({
      id: "cal-evt-3",
      tenantId,
      title: "Revision con liderazgo",
      type: "review",
      date: "2026-04-21",
      startTime: "09:30",
      endTime: "10:00",
      projectFolio: expansionProject.folio,
      projectName: expansionProject.name,
      projectSlug: expansionProject.slug,
      status: "confirmed",
      priority: "medium",
      description: "Chequeo corto para validar narrativa del entregable y riesgos abiertos.",
      href: expansionProject.href
    }),
    createEvent({
      id: "cal-evt-4",
      tenantId,
      title: "Reunion de seguimiento comercial",
      type: "meeting",
      date: "2026-04-22",
      startTime: "12:00",
      endTime: "12:45",
      projectFolio: riskProject.folio,
      projectName: riskProject.name,
      projectSlug: riskProject.slug,
      status: "scheduled",
      priority: "medium",
      description: "Alineacion con el lider para ajustar la siguiente entrega del frente comercial.",
      href: riskProject.href
    }),
    createEvent({
      id: "cal-evt-5",
      tenantId,
      title: "Fecha limite resumen ejecutivo",
      type: "deadline",
      date: "2026-04-23",
      startTime: "17:00",
      endTime: "17:30",
      projectFolio: riskProject.folio,
      projectName: riskProject.name,
      projectSlug: riskProject.slug,
      status: "at_risk",
      priority: "high",
      description: "El resumen ejecutivo debe cerrarse hoy para evitar escalacion con liderazgo.",
      href: riskProject.href
    }),
    createEvent({
      id: "cal-evt-6",
      tenantId,
      title: "Entrega blueprint CRM",
      type: "delivery",
      date: "2026-04-24",
      startTime: "13:00",
      endTime: "14:00",
      projectFolio: crmProject.folio,
      projectName: crmProject.name,
      projectSlug: crmProject.slug,
      status: "scheduled",
      priority: "high",
      description: "Carga operativa del blueprint funcional con anexo de dependencias tecnicas.",
      href: crmProject.href
    }),
    createEvent({
      id: "cal-evt-7",
      tenantId,
      title: "Bloque de trabajo analitico",
      type: "focus_block",
      date: "2026-04-24",
      startTime: "15:00",
      endTime: "17:00",
      projectFolio: expansionProject.folio,
      projectName: expansionProject.name,
      projectSlug: expansionProject.slug,
      status: "confirmed",
      priority: "low",
      description: "Sesion de concentracion para consolidar evidencia y preparar siguiente avance.",
      href: expansionProject.href
    }),
    createEvent({
      id: "cal-evt-8",
      tenantId,
      title: "Seguimiento con lider",
      type: "follow_up",
      date: "2026-04-27",
      startTime: "09:00",
      endTime: "09:20",
      projectFolio: expansionProject.folio,
      projectName: expansionProject.name,
      projectSlug: expansionProject.slug,
      status: "confirmed",
      priority: "medium",
      description: "Punto de control rapido para revisar prioridades de la semana.",
      href: expansionProject.href
    }),
    createEvent({
      id: "cal-evt-9",
      tenantId,
      title: "Revision final de riesgos",
      type: "review",
      date: "2026-04-28",
      startTime: "11:00",
      endTime: "11:45",
      projectFolio: riskProject.folio,
      projectName: riskProject.name,
      projectSlug: riskProject.slug,
      status: "pending",
      priority: "high",
      description: "Validacion del mapa de riesgos y de la narrativa ejecutiva antes del siguiente hito.",
      href: riskProject.href
    }),
    createEvent({
      id: "cal-evt-10",
      tenantId,
      title: "Recordatorio de anexos",
      type: "reminder",
      date: "2026-04-29",
      startTime: "16:30",
      endTime: "16:45",
      projectFolio: crmProject.folio,
      projectName: crmProject.name,
      projectSlug: crmProject.slug,
      status: "scheduled",
      priority: "low",
      description: "Subir evidencia complementaria y notas de arranque antes del cierre del dia.",
      href: crmProject.href
    })
  ].sort(compareEventsByStart);
}

export function buildConsultantCalendarMock(events: ConsultantCalendarEvent[]): ConsultantCalendarMock {
  const { start, end } = getCurrentWeekRange();
  const tenantId = events[0]?.tenantId ?? null;
  const projectOptions = getProjectOptions(tenantId);
  const sortedEvents = [...events].sort(compareEventsByStart);
  const todayEvents = sortedEvents.filter((event) => event.date === TODAY_DATE);
  const thisWeekEvents = sortedEvents.filter((event) => event.date >= start && event.date <= end);
  const upcomingEvents = sortedEvents.filter(isSameOrAfterToday).slice(0, 6);
  const upcomingDeadlines = sortedEvents.filter(
    (event) =>
      isSameOrAfterToday(event) &&
      (event.type === "delivery" || event.type === "deadline")
  ).slice(0, 4);
  const confirmedMeetings = sortedEvents.filter(
    (event) =>
      event.date >= start &&
      event.date <= end &&
      (event.type === "meeting" || event.type === "review" || event.type === "follow_up")
  ).slice(0, 4);
  const focusBlocks = sortedEvents.filter(
    (event) => isSameOrAfterToday(event) && event.type === "focus_block"
  ).slice(0, 4);
  const reminders = sortedEvents.filter(
    (event) => isSameOrAfterToday(event) && event.type === "reminder"
  ).slice(0, 4);
  const highPriorityEvents = sortedEvents.filter(
    (event) => isSameOrAfterToday(event) && event.priority === "high" && event.status !== "completed"
  ).slice(0, 4);
  const thisWeekDeliveries = thisWeekEvents.filter(
    (event) => event.type === "delivery" || event.type === "deadline"
  ).length;
  const thisWeekMeetings = thisWeekEvents.filter(
    (event) => event.type === "meeting" || event.type === "review" || event.type === "follow_up"
  ).length;

  return {
    monthLabel: `${monthLabels[MONTH_INDEX]} ${MONTH_YEAR}`,
    initialSelectedDate: TODAY_DATE,
    todayDate: TODAY_DATE,
    days: buildCalendarDays(sortedEvents),
    events: sortedEvents,
    upcomingEvents,
    todayEvents,
    summaries: [
      {
        label: "Eventos de hoy",
        value: String(todayEvents.length),
        detail: "Agenda inmediata para ordenar foco, reuniones y ventanas de entrega.",
        tone: "blue"
      },
      {
        label: "Eventos esta semana",
        value: String(thisWeekEvents.length),
        detail: "Lectura consolidada del volumen operativo entre hoy y el siguiente domingo.",
        tone: "slate"
      },
      {
        label: "Entregas pendientes",
        value: String(thisWeekDeliveries),
        detail: "Frentes que deben cerrarse antes del siguiente corte operativo.",
        tone: "amber"
      },
      {
        label: "Reuniones confirmadas",
        value: String(thisWeekMeetings),
        detail: "Puntos de seguimiento visibles para no perder decisiones ni handoffs.",
        tone: "emerald"
      }
    ],
    projectOptions,
    upcomingDeadlines,
    confirmedMeetings,
    focusBlocks,
    reminders,
    highPriorityEvents,
    weeklyCounts: {
      today: todayEvents.length,
      thisWeek: thisWeekEvents.length,
      deliveries: thisWeekDeliveries,
      meetings: thisWeekMeetings
    },
    filters: [
      { id: "all", label: "Todos" },
      { id: "delivery", label: "Entregas" },
      { id: "meeting", label: "Reuniones" },
      { id: "review", label: "Revisiones" },
      { id: "follow_up", label: "Seguimientos" },
      { id: "deadline", label: "Fechas limite" },
      { id: "focus_block", label: "Bloques de trabajo" },
      { id: "reminder", label: "Recordatorios" }
    ]
  };
}

export function createConsultantCalendarEvent(
  input: CreateConsultantCalendarEventInput,
  existingEvents: ConsultantCalendarEvent[],
  tenantId: string | null
): ConsultantCalendarEvent {
  const projectOptions = getProjectOptions(tenantId);
  const project = projectOptions.find((item) => item.slug === input.projectSlug) ?? projectOptions[0];
  const nextIndex = existingEvents.length + 1;

  return {
    id: `cal-evt-user-${nextIndex}`,
    tenantId,
    title: input.title.trim(),
    type: input.type,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    projectFolio: project.folio,
    projectName: project.name,
    projectSlug: project.slug,
    status: input.status,
    priority: input.priority,
    description: input.description?.trim() || undefined,
    href: project.href
  };
}

export function getConsultantCalendarMock(_session: SessionUser): ConsultantCalendarMock {
  const tenantId = _session.tenantId ?? _session.companyId ?? null;

  return buildConsultantCalendarMock(createCalendarEvents(tenantId));
}

function getEventTypeLabel(type: ConsultantCalendarEventType) {
  const labels: Record<ConsultantCalendarEventType, string> = {
    delivery: "Entrega",
    meeting: "Reunion",
    review: "Revision",
    follow_up: "Seguimiento",
    deadline: "Fecha limite",
    focus_block: "Bloque de trabajo",
    reminder: "Recordatorio"
  };

  return labels[type];
}

export function getConsultantCalendarSearchItems(data: ConsultantCalendarMock): DashboardSearchItem[] {
  return data.events.map((event) => ({
    id: `calendar-${event.id}`,
    type: "activity",
    title: event.title,
    subtitle: `${getEventTypeLabel(event.type)} | ${event.projectFolio} | ${event.date} ${event.startTime}`,
    href: "/workspace/calendar",
    keywords: [
      event.projectName,
      event.projectFolio,
      getEventTypeLabel(event.type),
      event.priority,
      event.status,
      event.date,
      event.startTime
    ]
  }));
}
