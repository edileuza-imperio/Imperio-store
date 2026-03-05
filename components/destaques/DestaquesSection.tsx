"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
};

type Produto = {
  id_produto?: number;
  nome?: string;
  slug?: string;
  descricao?: string;
  preco?: string | number;
  imagem?: string;

  id_destaque?: number;
  produto_nome?: string;
  produto_slug?: string;
  produto_descricao?: string;
  produto_preco?: string;
  produto_imagem?: string;

  ordem?: number;
};

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";
  const base = api.defaults.baseURL || "";
  const clean = String(caminho).replace(/^\/+/, "");
  return `${base}/${clean}`;
}

function formatMoney(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizarProduto(p: Produto) {
  return {
    key:
      p.id_produto ??
      p.id_destaque ??
      `${p.slug ?? p.produto_slug ?? ""}-${p.ordem ?? ""}`,
    nome: p.nome ?? p.produto_nome ?? "",
    slug: p.slug ?? p.produto_slug ?? "",
    descricao: p.descricao ?? p.produto_descricao ?? "",
    preco: p.preco ?? p.produto_preco ?? 0,
    imagem: p.imagem ?? p.produto_imagem ?? "",
  };
}

export default function DestaquesSection() {
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const res = await api.get("/admin/campanha/destaques");

      const dados = res.data?.dados ?? {};

      const camp: Campanha | null = dados.campanha ?? null;
      const prods: Produto[] = Array.isArray(dados.produtos)
        ? dados.produtos
        : [];

      if (!camp || prods.length === 0) {
        setCampanha(null);
        setProdutos([]);
        return;
      }

      setCampanha(camp);
      setProdutos(prods);
    } catch (err) {
      console.error("Erro ao carregar destaques:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const temConteudo = useMemo(
    () => !!campanha && produtos.length > 0,
    [campanha, produtos]
  );

  if (loading || !temConteudo || !campanha) return null;

  const camp = campanha;

  return (
    <section style={{ background: "#f5eee8", padding: "80px 0" }}>
      <div className="container">

        {/* BANNER */}

        <div
          className="p-5 rounded-4 text-center mb-5"
          style={{
            background: "#c78c5c",
            color: "white",
          }}
        >
          <h2 className="fw-bold">{camp.titulo}</h2>

          {camp.descricao && (
            <p className="opacity-75">{camp.descricao}</p>
          )}

          <Link
            href={`/campanha/${camp.slug}`}
            className="btn btn-light mt-3"
          >
            Ver coleção
          </Link>
        </div>

        {/* PRODUTOS */}

        <div className="row g-4">

          {produtos.map((raw) => {

            const p = normalizarProduto(raw);
            const img = getImagemUrl(p.imagem);

            return (

              <div key={p.key} className="col-md-3">

                <div className="card shadow-sm h-100">

                  {img ? (
                    <img
                      src={img}
                      className="card-img-top"
                      style={{ height: 220, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 220,
                        background: "#eee"
                      }}
                      className="d-flex align-items-center justify-content-center"
                    >
                      Sem imagem
                    </div>
                  )}

                  <div className="card-body d-flex flex-column">

                    <h6>{p.nome}</h6>

                    <div className="fw-bold mb-3">
                      {formatMoney(p.preco)}
                    </div>

                    <Link
                      href={`/produto/${p.slug}`}
                      className="btn btn-outline-dark mt-auto"
                    >
                      Ver produto
                    </Link>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      </div>
    </section>
  );
}