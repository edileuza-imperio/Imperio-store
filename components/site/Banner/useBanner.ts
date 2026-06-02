"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

type BannerItem = {
  id_banner: number;
  titulo: string;
  descricao?: string | null;
  imagem: string;
  link?: string | null;
  statusid?: number;
};

export function useBanner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔥 API (isolada)
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const res = await api.get(rotas.banners.listar);
        const data = res.data?.dados?.dados ?? [];

        const validos = Array.isArray(data)
          ? data.filter((b: BannerItem) => b?.statusid === 1 && b?.imagem)
          : [];

        setBanners(validos);
        setIndex(0);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // 🔥 autoplay separado
  useEffect(() => {
    if (banners.length <= 1) return;

    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);

    return () => clearInterval(t);
  }, [banners.length]);

  const banner = useMemo(() => banners[index], [banners, index]);

  return {
    banners,
    banner,
    index,
    setIndex,
    loading,
  };
}