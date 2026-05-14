import { WorkspaceModulePage } from "@/components/dashboard/workspace-module-page";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceTasksPage() {
  const session = await requireSession();

  return (
    <WorkspaceModulePage
      description="Concentra prioridades, bloqueos y tareas criticas para mantener la operacion en movimiento."
      emptyDescription="Las tareas apareceran aqui cuando existan proyectos, responsables o automatizaciones generando seguimiento."
      emptyTitle="Sin tareas operativas"
      eyebrow="Prioridades"
      href="/workspace/tasks"
      session={session}
      subtitle="Tareas criticas, pendientes y bloqueos operativos."
      title="Tareas"
    />
  );
}

