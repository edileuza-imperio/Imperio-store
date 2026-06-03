"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";

export type Campanha = {
  id_campanha: number | string;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
  desktop?: string;
  mobile?: string;
  imagem?: string;
  statusid?: number;
};

function extrairCampanhas(payload: any): Campanha[] {
  const lista = payload?.dados?.dados?.campanhas;
  return Array.isArray(lista) ? lista : [];
}

export function useCampanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);

        const response = await api.get("/bootstrap/home", {
          withCredentials: true,
        });

        const lista = extrairCampanhas(response.data);

        const validas = lista.filter((c) => c?.statusid === 1);

        setCampanhas(validas);
      } catch (err: any) {
        setErro("Erro ao carregar campanhas");
        setCampanhas([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return { campanhas, loading, erro };
}