import type { Metadata } from "next";

import "./../globals.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";

// CSS ORGANIZADO
import "@/public/produto/produto.css";
import "@/public/produto/page.css";
import "@/public/produto/destaque.css";

import "@/public/admin/admin.css";
import "@/public/admin/painel.css";
import "@/public/admin/cards.css";
import "@/public/admin/produtos/pdt.css";
import "@/public/admin/produtos/adicionar.css";
import "@/public/admin/produtos/listar.css";

import "@/public/categoria/cateid.css";
import "@/public/destaque/destaque.css";


import "@/public/navbar/Banner.css";

import "@/public/footer/footer.css";

import "@/public/Login/Login.css";
import "@/public/usuario/usuario.css";
import "@/public/usuario/editar.css";

import { ToastContainer } from "react-toastify";

import { getSiteConfig } from "@/services/siteConfig";
import Navbar from "@/components/site/menu/navbar";
import FooterProfissional from "@/components/site/Rodape/Footer";
import Topbar from "@/components/site/Topbar/Topbar";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();

  return {
    title: site.titulo,
    description: site.subtitulo,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body suppressHydrationWarning className="antialiased layout-body">

        {/* HEADER STACK FIXO */}
        <div className="header-stack">
          
          <Navbar />
        </div>

        {/* CONTEÚDO */}
        <main className="main-content">
          {children}
        </main>

        <FooterProfissional />

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

      </body>
    </html>
  );
}