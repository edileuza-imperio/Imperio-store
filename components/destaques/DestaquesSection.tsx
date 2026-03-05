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
    const amount = Math.round(el.clientWidth * 0.92);
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <section className="uiCreamSection">
      <div className="container">
        {/* HEADER */}
        <div className="uiHeaderRow">
          <div>
            <h2 className="uiTitle">Destaques</h2>
            <div className="uiSub">
              Selecionados com um visual premium em tons creme & rosé
            </div>
          </div>

          <div className="uiCountPill" title="Quantidade de itens">
            <i className="bi bi-bag-heart me-2" />
            {produtos.length} item(ns)
          </div>
        </div>

        <div className="row g-4 align-items-stretch">
          {/* BANNER (ESQUERDA) */}
          <div className="col-12 col-lg-4">
            <div className="uiBannerCard h-100">
              <div className="uiChipRow">
                <span className="uiChip">
                  <i className="bi bi-sparkle me-2" />
                  Novidades
                </span>
                <span className="uiChip">
                  <i className="bi bi-truck me-2" />
                  Frete
                </span>
              </div>

              <div className="uiBannerTitle">{camp.titulo}</div>

              <div className="uiBannerDesc">
                {camp.descricao
                  ? camp.descricao
                  : "Produtos selecionados para presentear — elegantes, delicados e com preço especial."}
              </div>

              <div className="uiBannerCtaRow">
                {/* Botão flutuante visual (fixo no card) */}
                <Link href={`/campanha/${camp.slug}`} className="uiBannerBtn">
                  Ver catálogo
                  <i className="bi bi-arrow-right ms-2" />
                </Link>

                <div className="uiUpdated">
                  <i className="bi bi-clock me-2" />
                  Atualizado diariamente
                </div>
              </div>

              <div className="uiMiniCards">
                <div className="uiMini">
                  <div className="uiMiniTop">Oferta do dia</div>
                  <div className="uiMiniStrong">até 30% OFF</div>
                </div>

                <div className="uiMini">
                  <div className="uiMiniTop">Pagamento</div>
                  <div className="uiMiniStrong">Pix / Cartão</div>
                </div>
              </div>

              <div className="uiBannerGlow" />
            </div>
          </div>

          {/* CARROSSEL (DIREITA) */}
          <div className="col-12 col-lg-8">
            <div className="uiCarouselWrap position-relative h-100">
              {/* setas flutuantes no desktop */}
              <button
                type="button"
                className="uiArrow uiArrowLeft d-none d-lg-flex"
                onClick={() => scrollCarousel("prev")}
                aria-label="Anterior"
                title="Anterior"
              >
                <i className="bi bi-chevron-left" />
              </button>

              <button
                type="button"
                className="uiArrow uiArrowRight d-none d-lg-flex"
                onClick={() => scrollCarousel("next")}
                aria-label="Próximo"
                title="Próximo"
              >
                <i className="bi bi-chevron-right" />
              </button>

              {/* fade nas bordas (profissa) */}
              <div className="uiFade uiFadeLeft d-none d-lg-block" />
              <div className="uiFade uiFadeRight d-none d-lg-block" />

              <div ref={trackRef} className="uiTrack">
                {produtos.map((raw) => {
                  const p = normalizarProduto(raw);
                  const img = getImagemUrl(p.imagem);

                  return (
                    <div key={p.key} className="uiSlide">
                      <div className="uiProductCard">
                        <div className="uiImgWrap">
                          {img ? (
                            <img src={img} alt={p.nome} className="uiImg" />
                          ) : (
                            <div className="uiNoImg">
                              <i className="bi bi-image fs-2 mb-1" />
                              <span>Sem imagem</span>
                            </div>
                          )}
                        </div>

                        <div className="uiCardBody">
                          <div className="uiProdName">{p.nome}</div>

                          {p.descricao ? (
                            <div className="uiProdDesc">{p.descricao}</div>
                          ) : (
                            <div className="uiProdDesc uiMuted">
                              Detalhes disponíveis ao abrir o produto.
                            </div>
                          )}

                          <div className="uiPriceRow">
                            <div className="uiPrice">{formatMoney(p.preco)}</div>

                            <span className="uiBadge">
                              <i className="bi bi-star-fill me-1" />
                              Destaque
                            </span>
                          </div>

                          <div className="uiBtnRow">
                            <Link href={`/produto/${p.slug}`} className="uiBtn uiBtnLight">
                              <i className="bi bi-eye me-2" />
                              Detalhes
                            </Link>

                            <button
                              type="button"
                              className="uiBtn uiBtnRose"
                              onClick={() => console.log("Adicionar:", p.slug)}
                            >
                              <i className="bi bi-cart-plus me-2" />
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="uiMobileHint d-lg-none">
                <i className="bi bi-arrow-left-right me-2" />
                Arraste para ver mais produtos
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          /* === PALETA (creme + rosé queimado) === */
          .uiCreamSection {
            padding: 44px 0 56px;
            background: radial-gradient(1200px 500px at 10% 0%, #fff7f0 0%, transparent 60%),
              radial-gradient(900px 420px at 90% 30%, #f7efe6 0%, transparent 65%),
              #f6efe6;
          }

          .uiHeaderRow {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 18px;
          }

          .uiTitle {
            margin: 0;
            font-weight: 900;
            font-size: 28px;
            letter-spacing: 0.2px;
            color: rgba(0, 0, 0, 0.78);
          }

          .uiSub {
            margin-top: 4px;
            font-weight: 700;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.55);
          }

          .uiCountPill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.65);
            border: 1px solid rgba(0, 0, 0, 0.06);
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
            font-weight: 900;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.7);
            white-space: nowrap;
          }

          /* === BANNER CARD === */
          .uiBannerCard {
            position: relative;
            border-radius: 18px;
            padding: 18px;
            background: linear-gradient(180deg, #fffaf4 0%, #fff2e7 100%);
            border: 1px solid rgba(0, 0, 0, 0.06);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            min-height: 320px; /* tamanho parecido com “banner de destaque” */
          }

          .uiChipRow {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .uiChip {
            display: inline-flex;
            align-items: center;
            padding: 7px 10px;
            border-radius: 999px;
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.06);
            font-weight: 900;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.72);
          }

          .uiBannerTitle {
            margin-top: 12px;
            font-weight: 900;
            font-size: 22px;
            color: rgba(0, 0, 0, 0.78);
            line-height: 1.15;
          }

          .uiBannerDesc {
            margin-top: 8px;
            font-weight: 700;
            font-size: 13px;
            color: rgba(0, 0, 0, 0.58);
            line-height: 1.35;
            max-width: 46ch;
          }

          .uiBannerCtaRow {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 14px;
          }

          .uiBannerBtn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 14px;
            border-radius: 12px;
            background: #c69373; /* rosé queimado */
            color: #fff;
            text-decoration: none;
            font-weight: 900;
            font-size: 13px;
            box-shadow: 0 14px 26px rgba(198, 147, 115, 0.35);
            transition: transform 0.12s ease, filter 0.12s ease;
            white-space: nowrap;
          }

          .uiBannerBtn:hover {
            transform: translateY(-1px);
            filter: brightness(0.98);
          }

          .uiUpdated {
            font-weight: 900;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.55);
            white-space: nowrap;
          }

          .uiMiniCards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 14px;
          }

          .uiMini {
            padding: 10px 12px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.78);
            border: 1px solid rgba(0, 0, 0, 0.06);
          }

          .uiMiniTop {
            font-weight: 900;
            font-size: 11px;
            color: rgba(0, 0, 0, 0.5);
            margin-bottom: 3px;
          }

          .uiMiniStrong {
            font-weight: 900;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.75);
          }

          .uiBannerGlow {
            position: absolute;
            right: -120px;
            bottom: -120px;
            width: 240px;
            height: 240px;
            background: radial-gradient(circle, rgba(198, 147, 115, 0.25), transparent 60%);
            pointer-events: none;
          }

          /* === CARROSSEL === */
          .uiCarouselWrap {
            border-radius: 18px;
          }

          .uiTrack {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            padding: 4px 6px 10px;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }

          .uiTrack::-webkit-scrollbar {
            height: 10px;
          }
          .uiTrack::-webkit-scrollbar-thumb {
            background: rgba(198, 147, 115, 0.35);
            border-radius: 999px;
          }
          .uiTrack::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 999px;
          }

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

          /* setas */
          .uiArrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 46px;
            height: 46px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.12);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            z-index: 6;
            transition: transform 0.12s ease, background 0.12s ease;
          }
          .uiArrow:hover {
            background: #fff7f0;
            transform: translateY(-50%) scale(1.02);
          }
          .uiArrowLeft {
            left: -10px;
          }
          .uiArrowRight {
            right: -10px;
          }

          /* fade bordas */
          .uiFade {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 44px;
            z-index: 5;
            pointer-events: none;
          }
          .uiFadeLeft {
            left: 0;
            background: linear-gradient(90deg, #f6efe6 0%, rgba(246, 239, 230, 0) 100%);
          }
          .uiFadeRight {
            right: 0;
            background: linear-gradient(270deg, #f6efe6 0%, rgba(246, 239, 230, 0) 100%);
          }

          /* === CARD PRODUTO === */
          .uiProductCard {
            border-radius: 18px;
            overflow: hidden;
            background: #fff;
            border: 1px solid rgba(0, 0, 0, 0.06);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
            transition: transform 0.16s ease, box-shadow 0.16s ease;
            height: 100%;
          }
          .uiProductCard:hover {
            transform: translateY(-4px);
            box-shadow: 0 24px 50px rgba(0, 0, 0, 0.12);
          }

          .uiImgWrap {
            height: 190px;
            background: #f2e6dc;
            overflow: hidden;
          }
          .uiImg {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.22s ease;
          }
          .uiProductCard:hover .uiImg {
            transform: scale(1.06);
          }
          .uiNoImg {
            height: 190px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: rgba(0, 0, 0, 0.55);
            font-weight: 900;
          }

          .uiCardBody {
            padding: 12px 12px 14px;
          }

          .uiProdName {
            font-weight: 900;
            font-size: 14px;
            color: rgba(0, 0, 0, 0.78);
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .uiProdDesc {
            margin-top: 6px;
            font-weight: 700;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.55);
            line-height: 1.25;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 30px;
          }
          .uiMuted {
            opacity: 0.85;
          }

          .uiPriceRow {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: 10px;
          }

          .uiPrice {
            font-weight: 900;
            font-size: 14px;
            color: rgba(0, 0, 0, 0.8);
          }

          .uiBadge {
            display: inline-flex;
            align-items: center;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(198, 147, 115, 0.12);
            border: 1px solid rgba(198, 147, 115, 0.25);
            color: rgba(123, 75, 55, 0.95);
            font-weight: 900;
            font-size: 11px;
            white-space: nowrap;
          }

          .uiBtnRow {
            display: flex;
            gap: 10px;
            margin-top: 12px;
          }

          .uiBtn {
            flex: 1;
            border-radius: 12px;
            padding: 10px 12px;
            font-weight: 900;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            border: 1px solid rgba(0, 0, 0, 0.08);
            transition: transform 0.12s ease, filter 0.12s ease, background 0.12s ease;
            white-space: nowrap;
          }

          .uiBtn:hover {
            transform: translateY(-1px);
            filter: brightness(0.99);
          }

          .uiBtnLight {
            background: #fff;
            color: rgba(0, 0, 0, 0.78);
          }

          .uiBtnRose {
            background: #c69373;
            color: #fff;
            border-color: rgba(198, 147, 115, 0.35);
            box-shadow: 0 14px 26px rgba(198, 147, 115, 0.28);
          }

          .uiMobileHint {
            margin-top: 10px;
            text-align: center;
            font-weight: 900;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.55);
          }

          @media (max-width: 991px) {
            .uiHeaderRow {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}</style>
      </div>
    </section>
  );
}