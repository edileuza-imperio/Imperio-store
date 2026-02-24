"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { ShoppingCart, ArrowRight, Check, Loader2 } from "lucide-react";

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return "/placeholder.png";
  const base = api.defaults.baseURL || "";
  return `${base.replace(/\/+$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
};

function formatBRL(v: any) {
  const n = Number(v);
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeLista(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.itens)) return payload.itens;
  return [];
}

export default function ProdutoDestaque() {
  const router = useRouter();

  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [addingId, setAddingId] = useState<number | null>(null);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        const res = await api.get(rotas.produtos.destaques.ativos, {
          withCredentials: true,
        });

        const payload = res?.data?.data ?? res?.data?.dados ?? res?.data;
        const lista = normalizeLista(payload);

        if (alive) setItens(lista);
      } catch (e: any) {
        if (alive) {
          setErro(
            e?.response?.data?.mensagem ||
              e?.message ||
              "Erro ao buscar produtos em destaque."
          );
          setItens([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const lista = useMemo(() => itens.slice(0, 8), [itens]);

  async function getUsuarioId(): Promise<number | null> {
    try {
      const meRes = await api.get(rotas.auth.me, { withCredentials: true });
      const payload = meRes?.data?.data ?? meRes?.data?.dados ?? meRes?.data;

      const id =
        payload?.usuario_id ??
        payload?.id ??
        payload?.usuario?.id ??
        payload?.usuario?.usuario_id ??
        payload?.data?.id ??
        payload?.data?.usuario_id;

      const n = Number(id);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }

  async function adicionarAoCarrinho(item: any) {
    const produtoId = Number(item?.produto_id ?? item?.id_produto ?? item?.id ?? 0);
    const precoUnitario = Number(item?.produto_preco ?? item?.preco ?? 0);
    if (!produtoId) return;

    setAddingId(produtoId);

    const usuarioId = await getUsuarioId();
    if (!usuarioId) {
      setAddingId(null);
      router.push("/login");
      return;
    }

    try {
      await api.post(
        "/carrinho/adicionar",
        {
          usuarioId,
          produtoId,
          quantidade: 1,
          precoUnitario: Number.isFinite(precoUnitario) ? precoUnitario : 0,
        },
        { withCredentials: true }
      );

      setAdded((p) => ({ ...p, [produtoId]: true }));
      window.setTimeout(() => {
        setAdded((p) => ({ ...p, [produtoId]: false }));
      }, 1400);
    } finally {
      setAddingId(null);
    }
  }

  return (
    <section className="wrap">
      <div className="container">
        <header className="head">
          <div className="headLeft">
            <span className="kicker">Destaques</span>
            <h2 className="title">Selecionados para você</h2>
            <p className="sub">
              Visual clean, fundo creme e cards com padrão de e-commerce.
            </p>
          </div>

          <Link className="all" href={rotas.produtos.paginas.destaques}>
            Ver todos <ArrowRight size={18} />
          </Link>
        </header>

        {loading && <div className="state">Carregando destaques…</div>}
        {erro && <div className="state err">{erro}</div>}

        {!loading && !erro && lista.length === 0 && (
          <div className="state">Nenhum produto em destaque no momento.</div>
        )}

        {!loading && !erro && lista.length > 0 && (
          <div className="grid">
            {lista.map((p: any, i: number) => {
              const id = Number(p?.produto_id ?? p?.id_produto ?? p?.id ?? i);
              const nome = p?.produto_nome ?? p?.nome ?? "Produto";
              const preco = p?.produto_preco ?? p?.preco ?? 0;
              const slug = p?.produto_slug ?? p?.slug ?? "";
              const imagem = p?.produto_imagem ?? p?.imagem ?? "";
              const desc = p?.produto_descricao ?? p?.descricao ?? "";
              const estoque = Number(p?.estoque ?? 0);
              const ilimitado = Number(p?.ilimitado ?? 0);

              const emEstoque = ilimitado === 1 || estoque > 0;

              const href = slug
                ? rotas.produtos.paginas.produto(slug)
                : rotas.produtos.paginas.destaques;

              const isAdding = addingId === id;
              const isAdded = !!added[id];

              return (
                <article className="card" key={id}>
                  <Link href={href} className="top" aria-label={`Ver ${nome}`}>
                    <div className="imgTile">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getImagemUrl(imagem)} alt={nome} />
                    </div>

                    <div className="meta">
                      <span className={`stock ${emEstoque ? "ok" : "no"}`}>
                        {emEstoque ? "Em estoque" : "Esgotado"}
                      </span>
                      <span className="chip">Em alta</span>
                    </div>

                    <h3 className="name" title={nome}>
                      {nome}
                    </h3>

                    <p className="desc">{desc ? desc : "Produto em destaque selecionado para você."}</p>
                  </Link>

                  <div className="bottom">
                    <div className="priceRow">
                      <div className="price">{formatBRL(preco)}</div>
                      <div className="mini">{emEstoque ? "Pronta entrega" : "Indisponível"}</div>
                    </div>

                    <div className="actions">
                      <Link className="btn ghost" href={href}>
                        Detalhes <ArrowRight size={16} />
                      </Link>

                      <button
                        type="button"
                        className={`btn solid ${isAdded ? "added" : ""}`}
                        onClick={() => adicionarAoCarrinho(p)}
                        disabled={!emEstoque || isAdding}
                      >
                        {isAdding ? (
                          <>
                            <Loader2 size={16} className="spin" />
                            Adicionando
                          </>
                        ) : isAdded ? (
                          <>
                            <Check size={16} />
                            Adicionado
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            Carrinho
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        /* ========= Fundo creme (sem cara de “box branco”) ========= */
        .wrap {
          padding: 64px 0;
          background: radial-gradient(
              900px 420px at 10% 0%,
              rgba(176, 141, 87, 0.16),
              transparent 60%
            ),
            radial-gradient(
              820px 420px at 100% 10%,
              rgba(122, 41, 65, 0.10),
              transparent 62%
            ),
            linear-gradient(180deg, #f8f3ea 0%, #f6efe4 100%);
        }

        .container {
          width: min(1200px, calc(100% - 32px));
          margin: 0 auto;
        }

        /* ========= Header ========= */
        .head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .kicker {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          font-weight: 950;
          font-size: 0.8rem;
          color: #7a2941;
          background: rgba(122, 41, 65, 0.10);
          border: 1px solid rgba(122, 41, 65, 0.14);
        }

        .title {
          margin: 10px 0 6px;
          font-size: clamp(1.9rem, 2.4vw, 2.35rem);
          font-weight: 950;
          letter-spacing: -0.03em;
          color: #0b1220;
        }

        .sub {
          margin: 0;
          color: rgba(11, 18, 32, 0.70);
          line-height: 1.55;
          max-width: 70ch;
        }

        .all {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 950;
          color: #0b1220;
          background: rgba(255, 250, 242, 0.82);
          border: 1px solid rgba(11, 18, 32, 0.10);
          box-shadow: 0 12px 28px rgba(11, 18, 32, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }
        .all:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(11, 18, 32, 0.09);
        }

        .state {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255, 250, 242, 0.82);
          border: 1px solid rgba(11, 18, 32, 0.08);
          color: rgba(11, 18, 32, 0.78);
          font-weight: 950;
        }
        .state.err {
          background: rgba(122, 41, 65, 0.08);
          border-color: rgba(122, 41, 65, 0.18);
          color: #7a2941;
        }

        /* ========= Grid ========= */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }

        /* ========= Card (ecommerce premium) ========= */
        .card {
          border-radius: 18px;
          overflow: hidden;
          background: rgba(255, 250, 242, 0.92);
          border: 1px solid rgba(11, 18, 32, 0.10);
          box-shadow: 0 12px 32px rgba(11, 18, 32, 0.08);
          transition: transform 0.2s ease, box-shadow 0.25s ease;
          display: grid;
          grid-template-rows: 1fr auto;
        }
        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 54px rgba(11, 18, 32, 0.12);
        }

        .top {
          padding: 14px;
          display: grid;
          gap: 10px;
          text-decoration: none;
          color: inherit;
        }

        /* tile creme + borda leve = padrão ecommerce */
        .imgTile {
          height: 210px;
          border-radius: 14px;
          background: linear-gradient(180deg, #f2e7d7, #f8f3ea);
          border: 1px solid rgba(11, 18, 32, 0.08);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .imgTile img {
          width: 88%;
          height: 88%;
          object-fit: contain;
          transition: transform 0.35s ease, filter 0.35s ease;
          filter: saturate(1.02);
        }

        .card:hover .imgTile img {
          transform: scale(1.05);
          filter: saturate(1.06) brightness(1.02);
        }

        .meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .stock {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 950;
          background: rgba(255, 250, 242, 0.90);
          border: 1px solid rgba(11, 18, 32, 0.10);
          color: rgba(11, 18, 32, 0.84);
        }
        .stock.ok {
          border-color: rgba(34, 197, 94, 0.35);
        }
        .stock.no {
          border-color: rgba(220, 38, 38, 0.35);
          color: #7f1d1d;
        }

        .chip {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 950;
          background: rgba(176, 141, 87, 0.16);
          border: 1px solid rgba(176, 141, 87, 0.28);
          color: #0b1220;
          white-space: nowrap;
        }

        .name {
          margin: 0;
          font-size: 1.02rem;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #0b1220;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .desc {
          margin: 0;
          font-size: 0.86rem;
          color: rgba(11, 18, 32, 0.70);
          line-height: 1.25rem;
          min-height: 42px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .bottom {
          padding: 14px;
          border-top: 1px solid rgba(11, 18, 32, 0.08);
          background: rgba(248, 243, 234, 0.70);
        }

        .priceRow {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .price {
          font-size: 1.18rem;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #7a2941;
        }

        .mini {
          font-size: 0.78rem;
          font-weight: 900;
          color: rgba(11, 18, 32, 0.58);
          white-space: nowrap;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 10px;
        }

        /* botões com padrão ecommerce */
        .btn {
          height: 44px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 950;
          cursor: pointer;
          user-select: none;
          outline: none;
          width: 100%;
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.22s ease, filter 0.22s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
        }

        .ghost {
          background: rgba(255, 250, 242, 0.88);
          border: 1px solid rgba(11, 18, 32, 0.12);
          color: #0b1220;
        }

        .solid {
          border: none;
          color: #fff;
          background: linear-gradient(135deg, #0b1220, #1f2937);
          box-shadow: 0 14px 30px rgba(11, 18, 32, 0.18);
        }
        .solid:hover {
          box-shadow: 0 18px 40px rgba(11, 18, 32, 0.22);
          filter: brightness(1.02);
        }

        .solid.added {
          background: linear-gradient(135deg, #166534, #22c55e);
          box-shadow: 0 14px 30px rgba(22, 101, 52, 0.18);
        }

        .btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spin {
          animation: sp 0.9s linear infinite;
        }
        @keyframes sp {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 520px) {
          .actions {
            grid-template-columns: 1fr;
          }
          .imgTile {
            height: 200px;
          }
        }
      `}</style>
    </section>
  );
}