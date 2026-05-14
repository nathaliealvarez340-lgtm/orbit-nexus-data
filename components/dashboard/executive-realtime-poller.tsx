"use client";

import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type RealtimeModuleState = {
  count: number;
  criticalCount?: number;
  latestAt: string | null;
};

type ExecutiveRealtimeSnapshot = {
  version: string;
  generatedAt: string;
  polling: {
    recommendedMs: number;
    hiddenTabMs: number;
  };
  modules: Record<string, RealtimeModuleState>;
};

type ExecutiveRealtimePollerProps = {
  enabled?: boolean;
  embedded?: boolean;
};

const MIN_VISIBLE_INTERVAL_MS = 20000;
const MAX_BACKOFF_MS = 180000;

export function ExecutiveRealtimePoller({ enabled = true, embedded = false }: ExecutiveRealtimePollerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "syncing" | "error">("idle");
  const [lastSnapshot, setLastSnapshot] = useState<ExecutiveRealtimeSnapshot | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const versionRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    async function sync() {
      if (!isMountedRef.current) {
        return;
      }

      setStatus("syncing");

      try {
        const response = await fetch("/api/realtime/executive-snapshot", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal
        });
        const payload = (await response.json()) as {
          data?: ExecutiveRealtimeSnapshot;
          message?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.message ?? "No fue posible sincronizar datos.");
        }

        const snapshot = payload.data;
        const previousVersion = versionRef.current;
        versionRef.current = snapshot.version;
        setLastSnapshot(snapshot);
        setErrorCount(0);
        setStatus("idle");

        if (previousVersion && previousVersion !== snapshot.version) {
          startTransition(() => {
            router.refresh();
          });
        }

        scheduleNext(snapshot.polling.recommendedMs, snapshot.polling.hiddenTabMs, 0);
      } catch {
        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }

        setStatus("error");
        setErrorCount((current) => {
          const nextErrorCount = current + 1;
          scheduleNext(30000, 120000, nextErrorCount);
          return nextErrorCount;
        });
      }
    }

    function scheduleNext(visibleMs: number, hiddenMs: number, failures: number) {
      if (!isMountedRef.current) {
        return;
      }

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      const baseInterval = document.visibilityState === "hidden"
        ? hiddenMs
        : Math.max(visibleMs, MIN_VISIBLE_INTERVAL_MS);
      const backoff = failures > 0
        ? Math.min(baseInterval * 2 ** Math.min(failures, 4), MAX_BACKOFF_MS)
        : baseInterval;

      timeoutRef.current = window.setTimeout(sync, backoff);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void sync();
      }
    }

    void sync();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, pathname, router, startTransition]);

  if (!enabled) {
    return null;
  }

  const activeModules = lastSnapshot
    ? Object.entries(lastSnapshot.modules).filter(([, module]) => module.count > 0).slice(0, 3)
    : [];

  return (
    <div className={embedded ? "w-full rounded-2xl border border-white/10 bg-slate-950/88 px-3 py-3 text-xs text-slate-300 shadow-[0_18px_55px_rgba(2,6,23,0.38)] backdrop-blur-md" : "fixed bottom-20 right-4 z-[170] hidden max-w-[22rem] rounded-2xl border border-white/10 bg-slate-950/88 px-3 py-3 text-xs text-slate-300 shadow-[0_18px_55px_rgba(2,6,23,0.38)] backdrop-blur-md lg:block"}>
      <div className="flex items-center gap-2">
        {status === "error" ? (
          <WifiOff className="h-3.5 w-3.5 text-amber-300" />
        ) : isPending || status === "syncing" ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-300" />
        ) : (
          <Wifi className="h-3.5 w-3.5 text-cyan-300" />
        )}
        <span className="font-semibold uppercase tracking-[0.16em] text-slate-400">
          {status === "error" ? "Reconectando" : "Live sync"}
        </span>
      </div>
      <p className="mt-2 leading-5 text-slate-400">
        {lastSnapshot
          ? `Ultima lectura ${new Date(lastSnapshot.generatedAt).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit"
            })}.`
          : "Preparando sincronizacion segura."}
      </p>
      {activeModules.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activeModules.map(([key, module]) => (
            <span
              key={key}
              className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-cyan-100"
            >
              {key}: {module.count}
            </span>
          ))}
        </div>
      ) : null}
      {errorCount > 0 ? (
        <p className="mt-2 text-[11px] leading-5 text-amber-200">
          Reintento automatico activo. No se exponen datos fuera de tu organizacion.
        </p>
      ) : null}
    </div>
  );
}
