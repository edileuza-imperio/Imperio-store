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
  inicio?: string | null;
  fim?: string | null;
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
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
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
      setLoading(true);

      const res = await api.get("/admin/campanha/destaques");
      const dados = res.data?.dados ?? {};

      const camp: Campanha | null = dados.campanha ?? null;
      const prods: Produto[] = Array.isArray(dados.produtos) ? dados.produtos : [];

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

  const temConteudo = useMemo(() => !!campanha && produtos.length > 0, [campanha, produtos]);

  // ✅ se não tem conteúdo, não mostra nada (igual você queria)
  if (loading || !temConteudo || !campanha) return null;

  const camp = campanha;
  const bannerImg = getImagemUrl(camp.banner);

  const qtd = produtos.length;
  const inicio = formatDateBR(camp.inicio ?? null);
  const fim = formatDateBR(camp.fim ?? null);

  return (
    <section className="ui-bg py-5">
      <div className="container">
        {/* TOP chips */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <h3 className="fw-bold mb-0 ui-title-dark">Destaques</h3>

          <div className="d-flex gap-2 flex-wrap">
            <span className="badge ui-pill">
              <i className="bi bi-bag me-2" />
              {qtd} itens
            </span>

            {inicio ? (
              <span className="badge ui-pill">
                <i className="bi bi-calendar-event me-2" />
                Início: {inicio}
              </span>
            ) : null}

            {fim ? (
              <span className="badge ui-pill">
                <i className="bi bi-calendar-check me-2" />
                Até: {fim}
              </span>
            ) : null}
          </div>
        </div>

        {/* HERO / BANNER */}
        <div className="ui-hero shadow-sm rounded-4 overflow-hidden mb-4">
          {bannerImg ? (
            <div className="position-relative">
              <img src={bannerImg} alt={camp.titulo} className="w-100 ui-hero-img" />

              <div className="ui-hero-overlay" />
              <div className="ui-hero-noise" />

              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end">
                <div className="p-4 p-md-5 w-100">
                  <div className="ui-glass rounded-4 p-4 p-md-5">
                    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                      <span className="badge ui-badge">
                        <i className="bi bi-stars me-2" />
                        Destaques da Campanha
                      </span>

                      <Link
                        href={`/campanha/${camp.slug}`}
                        className="btn ui-btn-primary rounded-pill px-3"
                        title="Ver coleção"
                      >
                        <i className="bi bi-grid me-2" />
                        Ver coleção
                      </Link>
                    </div>

                    <h2 className="fw-bold mt-3 mb-2 ui-title">{camp.titulo}</h2>

                    <p className="mb-0 ui-subtitle">
                      {camp.descricao
                        ? camp.descricao
                        : "Produtos selecionados com curadoria — aproveite a coleção."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ✅ fallback quando não tem imagem (fica premium)
            <div className="p-4 p-md-5 ui-hero-fallback position-relative">
              <div className="ui-hero-fallback-noise" />
              <div className="position-relative">
                <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                  <span className="badge ui-badge-dark">
                    <i className="bi bi-stars me-2" />
                    Destaques da Campanha
                  </span>

                  <Link
                    href={`/campanha/${camp.slug}`}
                    className="btn ui-btn-primary rounded-pill px-3"
                    title="Ver coleção"
                  >
                    <i className="bi bi-grid me-2" />
                    Ver coleção
                  </Link>
                </div>

                <h2 className="fw-bold mt-3 mb-2 ui-title-dark">{camp.titulo}</h2>

                <p className="mb-0 text-muted" style={{ maxWidth: 820 }}>
                  {camp.descricao
                    ? camp.descricao
                    : "Coleção com tons creme e rosa queimado — visual premium mesmo sem banner."}
                </p>

                <div className="mt-4 d-flex gap-2 flex-wrap">
                  <span className="badge ui-pill">
                    <i className="bi bi-patch-check me-2" />
                    Seleção premium
                  </span>
                  <span className="badge ui-pill">
                    <i className="bi bi-truck me-2" />
                    Envio rápido
                  </span>
                  <span className="badge ui-pill">
                    <i className="bi bi-credit-card me-2" />
                    Pagamento facilitado
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PRODUTOS */}
        <div className="row g-4">
          {produtos.map((raw) => {
            const p = normalizarProduto(raw);
            const img = getImagemUrl(p.imagem);

            return (
              <div key={p.key} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div className="card ui-card border-0 h-100 shadow-sm">
                  <div className="position-relative">
                    {img ? (
                      <img src={img} alt={p.nome} className="card-img-top ui-card-img" />
                    ) : (
                      <div className="ui-card-img ui-noimg d-flex align-items-center justify-content-center">
                        <div className="text-center">
                          <i className="bi bi-image fs-2 d-block mb-1" />
                          <span className="small fw-semibold">Sem imagem</span>
                        </div>
                      </div>
                    )}

                    <span className="badge ui-badge-corner">
                      <i className="bi bi-star-fill me-1" />
                      Destaque
                    </span>

                    <span className="badge ui-badge-corner-right" title="Curadoria">
                      <i className="bi bi-award" />
                    </span>
                  </div>

                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-semibold mb-1">{p.nome}</h6>

                    <p className="small text-muted mb-2 ui-clamp-2">
                      {p.descricao ? p.descricao : "Produto selecionado para destaque."}
                    </p>

                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="fw-bold fs-5 ui-price">{formatMoney(p.preco)}</div>
                      <span className="badge ui-pill-sm">
                        <i className="bi bi-patch-check me-1" />
                        Top
                      </span>
                    </div>

                    <div className="mt-auto d-flex gap-2">
                      <Link
                        href={`/produto/${p.slug}`}
                        className="btn ui-btn-soft w-100"
                        style={{ borderRadius: 12 }}
                        title="Ver detalhes"
                      >
                        <i className="bi bi-eye" />
                      </Link>

                      <button
                        type="button"
                        className="btn ui-btn-primary w-100"
                        style={{ borderRadius: 12 }}
                        title="Adicionar ao carrinho"
                        onClick={() => {
                          // aqui você liga no carrinho depois
                          console.log("Adicionar:", p.slug);
                        }}
                      >
                        <i className="bi bi-cart-plus" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS LOCAL (leve e sem brigar com bootstrap) */}
      <style jsx>{`
        .ui-bg {
          background: #fbf3ee;
        }

        .ui-pill {
          background: rgba(197, 122, 122, 0.12);
          color: #8a4a4a;
          border: 1px solid rgba(197, 122, 122, 0.22);
          padding: 10px 14px;
          border-radius: 999px;
          font-weight: 600;
        }
        .ui-pill-sm {
          background: rgba(231, 201, 183, 0.45);
          color: #6b3a3a;
          border: 1px solid rgba(197, 122, 122, 0.18);
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 600;
        }

        .ui-hero {
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: linear-gradient(135deg, #c57a7a 0%, #e7c9b7 55%, #fbf3ee 100%);
        }
        .ui-hero-img {
          height: 360px;
          object-fit: cover;
          display: block;
          filter: saturate(1.03);
        }
        .ui-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.60) 0%,
            rgba(0, 0, 0, 0.22) 55%,
            rgba(0, 0, 0, 0) 100%
          );
        }
        .ui-hero-noise {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image: radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px);
          background-size: 8px 8px;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        .ui-hero-fallback {
          background: linear-gradient(135deg, #fbf3ee 0%, #f3ded0 45%, #c57a7a 140%);
        }
        .ui-hero-fallback-noise {
          position: absolute;
          inset: 0;
          opacity: 0.1;
          background-image: radial-gradient(rgba(0, 0, 0, 0.25) 1px, transparent 1px);
          background-size: 9px 9px;
          pointer-events: none;
        }

        .ui-glass {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(10px);
        }

        .ui-badge {
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #fff;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 700;
        }
        .ui-badge-dark {
          background: rgba(255, 255, 255, 0.35);
          border: 1px solid rgba(0, 0, 0, 0.06);
          color: #3b2a2a;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
        }

        .ui-btn-primary {
          background: #c57a7a;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 10px 22px rgba(197, 122, 122, 0.22);
        }
        .ui-btn-primary:hover {
          background: #b86f6f;
          color: #fff;
        }

        .ui-btn-soft {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: #3b2a2a;
        }
        .ui-btn-soft:hover {
          background: #fff7f2;
          border-color: rgba(197, 122, 122, 0.25);
          color: #3b2a2a;
        }

        .ui-title {
          letter-spacing: 0.2px;
        }
        .ui-title-dark {
          color: #3b2a2a;
          letter-spacing: 0.2px;
        }
        .ui-subtitle {
          opacity: 0.92;
          max-width: 900px;
        }
        .ui-price {
          color: #c57a7a;
        }

        .ui-card {
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .ui-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.12) !important;
        }

        .ui-card-img {
          height: 240px;
          object-fit: cover;
        }

        .ui-noimg {
          background: linear-gradient(135deg, #f7e6dc 0%, #fbf3ee 100%);
          color: rgba(0, 0, 0, 0.55);
        }

        .ui-badge-corner {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #c57a7a;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 999px;
          padding: 8px 12px;
          font-weight: 700;
        }
        .ui-badge-corner-right {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.86);
          color: #8a4a4a;
          border: 1px solid rgba(197, 122, 122, 0.22);
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 800;
        }

        .ui-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 38px;
        }
      `}</style>
    </section>
  );
}