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
  statusid?: number;
  inicio?: string | null;
  fim?: string | null;
};

type Produto = {
  // como vem do JOIN, pode vir id_produto (mais comum) e NÃO id_destaque
  id_produto?: number;
  nome?: string;
  slug?: string;
  descricao?: string;
  preco?: string | number;
  imagem?: string;

  // se sua API já devolve no formato "produto_nome" etc, ainda funciona:
  id_destaque?: number;
  produto_nome?: string;
  produto_slug?: string;
  produto_descricao?: string;
  produto_preco?: string;
  produto_imagem?: string;

  // extras do vínculo
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
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizarProduto(p: Produto) {
  return {
    key: p.id_produto ?? p.id_destaque ?? `${p.slug ?? p.produto_slug ?? ""}-${p.ordem ?? ""}`,
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
      setLoading(true);

      // ✅ agora vem tudo pronto do backend (campanha + produtos do vínculo)
      const res = await api.get("/admin/campanha/destaques");
      const dados = res.data?.dados ?? {};

      const camp: Campanha | null = dados.campanha ?? null;
      const prods: Produto[] = Array.isArray(dados.produtos) ? dados.produtos : [];

      // ✅ se não tem campanha ou não tem produtos, some tudo
      if (!camp || prods.length === 0) {
        setCampanha(null);
        setProdutos([]);
        return;
      }

      setCampanha(camp);
      setProdutos(prods);
    } catch (err) {
      setCampanha(null);
      setProdutos([]);
      console.error("Erro ao carregar destaques:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const temConteudo = useMemo(() => !!campanha && produtos.length > 0, [campanha, produtos]);

  // ✅ se não tem campanha/produtos (ou carregando), não renderiza nada
  if (loading || !temConteudo) return null;

  return (
    <section className="py-5" style={{ background: "#f5eee8" }}>
      <div className="container">
        {/* CAMPANHA */}
        {campanha && (
          <div className="text-center mb-5">
            <span
              className="badge px-3 py-2 mb-3"
              style={{
                background: "#2e7d32",
                fontSize: "13px",
              }}
            >
              Destaques da Campanha
            </span>

            <h1 className="fw-bold mb-2" style={{ letterSpacing: "0.5px" }}>
              {campanha.titulo}
            </h1>

            {campanha.descricao ? <p className="text-muted mb-3">{campanha.descricao}</p> : null}

            <Link
              href={`/campanha/${campanha.slug}`}
              className="btn text-white px-4"
              style={{
                background: "#c78c5c",
                borderRadius: "10px",
              }}
            >
              Ver catálogo
            </Link>
          </div>
        )}

        {/* PRODUTOS */}
        <div className="row g-4">
          {produtos.map((raw) => {
            const p = normalizarProduto(raw);
            const img = getImagemUrl(p.imagem);

            return (
              <div key={p.key} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 rounded-4 cardHover">
                  {/* IMAGEM */}
                  <div className="position-relative">
                    {img ? (
                      <img src={img} alt={p.nome} className="card-img-top imgHover" />
                    ) : (
                      <div className="imgFallback">Sem imagem</div>
                    )}

                    <span
                      className="badge position-absolute px-3 py-2"
                      style={{
                        top: "12px",
                        left: "12px",
                        background: "#2e7d32",
                        borderRadius: "20px",
                        fontSize: "12px",
                      }}
                    >
                      Destaque
                    </span>
                  </div>

                  {/* BODY */}
                  <div className="card-body d-flex flex-column p-4">
                    <h5 className="fw-semibold mb-1" style={{ fontSize: "18px" }}>
                      {p.nome}
                    </h5>

                    {p.descricao ? (
                      <p className="text-muted mb-2" style={{ fontSize: "14px" }}>
                        {p.descricao}
                      </p>
                    ) : null}

                    <div className="fw-bold mb-3" style={{ color: "#c78c5c", fontSize: "22px" }}>
                      {formatMoney(p.preco)}
                    </div>

                    {/* BOTÕES */}
                    <div className="d-flex gap-2 mt-auto">
                      <Link
                        href={`/produto/${p.slug}`}
                        className="btn btn-light border w-100"
                        style={{ borderRadius: "10px", fontWeight: "500" }}
                      >
                        Detalhes
                      </Link>

                      <button
                        type="button"
                        className="btn w-100 text-white"
                        style={{
                          background: "#c78c5c",
                          borderRadius: "10px",
                          fontWeight: "600",
                        }}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style jsx>{`
          .cardHover {
            cursor: pointer;
            overflow: hidden;
            transition: transform 0.22s ease, box-shadow 0.22s ease;
          }
          .cardHover:hover {
            transform: translateY(-6px);
          }
          .imgHover {
            height: 240px;
            width: 100%;
            object-fit: cover;
            transition: transform 0.28s ease;
          }
          .cardHover:hover .imgHover {
            transform: scale(1.03);
          }
          .imgFallback {
            height: 240px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.06);
            color: rgba(0, 0, 0, 0.55);
            font-weight: 600;
          }
        `}</style>
      </div>
    </section>
  );
}