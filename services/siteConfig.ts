import api from "@/Api/conectar";
import { SiteConfig, SiteConfigResponse } from "@/components/Bibioteca/Bibiotecas";
import { rotas } from "@/components/Bibioteca/config/rotas";



export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const response = await api.get<SiteConfigResponse>(rotas.site.listar, {
      withCredentials: false,
    });

    return response.data.dados[0];
  } catch (error) {
    console.error("Erro ao buscar site config:", error);

    return {
      id_site_config: 0,
      nome_site: "Universo imperio",
      titulo: "Universo imperio",
      subtitulo: "criado e desenvolvido por alvarado tech",
      logo: null,
      favicon: null,
    };
  }
}