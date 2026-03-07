import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import './../public/produto/produto.css';
import './../public/produto/page.css';
import './../public/carrinho/carrinho.css';
import './../public/carrinho/checkout.css';
import './../public/categoria/categoria.css';
import './../public/categoria/cateid.css';
import './../public/destaque/destaque.css';

import './../public/navbar/navbar.css';
import './../public/navbar/mobile.css';

import './../public/navbar/Banner.css';
import './../public/footer/footer.css';

import './../public/produto/destaque.css';
import './../public/admin/painel.css';
import './../public/admin/cards.css';
import './../public/admin/produtos/pdt.css';
import './../public/admin/produtos/adicionar.css';
export const metadata: Metadata = {
  title: "Universo imperio",
  description: "criado e desenvolvido por alvarado tech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={` antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
