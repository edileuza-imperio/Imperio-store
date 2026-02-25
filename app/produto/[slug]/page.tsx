"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/Api/conectar";
import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";
import { rotas } from "@/components/Bibioteca/config/rotas";

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

type CupomApi = {
  codigo?: string;
  valor?: number | string;
  percentual?: number | string;
  ativo?: number;
  descricao?: string;
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
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

export default function ProdutoPage() {
  const params = useParams();
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

  // Galeria estilo “varejão”
  const [activeIdx, setActiveIdx] = useState(0);

  // Qtd + Carrinho
  const [qtd, setQtd] = useState(1);
  const [adding, setAdding] = useState(false);

  // Cupom (somente cupom, sem subtotal/resumo)
  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState<{
    codigo: string;
    tipo: "percentual" | "valor";
    valor: number;
    descricao?: string;
  } | null>(null);
  const [cupomErro, setCupomErro] = useState<string | null>(null);

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
        setActiveIdx(0);
        setQtd(1);
        setCupomAplicado(null);
        setCupomCodigo("");
        setCupomErro(null);
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

  const imagens = useMemo(() => {
    if (!produto) return [];
    const list: string[] = [];
    if (produto.imagem) list.push(produto.imagem);
    for (const s of produto.imagensSecundarias || []) list.push(s);
    // unique
    return Array.from(new Set(list));
  }, [produto]);

  const activeImg = imagens[activeIdx] || imagens[0] || undefined;

  const indisponivel = useMemo(() => {
    if (!produto) return true;
    if ((produto.ilimitado ?? 0) === 1) return false;
    return (produto.estoque ?? 0) <= 0;
  }, [produto]);

  const precoBase = Number(produto?.preco || 0);

  const precoComCupom = useMemo(() => {
    const base = precoBase * Math.max(1, qtd);

    if (!cupomAplicado) return base;

    if (cupomAplicado.tipo === "percentual") {
      const desc = (base * cupomAplicado.valor) / 100;
      return Math.max(0, base - desc);
    }
    return Math.max(0, base - cupomAplicado.valor);
  }, [precoBase, qtd, cupomAplicado]);

  const parcelasTexto = useMemo(() => {
    const parc = produto?.parcelas ?? 10;
    if (!parc || parc <= 1) return "";
    const v = precoComCupom / parc;
    return `em até ${parc}x de ${formatBRL(v)}`;
  }, [produto, precoComCupom]);

  const crumbs = useMemo(() => {
    const categoria = produto?.categoria_nome?.trim();
    return [
      { label: "Início", href: "/" },
      { label: "Catálogo", href: "/catalogo" },
      ...(categoria ? [{ label: categoria, href: "/catalogo" }] : []),
      { label: produto?.nome || "Produto", href: slug ? `/produto/${encodeURIComponent(slug)}` : "/catalogo" },
    ];
  }, [produto, slug]);

  async function aplicarCupom() {
    setCupomErro(null);
    const codigo = cupomCodigo.trim();
    if (!codigo) {
      setCupomErro("Digite um cupom.");
      return;
    }

    setCupomLoading(true);
    try {
      const res = await api.get<ApiResponse<CupomApi>>(rotas.cupons.buscarPorCodigo(codigo));
      const c = resolveApi<CupomApi>(res.data);

      if (!c) {
        setCupomAplicado(null);
        setCupomErro("Cupom inválido.");
        return;
      }

      const ativo = Number((c as any).ativo ?? 1);
      if (ativo === 0) {
        setCupomAplicado(null);
        setCupomErro("Cupom inativo.");
        return;
      }

      const perc = toNumber((c as any).percentual);
      const val = toNumber((c as any).valor);

      if (perc != null && perc > 0) {
        setCupomAplicado({
          codigo: (c.codigo || codigo).toUpperCase(),
          tipo: "percentual",
          valor: perc,
          descricao: c.descricao,
        });
        return;
      }

      if (val != null && val > 0) {
        setCupomAplicado({
          codigo: (c.codigo || codigo).toUpperCase(),
          tipo: "valor",
          valor: val,
          descricao: c.descricao,
        });
        return;
      }

      setCupomAplicado(null);
      setCupomErro("Cupom sem desconto configurado.");
    } catch (e: any) {
      setCupomAplicado(null);
      setCupomErro(
        e?.response?.data?.mensagem ||
          e?.response?.data?.message ||
          e?.message ||
          "Erro ao validar cupom"
      );
    } finally {
      setCupomLoading(false);
    }
  }

  function removerCupom() {
    setCupomAplicado(null);
    setCupomErro(null);
    setCupomCodigo("");
  }

  async function adicionarCarrinho() {
    if (!produto) return;
    if (indisponivel) return;

    setAdding(true);
    try {
      await api.post(
        rotas.carrinho.adicionar,
        { produto_id: produto.id_produto, qtd: Math.max(1, qtd) },
        { withCredentials: true }
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="pdp">
        <div className="wrap">
          {/* breadcrumb estilo varejo */}
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
            <div className="state">Carregando…</div>
          ) : erro ? (
            <div className="state err">{erro}</div>
          ) : !produto ? (
            <div className="state err">Produto não encontrado</div>
          ) : (
            <div className="grid">
              {/* COL 1: thumbnails */}
              <aside className="thumbCol">
                {imagens.slice(0, 10).map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    className={`thumbBtn ${idx === activeIdx ? "on" : ""}`}
                    onClick={() => setActiveIdx(idx)}
                    aria-label="Selecionar imagem"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="thumb" src={src} alt={`${produto.nome} ${idx + 1}`} />
                  </button>
                ))}
              </aside>

              {/* COL 2: imagem grande */}
              <section className="mediaCol">
                <div className="mediaBox">
                  {produto.destaque ? <span className="flag">Destaque</span> : null}

                  {activeImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="hero" src={activeImg} alt={produto.nome} />
                  ) : (
                    <div className="noimg">Sem imagem</div>
                  )}
                </div>

                {!!produto.descricao && (
                  <div className="descBox">
                    <div className="descTitle">Descrição</div>
                    <p className="descText">{produto.descricao}</p>
                  </div>
                )}
              </section>

              {/* COL 3: caixa compra (sticky) */}
              <aside className="buyCol">
                <div className="buyBox">
                  <h1 className="title">{produto.nome}</h1>

                  <div className="metaRow">
                    {produto.categoria_nome ? (
                      <span className="meta">
                        Categoria: <b>{produto.categoria_nome}</b>
                      </span>
                    ) : null}
                    {produto.status_nome ? (
                      <span className="meta">
                        Status: <b>{produto.status_nome}</b>
                      </span>
                    ) : null}
                  </div>

                  <div className="priceArea">
                    <div className="price">{formatBRL(precoComCupom)}</div>
                    {parcelasTexto ? <div className="install">{parcelasTexto}</div> : null}
                  </div>

                  <div className="stockLine">
                    {(produto.ilimitado ?? 0) === 1 ? (
                      <span className="pill ok">Disponível</span>
                    ) : produto.estoque > 0 ? (
                      <span className="pill ok">Em estoque</span>
                    ) : (
                      <span className="pill bad">Esgotado</span>
                    )}

                    {(produto.ilimitado ?? 0) !== 1 && produto.estoque > 0 ? (
                      <span className="stockSmall">({produto.estoque} un.)</span>
                    ) : null}
                  </div>

                  <div className="qtyRow">
                    <span className="qtyLbl">Quantidade</span>
                    <div className="qtyCtrl">
                      <button
                        type="button"
                        className="qbtn"
                        onClick={() => setQtd((v) => Math.max(1, v - 1))}
                        disabled={qtd <= 1}
                      >
                        −
                      </button>
                      <span className="qval">{qtd}</span>
                      <button type="button" className="qbtn" onClick={() => setQtd((v) => Math.min(99, v + 1))}>
                        +
                      </button>
                    </div>
                  </div>

                  {/* CUPOM (somente cupom, sem resumo/subtotal) */}
                  <div className="coupon">
                    <div className="couponHead">
                      <span className="couponTitle">Cupom</span>
                      {cupomAplicado ? (
                        <button type="button" className="couponRemove" onClick={removerCupom}>
                          Remover
                        </button>
                      ) : null}
                    </div>

                    {cupomAplicado ? (
                      <div className="couponApplied">
                        <span className="couponTag">
                          {cupomAplicado.codigo} •{" "}
                          {cupomAplicado.tipo === "percentual"
                            ? `${cupomAplicado.valor}%`
                            : formatBRL(cupomAplicado.valor)}
                        </span>
                        {cupomAplicado.descricao ? (
                          <div className="couponHint">{cupomAplicado.descricao}</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="couponRow">
                        <input
                          className="couponInput"
                          value={cupomCodigo}
                          onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                          placeholder="Digite seu cupom"
                        />
                        <button
                          type="button"
                          className="couponBtn"
                          onClick={aplicarCupom}
                          disabled={cupomLoading}
                        >
                          {cupomLoading ? "…" : "Aplicar"}
                        </button>
                      </div>
                    )}

                    {cupomErro ? <div className="couponErr">{cupomErro}</div> : null}
                  </div>

                  <div className="cta">
                    <button
                      type="button"
                      className="btn buy"
                      onClick={adicionarCarrinho}
                      disabled={indisponivel || adding}
                    >
                      {adding ? "Adicionando…" : "Adicionar ao carrinho"}
                    </button>

                    <button type="button" className="btn ghost" disabled={indisponivel}>
                      Comprar agora
                    </button>
                  </div>

                  <div className="backLine">
                    <Link className="back" href="/catalogo">
                      ← Voltar ao catálogo
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>

        <style jsx>{`
          /* vibe varejão (Americanas/Ponto) */
          .pdp {
            background: #f4f6f8;
            padding: 14px 0 36px;
            min-height: 65vh;
          }
          .wrap {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 16px;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
            color: #111827;
          }

          .crumbs {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 12px;
            font-weight: 800;
            color: #6b7280;
            padding: 10px 0 12px;
          }
          .sep {
            margin: 0 6px;
            opacity: 0.7;
          }
          .link {
            color: #2563eb;
            text-decoration: none;
          }
          .link:hover {
            text-decoration: underline;
          }
          .active {
            color: #111827;
            font-weight: 950;
          }

          .state {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 14px;
            font-weight: 900;
          }
          .err {
            border-color: rgba(185, 28, 28, 0.3);
            background: rgba(185, 28, 28, 0.04);
            color: #991b1b;
          }

          .grid {
            display: grid;
            grid-template-columns: 76px 1fr 380px;
            gap: 14px;
            align-items: start;
          }
          @media (max-width: 1024px) {
            .grid {
              grid-template-columns: 76px 1fr;
            }
            .buyCol {
              grid-column: span 2;
            }
          }
          @media (max-width: 680px) {
            .grid {
              grid-template-columns: 1fr;
            }
            .thumbCol {
              display: none;
            }
          }

          /* thumbs */
          .thumbCol {
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: sticky;
            top: 12px;
            max-height: calc(100vh - 30px);
            overflow: auto;
            padding-right: 2px;
          }
          .thumbBtn {
            border: 1px solid #e5e7eb;
            background: #fff;
            border-radius: 10px;
            padding: 0;
            overflow: hidden;
            cursor: pointer;
            transition: border-color 0.12s ease, transform 0.12s ease;
          }
          .thumbBtn:hover {
            transform: translateY(-1px);
            border-color: #93c5fd;
          }
          .thumbBtn.on {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
          }
          .thumb {
            width: 100%;
            height: 62px;
            object-fit: cover;
            display: block;
          }

          /* media */
          .mediaBox {
            position: relative;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            overflow: hidden;
            min-height: 520px;
          }
          .flag {
            position: absolute;
            top: 12px;
            left: 12px;
            background: #111827;
            color: #fff;
            font-weight: 950;
            font-size: 12px;
            padding: 6px 10px;
            border-radius: 999px;
            z-index: 2;
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
            color: #6b7280;
          }
          @media (max-width: 680px) {
            .mediaBox {
              min-height: 380px;
            }
            .hero,
            .noimg {
              height: 380px;
            }
          }

          .descBox {
            margin-top: 12px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 14px;
          }
          .descTitle {
            font-weight: 950;
            margin-bottom: 8px;
          }
          .descText {
            margin: 0;
            color: #374151;
            font-weight: 650;
            line-height: 1.5;
            font-size: 13px;
          }

          /* buy box */
          .buyBox {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 14px;
            position: sticky;
            top: 12px;
          }
          @media (max-width: 1024px) {
            .buyBox {
              position: relative;
              top: 0;
            }
          }

          .title {
            margin: 0;
            font-size: 18px;
            font-weight: 950;
            line-height: 1.25;
          }

          .metaRow {
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px 14px;
            color: #6b7280;
            font-size: 12px;
            font-weight: 800;
          }

          .priceArea {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #eef2f7;
          }
          .price {
            font-size: 26px;
            font-weight: 980;
            color: #111827;
            letter-spacing: -0.3px;
          }
          .install {
            margin-top: 4px;
            font-size: 12px;
            font-weight: 850;
            color: #6b7280;
          }

          .stockLine {
            margin-top: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .pill {
            font-size: 12px;
            font-weight: 950;
            padding: 6px 10px;
            border-radius: 999px;
            border: 1px solid transparent;
          }
          .ok {
            color: #065f46;
            background: rgba(16, 185, 129, 0.12);
            border-color: rgba(16, 185, 129, 0.22);
          }
          .bad {
            color: #991b1b;
            background: rgba(185, 28, 28, 0.08);
            border-color: rgba(185, 28, 28, 0.22);
          }
          .stockSmall {
            color: #6b7280;
            font-weight: 900;
            font-size: 12px;
          }

          .qtyRow {
            margin-top: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .qtyLbl {
            font-size: 12px;
            font-weight: 950;
            color: #374151;
          }
          .qtyCtrl {
            display: inline-flex;
            align-items: center;
            border: 1px solid #e5e7eb;
            border-radius: 999px;
            overflow: hidden;
          }
          .qbtn {
            width: 36px;
            height: 34px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-weight: 980;
            color: #111827;
          }
          .qbtn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .qval {
            width: 40px;
            text-align: center;
            font-weight: 980;
            color: #111827;
          }

          /* cupom */
          .coupon {
            margin-top: 12px;
            border-top: 1px solid #eef2f7;
            padding-top: 12px;
          }
          .couponHead {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }
          .couponTitle {
            font-weight: 950;
            font-size: 13px;
          }
          .couponRemove {
            border: none;
            background: transparent;
            color: #2563eb;
            cursor: pointer;
            font-weight: 950;
            text-decoration: underline;
          }
          .couponRow {
            margin-top: 10px;
            display: flex;
            gap: 10px;
          }
          .couponInput {
            flex: 1;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 10px 12px;
            font-weight: 900;
            outline: none;
          }
          .couponInput:focus {
            border-color: #93c5fd;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          }
          .couponBtn {
            border: none;
            border-radius: 12px;
            padding: 10px 12px;
            font-weight: 950;
            cursor: pointer;
            color: #fff;
            background: #2563eb;
          }
          .couponBtn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .couponApplied {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .couponTag {
            width: fit-content;
            font-size: 12px;
            font-weight: 950;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(37, 99, 235, 0.1);
            border: 1px solid rgba(37, 99, 235, 0.18);
            color: #1d4ed8;
          }
          .couponHint {
            font-size: 12px;
            color: #6b7280;
            font-weight: 800;
          }
          .couponErr {
            margin-top: 10px;
            font-size: 12px;
            font-weight: 900;
            color: #991b1b;
            background: rgba(185, 28, 28, 0.06);
            border: 1px solid rgba(185, 28, 28, 0.18);
            padding: 8px 10px;
            border-radius: 12px;
          }

          .cta {
            margin-top: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .btn {
            width: 100%;
            border: none;
            border-radius: 12px;
            padding: 12px 12px;
            font-weight: 980;
            cursor: pointer;
            transition: transform 0.12s ease, opacity 0.12s ease;
          }
          .btn:active {
            transform: translateY(1px);
          }
          .btn:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }
          .buy {
            background: #16a34a;
            color: #fff;
          }
          .buy:hover {
            filter: brightness(1.02);
          }
          .ghost {
            background: #fff;
            border: 1px solid #e5e7eb;
            color: #111827;
          }

          .backLine {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #eef2f7;
          }
          .back {
            color: #2563eb;
            text-decoration: none;
            font-weight: 950;
            font-size: 13px;
          }
          .back:hover {
            text-decoration: underline;
          }
        `}</style>
      </main>

      <FooterPrincipal />
    </>
  );
}