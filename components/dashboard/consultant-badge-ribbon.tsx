"use client";

import { useState, type SVGProps } from "react";

import type { DashboardConsultantBadge } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type ConsultantBadgeRibbonProps = {
  badges: DashboardConsultantBadge[];
  limit?: number;
};

type BadgeTone = DashboardConsultantBadge["tone"];
type BadgeIconProps = SVGProps<SVGSVGElement>;

const badgeCardStyles: Record<BadgeTone, string> = {
  blue:
    "border-cyan-400/12 bg-[linear-gradient(145deg,rgba(8,47,73,0.92),rgba(14,116,144,0.24))] hover:border-cyan-300/18 hover:from-cyan-950 hover:to-cyan-500/22",
  emerald:
    "border-emerald-400/12 bg-[linear-gradient(145deg,rgba(6,78,59,0.92),rgba(16,185,129,0.22))] hover:border-emerald-300/18 hover:from-emerald-950 hover:to-emerald-500/20",
  amber:
    "border-amber-400/12 bg-[linear-gradient(145deg,rgba(120,53,15,0.9),rgba(245,158,11,0.22))] hover:border-amber-300/18 hover:from-amber-950 hover:to-amber-500/20",
  slate:
    "border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(71,85,105,0.18))] hover:border-white/15 hover:from-slate-950 hover:to-slate-500/18"
};

const badgeIconStyles: Record<BadgeTone, string> = {
  blue:
    "border-cyan-300/15 bg-cyan-400/14 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.12)]",
  emerald:
    "border-emerald-300/15 bg-emerald-400/14 text-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.12)]",
  amber:
    "border-amber-300/15 bg-amber-400/14 text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.12)]",
  slate:
    "border-slate-300/12 bg-slate-300/10 text-slate-200 shadow-[0_0_24px_rgba(148,163,184,0.1)]"
};

function MedalIcon(props: BadgeIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path d="M8 3h8l-1.3 4H9.3L8 3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M9.4 7.2 6.4 12l2.8 1.6L12 18l2.8-4.4 2.8-1.6-3-4.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <circle cx="12" cy="11.8" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ClockIcon(props: BadgeIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="13" r="6.8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 13V9.5m0-6v2m6.5 1.2-1.4 1.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function ShieldIcon(props: BadgeIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path d="M12 3 6 5.5v5.8c0 4.1 2.2 7.5 6 9.7 3.8-2.2 6-5.6 6-9.7V5.5L12 3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m9.4 12.1 1.7 1.7 3.5-3.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function PulseIcon(props: BadgeIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path d="M3 12h4l2.2-4 2.7 8 2.2-4H21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M4.8 6.8a8.1 8.1 0 0 1 14.4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function StarIcon(props: BadgeIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path d="m12 4 1.8 3.5 3.9.6-2.8 2.7.7 3.8L12 12.8 8.4 14.6l.7-3.8-2.8-2.7 3.9-.6L12 4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function getBadgeIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("cumplimiento") || normalized.includes("entregas")) {
    return MedalIcon;
  }

  if (normalized.includes("validado")) {
    return ShieldIcon;
  }

  if (normalized.includes("respuesta")) {
    return ClockIcon;
  }

  if (normalized.includes("ejecucion") || normalized.includes("constante")) {
    return PulseIcon;
  }

  return StarIcon;
}

export function ConsultantBadgeRibbon({
  badges,
  limit = 6
}: ConsultantBadgeRibbonProps) {
  const visibleBadges = badges.slice(0, limit);
  const [openBadgeId, setOpenBadgeId] = useState<string | null>(null);

  if (!visibleBadges.length) {
    return null;
  }

  return (
    <section
      id="consultant-credentials"
      className="rounded-[1.7rem] border border-white/10 bg-slate-950/78 px-5 py-5 shadow-[0_18px_44px_rgba(2,6,23,0.24)]"
    >
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
          Mis reconocimientos
        </p>

        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {visibleBadges.map((badge) => {
            const Icon = getBadgeIcon(badge.label);
            const isOpen = openBadgeId === badge.id;

            return (
              <article
                key={badge.id}
                className={cn(
                  "group relative min-h-[11rem] overflow-hidden rounded-[1.25rem] border px-5 py-5 shadow-[0_18px_44px_rgba(2,6,23,0.18)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_28px_60px_rgba(2,6,23,0.24)]",
                  badgeCardStyles[badge.tone]
                )}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_36%)] opacity-60 transition-opacity duration-200 group-hover:opacity-90"
                />

                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex min-h-[4.5rem] items-center gap-4">
                    <span
                      className={cn(
                        "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border",
                        badgeIconStyles[badge.tone]
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold leading-6 text-white">
                        {badge.label}
                      </h3>
                    </div>
                  </div>

                  <div className="relative mt-6 min-h-[2.75rem] pr-10">
                    {isOpen ? (
                      <p className="text-sm leading-6 text-slate-300">
                        {badge.description}
                      </p>
                    ) : null}

                    <button
                      aria-expanded={isOpen}
                      aria-label={isOpen ? `Ocultar descripcion de ${badge.label}` : `Ver descripcion de ${badge.label}`}
                      className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.03] text-xl font-light leading-none text-white/60 opacity-75 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] hover:text-white group-hover:opacity-100"
                      onClick={() => setOpenBadgeId(isOpen ? null : badge.id)}
                      type="button"
                    >
                      {isOpen ? "-" : "+"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
