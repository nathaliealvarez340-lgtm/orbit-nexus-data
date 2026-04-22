import Link from "next/link";
import type { Route } from "next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OperationsSidebarItem = {
  label: string;
  href: string;
  badge?: string;
  active?: boolean;
};

type OperationsSidebarProps = {
  roleLabel: string;
  accessCode: string;
  items: OperationsSidebarItem[];
};

export function OperationsSidebar({
  roleLabel,
  accessCode,
  items
}: OperationsSidebarProps) {
  return (
    <aside className="hidden xl:block xl:w-72 xl:shrink-0 xl:self-stretch">
      <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-md">
        <div className="flex min-h-0 flex-1 flex-col gap-5">
          <div className="space-y-3">
            <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">Orbit Nexus</Badge>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
                Centro operativo
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {roleLabel}
              </h2>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Acceso
            </p>
            <div className="mt-3 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Rol</span>
                <span className="font-medium text-white">{roleLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Codigo</span>
                <span className="font-medium text-cyan-300">{accessCode}</span>
              </div>
              <p className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs leading-5 text-slate-400">
                Sesion protegida lista para operar sin exponer contexto interno de empresa.
              </p>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <Link
                key={item.href}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-cyan-500/15 text-white"
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                )}
                href={item.href as Route}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}