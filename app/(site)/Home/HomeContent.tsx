'use client';

import { useEffect, useState } from "react";
import api from "@/Api/conectar";

import Destaques from "@/components/destaques/destaques";
import Banner from "@/components/site/Banner/Banner";
import CategoriasDestaque from "@/components/site/categoria/Categoria";
import Campanha from "../campanha/page";



type Vitrine = {
  id_vitrine: number | string;
  nome?: string;
  slug?: string;
  titulo?: string;
  subtitulo?: string | null;
  tipo?: string;
  itens?: any[];
};

function extrairLista(payload: any): any[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function HomeContent() {
  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarVitrines() {
      try {
        setLoading(true);

        const response = await api.get("/vitrines/com-itens", {
          withCredentials: true,
        });

        const lista = extrairLista(response?.data) as Vitrine[];
        setVitrines(lista);
      } catch (error) {
        console.error("Erro ao carregar vitrines:", error);
        setVitrines([]);
      } finally {
        setLoading(false);
      }
    }

    carregarVitrines();
  }, []);

  return (
    <>
      

      
      <Banner />
      <CategoriasDestaque />
      <Campanha  />
      {!loading &&
        vitrines.map((vitrine) => (
          <Destaques
            key={String(vitrine.id_vitrine)}
            vitrine={vitrine}
          />
        ))}

        
    </>
  );
}