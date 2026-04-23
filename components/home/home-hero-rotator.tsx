"use client";

import { useEffect, useState } from "react";

const phrases = [
  "convierte complejidad en control.",
  "elimina el caos operativo.",
  "domina tu operación."
] as const;

const durations = [4000, 3000, 3000] as const;

export function HomeHeroRotator() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % phrases.length);
    }, durations[activeIndex]);

    return () => window.clearTimeout(timer);
  }, [activeIndex]);

  return (
    <span className="relative mt-2 block min-h-[2.35em] leading-[1.08] sm:min-h-[2.1em] lg:min-h-[1.28em]">
      {phrases.map((phrase, index) => (
        <span
          key={phrase}
          className={`absolute inset-0 block font-semibold text-white transition-all duration-300 ease-in-out ${
            activeIndex === index
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-[4px] opacity-0"
          }`}
        >
          {phrase}
        </span>
      ))}
    </span>
  );
}
