import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import "@/app/globals.css";

const manrope = localFont({
  src: [
    {
      path: "./fonts/Manrope-300.ttf",
      weight: "300",
      style: "normal"
    },
    {
      path: "./fonts/Manrope-400.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "./fonts/Manrope-500.ttf",
      weight: "500",
      style: "normal"
    },
    {
      path: "./fonts/Manrope-600.ttf",
      weight: "600",
      style: "normal"
    },
    {
      path: "./fonts/Manrope-700.ttf",
      weight: "700",
      style: "normal"
    },
    {
      path: "./fonts/Manrope-800.ttf",
      weight: "800",
      style: "normal"
    }
  ],
  display: "swap",
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  title: "Orbit Nexus",
  description: "Executive Intelligence System para organizar, analizar y decidir con inteligencia operativa."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} min-h-screen bg-slate-950 font-sans text-white antialiased`}>
        <div className="min-h-screen overflow-x-hidden pb-16 md:pb-20">{children}</div>
        <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] bg-slate-950/24 px-4 py-2 text-center backdrop-blur-md">
          <div className="mx-auto mb-2 h-px max-w-xs bg-[linear-gradient(90deg,transparent,#0EA5E9,transparent)] opacity-30" />
          <p className="text-[11px] text-white/60 md:text-xs">
            © 2026 <span className="text-[#38BDF8]">ORBIT NEXUS</span>. Todos los derechos reservados. Los datos personales y empresariales son protegidos conforme a nuestras politicas de privacidad y seguridad.
          </p>
        </footer>
      </body>
    </html>
  );
}
