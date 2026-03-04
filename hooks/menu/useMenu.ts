import { useEffect, useState } from "react";
import api from "@/Api/conectar";

export interface Menu {
  id?: number;
  titulo?: string;
  icone?: string;
  rota?: string;
  pesquisa_placeholder?: string | null;
  itens?: any[];
}

export const useMenu = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [tituloNavbar, setTituloNavbar] = useState("Universo Império");
  const [subtituloNavbar, setSubtituloNavbar] = useState("Decorações & Eventos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const response = await api.get("/navbar");
        const data = response.data;

        if (data.status !== 200) throw new Error(data.mensagem || "Erro ao buscar navbar");

        setMenus(data.dados.menus || []);
        setTituloNavbar(data.dados.titulo || "Universo Império");
        setSubtituloNavbar(data.dados.subtitulo || "Decorações & Eventos");
      } catch (err: any) {
        setError(err.message || "Erro ao carregar navbar");
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  return { menus, tituloNavbar, subtituloNavbar, loading, error };
};