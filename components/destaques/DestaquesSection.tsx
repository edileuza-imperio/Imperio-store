"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
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
      setCampanha(null);
      setProdutos([]);
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

  if (loading || !temConteudo) return null;

  if (!campanha) return null;

  const camp = campanha;

  return (
    <section className="py-5 bg-light">
      <div className="container">

        {/* CAMPANHA */}

        <div className="text-center mb-5">

          {camp.banner && (
            <div className="mb-4">
              <img
                src={getImagemUrl(camp.banner)}
                alt={camp.titulo}
                className="img-fluid rounded shadow-sm"
              />
            </div>
          )}

          <span className="badge bg-success px-3 py-2 mb-3">
            Campanha Especial
          </span>

          <h2 className="fw-bold">{camp.titulo}</h2>

          {camp.descricao && (
            <p className="text-muted mx-auto" style={{ maxWidth: 600 }}>
              {camp.descricao}
            </p>
          )}

          <Link
            href={`/campanha/${camp.slug}`}
            className="btn btn-dark mt-2"
          >
            Ver catálogo
          </Link>

        </div>


        {/* PRODUTOS */}

        <div className="row g-4">

          {produtos.map((raw) => {

            const p = normalizarProduto(raw);
            const img = getImagemUrl(p.imagem);

            return (

              <div
                key={p.key}
                className="col-12 col-sm-6 col-lg-4 col-xl-3"
              >

                <div className="card border-0 shadow-sm h-100">

                  <div className="position-relative">

                    {img ? (
                      <img
                        src={img}
                        alt={p.nome}
                        className="card-img-top"
                        style={{ height: 230, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light"
                        style={{ height: 230 }}
                      >
                        Sem imagem
                      </div>
                    )}

                    <span className="badge bg-success position-absolute top-0 start-0 m-2">
                      Destaque
                    </span>

                  </div>

                  <div className="card-body d-flex flex-column">

                    <h5 className="card-title fw-semibold">
                      {p.nome}
                    </h5>

                    {p.descricao && (
                      <p className="text-muted small">
                        {p.descricao}
                      </p>
                    )}

                    <div className="fw-bold fs-5 text-primary mb-3">
                      {formatMoney(p.preco)}
                    </div>

                    <div className="mt-auto d-flex gap-2">

                      <Link
                        href={`/produto/${p.slug}`}
                        className="btn btn-outline-secondary w-100"
                      >
                        Detalhes
                      </Link>

                      <button className="btn btn-dark w-100">
                        Comprar
                      </button>

                    </div>

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