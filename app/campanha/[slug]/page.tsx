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

  return (
    <>
      <Navbar />

      <main style={{ background: "#fbf3ee" }}>
        {/* ===== HERO/BANNER ===== */}
        <section className="py-4 py-md-5">
          <div className="container">
            <div
              className="rounded-4 overflow-hidden shadow-sm"
              style={{
                border: "1px solid rgba(0,0,0,0.06)",
                background:
                  "linear-gradient(135deg, #c57a7a 0%, #e7c9b7 55%, #fbf3ee 100%)",
              }}
            >
              {/* imagem opcional */}
              {bannerImg ? (
                <div className="position-relative">
                  <img
                    src={bannerImg}
                    alt={campanha?.titulo ?? "Campanha"}
                    className="w-100"
                    style={{
                      height: 320,
                      objectFit: "cover",
                      display: "block",
                      filter: "saturate(1.03)",
                    }}
                  />

                  {/* overlay pra ficar elegante */}
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.0) 100%)",
                    }}
                  />

                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end">
                    <div className="p-4 p-md-5 text-white" style={{ maxWidth: 820 }}>
                      <span
                        className="badge rounded-pill mb-3"
                        style={{
                          background: "rgba(255,255,255,0.18)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        Campanha
                      </span>

                      <h1 className="fw-bold mb-2" style={{ letterSpacing: "0.2px" }}>
                        {loading ? "Carregando..." : campanha?.titulo ?? "Campanha"}
                      </h1>

                      {campanha?.descricao ? (
                        <p className="mb-0" style={{ opacity: 0.9 }}>
                          {campanha.descricao}
                        </p>
                      ) : (
                        <p className="mb-0" style={{ opacity: 0.9 }}>
                          Confira os produtos selecionados desta campanha.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // fallback sem imagem (bonito e profissional)
                <div className="p-4 p-md-5">
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div>
                      <span
                        className="badge rounded-pill mb-3"
                        style={{
                          background: "rgba(255,255,255,0.35)",
                          border: "1px solid rgba(0,0,0,0.06)",
                          color: "#3b2a2a",
                        }}
                      >
                        Campanha
                      </span>

                      <h1 className="fw-bold mb-2" style={{ color: "#3b2a2a" }}>
                        {loading ? "Carregando..." : campanha?.titulo ?? "Campanha"}
                      </h1>

                      <p className="mb-0 text-muted" style={{ maxWidth: 720 }}>
                        {campanha?.descricao
                          ? campanha.descricao
                          : "Confira os produtos selecionados desta campanha."}
                      </p>
                    </div>

                    <div className="d-flex gap-2">
                      <Link href="/" className="btn btn-light border rounded-pill px-3">
                        <i className="bi bi-house-door" />
                      </Link>

                      <a
                        href="#produtos"
                        className="btn rounded-pill px-3 text-white"
                        style={{ background: "#c57a7a" }}
                      >
                        <i className="bi bi-bag me-2" />
                        Ver produtos
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== CONTEÚDO ===== */}
        <section id="produtos" className="pb-5">
          <div className="container">
            {loading ? (
              <div className="py-5 text-center">
                <div className="spinner-border" style={{ color: "#c57a7a" }} />
              </div>
            ) : !campanha ? (
              <div className="py-5 text-center">
                <h3 className="fw-bold" style={{ color: "#3b2a2a" }}>
                  Campanha não encontrada
                </h3>
                <p className="text-muted mb-3">
                  Verifique o link ou se a campanha está ativa (datas e status).
                </p>
                <Link href="/" className="btn btn-light border rounded-pill px-4">
                  Voltar
                </Link>
              </div>
            ) : produtos.length === 0 ? (
              <div className="py-5 text-center">
                <h5 className="fw-semibold" style={{ color: "#3b2a2a" }}>
                  Nenhum produto nesta campanha
                </h5>
                <p className="text-muted mb-0">
                  Assim que você vincular produtos, eles aparecem aqui.
                </p>
              </div>
            ) : (
              <>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h3 className="fw-bold mb-0" style={{ color: "#3b2a2a" }}>
                    Produtos da campanha
                  </h3>

                  <span
                    className="badge rounded-pill"
                    style={{
                      background: "rgba(197,122,122,0.12)",
                      color: "#8a4a4a",
                      border: "1px solid rgba(197,122,122,0.25)",
                    }}
                  >
                    {produtos.length} itens
                  </span>
                </div>

                <div className="row g-4">
                  {produtos.map((p) => {
                    const img = getImagemUrl(p.imagem);

                    return (
                      <div
                        key={p.id_produto}
                        className="col-12 col-sm-6 col-lg-4 col-xl-3"
                      >
                        <div
                          className="card border-0 shadow-sm h-100"
                          style={{
                            borderRadius: 16,
                            overflow: "hidden",
                            transition: "transform .18s ease, box-shadow .18s ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.transform =
                              "translateY(-4px)";
                            (e.currentTarget as HTMLDivElement).style.boxShadow =
                              "0 16px 30px rgba(0,0,0,0.12)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.transform =
                              "translateY(0)";
                            (e.currentTarget as HTMLDivElement).style.boxShadow =
                              "";
                          }}
                        >
                          <div className="position-relative">
                            {img ? (
                              <img
                                src={img}
                                alt={p.nome}
                                className="card-img-top"
                                style={{ height: 240, objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className="d-flex align-items-center justify-content-center"
                                style={{
                                  height: 240,
                                  background:
                                    "linear-gradient(135deg, #f7e6dc 0%, #fbf3ee 100%)",
                                  color: "rgba(0,0,0,0.5)",
                                  fontWeight: 600,
                                }}
                              >
                                Sem imagem
                              </div>
                            )}

                            <span
                              className="badge position-absolute top-0 start-0 m-2"
                              style={{
                                background: "#c57a7a",
                                border: "1px solid rgba(255,255,255,0.25)",
                              }}
                            >
                              <i className="bi bi-stars me-1" />
                              Campanha
                            </span>
                          </div>

                          <div className="card-body d-flex flex-column">
                            <h6 className="fw-semibold mb-1">{p.nome}</h6>

                            {p.descricao ? (
                              <p className="small text-muted mb-2">
                                {p.descricao}
                              </p>
                            ) : (
                              <p className="small text-muted mb-2">
                                Produto selecionado para esta campanha.
                              </p>
                            )}

                            <div
                              className="fw-bold fs-5 mb-3"
                              style={{ color: "#c57a7a" }}
                            >
                              {formatMoney(p.preco)}
                            </div>

                            <div className="mt-auto d-flex gap-2">
                              <Link
                                href={`/produto/${p.slug}`}
                                className="btn btn-light border w-100"
                                style={{ borderRadius: 12 }}
                                title="Ver detalhes"
                              >
                                <i className="bi bi-eye" />
                              </Link>

                              <button
                                type="button"
                                className="btn w-100 text-white"
                                style={{
                                  background: "#c57a7a",
                                  borderRadius: 12,
                                }}
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
    </>
  );
}