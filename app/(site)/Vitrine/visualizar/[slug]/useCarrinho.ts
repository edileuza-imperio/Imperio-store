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

function extrairMensagemErro(error: unknown, fallback = "Ocorreu um erro.") {
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const anyError = error as any;
    return (
      anyError?.response?.data?.erro ||
      anyError?.response?.data?.mensagem ||
      anyError?.message ||
      fallback
    );
  }

  return fallback;
}

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

  const atualizarEstado = useCallback(async () => {
    await Promise.all([listarItens(), buscarCarrinho()]);
  }, [buscarCarrinho, listarItens]);

  const adicionarProduto = useCallback(
    async (produto_id: number, quantidade: number = 1) => {
      try {
        await api.post("/carrinho/adicionar", {
          produto_id,
          quantidade,
        });

        await atualizarEstado();

        return {
          ok: true,
          mensagem: "Produto adicionado ao carrinho.",
        };
      } catch (error) {
        throw new Error(
          extrairMensagemErro(error, "Não foi possível adicionar o produto ao carrinho.")
        );
      }
    },
    [atualizarEstado]
  );

  const atualizarQuantidade = useCallback(
    async (itemId: number, quantidade: number) => {
      try {
        await api.put(`/carrinho/item/${itemId}`, {
          quantidade,
        });

        await atualizarEstado();

        return {
          ok: true,
          mensagem: "Quantidade atualizada com sucesso.",
        };
      } catch (error) {
        throw new Error(
          extrairMensagemErro(error, "Erro ao atualizar a quantidade do item.")
        );
      }
    },
    [atualizarEstado]
  );

  const removerItem = useCallback(
    async (itemId: number) => {
      try {
        await api.delete(`/carrinho/item/${itemId}`);

        await atualizarEstado();

        return {
          ok: true,
          mensagem: "Item removido com sucesso.",
        };
      } catch (error) {
        throw new Error(extrairMensagemErro(error, "Não foi possível remover o item."));
      }
    },
    [atualizarEstado]
  );

  const recalcular = useCallback(async () => {
    try {
      await api.put("/carrinho/recalcular");
      await atualizarEstado();

      return {
        ok: true,
        mensagem: "Carrinho recalculado com sucesso.",
      };
    } catch (error) {
      throw new Error(extrairMensagemErro(error, "Erro ao recalcular o carrinho."));
    }
  }, [atualizarEstado]);

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