import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { OperationsSidebar } from "@/components/dashboard/operations-sidebar";
import { WorkspaceAssistant } from "@/components/dashboard/workspace-assistant";
import { OperationsTopbar } from "@/components/dashboard/operations-topbar";
import { Button } from "@/components/ui/button";
import type { DashboardLinkAction, DashboardSearchItem } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";

type OperationsShellNavItem = {
  label: string;
  href: string;
  badge?: string;
  active?: boolean;
};

type OperationsShellProps = {
  session: SessionUser;
  portalLabel: string;
  portalTitle: string;
  subtitle: string;
  navItems: OperationsShellNavItem[];
  searchItems: DashboardSearchItem[];
  primaryActions?: DashboardLinkAction[];
  headerActions?: ReactNode;
  showProfileCard?: boolean;
  showHero?: boolean;
  contentClassName?: string;
  children: ReactNode;
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function OperationsShell({
  session,
  portalLabel,
  portalTitle,
  subtitle,
  navItems,
  searchItems,
  primaryActions,
  headerActions,
  showProfileCard = true,
  showHero = true,
  contentClassName,
  children
}: OperationsShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_50%,#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1650px] items-start gap-5 px-4 py-4 lg:px-6">
        <OperationsSidebar
          accessCode={session.accessCode}
          items={navItems}
          roleLabel={portalLabel}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className={cn("flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-6", contentClassName)}>
            <OperationsTopbar
              headerActions={headerActions}
              searchItems={searchItems}
              session={session}
              showProfileCard={showProfileCard}
            />

            {showHero ? (
              <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/82 px-6 py-6 shadow-[0_32px_90px_rgba(2,6,23,0.45)] backdrop-blur-md md:px-7">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-400">
                      {portalTitle}
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                      Hola, {getFirstName(session.fullName)}.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                      {subtitle}
                    </p>
                  </div>

                  {primaryActions?.length ? (
                    <div className="flex flex-wrap gap-3">
                      {primaryActions.map((action, index) => (
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
              </section>
            ) : null}

            <div className="flex flex-1 flex-col gap-6">{children}</div>
          </div>
        </div>
      </div>
      {session.role === "LEADER" || session.role === "CONSULTANT" ? (
        <WorkspaceAssistant session={session} />
      ) : null}
    </main>
  );
}