import type { Metadata } from "next";

import MercadoPagoProvider from "@/components/MercadoPagoProvider";

import "./../styles/variables.css";
import "./../styles/layout.css";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { getSiteConfig } from "@/services/siteConfig";
import ToastProvider from "@/components/Bibioteca/toast";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const site = await getSiteConfig();

    return {
      title: site?.titulo || "Império",
      description: site?.subtitulo || "Loja online",
    };
  } catch {
    return {
      title: "Império",
      description: "Loja online",
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className="antialiased">
        <MercadoPagoProvider />
        {children}

        <ToastProvider />

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}