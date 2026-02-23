'use client';

import Banner from "@/components/site/Banner/Principal";
import Categoria from "@/components/site/categoria/Categoria";


import Navbar from "@/components/site/menu/navbar";



export default function HomeContent() {
  return (
    <>
    <Navbar />
    <Banner />
    <Categoria />
    </>
  );
}