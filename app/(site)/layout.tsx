import type { Metadata } from "next";

import "./../globals.css";
import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Navbar from "@/components/site/menu/navbar";
import FooterProfissional from "@/components/site/Rodape/Footer";

import { getSiteConfig } from "@/services/siteConfig";
import "@/styles/base/globals.css";
import "@/styles/base/variables.css";
/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/
export const revalidate = 300;

/*
|--------------------------------------------------------------------------
| METADATA
|--------------------------------------------------------------------------
*/
export async function generateMetadata(): Promise<Metadata> {
  try {
    const site = await getSiteConfig();

    return {
      title: site?.titulo || "Império",
      description: site?.subtitulo || "Loja online",
    };
  } catch (error) {
    console.error("Erro metadata:", error);

    return {
      title: "Império",
      description: "Loja online",
    };
  }
}

/*
|--------------------------------------------------------------------------
| ROOT LAYOUT
|--------------------------------------------------------------------------
*/
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body suppressHydrationWarning className="antialiased layout-body">

        {/* HEADER */}
        <header className="header-stack">
          <Navbar />
        </header>

        {/* MAIN CONTENT */}
        <main className="main-content">
          {children}
        </main>

        {/* FOOTER */}
        <FooterProfissional />

        {/* TOAST */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />

        {/* ANALYTICS (OK manter) */}
        <Analytics />

        {/* SPEED INSIGHTS (OK manter) */}
        <SpeedInsights />

      </body>
    </html>
  );
}