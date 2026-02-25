"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/Api/conectar";
import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string;
  preco: number;
  slug: string;
  estoque: number;
  ilimitado: number;
  imagem?: string;
  imagensSecundarias?: string[];
  status_nome?: string;
  categoria_nome?: string;
  destaque?: number;
  parcelas?: number;
  created_at?: string;
}

type ApiResponse<T> = {
  status?: number;
  message?: string;
  mensagem?: string;
  dados?: T;
  data?: T;
};

type Crumb = { label: string; href: string };

function resolveApi<T>(payload: any): T | null {
  if (!payload) return null;
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  return payload as T;
}

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;
  const base = api.defaults.baseURL ?? "";
  return caminho.startsWith("http")
    ? caminho
    : `${base.replace(/\/$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProdutoPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = typeof slugParam === "string" ? slugParam : Array.isArray(slugParam) ? slugParam[0] : "";

  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let alive = true;

    async function carregar() {
      setLoading(true);
      setErro(null);

      try {
        const res = await api.get<ApiResponse<Produto>>(`/produto/slug/${encodeURIComponent(slug)}`);
        const p = resolveApi<Produto>(res.data);

        if (!alive) return;

        if (!p) {
          setProduto(null);
          setErro("Produto não encontrado");
          return;
        }

        const produtoFinal: Produto = {
          ...p,
          preco: Number(p.preco || 0),
          estoque: Number(p.estoque || 0),
          ilimitado: Number(p.ilimitado || 0),
          imagem: getImagemUrl(p.imagem),
          imagensSecundarias: (p.imagensSecundarias || [])
            .map(getImagemUrl)
            .filter((x): x is string => Boolean(x)),
          parcelas: p.parcelas ?? 10,
        };

        setProduto(produtoFinal);
      } catch (e: any) {
        if (!alive) return;
        setErro(
          e?.response?.data?.mensagem ||
            e?.response?.data?.message ||
            e?.message ||
            "Erro ao buscar produto"
        );
        setProduto(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    carregar();
    return () => {
      alive = false;
    };
  }, [slug]);

  const crumbs = useMemo<Crumb[]>(() => {
    const categoria = produto?.categoria_nome?.trim();

    const base: Crumb[] = [
      { label: "Início", href: "/" },
      { label: "Catálogo", href: "/catalogo" },
    ];

    if (categoria) base.push({ label: categoria, href: "/catalogo" });

    // ✅ href SEMPRE string
    base.push({
      label: produto?.nome || "Produto",
      href: slug ? `/produto/${encodeURIComponent(slug)}` : "/catalogo",
    });

    return base;
  }, [produto, slug]);

  return (
    <>
      <Navbar />

      <main className="pdPage">
        <div className="pdContainer">
          {/* Breadcrumb */}
          <nav className="pdBreadcrumb" aria-label="breadcrumb">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="pdCrumb">
                {i > 0 ? <span className="pdSep">/</span> : null}
                <a
                  href={c.href}
                  className={i === crumbs.length - 1 ? "pdCrumbActive" : "pdCrumbLink"}
                >
                  {c.label}
                </a>
              </span>
            ))}
          </nav>

          {loading ? (
            <div className="pdLoading">Carregando produto…</div>
          ) : erro ? (
            <div className="pdError">{erro}</div>
          ) : !produto ? (
            <div className="pdError">Produto não encontrado</div>
          ) : (
            <div className="pdGrid">
              {/* ESQUERDA: IMAGEM */}
              <section className="pdLeft">
                <div className="pdMediaCard">
                  {produto.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="pdImg" src={produto.imagem} alt={produto.nome} />
                  ) : (
                    <div className="pdImgFallback">Sem imagem</div>
                  )}
                </div>

                {!!produto.imagensSecundarias?.length && (
                  <div className="pdThumbs">
                    {produto.imagensSecundarias.slice(0, 6).map((src, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={idx} className="pdThumb" src={src} alt={`Imagem ${idx + 2}`} />
                    ))}
                  </div>
                )}
              </section>

              {/* DIREITA: CARD INFO */}
              <aside className="pdRight">
                <div className="pdInfoCard">
                  <div className="pdTitleRow">
                    <h1 className="pdTitle">{produto.nome}</h1>
                    {produto.destaque ? <span className="pdBadge">Destaque</span> : null}
                  </div>

                  <div className="pdMeta">
                    {produto.status_nome ? (
                      <span className="pdMetaItem">
                        Status: <b>{produto.status_nome}</b>
                      </span>
                    ) : null}
                    {produto.categoria_nome ? (
                      <span className="pdMetaItem">
                        Categoria: <b>{produto.categoria_nome}</b>
                      </span>
                    ) : null}
                  </div>

                  <div className="pdPriceRow">
                    <div className="pdPrice">{formatBRL(Number(produto.preco || 0))}</div>
                    <div className="pdSmall">{produto.parcelas ? `em até ${produto.parcelas}x` : ""}</div>
                  </div>

                  <div className="pdStockRow">
                    {(produto.ilimitado ?? 0) === 1 ? (
                      <span className="pdStockOk">Disponível</span>
                    ) : produto.estoque > 0 ? (
                      <span className="pdStockOk">Em estoque: {produto.estoque}</span>
                    ) : (
                      <span className="pdStockBad">Esgotado</span>
                    )}
                  </div>

                  <div className="pdActions">
                    <button
                      className="pdBtn pdBtnPrimary"
                      type="button"
                      disabled={(produto.ilimitado ?? 0) !== 1 && produto.estoque <= 0}
                    >
                      Adicionar ao carrinho
                    </button>

                    <button className="pdBtn pdBtnGhost" type="button">
                      Comprar agora
                    </button>
                  </div>

                  {produto.descricao ? (
                    <div className="pdDesc">
                      <div className="pdDescTitle">Descrição</div>
                      <p>{produto.descricao}</p>
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          )}
        </div>

        <style jsx>{`
          .pdPage {
            background: radial-gradient(1200px 520px at 18% 0%, #fffaf1 0%, #f6efe4 55%, #f1e7d9 100%);
            padding: 18px 0 40px;
            min-height: 65vh;
          }
          .pdContainer {
            max-width: 1140px;
            margin: 0 auto;
            padding: 0 16px;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
            color: #241b12;
          }
          .pdBreadcrumb {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            font-weight: 800;
            font-size: 12px;
            color: #6b5a49;
            margin: 8px 0 14px;
          }
          .pdSep {
            margin: 0 8px;
            opacity: 0.6;
          }
          .pdCrumbLink {
            color: #6b5a49;
            text-decoration: none;
          }
          .pdCrumbLink:hover {
            text-decoration: underline;
          }
          .pdCrumbActive {
            color: #b88962;
            text-decoration: none;
            font-weight: 950;
            cursor: default;
          }

          .pdLoading,
          .pdError {
            background: rgba(255, 255, 255, 0.72);
            border: 1px solid rgba(111, 92, 73, 0.16);
            border-radius: 18px;
            padding: 14px;
            font-weight: 850;
          }
          .pdError {
            color: #8a1f1f;
            background: rgba(185, 28, 28, 0.06);
            border-color: rgba(185, 28, 28, 0.18);
          }

          .pdGrid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 16px;
            align-items: start;
          }
          @media (max-width: 980px) {
            .pdGrid {
              grid-template-columns: 1fr;
            }
          }

          .pdMediaCard {
            border-radius: 22px;
            overflow: hidden;
            border: 1px solid rgba(111, 92, 73, 0.18);
            background: rgba(255, 255, 255, 0.75);
            box-shadow: 0 14px 40px rgba(0, 0, 0, 0.1);
          }
          .pdImg {
            width: 100%;
            height: 520px;
            object-fit: cover;
            display: block;
          }
          @media (max-width: 980px) {
            .pdImg {
              height: 380px;
            }
          }
          .pdImgFallback {
            height: 520px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 950;
            color: #7b6a5a;
          }

          .pdThumbs {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
            margin-top: 12px;
          }
          @media (max-width: 560px) {
            .pdThumbs {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          .pdThumb {
            width: 100%;
            height: 64px;
            object-fit: cover;
            border-radius: 14px;
            border: 1px solid rgba(111, 92, 73, 0.14);
            background: #fff;
          }

          .pdInfoCard {
            border-radius: 22px;
            border: 1px solid rgba(111, 92, 73, 0.18);
            background: rgba(255, 255, 255, 0.78);
            box-shadow: 0 14px 40px rgba(0, 0, 0, 0.1);
            padding: 16px;
            position: sticky;
            top: 14px;
          }
          @media (max-width: 980px) {
            .pdInfoCard {
              position: relative;
              top: 0;
            }
          }

          .pdTitleRow {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
          }
          .pdTitle {
            margin: 0;
            font-size: 22px;
            font-weight: 980;
            letter-spacing: -0.3px;
            color: #2f261e;
            line-height: 1.15;
          }
          .pdBadge {
            font-size: 12px;
            font-weight: 980;
            padding: 6px 10px;
            border-radius: 999px;
            color: #ffffff;
            background: rgba(30, 20, 12, 0.92);
            white-space: nowrap;
          }

          .pdMeta {
            margin-top: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px 14px;
            color: #6b5a49;
            font-size: 12px;
            font-weight: 800;
          }

          .pdPriceRow {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px solid rgba(111, 92, 73, 0.14);
          }
          .pdPrice {
            font-size: 26px;
            font-weight: 980;
            color: #2f261e;
            letter-spacing: -0.4px;
          }
          .pdSmall {
            margin-top: 4px;
            font-size: 12px;
            color: #6b5a49;
            font-weight: 800;
          }

          .pdStockRow {
            margin-top: 10px;
          }
          .pdStockOk {
            font-weight: 950;
            color: #047857;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.18);
            padding: 6px 10px;
            border-radius: 999px;
            display: inline-block;
          }
          .pdStockBad {
            font-weight: 950;
            color: #8a1f1f;
            background: rgba(185, 28, 28, 0.06);
            border: 1px solid rgba(185, 28, 28, 0.18);
            padding: 6px 10px;
            border-radius: 999px;
            display: inline-block;
          }

          .pdActions {
            display: flex;
            gap: 10px;
            margin-top: 14px;
          }
          .pdBtn {
            flex: 1;
            border: none;
            border-radius: 14px;
            padding: 12px 12px;
            font-weight: 980;
            cursor: pointer;
            transition: transform 0.12s ease, filter 0.12s ease, opacity 0.12s ease;
          }
          .pdBtn:active {
            transform: translateY(1px);
          }
          .pdBtn:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          .pdBtnPrimary {
            color: #fff;
            background: linear-gradient(135deg, #d1a67f 0%, #b88962 100%);
            box-shadow: 0 12px 26px rgba(184, 137, 98, 0.35);
          }
          .pdBtnPrimary:hover {
            filter: brightness(1.02);
          }
          .pdBtnGhost {
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(111, 92, 73, 0.18);
            color: #3f3327;
          }
          .pdBtnGhost:hover {
            filter: brightness(0.98);
          }

          .pdDesc {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px solid rgba(111, 92, 73, 0.14);
          }
          .pdDescTitle {
            font-weight: 980;
            margin-bottom: 8px;
            color: #2f261e;
          }
          .pdDesc p {
            margin: 0;
            color: #6b5a49;
            font-weight: 700;
            line-height: 1.45;
            font-size: 13px;
          }
        `}</style>
      </main>

      <FooterPrincipal />
    </>
  );
}