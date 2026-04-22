"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ConsultantCalendarEventPriority,
  ConsultantCalendarEventStatus,
  ConsultantCalendarEventType,
  ConsultantCalendarProjectOption,
  CreateConsultantCalendarEventInput
} from "@/lib/dashboard/calendar-data";
import { cn } from "@/lib/utils";

type ConsultantCalendarEventFormProps = {
  defaultDate: string;
  isOpen: boolean;
  projectOptions: ConsultantCalendarProjectOption[];
  onCancel: () => void;
  onSubmit: (input: CreateConsultantCalendarEventInput) => void;
};

const typeOptions: Array<{ value: ConsultantCalendarEventType; label: string }> = [
  { value: "delivery", label: "Entrega" },
  { value: "meeting", label: "Reunion" },
  { value: "review", label: "Revision" },
  { value: "reminder", label: "Recordatorio" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "focus_block", label: "Bloque de trabajo" }
];

const priorityOptions: Array<{ value: ConsultantCalendarEventPriority; label: string }> = [
  { value: "high", label: "Alta" },
  { value: "medium", label: "Media" },
  { value: "low", label: "Baja" }
];

const statusOptions: Array<{ value: Extract<ConsultantCalendarEventStatus, "pending" | "confirmed" | "completed">; label: string }> = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "completed", label: "Completado" }
];

export function ConsultantCalendarEventForm({
  defaultDate,
  isOpen,
  projectOptions,
  onCancel,
  onSubmit
}: ConsultantCalendarEventFormProps) {
  const defaultProjectSlug = projectOptions[0]?.slug ?? "";
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ConsultantCalendarEventType>("delivery");
  const [projectSlug, setProjectSlug] = useState(defaultProjectSlug);
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [priority, setPriority] = useState<ConsultantCalendarEventPriority>("medium");
  const [status, setStatus] = useState<Extract<ConsultantCalendarEventStatus, "pending" | "confirmed" | "completed">>("pending");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDate(defaultDate);
    setProjectSlug((current) => current || defaultProjectSlug);
  }, [defaultDate, defaultProjectSlug, isOpen]);

  const isValid = useMemo(() => {
    return Boolean(title.trim() && projectSlug && date && startTime && endTime);
  }, [date, endTime, projectSlug, startTime, title]);

  if (!isOpen) {
    return null;
  }

  return (
    <section className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_36px_rgba(2,6,23,0.18)]">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Nuevo evento
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">Agregar evento al calendario</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Registra una entrega, reunion, recordatorio o bloque de trabajo para ordenar tu agenda operativa.
          </p>
        </div>

        <button
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
          onClick={onCancel}
          type="button"
        >
          Cerrar
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Titulo
          </span>
          <input
            className="h-12 w-full rounded-[1rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/40"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Revision de entregable CRM"
            value={title}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Proyecto relacionado
          </span>
          <select
            className="h-12 w-full rounded-[1rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
            onChange={(event) => setProjectSlug(event.target.value)}
            value={projectSlug}
          >
            {projectOptions.map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.folio} | {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Tipo
          </span>
          <select
            className="h-12 w-full rounded-[1rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
            onChange={(event) => setType(event.target.value as ConsultantCalendarEventType)}
            value={type}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Prioridad
          </span>
          <select
            className="h-12 w-full rounded-[1rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
            onChange={(event) => setPriority(event.target.value as ConsultantCalendarEventPriority)}
            value={priority}
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Fecha
          </span>
          <input
            className="h-12 w-full rounded-[1rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Estado
          </span>
          <select
            className="h-12 w-full rounded-[1rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
            onChange={(event) => setStatus(event.target.value as Extract<ConsultantCalendarEventStatus, "pending" | "confirmed" | "completed">)}
            value={status}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Hora inicio
            </span>
            <input
              className="h-12 w-full rounded-[1rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
              onChange={(event) => setStartTime(event.target.value)}
              type="time"
              value={startTime}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Hora fin
            </span>
            <input
              className="h-12 w-full rounded-[1rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
              onChange={(event) => setEndTime(event.target.value)}
              type="time"
              value={endTime}
            />
          </label>
        </div>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Descripcion breve
          </span>
          <textarea
            className="min-h-[110px] w-full rounded-[1rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/40"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej. Validar observaciones del lider, cerrar narrativa y enviar documento final."
            value={description}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
        <button
          className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button
          className={cn(
            "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors",
            isValid
              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              : "cursor-not-allowed bg-white/[0.08] text-slate-500"
          )}
          disabled={!isValid}
          onClick={() => {
            if (!isValid) {
              return;
            }

            onSubmit({
              title,
              type,
              projectSlug,
              date,
              startTime,
              endTime,
              priority,
              description,
              status
            });

            setTitle("");
            setType("delivery");
            setProjectSlug(defaultProjectSlug);
            setDate(defaultDate);
            setStartTime("09:00");
            setEndTime("10:00");
            setPriority("medium");
            setStatus("pending");
            setDescription("");
          }}
          type="button"
        >
          Guardar evento
        </button>
      </div>
    </section>
  );
}
