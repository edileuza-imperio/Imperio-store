"use client";

import { useCallback, useEffect, useState } from "react";
import { InicioApi } from "@/services/api/api";
import { imagemFundo } from "@/components/Bibioteca/imagem";

export type Categoria = {
  id_categoria?: number;
  nome?: string;
  slug?: string;
  icone?: string;
  descricao?: string;
  imagem?: string;
};

export type Produto = {
  id_produto?: number;
  nome?: string;
  slug?: string;
  descricao?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  imagem?: string;
};

export type ProdutoComImagem = Produto & {
  imagem_resolvida?: string;
};

type ApiResponse = {
  status?: number;
  mensagem?: string;
  dados?: {
    status?: number;
    mensagem?: string;
    categoria?: Categoria;
    dados?: Produto[];
  };
};

export function useCategoria(slugParam: string) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [produtos, setProdutos] = useState<ProdutoComImagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    if (!slugParam) {
      setCategoria(null);
      setProdutos([]);
      setErro("Categoria não informada.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErro(null);

      const response = await InicioApi.get<ApiResponse>(
        `/produtos/categoria/slug/${slugParam}`
      );

      const categoriaApi = response?.data?.dados?.categoria || null;

      const produtosApi = Array.isArray(response?.data?.dados?.dados)
        ? response.data.dados.dados
        : [];

      const produtosTratados: ProdutoComImagem[] = produtosApi.map((produto) => ({
        ...produto,
        imagem_resolvida: imagemFundo(produto.imagem),
      }));

      setCategoria(categoriaApi);
      setProdutos(produtosTratados);
    } catch (error) {
      console.error("Erro ao carregar categoria:", error);
      setErro("Houve um problema ao buscar os dados da categoria.");
      setCategoria(null);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, [slugParam]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return {
    categoria,
    produtos,
    loading,
    erro,
    refetch: carregarDados,
  };
}