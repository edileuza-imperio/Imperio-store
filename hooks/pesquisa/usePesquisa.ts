// hooks/usePesquisa.ts
'use client';

import { useState, useEffect } from "react";
import api from "@/Api/conectar"; // sua instância do Axios com baseURL

export interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string;
  preco?: number;
  slug?: string;
  imagem?: string;
  estoque?: number;
}

export function usePesquisa(termoInicial: string = "") {
  const [termo, setTermo] = useState(termoInicial);
  const [resultados, setResultados] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!termo) {
      setResultados([]);
      return;
    }

    const fetchProdutos = async () => {
      setLoading(true);
      setError(null);

      try {
        // Chama a API usando a baseURL do Axios
        const response = await api.get(`/produtos/pesquisa?q=${encodeURIComponent(termo)}`);
        setResultados(response.data.dados || []);
        console.log("Resultados da pesquisa:", response.data.dados);
      } catch (err: any) {
        setError("Erro ao buscar produtos");
        console.error("Erro no usePesquisa:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchProdutos, 300); // debounce
    return () => clearTimeout(timer);

  }, [termo]);

  return { termo, setTermo, resultados, loading, error };
}
