"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";

export interface Produto {
  id_produto?: number;
  nome?: string;
  slug?: string;
  descricao?: string;
  descricao_curta?: string;

  imagem?: string;
  miniatura?: string;
  banner?: string;
  desktop?: string;
  mobile?: string;
  foto?: string;
  fotos?: string[];
  imagens?: string[];

  preco?: number | string;
  preco_promocional?: number | string | null;

  estoque?: number | string;
  quantidade?: number | string;
  reservado?: number | string;
  disponivel?: number | string;

  categoria_nome?: string;
  marca?: string;
}

function normalizar(payload: any) {
  return payload?.dados?.dados ?? payload?.dados ?? payload ?? null;
}

function extrairMensagemErro(error: any) {
  return (
    error?.response?.data?.erro ||
    error?.response?.data?.mensagem ||
    error?.message ||
    "Não foi possível concluir a ação."
  );
}

function numero(valor: unknown): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatarPreco(valor?: number | string | null) {
  if (valor === undefined || valor === null || valor === "") return null;

  return numero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function calcularDisponivel(produto: Produto | null): number {
  if (!produto) return 0;

  if (produto.disponivel !== undefined && produto.disponivel !== null) {
    return Math.max(numero(produto.disponivel), 0);
  }

  const quantidade = numero(produto.quantidade ?? produto.estoque ?? 0);
  const reservado = numero(produto.reservado ?? 0);

  return Math.max(quantidade - reservado, 0);
}

export function useProduto(slug: string) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [imagemAtiva, setImagemAtiva] = useState("");

  const disponivel = useMemo(() => calcularDisponivel(produto), [produto]);
  const emEstoque = disponivel > 0;

  useEffect(() => {
    let ativo = true;

    async function carregarProduto() {
      if (!slug) {
        setLoading(false);
        setProduto(null);
        return;
      }

      try {
        setLoading(true);

        const response = await api.get(`/produto/slug/${slug}`, {
          withCredentials: true,
        });

        const dados = normalizar(response?.data);

        if (!ativo) return;

        setProduto(dados);
      } catch (error: any) {
        const status = error?.response?.status;
        const mensagem =
          error?.response?.data?.erro ||
          error?.response?.data?.mensagem ||
          "Não foi possível carregar o produto.";

        if (status === 401 || mensagem === "Faça login para continuar.") {
          toast.info("Faça login para continuar.");
          setTimeout(() => {
            router.push("/login");
          }, 1200);
          return;
        }

        toast.error(mensagem);

        if (ativo) {
          setProduto(null);
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarProduto();

    return () => {
      ativo = false;
    };
  }, [slug, router]);

  const imagens = useMemo(() => {
    if (!produto) return [];

    const listaBase = [
      produto.imagem,
      produto.miniatura,
      produto.banner,
      produto.desktop,
      produto.mobile,
      produto.foto,
      ...(Array.isArray(produto.imagens) ? produto.imagens : []),
      ...(Array.isArray(produto.fotos) ? produto.fotos : []),
    ];

    const resolvidas = listaBase
      .map((src) => imagemFundo(src || ""))
      .filter(Boolean);

    return Array.from(new Set(resolvidas));
  }, [produto]);

  useEffect(() => {
    if (imagens.length > 0) {
      setImagemAtiva(imagens[0]);
    } else {
      setImagemAtiva("");
    }
  }, [imagens]);

  async function adicionarCarrinho() {
    if (!produto?.id_produto) {
      toast.error("Produto inválido.");
      return;
    }

    if (!emEstoque) {
      toast.error("Produto esgotado.");
      return;
    }

    try {
      setAdicionando(true);

      await api.post(
        "/carrinho/adicionar",
        {
          produto_id: produto.id_produto,
          quantidade: 1,
        },
        {
          withCredentials: true,
        }
      );

      toast.success("Produto adicionado ao carrinho.");
      router.push("/Carrinho");
    } catch (error: any) {
      const status = error?.response?.status;
      const mensagem = extrairMensagemErro(error);

      if (status === 401 || mensagem === "Faça login para continuar.") {
        toast.info("Faça login para continuar.");
        setTimeout(() => {
          router.push("/login");
        }, 1200);
        return;
      }

      toast.error(mensagem);
    } finally {
      setAdicionando(false);
    }
  }

  return {
    loading,
    produto,
    adicionando,
    imagens,
    imagemAtiva,
    setImagemAtiva,
    adicionarCarrinho,
    formatarPreco,

    disponivel,
    emEstoque,
  };
}