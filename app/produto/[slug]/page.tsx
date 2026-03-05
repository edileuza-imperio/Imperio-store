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
  created_at?: string; // compat
  parcelas?: number;
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

function formatDateBR(iso?: string) {
  if (!iso) return null;
  // aceita "2026-03-04 22:30:07"
  const clean = iso.replace(" ", "T");
  const d = new Date(clean);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR");
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

  // Galeria
  const [activeIdx, setActiveIdx] = useState(0);

  // Qtd + Carrinho
  const [qtd, setQtd] = useState(1);
  const [adding, setAdding] = useState(false);

  // Cupom
  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState<{
    codigo: string;
    tipo: "percentual" | "valor";
    valor: number;
    descricao?: string;
  } | null>(null);
  const [cupomErro, setCupomErro] = useState<string | null>(null);

  // ações
  const [copied, setCopied] = useState(false);
  const [fav, setFav] = useState(false);

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
          criado: (p as any).criado ?? (p as any).created_at ?? p.created_at,
          atualizado: (p as any).atualizado ?? undefined,
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

  // favoritos (local)
  useEffect(() => {
    if (!produto) return;
    try {
      const raw = localStorage.getItem("ui:favs");
      const ids: number[] = raw ? JSON.parse(raw) : [];
      setFav(ids.includes(produto.id_produto));
    } catch {
      setFav(false);
    }
  }, [produto?.id_produto]); // eslint-disable-line react-hooks/exhaustive-deps

  const imagens = useMemo(() => {
    if (!produto) return [];
    const list: string[] = [];
    if (produto.imagem) list.push(produto.imagem);
    for (const s of produto.imagensSecundarias || []) list.push(s);
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
      {
        label: produto?.nome || "Produto",
        href: slug ? `/produto/${encodeURIComponent(slug)}` : "/catalogo",
      },
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
      const res = await api.get<ApiResponse<CupomApi>>(
        rotas.cupons.buscarPorCodigo(codigo)
      );
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

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  async function compartilhar() {
    const url = window.location.href;
    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({
          title: produto?.nome ?? "Produto",
          text: "Confira esse produto:",
          url,
        });
        return;
      }
    } catch {
      // se cancelar share, não precisa fazer nada
      return;
    }
    await copiarLink();
  }

  function toggleFav() {
    if (!produto) return;
    try {
      const raw = localStorage.getItem("ui:favs");
      const ids: number[] = raw ? JSON.parse(raw) : [];
      const has = ids.includes(produto.id_produto);
      const next = has ? ids.filter((x) => x !== produto.id_produto) : [...ids, produto.id_produto];
      localStorage.setItem("ui:favs", JSON.stringify(next));
      setFav(!has);
    } catch {
      setFav((v) => !v);
    }
  }

  return (
    <>
      <Navbar />

      <main className="pdp">
        <div className="wrap">
          {/* breadcrumb */}
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
            <div className="state err">Produto não encontrado</div>
          ) : (
            <>
              {/* Cabeçalho (nome + ações) */}
              <header className="head">
                <div className="headLeft">
                  <h1 className="h1">{produto.nome}</h1>
                  <div className="badges">
                    {produto.sku ? <span className="chip">SKU: {produto.sku}</span> : null}
                    {produto.modelo ? <span className="chip">Modelo: {produto.modelo}</span> : null}
                    {produto.destaque ? <span className="chip chipHot">Destaque</span> : null}
                  </div>
                </div>

                <div className="headRight">
                  <button type="button" className="iconBtn" onClick={compartilhar} title="Compartilhar">
                    <span className="ico">↗</span>
                    <span className="txt">Compartilhar</span>
                  </button>

                  <button type="button" className="iconBtn" onClick={copiarLink} title="Copiar link">
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
                </div>
              </header>

              <div className="grid">
                {/* GALERIA + cards de info */}
                <section className="leftCol">
                  <div className="galleryCard">
                    <div className="media">
                      {activeImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="thumb" src={src} alt={`${produto.nome} ${idx + 1}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cards extras */}
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
                        <span className="k">Catálogo</span>
                        <span className="v">{produto.catalogo != null ? String(produto.catalogo) : "—"}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Criado</span>
                        <span className="v">{formatDateBR(produto.criado) ?? "—"}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Atualizado</span>
                        <span className="v">{formatDateBR(produto.atualizado) ?? "—"}</span>
                      </div>
                    </div>

                    <div className="infoCard">
                      <div className="cardTitle">Entrega & disponibilidade</div>

                      <div className="kv">
                        <span className="k">Disponibilidade</span>
                        <span className="v">
                          {(produto.ilimitado ?? 0) === 1
                            ? "Disponível (ilimitado)"
                            : produto.estoque > 0
                            ? `Em estoque (${produto.estoque} un.)`
                            : "Esgotado"}
                        </span>
                      </div>

                      <div className="kv">
                        <span className="k">Dica</span>
                        <span className="v">Finalize seu pedido e envie para o WhatsApp se precisar.</span>
                      </div>

                      <div className="divider" />

                      <div className="miniBtns">
                        <button type="button" className="miniBtn" onClick={compartilhar}>
                          Compartilhar
                        </button>
                        <button type="button" className="miniBtn" onClick={copiarLink}>
                          Copiar link
                        </button>
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

                {/* COMPRA */}
                <aside className="buyCol">
                  <div className="buyBox">
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
                      <div className="qtyCtrl" aria-label="Controle de quantidade">
                        <button
                          type="button"
                          className="qbtn"
                          onClick={() => setQtd((v) => Math.max(1, v - 1))}
                          disabled={qtd <= 1}
                          aria-label="Diminuir"
                        >
                          −
                        </button>
                        <span className="qval">{qtd}</span>
                        <button
                          type="button"
                          className="qbtn"
                          onClick={() => setQtd((v) => Math.min(99, v + 1))}
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* CUPOM */}
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

                      <button type="button" className="btn ghost2" onClick={compartilhar}>
                        Compartilhar produto
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
            </>
          )}
        </div>

        <style jsx>{`
          /* Tema creme + rosa queimado */
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
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
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

          /* header */
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
          .badges {
            margin-top: 8px;
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
            border: 1px solid rgba(43, 33, 28, 0.10);
            color: rgba(43, 33, 28, 0.78);
            backdrop-filter: blur(10px);
          }
          .chipHot {
            color: #a85c5c;
            background: rgba(180, 106, 106, 0.12);
            border-color: rgba(180, 106, 106, 0.22);
          }

          .headRight {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .iconBtn {
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
            transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
          }
          .iconBtn:hover {
            transform: translateY(-1px);
            border-color: rgba(180, 106, 106, 0.30);
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
            border: 1px solid rgba(180, 106, 106, 0.20);
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
          }

          /* states */
          .state {
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid rgba(43, 33, 28, 0.10);
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

          /* Skeleton */
          .skTitle {
            width: 260px;
            height: 18px;
            border-radius: 12px;
            background: linear-gradient(
              90deg,
              rgba(180, 106, 106, 0.10),
              rgba(180, 106, 106, 0.18),
              rgba(180, 106, 106, 0.10)
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
              rgba(180, 106, 106, 0.10),
              rgba(180, 106, 106, 0.18),
              rgba(180, 106, 106, 0.10)
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

          /* layout */
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

          /* gallery */
          .galleryCard {
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid rgba(43, 33, 28, 0.10);
            border-radius: 18px;
            padding: 12px;
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(10px);
          }
          .media {
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(43, 33, 28, 0.10);
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
            border: 1px solid rgba(43, 33, 28, 0.10);
            background: rgba(255, 255, 255, 0.85);
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
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
            }
          }

          /* info cards */
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
            border: 1px solid rgba(43, 33, 28, 0.10);
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
          .divider {
            height: 1px;
            background: rgba(43, 33, 28, 0.08);
            margin: 12px 0;
          }
          .miniBtns {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .miniBtn {
            border: 1px solid rgba(43, 33, 28, 0.12);
            background: rgba(255, 255, 255, 0.78);
            border-radius: 14px;
            padding: 10px 12px;
            cursor: pointer;
            font-weight: 950;
            color: #2b211c;
          }
          .miniBtn:hover {
            border-color: rgba(180, 106, 106, 0.35);
          }

          .descText {
            margin: 0;
            color: rgba(43, 33, 28, 0.78);
            font-weight: 650;
            line-height: 1.7;
            font-size: 13px;
          }

          /* buy */
          .buyBox {
            background: rgba(255, 255, 255, 0.86);
            border: 1px solid rgba(43, 33, 28, 0.10);
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

          .priceArea {
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(43, 33, 28, 0.08);
          }
          .price {
            font-size: 28px;
            font-weight: 980;
            color: #2b211c;
            letter-spacing: -0.35px;
          }
          .install {
            margin-top: 4px;
            font-size: 12px;
            font-weight: 850;
            color: rgba(43, 33, 28, 0.65);
          }

          .stockLine {
            margin-top: 12px;
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
            color: #0f5132;
            background: rgba(25, 135, 84, 0.12);
            border-color: rgba(25, 135, 84, 0.22);
          }
          .bad {
            color: #991b1b;
            background: rgba(185, 28, 28, 0.08);
            border-color: rgba(185, 28, 28, 0.22);
          }
          .stockSmall {
            color: rgba(43, 33, 28, 0.62);
            font-weight: 900;
            font-size: 12px;
          }

          .qtyRow {
            margin-top: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .qtyLbl {
            font-size: 12px;
            font-weight: 950;
            color: rgba(43, 33, 28, 0.78);
          }
          .qtyCtrl {
            display: inline-flex;
            align-items: center;
            border: 1px solid rgba(43, 33, 28, 0.12);
            border-radius: 999px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.75);
          }
          .qbtn {
            width: 38px;
            height: 36px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-weight: 980;
            color: #2b211c;
          }
          .qbtn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .qval {
            width: 44px;
            text-align: center;
            font-weight: 980;
            color: #2b211c;
          }

          /* cupom */
          .coupon {
            margin-top: 14px;
            border-top: 1px solid rgba(43, 33, 28, 0.08);
            padding-top: 14px;
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
            color: #2b211c;
          }
          .couponRemove {
            border: none;
            background: transparent;
            color: #a85c5c;
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
            border: 1px solid rgba(43, 33, 28, 0.12);
            border-radius: 14px;
            padding: 10px 12px;
            font-weight: 900;
            outline: none;
            background: rgba(255, 255, 255, 0.82);
          }
          .couponInput:focus {
            border-color: rgba(180, 106, 106, 0.45);
            box-shadow: 0 0 0 4px rgba(180, 106, 106, 0.14);
          }
          .couponBtn {
            border: none;
            border-radius: 14px;
            padding: 10px 14px;
            font-weight: 950;
            cursor: pointer;
            color: #fff;
            background: linear-gradient(135deg, #b46a6a, #a85c5c);
            box-shadow: 0 14px 26px rgba(180, 106, 106, 0.22);
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
            background: rgba(180, 106, 106, 0.12);
            border: 1px solid rgba(180, 106, 106, 0.22);
            color: #a85c5c;
          }
          .couponHint {
            font-size: 12px;
            color: rgba(43, 33, 28, 0.65);
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
            border-radius: 14px;
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
            transition: transform 0.12s ease, opacity 0.12s ease, filter 0.12s ease;
          }
          .btn:active {
            transform: translateY(1px);
          }
          .btn:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }
          .buy {
            background: linear-gradient(135deg, #b46a6a, #a85c5c);
            color: #fff;
            box-shadow: 0 16px 30px rgba(180, 106, 106, 0.25);
          }
          .ghost {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(43, 33, 28, 0.12);
            color: #2b211c;
          }
          .ghost2 {
            background: rgba(180, 106, 106, 0.10);
            border: 1px solid rgba(180, 106, 106, 0.22);
            color: #a85c5c;
          }

          .backLine {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid rgba(43, 33, 28, 0.08);
          }
          .back {
            color: #a85c5c;
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