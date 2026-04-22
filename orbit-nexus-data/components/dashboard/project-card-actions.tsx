"use client";

import { History, OctagonAlert, SquareArrowOutUpRight, UserPlus2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { DashboardProjectRecord } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type ProjectCardActionsProps = {
  project: DashboardProjectRecord;
};

const actionItems = [
  {
    key: "open",
    label: "Abrir proyecto",
    icon: SquareArrowOutUpRight,
    getHref: (project: DashboardProjectRecord) => project.href
  },
  {
    key: "assign",
    label: "Asignar consultor",
    icon: UserPlus2,
    getHref: (project: DashboardProjectRecord) => `${project.href}#assignment`
  },
  {
    key: "alerts",
    label: "Ver alertas",
    icon: OctagonAlert,
    getHref: (project: DashboardProjectRecord) => `${project.href}#risks`
  },
  {
    key: "history",
    label: "Ver historial",
    icon: History,
    getHref: (project: DashboardProjectRecord) => `${project.href}#history`
  }
];

export function ProjectCardActions({ project }: ProjectCardActionsProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative z-30">
      <Button
        className="h-11 w-11 rounded-2xl border border-white/10 bg-white/[0.05] text-slate-100 hover:border-cyan-400/30 hover:bg-white/[0.09]"
        size="icon"
        type="button"
        variant="outline"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
      >
        <Plus className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-45" : "rotate-0")} />
      </Button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.65rem)] z-[70] w-60 overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950 shadow-[0_26px_64px_rgba(2,6,23,0.54)]">
          <div className="border-b border-white/8 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
              Acciones de proyecto
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{project.folio}</p>
          </div>

          <div className="p-2">
            {actionItems.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.key}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push(action.getHref(project) as any);
                  }}
                >
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.05] text-cyan-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{action.label}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Ir
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}