import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { SearchBar } from "@/components/dashboard/search-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/constants";
import type { DashboardSearchItem } from "@/lib/dashboard/mock-data";
import type { SessionUser } from "@/types/auth";

type DashboardShellProps = {
  session: SessionUser;
  portalTitle: string;
  subtitle: string;
  searchItems: DashboardSearchItem[];
  headerActions?: ReactNode;
  searchVariant?: "default" | "compact";
  children: ReactNode;
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function DashboardShell({
  session,
  portalTitle,
  subtitle,
  searchItems,
  headerActions,
  searchVariant = "default",
  children
}: DashboardShellProps) {
  return (
    <main className="container py-8 md:py-10">
      <section className="relative rounded-[2rem] border border-white/80 bg-white/86 p-6 shadow-float backdrop-blur-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>Workspace Orbit Nexus</Badge>
                <Badge variant="secondary">{ROLE_LABELS[session.role]}</Badge>
              </div>

              {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
                {portalTitle}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                Hola, {getFirstName(session.fullName)}.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                {subtitle}
              </p>
            </div>

            <div className="pt-1">
              <SearchBar items={searchItems} variant={searchVariant} />
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[270px] lg:items-end">
            <Card className="w-full border-slate-200/80 bg-white/78 shadow-soft lg:max-w-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Sesion activa
                  </p>
                  <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {session.accessCode}
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Rol</span>
                    <span className="font-medium text-slate-900">{ROLE_LABELS[session.role]}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Usuario</span>
                    <span className="font-medium text-slate-900">{getFirstName(session.fullName)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <LogoutButton />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200/80 bg-white/92">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Rol actual
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{ROLE_LABELS[session.role]}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/92">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Codigo de acceso
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{session.accessCode}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/92">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Contexto de sesion
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Esta vista usa la sesion actual sin alterar la autenticacion ni los endpoints ya
                existentes de Fase 1.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mt-8">{children}</div>
    </main>
  );
}
