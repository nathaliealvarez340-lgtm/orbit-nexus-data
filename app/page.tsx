"use client";

import Link from "next/link";
import { BadgeCheck, KeyRound, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

import { CompanyActivationCta } from "@/components/commercial/company-activation-cta";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { OrbitBackgroundVideo } from "@/components/ui/orbit-background-video";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const highlights: Array<{
  icon: LucideIcon;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}> = [
  {
    icon: Sparkles,
    titleKey: "home.card.command.title",
    descriptionKey: "home.card.command.description"
  },
  {
    icon: KeyRound,
    titleKey: "home.card.maia.title",
    descriptionKey: "home.card.maia.description"
  },
  {
    icon: BadgeCheck,
    titleKey: "home.card.finance.title",
    descriptionKey: "home.card.finance.description"
  },
  {
    icon: ShieldCheck,
    titleKey: "home.card.operation.title",
    descriptionKey: "home.card.operation.description"
  }
];

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.78,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const cardsContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.22,
      staggerChildren: 0.12
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.68,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <OrbitBackgroundVideo
        primaryOverlayClassName="bg-[radial-gradient(circle_at_center,rgba(10,15,30,0.24),rgba(3,8,20,0.82))]"
        secondaryOverlayClassName="bg-[linear-gradient(135deg,rgba(3,11,27,0.42),rgba(7,19,40,0.62))]"
        videoClassName="saturate-[1.05] contrast-[1.03]"
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1500px] flex-col gap-8">
        <div className="flex items-center justify-end gap-3">
          <LanguageSelector />
        </div>

        <section className="grid flex-1 items-center gap-8 lg:min-h-[calc(100vh-10rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <motion.div
            animate="visible"
            className="relative min-w-0 w-full max-w-[560px] justify-self-center self-center px-2 py-6 md:min-h-[560px] md:px-3 md:py-7 lg:justify-self-end xl:px-4 xl:py-8"
            initial="hidden"
            variants={heroVariants}
          >
            <div className="relative z-10 flex h-full flex-col justify-center">
              <div className="max-w-[32rem] space-y-8 md:space-y-10">
                <h1 className="max-w-[30rem] text-[clamp(38px,4.4vw,60px)] leading-[1.1] tracking-[-0.03em] text-white">
                  <span className="block font-black leading-[1.04] text-white">
                    Orbit <span className="text-[#5de0e6]">Nexus</span>
                  </span>
                  <span className="mt-4 block font-semibold leading-[1.1] text-white">
                    {t("home.hero.title")}
                  </span>
                </h1>

                <div className="space-y-6 md:space-y-7">
                  <p className="max-w-[30rem] text-base leading-7 text-slate-300 md:text-[1.05rem] md:leading-8">
                    {t("home.hero.subtitle")}
                  </p>

                  <div className="flex flex-wrap gap-3 pt-1 md:pt-2">
                    <Button
                      asChild
                      className="bg-gradient-to-r from-[#5de0e6] to-[#004aad] text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-[0_22px_50px_rgba(0,74,173,0.42)]"
                      size="lg"
                    >
                      <Link href="/login">{t("common.login")}</Link>
                    </Button>
                    <CompanyActivationCta
                      triggerClassName="border-white/15 bg-white/[0.06] text-white transition-all duration-300 ease-in-out hover:border-white/25 hover:bg-white/[0.1] hover:shadow-[0_14px_36px_rgba(15,23,42,0.22)]"
                      triggerLabel={t("common.activateCompany")}
                      triggerVariant="outline"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate="visible"
            className="grid min-w-0 w-full gap-[0.8rem] self-center lg:max-w-[590px] lg:justify-self-start"
            initial="hidden"
            variants={cardsContainerVariants}
          >
            {highlights.map((item) => {
              const Icon = item.icon;
              const title = t(item.titleKey);

              return (
                <motion.div
                  key={item.titleKey}
                  className="group relative overflow-hidden rounded-[1.8rem] border border-white/[0.16] bg-slate-950/42 p-5 shadow-[0_16px_42px_rgba(2,6,23,0.22)] backdrop-blur-[20px] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-cyan-400/35 hover:bg-slate-950/52 hover:shadow-[0_24px_60px_rgba(0,74,173,0.2)] md:p-6"
                  variants={cardVariants}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_38%,transparent_74%,rgba(93,224,230,0.08))] opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100" />
                  <div className="relative z-10 space-y-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/12 text-cyan-300 transition-all duration-300 ease-in-out group-hover:bg-white/20 group-hover:text-white">
                        <Icon className="h-[18px] w-[18px] md:h-5 md:w-5" />
                      </div>
                      <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#5de0e6] to-[#004aad] opacity-90" />
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-[1rem] font-semibold text-white md:text-[1.08rem]">
                        {title}
                      </h2>
                      <p className="text-[0.84rem] leading-[1.5] text-slate-300/95 md:text-[0.88rem]">
                        {t(item.descriptionKey)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      </div>
    </main>
  );
}
