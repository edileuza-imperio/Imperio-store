"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/Api/conectar";
import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: string | number;
  slug: string;

  sku?: string;
  modelo?: string;

  estoque: number;
  ilimitado: number;
  imagem?: string;
  imagensSecundarias?: string[];

  statusid?: number;
  status_nome?: string;

  categoria_id?: number;
  categoria_nome?: string;

  catalogo?: number;

  destaque?: number | null;

  criado?: string;
  atualizado?: string;
  created_at?: string;
  parcelas?: number;
}

type ApiResponse<T> = {
  status?: number;
  message?: string;
  mensagem?: string;
  dados?: T;
  data?: T;
};

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
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatDateBR(iso?: string) {
  if (!iso) return null;
  const clean = iso.replace(" ", "T");
  const d = new Date(clean);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR");
}

export default function ProdutoPainelPage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params?.slug;

  const slug =
    typeof slugParam === "string"
      ? slugParam
      : Array.isArray(slugParam)
      ? slugParam[0] ?? ""
      : "";

  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [fav, setFav] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let alive = true;

    async function carregar() {
      setLoading(true);
      setErro(null);

      try {
        const res = await api.get<ApiResponse<Produto>>(
          `/produto/slug/${encodeURIComponent(slug)}`
        );

        const p = resolveApi<Produto>(res.data);

        if (!alive) return;

        if (!p) {
          setProduto(null);
          setErro("Produto não encontrado.");
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
          criado: (p as any).criado ?? (p as any).created_at ?? p.created_at,
          atualizado: (p as any).atualizado ?? undefined,
        };

        setProduto(produtoFinal);
        setActiveIdx(0);
      } catch (e: any) {
        if (!alive) return;
        setErro(
          e?.response?.data?.mensagem ||
            e?.response?.data?.message ||
            e?.message ||
            "Erro ao buscar produto."
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

  useEffect(() => {
    if (!produto) return;

    try {
      const raw = localStorage.getItem("ui:favs");
      const ids: number[] = raw ? JSON.parse(raw) : [];
      setFav(ids.includes(produto.id_produto));
    } catch {
      setFav(false);
    }
  }, [produto?.id_produto]);

  const imagens = useMemo(() => {
    if (!produto) return [];
    const list: string[] = [];
    if (produto.imagem) list.push(produto.imagem);
    for (const s of produto.imagensSecundarias || []) list.push(s);
    return Array.from(new Set(list));
  }, [produto]);

  const activeImg = imagens[activeIdx] || imagens[0] || undefined;

  const precoUnit = useMemo(() => Number(produto?.preco || 0), [produto?.preco]);
  const precoPromo = useMemo(
    () => toNumber(produto?.preco_promocional) ?? 0,
    [produto?.preco_promocional]
  );
  const temPromo = precoPromo > 0 && precoPromo < precoUnit;
  const precoFinal = temPromo ? precoPromo : precoUnit;

  const estoqueTexto = useMemo(() => {
    if (!produto) return "—";

    if ((produto.ilimitado ?? 0) === 1) {
      return "Disponível (ilimitado)";
    }

    if ((produto.estoque ?? 0) > 0) {
      return `Em estoque (${produto.estoque} un.)`;
    }

    return "Esgotado";
  }, [produto]);

  const crumbs = useMemo(() => {
    const categoria = produto?.categoria_nome?.trim();
    return [
      { label: "Painel", href: "/painel" },
      { label: "Produtos", href: "/painel/produtos" },
      ...(categoria ? [{ label: categoria, href: "/painel/produtos" }] : []),
      {
        label: produto?.nome || "Produto",
        href: slug ? `/painel/produtos/${encodeURIComponent(slug)}` : "/painel/produtos",
      },
    ];
  }, [produto, slug]);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  function toggleFav() {
    if (!produto) return;

    try {
      const raw = localStorage.getItem("ui:favs");
      const ids: number[] = raw ? JSON.parse(raw) : [];
      const has = ids.includes(produto.id_produto);
      const next = has
        ? ids.filter((x) => x !== produto.id_produto)
        : [...ids, produto.id_produto];

      localStorage.setItem("ui:favs", JSON.stringify(next));
      setFav(!has);
    } catch {
      setFav((v) => !v);
    }
  }

  async function removerProduto() {
    if (!produto) return;

    const confirmar = window.confirm(
      `Deseja realmente remover o produto "${produto.nome}"?`
    );

    if (!confirmar) return;

    try {
      setRemoving(true);

      await api.delete(`/admin/produto/${produto.id_produto}/remover`, {
        withCredentials: true,
      });

      router.push("/painel/produtos");
      router.refresh();
    } catch (e: any) {
      alert(
        e?.response?.data?.mensagem ||
          e?.response?.data?.message ||
          "Erro ao remover produto."
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="pdp">
        <div className="wrap">
          <nav className="crumbs" aria-label="breadcrumb">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={`${c.label}-${i}`} className="crumb">
                  {i > 0 ? <span className="sep">›</span> : null}
                  {isLast ? (
                    <span className="active">{c.label}</span>
                  ) : (
                    <Link className="link" href={c.href}>
                      {c.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          {loading ? (
            <div className="state">
              <div className="skTitle" />
              <div className="skGrid">
                <div className="skMedia" />
                <div className="skBuy" />
              </div>
            </div>
          ) : erro ? (
            <div className="state err">{erro}</div>
          ) : !produto ? (
            <div className="state err">Produto não encontrado.</div>
          ) : (
            <>
              <header className="head">
                <div className="headLeft">
                  <h1 className="h1">{produto.nome}</h1>

                  <div className="sub">
                    {produto.categoria_nome ? (
                      <span className="subItem">
                        <span className="dot" /> {produto.categoria_nome}
                      </span>
                    ) : null}

                    {produto.sku ? (
                      <span className="subItem">
                        <span className="dot" /> SKU: {produto.sku}
                      </span>
                    ) : null}

                    {produto.modelo ? (
                      <span className="subItem">
                        <span className="dot" /> Modelo: {produto.modelo}
                      </span>
                    ) : null}

                    <span className="subItem">
                      <span className="dot" /> ID: #{produto.id_produto}
                    </span>
                  </div>

                  <div className="badges">
                    {produto.destaque ? (
                      <span className="chip chipHot">Destaque</span>
                    ) : null}

                    {(produto.catalogo ?? 0) === 1 ? (
                      <span className="chip chipGold">No catálogo</span>
                    ) : (
                      <span className="chip">Fora do catálogo</span>
                    )}

                    {(produto.ilimitado ?? 0) === 1 ? (
                      <span className="chip chipOk">Disponível</span>
                    ) : produto.estoque > 0 ? (
                      <span className="chip chipOk">Em estoque</span>
                    ) : (
                      <span className="chip chipBad">Esgotado</span>
                    )}
                  </div>
                </div>

                <div className="headRight">
                  <button
                    type="button"
                    className="iconBtn"
                    onClick={copiarLink}
                    title="Copiar link"
                  >
                    <span className="ico">⧉</span>
                    <span className="txt">{copied ? "Copiado!" : "Copiar link"}</span>
                  </button>

                  <button
                    type="button"
                    className={`iconBtn ${fav ? "on" : ""}`}
                    onClick={toggleFav}
                    title="Favoritar"
                  >
                    <span className="ico">{fav ? "♥" : "♡"}</span>
                    <span className="txt">{fav ? "Favorito" : "Favoritar"}</span>
                  </button>

                  <Link href="/painel/produtos" className="iconBtn btnLink">
                    <span className="ico">←</span>
                    <span className="txt">Voltar</span>
                  </Link>
                </div>
              </header>

              <div className="grid">
                <section className="leftCol">
                  <div className="galleryCard">
                    <div className="media">
                      {activeImg ? (
                        <img className="hero" src={activeImg} alt={produto.nome} />
                      ) : (
                        <div className="noimg">Sem imagem</div>
                      )}
                    </div>

                    <div className="thumbs" role="list">
                      {imagens.slice(0, 12).map((src, idx) => (
                        <button
                          key={`${src}-${idx}`}
                          type="button"
                          className={`thumbBtn ${idx === activeIdx ? "on" : ""}`}
                          onClick={() => setActiveIdx(idx)}
                          aria-label="Selecionar imagem"
                          role="listitem"
                        >
                          <img
                            className="thumb"
                            src={src}
                            alt={`${produto.nome} ${idx + 1}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cardsRow">
                    <div className="infoCard">
                      <div className="cardTitle">Detalhes do produto</div>

                      <div className="kv">
                        <span className="k">ID</span>
                        <span className="v">#{produto.id_produto}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Categoria</span>
                        <span className="v">
                          {produto.categoria_nome?.trim()
                            ? produto.categoria_nome
                            : produto.categoria_id != null
                            ? `ID ${produto.categoria_id}`
                            : "—"}
                        </span>
                      </div>

                      <div className="kv">
                        <span className="k">Status</span>
                        <span className="v">
                          {produto.status_nome?.trim()
                            ? produto.status_nome
                            : produto.statusid != null
                            ? `ID ${produto.statusid}`
                            : "—"}
                        </span>
                      </div>

                      <div className="kv">
                        <span className="k">Slug</span>
                        <span className="v">{produto.slug || "—"}</span>
                      </div>

                      <div className="kv">
                        <span className="k">SKU</span>
                        <span className="v">{produto.sku || "—"}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Modelo</span>
                        <span className="v">{produto.modelo || "—"}</span>
                      </div>
                    </div>

                    <div className="infoCard">
                      <div className="cardTitle">Controle</div>

                      <div className="kv">
                        <span className="k">Estoque</span>
                        <span className="v">{estoqueTexto}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Criado</span>
                        <span className="v">{formatDateBR(produto.criado) ?? "—"}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Atualizado</span>
                        <span className="v">{formatDateBR(produto.atualizado) ?? "—"}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Catálogo</span>
                        <span className="v">{(produto.catalogo ?? 0) === 1 ? "Sim" : "Não"}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Destaque</span>
                        <span className="v">{produto.destaque ? "Sim" : "Não"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="descCard">
                    <div className="cardTitle">Descrição</div>
                    <p className="descText">
                      {produto.descricao?.trim()
                        ? produto.descricao
                        : "Este produto não possui descrição detalhada no momento."}
                    </p>
                  </div>
                </section>

                <aside className="buyCol">
                  <div className="buyBox">
                    <div className="boxTitle">Resumo administrativo</div>

                    <div className="priceArea">
                      <div className="priceRow">
                        <div className="price">{formatBRL(precoFinal)}</div>

                        {temPromo ? (
                          <div className="promo">
                            <span className="from">de {formatBRL(precoUnit)}</span>
                            <span className="save">
                              desconto de{" "}
                              {formatBRL(Math.max(0, precoUnit - precoPromo))}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="install">
                        Preço unitário do produto cadastrado
                      </div>
                    </div>

                    <div className="adminList">
                      <div className="adminRow">
                        <span>Preço normal</span>
                        <strong>{formatBRL(precoUnit)}</strong>
                      </div>

                      <div className="adminRow">
                        <span>Preço promocional</span>
                        <strong>
                          {precoPromo > 0 ? formatBRL(precoPromo) : "—"}
                        </strong>
                      </div>

                      <div className="adminRow">
                        <span>Estoque</span>
                        <strong>{produto.estoque ?? 0}</strong>
                      </div>

                      <div className="adminRow">
                        <span>Catálogo</span>
                        <strong>{(produto.catalogo ?? 0) === 1 ? "Sim" : "Não"}</strong>
                      </div>
                    </div>

                    <div className="cta">
                      <Link href="/painel/produtos" className="btn ghost btnAsLink">
                        Voltar para listagem
                      </Link>

                      <button
                        type="button"
                        className="btn ghost2"
                        onClick={copiarLink}
                      >
                        {copied ? "Link copiado!" : "Copiar link do produto"}
                      </button>

                      <button
                        type="button"
                        className="btn danger"
                        onClick={removerProduto}
                        disabled={removing}
                      >
                        {removing ? "Removendo..." : "Remover produto"}
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .pdp {
            background: radial-gradient(
                900px 420px at 15% 10%,
                rgba(180, 106, 106, 0.12),
                transparent 55%
              ),
              radial-gradient(
                900px 420px at 85% 0%,
                rgba(255, 255, 255, 0.85),
                transparent 55%
              ),
              #f7efe7;
            padding: 18px 0 46px;
            min-height: 70vh;
          }

          .wrap {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 16px;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
              Helvetica, Arial;
            color: #2b211c;
          }

          .crumbs {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 12px;
            font-weight: 800;
            color: rgba(43, 33, 28, 0.65);
            padding: 10px 0 12px;
          }

          .sep {
            margin: 0 6px;
            opacity: 0.7;
          }

          .link {
            color: #a85c5c;
            text-decoration: none;
          }

          .link:hover {
            text-decoration: underline;
          }

          .active {
            color: #2b211c;
            font-weight: 950;
          }

          .head {
            margin-top: 6px;
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 980;
            letter-spacing: -0.2px;
            line-height: 1.2;
          }

          .sub {
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px 14px;
            color: rgba(43, 33, 28, 0.62);
            font-weight: 900;
            font-size: 12px;
          }

          .subItem {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .dot {
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: rgba(180, 106, 106, 0.55);
          }

          .badges {
            margin-top: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .chip {
            font-size: 12px;
            font-weight: 950;
            padding: 7px 10px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(43, 33, 28, 0.1);
            color: rgba(43, 33, 28, 0.78);
            backdrop-filter: blur(10px);
          }

          .chipHot {
            color: #a85c5c;
            background: rgba(180, 106, 106, 0.12);
            border-color: rgba(180, 106, 106, 0.22);
          }

          .chipOk {
            color: #0f5132;
            background: rgba(25, 135, 84, 0.12);
            border-color: rgba(25, 135, 84, 0.22);
          }

          .chipBad {
            color: #991b1b;
            background: rgba(185, 28, 28, 0.08);
            border-color: rgba(185, 28, 28, 0.22);
          }

          .chipGold {
            color: #9a6a15;
            background: rgba(214, 162, 74, 0.16);
            border-color: rgba(214, 162, 74, 0.28);
          }

          .headRight {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .iconBtn,
          .btnLink {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(43, 33, 28, 0.12);
            background: rgba(255, 255, 255, 0.78);
            backdrop-filter: blur(10px);
            border-radius: 14px;
            padding: 10px 12px;
            cursor: pointer;
            font-weight: 950;
            color: #2b211c;
            text-decoration: none;
            transition: transform 0.12s ease, box-shadow 0.12s ease,
              border-color 0.12s ease;
          }

          .iconBtn:hover,
          .btnLink:hover {
            transform: translateY(-1px);
            border-color: rgba(180, 106, 106, 0.3);
            box-shadow: 0 14px 26px rgba(0, 0, 0, 0.08);
          }

          .iconBtn.on {
            border-color: rgba(180, 106, 106, 0.55);
            box-shadow: 0 0 0 4px rgba(180, 106, 106, 0.12);
          }

          .ico {
            width: 22px;
            height: 22px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            background: rgba(180, 106, 106, 0.12);
            border: 1px solid rgba(180, 106, 106, 0.2);
            color: #a85c5c;
            font-weight: 980;
          }

          .txt {
            font-size: 13px;
            font-weight: 950;
          }

          @media (max-width: 720px) {
            .head {
              flex-direction: column;
            }

            .headRight {
              width: 100%;
              justify-content: flex-start;
            }

            .iconBtn,
            .btnLink {
              padding: 10px;
              border-radius: 16px;
            }

            .txt {
              display: none;
            }

            .ico {
              width: 26px;
              height: 26px;
              border-radius: 12px;
            }
          }

          .state {
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid rgba(43, 33, 28, 0.1);
            border-radius: 16px;
            padding: 16px;
            font-weight: 900;
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(10px);
          }

          .err {
            border-color: rgba(185, 28, 28, 0.22);
            background: rgba(185, 28, 28, 0.05);
            color: #991b1b;
          }

          .skTitle {
            width: 260px;
            height: 18px;
            border-radius: 12px;
            background: linear-gradient(
              90deg,
              rgba(180, 106, 106, 0.1),
              rgba(180, 106, 106, 0.18),
              rgba(180, 106, 106, 0.1)
            );
            background-size: 200% 100%;
            animation: sk 1.1s infinite linear;
          }

          .skGrid {
            margin-top: 14px;
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 14px;
          }

          .skMedia,
          .skBuy {
            height: 520px;
            border-radius: 18px;
            background: linear-gradient(
              90deg,
              rgba(180, 106, 106, 0.1),
              rgba(180, 106, 106, 0.18),
              rgba(180, 106, 106, 0.1)
            );
            background-size: 200% 100%;
            animation: sk 1.1s infinite linear;
          }

          @keyframes sk {
            0% {
              background-position: 0% 0%;
            }
            100% {
              background-position: -200% 0%;
            }
          }

          @media (max-width: 1024px) {
            .skGrid {
              grid-template-columns: 1fr;
            }

            .skBuy {
              height: 360px;
            }
          }

          .grid {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 14px;
            align-items: start;
          }

          @media (max-width: 1024px) {
            .grid {
              grid-template-columns: 1fr;
            }
          }

          .leftCol {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .galleryCard {
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid rgba(43, 33, 28, 0.1);
            border-radius: 18px;
            padding: 12px;
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(10px);
          }

          .media {
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(43, 33, 28, 0.1);
            background: #fff;
          }

          .hero {
            width: 100%;
            height: 520px;
            object-fit: contain;
            background: #fff;
            display: block;
          }

          .noimg {
            height: 520px;
            display: grid;
            place-items: center;
            font-weight: 950;
            color: rgba(43, 33, 28, 0.6);
          }

          @media (max-width: 680px) {
            .hero,
            .noimg {
              height: 380px;
            }
          }

          .thumbs {
            margin-top: 12px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .thumbBtn {
            width: 74px;
            height: 74px;
            border-radius: 14px;
            padding: 0;
            border: 1px solid rgba(43, 33, 28, 0.1);
            background: rgba(255, 255, 255, 0.85);
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.14s ease, box-shadow 0.14s ease,
              border-color 0.14s ease;
          }

          .thumbBtn:hover {
            transform: translateY(-1px);
            border-color: rgba(180, 106, 106, 0.35);
            box-shadow: 0 12px 18px rgba(0, 0, 0, 0.06);
          }

          .thumbBtn.on {
            border-color: rgba(180, 106, 106, 0.65);
            box-shadow: 0 0 0 4px rgba(180, 106, 106, 0.14);
          }

          .thumb {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          @media (max-width: 680px) {
            .thumbs {
              flex-wrap: nowrap;
              overflow-x: auto;
              padding-bottom: 6px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            .thumbs::-webkit-scrollbar {
              display: none;
            }

            .thumbBtn {
              flex: 0 0 auto;
              width: 66px;
              height: 66px;
              border-radius: 14px;
            }
          }

          .cardsRow {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          @media (max-width: 820px) {
            .cardsRow {
              grid-template-columns: 1fr;
            }
          }

          .infoCard,
          .descCard {
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid rgba(43, 33, 28, 0.1);
            border-radius: 18px;
            padding: 14px;
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(10px);
          }

          .cardTitle {
            font-weight: 980;
            margin-bottom: 10px;
            letter-spacing: -0.15px;
          }

          .kv {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 10px 0;
            border-top: 1px solid rgba(43, 33, 28, 0.08);
          }

          .kv:first-of-type {
            border-top: none;
            padding-top: 0;
          }

          .k {
            color: rgba(43, 33, 28, 0.65);
            font-weight: 900;
            font-size: 12px;
          }

          .v {
            color: #2b211c;
            font-weight: 950;
            font-size: 12px;
            text-align: right;
          }

          .descText {
            margin: 0;
            color: rgba(43, 33, 28, 0.78);
            font-weight: 650;
            line-height: 1.7;
            font-size: 13px;
          }

          .buyCol {
            position: relative;
          }

          .buyBox {
            background: rgba(255, 255, 255, 0.86);
            border: 1px solid rgba(43, 33, 28, 0.1);
            border-radius: 18px;
            padding: 14px;
            position: sticky;
            top: 12px;
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(10px);
          }

          @media (max-width: 1024px) {
            .buyBox {
              position: relative;
              top: 0;
            }
          }

          .boxTitle {
            font-size: 14px;
            font-weight: 980;
            margin-bottom: 12px;
          }

          .priceArea {
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(43, 33, 28, 0.08);
          }

          .priceRow {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
          }

          .price {
            font-size: 28px;
            font-weight: 980;
            color: #2b211c;
            letter-spacing: -0.35px;
            white-space: nowrap;
          }

          .promo {
            text-align: right;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .from {
            font-size: 12px;
            font-weight: 900;
            color: rgba(43, 33, 28, 0.6);
            text-decoration: line-through;
          }

          .save {
            font-size: 12px;
            font-weight: 950;
            color: #a85c5c;
          }

          .install {
            margin-top: 6px;
            font-size: 12px;
            font-weight: 850;
            color: rgba(43, 33, 28, 0.65);
          }

          .adminList {
            margin-top: 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .adminRow {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.74);
            border: 1px solid rgba(43, 33, 28, 0.08);
            font-size: 13px;
          }

          .adminRow span {
            color: rgba(43, 33, 28, 0.66);
            font-weight: 800;
          }

          .adminRow strong {
            color: #2b211c;
            font-weight: 950;
          }

          .cta {
            margin-top: 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .btn {
            width: 100%;
            border: none;
            border-radius: 14px;
            padding: 12px 12px;
            font-weight: 980;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            transition: transform 0.12s ease, opacity 0.12s ease, filter 0.12s ease;
          }

          .btn:active {
            transform: translateY(1px);
          }

          .btn:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          .ghost {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(43, 33, 28, 0.12);
            color: #2b211c;
          }

          .ghost2 {
            background: rgba(180, 106, 106, 0.1);
            border: 1px solid rgba(180, 106, 106, 0.22);
            color: #a85c5c;
          }

          .danger {
            background: rgba(185, 28, 28, 0.08);
            border: 1px solid rgba(185, 28, 28, 0.2);
            color: #991b1b;
          }

          .btnAsLink {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          @media (max-width: 680px) {
            .priceRow {
              flex-direction: column;
              align-items: flex-start;
            }

            .promo {
              text-align: left;
            }
          }
        `}</style>
      </main>

      <FooterPrincipal />
    </>
  );
}