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

type Crumb = { label: string; href: string };
type ImgItem = { src: string; alt: string };

type CupomApi = {
  id?: number;
  codigo?: string;
  valor?: number | string; // pode ser valor fixo
  percentual?: number | string; // pode ser %
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

function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}

function clampMoney(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

/**
 * ✅ Frete fallback (não quebra)
 * - Se você tiver endpoint de frete, substitui esta função por uma chamada API.
 */
function calcularFreteFallback(cepDigits: string, subtotal: number) {
  // Regras simples: grátis acima de 199, senão por região (primeiro dígito do CEP)
  if (subtotal >= 199) return { valor: 0, prazo: "2–5 dias úteis", origem: "grátis acima de R$ 199" };

  const first = Number(cepDigits[0] || 0);
  if (first <= 1) return { valor: 19.9, prazo: "2–4 dias úteis", origem: "região próxima" };
  if (first <= 5) return { valor: 24.9, prazo: "3–6 dias úteis", origem: "região média" };
  return { valor: 29.9, prazo: "4–8 dias úteis", origem: "região distante" };
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

  // galeria
  const [activeImg, setActiveImg] = useState<string | null>(null);

  // qtd
  const [qtd, setQtd] = useState(1);

  // frete
  const [cep, setCep] = useState("");
  const [freteLoading, setFreteLoading] = useState(false);
  const [freteValor, setFreteValor] = useState<number | null>(null);
  const [fretePrazo, setFretePrazo] = useState<string | null>(null);
  const [freteInfo, setFreteInfo] = useState<string | null>(null);
  const [freteErro, setFreteErro] = useState<string | null>(null);

  // cupom
  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState<{
    codigo: string;
    tipo: "percentual" | "valor";
    valor: number;
    descricao?: string;
  } | null>(null);
  const [cupomErro, setCupomErro] = useState<string | null>(null);

  // carregar produto
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

        const primeira =
          produtoFinal.imagem ||
          produtoFinal.imagensSecundarias?.[0] ||
          null;

        setActiveImg(primeira);
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

  const imagens = useMemo<ImgItem[]>(() => {
    if (!produto) return [];
    const list: ImgItem[] = [];

    if (produto.imagem) list.push({ src: produto.imagem, alt: produto.nome });
    for (let i = 0; i < (produto.imagensSecundarias?.length || 0); i++) {
      const src = produto.imagensSecundarias![i];
      list.push({ src, alt: `${produto.nome} - imagem ${i + 2}` });
    }

    // remove duplicadas
    return Array.from(new Map(list.map((x) => [x.src, x])).values());
  }, [produto]);

  const crumbs = useMemo<Crumb[]>(() => {
    const categoria = produto?.categoria_nome?.trim();

    const base: Crumb[] = [
      { label: "Início", href: "/" },
      { label: "Catálogo", href: "/catalogo" },
    ];

    if (categoria) base.push({ label: categoria, href: "/catalogo" });

    base.push({
      label: produto?.nome || "Produto",
      href: slug ? `/produto/${encodeURIComponent(slug)}` : "/catalogo",
    });

    return base;
  }, [produto, slug]);

  const indisponivel = useMemo(() => {
    if (!produto) return true;
    if ((produto.ilimitado ?? 0) === 1) return false;
    return (produto.estoque ?? 0) <= 0;
  }, [produto]);

  // valores
  const subtotal = useMemo(() => {
    if (!produto) return 0;
    return clampMoney(Number(produto.preco || 0) * Math.max(1, qtd));
  }, [produto, qtd]);

  const desconto = useMemo(() => {
    if (!cupomAplicado) return 0;
    if (cupomAplicado.tipo === "percentual") {
      return clampMoney((subtotal * cupomAplicado.valor) / 100);
    }
    return clampMoney(cupomAplicado.valor);
  }, [cupomAplicado, subtotal]);

  const total = useMemo(() => {
    const f = freteValor ?? 0;
    return clampMoney(subtotal - desconto + f);
  }, [subtotal, desconto, freteValor]);

  async function calcularFrete() {
    setFreteErro(null);
    setFreteInfo(null);

    const cepDigits = onlyDigits(cep);
    if (cepDigits.length !== 8) {
      setFreteErro("Informe um CEP válido (8 dígitos).");
      setFreteValor(null);
      setFretePrazo(null);
      return;
    }

    setFreteLoading(true);

    try {
      /**
       * Se você tiver um endpoint real de frete, use aqui.
       * Exemplo:
       * const res = await api.get(`/frete/${cepDigits}`);
       * const data = resolveApi<{valor:number,prazo:string}>(res.data)
       * setFreteValor(data.valor); setFretePrazo(data.prazo);
       */

      const calc = calcularFreteFallback(cepDigits, subtotal);
      setFreteValor(calc.valor);
      setFretePrazo(calc.prazo);
      setFreteInfo(calc.origem);
    } catch (e: any) {
      setFreteErro(
        e?.response?.data?.mensagem ||
          e?.response?.data?.message ||
          e?.message ||
          "Erro ao calcular frete"
      );
      setFreteValor(null);
      setFretePrazo(null);
    } finally {
      setFreteLoading(false);
    }
  }

  async function aplicarCupom() {
    setCupomErro(null);

    const codigo = cupomCodigo.trim();
    if (!codigo) {
      setCupomErro("Digite um cupom.");
      return;
    }

    setCupomLoading(true);

    try {
      // ✅ sua rota existe no rotas.ts: /cupom/{codigo}
      const res = await api.get<ApiResponse<CupomApi>>(
        rotas.cupons.buscarPorCodigo(codigo)
      );
      const c = resolveApi<CupomApi>(res.data);

      if (!c) {
        setCupomErro("Cupom inválido.");
        setCupomAplicado(null);
        return;
      }

      const ativo = Number((c as any).ativo ?? 1);
      if (ativo === 0) {
        setCupomErro("Cupom inativo.");
        setCupomAplicado(null);
        return;
      }

      const perc = Number(String((c as any).percentual ?? "").replace(",", "."));
      const val = Number(String((c as any).valor ?? "").replace(",", "."));

      if (Number.isFinite(perc) && perc > 0) {
        setCupomAplicado({
          codigo: (c.codigo || codigo).toUpperCase(),
          tipo: "percentual",
          valor: perc,
          descricao: c.descricao,
        });
        return;
      }

      if (Number.isFinite(val) && val > 0) {
        setCupomAplicado({
          codigo: (c.codigo || codigo).toUpperCase(),
          tipo: "valor",
          valor: val,
          descricao: c.descricao,
        });
        return;
      }

      setCupomErro("Cupom sem desconto configurado.");
      setCupomAplicado(null);
    } catch (e: any) {
      setCupomErro(
        e?.response?.data?.mensagem ||
          e?.response?.data?.message ||
          e?.message ||
          "Erro ao validar cupom"
      );
      setCupomAplicado(null);
    } finally {
      setCupomLoading(false);
    }
  }

  function removerCupom() {
    setCupomAplicado(null);
    setCupomErro(null);
    setCupomCodigo("");
  }

  return (
    <>
      <Navbar />

      <main className="pdPage">
        <div className="pdContainer">
          {/* Breadcrumb */}
          <nav className="pdBreadcrumb" aria-label="breadcrumb">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={`${c.label}-${i}`} className="pdCrumb">
                  {i > 0 ? <span className="pdSep">/</span> : null}
                  {isLast ? (
                    <span className="pdCrumbActive">{c.label}</span>
                  ) : (
                    <Link className="pdCrumbLink" href={c.href}>
                      {c.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          {loading ? (
            <div className="pdBox">Carregando produto…</div>
          ) : erro ? (
            <div className="pdBox pdBoxErr">{erro}</div>
          ) : !produto ? (
            <div className="pdBox pdBoxErr">Produto não encontrado</div>
          ) : (
            <div className="pdGrid">
              {/* ESQUERDA */}
              <section className="pdLeft">
                <div className="pdMediaCard">
                  {activeImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="pdImg" src={activeImg} alt={produto.nome} />
                  ) : (
                    <div className="pdImgFallback">Sem imagem</div>
                  )}

                  {produto.destaque ? (
                    <div className="pdCornerBadge">Destaque</div>
                  ) : null}
                </div>

                {!!imagens.length && (
                  <div className="pdThumbs">
                    {imagens.slice(0, 8).map((img) => {
                      const active = img.src === activeImg;
                      return (
                        <button
                          key={img.src}
                          type="button"
                          className={`pdThumbBtn ${active ? "isActive" : ""}`}
                          onClick={() => setActiveImg(img.src)}
                          aria-label="Trocar imagem"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="pdThumb" src={img.src} alt={img.alt} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {produto.descricao ? (
                  <div className="pdCard">
                    <div className="pdCardTitle">Descrição</div>
                    <p className="pdText">{produto.descricao}</p>
                  </div>
                ) : null}
              </section>

              {/* DIREITA */}
              <aside className="pdRight">
                <div className="pdInfoCard">
                  <div className="pdTitleRow">
                    <h1 className="pdTitle">{produto.nome}</h1>
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
                    <div className="pdSmall">
                      {produto.parcelas ? `em até ${produto.parcelas}x` : ""}
                    </div>
                  </div>

                  <div className="pdRow">
                    <div className="pdQty">
                      <span className="pdQtyLabel">Quantidade</span>
                      <div className="pdQtyCtrl">
                        <button
                          type="button"
                          className="pdQtyBtn"
                          onClick={() => setQtd((v) => Math.max(1, v - 1))}
                          disabled={qtd <= 1}
                        >
                          −
                        </button>
                        <span className="pdQtyVal">{qtd}</span>
                        <button
                          type="button"
                          className="pdQtyBtn"
                          onClick={() => setQtd((v) => Math.min(99, v + 1))}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="pdStockRow">
                      {(produto.ilimitado ?? 0) === 1 ? (
                        <span className="pdPillOk">Disponível</span>
                      ) : produto.estoque > 0 ? (
                        <span className="pdPillOk">Em estoque: {produto.estoque}</span>
                      ) : (
                        <span className="pdPillBad">Esgotado</span>
                      )}
                    </div>
                  </div>

                  {/* CUPOM */}
                  <div className="pdCard pdCardSoft">
                    <div className="pdCardHead">
                      <div className="pdCardTitle">Cupom</div>
                      {cupomAplicado ? (
                        <button type="button" className="pdLinkBtn" onClick={removerCupom}>
                          Remover
                        </button>
                      ) : null}
                    </div>

                    {cupomAplicado ? (
                      <div className="pdApplied">
                        <span className="pdTag">
                          {cupomAplicado.codigo} •{" "}
                          {cupomAplicado.tipo === "percentual"
                            ? `${cupomAplicado.valor}%`
                            : formatBRL(cupomAplicado.valor)}
                        </span>
                        {cupomAplicado.descricao ? (
                          <div className="pdHint">{cupomAplicado.descricao}</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="pdInline">
                        <input
                          className="pdInput"
                          value={cupomCodigo}
                          onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                          placeholder="EX: IMPERIO10"
                        />
                        <button
                          type="button"
                          className="pdBtn pdBtnMini pdBtnPrimary"
                          onClick={aplicarCupom}
                          disabled={cupomLoading}
                        >
                          {cupomLoading ? "Validando…" : "Aplicar"}
                        </button>
                      </div>
                    )}

                    {cupomErro ? <div className="pdMsgErr">{cupomErro}</div> : null}
                  </div>

                  {/* FRETE */}
                  <div className="pdCard pdCardSoft">
                    <div className="pdCardTitle">Frete</div>

                    <div className="pdInline">
                      <input
                        className="pdInput"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        placeholder="CEP (somente números)"
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        className="pdBtn pdBtnMini pdBtnGhost"
                        onClick={calcularFrete}
                        disabled={freteLoading}
                      >
                        {freteLoading ? "Calculando…" : "Calcular"}
                      </button>
                    </div>

                    {freteErro ? <div className="pdMsgErr">{freteErro}</div> : null}

                    {freteValor != null ? (
                      <div className="pdFreteRes">
                        <div className="pdFreteRow">
                          <span>Frete</span>
                          <b>{freteValor === 0 ? "Grátis" : formatBRL(freteValor)}</b>
                        </div>
                        {fretePrazo ? (
                          <div className="pdHint">Prazo estimado: {fretePrazo}</div>
                        ) : null}
                        {freteInfo ? <div className="pdHint">{freteInfo}</div> : null}
                      </div>
                    ) : (
                      <div className="pdHint">Digite seu CEP para estimar entrega.</div>
                    )}
                  </div>

                  {/* RESUMO */}
                  <div className="pdCard pdResume">
                    <div className="pdCardTitle">Resumo</div>

                    <div className="pdSumRow">
                      <span>Subtotal</span>
                      <b>{formatBRL(subtotal)}</b>
                    </div>

                    <div className="pdSumRow">
                      <span>Desconto</span>
                      <b>{desconto > 0 ? `- ${formatBRL(desconto)}` : "—"}</b>
                    </div>

                    <div className="pdSumRow">
                      <span>Frete</span>
                      <b>
                        {freteValor == null ? "—" : freteValor === 0 ? "Grátis" : formatBRL(freteValor)}
                      </b>
                    </div>

                    <div className="pdSumTotal">
                      <span>Total</span>
                      <b>{formatBRL(total)}</b>
                    </div>

                    <div className="pdActions">
                      <button
                        className="pdBtn pdBtnPrimary"
                        type="button"
                        disabled={indisponivel}
                      >
                        Adicionar ao carrinho
                      </button>

                      <button
                        className="pdBtn pdBtnGhost"
                        type="button"
                        disabled={indisponivel}
                      >
                        Comprar agora
                      </button>
                    </div>

                    <div className="pdSafeLinks">
                      <Link className="pdBack" href="/catalogo">
                        ← Voltar para o catálogo
                      </Link>
                    </div>
                  </div>
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
          .pdSep { margin: 0 8px; opacity: 0.6; }
          .pdCrumbLink { color: #6b5a49; text-decoration: none; }
          .pdCrumbLink:hover { text-decoration: underline; }
          .pdCrumbActive { color: #b88962; font-weight: 950; }

          .pdBox {
            background: rgba(255, 255, 255, 0.72);
            border: 1px solid rgba(111, 92, 73, 0.16);
            border-radius: 18px;
            padding: 14px;
            font-weight: 850;
          }
          .pdBoxErr {
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
            .pdGrid { grid-template-columns: 1fr; }
          }

          /* esquerda */
          .pdMediaCard {
            position: relative;
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
          @media (max-width: 980px) { .pdImg { height: 380px; } }
          .pdImgFallback {
            height: 520px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 950;
            color: #7b6a5a;
          }
          .pdCornerBadge {
            position: absolute;
            top: 12px;
            left: 12px;
            padding: 7px 10px;
            border-radius: 999px;
            font-weight: 980;
            font-size: 12px;
            color: #ffffff;
            background: rgba(30, 20, 12, 0.92);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
          }
          .pdThumbs {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 10px;
            margin-top: 12px;
          }
          @media (max-width: 560px) { .pdThumbs { grid-template-columns: repeat(4, 1fr); } }
          .pdThumbBtn {
            border: 1px solid rgba(111, 92, 73, 0.14);
            background: rgba(255, 255, 255, 0.75);
            border-radius: 14px;
            padding: 0;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.12s ease, border-color 0.12s ease;
          }
          .pdThumbBtn:hover { transform: translateY(-1px); border-color: rgba(184, 137, 98, 0.45); }
          .pdThumbBtn.isActive {
            border-color: rgba(184, 137, 98, 0.9);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.14);
          }
          .pdThumb {
            width: 100%;
            height: 64px;
            object-fit: cover;
            display: block;
          }

          /* direita */
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
            .pdInfoCard { position: relative; top: 0; }
          }
          .pdTitleRow { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
          .pdTitle {
            margin: 0;
            font-size: 22px;
            font-weight: 980;
            letter-spacing: -0.3px;
            color: #2f261e;
            line-height: 1.15;
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
          .pdSmall { margin-top: 4px; font-size: 12px; color: #6b5a49; font-weight: 800; }

          .pdRow {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 12px;
            align-items: center;
            flex-wrap: wrap;
          }

          .pdQtyLabel { font-size: 12px; font-weight: 900; color: #6b5a49; display: block; margin-bottom: 6px; }
          .pdQtyCtrl {
            display: inline-flex;
            align-items: center;
            border: 1px solid rgba(111, 92, 73, 0.18);
            background: rgba(255,255,255,.78);
            border-radius: 999px;
            overflow: hidden;
          }
          .pdQtyBtn {
            width: 36px;
            height: 34px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-weight: 950;
            color: #3f3327;
          }
          .pdQtyBtn:disabled { opacity: .45; cursor: not-allowed; }
          .pdQtyVal { width: 38px; text-align: center; font-weight: 950; color:#2f261e; }

          .pdPillOk {
            font-weight: 950;
            color: #047857;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.18);
            padding: 6px 10px;
            border-radius: 999px;
            display: inline-block;
          }
          .pdPillBad {
            font-weight: 950;
            color: #8a1f1f;
            background: rgba(185, 28, 28, 0.06);
            border: 1px solid rgba(185, 28, 28, 0.18);
            padding: 6px 10px;
            border-radius: 999px;
            display: inline-block;
          }

          .pdCard {
            margin-top: 12px;
            border-radius: 18px;
            border: 1px solid rgba(111, 92, 73, 0.14);
            background: rgba(255,255,255,.70);
            padding: 12px;
          }
          .pdCardSoft {
            background: rgba(255,255,255,.62);
          }
          .pdCardHead {
            display:flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
          }
          .pdCardTitle {
            font-weight: 980;
            color: #2f261e;
          }
          .pdText { margin: 10px 0 0; color:#6b5a49; font-weight: 700; line-height: 1.5; font-size: 13px; }

          .pdInline {
            display:flex;
            gap: 10px;
            margin-top: 10px;
          }
          .pdInput {
            flex: 1;
            border-radius: 14px;
            border: 1px solid rgba(111, 92, 73, 0.18);
            padding: 10px 12px;
            font-weight: 900;
            outline: none;
            background: rgba(255,255,255,.85);
          }
          .pdInput:focus {
            border-color: rgba(212,175,55,.75);
            box-shadow: 0 0 0 3px rgba(212,175,55,.14);
          }

          .pdBtn {
            border: none;
            border-radius: 14px;
            padding: 12px 12px;
            font-weight: 980;
            cursor: pointer;
            transition: transform 0.12s ease, filter 0.12s ease, opacity 0.12s ease;
          }
          .pdBtn:active { transform: translateY(1px); }
          .pdBtn:disabled { opacity: 0.55; cursor: not-allowed; }
          .pdBtnMini { padding: 10px 12px; border-radius: 14px; }

          .pdBtnPrimary {
            color: #fff;
            background: linear-gradient(135deg, #d1a67f 0%, #b88962 100%);
            box-shadow: 0 12px 26px rgba(184, 137, 98, 0.35);
          }
          .pdBtnPrimary:hover { filter: brightness(1.02); }

          .pdBtnGhost {
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(111, 92, 73, 0.18);
            color: #3f3327;
          }
          .pdBtnGhost:hover { filter: brightness(0.98); }

          .pdActions {
            display:flex;
            gap: 10px;
            margin-top: 12px;
          }

          .pdHint {
            margin-top: 8px;
            font-size: 12px;
            font-weight: 800;
            color: #6b5a49;
            opacity: .92;
          }
          .pdMsgErr {
            margin-top: 8px;
            font-size: 12px;
            font-weight: 900;
            color: #8a1f1f;
            background: rgba(185,28,28,.06);
            border: 1px solid rgba(185,28,28,.18);
            padding: 8px 10px;
            border-radius: 14px;
          }

          .pdApplied { margin-top: 10px; display:flex; flex-direction: column; gap: 8px; }
          .pdTag {
            display:inline-flex;
            align-items:center;
            justify-content:center;
            padding: 7px 10px;
            border-radius: 999px;
            font-weight: 980;
            font-size: 12px;
            color:#3f3327;
            background: rgba(255,255,255,.70);
            border: 1px solid rgba(111,92,73,.14);
            width: fit-content;
          }
          .pdLinkBtn{
            border:none;
            background: transparent;
            cursor: pointer;
            font-weight: 950;
            color: #b88962;
            text-decoration: underline;
          }

          .pdFreteRes { margin-top: 10px; }
          .pdFreteRow { display:flex; justify-content: space-between; align-items:center; font-weight: 900; color:#2f261e; }

          .pdResume { background: rgba(255,255,255,.78); }
          .pdSumRow { display:flex; justify-content: space-between; margin-top: 10px; font-weight: 850; color:#3f3327; }
          .pdSumTotal{
            display:flex;
            justify-content: space-between;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(111,92,73,.14);
            font-weight: 980;
            color:#2f261e;
            font-size: 16px;
          }

          .pdSafeLinks { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(111, 92, 73, 0.14); }
          .pdBack { font-weight: 900; color: #6b5a49; text-decoration: none; }
          .pdBack:hover { text-decoration: underline; }
        `}</style>
      </main>

      <FooterPrincipal />
    </>
  );
}