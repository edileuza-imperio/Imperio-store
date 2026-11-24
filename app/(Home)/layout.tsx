import type { ReactNode } from "react";

import { AuthProvider } from "@/components/contexts/AuthContext";
import FooterLoja from "@/components/Site/Footer/FooterLoja";
import Navbar from "@/components/Site/Navbar/navbar";

interface HomeLayoutProps {
  children: ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <AuthProvider>
      <section className="layout-loja">
        <Navbar className="navbar-pagina" />

        {/* Cada página controla a própria largura e suas seções. */}
        <main className="layout-loja__conteudo">{children}</main>

        {/* O rodapé permanece depois de todo o conteúdo da página. */}
        <FooterLoja />
      </section>
    </AuthProvider>
  );
}
