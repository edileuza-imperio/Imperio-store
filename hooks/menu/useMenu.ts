// src/hooks/useMenu.ts
'use client'
import { useState, useEffect } from "react";
import api from "@/Api/conectar";

export interface Menu {
  id?: number;
  nome: string;
  icone: string;
  rota: string;
  pesquisa_placeholder?: string | null;
}

interface UseMenuReturn {
  menus: Menu[] | null;
  mensagem: string;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para consumir menus da API
 * @param endpoint Rota do controller Menu (ex: 'ativos' ou 'listar')
 */
export function useMenu(endpoint: "ativos" | "listar" = "ativos"): UseMenuReturn {
  const [menus, setMenus] = useState<Menu[] | null>(null);
  const [mensagem, setMensagem] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await api.get(`/menu/${endpoint}`);
        setMenus(response.data.dados || []);
        setMensagem(response.data.mensagem || "");
      } catch (err: any) {
        setError("Erro ao carregar menus");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [endpoint]);

  return { menus, mensagem, loading, error };
}
