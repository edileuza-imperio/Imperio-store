"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";


export default function ProdutoPage() {
  const params = useParams();
  const slug = params?.slug as string | undefined;

  // Se quiser debugar depois, pode usar:
  // console.log("Slug capturado:", slug);

  return (
    <>
      <Navbar />

      <main style={{ minHeight: "60vh" }}>
        {/* Página limpa por enquanto */}
        {/* Slug já está disponível na variável `slug` */}
      </main>

      <FooterPrincipal />
    </>
  );
}