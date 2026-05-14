import { WorkspaceModulePage } from "@/components/dashboard/workspace-module-page";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceReportsPage() {
  const session = await requireSession();

  return (
    <WorkspaceModulePage
      description="Prepara reportes ejecutivos para lectura directiva, seguimiento semanal y toma de decisiones."
      emptyDescription="Los reportes generados por Orbit AI o por automatizaciones apareceran aqui con trazabilidad y contexto."
      emptyTitle="Sin reportes generados"
      eyebrow="Inteligencia ejecutiva"
      href="/workspace/reports"
      quickActions={[{ label: "Abrir Orbit AI", href: "/workspace/orbit-ai" }]}
      session={session}
      subtitle="Reportes ejecutivos, resumenes y lectura operativa."
      title="Reportes"
    />
  );
}

