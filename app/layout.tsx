import type { Metadata } from "next";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";
import { getSiteConfig } from "@/services/siteConfig";

export const dynamic = "force-dynamic"; // 👈 ISSO AQUI

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();

  return {
    title: site?.titulo || "Império",
    description: site?.subtitulo || "Loja online",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className="antialiased">
        {children}

        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}