'use client';

import { useState, useEffect } from "react";
import api from "@/Api/conectar";

// Interface para representar um Banner
export interface Banner {
  titulo: string;
  descricao: string;
  imagem: string;
  link?: string;
  visualizacoes: number;
  cliques: number;
}

interface UseBannerReturn {
  banners: Banner[] | null;
  loading: boolean;
  erro: string | null;
  refetch: () => void;
}

/**
 * Hook para consumir banners do backend
 * @param tipo 'ativos' | 'todos'
 */
export default function useBanner(tipo: "ativos" | "todos" = "ativos"): UseBannerReturn {
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    setErro(null);

    try {
      const url = tipo === "ativos" ? "/banners/ativos" : "/banners";
      const res = await api.get(url);

      // Verifica status da API
      const status = res.data?.status;
      const dados = res.data?.dados || res.data?.banners || [];

      if (status !== 200) {
        setErro(res.data?.mensagem || "Erro desconhecido");
        setBanners([]);
      } else {
        setBanners(dados);
      }

    } catch (e: any) {
      setErro(e.message || "Erro ao buscar banners");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [tipo]);

  return { banners, loading, erro, refetch: fetchBanners };
}
