"use client";

import Banner from "@/components/site/Banner/Banner";
import CategoriasDestaque from "@/components/site/categoria/Categoria";
import Destaques from "../Vitrine/Destaques/page";

export default function HomeContent() {
  return (
    <>
      <Banner />

      <CategoriasDestaque />

      <Destaques />
    </>
  );
}