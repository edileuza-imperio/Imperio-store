import api from "@/Api/conectar";


import { rotas } from "@/components/Bibioteca/config/rotas";
export type SiteConfig = {
  id_site_config: number;
  nome_site: string;
  titulo: string;
  subtitulo: string;
  logo: string | null;
  favicon: string | null;
};

export type SiteConfigApi = {
  id_site_config: number;
  nome_site: string;
  título: string;
  subtitulo: string;
  logotipo: string | null;
  favicon: string | null;
};

export type SiteConfigResponse = {
  status: number;
  mensagem: string;
  dados: {
    status: number;
    cache: boolean;
    dados: SiteConfigApi[];
  };
};
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const response = await api.get<SiteConfigResponse>(
      rotas.site.listar,
      {
        withCredentials: false,
      }
    );

    const site = response.data?.dados?.dados?.[0];

    if (!site) {
      throw new Error("Configuração do site não encontrada");
    }

    return {
      id_site_config: site.id_site_config,
      nome_site: site.nome_site,
      titulo: site.título || "Império",
      subtitulo: site.subtitulo || "Loja online",
      logo: site.logotipo || null,
      favicon: site.favicon || null,
    };
  } catch (error) {
    console.error("Erro ao buscar site config:", error);

    return {
      id_site_config: 0,
      nome_site: "Universo Império",
      titulo: "Universo Império",
      subtitulo: "Criado e desenvolvido por Alvarado Tech",
      logo: null,
      favicon: null,
    };
  }
}