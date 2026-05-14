import { WorkspaceModulePage } from "@/components/dashboard/workspace-module-page";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceProjectsPage() {
  const session = await requireSession();

  return (
    <WorkspaceModulePage
      description="Visualiza el portafolio operativo, el avance y los riesgos de proyectos conforme la organizacion cargue informacion."
      emptyDescription="Cuando crees proyectos, apareceran aqui con avance, responsables, riesgos y siguientes acciones sugeridas."
      emptyTitle="Sin proyectos visibles"
      eyebrow="Operacion"
      href="/workspace/projects"
      quickActions={[{ label: "Crear proyecto", href: "/workspace/projects/create" }]}
      session={session}
      subtitle="Proyectos activos, avance y riesgos en una vista ejecutiva."
      title="Proyectos"
    />
  );
}

