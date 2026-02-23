'use client';

import Banner from "@/components/site/Banner/Principal";
import Categoria from "@/components/site/categoria/Categoria";
import Cupons from "@/components/site/Faixa/FaixaChamada";


import Navbar from "@/components/site/menu/navbar";
import ProdutoDestaque from "@/components/site/produto/ProdutoDestaque";
import FooterPrincipal from "@/components/site/Rodape/Footer";



export default function HomeContent() {
  return (
    <>
      <Navbar />
      <Banner />
      <Categoria />
      <ProdutoDestaque />
      
      <FooterPrincipal />
    </>
  );
}