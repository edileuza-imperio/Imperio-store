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

    // anda "quase uma tela" do carrossel
    const amount = Math.round(el.clientWidth * 0.92);
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <section className="uiSection py-5">
      <div className="container">
        <div className="row g-4 align-items-stretch">
          {/* ===== LEFT: BANNER ===== */}
          <div className="col-12 col-lg-4">
            <div className="uiSideBanner h-100 position-relative">
              <div className="uiTopBadge">
                <i className="bi bi-stars me-2" />
                Destaques da campanha
              </div>

              <h2 className="uiBannerTitle">{camp.titulo}</h2>

              <p className="uiBannerDesc">
                {camp.descricao ? camp.descricao : "Seleção especial com os melhores itens."}
              </p>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <span className="uiChip">
                  <i className="bi bi-truck me-1" />
                  Envio rápido
                </span>
                <span className="uiChip">
                  <i className="bi bi-shield-check me-1" />
                  Compra segura
                </span>
                <span className="uiChip">
                  <i className="bi bi-heart me-1" />
                  Curadoria
                </span>
              </div>

              {/* botão flutuante */}
              <Link href={`/campanha/${camp.slug}`} className="uiFloatingBtn" title="Ver coleção">
                <i className="bi bi-grid me-2" />
                Ver coleção
              </Link>

              <div className="uiGlow" />
            </div>
          </div>

          {/* ===== RIGHT: CARROSSEL ===== */}
          <div className="col-12 col-lg-8">
            <div className="uiCarouselShell h-100">
              <div className="uiCarouselHeader">
                <div>
                  <div className="uiKicker">Produtos em destaque</div>
                  <div className="uiHeaderTitle">Escolhidos pra você</div>
                </div>

                {/* controles (desktop) */}
                <div className="uiControls">
                  <button
                    type="button"
                    className="uiNavBtn"
                    onClick={() => scrollCarousel("prev")}
                    aria-label="Anterior"
                    title="Anterior"
                  >
                    <i className="bi bi-chevron-left" />
                  </button>
                  <button
                    type="button"
                    className="uiNavBtn"
                    onClick={() => scrollCarousel("next")}
                    aria-label="Próximo"
                    title="Próximo"
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>

              <div ref={trackRef} className="uiTrack">
                {produtos.map((raw) => {
                  const p = normalizarProduto(raw);
                  const img = getImagemUrl(p.imagem);

                  return (
                    <div key={p.key} className="uiSlide">
                      <div className="card border-0 h-100 uiCard">
                        <div className="uiImgWrap position-relative">
                          {img ? (
                            <img src={img} alt={p.nome} className="uiImg" />
                          ) : (
                            <div className="uiNoImg">
                              <div className="text-center">
                                <i className="bi bi-image fs-2 d-block mb-1" />
                                <span className="small fw-semibold">Sem imagem</span>
                              </div>
                            </div>
                          )}

                          <span className="badge uiBadge">
                            <i className="bi bi-star-fill me-1" />
                            Destaque
                          </span>
                        </div>

                        <div className="card-body d-flex flex-column">
                          <h6 className="fw-semibold mb-1 uiTitleClamp">{p.nome}</h6>

                          <p className="small text-muted mb-2 uiDescClamp">
                            {p.descricao ? p.descricao : "Produto selecionado para destaque."}
                          </p>

                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="fw-bold fs-5 uiPrice">{formatMoney(p.preco)}</div>
                            <span className="badge uiMiniPill">
                              <i className="bi bi-patch-check me-1" />
                              Top
                            </span>
                          </div>

                          <div className="mt-auto d-flex gap-2">
                            <Link
                              href={`/produto/${p.slug}`}
                              className="btn uiBtnSoft w-100"
                              title="Ver detalhes"
                            >
                              <i className="bi bi-eye" />
                            </Link>

                            <button
                              type="button"
                              className="btn uiBtnPrimary w-100"
                              title="Adicionar ao carrinho"
                              onClick={() => console.log("Adicionar:", p.slug)}
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

              <div className="uiHint d-lg-none">
                <i className="bi bi-arrow-left-right me-2" />
                Arraste para ver mais
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .uiSection {
            background: #fbf3ee;
          }

          /* ===== Banner lateral ===== */
          .uiSideBanner {
            border-radius: 18px;
            padding: 26px;
            color: #fff;
            background: linear-gradient(145deg, #c57a7a 0%, #e7c9b7 70%, #fbf3ee 140%);
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 16px 34px rgba(0, 0, 0, 0.14);
            overflow: hidden;
          }

          .uiTopBadge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 999px;
            font-weight: 900;
            font-size: 12px;
            background: rgba(255, 255, 255, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.22);
            backdrop-filter: blur(6px);
          }

          .uiBannerTitle {
            margin-top: 14px;
            font-weight: 900;
            letter-spacing: 0.2px;
            line-height: 1.1;
            font-size: 30px;
          }

          .uiBannerDesc {
            margin-top: 10px;
            margin-bottom: 0;
            opacity: 0.92;
            color: rgba(255, 255, 255, 0.92);
          }

          .uiChip {
            display: inline-flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 999px;
            font-weight: 800;
            font-size: 12px;
            background: rgba(255, 255, 255, 0.14);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }

          .uiFloatingBtn {
            position: absolute;
            left: 18px;
            right: 18px;
            bottom: 18px;
            background: #fff;
            color: #7a3f3f;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 14px;
            padding: 12px 14px;
            font-weight: 900;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 16px 34px rgba(0, 0, 0, 0.18);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            z-index: 2;
          }

          .uiFloatingBtn:hover {
            transform: translateY(-2px);
            background: #fff7f2;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.22);
          }

          .uiGlow {
            position: absolute;
            width: 280px;
            height: 280px;
            right: -120px;
            top: -120px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.45), transparent 60%);
            opacity: 0.35;
            pointer-events: none;
          }

          /* ===== Carrossel ===== */
          .uiCarouselShell {
            background: rgba(255, 255, 255, 0.55);
            border: 1px solid rgba(0, 0, 0, 0.06);
            border-radius: 18px;
            padding: 18px;
            box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08);
          }

          .uiCarouselHeader {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
          }

          .uiKicker {
            font-weight: 900;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.55);
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .uiHeaderTitle {
            font-weight: 900;
            font-size: 18px;
            color: rgba(0, 0, 0, 0.78);
          }

          .uiControls {
            display: none;
            gap: 8px;
          }

          .uiNavBtn {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.12);
            background: #fff;
            font-weight: 900;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            transition: transform 0.12s ease;
          }

          .uiNavBtn:hover {
            transform: translateY(-1px);
            background: #fff7f2;
          }

          /* desktop: mostra botões */
          @media (min-width: 992px) {
            .uiControls {
              display: flex;
            }
          }

          .uiTrack {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            padding: 6px 4px 10px;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }

          .uiTrack::-webkit-scrollbar {
            height: 10px;
          }
          .uiTrack::-webkit-scrollbar-thumb {
            background: rgba(197, 122, 122, 0.35);
            border-radius: 999px;
          }
          .uiTrack::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.04);
            border-radius: 999px;
          }

          /* 1 slide por vez no mobile; 2 no tablet; 3 no desktop */
          .uiSlide {
            scroll-snap-align: start;
            flex: 0 0 88%;
          }

          @media (min-width: 576px) {
            .uiSlide {
              flex-basis: 48%;
            }
          }

          @media (min-width: 1200px) {
            .uiSlide {
              flex-basis: 32%;
            }
          }

          .uiHint {
            margin-top: 10px;
            font-weight: 800;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.55);
            text-align: center;
          }

          /* ===== Cards ===== */
          .uiCard {
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
            transition: transform 0.18s ease, box-shadow 0.18s ease;
            background: #fff;
          }

          .uiCard:hover {
            transform: translateY(-5px);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.14);
          }

          .uiImgWrap {
            height: 220px;
            overflow: hidden;
            background: #f7e6dc;
          }

          .uiImg {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.25s ease;
            display: block;
          }

          .uiCard:hover .uiImg {
            transform: scale(1.06);
          }

          .uiNoImg {
            height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(0, 0, 0, 0.55);
            background: linear-gradient(135deg, #f7e6dc 0%, #fbf3ee 100%);
          }

          .uiBadge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: #c57a7a;
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 999px;
            padding: 8px 12px;
            font-weight: 900;
            font-size: 12px;
          }

          .uiMiniPill {
            background: rgba(231, 201, 183, 0.55);
            color: #6b3a3a;
            border: 1px solid rgba(197, 122, 122, 0.18);
            border-radius: 999px;
            padding: 6px 10px;
            font-weight: 900;
            font-size: 12px;
          }

          .uiPrice {
            color: #c57a7a;
          }

          .uiBtnPrimary {
            background: #c57a7a;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            font-weight: 900;
          }

          .uiBtnPrimary:hover {
            background: #b86f6f;
            color: #fff;
          }

          .uiBtnSoft {
            background: #fff;
            color: #3b2a2a;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 12px;
            font-weight: 900;
          }

          .uiBtnSoft:hover {
            background: #fff7f2;
            border-color: rgba(197, 122, 122, 0.25);
          }

          .uiTitleClamp {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .uiDescClamp {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 38px;
          }

          @media (max-width: 991px) {
            .uiSideBanner {
              padding-bottom: 80px;
            }
          }
        `}</style>
      </div>
    </section>
  );
}