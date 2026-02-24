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

// deixa tudo padronizado independente do nome das colunas que vierem
function mapProduto(p: any) {
  const id = Number(p?.produto_id ?? p?.id_produto ?? p?.id ?? 0);
  const nome = String(p?.produto_nome ?? p?.nome ?? "Produto");
  const descricao = String(p?.produto_descricao ?? p?.descricao ?? "");
  const preco = Number(p?.produto_preco ?? p?.preco ?? p?.preco_promocional ?? 0);
  const slug = String(p?.produto_slug ?? p?.slug ?? "");
  const imagem = String(p?.produto_imagem ?? p?.imagem ?? "");
  const estoque = Number(p?.estoque ?? p?.produto_estoque ?? 0);
  const ilimitado = Number(p?.ilimitado ?? p?.produto_ilimitado ?? 0);

  const emEstoque = ilimitado === 1 || estoque > 0;

  return { id, nome, descricao, preco, slug, imagem, estoque, ilimitado, emEstoque, raw: p };
}

function clampText(text: string, max = 80) {
  const s = (text || "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
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

  const lista = useMemo(() => itens.slice(0, 8).map(mapProduto), [itens]);

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

  async function adicionarAoCarrinho(itemRaw: any, produtoId: number, precoUnitario: number) {
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
        { usuarioId, produtoId, quantidade: 1, precoUnitario: Number.isFinite(precoUnitario) ? precoUnitario : 0 },
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
          <div>
            <span className="kicker">Destaques</span>
            <h2 className="title">Selecionados para você</h2>
            <p className="sub">Vitrine compacta, alinhada e com foco em compra.</p>
          </div>

          <Link className="all" href={rotas.produtos.paginas.destaques}>
            Ver todos <ArrowRight size={18} />
          </Link>
        </header>

        {loading && <div className="state">Carregando destaques…</div>}
        {erro && <div className="state err">{erro}</div>}

        {!loading && !erro && lista.length === 0 && (
          <div className="state">Nenhum destaque no momento.</div>
        )}

        {!loading && !erro && lista.length > 0 && (
          <div className="grid">
            {lista.map((p) => {
              const href = p.slug
                ? rotas.produtos.paginas.produto(p.slug)
                : rotas.produtos.paginas.destaques;

              const isAdding = addingId === p.id;
              const isAdded = !!added[p.id];

              return (
                <article className="card" key={p.id}>
                  <Link href={href} className="top" aria-label={`Ver ${p.nome}`}>
                    <div className="imgTile">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getImagemUrl(p.imagem)} alt={p.nome} />
                    </div>

                    <div className="meta">
                      <span className={`badge ${p.emEstoque ? "ok" : "no"}`}>
                        {p.emEstoque ? "Em estoque" : "Esgotado"}
                      </span>

                      <span className="chip">Em alta</span>
                    </div>

                    <h3 className="name" title={p.nome}>{p.nome}</h3>
                    <p className="desc">
                      {p.descricao ? clampText(p.descricao, 84) : "Produto em destaque selecionado para você."}
                    </p>
                  </Link>

                  <div className="bottom">
                    <div className="priceRow">
                      <div className="price">{formatBRL(p.preco)}</div>
                      <div className="mini">{p.emEstoque ? "Pronta entrega" : "Indisponível"}</div>
                    </div>

                    <div className="actions">
                      <Link className="btn ghost" href={href}>
                        Detalhes <ArrowRight size={16} />
                      </Link>

                      <button
                        type="button"
                        className={`btn solid ${isAdded ? "added" : ""}`}
                        onClick={() => adicionarAoCarrinho(p.raw, p.id, p.preco)}
                        disabled={!p.emEstoque || isAdding}
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
        /* fundo creme */
        .wrap {
          padding: 44px 0;
          background: linear-gradient(180deg, #f8f3ea 0%, #f6efe4 100%);
        }
        .container {
          width: min(1200px, calc(100% - 28px));
          margin: 0 auto;
        }

        /* header menor e mais alinhado */
        .head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .kicker {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 950;
          font-size: 0.78rem;
          color: #7a2941;
          background: rgba(122, 41, 65, 0.10);
          border: 1px solid rgba(122, 41, 65, 0.14);
        }
        .title {
          margin: 8px 0 4px;
          font-size: clamp(1.5rem, 2vw, 2rem);
          font-weight: 950;
          letter-spacing: -0.03em;
          color: #0b1220;
        }
        .sub {
          margin: 0;
          color: rgba(11, 18, 32, 0.68);
          line-height: 1.5;
        }
        .all {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 950;
          color: #0b1220;
          background: rgba(255, 250, 242, 0.85);
          border: 1px solid rgba(11, 18, 32, 0.10);
          box-shadow: 0 10px 22px rgba(11, 18, 32, 0.06);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          white-space: nowrap;
        }
        .all:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(11, 18, 32, 0.08);
        }

        .state {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255, 250, 242, 0.85);
          border: 1px solid rgba(11, 18, 32, 0.08);
          color: rgba(11, 18, 32, 0.78);
          font-weight: 900;
        }
        .state.err {
          background: rgba(122, 41, 65, 0.08);
          border-color: rgba(122, 41, 65, 0.18);
          color: #7a2941;
        }

        /* grid com cards mais “magros” e alinhados */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 14px;
        }

        /* card compacto */
        .card {
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 250, 242, 0.95);
          border: 1px solid rgba(11, 18, 32, 0.10);
          box-shadow: 0 10px 22px rgba(11, 18, 32, 0.07);
          transition: transform 0.18s ease, box-shadow 0.22s ease;
          display: grid;
          grid-template-rows: 1fr auto;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 38px rgba(11, 18, 32, 0.11);
        }

        .top {
          padding: 12px;
          display: grid;
          gap: 8px;
          text-decoration: none;
          color: inherit;
        }

        /* IMAGEM COM ALTURA FIXA (evita ficar “gordo” e desigual) */
        .imgTile {
          height: 170px;
          border-radius: 12px;
          background: linear-gradient(180deg, #f2e7d7, #f8f3ea);
          border: 1px solid rgba(11, 18, 32, 0.08);
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .imgTile img {
          width: 86%;
          height: 86%;
          object-fit: contain;
          transition: transform 0.28s ease;
        }
        .card:hover .imgTile img {
          transform: scale(1.04);
        }

        .meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .badge {
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 950;
          background: rgba(255, 250, 242, 0.95);
          border: 1px solid rgba(11, 18, 32, 0.12);
          color: rgba(11, 18, 32, 0.86);
        }
        .badge.ok {
          border-color: rgba(34, 197, 94, 0.35);
        }
        .badge.no {
          border-color: rgba(220, 38, 38, 0.35);
          color: #7f1d1d;
        }
        .chip {
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 950;
          background: rgba(176, 141, 87, 0.16);
          border: 1px solid rgba(176, 141, 87, 0.28);
          color: #0b1220;
          white-space: nowrap;
        }

        .name {
          margin: 0;
          font-size: 0.98rem;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #0b1220;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* clamp + altura mínima fixa = cards iguais */
        .desc {
          margin: 0;
          font-size: 0.84rem;
          color: rgba(11, 18, 32, 0.70);
          line-height: 1.22rem;
          min-height: 40px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .bottom {
          padding: 12px;
          border-top: 1px solid rgba(11, 18, 32, 0.08);
          background: rgba(248, 243, 234, 0.70);
        }

        .priceRow {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .price {
          font-size: 1.06rem;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #7a2941;
        }

        .mini {
          font-size: 0.76rem;
          font-weight: 900;
          color: rgba(11, 18, 32, 0.58);
          white-space: nowrap;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 10px;
        }

        .btn {
          height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-weight: 950;
          cursor: pointer;
          user-select: none;
          outline: none;
          width: 100%;
          text-decoration: none;
          transition: transform 0.16s ease, box-shadow 0.2s ease, filter 0.2s ease;
          font-size: 0.92rem;
        }
        .btn:hover {
          transform: translateY(-2px);
        }

        .ghost {
          background: rgba(255, 250, 242, 0.90);
          border: 1px solid rgba(11, 18, 32, 0.12);
          color: #0b1220;
        }

        .solid {
          border: none;
          color: #fff;
          background: linear-gradient(135deg, #0b1220, #1f2937);
          box-shadow: 0 12px 24px rgba(11, 18, 32, 0.16);
        }
        .solid:hover {
          box-shadow: 0 16px 32px rgba(11, 18, 32, 0.20);
          filter: brightness(1.02);
        }

        .solid.added {
          background: linear-gradient(135deg, #166534, #22c55e);
          box-shadow: 0 12px 24px rgba(22, 101, 52, 0.16);
        }

        .btn:disabled {
          opacity: 0.60;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spin {
          animation: sp 0.9s linear infinite;
        }
        @keyframes sp {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 520px) {
          .actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}