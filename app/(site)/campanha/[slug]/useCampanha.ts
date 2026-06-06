"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";

export type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string | null;
  banner?: string | null;
  imagem?: string | null;
  desktop?: string | null;
  mobile?: string | null;
  foto?: string | null;
  inicio?: string | null;
  fim?: string | null;
};

export type Produto = {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  imagem?: string | null;
  preco?: number;
  slug?: string;
};

function extrairDados(payload: any) {
  return payload?.dados?.dados ?? payload?.dados ?? payload ?? null;
}

function obterImagemCampanha(campanha?: Campanha | null) {
  return imagemFundo(
    campanha?.banner ||
      campanha?.imagem ||
      campanha?.desktop ||
      campanha?.mobile ||
      campanha?.foto ||
      ""
  );
}

function formatDateBR(value?: string | null) {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("pt-BR");
}

export function useCampanha(slug?: string) {
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const campanhaResponse = await api.get(`/campanha/slug/${slug}`, {
        withCredentials: true,
      });

      const campanhaDados = extrairDados(campanhaResponse.data);

      const campanhaNormalizada: Campanha | null = campanhaDados
        ? {
            id_campanha: campanhaDados.id_campanha,
            titulo: campanhaDados.titulo,
            slug: campanhaDados.slug,
            descricao: campanhaDados.descricao ?? null,
            banner: campanhaDados.banner ?? null,
            imagem: campanhaDados.imagem ?? null,
            desktop: campanhaDados.desktop ?? null,
            mobile: campanhaDados.mobile ?? null,
            foto: campanhaDados.foto ?? null,
            inicio: campanhaDados.inicio ?? null,
            fim: campanhaDados.fim ?? null,
          }
        : null;

      setCampanha(campanhaNormalizada);

      if (!campanhaNormalizada?.id_campanha) {
        setProdutos([]);
        return;
      }

      const produtosResponse = await api.get(
        `/campanha/${campanhaNormalizada.id_campanha}/produtos`,
        {
          withCredentials: true,
        }
      );

      const produtosDados = extrairDados(produtosResponse.data);

      const listaProdutos: Produto[] = Array.isArray(produtosDados)
        ? produtosDados.map((item: any) => {
            const produto = item?.produto || item || {};

            return {
              id_produto: produto.id_produto ?? item.produto_id,
              nome: produto.nome || "",
              descricao: produto.descricao || null,
              imagem: produto.imagem || null,
              preco: Number(
                String(produto.preco || produto["preço"] || 0).replace(
                  ",",
                  "."
                )
              ),
              slug: produto.slug || produto.lesma || "",
            };
          })
        : [];

      setProdutos(listaProdutos);
    } catch (error) {
      console.error("Erro ao carregar campanha:", error);
      setCampanha(null);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [slug]);

  const bannerImg = useMemo(() => obterImagemCampanha(campanha), [campanha]);

  const inicio = formatDateBR(campanha?.inicio);
  const fim = formatDateBR(campanha?.fim);

  const periodo =
    inicio && fim
      ? `${inicio} até ${fim}`
      : inicio || fim || "Sem período definido";

  return {
    campanha,
    produtos,
    loading,
    bannerImg,
    periodo,
    carregar,
  };
}

export { imagemFundo };