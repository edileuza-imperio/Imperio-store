"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  FiStar,
  FiTag,
  FiGift,
  FiRefreshCw,
  FiAlertTriangle,
  FiLink,
  FiImage,
} from "react-icons/fi";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
  inicio?: string;
  fim?: string;
  statusid?: number;
};

type ProdutoDestaque = {
  id_produto: number;
  nome: string;
  slug?: string;
  preco?: number | string;
  imagem?: string;
  destaque?: boolean;
  id_destaque?: number;
};

function formatMoneyBR(value?: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getImagemUrl(caminho?: string) {
  if (!caminho) return undefined;
  const base = api.defaults.baseURL || "";
  const clean = String(caminho).replace(/^\/+/, "");
  const baseFinal = base.endsWith("/") ? base : `${base}/`;
  return `${baseFinal}${clean}`;
}

function computePeriod(c: Campanha) {
  const now = Date.now();

  const parse = (v?: string) => {
    if (!v) return null;
    const iso = v.includes("T") ? v : v.replace(" ", "T");
    const d = new Date(iso);
    const t = d.getTime();
    return Number.isNaN(t) ? null : t;
  };

  const ini = parse(c.inicio);
  const fim = parse(c.fim);

  if (ini && now < ini) return "agendada";
  if (fim && now > fim) return "finalizada";
  if (ini && now >= ini && (!fim || now <= fim)) return "ativa";
  return "sem-periodo";
}

type Props = {
  /** Se você for usar na HOME do site (public), troque para "/campanha/ativa" etc */
  campanhasEndpoint?: string; // default: /admin/campanhas
  produtosDestaqueEndpoint?: string; // default: /admin/produtos/destaques

  /** Links (ajusta conforme seu projeto) */
  campanhaHref?: (c: Campanha) => string; // default: /campanha/{slug}
  produtoHref?: (p: ProdutoDestaque) => string; // default: /produto/{slug||id}

  /** Quantidade máxima */
  limitCampanhas?: number; // default: 6
  limitProdutos?: number; // default: 8

  /** Títulos */
  tituloCampanhas?: string; // default: "Campanhas em destaque"
  tituloProdutos?: string; // default: "Produtos em destaque"
};

export default function DestaquesSection({
  campanhasEndpoint = "/admin/campanhas",
  produtosDestaqueEndpoint = "/admin/produtos/destaques",
  campanhaHref = (c) => `/campanha/${c.slug}`,
  produtoHref = (p) => `/produto/${p.slug || p.id_produto}`,
  limitCampanhas = 6,
  limitProdutos = 8,
  tituloCampanhas = "Campanhas em destaque",
  tituloProdutos = "Produtos em destaque",
}: Props) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [produtos, setProdutos] = useState<ProdutoDestaque[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingCampanhas, setLoadingCampanhas] = useState(false);
  const [loadingProdutos, setLoadingProdutos] = useState(false);

  const [erro, setErro] = useState<string | null>(null);

  async function carregarCampanhas() {
    setLoadingCampanhas(true);
    try {
      const res = await api.get(campanhasEndpoint);
      const lista = res?.data?.dados?.campanhas ?? res?.data?.dados ?? res?.data ?? [];
      const arr = Array.isArray(lista) ? (lista as Campanha[]) : [];

      // ✅ destaque = statusid === 3 (sua regra)
      const destaques = arr.filter((c) => Number(c.statusid) === 3);

      // opcional: ordenar (ativa primeiro, depois agendada, depois sem período, depois finalizada)
      const weight = (c: Campanha) => {
        const p = computePeriod(c);
        if (p === "ativa") return 1;
        if (p === "agendada") return 2;
        if (p === "sem-periodo") return 3;
        return 4; // finalizada
      };

      destaques.sort((a, b) => weight(a) - weight(b));

      setCampanhas(destaques.slice(0, limitCampanhas));
    } catch (e: any) {
      console.error(e);
      setErro("Não foi possível carregar campanhas.");
      setCampanhas([]);
    } finally {
      setLoadingCampanhas(false);
    }
  }

  async function carregarProdutos() {
    setLoadingProdutos(true);
    try {
      const res = await api.get(produtosDestaqueEndpoint);
      const lista =
        res?.data?.dados?.produtos ??
        res?.data?.dados?.dados ??
        res?.data?.dados ??
        res?.data ??
        [];

      const arr = Array.isArray(lista) ? (lista as ProdutoDestaque[]) : [];
      setProdutos(arr.slice(0, limitProdutos));
    } catch (e: any) {
      console.error(e);
      setErro((prev) => prev || "Não foi possível carregar produtos em destaque.");
      setProdutos([]);
    } finally {
      setLoadingProdutos(false);
    }
  }

  async function carregarTudo() {
    setErro(null);
    setLoading(true);
    try {
      await Promise.all([carregarCampanhas(), carregarProdutos()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasCampanhas = campanhas.length > 0;
  const hasProdutos = produtos.length > 0;

  const campanhasTitleHint = useMemo(() => {
    if (loadingCampanhas) return "Carregando...";
    if (!hasCampanhas) return "Nenhuma campanha em destaque";
    return `${campanhas.length} campanha(s)`;
  }, [loadingCampanhas, hasCampanhas, campanhas.length]);

  const produtosTitleHint = useMemo(() => {
    if (loadingProdutos) return "Carregando...";
    if (!hasProdutos) return "Nenhum produto em destaque";
    return `${produtos.length} produto(s)`;
  }, [loadingProdutos, hasProdutos, produtos.length]);

  return (
    <section className="wrap">
      <div className="topbar">
        <div className="tt">
          <div className="kicker">
            <span className="dot" />
            <span>Destaques</span>
          </div>
          <h2>Vitrine de Destaques</h2>
          <p>Campanhas com <b>statusid = 3</b> ficam verdes (Destaque).</p>
        </div>

        <button
          type="button"
          className="btnGhost"
          onClick={carregarTudo}
          disabled={loading}
          title="Recarregar"
        >
          <FiRefreshCw />
          Atualizar
        </button>
      </div>

      {erro && (
        <div className="alert">
          <FiAlertTriangle />
          <span>{erro}</span>
        </div>
      )}

      {/* CAMPANHAS */}
      <div className="block">
        <div className="blockHead">
          <div className="left">
            <div className="icoBox green">
              <FiStar />
            </div>
            <div>
              <h3>{tituloCampanhas}</h3>
              <span className="hint">{campanhasTitleHint}</span>
            </div>
          </div>
        </div>

        {loadingCampanhas ? (
          <div className="gridCamp">
            {Array.from({ length: Math.min(3, limitCampanhas) }).map((_, i) => (
              <div className="skCard" key={i} />
            ))}
          </div>
        ) : !hasCampanhas ? (
          <div className="empty">
            <div className="eico green">
              <FiStar />
            </div>
            <div>
              <b>Nenhuma campanha em destaque</b>
              <p>Para aparecer aqui, a campanha precisa ter <b>statusid = 3</b>.</p>
            </div>
          </div>
        ) : (
          <div className="gridCamp">
            {campanhas.map((c) => {
              const period = computePeriod(c);
              const statusClass = "destaque"; // ✅ sempre verde (se chegou aqui é statusid 3)

              return (
                <Link key={c.id_campanha} href={campanhaHref(c)} className="campCard">
                  <div className="campTop">
                    <div className={`badge ${statusClass}`}>
                      <FiStar /> Destaque
                    </div>

                    <div className="slug">
                      <FiLink /> /{c.slug}
                    </div>
                  </div>

                  <div className="campTitle">{c.titulo}</div>

                  <div className="campBanner">
                    <FiTag />
                    <span>{c.banner?.trim() ? c.banner : "Sem texto no banner"}</span>
                  </div>

                  <div className="campFoot">
                    <span className={`pill ${period}`}>
                      {period === "ativa"
                        ? "Ativa"
                        : period === "agendada"
                        ? "Agendada"
                        : period === "finalizada"
                        ? "Finalizada"
                        : "Sem período"}
                    </span>

                    <span className="id">ID {c.id_campanha}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* PRODUTOS */}
      <div className="block">
        <div className="blockHead">
          <div className="left">
            <div className="icoBox purple">
              <FiGift />
            </div>
            <div>
              <h3>{tituloProdutos}</h3>
              <span className="hint">{produtosTitleHint}</span>
            </div>
          </div>
        </div>

        {loadingProdutos ? (
          <div className="gridProd">
            {Array.from({ length: Math.min(4, limitProdutos) }).map((_, i) => (
              <div className="skProd" key={i} />
            ))}
          </div>
        ) : !hasProdutos ? (
          <div className="empty">
            <div className="eico purple">
              <FiGift />
            </div>
            <div>
              <b>Nenhum produto em destaque</b>
              <p>Crie destaque usando a rota <b>/admin/produtos/destaques</b>.</p>
            </div>
          </div>
        ) : (
          <div className="gridProd">
            {produtos.map((p) => {
              const img = getImagemUrl(p.imagem);
              const price = formatMoneyBR(p.preco);

              return (
                <Link key={p.id_produto} href={produtoHref(p)} className="prodCard">
                  <div className="thumb">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.nome} />
                    ) : (
                      <div className="noimg">
                        <FiImage />
                      </div>
                    )}

                    <div className="pBadge">
                      <FiStar /> Destaque
                    </div>
                  </div>

                  <div className="pBody">
                    <div className="pName" title={p.nome}>
                      {p.nome}
                    </div>

                    <div className="pMeta">
                      <span className="pid">ID {p.id_produto}</span>
                      {price ? <span className="price">{price}</span> : <span className="price muted">—</span>}
                    </div>

                    <div className="pBtn">
                      Ver produto
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .wrap {
          display: grid;
          gap: 14px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.08);
        }

        .topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .tt h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 950;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .tt p {
          margin: 6px 0 0;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 950;
          color: #334155;
          background: rgba(241, 245, 249, 0.9);
          border: 1px solid rgba(226, 232, 240, 0.9);
          padding: 6px 10px;
          border-radius: 999px;
          width: fit-content;
          margin-bottom: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #6366f1;
          box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.15);
        }

        .btnGhost {
          background: rgba(255, 255, 255, 0.92);
          color: #0f172a;
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 14px;
          padding: 10px 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 950;
          cursor: pointer;
          transition: 0.15s;
          box-shadow: 0 12px 30px rgba(2, 6, 23, 0.06);
        }
        .btnGhost:hover {
          transform: translateY(-1px);
        }
        .btnGhost:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid rgba(254, 202, 202, 0.9);
          background: rgba(254, 226, 226, 0.65);
          color: #7f1d1d;
          font-weight: 900;
          font-size: 13px;
        }

        .block {
          display: grid;
          gap: 12px;
        }

        .blockHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icoBox {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(241, 245, 249, 0.8);
          color: #0f172a;
          box-shadow: 0 16px 40px rgba(2, 6, 23, 0.06);
        }

        .icoBox.green {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.22);
          color: #166534;
        }

        .icoBox.purple {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.22);
          color: #3730a3;
        }

        .blockHead h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 950;
          color: #0f172a;
        }

        .hint {
          display: inline-block;
          margin-top: 3px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(71, 85, 105, 0.9);
        }

        .empty {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 18px;
          border: 1px dashed rgba(148, 163, 184, 0.5);
          background: rgba(248, 250, 252, 0.7);
        }

        .eico {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(241, 245, 249, 0.8);
          font-size: 18px;
        }

        .eico.green {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.22);
          color: #166534;
        }

        .eico.purple {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.22);
          color: #3730a3;
        }

        .empty b {
          color: #0f172a;
        }

        .empty p {
          margin: 6px 0 0;
          color: #475569;
          font-weight: 800;
          font-size: 13px;
        }

        /* grids */
        .gridCamp {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }

        .gridProd {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        /* campanhas card */
        .campCard {
          text-decoration: none;
          color: inherit;
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
          padding: 14px;
          display: grid;
          gap: 10px;
          transition: 0.15s;
        }

        .campCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.1);
        }

        .campTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .badge.destaque {
          background: rgba(34, 197, 94, 0.14);
          border-color: rgba(34, 197, 94, 0.22);
          color: #166534;
        }

        .slug {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(71, 85, 105, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 52%;
        }

        .campTitle {
          font-size: 15px;
          font-weight: 950;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .campBanner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.16);
          color: #14532d;
          font-weight: 900;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .campFoot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 2px;
        }

        .pill {
          font-size: 11px;
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(241, 245, 249, 0.8);
          color: #0f172a;
        }

        .pill.ativa {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.22);
          color: #3730a3;
        }

        .pill.agendada {
          background: rgba(14, 165, 233, 0.12);
          border-color: rgba(14, 165, 233, 0.22);
          color: #075985;
        }

        .pill.finalizada {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.22);
          color: #991b1b;
        }

        .pill.sem-periodo {
          background: rgba(100, 116, 139, 0.12);
          border-color: rgba(100, 116, 139, 0.2);
          color: #334155;
        }

        .id {
          font-size: 11px;
          font-weight: 950;
          color: rgba(71, 85, 105, 0.9);
        }

        /* produtos card */
        .prodCard {
          text-decoration: none;
          color: inherit;
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
          overflow: hidden;
          transition: 0.15s;
          display: grid;
        }

        .prodCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.1);
        }

        .thumb {
          position: relative;
          height: 160px;
          background: rgba(241, 245, 249, 0.9);
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .noimg {
          height: 100%;
          display: grid;
          place-items: center;
          color: rgba(71, 85, 105, 0.7);
          font-size: 22px;
        }

        .pBadge {
          position: absolute;
          left: 10px;
          top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(99, 102, 241, 0.14);
          border: 1px solid rgba(99, 102, 241, 0.22);
          color: #3730a3;
          font-weight: 950;
          font-size: 11px;
          backdrop-filter: blur(10px);
        }

        .pBody {
          padding: 12px;
          display: grid;
          gap: 10px;
        }

        .pName {
          font-size: 13.5px;
          font-weight: 950;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pMeta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(71, 85, 105, 0.9);
        }

        .price {
          color: #0f172a;
          font-weight: 950;
        }

        .price.muted {
          color: rgba(71, 85, 105, 0.7);
          font-weight: 900;
        }

        .pBtn {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          padding: 10px 12px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          font-weight: 950;
        }

        /* skeleton */
        .skCard,
        .skProd {
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: linear-gradient(90deg, #ffffff, #f1f5f9, #ffffff);
          background-size: 200% 100%;
          animation: shimmer 1.1s infinite;
          box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
        }

        .skCard {
          height: 168px;
        }

        .skProd {
          height: 270px;
        }

        @keyframes shimmer {
          0% {
            background-position: 0% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @media (max-width: 720px) {
          .search {
            min-width: 100%;
          }
          .topbar {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </section>
  );
}