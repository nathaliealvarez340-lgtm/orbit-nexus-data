import Link from "next/link";
import type { Route } from "next";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { Button } from "@/components/ui/button";
import { getWorkspaceNavigationItems, getWorkspaceSearchItems } from "@/lib/workspace/modules";
import type { SessionUser } from "@/types/auth";

type QuickAction = {
  label: string;
  href: string;
};

type WorkspaceModulePageProps = {
  session: SessionUser;
  href: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  quickActions?: QuickAction[];
  children?: React.ReactNode;
};

export function WorkspaceModulePage({
  session,
  href,
  title,
  subtitle,
  eyebrow,
  description,
  emptyTitle,
  emptyDescription,
  quickActions = [],
  children
}: WorkspaceModulePageProps) {
  return (
    <OperationsShell
      session={session}
      portalLabel="Executive OS"
      portalTitle={title}
      subtitle={subtitle}
      navItems={getWorkspaceNavigationItems(href)}
      searchItems={getWorkspaceSearchItems()}
      showHero
      contentClassName="mx-auto w-full max-w-[1480px]"
    >
      <OperationsPanel
        className="bg-slate-950/84"
        contentClassName="space-y-5"
        description={description}
        eyebrow={eyebrow}
        title={title}
      >
        {children ?? (
          <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.03] px-5 py-8">
            <p className="text-lg font-semibold text-white">{emptyTitle}</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{emptyDescription}</p>
            {quickActions.length ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={`${action.href}-${action.label}`}
                    asChild
                    className={index === 0 ? "" : "bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"}
                    variant={index === 0 ? "default" : "secondary"}
                  >
                    <Link href={action.href as Route}>{action.label}</Link>
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </OperationsPanel>
    </OperationsShell>
  );
}

