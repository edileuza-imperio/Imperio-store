"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";

type Produto = {
  id_produto: number;
  nome: string;
  preco: string | number;
  preco_promocional?: string | number;
  imagem?: string;
  slug?: string;
  categoria_nome?: string;
  estoque?: number;
  ilimitado?: number;
  descricao?: string;
};

function formatMoney(valor: string | number | undefined) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "/sem-imagem.png";

  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  const clean = String(caminho).replace(/^\/+/, "");

  return `${base}/${clean}`;
}

function resumoDescricao(texto?: string, limite = 88) {
  if (!texto) return "Produto disponível nesta categoria.";
  const limpa = texto.replace(/\s+/g, " ").trim();
  if (limpa.length <= limite) return limpa;
  return `${limpa.slice(0, limite).trim()}...`;
}

/* 👇 AQUI ESTÁ A CORREÇÃO */
export default function CategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function carregar() {
      try {
        setLoading(true);
        setErro(null);

        const res = await api.get(`/produtos/categoria/${id}`);

        const lista = Array.isArray(res.data?.dados)
          ? res.data.dados
          : Array.isArray(res.data)
          ? res.data
          : [];

        setProdutos(lista);
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar os produtos.");
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id]);

  const nomeCategoria = produtos[0]?.categoria_nome || "Categoria";

  return (
    <main className="page">
      <div className="container">
        <h1>{nomeCategoria}</h1>

        {loading && <p>Carregando...</p>}
        {erro && <p>{erro}</p>}

        <div className="grid">
          {produtos.map((produto) => (
            <div key={produto.id_produto}>
              <Link href={`/produto/${produto.slug || produto.id_produto}`}>
                <img
                  src={getImagemUrl(produto.imagem)}
                  alt={produto.nome}
                  width={200}
                />
                <h3>{produto.nome}</h3>
                <p>{formatMoney(produto.preco)}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}