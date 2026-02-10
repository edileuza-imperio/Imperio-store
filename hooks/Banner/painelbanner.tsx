import { useState, useEffect } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";

export interface BannerStatus {
  nome: string;
  cor?: string;
}

export interface Banner {
  id_banner: number;
  titulo: string;
  descricao?: string;
  imagem?: string;
  link?: string; // ✅ CORREÇÃO DO ERRO
  visualizacoes: number;
  cliques: number;
  status?: BannerStatus;
}

export default function useBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarBanners() {
    setLoading(true);
    try {
      const res = await api.get("/admin/banner");
      setBanners(res.data.dados || []);
    } catch {
      toast.error("Erro ao carregar banners");
    } finally {
      setLoading(false);
    }
  }

  async function removerBanner(id: number) {
    if (!confirm("Deseja remover este banner?")) return;
    try {
      await api.delete(`/admin/banner/${id}/remover`);
      toast.success("Banner removido com sucesso");
      carregarBanners();
    } catch {
      toast.error("Erro ao remover banner");
    }
  }

  useEffect(() => {
    carregarBanners();
  }, []);

  return {
    banners,
    loading,
    carregarBanners,
    removerBanner
  };
}
