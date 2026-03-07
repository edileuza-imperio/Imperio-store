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
      <section className="ds-section ds-loading">
        <div className="container-fluid px-4 px-md-5">
          <div className="ds-skel skel-title" />
          <div className="row g-4 mt-3">
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
          .ds-loading {
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            padding: 3rem 0;
          }
          .ds-skel {
            border-radius: 20px;
            background: linear-gradient(
              90deg,
              rgba(200, 200, 200, 0.15),
              rgba(200, 200, 200, 0.25),
              rgba(200, 200, 200, 0.15)
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          .skel-title {
            width: 320px;
            height: 32px;
            margin-bottom: 1rem;
          }
          .skel-banner {
            height: 420px;
          }
          .skel-card {
            height: 420px;
            flex: 1;
          }
          @keyframes shimmer {
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
    <section className="ds-section">
      <div className="container-fluid px-4 px-md-5">
        {/* Header */}
        <div className="ds-header mb-5">
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="d-flex flex-column gap-3">
              <h2 className="m-0 fw-bold ds-title">{campanha.titulo}</h2>

              {statusLabel ? (
                <div className="d-flex gap-2">
                  <span className={`badge ds-badge-status ${statusClass}`}>
                    <i className="bi bi-patch-check me-2" />
                    {statusLabel}
                  </span>
                </div>
              ) : null}
            </div>

            <span className="badge ds-badge-count">
              <i className="bi bi-sparkles me-2" />
              {produtosOrdenados.length} produto{produtosOrdenados.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="row g-5 align-items-stretch">
          {/* Banner Section */}
          <div className="col-12 col-lg-4">
            <div className="card ds-banner-card h-100">
              <div className="ds-banner-top">
                {bannerIsImg ? (
                  <img src={bannerImg} alt={campanha.titulo} className="ds-banner-img" />
                ) : (
                  <div className="ds-banner-fallback">
                    <div className="ds-fallback-text">
                      {campanha.banner?.trim()
                        ? truncateText(campanha.banner, 42)
                        : campanha.titulo}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-body ds-banner-body">
                <h5 className="fw-bold mb-3 ds-banner-title">{campanha.titulo}</h5>

                <p className="text-muted mb-4 ds-banner-desc">
                  {campanha.descricao?.trim()
                    ? campanha.descricao
                    : "Seleção especial com preço e apresentação impecáveis."}
                </p>

                <Link href={`/campanha/${campanha.slug}`} className="btn ds-btn-primary w-100 mb-4">
                  Ver campanha <i className="bi bi-arrow-right ms-2" />
                </Link>

                <div className="row g-2">
                  <div className="col-6">
                    <div className="ds-info-box">
                      <div className="ds-info-label">Qualidade</div>
                      <div className="ds-info-value">Premium</div>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="ds-info-box">
                      <div className="ds-info-label">Entrega</div>
                      <div className="ds-info-value">Rápida</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Section */}
          <div className="col-12 col-lg-8">
            <div className="position-relative ds-carousel-container">
              <button
                onClick={() => scrollCarousel("prev")}
                className="ds-arrow ds-arrow-left"
                aria-label="Anterior"
              >
                <i className="bi bi-chevron-left" />
              </button>

              <div className="ds-track" ref={trackRef}>
                {produtosOrdenados.map((prod, idx) => (
                  <div key={prod.key} className="ds-slide" data-card={idx + 1}>
                    <div className="card ds-product-card h-100">
                      <div className="ds-product-image-wrapper">
                        {prod.imagem ? (
                          <img
                            src={getImagemUrl(prod.imagem)}
                            alt={prod.nome}
                            className="ds-product-img"
                          />
                        ) : (
                          <div className="ds-product-noimg">
                            <i className="bi bi-image" />
                          </div>
                        )}
                        <div className="ds-overlay" />
                        <span className="badge ds-product-badge">
                          {formatMoney(prod.preco)}
                        </span>
                      </div>

                      <div className="card-body ds-product-body">
                        <h6 className="fw-bold mb-2 ds-product-name">{prod.nome}</h6>

                        <p className="text-muted small mb-3 ds-product-desc">
                          {prod.descricao || "Produto de qualidade superior"}
                        </p>

                        <div className="d-grid gap-2">
                          <button
                            onClick={() => adicionarAoCarrinho(prod)}
                            disabled={addingSlug === prod.slug}
                            className="btn ds-btn-add"
                          >
                            {addingSlug === prod.slug ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                Adicionando...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-cart-plus me-2" />
                                Adicionar
                              </>
                            )}
                          </button>

                          <Link
                            href={`/produto/${prod.slug}`}
                            className="btn ds-btn-outline"
                          >
                            <i className="bi bi-eye me-2" />
                            Detalhes
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollCarousel("next")}
                className="ds-arrow ds-arrow-right"
                aria-label="Próximo"
              >
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}