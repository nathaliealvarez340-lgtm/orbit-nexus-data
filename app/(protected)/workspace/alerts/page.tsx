import { WorkspaceModulePage } from "@/components/dashboard/workspace-module-page";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceAlertsPage() {
  const session = await requireSession();

  return (
    <WorkspaceModulePage
      description="Da seguimiento a riesgos operativos, incidencias y desviaciones detectadas por el sistema."
      emptyDescription="No hay alertas abiertas. Cuando Mikaelson OS detecte retrasos, carga critica o eventos relevantes, se mostraran aqui."
      emptyTitle="Operacion sin alertas abiertas"
      eyebrow="Riesgos"
      href="/workspace/alerts"
      session={session}
      subtitle="Alertas inteligentes y riesgos accionables."
      title="Alertas"
    />
  );
}
