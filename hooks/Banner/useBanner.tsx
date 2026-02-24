'use client';

import { useCallback, useEffect, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { Banner } from "@/components/Bibioteca/Bibiotecas";



interface UseBannerReturn {
  banners: Banner[];
  loading: boolean;
  erro: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook genérico de banner
 * Agora recebe diretamente a rota
 */
export default function useBanner(
  endpoint: string = rotas.banners.ativos
): UseBannerReturn {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      const res = await api.get(endpoint);

      if (res.data?.status !== 200) {
        setErro(res.data?.mensagem || "Erro ao buscar banners");
        setBanners([]);
        return;
      }

      setBanners(Array.isArray(res.data?.dados) ? res.data.dados : []);
    } catch (e: any) {
      setErro(
        e?.response?.data?.mensagem ||
        e?.message ||
        "Erro ao buscar banners"
      );
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return { banners, loading, erro, refetch: fetchBanners };
}