"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiEye,
  FiShoppingCart,
  FiTag,
  FiBox,
  FiCheckCircle,
  FiXCircle,
  FiPercent,
  FiSlash,
} from "react-icons/fi";

import api from "@/Api/conectar";
import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

interface Produto {
  id_produto?: number;
  id?: number;

  nome: string;
  descricao?: string;

  preco?: number | string;
  preco_promocional?: number | string;
  parcelamento?: number | string;

  slug?: string;
  imagem: string;

  estoque?: number | string;
  ilimitado?: number | boolean;

  statusid?: number | string; // 1 ativo | 2 inativo | 4 bloqueado
  catalogo?: number | string; // 5 sim | 6 não

  categoria_id?: number | string;
  categoria_nome?: string;
}

const STATUS = {
  ATIVO: 1,
  INATIVO: 2,
  DESTAQUE: 3,
  BLOQUEADO: 4,
  CATALOGO_SIM: 5,
  CATALOGO_NAO: 6,
} as const;

/** ✅ Parse robusto: 23.00, 23,00, 1.234,56, 1234.56 */
function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  if (typeof v === "string") {
    const s0 = v.trim();
    if (!s0) return null;

    const s = s0.replace(/\s/g, "").replace(/[R$\u00A0]/g, "");
    const hasDot = s.includes(".");
    const hasComma = s.includes(",");

    let normalized = s;
    if (hasDot && hasComma) normalized = s.replace(/\./g, "").replace(",", ".");
    else if (hasComma && !hasDot) normalized = s.replace(",", ".");
    else normalized = s;

    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function asInt(v: unknown): number | null {
  const n = parseNumber(v);
  return n === null ? null : Math.trunc(n);
}

function brl(v: unknown): string | null {
  const n = parseNumber(v);
  if (n === null) return null;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatEstoque(estoque: unknown, ilimitado: unknown): { texto: string; semEstoque: boolean } {
  const ilimit =
    ilimitado === true || ilimitado === 1 || ilimitado === "1" || ilimitado === "true";

  if (ilimit) return { texto: "Estoque ilimitado", semEstoque: false };

  const n = asInt(estoque);
  if (n === null) return { texto: "Estoque: —", semEstoque: false };

  if (n <= 0) return { texto: "Sem estoque", semEstoque: true };

  return { texto: `Estoque: ${n}`, semEstoque: false };
}

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const base = "https://lightgrey-cattle-160990.hostingersite.com";

  const placeholderSvg = useMemo(() => {
    const svg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="700">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#9ca3af" font-family="Arial" font-size="28">
          Sem imagem
        </text>
      </svg>
    `);
    return `data:image/svg+xml;charset=utf-8,${svg}`;
  }, []);

  function imgUrl(path: string) {
    const raw = (path || "").trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    const clean = raw.replace(/^\/?upload\//, "").replace(/^\/+/, "");
    return `${base}/upload/${clean}`;
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        const res = await api.get("/catalogo");
        const lista = res.data?.dados?.produtos;

        if (!alive) return;
        setProdutos(Array.isArray(lista) ? lista : []);
      } catch (e) {
        console.error("❌ Erro ao buscar /catalogo:", e);
        if (!alive) return;
        setErro("Não foi possível carregar o catálogo agora.");
        setProdutos([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  function addCarrinho(produto: Produto) {
    console.log("🛒 Carrinho:", produto);
    alert(`Produto adicionado: ${produto.nome}`);
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --brand: #b5486d;
          --brandHover: #9f3d5f;

          --bg: #f7f7f8;
          --card: #ffffff;

          --text: #111827;
          --muted: #6b7280;

          --border: #e5e7eb;

          --shadow: 0 10px 28px rgba(17, 24, 39, 0.08);
          --shadowHover: 0 18px 44px rgba(17, 24, 39, 0.12);

          --radius: 16px;

          /* altura padrão de header (caso o Navbar seja fixed) */
          --header-safe: 76px;
        }

        body {
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        /* ✅ NÃO estilizo nav/header globalmente (pra não quebrar seu Navbar) */

        .siteShell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ✅ garante navbar acima do resto */
        .siteHeader {
          position: relative;
          z-index: 9999;
        }

        /* ✅ se o Navbar for fixed, isso evita ele "sumir" atrás do conteúdo */
        .siteMain {
          flex: 1;
          padding-top: var(--header-safe);
        }

        /* Se seu Navbar NÃO é fixed e fica criando espaço demais,
           troque para 0px aqui:
           .siteMain { padding-top: 0px; }
        */

        .page {
          max-width: 1200px;
          margin: 28px auto 80px;
          padding: 0 16px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 18px;
        }

        .title h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: -0.02em;
        }

        .title p {
          margin: 6px 0 0;
          color: var(--muted);
        }

        .count {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 10px 12px;
          background: #fff;
          color: var(--muted);
          font-size: 13px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--brand);
          box-shadow: 0 0 0 4px rgba(181, 72, 109, 0.14);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
        }

        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          display: flex;
          flex-direction: column;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadowHover);
          border-color: rgba(181, 72, 109, 0.22);
        }

        .media {
          position: relative;
          aspect-ratio: 4 / 3;
          background: #f3f4f6;
          overflow: hidden;
        }

        .media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: scale(1.01);
          transition: transform 0.22s ease;
        }

        .card:hover .media img {
          transform: scale(1.06);
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(17, 24, 39, 0.48), transparent 62%);
          pointer-events: none;
        }

        .badges {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          z-index: 2;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          font-size: 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(229, 231, 235, 0.9);
          color: #374151;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
        }

        .badgeOk {
          border-color: rgba(16, 185, 129, 0.35);
        }
        .badgeNo {
          border-color: rgba(239, 68, 68, 0.35);
        }
        .badgeBrand {
          border-color: rgba(181, 72, 109, 0.35);
        }

        .content {
          padding: 14px 14px 10px;
          flex: 1;
        }

        .name {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }

        .desc {
          margin: 8px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 38px;
        }

        .priceRow {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }

        .priceWrap {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }

        .price {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .old {
          font-size: 13px;
          color: #9ca3af;
          text-decoration: line-through;
          font-weight: 700;
        }

        .installments {
          font-size: 12px;
          color: #6b7280;
          font-weight: 700;
        }

        .meta {
          padding: 12px 14px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #6b7280;
          font-size: 12px;
          background: #fafafa;
        }

        .metaItem {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .metaItem span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .actions {
          padding: 14px;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 10px;
          background: #fff;
        }

        .btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 12px;
          font-size: 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: #fff;
          color: #374151;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
        }

        .btn:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
        }

        .btnPrimary {
          background: var(--brand);
          border-color: var(--brand);
          color: #fff;
        }

        .btnPrimary:hover {
          background: var(--brandHover);
          border-color: var(--brandHover);
        }

        .btnDanger {
          border-color: rgba(239, 68, 68, 0.35);
          color: #991b1b;
          background: rgba(239, 68, 68, 0.06);
        }

        .btnDanger:hover {
          background: rgba(239, 68, 68, 0.10);
          transform: none;
        }

        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .state {
          padding: 12px 14px;
          border: 1px solid rgba(239, 68, 68, 0.25);
          background: rgba(239, 68, 68, 0.06);
          border-radius: var(--radius);
          color: #7f1d1d;
          margin-bottom: 14px;
        }

        .loading {
          color: var(--muted);
          margin: 10px 0 14px;
        }
      `}</style>

      <div className="siteShell">
        <header className="siteHeader">
          <Navbar />
        </header>

        <div className="siteMain">
          <main className="page">
            <div className="header">
              <div className="title">
                <h1>Catálogo</h1>
                <p>Produtos disponíveis na loja</p>
              </div>

              <div className="count">
                <span className="dot" />
                {loading ? "Carregando..." : `${produtos.length} produto(s)`}
              </div>
            </div>

            {erro && <div className="state">❌ {erro}</div>}
            {loading && <p className="loading">Carregando produtos…</p>}

            <section className="grid">
              {!loading &&
                !erro &&
                produtos.map((p, idx) => {
                  const key = p.id_produto ?? p.id ?? idx;

                  const preco = brl(p.preco);
                  const promo = brl(p.preco_promocional);
                  const promoN = parseNumber(p.preco_promocional);
                  const temPromo = promoN !== null && promoN > 0;

                  const catalogoId = asInt(p.catalogo);
                  const statusId = asInt(p.statusid);

                  const noCatalogo = catalogoId === STATUS.CATALOGO_SIM; // 5
                  const ativo = statusId === STATUS.ATIVO; // 1
                  const bloqueado = statusId === STATUS.BLOQUEADO; // 4

                  const { texto: estoqueTexto, semEstoque } = formatEstoque(p.estoque, p.ilimitado);

                  const categoriaTexto =
                    p.categoria_nome?.trim()
                      ? p.categoria_nome
                      : p.categoria_id !== undefined && p.categoria_id !== null
                        ? `Categoria #${p.categoria_id}`
                        : "Sem categoria";

                  const podeComprar = ativo && noCatalogo && !bloqueado && !semEstoque;

                  const href = p.slug ? `/produto/${p.slug}` : "#";

                  return (
                    <article className="card" key={key}>
                      <div className="media">
                        <div className="badges">
                          <span className={`badge ${noCatalogo ? "badgeOk" : "badgeNo"}`}>
                            {noCatalogo ? <FiCheckCircle /> : <FiXCircle />}
                            {noCatalogo ? "No catálogo" : "Fora do catálogo"}
                          </span>

                          <span className={`badge ${ativo && !bloqueado ? "badgeOk" : "badgeNo"}`}>
                            {ativo && !bloqueado ? <FiCheckCircle /> : <FiXCircle />}
                            {ativo ? (bloqueado ? "Bloqueado" : "Ativo") : "Inativo"}
                          </span>

                          {temPromo && (
                            <span className="badge badgeBrand">
                              <FiPercent />
                              Promo
                            </span>
                          )}
                        </div>

                        <div className="overlay" />

                        <img
                          src={imgUrl(p.imagem)}
                          alt={p.nome}
                          loading="lazy"
                          onError={(e) => {
                            const t = e.currentTarget;
                            if (t.src !== placeholderSvg) t.src = placeholderSvg;
                          }}
                        />
                      </div>

                      <div className="content">
                        <h3 className="name">{p.nome}</h3>
                        <p className="desc">{p.descricao || "Sem descrição."}</p>

                        <div className="priceRow">
                          <div className="priceWrap">
                            <span className="price">{temPromo ? promo ?? "—" : preco ?? "—"}</span>
                            {temPromo && preco && <span className="old">{preco}</span>}
                          </div>

                          {p.parcelamento ? (
                            <span className="installments">Até {p.parcelamento}x</span>
                          ) : (
                            <span className="installments">&nbsp;</span>
                          )}
                        </div>
                      </div>

                      <div className="meta">
                        <div className="metaItem" title={estoqueTexto}>
                          <FiBox />
                          <span>{estoqueTexto}</span>
                        </div>

                        <div className="metaItem" title={categoriaTexto}>
                          <FiTag />
                          <span>{categoriaTexto}</span>
                        </div>
                      </div>

                      <div className="actions">
                        {p.slug ? (
                          <Link href={href} className="btn btnPrimary">
                            <FiEye />
                            Ver produto
                          </Link>
                        ) : (
                          <button className="btn btnPrimary" disabled>
                            <FiEye />
                            Ver produto
                          </button>
                        )}

                        {podeComprar ? (
                          <button className="btn" onClick={() => addCarrinho(p)}>
                            <FiShoppingCart />
                            Carrinho
                          </button>
                        ) : (
                          <button className="btn btnDanger" disabled title="Indisponível (catálogo/status/estoque)">
                            <FiSlash />
                            Indisponível
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
            </section>
          </main>
        </div>

        <FooterPrincipal />
      </div>
    </>
  );
}
