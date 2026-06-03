"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/Api/conectar";

export type CarrinhoItem = {
  id_carrinho_item: number;
  carrinho_id: number;
  produto_id: number;
  produto_nome: string;
  produto_slug: string | null;
  imagem: string | null;
  quantidade: number;
  preco_unitario: number;
  preco_promocional_unitario?: number | null;
  subtotal: number;
  status_id?: number;
  criado_em?: string;
  atualizado_em?: string;
};

export type Carrinho = {
  id_carrinho: number;
  usuario_id?: number | null;
  sessao_id?: number | null;
  status_id: number;
  quantidade_itens?: number;
  total?: number;
};

export function useCarrinho() {
  const [itens, setItens] = useState<CarrinhoItem[]>([]);
  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [loading, setLoading] = useState(false);

  const buscarCarrinho = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/carrinho");
      setCarrinho(res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const listarItens = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/carrinho/itens");
      setItens(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const adicionarProduto = useCallback(
    async (produto_id: number, quantidade: number = 1) => {
      await api.post("/carrinho/adicionar", {
        produto_id,
        quantidade,
      });

      await listarItens();
      await buscarCarrinho();
    },
    [buscarCarrinho, listarItens]
  );

  const atualizarQuantidade = useCallback(
    async (itemId: number, quantidade: number) => {
      await api.put(`/carrinho/item/${itemId}`, {
        quantidade,
      });

      await listarItens();
      await buscarCarrinho();
    },
    [buscarCarrinho, listarItens]
  );

  const removerItem = useCallback(
    async (itemId: number) => {
      await api.delete(`/carrinho/item/${itemId}`);

      await listarItens();
      await buscarCarrinho();
    },
    [buscarCarrinho, listarItens]
  );

  const recalcular = useCallback(async () => {
    await api.put("/carrinho/recalcular");

    await listarItens();
    await buscarCarrinho();
  }, [buscarCarrinho, listarItens]);

  useEffect(() => {
    buscarCarrinho();
    listarItens();
  }, [buscarCarrinho, listarItens]);

  return {
    itens,
    carrinho,
    loading,
    buscarCarrinho,
    listarItens,
    adicionarProduto,
    atualizarQuantidade,
    removerItem,
    recalcular,
  };
}