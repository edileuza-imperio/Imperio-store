"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import {
  calcularEconomia,
  descobrirTipoItem,
  normalizarDados,
  normalizarLista,
  obterMelhorImagem,
  temValor,
} from "@/hooks/destaque/functions";
import { adicionarNoCarrinhoBanco } from "@/hooks/carrinho";

type TipoItem = "produto" | "campanha" | "categoria" | string;

export type EntidadeGenerica = {
  id?: number;
  slug?: string;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
  descricao_curta?: string;
  preco?: number | string | null;
  preco_promocional?: number | string | null;
  marca?: string;
  sku?: string;
  imagem?: string;
  imagem_url?: string;
  foto?: string;
  capa?: string;
  [key: string]: any;
};

export type VitrineItem = {
  id_vitrine_item: number | string;
  produto_id?: number | string | null;
  campanha_id?: number | string | null;
  categoria_id?: number | string | null;
  tipo_item?: TipoItem;
  titulo_personalizado?: string;
  subtitulo_personalizado?: string;
  imagem_personalizada?: string;
  [key: string]: any;
};

export type Vitrine = {
  id_vitrine?: number | string;
  slug?: string;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  tipo?: string;
  itens?: VitrineItem[];
  [key: string]: any;
};

export type ItemResolvido = VitrineItem & {
  entidade: EntidadeGenerica | null;
  tipo_item: TipoItem;
  titulo_final: string;
  subtitulo_final: string;
  descricao_final: string;
  imagem_final: string;
  link_final: string;
  preco_final: number | string | null;
  preco_original: number | string | null;
  marca_final: string;
  sku_final: string;
  economia_final: string | null;
};

type UseVitrineParams = {
  slug?: string;
  vitrineProp?: Vitrine | null;
  limite?: number;
  onAdicionarCarrinho?: (item: ItemResolvido) => void;
  onAbrirCarrinho?: () => void;
};

export function useVitrine({
  slug,
  vitrineProp,
  limite,
  onAdicionarCarrinho,
  onAbrirCarrinho,
}: UseVitrineParams) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [vitrine, setVitrine] = useState<Vitrine | null>(vitrineProp || null);
  const [itens, setItens] = useState<ItemResolvido[]>([]);
  const [adicionandoId, setAdicionandoId] = useState<string | null>(null);

  const vitrineComItens = useMemo<Vitrine | null>(() => {
    if (!vitrineProp) return null;

    const lista = Array.isArray(vitrineProp.itens) ? vitrineProp.itens : [];

    return {
      ...vitrineProp,
      itens: limite ? lista.slice(0, limite) : lista,
    };
  }, [vitrineProp, limite]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        let vitrineAtual: Vitrine | null = null;

        if (vitrineComItens?.id_vitrine) {
          vitrineAtual = vitrineComItens;
        } else if (slug) {
          const vitrineResponse = await api.get(`/vitrine/slug/${slug}`);
          const vitrineData = normalizarDados<Vitrine>(vitrineResponse?.data);

          if (!vitrineData || !vitrineData.id_vitrine) {
            if (!ativo) return;

            setErro("Vitrine não encontrada.");
            setVitrine(null);
            setItens([]);
            return;
          }

          const itensResponse = await api.get(
            `/vitrine/${vitrineData.id_vitrine}/itens`
          );

          let itensData = normalizarLista<VitrineItem>(itensResponse?.data);

          if (limite) {
            itensData = itensData.slice(0, limite);
          }

          vitrineAtual = {
            ...vitrineData,
            itens: itensData,
          };
        } else {
          if (!ativo) return;

          setErro("Nenhuma vitrine informada.");
          setVitrine(null);
          setItens([]);
          return;
        }

        if (!ativo || !vitrineAtual) return;

        setVitrine(vitrineAtual);

        const listaItens = Array.isArray(vitrineAtual.itens)
          ? vitrineAtual.itens
          : [];

        const itensResolvidos = await Promise.all(
          listaItens.map((item) => resolverItemVitrine(item, vitrineAtual))
        );

        if (!ativo) return;

        setItens(itensResolvidos);
      } catch (error) {
        console.error("Erro ao carregar vitrine:", error);

        if (!ativo) return;

        setErro("Não foi possível carregar a vitrine.");
        setVitrine(null);
        setItens([]);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [slug, limite, vitrineComItens]);

  async function adicionarCarrinho(item: ItemResolvido) {
    if (onAdicionarCarrinho) {
      onAdicionarCarrinho(item);
      return;
    }

    if (item.tipo_item !== "produto" || !item.produto_id) return;

    const toastId = toast.loading("Adicionando ao carrinho...");

    try {
      setAdicionandoId(String(item.id_vitrine_item));

      await adicionarNoCarrinhoBanco(item);

      toast.update(toastId, {
        render: "Produto adicionado com sucesso.",
        type: "success",
        isLoading: false,
        autoClose: 1200,
        closeButton: true,
      });

      onAbrirCarrinho?.();
    } catch (error: any) {
      console.error("Erro ao adicionar no carrinho:", error);

      const mensagemErro =
        error?.response?.data?.dados?.erro ||
        error?.response?.data?.mensagem ||
        "Não foi possível adicionar o produto ao carrinho.";

      toast.update(toastId, {
        render: mensagemErro,
        type: "error",
        isLoading: false,
        autoClose: 2500,
        closeButton: true,
      });
    } finally {
      setAdicionandoId(null);
    }
  }

  return {
    loading,
    erro,
    vitrine,
    itens,
    adicionandoId,
    adicionarCarrinho,
  };
}

