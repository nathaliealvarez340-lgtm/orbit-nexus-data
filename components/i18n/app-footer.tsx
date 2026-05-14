"use client";

import { useLanguage } from "@/components/i18n/language-provider";

export function AppFooter() {
  const { t } = useLanguage();

  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] bg-slate-950/24 px-4 py-2 text-center backdrop-blur-md">
      <div className="mx-auto mb-2 h-px max-w-xs bg-[linear-gradient(90deg,transparent,#0EA5E9,transparent)] opacity-30" />
      <p className="text-[11px] text-white/60 md:text-xs">
        © 2026 <span className="text-[#38BDF8]">ORBIT NEXUS</span>. {t("footer.copyright")}
      </p>
    </footer>
  );
}
