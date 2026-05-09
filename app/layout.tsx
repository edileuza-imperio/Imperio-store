import type { Metadata } from "next";

import "./globals.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "react-toastify/dist/ReactToastify.css";

// seus imports css...

import { ToastContainer } from "react-toastify";

import { getSiteConfig } from "@/services/siteConfig";

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

        
        {children}

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