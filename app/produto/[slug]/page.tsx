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
  const clean = iso.replace(" ", "T");
  const d = new Date(clean);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR");
}

/** ===========================
 * ✅ CACHE simples (evita repetir requests)
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
    // silencioso (não quebra a página)
  }
  return null;
}

async function carregarStatusMap(): Promise<Map<number, string>> {
  if (cacheStatusMap) return cacheStatusMap;

  const map = new Map<number, string>();
  try {
    const res = await api.get(`/admin/produtos/status`);
    let lista = resolveApi<any>(res.data);

    // aceita formatos: array puro, {dados:[]}, {status:[]}
    if (lista?.dados) lista = lista.dados;
    if (lista?.status) lista = lista.status;
    if (!Array.isArray(lista)) lista = [];

    for (const s of lista) {
      const id =
        Number(s?.id_status ?? s?.id ?? s?.statusid ?? s?.id_statusid ?? 0) ||
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

        // ✅ tenta resolver nomes (se vier do back, mantém)
        const catNome =
          (p as any).categoria_nome?.trim?.() ||
          (p as any).categoriaNome?.trim?.() ||
          (await resolverNomeCategoria((p as any).categoria_id ?? (p as any).categoriaId ?? p.categoria_id));

        const stNome =
          (p as any).status_nome?.trim?.() ||
          (p as any).statusNome?.trim?.() ||
          (await resolverNomeStatus((p as any).statusid ?? (p as any).status_id ?? p.statusid));

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

          // ✅ sobrescreve/garante nomes se achou
          categoria_nome: catNome || p.categoria_nome,
          status_nome: stNome || p.status_nome,
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

        {/* ✅ seu CSS continua igual — mantive tudo */}
        <style jsx>{`
          /* ... (SEU CSS TODO AQUI) ... */
        `}</style>
      </main>

      <FooterPrincipal />
    </>
  );
}