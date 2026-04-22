import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionCard } from "@/components/dashboard/section-card";
import type { SessionUser } from "@/types/auth";

type RoleFallbackDashboardProps = {
  session: SessionUser;
};

export function RoleFallbackDashboard({ session }: RoleFallbackDashboardProps) {
  return (
    <DashboardShell
      session={session}
      portalTitle="Portal seguro"
      subtitle="Tu sesion es valida, pero el portal de este rol todavia no tiene una vista dedicada dentro de la Fase 2."
      searchItems={[]}
    >
      <SectionCard
        eyebrow="Fallback"
        title="Vista no disponible"
        description="La autenticacion y la proteccion de la ruta siguen activas. Esta pantalla evita mostrar una interfaz incorrecta cuando el rol no coincide con los portales implementados."
      >
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-5">
          <p className="text-sm leading-6 text-slate-600">
            Rol detectado: <span className="font-semibold text-slate-950">{session.role}</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Puedes mantener esta salida segura para roles administrativos globales o extenderla en
            una siguiente iteracion sin tocar la base de autenticacion de Fase 1.
          </p>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
