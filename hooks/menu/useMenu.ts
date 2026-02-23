// src/hooks/menu/useMenu.ts
import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { Menu } from "@/components/Bibioteca/Bibiotecas";


export function useMenu(endpoint: string = rotas.menu.ativos) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);

        const response = await api.get(endpoint);
        const data = response.data;

        if (!data || data.status !== 200) {
          throw new Error(data?.mensagem || "Erro ao buscar menus");
        }

        const cards = data.dados?.cards ?? [];

        // 🔥 converte do backend (titulo) para o frontend (nome)
        const normalized: Menu[] = cards.map((m: any) => ({
          id: m.id,
          nome: m.titulo, // <- aqui resolve
          icone: m.icone,
          rota: m.rota,
          pesquisa_placeholder: m.pesquisa_placeholder ?? null,
        }));

        setMenus(normalized);
      } catch (err: any) {
        setError(err.message || "Erro ao buscar menus");
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [endpoint]);

  return { menus, loading, error };
}