import type { ReactNode } from "react";
import { KeyRound, LockKeyhole, Orbit, Radar, Shield, Sparkles, Waves } from "lucide-react";

import { LiveDateTime } from "@/components/auth/live-date-time";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  mode?: "login" | "register";
};

const loginFeatures = [
  {
    icon: KeyRound,
    title: "Acceso inteligente",
    text: "Ingreso por codigo unico con trazabilidad inmediata."
  },
  {
    icon: Shield,
    title: "Seguridad segmentada",
    text: "Cada empresa opera dentro de su propio entorno protegido."
  },
  {
    icon: Radar,
    title: "Control operativo",
    text: "Usuarios, acceso y visibilidad conectados en una sola arquitectura."
  },
  {
    icon: LockKeyhole,
    title: "Sesion confiable",
    text: "Autenticacion clara, premium y lista para escalar."
  }
];

const registerFeatures = [
  {
    icon: Sparkles,
    title: "Alta guiada",
    text: "Registro estructurado para activar usuarios autorizados sin friccion."
  },
  {
    icon: Shield,
    title: "Validacion segura",
    text: "El sistema confirma identidad, rol y permisos antes de habilitar acceso."
  },
  {
    icon: Orbit,
    title: "Escalabilidad real",
    text: "Una base disenada para crecer sin perder orden ni control."
  },
  {
    icon: Waves,
    title: "Experiencia fluida",
    text: "Una capa visual premium para operar con claridad desde el primer ingreso."
  }
];

function panelClassName() {
  return "border border-white/[0.16] bg-slate-950/42 backdrop-blur-[24px]";
}

function innerPanelClassName() {
  return "border border-white/[0.15] bg-white/[0.08] backdrop-blur-[20px]";
}

export function AuthShell({
  title,
  description,
  children,
  mode = "login"
}: AuthShellProps) {
  const features = mode === "login" ? loginFeatures : registerFeatures;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source
          src="https://videos.pexels.com/video-files/32399073/13820341_1920_1080_30fps.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,15,30,0.34),rgba(3,8,20,0.86))]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,11,27,0.58),rgba(7,19,40,0.74))]" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:42px_42px]" />

      <section className="main-content relative z-[2] mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div
          className={`relative overflow-hidden rounded-[2.4rem] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.26)] md:p-10 ${panelClassName()}`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_30%,transparent_72%,rgba(93,224,230,0.08))]" />
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#5de0e6]/10 blur-3xl" />

          <div className="relative z-10 flex justify-end">
            <LiveDateTime />
          </div>

          <div className="relative z-10 mt-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5de0e6] to-[#004aad] text-white shadow-[0_18px_40px_rgba(0,74,173,0.24)]">
              <Orbit className="h-7 w-7" />
            </div>

            <div>
              <p className="text-[1.7rem] font-black leading-none tracking-[-0.05em] text-white">
                Orbit <span className="text-[#5de0e6]">Nexus</span>
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Plataforma futurista para acceso, control y trazabilidad.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 space-y-5">
            <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-4xl xl:text-5xl">
              {title}
            </h1>

            <p className="max-w-2xl text-[1.05rem] leading-8 text-slate-300 md:text-[1.12rem]">
              {description}
            </p>
          </div>

          <div className="relative z-10 mt-10 grid gap-4 md:grid-cols-2 xl:max-w-2xl">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-[1.65rem] border border-white/[0.15] bg-white/[0.08] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.16)] backdrop-blur-[18px] transition-all duration-300 hover:-translate-y-1 hover:border-[#5de0e6]/55 hover:bg-white/[0.16] hover:shadow-[0_28px_60px_rgba(0,74,173,0.26)] hover:ring-1 hover:ring-[#5de0e6]/30"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_40%,transparent_70%,rgba(93,224,230,0.14))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-[#5de0e6] transition-all duration-300 group-hover:bg-white/24">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#5de0e6] to-[#004aad] opacity-90" />
                  </div>

                  <h3 className="relative z-10 mt-4 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>

                  <p className="relative z-10 mt-2 text-sm leading-6 text-slate-300">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-[2.4rem] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.26)] md:p-8 ${panelClassName()}`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_44%,rgba(93,224,230,0.03))]" />
          <div className="absolute left-[-80px] bottom-[-120px] h-72 w-72 rounded-full bg-[#004aad]/12 blur-3xl" />

          <div
            className={`relative z-10 rounded-[1.85rem] p-6 shadow-[0_20px_45px_rgba(8,17,31,0.16)] md:p-8 ${innerPanelClassName()}`}
          >
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
