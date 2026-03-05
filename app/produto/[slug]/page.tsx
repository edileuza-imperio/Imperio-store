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
  return String(caminho).startsWith("http")
    ? String(caminho)
    : `${base.replace(/\/$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
};

function formatBRL(v: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

/** ===========================
 * ✅ Cache e resolvers (Status/Categoria)
 * =========================== */
const cacheCategoriaNome = new Map<number, string>();
let cacheStatusMap: Map<number, string> | null = null;

async function resolverNomeCategoria(id?: number | null): Promise<string | null> {
  const cid = Number(id || 0);
  if (!cid) return null;

  if (cacheCategoriaNome.has(cid)) return cacheCategoriaNome.get(cid)!;

  try {
    const res = await api.get(`/admin/categorias/${cid}`);
    const dados = resolveApi<any>(res.data);

    const nome =
      String(dados?.nome ?? dados?.dados?.nome ?? "").trim() ||
      String(dados?.categoria?.nome ?? "").trim();

    if (nome) {
      cacheCategoriaNome.set(cid, nome);
      return nome;
    }
  } catch {
    // silencioso
  }
  return null;
}

async function carregarStatusMap(): Promise<Map<number, string>> {
  if (cacheStatusMap) return cacheStatusMap;

  const map = new Map<number, string>();
  try {
    const res = await api.get(`/admin/produtos/status`);
    let lista = resolveApi<any>(res.data);

    if (lista?.dados) lista = lista.dados;
    if (lista?.status) lista = lista.status;
    if (!Array.isArray(lista)) lista = [];

    for (const s of lista) {
      const id =
        Number(s?.id_status ?? s?.id ?? s?.statusid ?? s?.status_id ?? 0) ||
        Number(s?.statusid ?? 0);

      const nome = String(s?.nome ?? s?.status_nome ?? s?.titulo ?? "").trim();
      if (id && nome) map.set(id, nome);
    }
  } catch {
    // silencioso
  }

  cacheStatusMap = map;
  return map;
}

async function resolverNomeStatus(id?: number | null): Promise<string | null> {
  const sid = Number(id || 0);
  if (!sid) return null;

  const map = await carregarStatusMap();
  return map.get(sid) ?? null;
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

        // ✅ resolve nomes se API só manda ID
        const catId =
          (p as any).categoria_id ?? (p as any).categoriaId ?? (p as any).categoria ?? p.categoria_id;

        const stId =
          (p as any).statusid ?? (p as any).status_id ?? (p as any).status ?? p.statusid;

        const categoria_nome =
          String((p as any).categoria_nome ?? (p as any).categoriaNome ?? "").trim() ||
          (await resolverNomeCategoria(catId));

        const status_nome =
          String((p as any).status_nome ?? (p as any).statusNome ?? "").trim() ||
          (await resolverNomeStatus(stId));

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
          categoria_nome: categoria_nome || p.categoria_nome,
          status_nome: status_nome || p.status_nome,
          categoria_id: Number(catId ?? p.categoria_id ?? 0) || p.categoria_id,
          statusid: Number(stId ?? p.statusid ?? 0) || p.statusid,
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

  const statusPill =
    produto?.status_nome?.trim() ||
    (produto?.statusid != null ? `Status #${produto.statusid}` : "");

  const categoriaLabel =
    produto?.categoria_nome?.trim() ||
    (produto?.categoria_id != null ? `Categoria #${produto.categoria_id}` : "—");

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
            <div className="sk">
              <div className="skTop">
                <div className="skH1" />
                <div className="skActions">
                  <div className="skBtn" />
                  <div className="skBtn" />
                  <div className="skBtn" />
                </div>
              </div>

              <div className="skGrid">
                <div className="skLeft">
                  <div className="skHero" />
                  <div className="skThumbs">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="skThumb" />
                    ))}
                  </div>
                  <div className="skCards">
                    <div className="skCard" />
                    <div className="skCard" />
                  </div>
                </div>
                <div className="skBuy" />
              </div>
            </div>
          ) : erro ? (
            <div className="state err">
              <div className="stateTitle">Ops! Algo deu errado</div>
              <div className="stateText">{erro}</div>
              <div className="stateActions">
                <Link className="btn ghost" href="/catalogo">
                  Voltar ao catálogo
                </Link>
              </div>
            </div>
          ) : !produto ? (
            <div className="state err">
              <div className="stateTitle">Produto não encontrado</div>
              <div className="stateText">Verifique o link ou volte ao catálogo.</div>
              <div className="stateActions">
                <Link className="btn ghost" href="/catalogo">
                  Voltar ao catálogo
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Top bar */}
              <header className="topbar">
                <div className="tleft">
                  <h1 className="h1">{produto.nome}</h1>

                  <div className="chips">
                    {produto.sku ? <span className="chip">SKU: {produto.sku}</span> : null}
                    {produto.modelo ? <span className="chip">Modelo: {produto.modelo}</span> : null}
                    {produto.destaque ? <span className="chip chipHot">Destaque</span> : null}
                    {statusPill ? <span className="chip chipSoft">{statusPill}</span> : null}
                  </div>
                </div>

                <div className="tactions">
                  <button type="button" className="act" onClick={compartilhar} title="Compartilhar">
                    <span className="actIco">↗</span>
                    <span className="actTxt">Compartilhar</span>
                  </button>

                  <button type="button" className="act" onClick={copiarLink} title="Copiar link">
                    <span className="actIco">⧉</span>
                    <span className="actTxt">{copied ? "Copiado!" : "Copiar link"}</span>
                  </button>

                  <button
                    type="button"
                    className={`act ${fav ? "on" : ""}`}
                    onClick={toggleFav}
                    title="Favoritar"
                  >
                    <span className="actIco">{fav ? "♥" : "♡"}</span>
                    <span className="actTxt">{fav ? "Favorito" : "Favoritar"}</span>
                  </button>
                </div>
              </header>

              <div className="grid">
                {/* LEFT */}
                <section className="leftCol">
                  <div className="card heroCard">
                    <div className="heroWrap">
                      {activeImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="hero" src={activeImg} alt={produto.nome} />
                      ) : (
                        <div className="noimg">Sem imagem</div>
                      )}

                      <div className="heroOverlay">
                        <div className="heroBadge">
                          <span className="dot" />
                          {indisponivel ? "Indisponível" : "Disponível"}
                        </div>
                      </div>
                    </div>

                    {imagens.length > 1 ? (
                      <div className="thumbs" role="list">
                        {imagens.slice(0, 14).map((src, idx) => (
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
                    ) : null}
                  </div>

                  <div className="cardsRow">
                    <div className="card infoCard">
                      <div className="cardTitle">Detalhes</div>

                      <div className="kv">
                        <span className="k">ID</span>
                        <span className="v">#{produto.id_produto}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Categoria</span>
                        <span className="v">{categoriaLabel}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Status</span>
                        <span className="v">{statusPill || "—"}</span>
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

                    <div className="card infoCard">
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

                  <div className="card descCard">
                    <div className="cardTitle">Descrição</div>
                    <p className="descText">
                      {produto.descricao?.trim()
                        ? produto.descricao
                        : "Este produto não possui descrição detalhada no momento."}
                    </p>
                  </div>
                </section>

                {/* RIGHT / BUY */}
                <aside className="buyCol">
                  <div className="buyBox">
                    <div className="buyTop">
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

                    <div className="trust">
                      <div className="trustItem">
                        <span className="trustDot" />
                        Pagamento seguro
                      </div>
                      <div className="trustItem">
                        <span className="trustDot" />
                        Atendimento rápido
                      </div>
                      <div className="trustItem">
                        <span className="trustDot" />
                        Experiência premium
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          /* =========================
             TEMA "Universo Império"
             creme + rosa queimado
          ========================== */
          .pdp {
            min-height: 70vh;
            padding: 18px 0 54px;
            background: radial-gradient(
                1100px 520px at 16% 8%,
                rgba(180, 106, 106, 0.14),
                transparent 55%
              ),
              radial-gradient(
                980px 520px at 88% 0%,
                rgba(255, 255, 255, 0.9),
                transparent 60%
              ),
              linear-gradient(180deg, #fbf4ee, #f7efe7);
          }

          .wrap {
            max-width: 1180px;
            margin: 0 auto;
            padding: 0 16px;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
            color: #2b211c;
          }

          /* breadcrumb */
          .crumbs {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 12px;
            font-weight: 900;
            color: rgba(43, 33, 28, 0.62);
            padding: 10px 0 14px;
          }
          .sep {
            margin: 0 6px;
            opacity: 0.7;
          }
          .link {
            color: #a85c5c;
            text-decoration: none; /* ✅ sem sublinhado */
          }
          .link:hover {
            text-decoration: underline;
          }
          .active {
            color: #2b211c;
            font-weight: 1000;
          }

          /* topbar */
          .topbar {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 14px;
          }
          .h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 1000;
            letter-spacing: -0.35px;
            line-height: 1.18;
          }
          .chips {
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
            background: rgba(255, 255, 255, 0.76);
            border: 1px solid rgba(43, 33, 28, 0.10);
            color: rgba(43, 33, 28, 0.82);
            backdrop-filter: blur(10px);
          }
          .chipHot {
            color: #a85c5c;
            background: rgba(180, 106, 106, 0.12);
            border-color: rgba(180, 106, 106, 0.22);
          }
          .chipSoft {
            color: rgba(43, 33, 28, 0.85);
            background: rgba(255, 255, 255, 0.62);
          }

          .tactions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: flex-end;
          }
          .act {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(43, 33, 28, 0.12);
            background: rgba(255, 255, 255, 0.82);
            backdrop-filter: blur(12px);
            border-radius: 14px;
            padding: 10px 12px;
            cursor: pointer;
            font-weight: 950;
            color: #2b211c;
            transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
            box-shadow: 0 16px 30px rgba(0, 0, 0, 0.06);
          }
          .act:hover {
            transform: translateY(-1px);
            border-color: rgba(180, 106, 106, 0.32);
            box-shadow: 0 18px 36px rgba(0, 0, 0, 0.08);
          }
          .act.on {
            border-color: rgba(180, 106, 106, 0.62);
            box-shadow: 0 0 0 4px rgba(180, 106, 106, 0.14), 0 18px 36px rgba(0, 0, 0, 0.08);
          }
          .actIco {
            width: 24px;
            height: 24px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            background: rgba(180, 106, 106, 0.12);
            border: 1px solid rgba(180, 106, 106, 0.20);
            color: #a85c5c;
            font-weight: 1000;
            line-height: 1;
          }
          .actTxt {
            font-size: 13px;
            font-weight: 950;
          }

          @media (max-width: 860px) {
            .topbar {
              flex-direction: column;
            }
            .tactions {
              width: 100%;
              justify-content: flex-start;
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

          /* cards */
          .card {
            background: rgba(255, 255, 255, 0.84);
            border: 1px solid rgba(43, 33, 28, 0.10);
            border-radius: 18px;
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(12px);
          }

          /* hero */
          .heroCard {
            overflow: hidden;
          }
          .heroWrap {
            position: relative;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.55));
            border-bottom: 1px solid rgba(43, 33, 28, 0.08);
          }
          .hero {
            width: 100%;
            height: 520px;
            object-fit: contain;
            display: block;
            background: #fff;
          }
          .noimg {
            height: 520px;
            display: grid;
            place-items: center;
            font-weight: 1000;
            color: rgba(43, 33, 28, 0.6);
          }
          @media (max-width: 680px) {
            .hero,
            .noimg {
              height: 380px;
            }
          }

          .heroOverlay {
            pointer-events: none;
            position: absolute;
            inset: 0;
            background: radial-gradient(
              800px 300px at 20% 0%,
              rgba(180, 106, 106, 0.18),
              transparent 55%
            );
          }
          .heroBadge {
            position: absolute;
            top: 12px;
            left: 12px;
            display: inline-flex;
            gap: 8px;
            align-items: center;
            padding: 8px 10px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.86);
            border: 1px solid rgba(43, 33, 28, 0.10);
            font-weight: 950;
            font-size: 12px;
            color: rgba(43, 33, 28, 0.82);
            backdrop-filter: blur(10px);
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: rgba(25, 135, 84, 0.85);
            box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.12);
          }

          /* thumbs */
          .thumbs {
            padding: 12px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .thumbBtn {
            width: 78px;
            height: 78px;
            border-radius: 14px;
            padding: 0;
            border: 1px solid rgba(43, 33, 28, 0.10);
            background: rgba(255, 255, 255, 0.9);
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
            border-color: rgba(180, 106, 106, 0.75);
            box-shadow: 0 0 0 4px rgba(180, 106, 106, 0.14);
          }
          .thumb {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          @media (max-width: 700px) {
            .thumbs {
              flex-wrap: nowrap;
              overflow-x: auto;
              padding-bottom: 10px;
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

          /* info */
          .cardsRow {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          @media (max-width: 900px) {
            .cardsRow {
              grid-template-columns: 1fr;
            }
          }

          .infoCard,
          .descCard {
            padding: 14px;
          }

          .cardTitle {
            font-weight: 1000;
            margin-bottom: 10px;
            letter-spacing: -0.2px;
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
            color: rgba(43, 33, 28, 0.62);
            font-weight: 900;
            font-size: 12px;
          }
          .v {
            color: #2b211c;
            font-weight: 1000;
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
            background: rgba(255, 255, 255, 0.82);
            border-radius: 14px;
            padding: 10px 12px;
            cursor: pointer;
            font-weight: 950;
            color: #2b211c;
            transition: border-color 0.12s ease, transform 0.12s ease;
          }
          .miniBtn:hover {
            border-color: rgba(180, 106, 106, 0.35);
            transform: translateY(-1px);
          }

          .descText {
            margin: 0;
            color: rgba(43, 33, 28, 0.82);
            font-weight: 650;
            line-height: 1.75;
            font-size: 13px;
          }

          /* buy */
          .buyBox {
            position: sticky;
            top: 12px;
            padding: 14px;
            background: rgba(255, 255, 255, 0.88);
            border: 1px solid rgba(43, 33, 28, 0.10);
            border-radius: 18px;
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.08);
            backdrop-filter: blur(12px);
          }
          @media (max-width: 1024px) {
            .buyBox {
              position: relative;
              top: 0;
            }
          }

          .buyTop {
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(43, 33, 28, 0.08);
          }

          .price {
            font-size: 30px;
            font-weight: 1000;
            letter-spacing: -0.45px;
            color: #2b211c;
          }
          .install {
            margin-top: 4px;
            font-size: 12px;
            font-weight: 900;
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
            font-weight: 1000;
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
            background: rgba(255, 255, 255, 0.85);
          }
          .qbtn {
            width: 40px;
            height: 38px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-weight: 1000;
            color: #2b211c;
          }
          .qbtn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .qval {
            width: 48px;
            text-align: center;
            font-weight: 1000;
            color: #2b211c;
          }

          /* cupom */
          .coupon {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid rgba(43, 33, 28, 0.08);
          }
          .couponHead {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }
          .couponTitle {
            font-weight: 1000;
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
            background: rgba(255, 255, 255, 0.9);
          }
          .couponInput:focus {
            border-color: rgba(180, 106, 106, 0.45);
            box-shadow: 0 0 0 4px rgba(180, 106, 106, 0.14);
          }
          .couponBtn {
            border: none;
            border-radius: 14px;
            padding: 10px 14px;
            font-weight: 1000;
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
            font-weight: 1000;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(180, 106, 106, 0.12);
            border: 1px solid rgba(180, 106, 106, 0.22);
            color: #a85c5c;
          }
          .couponHint {
            font-size: 12px;
            color: rgba(43, 33, 28, 0.65);
            font-weight: 850;
          }
          .couponErr {
            margin-top: 10px;
            font-size: 12px;
            font-weight: 950;
            color: #991b1b;
            background: rgba(185, 28, 28, 0.06);
            border: 1px solid rgba(185, 28, 28, 0.18);
            padding: 8px 10px;
            border-radius: 14px;
          }

          /* CTA */
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
            font-weight: 1000;
            cursor: pointer;
            transition: transform 0.12s ease, opacity 0.12s ease, filter 0.12s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
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
            background: rgba(255, 255, 255, 0.95);
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

          .trust {
            margin-top: 14px;
            display: grid;
            gap: 8px;
            padding-top: 14px;
            border-top: 1px solid rgba(43, 33, 28, 0.08);
          }
          .trustItem {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 900;
            font-size: 12px;
            color: rgba(43, 33, 28, 0.72);
          }
          .trustDot {
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background: rgba(180, 106, 106, 0.85);
            box-shadow: 0 0 0 4px rgba(180, 106, 106, 0.12);
          }

          /* State */
          .state {
            background: rgba(255, 255, 255, 0.86);
            border: 1px solid rgba(43, 33, 28, 0.10);
            border-radius: 18px;
            padding: 18px;
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(12px);
          }
          .err {
            border-color: rgba(185, 28, 28, 0.22);
            background: rgba(185, 28, 28, 0.05);
            color: #991b1b;
          }
          .stateTitle {
            font-weight: 1000;
            font-size: 16px;
            margin-bottom: 6px;
          }
          .stateText {
            font-weight: 850;
            opacity: 0.9;
          }
          .stateActions {
            margin-top: 14px;
          }

          /* Skeleton */
          .sk {
            border-radius: 18px;
          }
          .skTop {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
            margin-bottom: 12px;
          }
          .skH1 {
            width: min(520px, 70%);
            height: 20px;
            border-radius: 14px;
            background: linear-gradient(
              90deg,
              rgba(180, 106, 106, 0.10),
              rgba(180, 106, 106, 0.18),
              rgba(180, 106, 106, 0.10)
            );
            background-size: 200% 100%;
            animation: sk 1.1s infinite linear;
          }
          .skActions {
            display: flex;
            gap: 10px;
          }
          .skBtn {
            width: 130px;
            height: 40px;
            border-radius: 14px;
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
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 14px;
          }
          .skLeft {
            display: grid;
            gap: 14px;
          }
          .skHero {
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
          .skThumbs {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .skThumb {
            width: 78px;
            height: 78px;
            border-radius: 14px;
            background: linear-gradient(
              90deg,
              rgba(180, 106, 106, 0.10),
              rgba(180, 106, 106, 0.18),
              rgba(180, 106, 106, 0.10)
            );
            background-size: 200% 100%;
            animation: sk 1.1s infinite linear;
          }
          .skCards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .skCard {
            height: 240px;
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

          @media (max-width: 1024px) {
            .skGrid {
              grid-template-columns: 1fr;
            }
            .skBuy {
              height: 360px;
            }
            .skTop {
              flex-direction: column;
              align-items: flex-start;
            }
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
      </main>

      <FooterPrincipal />
    </>
  );
}