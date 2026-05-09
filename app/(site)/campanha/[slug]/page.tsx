"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/Api/conectar";

import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

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
  id_produto: number;
  nome: string;
  slug: string;
  descricao?: string;
  preco: number | string;
  imagem?: string;
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

export default function CampanhaSlugPage() {
  const params = useParams();

  const slug =
    typeof (params as any)?.slug === "string"
      ? ((params as any).slug as string)
      : ((params as any)?.slug?.[0] as string | undefined);

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      setLoading(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const bannerImg = useMemo(
    () => getImagemUrl(campanha?.banner),
    [campanha?.banner]
  );

  const qtd = produtos.length;
  const inicio = formatDateBR(campanha?.inicio ?? null);
  const fim = formatDateBR(campanha?.fim ?? null);

  return (
    <>
      <Navbar />

      <main className="ui-bg">
        {/* TOP */}
        <section className="pt-4 pb-3">
          <div className="container">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              {/* breadcrumb + voltar */}
              <div>
                <nav aria-label="breadcrumb" className="mb-2">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link className="text-decoration-none" href="/">
                        Home
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Campanha
                    </li>
                  </ol>
                </nav>

                <Link
                  href="/"
                  className="btn btn-light border rounded-pill px-3"
                  style={{ borderColor: "rgba(0,0,0,.08)" }}
                  title="Voltar"
                >
                  <i className="bi bi-arrow-left me-2" />
                  Voltar
                </Link>
              </div>

              {/* chips */}
              <div className="d-flex gap-2 flex-wrap justify-content-md-end">
                <span className="badge ui-pill">
                  <i className="bi bi-bag me-2" />
                  {loading ? "..." : `${qtd} itens`}
                </span>

                {inicio && (
                  <span className="badge ui-pill">
                    <i className="bi bi-calendar-event me-2" />
                    Início: {inicio}
                  </span>
                )}

                {fim && (
                  <span className="badge ui-pill">
                    <i className="bi bi-calendar-check me-2" />
                    Até: {fim}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* HERO */}
        <section className="pb-4 pb-md-5">
          <div className="container">
            <div className="ui-hero shadow-sm rounded-4 overflow-hidden">
              {bannerImg ? (
                <div className="position-relative">
                  <img
                    src={bannerImg}
                    alt={campanha?.titulo ?? "Campanha"}
                    className="w-100 ui-hero-img"
                  />

                  {/* overlays premium */}
                  <div className="ui-hero-overlay" />
                  <div className="ui-hero-noise" />

                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end">
                    <div className="p-4 p-md-5 w-100">
                      <div className="ui-glass rounded-4 p-4 p-md-5">
                        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                          <span className="badge ui-badge">
                            <i className="bi bi-stars me-2" />
                            Campanha Especial
                          </span>

                          <a
                            href="#produtos"
                            className="btn ui-btn-primary rounded-pill px-3"
                            title="Ver produtos"
                          >
                            <i className="bi bi-arrow-down me-2" />
                            Ver produtos
                          </a>
                        </div>

                        <h1 className="fw-bold mt-3 mb-2 ui-title">
                          {loading ? "Carregando..." : campanha?.titulo ?? "Campanha"}
                        </h1>

                        <p className="mb-0 ui-subtitle">
                          {campanha?.descricao
                            ? campanha.descricao
                            : "Produtos selecionados com curadoria — aproveite a coleção."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // fallback hero sem imagem (bem bonito)
                <div className="p-4 p-md-5 ui-hero-fallback">
                  <div className="ui-hero-fallback-noise" />
                  <div className="position-relative">
                    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                      <span className="badge ui-badge-dark">
                        <i className="bi bi-stars me-2" />
                        Campanha Especial
                      </span>

                      <a
                        href="#produtos"
                        className="btn ui-btn-primary rounded-pill px-3"
                        title="Ver produtos"
                      >
                        <i className="bi bi-arrow-down me-2" />
                        Ver produtos
                      </a>
                    </div>

                    <h1 className="fw-bold mt-3 mb-2 ui-title-dark">
                      {loading ? "Carregando..." : campanha?.titulo ?? "Campanha"}
                    </h1>

                    <p className="mb-0 text-muted" style={{ maxWidth: 820 }}>
                      {campanha?.descricao
                        ? campanha.descricao
                        : "Coleção com tons creme e rosa queimado — visual premium mesmo sem banner."}
                    </p>

                    <div className="mt-4 d-flex gap-2 flex-wrap">
                      <span className="badge ui-pill">
                        <i className="bi bi-shield-check me-2" />
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
          </div>
        </section>

        {/* LISTA */}
        <section id="produtos" className="pb-5">
          <div className="container">
            {loading ? (
              <div className="py-5 text-center">
                <div className="spinner-border" style={{ color: "#c57a7a" }} />
              </div>
            ) : !campanha ? (
              <div className="py-5 text-center">
                <h3 className="fw-bold ui-title-dark">Campanha não encontrada</h3>
                <p className="text-muted mb-3">
                  Verifique o link e se a campanha está ativa (datas/status).
                </p>
                <Link href="/" className="btn btn-light border rounded-pill px-4">
                  Voltar
                </Link>
              </div>
            ) : qtd === 0 ? (
              <div className="py-5 text-center">
                <h5 className="fw-semibold ui-title-dark">Nenhum produto nesta campanha</h5>
                <p className="text-muted mb-0">
                  Assim que você vincular produtos, eles aparecem aqui.
                </p>
              </div>
            ) : (
              <>
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <h3 className="fw-bold mb-0 ui-title-dark">Produtos da campanha</h3>

                  <div className="d-flex gap-2">
                    <span className="badge ui-pill">
                      <i className="bi bi-grid-3x3-gap me-2" />
                      {qtd} itens
                    </span>
                    <span className="badge ui-pill">
                      <i className="bi bi-heart me-2" />
                      Favoritos
                    </span>
                  </div>
                </div>

                <div className="row g-4">
                  {produtos.map((p) => {
                    const img = getImagemUrl(p.imagem);

                    return (
                      <div key={p.id_produto} className="col-12 col-sm-6 col-lg-4 col-xl-3">
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
                              <i className="bi bi-stars me-1" />
                              Campanha
                            </span>

                            <span className="badge ui-badge-corner-right" title="Destaque">
                              <i className="bi bi-award" />
                            </span>
                          </div>

                          <div className="card-body d-flex flex-column">
                            <h6 className="fw-semibold mb-1">{p.nome}</h6>

                            <p className="small text-muted mb-2 ui-clamp-2">
                              {p.descricao ? p.descricao : "Produto selecionado para esta campanha."}
                            </p>

                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <div className="fw-bold fs-5 ui-price">{formatMoney(p.preco)}</div>
                              <span className="badge ui-pill-sm">
                                <i className="bi bi-patch-check me-1" />
                                Original
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
              </>
            )}
          </div>
        </section>
      </main>

      <FooterPrincipal />

      {/* CSS LOCAL (bem leve, sem conflito com bootstrap) */}
      <style jsx>{`
        .ui-bg {
          background: #fbf3ee;
          min-height: 60vh;
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
          position: relative;
          background: linear-gradient(135deg, #fbf3ee 0%, #f3ded0 45%, #c57a7a 140%);
        }
        .ui-hero-fallback-noise {
          position: absolute;
          inset: 0;
          opacity: 0.10;
          background-image: radial-gradient(rgba(0, 0, 0, 0.25) 1px, transparent 1px);
          background-size: 9px 9px;
          pointer-events: none;
        }

        .ui-glass {
          color: #fff;
          background: rgba(255, 255, 255, 0.10);
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
          border: 1px solid rgba(0, 0, 0, 0.10);
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

        .ui-price {
          color: #c57a7a;
        }

        .ui-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 38px;
        }
      `}</style>
    </>
  );
}