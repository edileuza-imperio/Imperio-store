import type { Metadata } from "next";
import "../globals.css";
import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { getSiteConfig } from "@/services/siteConfig";

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
        {children}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}