"use client";

import { Bell, MessageSquareText, Plus, SquarePen } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actionItems = [
  {
    label: "Crear proyecto",
    href: "/workspace/projects/create",
    icon: SquarePen
  },
  {
    label: "Ver alertas",
    href: "#leader-alerts",
    icon: Bell
  },
  {
    label: "Registrar consultor",
    href: "/workspace/consultants/register",
    icon: SquarePen
  },
  {
    label: "Ir a chat",
    href: "/workspace/chat",
    icon: MessageSquareText
  }
];

export function LeaderFloatingActions() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
    <div ref={containerRef} className="absolute right-0 top-0 z-30">
      <Button
        className="h-12 w-12 rounded-2xl border border-cyan-400/20 bg-cyan-500/14 text-cyan-200 shadow-[0_16px_44px_rgba(8,145,178,0.18)] hover:bg-cyan-500/20"
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
        <div className="absolute right-0 top-[calc(100%+0.7rem)] w-64 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-[0_28px_80px_rgba(2,6,23,0.45)]">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
              Acciones del dashboard
            </p>
          </div>

          <div className="p-2">
            {actionItems.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.label}
                  className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                  href={action.href as Route}
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.05] text-cyan-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{action.label}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Ir</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
