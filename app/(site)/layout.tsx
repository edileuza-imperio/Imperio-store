import type { Metadata } from "next";

import "./../globals.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "react-toastify/dist/ReactToastify.css";

// PRODUTOS
import "@/public/produto/produto.css";
import "@/public/produto/page.css";
import "@/public/produto/destaque.css";

// ADMIN
import "@/public/admin/admin.css";
import "@/public/admin/painel.css";
import "@/public/admin/cards.css";

import "@/public/admin/produtos/pdt.css";
import "@/public/admin/produtos/adicionar.css";
import "@/public/admin/produtos/listar.css";

// CATEGORIA
import "@/public/categoria/cateid.css";

// DESTAQUE
import "@/public/destaque/destaque.css";

// NAVBAR
import "@/public/navbar/navbar.css";
import "@/public/navbar/mobile.css";
import "@/public/navbar/Banner.css";

// FOOTER
import "@/public/footer/footer.css";

// LOGIN
import "@/public/Login/Login.css";




// USUÁRIO
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

      <body className="antialiased">
        <Topbar />
        <Navbar /> 

        {children}

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