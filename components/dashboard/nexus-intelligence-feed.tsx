"use client";

import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { Button } from "@/components/ui/button";
import type { NexusIntelligenceFeedItem } from "@/lib/data/intelligence-feed";
import { cn } from "@/lib/utils";

type NexusIntelligenceFeedProps = {
  items: NexusIntelligenceFeedItem[];
  className?: string;
};

const categoryClasses = {
  Riesgo: "border-violet-400/25 bg-violet-500/14 text-violet-200",
  Productividad: "border-cyan-400/25 bg-cyan-500/14 text-cyan-200",
  Talento: "border-sky-400/25 bg-sky-500/14 text-sky-200",
  Mercado: "border-amber-400/25 bg-amber-500/14 text-amber-200",
  Operacion: "border-emerald-400/25 bg-emerald-500/14 text-emerald-200"
} as const;

function getConfidenceLabel(confidence: number) {
  if (confidence >= 85) {
    return "Alta";
  }

  if (confidence >= 70) {
    return "Media";
  }

  return "Emergente";
}

function formatPublishedAt(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short"
  }).format(parsedDate);
}

export function NexusIntelligenceFeed({ items, className }: NexusIntelligenceFeedProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<NexusIntelligenceFeedItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!scrollRef.current || items.length < 2 || isPaused || selectedItem) {
      return;
    }

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const container = scrollRef.current;
    const intervalId = window.setInterval(() => {
      const cards = Array.from(container.querySelectorAll<HTMLElement>("[data-feed-card='true']"));

      if (cards.length < 2) {
        return;
      }

      const nearestIndex = cards.reduce((closestIndex, card, index) => {
        const currentDistance = Math.abs(card.offsetLeft - container.scrollLeft);
        const closestDistance = Math.abs(cards[closestIndex].offsetLeft - container.scrollLeft);
        return currentDistance < closestDistance ? index : closestIndex;
      }, 0);
      const nextIndex = (nearestIndex + 1) % cards.length;

      container.scrollTo({
        left: cards[nextIndex]?.offsetLeft ?? 0,
        behavior: "smooth"
      });
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [isPaused, items, selectedItem]);

  function scrollByDirection(direction: "previous" | "next") {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    const delta = Math.max(container.clientWidth * 0.8, 280);
    container.scrollBy({
      left: direction === "next" ? delta : -delta,
      behavior: "smooth"
    });
  }

  return (
    <>
      <OperationsPanel
        className={cn("overflow-hidden", className)}
        contentClassName="space-y-5"
        description="Senales editoriales con lectura ejecutiva, impacto esperado y acciones concretas para decidir con mas contexto sin salir del workspace."
        eyebrow="Inteligencia"
        title="Nexus Intelligence Feed"
        actions={
          <div className="hidden items-center gap-2 md:flex">
            <Button
              aria-label="Desplazar contenido anterior"
              className="border-white/12 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
              size="icon"
              type="button"
              variant="secondary"
              onClick={() => scrollByDirection("previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Desplazar siguiente contenido"
              className="border-white/12 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
              size="icon"
              type="button"
              variant="secondary"
              onClick={() => scrollByDirection("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
          <p>Contenido de inteligencia operativa para anticipar riesgo, elevar productividad y priorizar decisiones de liderazgo.</p>
          <p className="hidden whitespace-nowrap text-xs uppercase tracking-[0.2em] text-slate-500 md:block">
            Desliza para explorar
          </p>
        </div>

        <div
          ref={scrollRef}
          className="flex min-h-[29rem] snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
        >
          {items.map((item) => (
            <article
              key={item.id}
              data-feed-card="true"
              className="group relative flex min-h-[29rem] min-w-[300px] flex-[0_0_90%] snap-start flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/[0.05] shadow-[0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-[18px] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-cyan-400/28 hover:shadow-[0_24px_56px_rgba(14,165,233,0.14)] sm:flex-[0_0_74%] lg:flex-[0_0_395px]"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedItem(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedItem(item);
                }
              }}
            >
              <div className="relative overflow-hidden">
                <img
                  alt=""
                  className="aspect-[16/9] w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
                  decoding="async"
                  loading="lazy"
                  src={item.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-slate-950/14 to-transparent" />
                <span
                  className={cn(
                    "absolute left-4 top-4 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                    categoryClasses[item.category]
                  )}
                >
                  {item.category}
                </span>
              </div>

              <div className="flex flex-1 flex-col space-y-4 p-5">
                <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span>{item.sourceType === "internal" ? "Insight operativo" : item.sourceName}</span>
                  <span>{formatPublishedAt(item.publishedAt)}</span>
                </div>

                <div className="space-y-3">
                  <h3
                    className="text-lg font-semibold leading-6 text-white"
                    style={{
                      display: "-webkit-box",
                      overflow: "hidden",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2
                    }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm leading-6 text-slate-300">{item.actionableInsight}</p>
                </div>

                <div className="grid gap-3 text-sm text-slate-300">
                  <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Recomendacion
                    </p>
                    <p className="mt-2 leading-6">{item.recommendedAction}</p>
                  </div>
                  <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Impacto esperado
                    </p>
                    <p className="mt-2 leading-6">{item.expectedImpact}</p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                    Confianza {getConfidenceLabel(item.confidence)} | {item.confidence}%
                  </span>

                  <Button
                    className="bg-gradient-to-r from-[#5de0e6] to-[#004aad] text-white shadow-[0_16px_38px_rgba(0,74,173,0.26)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-[0_18px_44px_rgba(0,74,173,0.34)]"
                    size="sm"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedItem(item);
                    }}
                  >
                    {item.ctaText}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </OperationsPanel>

      {selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Cerrar vista previa de inteligencia"
            className="absolute inset-0 bg-slate-950/72 backdrop-blur-[8px]"
            type="button"
            onClick={() => setSelectedItem(null)}
          />

          <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/88 shadow-[0_32px_90px_rgba(2,6,23,0.46)] backdrop-blur-[22px]">
            <div className="relative">
              <img
                alt=""
                className="aspect-[16/9] w-full object-cover"
                decoding="async"
                loading="lazy"
                src={selectedItem.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <span
                className={cn(
                  "absolute left-5 top-5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                  categoryClasses[selectedItem.category]
                )}
              >
                {selectedItem.category}
              </span>
              <button
                aria-label="Cerrar modal"
                className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-slate-950/60 text-slate-200 transition-all duration-300 ease-in-out hover:bg-slate-900/85 hover:text-white"
                type="button"
                onClick={() => setSelectedItem(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>{selectedItem.sourceType === "internal" ? "Insight operativo" : "Fuente externa preparada"}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-cyan-200">
                  {selectedItem.sourceName}
                </span>
                <span>{formatPublishedAt(selectedItem.publishedAt)}</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                  {selectedItem.title}
                </h3>
                <p className="text-sm leading-7 text-slate-300">{selectedItem.actionableInsight}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-slate-300">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    Recomendacion concreta
                  </p>
                  <p className="mt-3">{selectedItem.recommendedAction}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-slate-300">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    Impacto esperado
                  </p>
                  <p className="mt-3">{selectedItem.expectedImpact}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-slate-300">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Nivel de confianza
                </p>
                <p className="mt-3">
                  {selectedItem.confidence}% |{" "}
                  {selectedItem.sourceType === "internal"
                    ? "Basado en senales internas del workspace y preparado para conectarse a datos reales."
                    : "Estructura lista para integrar fuentes externas sin inventar noticias actuales."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
