'use client';

import Banner from "@/components/site/Banner/Principal";
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