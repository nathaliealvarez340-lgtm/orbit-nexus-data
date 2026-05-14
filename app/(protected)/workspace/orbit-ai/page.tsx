import { redirect } from "next/navigation";

import { OrbitAiConsole } from "@/components/dashboard/orbit-ai-console";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceOrbitAiPage() {
  const session = await requireSession();

  if (session.role === "SUPERADMIN") {
    redirect("/workspace");
  }

  return (
    <OperationsShell
      session={session}
      portalLabel="Executive OS"
      portalTitle="Orbit AI"
      subtitle="Asistente ejecutivo interno para administrar, organizar, analizar y resumir la operacion de tu organizacion."
      navItems={[
        { label: "Command Center", href: "/workspace" },
        { label: "Orbit AI", href: "/workspace/orbit-ai", active: true },
        { label: "Cotizaciones", href: "/workspace/quotes" },
        { label: "Facturas", href: "/workspace/invoices" }
      ]}
      searchItems={[
        {
          id: "orbit-ai-summary",
          type: "action",
          title: "Resumen ejecutivo del dia",
          subtitle: "Consulta proyectos, tareas, KPIs y riesgos.",
          href: "/workspace/orbit-ai",
          keywords: ["orbit ai", "resumen", "riesgos", "kpis"]
        },
        {
          id: "orbit-ai-finance",
          type: "action",
          title: "Cotizaciones y facturas pendientes",
          subtitle: "Consulta el estado financiero operativo.",
          href: "/workspace/orbit-ai",
          keywords: ["cotizaciones", "facturas", "finanzas"]
        }
      ]}
      showHero={false}
      contentClassName="mx-auto w-full max-w-[1480px]"
    >
      <OrbitAiConsole session={session} />
    </OperationsShell>
  );
}
