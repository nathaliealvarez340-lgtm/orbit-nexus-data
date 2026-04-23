import Link from "next/link";
import {
  BadgeCheck,
  KeyRound,
  ShieldCheck,
  Sparkles,
  type LucideIcon
} from "lucide-react";

import { CompanyActivationCta } from "@/components/commercial/company-activation-cta";
import { HomeHeroRotator } from "@/components/home/home-hero-rotator";
import { Button } from "@/components/ui/button";
import { OrbitBackgroundVideo } from "@/components/ui/orbit-background-video";

const highlights: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: Sparkles,
    title: "Registro guiado",
    description: "Alta estructurada en dos pasos para iniciar sin fricción."
  },
  {
    icon: KeyRound,
    title: "Acceso por código único",
    description: "Identificación directa sin procesos innecesarios."
  },
  {
    icon: BadgeCheck,
    title: "Validación autorizada",
    description: "Solo usuarios aprobados pueden formar parte del sistema."
  },
  {
    icon: ShieldCheck,
    title: "Seguridad por empresa",
    description: "Cada organización opera en su propio entorno protegido."
  }
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <OrbitBackgroundVideo
        primaryOverlayClassName="bg-[radial-gradient(circle_at_center,rgba(10,15,30,0.24),rgba(3,8,20,0.82))]"
        secondaryOverlayClassName="bg-[linear-gradient(135deg,rgba(3,11,27,0.42),rgba(7,19,40,0.62))]"
        videoClassName="saturate-[1.05] contrast-[1.03]"
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1500px] flex-col gap-8">
        <div className="flex justify-end">
          <CompanyActivationCta />
        </div>

        <section className="grid flex-1 items-center gap-8 lg:min-h-[calc(100vh-10rem)] lg:grid-cols-[1fr_1fr] lg:gap-12 xl:gap-16">
          <div className="relative w-full max-w-[560px] justify-self-center self-center overflow-hidden rounded-[2.4rem] border border-white/[0.16] bg-slate-950/42 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.26)] backdrop-blur-[24px] md:min-h-[560px] md:p-10 lg:justify-self-end xl:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_34%,transparent_76%,rgba(93,224,230,0.06))]" />

            <div className="relative z-10 flex h-full flex-col justify-center">
              <div className="space-y-5">
                <h1 className="max-w-[34rem] text-[clamp(48px,5vw,72px)] leading-[1.08] tracking-[-0.02em]">
                  <span className="block font-black text-white">
                    Orbit <span className="text-[#5de0e6]">Nexus</span>
                  </span>
                  <HomeHeroRotator />
                </h1>

                <p className="max-w-[33rem] pt-1 text-base leading-[1.6] text-slate-300 md:pt-0 md:text-[1.05rem]">
                  Centraliza usuarios, proyectos y validaciones en una sola arquitectura para
                  operar con orden, seguridad y trazabilidad real.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-6 md:pt-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-[#5de0e6] to-[#004aad] text-white shadow-[0_18px_42px_rgba(0,74,173,0.34)] hover:opacity-95"
                >
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                >
                  <Link href="/register">Registrarse</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid w-full gap-[0.8rem] self-center lg:max-w-[590px] lg:justify-self-start">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-[1.8rem] border border-white/[0.16] bg-slate-950/42 p-5 shadow-[0_16px_42px_rgba(2,6,23,0.22)] backdrop-blur-[20px] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-cyan-400/35 hover:bg-slate-950/52 hover:shadow-[0_24px_60px_rgba(0,74,173,0.2)] md:p-6"
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
                        {item.title}
                      </h2>
                      <p className="text-[0.84rem] leading-[1.5] text-slate-300/95 md:text-[0.88rem]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
