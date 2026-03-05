"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

  const trackRef = useRef<HTMLDivElement | null>(null);

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

  if (loading || !temConteudo || !campanha) return null;

  const camp = campanha;

  function scrollCarousel(dir: "prev" | "next") {
    const el = trackRef.current;
    if (!el) return;

    // rola mais “natural”
    const card = el.querySelector<HTMLElement>("[data-card='1']");
    const cardW = card?.offsetWidth ?? 320;
    const gap = 16;
    const amount = (cardW + gap) * 2;

    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <section className="py-5 ds-section">
      <div className="container">
        {/* TÍTULO */}
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h2 className="m-0 fw-bold ds-title">Destaques</h2>
            <small className="text-muted fw-semibold">
              Selecionados com tons creme e rosé (visual próprio)
            </small>
          </div>

          <span className="badge rounded-pill ds-count">
            <i className="bi bi-bag-heart me-2" />
            {produtos.length} item(ns)
          </span>
        </div>

        <div className="row g-4 align-items-stretch">
          {/* BANNER ESQUERDA */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm h-100 ds-banner">
              <div className="card-body p-4 position-relative">
                <div className="d-flex gap-2 flex-wrap mb-3">
                  <span className="badge rounded-pill ds-chip">
                    <i className="bi bi-sparkle me-2" />
                    Novidades
                  </span>
                  <span className="badge rounded-pill ds-chip">
                    <i className="bi bi-truck me-2" />
                    Frete
                  </span>
                </div>

                <h5 className="fw-bold mb-2">{camp.titulo}</h5>

                <p className="text-muted mb-4" style={{ lineHeight: 1.35 }}>
                  {camp.descricao
                    ? camp.descricao
                    : "Produtos selecionados para presentear — elegantes e com preço especial."}
                </p>

                {/* “flutuante” mas simples */}
                <Link href={`/campanha/${camp.slug}`} className="btn ds-cta">
                  Ver catálogo <i className="bi bi-arrow-right ms-2" />
                </Link>

                <div className="d-flex gap-2 mt-4">
                  <div className="ds-mini p-3 flex-fill">
                    <div className="ds-mini-top">Oferta do dia</div>
                    <div className="ds-mini-strong">até 30% OFF</div>
                  </div>

                  <div className="ds-mini p-3 flex-fill">
                    <div className="ds-mini-top">Pagamento</div>
                    <div className="ds-mini-strong">Pix / Cartão</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARROSSEL DIREITA */}
          <div className="col-12 col-lg-8">
            <div className="position-relative">
              {/* setas (desktop) */}
              <button
                type="button"
                className="btn ds-arrow ds-arrow-left d-none d-lg-inline-flex"
                onClick={() => scrollCarousel("prev")}
                aria-label="Anterior"
                title="Anterior"
              >
                <i className="bi bi-chevron-left" />
              </button>

              <button
                type="button"
                className="btn ds-arrow ds-arrow-right d-none d-lg-inline-flex"
                onClick={() => scrollCarousel("next")}
                aria-label="Próximo"
                title="Próximo"
              >
                <i className="bi bi-chevron-right" />
              </button>

              <div ref={trackRef} className="ds-track">
                {produtos.map((raw, idx) => {
                  const p = normalizarProduto(raw);
                  const img = getImagemUrl(p.imagem);

                  return (
                    <div key={p.key} className="ds-slide">
                      <div className="card border-0 shadow-sm h-100 ds-card" data-card={idx === 0 ? "1" : "0"}>
                        {/* IMAGEM */}
                        <div className="position-relative">
                          {img ? (
                            <img
                              src={img}
                              alt={p.nome}
                              className="card-img-top ds-img"
                            />
                          ) : (
                            <div className="ds-noimg d-flex align-items-center justify-content-center">
                              <div className="text-center">
                                <i className="bi bi-image fs-2 d-block mb-1" />
                                <small className="fw-semibold">Sem imagem</small>
                              </div>
                            </div>
                          )}

                          <span className="badge rounded-pill ds-badge">
                            <i className="bi bi-star-fill me-1" />
                            Destaque
                          </span>
                        </div>

                        {/* BODY */}
                        <div className="card-body d-flex flex-column">
                          <div className="fw-bold ds-name">{p.nome}</div>

                          <small className="text-muted ds-desc">
                            {p.descricao ? p.descricao : "Clique em detalhes para ver mais."}
                          </small>

                          <div className="mt-2 fw-bold ds-price">{formatMoney(p.preco)}</div>

                          <div className="mt-auto d-flex gap-2 pt-3">
                            <Link href={`/produto/${p.slug}`} className="btn btn-outline-dark w-100">
                              <i className="bi bi-eye" />
                              <span className="ms-2 d-none d-sm-inline">Detalhes</span>
                            </Link>

                            <button
                              type="button"
                              className="btn w-100 ds-add"
                              onClick={() => console.log("Adicionar:", p.slug)}
                            >
                              <i className="bi bi-cart-plus" />
                              <span className="ms-2 d-none d-sm-inline">Adicionar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-2 d-lg-none">
                <small className="text-muted fw-semibold">
                  <i className="bi bi-arrow-left-right me-2" />
                  Arraste para ver mais
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* CSS mínimo e isolado */}
        <style jsx>{`
          .ds-section {
            background: #f6efe6; /* creme */
          }

          .ds-title {
            color: #2b211c;
          }

          .ds-count {
            background: rgba(255, 255, 255, 0.75);
            color: #2b211c;
            border: 1px solid rgba(0, 0, 0, 0.06);
            padding: 10px 12px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
          }

          .ds-banner {
            background: #fff7f0;
            border-radius: 18px;
          }

          .ds-chip {
            background: #ffffff;
            color: #2b211c;
            border: 1px solid rgba(0, 0, 0, 0.06);
            padding: 8px 10px;
          }

          .ds-cta {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            background: #c69373;
            color: #fff;
            border-radius: 14px;
            font-weight: 800;
            padding: 12px 14px;
            border: none;
            box-shadow: 0 14px 26px rgba(198, 147, 115, 0.28);
          }

          .ds-cta:hover {
            filter: brightness(0.98);
            color: #fff;
          }

          .ds-mini {
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(0, 0, 0, 0.06);
            border-radius: 14px;
          }

          .ds-mini-top {
            font-size: 11px;
            font-weight: 800;
            color: rgba(0, 0, 0, 0.55);
          }

          .ds-mini-strong {
            font-size: 12px;
            font-weight: 900;
            color: #2b211c;
          }

          /* CARROSSEL */
          .ds-track {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            padding: 4px 4px 10px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }

          .ds-track::-webkit-scrollbar {
            height: 10px;
          }
          .ds-track::-webkit-scrollbar-thumb {
            background: rgba(198, 147, 115, 0.35);
            border-radius: 999px;
          }
          .ds-track::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 999px;
          }

          .ds-slide {
            scroll-snap-align: start;
            flex: 0 0 88%;
          }
          @media (min-width: 576px) {
            .ds-slide {
              flex-basis: 48%;
            }
          }
          @media (min-width: 1200px) {
            .ds-slide {
              flex-basis: 32%;
            }
          }

          .ds-arrow {
            position: absolute;
            top: 40%;
            transform: translateY(-50%);
            width: 44px;
            height: 44px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 16px 26px rgba(0, 0, 0, 0.12);
            align-items: center;
            justify-content: center;
            z-index: 5;
          }
          .ds-arrow-left {
            left: -10px;
          }
          .ds-arrow-right {
            right: -10px;
          }

          /* CARD */
          .ds-card {
            border-radius: 18px;
            overflow: hidden;
          }

          .ds-img {
            height: 200px;
            object-fit: cover;
          }

          .ds-noimg {
            height: 200px;
            background: #efe3d8;
            color: rgba(0, 0, 0, 0.6);
          }

          .ds-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(198, 147, 115, 0.16);
            border: 1px solid rgba(198, 147, 115, 0.25);
            color: #6b3f2a;
            font-weight: 900;
          }

          .ds-name {
            color: #2b211c;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .ds-desc {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 34px;
          }

          .ds-price {
            color: #2b211c;
          }

          .ds-add {
            background: #c69373;
            color: #fff;
            border: none;
            font-weight: 800;
          }
          .ds-add:hover {
            color: #fff;
            filter: brightness(0.98);
          }

          /* banner CTA não sobrepor em telas pequenas */
          @media (max-width: 991px) {
            .ds-cta {
              position: static;
              width: 100%;
              margin-top: 10px;
            }
          }
        `}</style>
      </div>
    </section>
  );
}