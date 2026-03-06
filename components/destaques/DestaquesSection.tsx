"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  CampanhaApi,
  CampanhaUI,
  ProdutoApi,
  ProdutoUI,
} from "../Bibioteca/Bibiotecas";
import { getImagemUrl } from "@/hooks/useCarrinhoCheckout";
import { isImagePath, formatMoney } from "../Bibioteca/functions";

function truncateText(text?: string, max = 80): string {
  const value = String(text ?? "").trim();

  if (!value) return "";
  if (value.length <= max) return value;

  return `${value.slice(0, max).trim()}...`;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  let cleaned = value.trim();

  if (!cleaned) return 0;

  cleaned = cleaned.replace(/R\$/gi, "").replace(/\s/g, "");

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    // Ex.: 1.234,56  => remove milhar e troca vírgula por ponto
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // Ex.: 1,234.56 => remove milhar em vírgula
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Ex.: 115,00 => 115.00
    cleaned = cleaned.replace(",", ".");
  } else {
    // Só ponto:
    // Ex.: 115.00 deve continuar 115.00
    // Ex.: 1.234 pode ser milhar -> se tiver mais de um ponto, remove todos menos o último
    const dots = (cleaned.match(/\./g) || []).length;

    if (dots > 1) {
      const lastDot = cleaned.lastIndexOf(".");
      cleaned =
        cleaned.slice(0, lastDot).replace(/\./g, "") + cleaned.slice(lastDot);
    }
  }

  cleaned = cleaned.replace(/[^\d.-]/g, "");

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DestaquesSection() {
  const [campanha, setCampanha] = useState<CampanhaUI | null>(null);
  const [produtos, setProdutos] = useState<ProdutoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSlug, setAddingSlug] = useState<string | null>(null);

  const trackRef = useRef<HTMLDivElement | null>(null);

  async function carregar() {
    try {
      setLoading(true);

      const res = await api.get("/admin/campanha/destaques");
      const dados = res.data?.dados ?? {};

      const c: CampanhaApi | null = dados?.campanha ?? null;
      const p: ProdutoApi[] = Array.isArray(dados?.produtos) ? dados.produtos : [];

      console.log("PRODUTOS DA API:", p);

      if (!c || !p.length) {
        setCampanha(null);
        setProdutos([]);
        return;
      }

      const campUI: CampanhaUI = {
        titulo: String(c.titulo ?? "Campanha"),
        slug: String(c.slug ?? ""),
        descricao: String(c.descricao ?? ""),
        banner: String(c.banner ?? ""),
        status_nome: c.status_nome,
        status_codigo: c.status_codigo,
      };

      const prodsUI: ProdutoUI[] = p.map((x) => {
        const precoConvertido = toNumber(x.preco);

        console.log("PREÇO ORIGINAL:", x.preco, "=> PREÇO CONVERTIDO:", precoConvertido);

        return {
          key: x.id_produto ?? `${x.slug ?? ""}-${x.ordem ?? ""}`,
          id_produto: Number(x.id_produto ?? 0),
          nome: String(x.nome ?? ""),
          slug: String(x.slug ?? ""),
          descricao: String(x.descricao ?? ""),
          preco: precoConvertido,
          imagem: String(x.imagem ?? ""),
          ordem: Number(x.ordem ?? 0),
        };
      });

      setCampanha(campUI);
      setProdutos(prodsUI);
    } catch (e) {
      console.error("Erro ao carregar destaques:", e);
      setCampanha(null);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const produtosOrdenados = useMemo(() => {
    return [...produtos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [produtos]);

  const temConteudo = !!campanha && produtosOrdenados.length > 0;

  function scrollCarousel(dir: "prev" | "next") {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-card='1']");
    const cardW = card?.offsetWidth ?? 340;
    const gap = 16;

    const amount = (cardW + gap) * 2;
    el.scrollBy({
      left: dir === "next" ? amount : -amount,
      behavior: "smooth",
    });
  }

  async function adicionarAoCarrinho(produto: ProdutoUI) {
    try {
      if (!produto.id_produto || addingSlug) return;

      setAddingSlug(produto.slug);

      const payload = {
        produto_id: Number(produto.id_produto),
        quantidade: 1,
      };

      console.log("ENVIANDO PARA CARRINHO:", payload);

      const res = await api.post("/carrinho/adicionar", payload);

      console.log("RESPOSTA ADD CARRINHO:", res.data);

      alert(`"${produto.nome}" foi adicionado ao carrinho.`);
    } catch (error: any) {
      console.error(
        "Erro ao adicionar ao carrinho:",
        error?.response?.data || error
      );

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        "Não foi possível adicionar ao carrinho.";

      alert(mensagem);
    } finally {
      setAddingSlug(null);
    }
  }

  if (loading) {
    return (
      <section className="py-5 ds-section">
        <div className="container">
          <div className="ds-skel skel-title" />
          <div className="row g-4 mt-2">
            <div className="col-12 col-lg-4">
              <div className="ds-skel skel-banner" />
            </div>
            <div className="col-12 col-lg-8">
              <div className="d-flex gap-3">
                <div className="ds-skel skel-card" />
                <div className="ds-skel skel-card d-none d-sm-block" />
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .ds-section {
            background: #f7efe7;
          }
          .ds-skel {
            border-radius: 18px;
            background: linear-gradient(
              90deg,
              rgba(169, 96, 96, 0.1),
              rgba(169, 96, 96, 0.18),
              rgba(169, 96, 96, 0.1)
            );
            background-size: 200% 100%;
            animation: sk 1.1s infinite linear;
          }
          .skel-title {
            width: 280px;
            height: 26px;
          }
          .skel-banner {
            height: 380px;
          }
          .skel-card {
            height: 380px;
            flex: 1;
          }
          @keyframes sk {
            0% {
              background-position: 0% 0%;
            }
            100% {
              background-position: -200% 0%;
            }
          }
        `}</style>
      </section>
    );
  }

  if (!temConteudo || !campanha) return null;

  const bannerIsImg = isImagePath(campanha.banner);
  const bannerImg = bannerIsImg ? getImagemUrl(campanha.banner) : "";

  const statusLabel = campanha.status_nome?.trim() || campanha.status_codigo?.trim() || "";
  const statusClass =
    campanha.status_codigo === "categoria" ? "ds-status-green" : "ds-status";

  return (
    <section className="py-5 ds-section">
      <div className="container">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div className="d-flex flex-column gap-2">
            <h2 className="m-0 fw-bold ds-title">{campanha.titulo}</h2>

            {statusLabel ? (
              <span className={`badge rounded-pill ${statusClass}`}>
                <i className="bi bi-patch-check me-2" />
                {statusLabel}
              </span>
            ) : null}
          </div>

          <span className="badge rounded-pill ds-count">
            <i className="bi bi-stars me-2" />
            {produtosOrdenados.length} item(ns)
          </span>
        </div>

        <div className="row g-4 align-items-stretch">
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm h-100 ds-banner">
              <div className="ds-bannerTop">
                {bannerIsImg ? (
                  <img src={bannerImg} alt={campanha.titulo} className="ds-bannerImg" />
                ) : (
                  <div className="ds-bannerFallback">
                    <div className="ds-fallbackText">
                      {campanha.banner?.trim()
                        ? truncateText(campanha.banner, 42)
                        : campanha.titulo}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-body p-4 position-relative ds-bannerBody">
                <h5 className="fw-bold mb-2 ds-bannerTitle">{campanha.titulo}</h5>

                <p className="text-muted mb-4 ds-bannerDesc">
                  {campanha.descricao?.trim()
                    ? campanha.descricao
                    : "Seleção especial com preço e apresentação impecáveis."}
                </p>

                <Link href={`/campanha/${campanha.slug}`} className="btn ds-cta">
                  Ver campanha <i className="bi bi-arrow-right ms-2" />
                </Link>

                <div className="d-flex gap-2 mt-4">
                  <div className="ds-mini p-3 flex-fill">
                    <div className="ds-mini-top">Creme & Rosé</div>
                    <div className="ds-mini-strong">Premium</div>
                  </div>

                  <div className="ds-mini p-3 flex-fill">
                    <div className="ds-mini-top">Entrega</div>
                    <div className="ds-mini-strong">Rápida</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="position-relative ds-carouselWrap">
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
                {produtosOrdenados.map((p, idx) => {
                  const img = getImagemUrl(p.imagem);
                  const adicionando = addingSlug === p.slug;

                  return (
                    <div key={p.key} className="ds-slide">
                      <div
                        className="card border-0 h-100 ds-card"
                        data-card={idx === 0 ? "1" : "0"}
                      >
                        <div className="position-relative ds-media">
                          {img ? (
                            <img
                              src={img}
                              alt={p.nome}
                              className="card-img-top ds-img"
                              loading="lazy"
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

                          <div className="ds-gradient" />
                        </div>

                        <div className="card-body d-flex flex-column ds-body">
                          <div className="fw-bold ds-name" title={p.nome}>
                            {p.nome}
                          </div>

                          <small className="text-muted ds-desc" title={p.descricao}>
                            {p.descricao?.trim()
                              ? truncateText(p.descricao, 92)
                              : "Clique em detalhes para ver mais."}
                          </small>

                          <div className="mt-2 fw-bold ds-price">
                            {formatMoney(Number(p.preco || 0))}
                          </div>

                          <div className="mt-auto d-flex gap-2 pt-3">
                            <Link href={`/produto/${p.slug}`} className="btn ds-btn-outline w-100">
                              <i className="bi bi-eye" />
                              <span className="ms-2 d-none d-sm-inline">Detalhes</span>
                            </Link>

                            <button
                              type="button"
                              className="btn w-100 ds-add"
                              disabled={adicionando || !p.id_produto}
                              onClick={() => adicionarAoCarrinho(p)}
                            >
                              {adicionando ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" />
                                  <span className="ms-2 d-none d-sm-inline">Adicionando</span>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-cart-plus" />
                                  <span className="ms-2 d-none d-sm-inline">Adicionar</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="ds-borderGlow" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-2 d-lg-none">
                <small className="ds-hint">
                  <i className="bi bi-arrow-left-right me-2" />
                  Arraste para ver mais
                </small>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          :global(:root) {
            --creme: #f7efe7;
            --creme2: #fff7f0;
            --rosa: #b46a6a;
            --rosa2: #a85c5c;
            --marrom: #2b211c;
            --borda: rgba(43, 33, 28, 0.1);
          }

          .ds-section {
            background: var(--creme);
          }

          .ds-title {
            color: var(--marrom);
            letter-spacing: -0.2px;
          }

          .ds-count {
            background: rgba(255, 255, 255, 0.78);
            color: var(--marrom);
            border: 1px solid var(--borda);
            padding: 10px 12px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
            backdrop-filter: blur(10px);
          }

          .ds-status {
            background: rgba(255, 255, 255, 0.85);
            color: var(--marrom);
            border: 1px solid var(--borda);
            padding: 8px 10px;
            width: fit-content;
            backdrop-filter: blur(10px);
          }

          .ds-status-green {
            background: rgba(25, 135, 84, 0.12);
            color: #0f5132;
            border: 1px solid rgba(25, 135, 84, 0.28);
            padding: 8px 10px;
            width: fit-content;
            backdrop-filter: blur(10px);
          }

          .ds-banner {
            background: var(--creme2);
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid var(--borda);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.08);
          }

          .ds-bannerTop {
            height: 160px;
            border-bottom: 1px solid var(--borda);
          }

          .ds-bannerImg {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .ds-bannerFallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: flex-end;
            padding: 14px;
            background: radial-gradient(
                900px 240px at 15% 20%,
                rgba(180, 106, 106, 0.35),
                transparent 55%
              ),
              radial-gradient(
                800px 240px at 85% 10%,
                rgba(255, 255, 255, 0.75),
                transparent 60%
              ),
              linear-gradient(135deg, #fff3ea, #f2e1d6);
          }

          .ds-fallbackText {
            font-weight: 900;
            color: rgba(43, 33, 28, 0.92);
            background: rgba(255, 255, 255, 0.72);
            padding: 8px 10px;
            border-radius: 12px;
            border: 1px solid var(--borda);
            backdrop-filter: blur(10px);
          }

          .ds-bannerTitle {
            color: var(--marrom);
          }

          .ds-bannerDesc {
            line-height: 1.35;
          }

          .ds-cta {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            background: linear-gradient(135deg, var(--rosa), var(--rosa2));
            color: #fff;
            border-radius: 14px;
            font-weight: 900;
            padding: 12px 14px;
            border: none;
            box-shadow: 0 16px 30px rgba(180, 106, 106, 0.28);
          }

          .ds-cta:hover {
            color: #fff;
            filter: brightness(0.98);
          }

          .ds-mini {
            background: rgba(255, 255, 255, 0.78);
            border: 1px solid var(--borda);
            border-radius: 14px;
            backdrop-filter: blur(10px);
          }

          .ds-mini-top {
            font-size: 11px;
            font-weight: 900;
            color: rgba(0, 0, 0, 0.55);
          }

          .ds-mini-strong {
            font-size: 12px;
            font-weight: 900;
            color: var(--marrom);
          }

          .ds-carouselWrap {
            padding: 0 6px;
          }

          .ds-track {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            padding: 6px 4px 10px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-x: contain;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .ds-track::-webkit-scrollbar {
            display: none;
          }

          .ds-slide {
            scroll-snap-align: start;
            flex: 0 0 86%;
          }

          @media (min-width: 576px) {
            .ds-slide {
              flex-basis: 48%;
            }
          }

          @media (min-width: 992px) {
            .ds-slide {
              flex-basis: 49%;
            }
          }

          .ds-arrow {
            position: absolute;
            top: 42%;
            transform: translateY(-50%);
            width: 46px;
            height: 46px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid var(--borda);
            box-shadow: 0 18px 28px rgba(0, 0, 0, 0.14);
            align-items: center;
            justify-content: center;
            z-index: 5;
          }

          .ds-arrow-left {
            left: -12px;
          }

          .ds-arrow-right {
            right: -12px;
          }

          .ds-card {
            position: relative;
            border-radius: 22px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid var(--borda);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.08);
            transition: transform 180ms ease, box-shadow 180ms ease;
          }

          .ds-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 22px 46px rgba(0, 0, 0, 0.12);
          }

          .ds-borderGlow {
            pointer-events: none;
            position: absolute;
            inset: 0;
            border-radius: 22px;
            box-shadow: inset 0 0 0 1px rgba(180, 106, 106, 0.22);
            opacity: 0.85;
          }

          .ds-img {
            height: 240px;
            object-fit: cover;
            transition: transform 260ms ease;
          }

          .ds-card:hover .ds-img {
            transform: scale(1.04);
          }

          .ds-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(43, 33, 28, 0.28), transparent 55%);
            pointer-events: none;
          }

          .ds-noimg {
            height: 240px;
            background: #efe3d8;
            color: rgba(0, 0, 0, 0.6);
          }

          .ds-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.86);
            border: 1px solid var(--borda);
            color: var(--rosa2);
            font-weight: 900;
            backdrop-filter: blur(10px);
          }

          .ds-body {
            padding: 14px 14px 16px;
          }

          .ds-name {
            color: var(--marrom);
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
            min-height: 40px;
          }

          .ds-price {
            color: var(--marrom);
            font-size: 1.1rem;
            letter-spacing: -0.2px;
          }

          .ds-btn-outline {
            border: 1px solid rgba(180, 106, 106, 0.3);
            border-radius: 14px;
            font-weight: 900;
            background: rgba(255, 255, 255, 0.92);
            color: var(--marrom);
          }

          .ds-btn-outline:hover {
            filter: brightness(0.99);
          }

          .ds-add {
            background: linear-gradient(135deg, var(--rosa), var(--rosa2));
            color: #fff;
            border: none;
            font-weight: 900;
            border-radius: 14px;
            box-shadow: 0 14px 26px rgba(180, 106, 106, 0.22);
          }

          .ds-add:hover {
            color: #fff;
            filter: brightness(0.98);
          }

          .ds-add:disabled {
            opacity: 0.75;
            cursor: not-allowed;
          }

          .ds-hint {
            color: rgba(43, 33, 28, 0.65);
            font-weight: 800;
          }

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