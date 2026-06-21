"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { adicionarNoCarrinhoBanco } from "@/hooks/carrinho";

type TipoItem = "produto" | "campanha" | "categoria" | string;

export type VitrineItem = {
  id_vitrine_item: number | string;
  vitrine_id?: number | string;
  produto_id?: number | string | null;
  campanha_id?: number | string | null;
  categoria_id?: number | string | null;

  tipo_item: TipoItem;

  titulo_final: string;
  subtitulo_final?: string | null;
  descricao_final?: string | null;
  imagem_final?: string | null;
  slug_final?: string | null;
  link_final?: string | null;

  preco_final?: number | string | null;
  preco_original?: number | string | null;
  economia_final?: string | null;

  marca_final?: string | null;
  sku_final?: string | null;

  disponivel?: number;
  esgotado?: boolean;

  [key: string]: any;
};

export type Vitrine = {
  id_vitrine?: number | string;
  slug?: string;
  nome?: string;
  titulo?: string;
  subtitulo?: string | null;
  tipo?: string;
  itens?: VitrineItem[];
  [key: string]: any;
};

export type ItemResolvido = VitrineItem;

type ApiResponse<T> = {
  status: number;
  mensagem?: string;
  dados: T;
};

type UseVitrineParams = {
  slug?: string;
  vitrineProp?: Vitrine | null;
  limite?: number;
  onAdicionarCarrinho?: (item: ItemResolvido) => void;
  onAbrirCarrinho?: () => void;
};

function normalizarResposta<T>(response: any): T | null {
  return response?.data?.dados ?? response?.data ?? null;
}

function limitarItens(itens: VitrineItem[], limite?: number) {
  return limite ? itens.slice(0, limite) : itens;
}

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

  const vitrineInicial = useMemo<Vitrine | null>(() => {
    if (!vitrineProp) return null;

    return {
      ...vitrineProp,
      itens: limitarItens(vitrineProp.itens || [], limite),
    };
  }, [vitrineProp, limite]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        let vitrineAtual: Vitrine | null = null;

        if (vitrineInicial?.id_vitrine) {
          vitrineAtual = vitrineInicial;
        } else if (slug) {
          const vitrineResponse = await api.get<ApiResponse<Vitrine>>(
            rotas.vitrines.buscarPorSlug(slug)
          );

          const vitrineData = normalizarResposta<Vitrine>(vitrineResponse);

          if (!vitrineData?.id_vitrine) {
            if (!ativo) return;

            setErro("Vitrine não encontrada.");
            setVitrine(null);
            setItens([]);
            return;
          }

          const itensResponse = await api.get<ApiResponse<VitrineItem[]>>(
            rotas.vitrines.itens(vitrineData.id_vitrine)
          );

          const itensData =
            normalizarResposta<VitrineItem[]>(itensResponse) || [];

          vitrineAtual = {
            ...vitrineData,
            itens: limitarItens(itensData, limite),
          };
        } else {
          if (!ativo) return;

          setErro("Nenhuma vitrine informada.");
          setVitrine(null);
          setItens([]);
          return;
        }

        if (!ativo || !vitrineAtual) return;

        const lista = limitarItens(vitrineAtual.itens || [], limite);

        setVitrine({
          ...vitrineAtual,
          itens: lista,
        });

        setItens(lista);
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
  }, [slug, limite, vitrineInicial]);

  async function adicionarCarrinho(item: ItemResolvido) {
    if (onAdicionarCarrinho) {
      onAdicionarCarrinho(item);
      return;
    }

    if (item.tipo_item !== "produto" || !item.produto_id || item.esgotado) {
      return;
    }

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