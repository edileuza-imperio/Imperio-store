"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import ApiError from "@/components/pages/Error/ApiError";
import HomeSkeleton from "@/components/pages/ui/HomeSkeleton";
import useApi from "@/components/principal/UseApi";
import HomeContent from "@/Home/HomeContent";
import useUsuario from "@/hooks/Auth/useUsuario";




export default function Home() {

  const router = useRouter();

  const { usuario, loading: loadingUser, logado } = useUsuario();
  const { loading, error, refetch } = useApi();

  

  

  return (
    <>
      
      {!error && <HomeContent />}
    </>
  );
}