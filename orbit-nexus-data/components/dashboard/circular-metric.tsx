"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type CircularMetricProps = {
  label: string;
  value: string;
  note: string;
  progress?: number;
  tone?: "blue" | "emerald" | "amber" | "slate";
};

const toneMap = {
  blue: {
    ring: "stroke-cyan-400",
    glow: "shadow-[0_0_0_1px_rgba(34,211,238,0.12)]",
    badge: "bg-cyan-500/12 text-cyan-300"
  },
  emerald: {
    ring: "stroke-emerald-400",
    glow: "shadow-[0_0_0_1px_rgba(16,185,129,0.12)]",
    badge: "bg-emerald-500/12 text-emerald-300"
  },
  amber: {
    ring: "stroke-amber-400",
    glow: "shadow-[0_0_0_1px_rgba(245,158,11,0.12)]",
    badge: "bg-amber-500/12 text-amber-300"
  },
  slate: {
    ring: "stroke-slate-300",
    glow: "shadow-[0_0_0_1px_rgba(148,163,184,0.12)]",
    badge: "bg-white/10 text-slate-200"
  }
} as const;

export function CircularMetric({
  label,
  value,
  note,
  progress = 0,
  tone = "blue"
}: CircularMetricProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const dashOffset = circumference - (clampedProgress / 100) * circumference;
  const palette = toneMap[tone];
  const useStackedLayout = containerWidth > 0 ? containerWidth < 360 : false;

  useEffect(() => {
    const element = containerRef.current;

    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    setContainerWidth(element.getBoundingClientRect().width);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <article
      ref={containerRef}
      className={cn(
        "flex h-full flex-col rounded-[1.65rem] border border-white/10 bg-white/[0.04] px-5 py-5",
        palette.glow
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 flex flex-1 gap-5",
          useStackedLayout ? "flex-col items-center text-center" : "items-center"
        )}
      >
        <div className="relative h-28 w-28 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110">
            <circle
              className="stroke-white/10"
              cx="55"
              cy="55"
              fill="none"
              r={radius}
              strokeWidth="8"
            />
            <circle
              className={cn(palette.ring, "transition-[stroke-dashoffset] duration-500 ease-out")}
              cx="55"
              cy="55"
              fill="none"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <p className="text-xl font-semibold text-white">{clampedProgress}%</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Lectura</p>
            </div>
          </div>
        </div>

        <p
          className={cn(
            "min-w-0 text-sm leading-6 text-slate-400",
            useStackedLayout ? "max-w-[16rem]" : "flex-1"
          )}
        >
          {note}
        </p>
      </div>
    </article>
  );
}
