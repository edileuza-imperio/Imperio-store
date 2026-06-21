"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

type BannerStatus = {
  id: number;
  nome: string;
  codigo: string;
};

export type BannerItem = {
  id_banner: number;
  titulo: string;
  descricao: string | null;
  imagem: string;
  link: string | null;
  status: BannerStatus;
  visualizacoes: number;
  cliques: number;
  criado: string;
  atualizado: string;
};

type BannerResponse = {
  status: number;
  mensagem: string;
  dados: BannerItem[];
};

export function useBanner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  async function carregarBanners() {
    setLoading(true);

    try {
      const response = await api.get<BannerResponse>(rotas.banners.listar);
      const lista = response.data.dados ?? [];

      setBanners(lista);
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

  const bannerAtual = useMemo(() => {
    return banners[index] ?? null;
  }, [banners, index]);

  return {
    banners,
    banner: bannerAtual,
    index,
    setIndex,
    loading,
    total: banners.length,
    recarregar: carregarBanners,
  };
}