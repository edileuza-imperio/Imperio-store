"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { rotas } from "@/config/rotas";
import {
  ShoppingCart,
  ArrowRight,
  BadgeCheck,
  Truck,
  Check,
  Loader2,
  Flame,
} from "lucide-react";

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

        const lista =
          Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.dados)
            ? payload.dados
            : Array.isArray(payload?.itens)
            ? payload.itens
            : [];

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
    const produtoId = Number(
      item?.produto_id ?? item?.id_produto ?? item?.id ?? 0
    );
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
    <section className="pdWrap">
      <div className="pdContainer">
        <header className="pdHead">
          <div>
            <div className="pdKicker">
              <Flame size={16} />
              Em destaque
            </div>
            <h2 className="pdTitle">Selecionados para você</h2>
            <p className="pdSub">
              Produtos com alta procura, curadoria e pronta entrega.
            </p>
          </div>

          <Link className="pdAll" href={rotas.produtos.paginas.destaques}>
            Ver todos <ArrowRight size={18} />
          </Link>
        </header>

        {loading && <div className="pdHint">Carregando destaques…</div>}
        {erro && <div className="pdError">{erro}</div>}

        {!loading && !erro && lista.length === 0 && (
          <div className="pdHint">Nenhum produto em destaque no momento.</div>
        )}

        {!loading && !erro && lista.length > 0 && (
          <div className="pdGrid">
            {lista.map((p: any, i: number) => {
              const id = Number(p?.produto_id ?? p?.id_produto ?? p?.id ?? i);
              const nome = p?.produto_nome ?? p?.nome ?? "Produto";
              const preco = p?.produto_preco ?? p?.preco ?? 0;
              const slug = p?.produto_slug ?? p?.slug ?? "";
              const imagem = p?.produto_imagem ?? p?.imagem ?? "";
              const desc = p?.produto_descricao ?? p?.descricao ?? "";
              const estoque = Number(p?.estoque ?? p?.produto_estoque ?? 0);
              const ilimitado = Number(p?.ilimitado ?? p?.produto_ilimitado ?? 0);

              const emEstoque = ilimitado === 1 || estoque > 0;

              const href = slug
                ? rotas.produtos.paginas.produto(slug)
                : rotas.produtos.paginas.destaques;

              const isAdding = addingId === id;
              const isAdded = !!added[id];

              return (
                <article className="card" key={id}>
                  {/* parte clicável (imagem + info) */}
                  <Link href={href} className="cardTop" aria-label={`Ver ${nome}`}>
                    <div className="imgWrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getImagemUrl(imagem)} alt={nome} />
                    </div>

                    <div className="badgeRow">
                      <span className={`stock ${emEstoque ? "ok" : "no"}`}>
                        {emEstoque ? "Em estoque" : "Esgotado"}
                      </span>

                      <span className="trust">
                        <BadgeCheck size={14} /> Curado
                      </span>
                    </div>

                    <h3 className="name" title={nome}>
                      {nome}
                    </h3>

                    <p className="desc">
                      {desc
                        ? String(desc).slice(0, 92) +
                          (String(desc).length > 92 ? "…" : "")
                        : "Produto em destaque selecionado para você."}
                    </p>
                  </Link>

                  {/* preço + ações */}
                  <div className="cardBottom">
                    <div className="priceRow">
                      <div className="price">{formatBRL(preco)}</div>
                      <div className="mini">
                        <Truck size={14} /> pronta entrega
                      </div>
                    </div>

                    <div className="actions">
                      <Link className="btn btnGhost" href={href}>
                        Detalhes <ArrowRight size={16} />
                      </Link>

                      <button
                        type="button"
                        className={`btn btnSolid ${isAdded ? "added" : ""}`}
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
        /* fundo creme com brilho leve */
        .pdWrap {
          padding: 56px 0;
          background: #f8f3ea;
          position: relative;
          overflow: hidden;
        }
        .pdWrap::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
              900px 420px at 0% 0%,
              rgba(176, 141, 87, 0.22),
              transparent 60%
            ),
            radial-gradient(
              800px 420px at 100% 10%,
              rgba(122, 41, 65, 0.12),
              transparent 62%
            );
          pointer-events: none;
        }

        .pdContainer {
          position: relative;
          width: min(1200px, calc(100% - 36px));
          margin: 0 auto;
        }

        .pdHead {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .pdKicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 950;
          font-size: 0.82rem;
          color: #7a2941;
          background: rgba(122, 41, 65, 0.1);
          border: 1px solid rgba(122, 41, 65, 0.16);
          width: fit-content;
        }

        .pdTitle {
          margin: 10px 0 6px;
          font-size: clamp(1.8rem, 2.5vw, 2.35rem);
          font-weight: 950;
          letter-spacing: -0.03em;
          color: #0b1220;
        }

        .pdSub {
          margin: 0;
          color: rgba(11, 18, 32, 0.7);
          max-width: 70ch;
          line-height: 1.55;
        }

        .pdAll {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 950;
          color: #fff;
          background: linear-gradient(135deg, #0b1220, #1f2937);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.14);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }
        .pdAll:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 52px rgba(0, 0, 0, 0.18);
        }

        .pdHint {
          padding: 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(0, 0, 0, 0.06);
          color: rgba(11, 18, 32, 0.82);
          font-weight: 900;
          backdrop-filter: blur(10px);
        }

        .pdError {
          padding: 14px;
          border-radius: 16px;
          background: rgba(122, 41, 65, 0.08);
          border: 1px solid rgba(122, 41, 65, 0.18);
          color: #7a2941;
          font-weight: 950;
        }

        .pdGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 18px;
          align-items: stretch;
        }

        /* CARD PROFISSIONAL */
        .card {
          border-radius: 22px;
          overflow: hidden;
          background: rgba(255, 250, 242, 0.88);
          border: 1px solid rgba(11, 18, 32, 0.08);
          box-shadow: 0 18px 60px rgba(11, 18, 32, 0.09);
          transition: transform 0.2s ease, box-shadow 0.25s ease;
          display: grid;
          grid-template-rows: 1fr auto;
        }

        /* borda premium */
        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 22px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(122, 41, 65, 0.35),
            rgba(176, 141, 87, 0.30),
            rgba(11, 18, 32, 0.10)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0.9;
        }

        .card {
          position: relative;
        }

        .card:hover {
          transform: translateY(-7px);
          box-shadow: 0 28px 88px rgba(11, 18, 32, 0.14);
        }

        .cardTop {
          display: grid;
          gap: 10px;
          padding: 14px;
          text-decoration: none;
          color: inherit;
          position: relative;
          z-index: 1;
        }

        .imgWrap {
          height: 190px;
          border-radius: 18px;
          background: linear-gradient(
            180deg,
            rgba(176, 141, 87, 0.14),
            rgba(176, 141, 87, 0.02)
          );
          border: 1px solid rgba(11, 18, 32, 0.08);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .imgWrap img {
          width: 86%;
          height: 86%;
          object-fit: contain;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          padding: 10px;
          transition: transform 0.35s ease, filter 0.35s ease;
        }

        .card:hover .imgWrap img {
          transform: scale(1.06);
          filter: saturate(1.06) brightness(1.02);
        }

        .badgeRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .stock {
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 950;
          border: 1px solid rgba(11, 18, 32, 0.10);
          backdrop-filter: blur(8px);
        }
        .stock.ok {
          background: rgba(34, 197, 94, 0.14);
          color: #0b1220;
        }
        .stock.no {
          background: rgba(220, 38, 38, 0.12);
          color: #7f1d1d;
        }

        .trust {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 950;
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(11, 18, 32, 0.10);
          color: rgba(11, 18, 32, 0.9);
        }

        .name {
          margin: 0;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #0b1220;
          font-size: 1.02rem;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .desc {
          margin: 0;
          color: rgba(11, 18, 32, 0.72);
          line-height: 1.25rem;
          font-size: 0.86rem;
          min-height: 44px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cardBottom {
          padding: 14px;
          border-top: 1px solid rgba(11, 18, 32, 0.08);
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 1;
        }

        .priceRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .price {
          font-weight: 950;
          color: #7a2941;
          font-size: 1.14rem;
          letter-spacing: -0.02em;
        }

        .mini {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 950;
          color: rgba(11, 18, 32, 0.66);
          white-space: nowrap;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 10px;
        }

        .btn {
          height: 44px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 950;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.22s ease,
            filter 0.22s ease;
          user-select: none;
          outline: none;
          width: 100%;
          text-decoration: none;
          border: 1px solid rgba(11, 18, 32, 0.10);
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btnGhost {
          background: rgba(255, 255, 255, 0.55);
          color: #0b1220;
        }

        .btnSolid {
          border: none;
          color: #fff;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          box-shadow: 0 16px 42px rgba(122, 41, 65, 0.22);
        }

        .btnSolid:hover {
          box-shadow: 0 24px 62px rgba(122, 41, 65, 0.32);
          filter: brightness(1.02);
        }

        .btnSolid.added {
          background: linear-gradient(135deg, #166534, #22c55e);
          box-shadow: 0 16px 42px rgba(34, 197, 94, 0.22);
        }

        .btn:disabled {
          opacity: 0.7;
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
        }
      `}</style>
    </section>
  );
}