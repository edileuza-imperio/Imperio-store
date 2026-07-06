"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";


export type CarrinhoItem = {
  id?: number | string;
  id_carrinho_item?: number | string;
  id_item?: number | string;
  item_id?: number | string;

  nome?: string;
  titulo?: string;
  produto_nome?: string;

  produto?: {
    nome?: string;
    titulo?: string;
    imagem?: string;
    miniatura?: string;
    foto?: string;
    imagem_url?: string;
  };

  imagem?: string;
  miniatura?: string;
  foto?: string;
  imagem_url?: string;

  quantidade?: number | string;

  preco?: number | string;
  preco_unitario?: number | string;
  preco_promocional_unitario?: number | string;

  subtotal?: number | string;
  total?: number | string;
};

export function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === "string") {
    const limpo = valor.replace(/\./g, "").replace(",", ".");
    const numero = Number(limpo);
    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

export function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizarNumero(valor));
}

function extrairLista<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.dados?.itens)) return payload.dados.itens;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.itens)) return payload.itens;
  if (Array.isArray(payload?.carrinho?.itens)) return payload.carrinho.itens;

  return [];
}

export function getItemId(item: CarrinhoItem) {
  return item.id_carrinho_item ?? item.id ?? item.id_item ?? item.item_id ?? "";
}

export function getItemNome(item: CarrinhoItem) {
  return (
    item.produto?.nome ||
    item.produto?.titulo ||
    item.produto_nome ||
    item.nome ||
    item.titulo ||
    "Produto"
  );
}

export function getItemImagem(item: CarrinhoItem) {
  return (
    imagemFundo(
      item.imagem_url ||
        item.imagem ||
        item.miniatura ||
        item.foto ||
        item.produto?.imagem_url ||
        item.produto?.imagem ||
        item.produto?.miniatura ||
        item.produto?.foto
    ) || "/images/sem-imagem.png"
  );
}

export function getQuantidade(item: CarrinhoItem) {
  return Math.max(1, normalizarNumero(item.quantidade) || 1);
}

export function getPreco(item: CarrinhoItem) {
  const promocional = normalizarNumero(item.preco_promocional_unitario);

  if (promocional > 0) return promocional;

  return normalizarNumero(item.preco_unitario ?? item.preco ?? 0);
}

export function getSubtotal(item: CarrinhoItem) {
  if (item.subtotal != null) {
    return normalizarNumero(item.subtotal);
  }

  return getPreco(item) * getQuantidade(item);
}

export function useCarrinho() {
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<CarrinhoItem[]>([]);
  const [loadingItem, setLoadingItem] = useState<string | number | null>(null);

  const notificarCarrinhoAtualizado = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("carrinhoAtualizado"));
    }
  }, []);

  const carregarCarrinho = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/carrinho/itens", {
        withCredentials: true,
      });

      const lista = extrairLista<CarrinhoItem>(response.data);

      setItens(lista);
      notificarCarrinhoAtualizado();
    } catch {
      toast.error("Não foi possível carregar o carrinho.");
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, [notificarCarrinhoAtualizado]);

  useEffect(() => {
    carregarCarrinho();
  }, [carregarCarrinho]);

  const removerItem = useCallback(
    async (itemId: string | number) => {
      try {
        setLoadingItem(itemId);

        await api.delete(`/carrinho/item/${itemId}`, {
          withCredentials: true,
        });

        setItens((prev) =>
          prev.filter((item) => String(getItemId(item)) !== String(itemId))
        );

        notificarCarrinhoAtualizado();
        toast.success("Produto removido.");
      } catch {
        toast.error("Erro ao remover produto.");
      } finally {
        setLoadingItem(null);
      }
    },
    [notificarCarrinhoAtualizado]
  );

  const alterarQuantidade = useCallback(
    async (item: CarrinhoItem, novaQuantidade: number) => {
      const itemId = getItemId(item);

      if (novaQuantidade < 1) return;

      try {
        setLoadingItem(itemId);

        setItens((prev) =>
          prev.map((produto) => {
            if (String(getItemId(produto)) !== String(itemId)) {
              return produto;
            }

            return {
              ...produto,
              quantidade: novaQuantidade,
            };
          })
        );

        await api.put(
          `/carrinho/item/${itemId}`,
          {
            quantidade: novaQuantidade,
          },
          {
            withCredentials: true,
          }
        );

        notificarCarrinhoAtualizado();
      } catch {
        toast.error("Erro ao atualizar quantidade.");
        await carregarCarrinho();
      } finally {
        setLoadingItem(null);
      }
    },
    [carregarCarrinho, notificarCarrinhoAtualizado]
  );

  const total = useMemo(() => {
    return itens.reduce((acc, item) => acc + getSubtotal(item), 0);
  }, [itens]);

  return {
    itens,
    total,
    loading,
    loadingItem,
    carregarCarrinho,
    removerItem,
    alterarQuantidade,
    getItemId,
    getItemNome,
    getItemImagem,
    getQuantidade,
    getPreco,
    getSubtotal,
    formatarMoeda,
  };
}