"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

type BannerStatus = {
  id?: number;
  nome?: string;
  codigo?: string;
};

export type BannerItem = {
  id_banner: number;
  titulo: string;
  descricao?: string | null;
  imagem: string;
  link?: string | null;
  statusid?: number;
  status?: BannerStatus;
  visualizacoes?: number;
  cliques?: number;
  criado?: string;
  atualizado?: string;
};

type ApiBannerResponse = {
  status: number;
  mensagem: string;
  dados: BannerItem[] | {
    status: number;
    mensagem: string;
    dados: BannerItem[];
  };
};

function normalizarBanners(data: ApiBannerResponse): BannerItem[] {
  if (Array.isArray(data?.dados)) {
    return data.dados;
  }

  if (Array.isArray(data?.dados?.dados)) {
    return data.dados.dados;
  }

  return [];
}

export function useBanner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  async function carregarBanners() {
    try {
      setLoading(true);

      const response = await api.get<ApiBannerResponse>(rotas.banners.listar);
      const lista = normalizarBanners(response.data);

      const ativos = lista.filter((banner) => {
        const statusId = banner.status?.id ?? banner.statusid;
        const statusCodigo = banner.status?.codigo;

        return (
          Boolean(banner.imagem) &&
          (statusId === 1 || statusCodigo === "ATIVO")
        );
      });

      setBanners(ativos);
      setIndex(0);
    } catch (error) {
      console.error("Erro ao carregar banners:", error);
      setBanners([]);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarBanners();
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;

    const timer = window.setInterval(() => {
      setIndex((atual) => (atual + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = useMemo(() => {
    return banners[index] ?? null;
  }, [banners, index]);

  return {
    banners,
    banner,
    index,
    setIndex,
    loading,
    total: banners.length,
    recarregar: carregarBanners,
  };
}