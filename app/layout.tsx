import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  title: "Orbit Nexus",
  description: "Plataforma SaaS B2B multiempresa para empresas, consultores y clientes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} min-h-screen bg-slate-950 font-sans text-white antialiased`}>
        <div className="min-h-screen">{children}</div>
        <footer className="pointer-events-none fixed inset-x-0 bottom-3 z-[70] px-4 text-center text-xs text-white/60 md:text-sm">
          © 2026 Orbit Nexus by MAIA. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
