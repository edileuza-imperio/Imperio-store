import api from "@/Api/conectar";
import { useEffect, useState } from "react";

export interface MenuItem {
  id?: number;
  nome: string;
  icone?: string;
  rota?: string;
  posicao?: number;
  menu_id?: number;
}

export default function useMenuItems(nivelId?: number) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nivelId) return; // espera ter nivelId

    const fetchMenuItems = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/menu/itens/${nivelId}`);
        const data = response.data;

        if (data.status !== 200) throw new Error(data.mensagem || "Erro ao buscar menu");

        setMenuItems(data.dados || []);
      } catch (err: any) {
        setError(err.message || "Erro ao buscar menu");
        console.error("useMenuItems:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [nivelId]);

  return { menuItems, loading, error };
}
