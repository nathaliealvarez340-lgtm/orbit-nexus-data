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

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-8">
        <div className="flex justify-end">
          <CompanyActivationCta />
        </div>

        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[2.4rem] border border-white/[0.16] bg-slate-950/42 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.26)] backdrop-blur-[24px] md:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_30%,transparent_72%,rgba(93,224,230,0.08))]" />
            <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#5de0e6]/10 blur-3xl" />

            <div className="relative z-10 max-w-4xl space-y-8">
              <div className="space-y-6">
                <h1 className="max-w-4xl text-5xl leading-[1.02] md:text-6xl lg:text-7xl">
                  <span className="block font-black text-white">
                    Orbit <span className="text-[#5de0e6]">Nexus</span>
                  </span>
                  <HomeHeroRotator />
                </h1>

                <p className="max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                  Centraliza usuarios, proyectos y validaciones en una sola arquitectura para
                  operar con orden, seguridad y trazabilidad real.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
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

          <div className="grid gap-4">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-[1.8rem] border border-white/[0.16] bg-slate-950/42 p-5 shadow-[0_16px_42px_rgba(2,6,23,0.22)] backdrop-blur-[20px] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-cyan-400/35 hover:bg-slate-950/52 hover:shadow-[0_24px_60px_rgba(0,74,173,0.2)]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_38%,transparent_74%,rgba(93,224,230,0.08))] opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/12 text-cyan-300 transition-all duration-300 ease-in-out group-hover:bg-white/20 group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#5de0e6] to-[#004aad] opacity-90" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                      <p className="text-sm leading-6 text-slate-300">{item.description}</p>
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
