"use client";

import Banner from "@/components/site/Banner/Principal";
import CategoriasDestaque from "@/components/site/categoria/CategoriasDestaque";
import CuponsDestaque from "@/components/site/Faixa/FaixaChamada";
import FaixaChamada from "@/components/site/Faixa/FaixaChamada";
import Navbar from "@/components/site/menu/navbar";
import ProdutoDestaque from "@/components/site/produto/ProdutoDestaque";
import FooterPrincipal from "@/components/site/Rodape/Footer";
import { useApiTest } from "@/hooks/apitest/useApiTest";

export default function Home() {
  const { data, mensagem, loading, error } = useApiTest();

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <>
      <Navbar />
      <Banner />
      <CategoriasDestaque />
      <ProdutoDestaque />
      <CuponsDestaque
      />
      <FooterPrincipal />
      
    </>
  );
}
