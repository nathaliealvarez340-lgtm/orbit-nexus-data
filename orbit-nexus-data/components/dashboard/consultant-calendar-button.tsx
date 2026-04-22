"use client";

import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConsultantCalendarButtonProps = {
  href?: string;
  eventCount?: number;
  active?: boolean;
};

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M7 3v3M17 3v3M4 9h16M5.5 5.5h13A1.5 1.5 0 0 1 20 7v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function ConsultantCalendarButton({
  href = "/workspace/calendar",
  eventCount,
  active = false
}: ConsultantCalendarButtonProps) {
  return (
    <Button
      asChild
      className={cn(
        "h-16 min-w-[148px] rounded-[1.2rem] border border-white/10 px-5 shadow-none",
        active
          ? "bg-cyan-500/16 text-cyan-100 hover:bg-cyan-500/20"
          : "bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
      )}
      variant="secondary"
    >
      <Link href={href as Route}>
        <CalendarIcon className="h-4 w-4" />
        <span>Calendario</span>
        {typeof eventCount === "number" ? (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200">
            {eventCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
