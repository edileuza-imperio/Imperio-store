"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { useProdutoDestaque } from "@/hooks/produto/useProdutoDestaque";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  Star,
  Eye,
  ShoppingCart,
  Loader2,
  Check,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return "/placeholder.png";
  const base = api.defaults.baseURL || "";
  return `${base.replace(/\/+$/, "")}/${caminho.replace(/^\/+/, "")}`;
};

function formatBRL(v: any) {
  const n = Number(v);
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function SkeletonCard() {
  return (
    <div className="impCard impCard--sk">
      <div className="impCard__media">
        <div className="impSk impSk--img" />
      </div>
      <div className="impCard__body">
        <div className="impSk impSk--t" />
        <div className="impSk impSk--l" />
        <div className="impSk impSk--l sm" />
        <div className="impSk impSk--b" />
      </div>

      <style jsx>{`
        .impCard--sk {
          pointer-events: none;
        }
        .impSk {
          border-radius: 14px;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.06),
            rgba(0, 0, 0, 0.10),
            rgba(0, 0, 0, 0.06)
          );
          background-size: 220% 100%;
          animation: sh 1.05s linear infinite;
        }
        .impSk--img {
          height: 180px;
          width: 100%;
          border-radius: 18px;
        }
        .impSk--t {
          height: 16px;
          width: 70%;
          margin: 14px 0 10px;
        }
        .impSk--l {
          height: 10px;
          width: 100%;
          margin-bottom: 8px;
        }
        .impSk--l.sm {
          width: 80%;
        }
        .impSk--b {
          height: 44px;
          width: 100%;
          margin-top: 14px;
        }
        @keyframes sh {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: -220% 0%;
          }
        }
      `}</style>
    </div>
  );
}

export default function ProdutoDestaque() {
  const router = useRouter();
  const { destaques, loading, error } = useProdutoDestaque();

  const [addingId, setAddingId] = useState<number | null>(null);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  if (error) return null;

  const LIMITE = 8;
  const lista = useMemo(() => (destaques || []).slice(0, LIMITE), [destaques]);
  const mostrarVerTodos = (destaques?.length || 0) > LIMITE;

  async function getUsuarioId(): Promise<number | null> {
    try {
      const meRes = await api.get("/me", { withCredentials: true });
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
      item?.produto_id ?? item?.id_produto ?? item?.produtoId ?? item?.id
    );
    const precoUnitario = Number(item?.produto_preco ?? item?.preco ?? 0);

    if (!Number.isFinite(produtoId) || produtoId <= 0) {
      toast.error("Produto inválido.");
      return;
    }

    setAddingId(produtoId);

    const usuarioId = await getUsuarioId();
    if (!usuarioId) {
      setAddingId(null);
      toast.info("Faça login para adicionar ao carrinho.");
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

      toast.success(
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 900 }}>Adicionado ao carrinho</div>
          <div style={{ opacity: 0.9, fontSize: 13 }}>
            Você pode finalizar quando quiser.
          </div>
        </div>
      );

      window.setTimeout(() => {
        setAdded((p) => ({ ...p, [produtoId]: false }));
      }, 1500);
    } catch (e: any) {
      const msg =
        e?.response?.data?.mensagem ||
        e?.message ||
        "Erro ao adicionar no carrinho.";
      toast.error(String(msg));
    } finally {
      setAddingId(null);
    }
  }

  return (
    <section className="impWrap">
      <ToastContainer
        position="top-right"
        autoClose={2400}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />

      <div className="impContainer">
        {/* HEADER */}
        <div className="impHead">
          <div className="impHead__left">
            <div className="impKicker">
              <Sparkles size={16} />
              Vitrine Premium
            </div>

            <h2 className="impTitle">Destaques selecionados</h2>
            <p className="impSub">
              Curadoria com acabamento superior — escolha com confiança e compre
              em segundos.
            </p>

            <div className="impTrust">
              <span className="impTrust__pill">
                <ShieldCheck size={16} /> Compra segura
              </span>
              <span className="impTrust__pill">
                <BadgeCheck size={16} /> Produtos selecionados
              </span>
            </div>
          </div>

          {mostrarVerTodos && (
            <Link href="/produtos/destaques" className="impAll">
              Ver todos <ArrowRight size={18} />
            </Link>
          )}
        </div>

        {/* GRID */}
        <div className="impGrid">
          {/* Editorial */}
          <aside className="impEditorial">
            <div className="impEditorial__top">
              <div className="impEditorial__icon">
                <Sparkles size={22} />
              </div>
              <div className="impEditorial__chip">Curadoria Império</div>
            </div>

            <h3 className="impEditorial__title">Elegância pronta para você</h3>
            <p className="impEditorial__text">
              Destaques com visual marcante e excelente custo-benefício.
            </p>

            <div className="impEditorial__bullets">
              <span>✓ Seleção exclusiva</span>
              <span>✓ Qualidade premium</span>
              <span>✓ Compra rápida</span>
            </div>

            <Link href="/produtos/destaques" className="impEditorial__cta">
              Explorar destaques <ArrowRight size={18} />
            </Link>

            <div className="impEditorial__glow" />
          </aside>

          {/* Cards */}
          <div className="impCards">
            {loading ? (
              Array.from({ length: LIMITE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            ) : (
              <>
                {lista.map((item: any) => {
                  const produtoId = Number(
                    item?.produto_id ??
                      item?.id_produto ??
                      item?.produtoId ??
                      item?.id
                  );
                  const isAdding = addingId === produtoId;
                  const isAdded = !!added[produtoId];

                  return (
                    <article className="impCard" key={item.id_destaque ?? produtoId}>
                      <div className="impBadge">
                        <Star size={14} />
                        Destaque
                      </div>

                      <Link
                        href={`/produto/${item.produto_slug}`}
                        className="impCard__media"
                        aria-label={`Ver ${item.produto_nome}`}
                      >
                        <div className="impImgPlate">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImagemUrl(item.produto_imagem)}
                            alt={item.produto_nome}
                            loading="lazy"
                          />
                        </div>

                        <div className="impHover">
                          <span className="impHover__pill">
                            <Eye size={16} /> Ver detalhes
                          </span>
                        </div>
                      </Link>

                      <div className="impCard__body">
                        <h4 className="impName" title={item.produto_nome}>
                          {item.produto_nome}
                        </h4>

                        <p className="impDesc">
                          {item.produto_descricao
                            ? item.produto_descricao.slice(0, 70) + "…"
                            : "Destaque selecionado com acabamento premium."}
                        </p>

                        <div className="impMeta">
                          <div className="impPrice">{formatBRL(item.produto_preco)}</div>
                          <div className="impTag">Em alta</div>
                        </div>

                        <div className="impActions">
                          <Link
                            href={`/produto/${item.produto_slug}`}
                            className="impBtn impBtn--ghost"
                          >
                            <Eye size={16} />
                            Ver produto
                          </Link>

                          <button
                            type="button"
                            className={`impBtn impBtn--solid ${isAdded ? "ok" : ""}`}
                            onClick={() => adicionarAoCarrinho(item)}
                            disabled={isAdding}
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
                                Adicionar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ==== container ==== */
        .impWrap {
          padding: 34px 0;
          position: relative;
        }
        .impWrap::before {
          content: "";
          position: absolute;
          inset: -40%;
          background: radial-gradient(
              900px 380px at 15% 5%,
              rgba(176, 141, 87, 0.22),
              transparent 60%
            ),
            radial-gradient(
              760px 340px at 92% 10%,
              rgba(122, 41, 65, 0.18),
              transparent 58%
            ),
            radial-gradient(
              620px 300px at 70% 85%,
              rgba(17, 24, 39, 0.14),
              transparent 60%
            );
          filter: blur(14px);
          pointer-events: none;
          z-index: 0;
        }

        .impContainer {
          position: relative;
          z-index: 1;
          width: min(1180px, 100%);
          margin: 0 auto;
          padding: 22px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(17, 24, 39, 0.08);
          box-shadow: 0 24px 80px rgba(17, 24, 39, 0.10);
        }

        /* ==== head ==== */
        .impHead {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .impKicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 0.82rem;
          color: #7a2941;
          background: rgba(122, 41, 65, 0.10);
          border: 1px solid rgba(122, 41, 65, 0.14);
          width: fit-content;
        }

        .impTitle {
          margin: 10px 0 6px;
          font-size: clamp(1.6rem, 2.6vw, 2.2rem);
          font-weight: 1100;
          letter-spacing: -0.03em;
          color: #0b1220;
        }

        .impSub {
          margin: 0;
          max-width: 68ch;
          color: rgba(11, 18, 32, 0.70);
          line-height: 1.5;
        }

        .impTrust {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .impTrust__pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(11, 18, 32, 0.04);
          border: 1px solid rgba(11, 18, 32, 0.08);
          font-weight: 900;
          color: rgba(11, 18, 32, 0.78);
          font-size: 0.88rem;
        }

        .impAll {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 999px;
          color: #fff;
          text-decoration: none;
          font-weight: 1000;
          background: linear-gradient(135deg, #0b1220, #1f2937);
          box-shadow: 0 14px 42px rgba(17, 24, 39, 0.18);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }
        .impAll:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 58px rgba(17, 24, 39, 0.22);
        }

        /* ==== layout grid ==== */
        .impGrid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 16px;
          align-items: stretch;
        }

        /* ==== editorial ==== */
        .impEditorial {
          border-radius: 22px;
          padding: 18px;
          color: #fff;
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, #0b1220 0%, #7a2941 55%, #b08d57 120%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 18px 60px rgba(122, 41, 65, 0.18);
          min-height: 100%;
        }

        .impEditorial__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          position: relative;
          z-index: 2;
          margin-bottom: 12px;
        }

        .impEditorial__icon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .impEditorial__chip {
          font-size: 0.78rem;
          font-weight: 1000;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .impEditorial__title {
          position: relative;
          z-index: 2;
          margin: 10px 0 8px;
          font-size: 1.25rem;
          font-weight: 1100;
          letter-spacing: -0.02em;
        }

        .impEditorial__text {
          position: relative;
          z-index: 2;
          margin: 0 0 14px;
          opacity: 0.92;
          line-height: 1.35rem;
          font-size: 0.95rem;
        }

        .impEditorial__bullets {
          position: relative;
          z-index: 2;
          display: grid;
          gap: 6px;
          margin-bottom: 16px;
          font-weight: 900;
          opacity: 0.95;
        }

        .impEditorial__cta {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          height: 46px;
          border-radius: 16px;
          color: #0b1220;
          background: #fff;
          text-decoration: none;
          font-weight: 1100;
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .impEditorial__cta:hover {
          transform: translateY(-2px);
          filter: brightness(0.98);
        }

        .impEditorial__glow {
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 60%);
          transform: rotate(18deg);
          z-index: 1;
        }

        /* ==== cards grid ==== */
        .impCards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          align-content: start;
        }

        /* ==== card ==== */
        .impCard {
          position: relative;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.90);
          border: 1px solid rgba(11, 18, 32, 0.08);
          box-shadow: 0 14px 44px rgba(11, 18, 32, 0.08);
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 340px;
        }
        .impCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 26px 74px rgba(11, 18, 32, 0.14);
        }

        .impBadge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          color: #fff;
          font-size: 0.74rem;
          font-weight: 1100;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 12px 34px rgba(122, 41, 65, 0.18);
        }

        .impCard__media {
          position: relative;
          display: block;
          text-decoration: none;
          padding: 12px;
          background: radial-gradient(360px 170px at 30% 20%, rgba(176, 141, 87, 0.16), transparent 55%),
            radial-gradient(340px 160px at 80% 10%, rgba(122, 41, 65, 0.12), transparent 55%),
            rgba(11, 18, 32, 0.02);
          border-bottom: 1px solid rgba(11, 18, 32, 0.06);
        }

        .impImgPlate {
          height: 170px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(11, 18, 32, 0.06);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .impImgPlate img {
          width: 86%;
          height: 86%;
          object-fit: contain;
          transition: transform 0.35s ease, filter 0.35s ease;
          filter: saturate(1.02);
        }

        .impCard:hover .impImgPlate img {
          transform: scale(1.08);
          filter: saturate(1.06) brightness(1.02);
        }

        .impHover {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          opacity: 0;
          transition: opacity 0.18s ease;
          pointer-events: none;
          background: radial-gradient(circle, rgba(11,18,32,0.10), rgba(11,18,32,0.00) 60%);
        }
        .impCard:hover .impHover {
          opacity: 1;
        }

        .impHover__pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(11, 18, 32, 0.10);
          box-shadow: 0 18px 60px rgba(11, 18, 32, 0.16);
          font-weight: 1100;
          color: #0b1220;
        }

        .impCard__body {
          padding: 12px 12px 14px;
          display: grid;
          gap: 10px;
        }

        .impName {
          margin: 0;
          font-size: 0.98rem;
          font-weight: 1100;
          letter-spacing: -0.02em;
          color: #0b1220;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .impDesc {
          margin: 0;
          font-size: 0.84rem;
          color: rgba(11, 18, 32, 0.72);
          line-height: 1.25rem;
          min-height: 40px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .impMeta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .impPrice {
          font-weight: 1200;
          color: #7a2941;
          letter-spacing: -0.01em;
        }

        .impTag {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 1100;
          color: #0b1220;
          background: rgba(176, 141, 87, 0.16);
          border: 1px solid rgba(176, 141, 87, 0.22);
          white-space: nowrap;
        }

        .impActions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 2px;
        }

        .impBtn {
          height: 44px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 1100;
          text-decoration: none;
          border: 1px solid rgba(11, 18, 32, 0.10);
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.22s ease, filter 0.22s ease;
          user-select: none;
          outline: none;
          width: 100%;
        }

        .impBtn:hover {
          transform: translateY(-2px);
        }

        .impBtn--ghost {
          color: #0b1220;
          background: rgba(255, 255, 255, 0.92);
        }
        .impBtn--ghost:hover {
          box-shadow: 0 18px 50px rgba(11, 18, 32, 0.12);
        }

        .impBtn--solid {
          color: #fff;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 16px 48px rgba(122, 41, 65, 0.16);
        }
        .impBtn--solid:hover {
          box-shadow: 0 22px 70px rgba(122, 41, 65, 0.22);
          filter: brightness(1.02);
        }
        .impBtn--solid.ok {
          background: linear-gradient(135deg, #166534, #22c55e);
          box-shadow: 0 16px 48px rgba(34, 197, 94, 0.14);
        }

        .impBtn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
          transform: none;
        }

        .spin {
          animation: sp 0.9s linear infinite;
        }
        @keyframes sp {
          to {
            transform: rotate(360deg);
          }
        }

        /* ==== responsivo ==== */
        @media (max-width: 1100px) {
          .impGrid {
            grid-template-columns: 1fr;
          }
          .impEditorial {
            order: 0;
          }
          .impCards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 780px) {
          .impHead {
            flex-direction: column;
            align-items: flex-start;
          }
          .impAll {
            width: 100%;
            justify-content: center;
          }
          .impCards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .impContainer {
            padding: 14px;
            border-radius: 22px;
          }
          .impCards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
