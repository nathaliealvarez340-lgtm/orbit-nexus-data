import { WorkspaceModulePage } from "@/components/dashboard/workspace-module-page";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceAutomationsPage() {
  const session = await requireSession();

  return (
    <WorkspaceModulePage
      description="Prepara rutinas de seguimiento, alertas recurrentes y automatizaciones sin friccion operativa."
      emptyDescription="Aun no hay automatizaciones activas. Esta seccion queda lista para programar rutinas seguras por organizacion."
      emptyTitle="Sin automatizaciones configuradas"
      eyebrow="Sistema operativo"
      href="/workspace/automations"
      session={session}
      subtitle="Rutinas y automatizaciones preparadas para escalar tu operacion."
      title="Automatizaciones"
    />
  );
}

