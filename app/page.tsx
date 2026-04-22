import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    emoji: "🛠️",
    title: "Registro guiado",
    description: "Alta estructurada en dos pasos para iniciar sin fricción."
  },
  {
    emoji: "🔒",
    title: "Acceso por código único",
    description: "Identificación directa sin procesos innecesarios."
  },
  {
    emoji: "✅",
    title: "Validación autorizada",
    description: "Solo usuarios aprobados pueden formar parte del sistema."
  },
  {
    emoji: "🌐",
    title: "Seguridad por empresa",
    description: "Cada organización opera en su propio entorno protegido."
  }
];

export default function HomePage() {
  return (
    <main className="container py-10 md:py-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-sm font-semibold text-blue-700 shadow-soft">
            Orbit Nexus · Fase 1
          </div>

          <div className="space-y-6">
            <h1 className="max-w-4xl text-5xl leading-[1.02] text-balance md:text-6xl lg:text-7xl">
              <span className="font-black text-slate-950">Orbit </span>
              <span className="font-black text-[#2563EB]">Nexus</span>
              <span className="font-semibold text-slate-900">
                {" "}
                convierte complejidad en control.
              </span>
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              Centraliza usuarios, proyectos y validaciones en una sola arquitectura para operar
              con orden, seguridad y trazabilidad real.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {highlights.map((item) => (
            <Card
              key={item.title}
              className="group cursor-pointer border-white/90 bg-white/92 shadow-float transition-all duration-300 hover:-translate-y-1 hover:bg-[#093452] hover:shadow-xl"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl transition-colors duration-300 group-hover:text-white">
                    {item.emoji}
                  </span>
                  <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-slate-900 via-slate-700 to-blue-600 transition-opacity duration-300 group-hover:opacity-80" />
                </div>

                <CardTitle className="text-xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-white">
                  {item.title}
                </CardTitle>

                <p className="text-sm leading-6 text-slate-500 transition-colors duration-300 group-hover:text-slate-300">
                  {item.description}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
