'use client';

import Banner from "@/components/site/Banner/Principal";
import CategoriasDestaque from "@/components/site/categoria/CategoriasDestaque";

import Navbar from "@/components/site/menu/navbar";



export default function HomeContent() {
  return (
    <>
    <Navbar />
    <Banner />
    <CategoriasDestaque />
    </>
  );
}