"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
  status_nome?: string;
  status_codigo?: string;
};

type Produto = {
  id_produto: number;
  nome: string;
  slug: string;
  descricao?: string;
  preco: string | number;
  imagem?: string;

  // extras que vêm do join
  ordem?: number;
  produto_id?: number;
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

/** banner só vira <img> se parecer caminho de arquivo */
function bannerEhImagem(banner?: string) {
  if (!banner) return false;
  const b = banner.toLowerCase().trim();
  if (b.startsWith("upload/") || b.startsWith("/upload/")) return true;
  return /\.(png|jpe?g|webp|gif|svg)$/.test(b);
}

export default function CampanhaPage() {
  const params = useParams();

  const slug =
    typeof params.slug === "string"
      ? params.slug
      : (params.slug?.[0] as string | undefined);

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const trackRef = useRef<HTMLDivElement | null>(null);

  async function carregar() {
    try {
      setLoading(true);

      // ✅ rota correta (não admin)
      const res = await api.get(`/campanha/ativa/${slug}`);
      const dados = res.data?.dados ?? {};

      setCampanha(dados.campanha ?? null);
      setProdutos(Array.isArray(dados.produtos) ? dados.produtos : []);
    } catch (err) {
      console.error("Erro ao carregar campanha:", err);
      setCampanha(null);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) carregar();
  }, [slug]);

  const total = produtos.length;

  const tituloTopo = useMemo(() => {
    if (!campanha) return "Campanha";
    return campanha.titulo || "Campanha";
  }, [campanha]);

  function scrollCarousel(dir: "prev" | "next") {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-card='1']");
    const cardW = card?.offsetWidth ?? 320;
    const gap = 16;
    const amount = cardW + gap; // 1 card por clique
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" />
      </div>
    );
  }

  if (!campanha) {
    return (
      <div className="container py-5 text-center">
        <h3 className="fw-bold">Campanha não encontrada</h3>
        <p className="text-muted mb-4">Verifique o link ou tente novamente.</p>
        <Link href="/" className="btn btn-dark">
          Voltar para Home
        </Link>
      </div>
    );
  }

  const temBannerImagem = bannerEhImagem(campanha.banner);
  const bannerImg = temBannerImagem ? getImagemUrl(campanha.banner) : "";

  return (
    <section className="cp-section py-5">
      <div className="container">
        {/* TOP BAR */}
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h2 className="m-0 fw-bold cp-title">{tituloTopo}</h2>
            <small className="text-muted fw-semibold">
              Coleção especial em tons creme & rosé
            </small>
          </div>

          <span className="badge rounded-pill cp-count">
            <i className="bi bi-bag me-2" />
            {total} item(ns)
          </span>
        </div>

        <div className="row g-4 align-items-stretch">
          {/* BANNER ESQUERDA */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm h-100 cp-banner">
              {temBannerImagem ? (
                <div className="cp-banner-imgwrap">
                  <img src={bannerImg} alt={campanha.titulo} className="cp-banner-img" />
                </div>
              ) : (
                <div className="cp-banner-fallback" />
              )}

              <div className="card-body p-4 position-relative">
                <div className="d-flex gap-2 flex-wrap mb-3">
                  <span className="badge rounded-pill cp-chip">
                    <i className="bi bi-stars me-2" />
                    Campanha
                  </span>

                  <span className="badge rounded-pill cp-chip">
                    <i className="bi bi-shield-check me-2" />
                    Selecionados
                  </span>
                </div>

                <h5 className="fw-bold mb-2">{campanha.titulo}</h5>

                <p className="text-muted mb-4" style={{ lineHeight: 1.35 }}>
                  {campanha.descricao
                    ? campanha.descricao
                    : "Produtos escolhidos para presentear — delicados e elegantes."}
                </p>

                {/* botão flutuante */}
                <Link href={`/campanha/${campanha.slug}`} className="btn cp-cta">
                  <i className="bi bi-grid me-2" />
                  Ver catálogo
                  <i className="bi bi-arrow-right ms-2" />
                </Link>

                <div className="d-flex gap-2 mt-4">
                  <div className="cp-mini p-3 flex-fill">
                    <div className="cp-mini-top">Atualização</div>
                    <div className="cp-mini-strong">Produtos vinculados</div>
                  </div>

                  <div className="cp-mini p-3 flex-fill">
                    <div className="cp-mini-top">Pagamento</div>
                    <div className="cp-mini-strong">Pix / Cartão</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRODUTOS DIREITA */}
          <div className="col-12 col-lg-8">
            {produtos.length === 0 ? (
              <div className="text-center py-5">
                <h5 className="fw-bold">Nenhum produto nesta campanha</h5>
                <p className="text-muted">Quando você vincular produtos, eles aparecem aqui.</p>
              </div>
            ) : (
              <div className="position-relative">
                {/* setas */}
                <button
                  type="button"
                  className="btn cp-arrow cp-arrow-left d-none d-lg-inline-flex"
                  onClick={() => scrollCarousel("prev")}
                  aria-label="Anterior"
                >
                  <i className="bi bi-chevron-left" />
                </button>

                <button
                  type="button"
                  className="btn cp-arrow cp-arrow-right d-none d-lg-inline-flex"
                  onClick={() => scrollCarousel("next")}
                  aria-label="Próximo"
                >
                  <i className="bi bi-chevron-right" />
                </button>

                <div ref={trackRef} className="cp-track">
                  {produtos
                    .slice()
                    .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
                    .map((p, idx) => {
                      const img = getImagemUrl(p.imagem);

                      return (
                        <div key={p.id_produto} className="cp-slide">
                          <div className="card border-0 shadow-sm h-100 cp-card" data-card={idx === 0 ? "1" : "0"}>
                            <div className="position-relative">
                              {img ? (
                                <img src={img} alt={p.nome} className="card-img-top cp-img" />
                              ) : (
                                <div className="cp-noimg d-flex align-items-center justify-content-center">
                                  <div className="text-center">
                                    <i className="bi bi-image fs-2 d-block mb-1" />
                                    <small className="fw-semibold">Sem imagem</small>
                                  </div>
                                </div>
                              )}

                              <span className="badge rounded-pill cp-badge">
                                <i className="bi bi-tag-fill me-1" />
                                Campanha
                              </span>
                            </div>

                            <div className="card-body d-flex flex-column">
                              <div className="fw-bold cp-name">{p.nome}</div>

                              <small className="text-muted cp-desc">
                                {p.descricao ? p.descricao : "Veja detalhes para mais informações."}
                              </small>

                              <div className="mt-2 fw-bold cp-price">{formatMoney(p.preco)}</div>

                              <div className="mt-auto d-flex gap-2 pt-3">
                                <Link href={`/produto/${p.slug}`} className="btn btn-outline-dark w-100">
                                  <i className="bi bi-eye" />
                                  <span className="ms-2 d-none d-sm-inline">Detalhes</span>
                                </Link>

                                <button
                                  type="button"
                                  className="btn w-100 cp-add"
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
            )}
          </div>
        </div>

        {/* CSS isolado */}
        <style jsx>{`
          .cp-section {
            background: #f6efe6; /* creme */
          }

          .cp-title {
            color: #2b211c;
          }

          .cp-count {
            background: rgba(255, 255, 255, 0.75);
            color: #2b211c;
            border: 1px solid rgba(0, 0, 0, 0.06);
            padding: 10px 12px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
          }

          .cp-banner {
            background: #fff7f0;
            border-radius: 18px;
            overflow: hidden;
          }

          .cp-banner-imgwrap {
            height: 160px; /* menor e profissional */
            overflow: hidden;
          }

          .cp-banner-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .cp-banner-fallback {
            height: 160px;
            background: radial-gradient(
                1200px 240px at 20% 10%,
                rgba(198, 147, 115, 0.35),
                transparent 55%
              ),
              radial-gradient(
                900px 220px at 70% 40%,
                rgba(255, 255, 255, 0.7),
                transparent 60%
              ),
              linear-gradient(135deg, #fff3ea, #f5e7db);
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          }

          .cp-chip {
            background: #ffffff;
            color: #2b211c;
            border: 1px solid rgba(0, 0, 0, 0.06);
            padding: 8px 10px;
          }

          .cp-cta {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            background: #c69373; /* rosé queimado */
            color: #fff;
            border-radius: 14px;
            font-weight: 800;
            padding: 12px 14px;
            border: none;
            box-shadow: 0 14px 26px rgba(198, 147, 115, 0.28);
          }

          .cp-cta:hover {
            filter: brightness(0.98);
            color: #fff;
          }

          .cp-mini {
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(0, 0, 0, 0.06);
            border-radius: 14px;
          }

          .cp-mini-top {
            font-size: 11px;
            font-weight: 800;
            color: rgba(0, 0, 0, 0.55);
          }

          .cp-mini-strong {
            font-size: 12px;
            font-weight: 900;
            color: #2b211c;
          }

          /* CARROSSEL */
          .cp-track {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            padding: 4px 4px 10px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }

          .cp-track::-webkit-scrollbar {
            height: 10px;
          }
          .cp-track::-webkit-scrollbar-thumb {
            background: rgba(198, 147, 115, 0.35);
            border-radius: 999px;
          }
          .cp-track::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 999px;
          }

          /* 2 cards por vez no desktop */
          .cp-slide {
            scroll-snap-align: start;
            flex: 0 0 88%;
          }
          @media (min-width: 576px) {
            .cp-slide {
              flex-basis: 48%;
            }
          }
          @media (min-width: 1200px) {
            .cp-slide {
              flex-basis: 48%;
            }
          }

          .cp-arrow {
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
          .cp-arrow-left {
            left: -10px;
          }
          .cp-arrow-right {
            right: -10px;
          }

          /* CARD mais premium */
          .cp-card {
            border-radius: 18px;
            overflow: hidden;
          }

          .cp-img {
            height: 210px;
            object-fit: cover;
          }

          .cp-noimg {
            height: 210px;
            background: #efe3d8;
            color: rgba(0, 0, 0, 0.6);
          }

          .cp-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(198, 147, 115, 0.16);
            border: 1px solid rgba(198, 147, 115, 0.25);
            color: #6b3f2a;
            font-weight: 900;
          }

          .cp-name {
            color: #2b211c;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .cp-desc {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 34px;
          }

          .cp-price {
            color: #2b211c;
          }

          .cp-add {
            background: #c69373;
            color: #fff;
            border: none;
            font-weight: 800;
          }
          .cp-add:hover {
            color: #fff;
            filter: brightness(0.98);
          }

          @media (max-width: 991px) {
            .cp-cta {
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