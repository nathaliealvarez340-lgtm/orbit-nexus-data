"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

function formatNow(date: Date, timeZone: string) {
  const dateText = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone
  }).format(date);

  const timeText = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone
  }).format(date);

  return { dateText, timeText };
}

function prettifyTimeZone(tz: string) {
  return tz.replaceAll("_", " ");
}

export function LiveDateTime() {
  const browserTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());

    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (!mounted || !now) {
    return (
      <div className="inline-flex h-[74px] w-full max-w-[600px] items-center rounded-2xl border border-white/15 bg-slate-950/46 px-6 py-4 backdrop-blur-xl" />
    );
  }

  const { dateText, timeText } = formatNow(now, browserTimeZone);

  return (
    <div className="inline-flex w-full max-w-[600px] flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/15 bg-slate-950/46 px-6 py-4 text-sm text-slate-200 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-[#5de0e6]" />
        <span className="capitalize">{dateText}</span>
      </div>

      <span className="hidden h-4 w-px bg-white/15 sm:block" />

      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-[#5de0e6]" />
        <span>{timeText}</span>
      </div>

      <span className="hidden h-4 w-px bg-white/15 sm:block" />

      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#5de0e6]" />
        <span>{prettifyTimeZone(browserTimeZone)}</span>
      </div>
    </div>
  );
}
