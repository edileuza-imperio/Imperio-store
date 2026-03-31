'use client';

import Destaques from "@/app/Vitrine/Destaques/page";
import DestaquesSection from "@/components/destaques/DestaquesSection";
import Banner from "@/components/site/Banner/Banner";
import CategoriasDestaque from "@/components/site/categoria/Categoria";
import Categoria from "@/components/site/categoria/Categoria";
import Cupons from "@/components/site/Cupons/Cupons";

import Navbar from "@/components/site/menu/navbar";




export default function HomeContent() {
  return (
    <>
      <Navbar />
      <Banner />
      <CategoriasDestaque />
      <Destaques slug="produtos-destaque" />
      
    
        
      
      

    </>
  );
}