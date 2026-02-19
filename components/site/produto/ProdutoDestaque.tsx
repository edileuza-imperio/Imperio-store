"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { useProdutoDestaque } from "@/hooks/produto/useProdutoDestaque";
import {
  Star,
  ShoppingCart,
  Eye,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";

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
    <div className="pcard pcard--skeleton">
      <div className="pcard__media">
        <div className="sk sk-media" />
      </div>
      <div className="pcard__body">
        <div className="sk sk-title" />
        <div className="sk sk-line" />
        <div className="sk sk-line sm" />
        <div className="pcard__footer">
          <div className="sk sk-price" />
          <div className="sk sk-btn" />
        </div>
      </div>

      <style jsx>{`
        .pcard--skeleton {
          pointer-events: none;
        }
        .sk {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.12),
            rgba(255, 255, 255, 0.22),
            rgba(255, 255, 255, 0.12)
          );
          background-size: 220% 100%;
          animation: shimmer 1.1s linear infinite;
          border-radius: 14px;
        }
        .sk-media {
          width: 78%;
          height: 72%;
          border-radius: 18px;
        }
        .sk-title {
          width: 70%;
          height: 16px;
          margin-bottom: 10px;
        }
        .sk-line {
          width: 100%;
          height: 10px;
          margin-bottom: 8px;
        }
        .sk-line.sm {
          width: 75%;
        }
        .sk-price {
          width: 96px;
          height: 18px;
          border-radius: 12px;
        }
        .sk-btn {
          width: 92px;
          height: 40px;
          border-radius: 999px;
        }
        @keyframes shimmer {
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

  // loading por produto (não trava a vitrine toda)
  const [addingId, setAddingId] = useState<number | null>(null);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  if (error) return null;

  const LIMITE_VITRINE = 8;
  const mostrarBotao = (destaques?.length || 0) > LIMITE_VITRINE;

  const vitrine = useMemo(
    () => (destaques || []).slice(0, LIMITE_VITRINE),
    [destaques]
  );

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
    const produtoId = Number(item?.produto_id ?? item?.id_produto ?? item?.produtoId ?? item?.produto ?? item?.id);
    const precoUnitario = Number(item?.produto_preco ?? item?.preco ?? 0);

    if (!Number.isFinite(produtoId) || produtoId <= 0) {
      alert("Produto inválido para adicionar ao carrinho.");
      return;
    }

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

      setAdded((prev) => ({ ...prev, [produtoId]: true }));
      window.setTimeout(() => {
        setAdded((prev) => ({ ...prev, [produtoId]: false }));
      }, 1600);
    } catch (e: any) {
      const msg =
        e?.response?.data?.mensagem ||
        e?.message ||
        "Erro ao adicionar no carrinho.";
      alert(String(msg));
    } finally {
      setAddingId(null);
    }
  }

  return (
    <section className="pdestaque">
      <div className="container">
        <div className="wrap">
          {/* ===== HEADER EDITORIAL ===== */}
          <header className="head">
            <div className="head__left">
              <div className="badge">
                <Sparkles size={16} />
                Destaques selecionados
              </div>

              <h2 className="head__title">Vitrine Premium</h2>
              <p className="head__sub">
                Curadoria com estilo e acabamento superior — escolha rápida,
                compra segura.
              </p>
            </div>

            {mostrarBotao && (
              <Link href="/produtos/destaques" className="head__cta">
                Ver todos <ArrowRight size={18} />
              </Link>
            )}
          </header>

          <div className="row g-4">
            {/* ===== CARD EDITORIAL (mini banner) ===== */}
            <div className="col-lg-3 col-md-4">
              <div className="editorial">
                <div className="editorial__top">
                  <div className="editorial__icon">
                    <Sparkles size={24} />
                  </div>
                  <div className="editorial__chip">Curadoria Império</div>
                </div>

                <h3 className="editorial__title">Elegância pronta para você</h3>
                <p className="editorial__text">
                  Produtos em destaque com visual marcante e ótimo custo-benefício.
                </p>

                <div className="editorial__bullets">
                  <span>✓ Seleção exclusiva</span>
                  <span>✓ Qualidade premium</span>
                  <span>✓ Compra rápida</span>
                </div>

                <Link href="/produtos/destaques" className="editorial__cta">
                  Explorar destaques <ArrowRight size={18} />
                </Link>

                <div className="editorial__glow" />
                <div className="editorial__noise" />
              </div>
            </div>

            {/* ===== GRID ===== */}
            <div className="col-lg-9 col-md-8">
              <div className="row g-4">
                {loading
                  ? Array.from({ length: LIMITE_VITRINE }).map((_, i) => (
                      <div key={i} className="col-6 col-md-4 col-lg-3">
                        <SkeletonCard />
                      </div>
                    ))
                  : vitrine.map((item: any) => {
                      const produtoId = Number(
                        item?.produto_id ?? item?.id_produto ?? item?.produtoId ?? item?.id
                      );
                      const isAdding = addingId === produtoId;
                      const isAdded = !!added[produtoId];

                      return (
                        <div
                          key={item.id_destaque ?? item.produto_id ?? item.id}
                          className="col-6 col-md-4 col-lg-3"
                        >
                          <article className="pcard">
                            {/* glow border */}
                            <div className="pcard__border" />

                            {/* ribbon */}
                            <div className="pcard__ribbon">
                              <Star size={14} />
                              Destaque
                            </div>

                            {/* media */}
                            <Link
                              href={`/produto/${item.produto_slug}`}
                              className="pcard__media"
                            >
                              <div className="pcard__plate">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getImagemUrl(item.produto_imagem)}
                                  alt={item.produto_nome}
                                  loading="lazy"
                                />
                              </div>
                            </Link>

                            {/* body */}
                            <div className="pcard__body">
                              <h6 className="pcard__name" title={item.produto_nome}>
                                {item.produto_nome}
                              </h6>

                              <p className="pcard__desc">
                                {item.produto_descricao
                                  ? item.produto_descricao.slice(0, 70) + "…"
                                  : "Destaque selecionado com acabamento premium."}
                              </p>

                              <div className="pcard__footer">
                                <div className="pcard__pricebox">
                                  <span className="pcard__price">
                                    {formatBRL(item.produto_preco)}
                                  </span>
                                  <span className="pcard__tag">Em alta</span>
                                </div>

                                <div className="pcard__actions">
                                  <Link
                                    href={`/produto/${item.produto_slug}`}
                                    className="btnicon btnicon--ghost"
                                    title="Ver produto"
                                  >
                                    <Eye size={16} />
                                  </Link>

                                  {/* ✅ AGORA ADICIONA NO BANCO */}
                                  <button
                                    type="button"
                                    className={`btnicon btnicon--solid ${
                                      isAdded ? "btnicon--ok" : ""
                                    }`}
                                    title="Adicionar ao carrinho"
                                    onClick={() => adicionarAoCarrinho(item)}
                                    disabled={isAdding}
                                  >
                                    {isAdding ? (
                                      <Loader2 size={16} className="spin" />
                                    ) : isAdded ? (
                                      <Check size={16} />
                                    ) : (
                                      <ShoppingCart size={16} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        </div>
                      );
                    })}
              </div>

              {mostrarBotao && (
                <div className="more d-md-none">
                  <Link href="/produtos/destaques" className="more__btn">
                    Ver todos os destaques <ArrowRight size={18} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ===== FUNDO PREMIUM ===== */
        .pdestaque {
          padding: 34px 0;
          position: relative;
          overflow: hidden;
        }

        .pdestaque::before {
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
              rgba(122, 41, 65, 0.2),
              transparent 58%
            ),
            radial-gradient(
              620px 300px at 70% 85%,
              rgba(17, 24, 39, 0.16),
              transparent 60%
            );
          filter: blur(10px);
          pointer-events: none;
        }

        .wrap {
          position: relative;
          border-radius: 34px;
          padding: 22px;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow: 0 24px 80px rgba(17, 24, 39, 0.1);
        }

        /* ===== HEADER ===== */
        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 0.82rem;
          color: #7a2941;
          background: rgba(122, 41, 65, 0.1);
          border: 1px solid rgba(122, 41, 65, 0.14);
        }

        .head__title {
          margin: 10px 0 6px;
          font-size: 2.05rem;
          font-weight: 1000;
          letter-spacing: -0.03em;
          color: #111827;
        }

        .head__sub {
          margin: 0;
          max-width: 620px;
          color: rgba(17, 24, 39, 0.72);
          font-size: 1rem;
        }

        .head__cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 999px;
          color: #fff;
          text-decoration: none;
          font-weight: 900;
          background: linear-gradient(135deg, #111827, #1f2937);
          box-shadow: 0 14px 40px rgba(17, 24, 39, 0.2);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          white-space: nowrap;
        }
        .head__cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 55px rgba(17, 24, 39, 0.25);
        }

        /* ===== EDITORIAL ===== */
        .editorial {
          height: 100%;
          border-radius: 28px;
          padding: 22px;
          color: #fff;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            160deg,
            #111827 0%,
            #7a2941 55%,
            #b08d57 120%
          );
          box-shadow: 0 22px 70px rgba(122, 41, 65, 0.24);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .editorial__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          position: relative;
          z-index: 2;
          margin-bottom: 14px;
        }

        .editorial__icon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .editorial__chip {
          font-size: 0.78rem;
          font-weight: 1000;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .editorial__title {
          position: relative;
          z-index: 2;
          font-size: 1.25rem;
          font-weight: 1000;
          margin: 8px 0 8px;
          letter-spacing: -0.02em;
        }

        .editorial__text {
          position: relative;
          z-index: 2;
          margin: 0 0 14px;
          opacity: 0.92;
          line-height: 1.35rem;
          font-size: 0.95rem;
        }

        .editorial__bullets {
          position: relative;
          z-index: 2;
          display: grid;
          gap: 6px;
          margin-bottom: 16px;
          font-weight: 800;
          font-size: 0.9rem;
          opacity: 0.95;
        }

        .editorial__cta {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 999px;
          color: #111827;
          background: #fff;
          text-decoration: none;
          font-weight: 1000;
          transition: transform 0.25s ease, filter 0.25s ease;
        }
        .editorial__cta:hover {
          transform: translateY(-2px);
          filter: brightness(0.98);
        }

        .editorial__glow {
          position: absolute;
          inset: -35%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.22),
            transparent 58%
          );
          transform: rotate(18deg);
          z-index: 1;
        }

        .editorial__noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
          opacity: 0.35;
          pointer-events: none;
          z-index: 1;
        }

        /* ===== PRODUCT CARD ===== */
        .pcard {
          position: relative;
          height: 100%;
          border-radius: 24px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(17, 24, 39, 0.08);
          box-shadow: 0 18px 55px rgba(17, 24, 39, 0.1);
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .pcard:hover {
          transform: translateY(-8px);
          box-shadow: 0 28px 75px rgba(17, 24, 39, 0.18);
        }

        .pcard__border {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(176, 141, 87, 0.34),
            rgba(122, 41, 65, 0.24),
            rgba(17, 24, 39, 0.1)
          );
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.28s ease;
        }
        .pcard:hover .pcard__border {
          opacity: 1;
        }

        .pcard__ribbon {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 4;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 999px;
          color: #fff;
          font-size: 0.74rem;
          font-weight: 1000;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          box-shadow: 0 14px 36px rgba(122, 41, 65, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .pcard__media {
          display: block;
          text-decoration: none;
          color: inherit;
          position: relative;
          padding: 18px 14px 0;
          background: radial-gradient(
              350px 160px at 30% 20%,
              rgba(176, 141, 87, 0.18),
              transparent 55%
            ),
            radial-gradient(
              320px 150px at 80% 10%,
              rgba(122, 41, 65, 0.14),
              transparent 55%
            ),
            rgba(17, 24, 39, 0.02);
          border-bottom: 1px solid rgba(17, 24, 39, 0.06);
        }

        .pcard__plate {
          height: 170px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.9);
          display: grid;
          place-items: center;
          box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.05);
          overflow: hidden;
        }

        .pcard__plate img {
          width: 86%;
          height: 86%;
          object-fit: contain;
          transition: transform 0.45s ease, filter 0.45s ease;
          filter: saturate(1.03);
        }

        .pcard:hover .pcard__plate img {
          transform: scale(1.12);
          filter: saturate(1.06) brightness(1.03);
        }

        .pcard__body {
          position: relative;
          z-index: 3;
          padding: 14px 14px 16px;
        }

        .pcard__name {
          margin: 0 0 6px;
          font-size: 0.98rem;
          font-weight: 1000;
          letter-spacing: -0.02em;
          color: #111827;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pcard__desc {
          margin: 0 0 12px;
          font-size: 0.84rem;
          color: rgba(17, 24, 39, 0.74);
          line-height: 1.25rem;
          min-height: 44px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pcard__footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }

        .pcard__pricebox {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pcard__price {
          font-weight: 1100;
          color: #7a2941;
          font-size: 1.06rem;
          letter-spacing: -0.01em;
        }

        .pcard__tag {
          width: fit-content;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 1000;
          color: #111827;
          background: rgba(176, 141, 87, 0.18);
          border: 1px solid rgba(176, 141, 87, 0.22);
        }

        .pcard__actions {
          display: flex;
          gap: 8px;
        }

        .btnicon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          transition: transform 0.22s ease, box-shadow 0.22s ease,
            background 0.22s ease;
          border: 0;
          cursor: pointer;
        }
        .btnicon:hover {
          transform: translateY(-2px);
        }

        .btnicon--ghost {
          color: #111827;
          background: rgba(17, 24, 39, 0.06);
          border: 1px solid rgba(17, 24, 39, 0.1);
          text-decoration: none;
        }
        .btnicon--ghost:hover {
          background: rgba(17, 24, 39, 0.1);
        }

        .btnicon--solid {
          color: #fff;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          box-shadow: 0 16px 40px rgba(122, 41, 65, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }
        .btnicon--solid:hover {
          box-shadow: 0 22px 55px rgba(122, 41, 65, 0.26);
        }
        .btnicon--solid:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btnicon--ok {
          background: linear-gradient(135deg, #166534, #22c55e);
          box-shadow: 0 16px 40px rgba(34, 197, 94, 0.18);
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* mobile more */
        .more {
          margin-top: 18px;
          text-align: center;
        }
        .more__btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 26px;
          border-radius: 999px;
          background: linear-gradient(135deg, #111827, #1f2937);
          color: #fff;
          text-decoration: none;
          font-weight: 1000;
          transition: transform 0.25s ease;
        }
        .more__btn:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .wrap {
            padding: 16px;
            border-radius: 28px;
          }
          .head {
            flex-direction: column;
            align-items: flex-start;
          }
          .head__cta {
            display: none;
          }
          .editorial {
            margin-bottom: 6px;
          }
        }

        @media (max-width: 576px) {
          .pcard__plate {
            height: 140px;
          }
          .pcard__desc {
            min-height: 38px;
          }
        }
      `}</style>
    </section>
  );
}
