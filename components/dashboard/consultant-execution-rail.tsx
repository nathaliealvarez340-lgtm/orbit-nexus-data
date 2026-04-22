"use client";

import type {
  DashboardConsultantRecord,
  DashboardStatusItem,
  DashboardTimelineItem
} from "@/lib/dashboard/mock-data";

type ConsultantExecutionRailProps = {
  consultant: DashboardConsultantRecord;
  workflowStatus: DashboardStatusItem[];
  priorityDeliverable?: DashboardTimelineItem | null;
  riskItem?: DashboardTimelineItem | null;
  feedbackItems: DashboardTimelineItem[];
};

function getStatusItem(workflowStatus: DashboardStatusItem[], pattern: RegExp, fallbackIndex: number) {
  return workflowStatus.find((item) => pattern.test(item.label)) ?? workflowStatus[fallbackIndex] ?? null;
}

export function ConsultantExecutionRail({
  consultant,
  workflowStatus,
  priorityDeliverable,
  riskItem,
  feedbackItems
}: ConsultantExecutionRailProps) {
  const workState = getStatusItem(workflowStatus, /estado/i, 1);
  const capacity = getStatusItem(workflowStatus, /capacidad/i, 2);
  const focus = getStatusItem(workflowStatus, /foco/i, 0);
  const capacityPercent = Math.max(0, 100 - consultant.occupancyPercent);
  const latestFeedback = feedbackItems[0];

  return (
    <div className="grid h-full gap-4 auto-rows-fr">
      <section className="rounded-[1.55rem] border border-white/10 bg-white/[0.04] px-5 py-5 shadow-[0_18px_44px_rgba(2,6,23,0.2)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Estado actual
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
          Estado de trabajo
        </h2>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
          {workState?.value ?? "En curso"}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {workState?.note ?? consultant.professionalStatus}
        </p>
      </section>

      <section className="rounded-[1.55rem] border border-white/10 bg-white/[0.04] px-5 py-5 shadow-[0_18px_44px_rgba(2,6,23,0.2)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Capacidad
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
          Capacidad restante
        </h2>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold tracking-tight text-white">
            {capacity?.value ?? `${capacityPercent}%`}
          </p>
          <p className="text-sm font-medium text-slate-400">
            Carga actual {consultant.occupancyPercent}%
          </p>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            aria-hidden="true"
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-300"
            style={{ width: `${Math.max(8, capacityPercent)}%` }}
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {capacity?.note ?? "Todavia tienes margen controlado para absorber ajustes sin comprometer la ruta principal."}
        </p>
      </section>

      <section className="rounded-[1.55rem] border border-white/10 bg-white/[0.04] px-5 py-5 shadow-[0_18px_44px_rgba(2,6,23,0.2)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Enfoque
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
          En que enfocarte hoy
        </h2>
        <p className="mt-3 text-base font-semibold text-white">
          {focus?.value ?? priorityDeliverable?.title ?? "Seguimiento prioritario"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {focus?.note ?? priorityDeliverable?.meta ?? "Define la siguiente accion operativa y manten el ritmo del frente visible."}
        </p>

        <div className="mt-4 grid gap-3">
          <div className="rounded-[1.15rem] border border-white/10 bg-slate-950/55 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Riesgo actual
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {riskItem?.title ?? "Sin bloqueos criticos"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {riskItem?.subtitle ?? "No hay alertas altas dentro del frente actual."}
            </p>
          </div>

          <div className="rounded-[1.15rem] border border-white/10 bg-slate-950/55 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Feedback pendiente
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {feedbackItems.length} observaciones activas
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {latestFeedback?.title ?? "No hay comentarios pendientes del lider por resolver."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
