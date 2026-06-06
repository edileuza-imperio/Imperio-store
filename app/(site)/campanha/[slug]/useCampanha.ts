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

function normalizarCampanha(campanhaDados: any): Campanha | null {
  if (!campanhaDados) return null;

  return {
    id_campanha: Number(campanhaDados.id_campanha),
    titulo: campanhaDados.titulo || "",
    slug: campanhaDados.slug || "",
    descricao: campanhaDados.descricao ?? null,
    banner: campanhaDados.banner ?? null,
    imagem: campanhaDados.imagem ?? null,
    desktop: campanhaDados.desktop ?? null,
    mobile: campanhaDados.mobile ?? null,
    foto: campanhaDados.foto ?? null,
    inicio: campanhaDados.inicio ?? null,
    fim: campanhaDados.fim ?? null,
  };
}

function normalizarProduto(item: any): Produto {
  const produto = item?.produto || item || {};

  return {
    id_produto: Number(produto.id_produto ?? item?.produto_id ?? 0),
    nome: produto.nome || "",
    descricao: produto.descricao || produto.descricao_curta || null,
    imagem:
      produto.imagem ||
      produto.foto ||
      produto.capa ||
      produto.imagem_principal ||
      null,
    preco: Number(
      String(produto.preco || produto["preço"] || 0).replace(",", ".")
    ),
    slug: produto.slug || produto.lesma || "",
  };
}

export function useCampanha(slug?: string) {
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    if (!slug) {
      setCampanha(null);
      setProdutos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(`/campanha/slug/${slug}/com-produtos`, {
        withCredentials: true,
      });

      const dados = extrairDados(response.data);

      const campanhaNormalizada = normalizarCampanha(dados?.campanha);

      const listaProdutos = Array.isArray(dados?.produtos)
        ? dados.produtos.map(normalizarProduto)
        : [];

      setCampanha(campanhaNormalizada);
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