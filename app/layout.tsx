import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { AppFooter } from "@/components/i18n/app-footer";
import { LanguageProvider } from "@/components/i18n/language-provider";

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
  description:
    "CEO Operating System para administrar, analizar y decidir con inteligencia operativa."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} min-h-screen bg-slate-950 font-sans text-white antialiased`}>
        <LanguageProvider>
          <div className="min-h-screen overflow-x-hidden pb-16 md:pb-20">{children}</div>
          <AppFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
