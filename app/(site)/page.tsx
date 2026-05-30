"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";


import HomeContent from "@/app/(site)/Home/HomeContent";
import useUsuario from "@/hooks/Auth/useUsuario";




export default function Home() {

  const router = useRouter();

  const { usuario, loading: loadingUser, logado } = useUsuario();


  

  

  return (
    <>
      
      {<HomeContent />}
    </>
  );
}