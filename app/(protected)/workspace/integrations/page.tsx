import { Mail, ShieldCheck } from "lucide-react";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceIntegrations } from "@/lib/services/integrations/workspace-integrations";
import { getWorkspaceNavigationItems, getWorkspaceSearchItems } from "@/lib/workspace/modules";

export default async function WorkspaceIntegrationsPage() {
  const session = await requireSession();
  const integrations = await getWorkspaceIntegrations(session);

  return (
    <OperationsShell
      session={session}
      portalLabel="Executive OS"
      portalTitle="Integraciones"
      subtitle="Conecta correo y sistemas externos solo mediante OAuth y consentimiento explicito."
      navItems={getWorkspaceNavigationItems("/workspace/integrations")}
      searchItems={getWorkspaceSearchItems()}
      showHero={false}
      contentClassName="mx-auto w-full max-w-[1480px]"
    >
      <OperationsPanel
        className="bg-slate-950/84"
        contentClassName="space-y-5"
        description="No pedimos contrasenas de correo. Las conexiones reales se habilitaran con OAuth seguro y tokens cifrados."
        eyebrow="Correo ejecutivo"
        title="Integraciones preparadas"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {integrations.map((integration) => (
            <article
              key={integration.provider}
              className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
                  <Mail className="h-5 w-5 text-cyan-200" />
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                  {integration.status === "CONNECTED" ? "Conectado" : "No conectado"}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">{integration.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{integration.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {integration.scopes.map((scope) => (
                  <span
                    key={`${integration.provider}-${scope}`}
                    className="rounded-full border border-cyan-400/15 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100"
                  >
                    {scope}
                  </span>
                ))}
              </div>
              <Button
                className="mt-5 w-full border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.08]"
                disabled
                type="button"
                variant="outline"
              >
                Preparado para OAuth
              </Button>
            </article>
          ))}
        </div>

        <div className="rounded-[1.5rem] border border-amber-400/15 bg-amber-500/10 px-4 py-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-amber-200" />
            <p className="text-sm leading-6 text-amber-100">
              La deteccion de correos importantes se activara solo despues de OAuth real. No se leen correos,
              no se guardan contrasenas y no se sincronizan bandejas sin consentimiento explicito.
            </p>
          </div>
        </div>
      </OperationsPanel>
    </OperationsShell>
  );
}