async function resolverItemVitrine(
  item: VitrineItem,
  vitrineAtual: Vitrine
): Promise<ItemResolvido> {
  const tipoItem = descobrirTipoItem(item, vitrineAtual?.tipo);

  try {
    if (tipoItem === "produto" && item.produto_id) {
      const res = await api.get(`/produto/${item.produto_id}`);
      const produto = normalizarDados<EntidadeGenerica>(res?.data) || {};

      const precoPromocional = temValor(produto.preco_promocional)
        ? produto.preco_promocional
        : null;

      const precoFinal = precoPromocional || produto.preco || null;
      const precoOriginal = precoPromocional ? produto.preco || null : null;

      return {
        ...item,
        entidade: produto,
        tipo_item: "produto",
        titulo_final:
          item.titulo_personalizado ||
          produto.nome ||
          produto.titulo ||
          `Produto #${item.produto_id}`,
        subtitulo_final:
          item.subtitulo_personalizado ||
          produto.subtitulo ||
          produto.descricao_curta ||
          "",
        descricao_final:
          produto.descricao_curta ||
          produto.descricao ||
          item.subtitulo_personalizado ||
          "",
        imagem_final: obterMelhorImagem(item, produto),
        link_final: produto.slug
          ? `/produto/${produto.slug}`
          : `/produto/${item.produto_id}`,
        preco_final: precoFinal,
        preco_original: precoOriginal,
        marca_final: produto.marca || "",
        sku_final: produto.sku || "",
        economia_final: calcularEconomia(precoOriginal, precoFinal),
      };
    }

    if (tipoItem === "campanha" && item.campanha_id) {
      const res = await api.get(`/campanha/${item.campanha_id}`);
      const campanha = normalizarDados<EntidadeGenerica>(res?.data) || {};

      return {
        ...item,
        entidade: campanha,
        tipo_item: "campanha",
        titulo_final:
          item.titulo_personalizado ||
          campanha.nome ||
          campanha.titulo ||
          `Campanha #${item.campanha_id}`,
        subtitulo_final:
          item.subtitulo_personalizado ||
          campanha.subtitulo ||
          campanha.descricao ||
          "",
        descricao_final: campanha.descricao_curta || campanha.descricao || "",
        imagem_final: obterMelhorImagem(item, campanha),
        link_final: campanha.slug
          ? `/campanha/${campanha.slug}`
          : `/campanha/${item.campanha_id}`,
        preco_final: null,
        preco_original: null,
        marca_final: "",
        sku_final: "",
        economia_final: null,
      };
    }

    if (tipoItem === "categoria" && item.categoria_id) {
      const res = await api.get(`/categoria/${item.categoria_id}`);
      const categoria = normalizarDados<EntidadeGenerica>(res?.data) || {};

      return {
        ...item,
        entidade: categoria,
        tipo_item: "categoria",
        titulo_final:
          item.titulo_personalizado ||
          categoria.nome ||
          categoria.titulo ||
          `Categoria #${item.categoria_id}`,
        subtitulo_final:
          item.subtitulo_personalizado ||
          categoria.subtitulo ||
          categoria.descricao_curta ||
          "",
        descricao_final: categoria.descricao_curta || categoria.descricao || "",
        imagem_final: obterMelhorImagem(item, categoria),
        link_final: categoria.slug
          ? `/categoria/${categoria.slug}`
          : `/categoria/${item.categoria_id}`,
        preco_final: null,
        preco_original: null,
        marca_final: "",
        sku_final: "",
        economia_final: null,
      };
    }

    return criarItemFallback(item, tipoItem);
  } catch {
    return criarItemFallback(item, tipoItem);
  }
}

function criarItemFallback(item: VitrineItem, tipoItem: TipoItem): ItemResolvido {
  return {
    ...item,
    entidade: null,
    tipo_item: tipoItem,
    titulo_final: item.titulo_personalizado || "Item da vitrine",
    subtitulo_final: item.subtitulo_personalizado || "",
    descricao_final: item.subtitulo_personalizado || "",
    imagem_final: imagemFundo(item.imagem_personalizada || ""),
    link_final: "#",
    preco_final: null,
    preco_original: null,
    marca_final: "",
    sku_final: "",
    economia_final: null,
  };
}