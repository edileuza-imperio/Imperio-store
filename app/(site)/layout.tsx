import type { Metadata } from "next";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import "./../globals.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";

/*
|--------------------------------------------------------------------------
| CSS SITE
|--------------------------------------------------------------------------
*/

import "@/public/produto/produto.css";
import "@/public/produto/page.css";
import "@/public/produto/destaque.css";

import "@/public/categoria/cateid.css";
import "@/public/destaque/destaque.css";

import "@/public/navbar/Banner.css";
import "@/public/footer/footer.css";
import "@/public/Login/Login.css";
import "@/public/usuario/usuario.css";
import "@/public/usuario/editar.css";

/*
|--------------------------------------------------------------------------
| CSS ADMIN
|--------------------------------------------------------------------------
*/

import "@/public/admin/admin.css";
import "@/public/admin/painel.css";
import "@/public/admin/cards.css";

import "@/public/admin/produtos/pdt.css";
import "@/public/admin/produtos/adicionar.css";
import "@/public/admin/produtos/listar.css";

import { ToastContainer } from "react-toastify";

import Navbar from "@/components/site/menu/navbar";
import FooterProfissional from "@/components/site/Rodape/Footer";

import { getSiteConfig } from "@/services/siteConfig";

/*
|--------------------------------------------------------------------------
| CACHE NEXT
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
    <html lang="pt-BR">
      <body suppressHydrationWarning className="antialiased layout-body">

        {/* HEADER */}
        <header className="header-stack">
          <Navbar />
        </header>

        {/* CONTEÚDO */}
        <main className="main-content">
          {children}
        </main>

        {/* FOOTER */}
        <FooterProfissional />

        {/* TOAST */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />

        {/* ANALYTICS VERCEL */}
        <Analytics />

        {/* SPEED INSIGHTS */}
        <SpeedInsights />

      </body>
    </html>
  );
}