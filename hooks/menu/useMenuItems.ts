import api from "@/Api/conectar";
import { useEffect, useState } from "react";

export interface MenuItem {
  id_item?: number;
  nome: string;
  icone?: string;
  rota?: string;
  posicao?: number;
  menu_id?: number;
}

export default function useMenuItems(menuId?: number) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!menuId) return;

    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔎 Buscando itens do menu:", menuId);

        const response = await api.get(`/menu/${menuId}/itens`);

        console.log("📦 Resposta completa da API:", response);
        console.log("📦 response.data:", response.data);

        const data = response.data;

        if (data.status !== 200) {
          throw new Error(data.mensagem || "Erro ao buscar menu");
        }

        // 👇 AQUI ESTÁ A MUDANÇA
        const itens = data.dados?.itens || [];

        console.log("✅ Itens extraídos:", itens);

        setMenuItems(itens);

      } catch (err: any) {
        console.error("❌ Erro no useMenuItems:", err);
        setError(err.message || "Erro ao buscar menu");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [menuId]);

  return { menuItems, loading, error };
}