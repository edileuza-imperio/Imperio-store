import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { Menu } from "@/components/Bibioteca/Bibiotecas";
import { rotas } from "@/components/Bibioteca/config/rotas";

type SiteConfig = {
  id_site_config: number;
  nome_site: string;
  titulo: string | null;
  subtitulo: string | null;
  logo: string | null;
  favicon: string | null;
};

type SiteConfigResponse = {
  status: number;
  mensagem: string;
  dados: SiteConfig[];
};

type MenusResponse = {
  status: number;
  mensagem: string;
  dados: Menu[];
};

export const useMenu = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [tituloNavbar, setTituloNavbar] = useState<string | null>(null);
  const [subtituloNavbar, setSubtituloNavbar] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDadosNavbar = async () => {
      try {
        setLoading(true);
        setError(null);

        const [menusResponse, siteConfigResponse] = await Promise.all([
          api.get<MenusResponse>(rotas.site.menu),
          api.get<SiteConfigResponse>(rotas.site.listar),
        ]);

        const menusData = menusResponse.data;
        const siteData = siteConfigResponse.data;

        if (menusData.status !== 200) {
          throw new Error(menusData.mensagem || "Erro ao buscar menus");
        }

        if (siteData.status !== 200) {
          throw new Error(siteData.mensagem || "Erro ao buscar configuração do site");
        }

        setMenus(menusData.dados || []);

        const config = siteData.dados?.[0] || null;

        setTituloNavbar(config?.titulo ?? null);
        setSubtituloNavbar(config?.subtitulo ?? null);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar navbar");
        setMenus([]);
        setTituloNavbar(null);
        setSubtituloNavbar(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDadosNavbar();
  }, []);

  return {
    menus,
    tituloNavbar,
    subtituloNavbar,
    loading,
    error,
  };
};