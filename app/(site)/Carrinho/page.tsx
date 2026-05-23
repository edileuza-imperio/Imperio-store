"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { InicioApi } from "@/services/api/api";
import CarrinhoView from "@/components/Carrinho/CarrinhoView";



/* =========================
   TIPAGEM
========================= */
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

  subtotal?: number | string;
  total?: number | string;
};

/* =========================
   BASE URL
========================= */
const BASE_URL =
  "https://lightgrey-cattle-160990.hostingersite.com";

/* =========================
   HELPERS
========================= */
function resolverImagem(src?: string | null) {
  if (!src) {
    return "/images/sem-imagem.png";
  }

  const valor = String(src).trim();

  if (!valor) {
    return "/images/sem-imagem.png";
  }

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("blob:") ||
    valor.startsWith("data:image")
  ) {
    return valor;
  }

  const caminho = valor.replace(/^\/+/, "");

  return `${BASE_URL}/${caminho}`;
}

function normalizarNumero(valor: unknown): number {
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

function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizarNumero(valor));
}

function extrairLista<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.dados)) {
    return payload.dados;
  }

  if (Array.isArray(payload?.dados?.itens)) {
    return payload.dados.itens;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.itens)) {
    return payload.itens;
  }

  if (Array.isArray(payload?.carrinho?.itens)) {
    return payload.carrinho.itens;
  }

  return [];
}

/* =========================
   HELPERS ITEM
========================= */
function getItemId(item: CarrinhoItem) {
  return (
    item.id_carrinho_item ??
    item.id ??
    item.id_item ??
    item.item_id ??
    ""
  );
}

function getItemNome(item: CarrinhoItem) {
  return (
    item.produto?.nome ||
    item.produto?.titulo ||
    item.produto_nome ||
    item.nome ||
    item.titulo ||
    "Produto"
  );
}

function getItemImagem(item: CarrinhoItem) {
  return resolverImagem(
    item.imagem_url ||
      item.imagem ||
      item.miniatura ||
      item.foto ||
      item.produto?.imagem_url ||
      item.produto?.imagem ||
      item.produto?.miniatura ||
      item.produto?.foto
  );
}

function getQuantidade(item: CarrinhoItem) {
  return Math.max(1, normalizarNumero(item.quantidade) || 1);
}

function getPreco(item: CarrinhoItem) {
  return normalizarNumero(
    item.preco_unitario ?? item.preco ?? 0
  );
}

function getSubtotal(item: CarrinhoItem) {
  if (item.subtotal != null) {
    return normalizarNumero(item.subtotal);
  }

  return getPreco(item) * getQuantidade(item);
}

/* =========================
   PAGE
========================= */
export default function CarrinhoPage() {
  const [loading, setLoading] = useState(true);

  const [itens, setItens] = useState<CarrinhoItem[]>([]);

  const [loadingItem, setLoadingItem] = useState<
    string | number | null
  >(null);

  /* =========================
     CARREGAR
  ========================= */
  const carregarCarrinho = useCallback(async () => {
    try {
      setLoading(true);

      const response = await InicioApi.get("/carrinho/itens", {
        withCredentials: true,
      });

      const lista = extrairLista<CarrinhoItem>(
        response.data
      );

      setItens(lista);
    } catch (error) {
      console.error(error);

      toast.error(
        "Não foi possível carregar o carrinho."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCarrinho();
  }, [carregarCarrinho]);

  /* =========================
     REMOVER
  ========================= */
  async function removerItem(
    itemId: string | number
  ) {
    try {
      setLoadingItem(itemId);

      await InicioApi.delete(
        `/carrinho/item/${itemId}`,
        {
          withCredentials: true,
        }
      );

      setItens((prev) =>
        prev.filter(
          (item) =>
            String(getItemId(item)) !==
            String(itemId)
        )
      );

      toast.success("Produto removido.");
    } catch (error) {
      console.error(error);

      toast.error("Erro ao remover produto.");
    } finally {
      setLoadingItem(null);
    }
  }

  /* =========================
     QUANTIDADE
  ========================= */
  async function alterarQuantidade(
    item: CarrinhoItem,
    novaQuantidade: number
  ) {
    const itemId = getItemId(item);

    if (novaQuantidade < 1) return;

    try {
      setLoadingItem(itemId);

      setItens((prev) =>
        prev.map((produto) => {
          if (
            String(getItemId(produto)) !==
            String(itemId)
          ) {
            return produto;
          }

          return {
            ...produto,
            quantidade: novaQuantidade,
          };
        })
      );

      await InicioApi.put(
        `/carrinho/item/${itemId}`,
        {
          quantidade: novaQuantidade,
        },
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Erro ao atualizar quantidade."
      );

      carregarCarrinho();
    } finally {
      setLoadingItem(null);
    }
  }

  /* =========================
     TOTAL
  ========================= */
  const total = useMemo(() => {
    return itens.reduce((acc, item) => {
      return acc + getSubtotal(item);
    }, 0);
  }, [itens]);

  return (
    <CarrinhoView
      itens={itens}
      total={total}
      loading={loading}
      loadingItem={loadingItem}
      getItemId={getItemId}
      getItemNome={getItemNome}
      getItemImagem={getItemImagem}
      getQuantidade={getQuantidade}
      getPreco={getPreco}
      getSubtotal={getSubtotal}
      formatarMoeda={formatarMoeda}
      removerItem={removerItem}
      alterarQuantidade={alterarQuantidade}
    />
  );
}