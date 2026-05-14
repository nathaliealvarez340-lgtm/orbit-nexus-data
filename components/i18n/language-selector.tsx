"use client";

import { Globe2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/components/i18n/language-provider";
import { languageLabels, type Language } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  className?: string;
};

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function selectLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t("common.language")}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/42 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 shadow-[0_14px_34px_rgba(2,6,23,0.26)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-white hover:shadow-[0_0_28px_rgba(93,224,230,0.16)] focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Globe2 className="h-4 w-4 text-cyan-200" />
        {language.toUpperCase()}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-44 overflow-hidden rounded-2xl border border-white/12 bg-slate-950/92 p-1.5 shadow-[0_24px_64px_rgba(2,6,23,0.5)] backdrop-blur-2xl"
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            role="menu"
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {(["es", "en"] as const).map((option) => (
              <button
                key={option}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                  language === option
                    ? "bg-cyan-400/14 text-cyan-100"
                    : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                )}
                role="menuitem"
                type="button"
                onClick={() => selectLanguage(option)}
              >
                <span>{languageLabels[option]}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                  {option.toUpperCase()}
                </span>
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
