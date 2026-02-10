// src/hooks/categoria/useCategoria.ts
'use client';

import { useState, useEffect } from "react";
import api from "@/Api/conectar";

export interface Categoria {
  id_categoria: number;
  nome: string;
  icone: string;
  statusid: number;
  criado: string;
}

export default function useCategoria(statusId?: number) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(true);
      setErro(null);
      try {
        let url = "/categorias";

        if (statusId === 1) {
          url = "/categorias/ativas";
        }

        const response = await api.get(url);
        // 🔹 Aqui pegamos o array de categorias dentro de `dados`
        setCategorias(response.data.dados);
      } catch (error: any) {
        console.error("Erro ao carregar categorias:", error);
        setErro("Não foi possível carregar as categorias.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, [statusId]);

  return { categorias, loading, erro };
}
