"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import api from "@/Api/conectar";

import { useProdutoDestaque } from "@/hooks/produto/useProdutoDestaque";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  ShoppingCart,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { rotas } from "@/components/Bibioteca/config/rotas";

const LIMITE = 10;

type AnyObj = Record<string, any>;

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return "/placeholder.png";
  if (/^https?:\/\//i.test(caminho)) return caminho;

  const base = api.defaults.baseURL || "";
  const b = base.replace(/\/+$/, "");
  const c = String(caminho).replace(/^\/+/, "");
  return b ? `${b}/${c}` : `/${c}`;
};

function formatBRL(v: unknown) {
  const n = Number(v);
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getProdutoId(item: AnyObj): number | null {
  const id = Number(
    item?.produto_id ?? item?.id_produto ?? item?.produtoId ?? item?.id
  );
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getSlug(item: AnyObj): string | null {
  const slug = String(item?.produto_slug ?? "").trim();
  return slug || null;
}

function clampText(s: unknown, max = 90) {
  const t = String(s ?? "").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function SkeletonCard() {
  return (
    <div className="pdSlide" aria-hidden="true">
      <div className="pdCard pdCard--sk">
        <div className="pdMedia">
          <div className="pdSk pdSk--img" />
        </div>
        <div className="pdBody">
          <div className="pdSk pdSk--t" />
          <div className="pdSk pdSk--l" />
          <div className="pdSk pdSk--l sm" />
          <div className="pdSk pdSk--b" />
        </div>
      </div>
    </div>
  );
}

function MiniBanner({ mostrarVerTodos }: { mostrarVerTodos: boolean }) {
  return (
    <div className="pdBanner">
      <div className="pdBannerLeft">
        <div className="pdKicker">
          <Sparkles size={16} />
          Destaques
        </div>

        <h2 className="pdTitle">Selecionados para você</h2>
        <p className="pdSub">
          Layout creme, cards premium e carrossel suave. Clique no produto para
          ver detalhes.
        </p>

        <div className="pdTrust">
          <span className="pdPill">
            <ShieldCheck size={16} /> Compra segura
          </span>
          <span className="pdPill">
            <BadgeCheck size={16} /> Curadoria da loja
          </span>
        </div>
      </div>

      <div className="pdBannerRight">
        <div className="pdBannerBadge">Entrega rápida</div>

        {mostrarVerTodos && (
          <Link href={rotas.produtos.paginas.destaques} className="pdAll">
            Ver todos <ArrowRight size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ProdutoDestaque() {
  const router = useRouter();
  const { destaques, loading, error } = useProdutoDestaque();

  const [addingId, setAddingId] = useState<number | null>(null);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  const trackRef = useRef<HTMLDivElement | null>(null);

  const lista = useMemo(
    () => (destaques || []).slice(0, LIMITE),
    [destaques]
  );
  const mostrarVerTodos = (destaques?.length || 0) > LIMITE;

  const getUsuarioId = useCallback(async (): Promise<number | null> => {
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
  }, []);

  const adicionarAoCarrinho = useCallback(
    async (item: AnyObj) => {
      const produtoId = getProdutoId(item);
      const precoUnitario = Number(item?.produto_preco ?? item?.preco ?? 0);

      if (!produtoId) {
        toast.error("Produto inválido.");
        return;
      }

      setAddingId(produtoId);

      const usuarioId = await getUsuarioId();
      if (!usuarioId) {
        setAddingId(null);
        toast.info("Faça login para adicionar ao carrinho.");
        router.push(rotas.paginas.login);
        return;
      }

      try {
        await api.post(
          rotas.carrinho.adicionar,
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
        }, 1400);
      } catch (e: any) {
        const msg =
          e?.response?.data?.mensagem ||
          e?.message ||
          "Erro ao adicionar no carrinho.";
        toast.error(String(msg));
      } finally {
        setAddingId(null);
      }
    },
    [getUsuarioId, router]
  );

  const scrollByCards = useCallback((dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    // rola ~1.2 cards (tamanho aproximado) — bem natural
    const amount = Math.max(320, Math.round(el.clientWidth * 0.55));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  if (error) return null;

  return (
    <section className="pdWrap">
      <ToastContainer
        position="top-right"
        autoClose={2400}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />

      <div className="pdContainer">
        <MiniBanner mostrarVerTodos={mostrarVerTodos} />

        <div className="pdCarousel">
          <div className="pdCarouselTop">
            <div className="pdCarouselTitle">Produtos em destaque</div>

            <div className="pdNav">
              <button
                type="button"
                className="pdNavBtn"
                onClick={() => scrollByCards("left")}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="pdNavBtn"
                onClick={() => scrollByCards("right")}
                aria-label="Próximo"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="pdTrack" ref={trackRef}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              lista.map((item: AnyObj) => {
                const produtoId = getProdutoId(item) ?? 0;
                const slug = getSlug(item);
                const href = slug
                  ? rotas.produtos.paginas.produto(slug)
                  : rotas.produtos.paginas.destaques;

                const isAdding = addingId === produtoId;
                const isAdded = !!added[produtoId];

                return (
                  <div className="pdSlide" key={item?.id_destaque ?? produtoId ?? href}>
                    <div className="pdCardWrap">
                      <Link href={href} className="pdCard" aria-label={`Ver ${item?.produto_nome ?? "produto"}`}>
                        <div className="pdBadge">
                          <Sparkles size={14} />
                          Destaque
                        </div>

                        <div className="pdMedia">
                          <div className="pdImageShell">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getImagemUrl(item?.produto_imagem)}
                              alt={item?.produto_nome ?? "Produto"}
                              loading="lazy"
                            />
                          </div>
                        </div>

                        <div className="pdBody">
                          <div className="pdTopLine">
                            <h4 className="pdName" title={item?.produto_nome}>
                              {item?.produto_nome ?? "Produto"}
                            </h4>
                            <span className="pdTag">Em alta</span>
                          </div>

                          <p className="pdDesc">
                            {item?.produto_descricao
                              ? clampText(item.produto_descricao, 96)
                              : "Destaque selecionado com ótimo custo-benefício."}
                          </p>

                          <div className="pdPriceRow">
                            <div className="pdPrice">
                              {formatBRL(item?.produto_preco)}
                            </div>
                            <div className="pdMini">
                              <span className="pdDot" /> pronta entrega
                            </div>
                          </div>

                          <div className="pdHint">Clique para ver detalhes</div>
                        </div>
                      </Link>

                      <button
                        type="button"
                        className={`pdBtn ${isAdded ? "ok" : ""}`}
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
                );
              })
            )}
          </div>

          <div className="pdFade pdFade--left" aria-hidden="true" />
          <div className="pdFade pdFade--right" aria-hidden="true" />
        </div>
      </div>

      <style jsx>{`
        /* ===== Base creme premium ===== */
        .pdWrap {
          position: relative;
          padding: 44px 0;
          background: linear-gradient(180deg, #fbf6ee, #f6efe4);
        }

        .pdWrap::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
              920px 360px at 12% 6%,
              rgba(176, 141, 87, 0.22),
              transparent 62%
            ),
            radial-gradient(
              760px 340px at 98% 12%,
              rgba(122, 41, 65, 0.14),
              transparent 58%
            ),
            radial-gradient(
              740px 380px at 55% 100%,
              rgba(27, 27, 31, 0.08),
              transparent 62%
            );
          pointer-events: none;
        }

        .pdContainer {
          position: relative;
          z-index: 1;
          width: min(1180px, calc(100% - 24px));
          margin: 0 auto;
          padding: clamp(16px, 2.2vw, 24px);
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.46);
          border: 1px solid rgba(27, 27, 31, 0.08);
          backdrop-filter: blur(10px);
          box-shadow: 0 18px 60px rgba(27, 27, 31, 0.08);
        }

        /* ===== Mini banner (melhorado) ===== */
        .pdBanner {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 16px;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.70), rgba(255, 255, 255, 0.52));
          border: 1px solid rgba(27, 27, 31, 0.08);
          box-shadow: 0 14px 46px rgba(27, 27, 31, 0.06);
          margin-bottom: 14px;
        }

        .pdBannerLeft {
          max-width: 76ch;
        }

        .pdKicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          font-weight: 950;
          font-size: 0.82rem;
          color: #7a2941;
          background: rgba(122, 41, 65, 0.10);
          border: 1px solid rgba(122, 41, 65, 0.16);
          width: fit-content;
        }

        .pdTitle {
          margin: 10px 0 6px;
          font-size: clamp(1.45rem, 2.1vw, 2rem);
          font-weight: 980;
          letter-spacing: -0.03em;
          color: #1b1b1f;
        }

        .pdSub {
          margin: 0;
          color: rgba(27, 27, 31, 0.66);
          line-height: 1.55;
        }

        .pdTrust {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .pdPill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.62);
          border: 1px solid rgba(27, 27, 31, 0.10);
          color: rgba(27, 27, 31, 0.78);
          font-weight: 850;
          font-size: 0.88rem;
        }

        .pdBannerRight {
          display: grid;
          align-content: start;
          justify-items: end;
          gap: 10px;
          min-width: 180px;
        }

        .pdBannerBadge {
          font-weight: 950;
          color: rgba(27, 27, 31, 0.78);
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(176, 141, 87, 0.16);
          border: 1px solid rgba(176, 141, 87, 0.20);
          white-space: nowrap;
        }

        .pdAll {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 999px;
          color: #fff;
          text-decoration: none;
          font-weight: 950;
          background: linear-gradient(135deg, rgba(27, 27, 31, 0.92), rgba(27, 27, 31, 0.76));
          box-shadow: 0 16px 46px rgba(27, 27, 31, 0.14);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          white-space: nowrap;
        }

        .pdAll:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 60px rgba(27, 27, 31, 0.18);
        }

        /* ===== Carrossel ===== */
        .pdCarousel {
          position: relative;
          border-radius: 22px;
          padding: 14px 14px 10px;
          background: rgba(255, 255, 255, 0.38);
          border: 1px solid rgba(27, 27, 31, 0.08);
          overflow: hidden;
        }

        .pdCarouselTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .pdCarouselTitle {
          font-weight: 980;
          color: rgba(27, 27, 31, 0.90);
          letter-spacing: -0.02em;
        }

        .pdNav {
          display: inline-flex;
          gap: 10px;
        }

        .pdNavBtn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(27, 27, 31, 0.12);
          background: rgba(255, 255, 255, 0.68);
          cursor: pointer;
          transition: transform 0.14s ease, box-shadow 0.18s ease, filter 0.18s ease;
          box-shadow: 0 10px 26px rgba(27, 27, 31, 0.08);
        }

        .pdNavBtn:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
          box-shadow: 0 16px 34px rgba(27, 27, 31, 0.10);
        }

        .pdTrack {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(260px, 1fr);
          gap: 14px;

          overflow-x: auto;
          padding: 4px 2px 10px;

          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;

          scrollbar-width: none; /* Firefox */
        }

        .pdTrack::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        .pdSlide {
          scroll-snap-align: start;
          min-width: 0;
        }

        .pdCardWrap {
          display: grid;
          gap: 10px;
        }

        /* ===== Cards creme (premium, mais leves) ===== */
        .pdCard {
          position: relative;
          display: block;
          border-radius: 20px;
          overflow: hidden;
          text-decoration: none;

          /* creme real */
          background: linear-gradient(180deg, rgba(255, 251, 245, 0.92), rgba(255, 246, 236, 0.82));
          border: 1px solid rgba(27, 27, 31, 0.10);
          box-shadow: 0 14px 46px rgba(27, 27, 31, 0.10);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }

        .pdCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 26px 70px rgba(27, 27, 31, 0.14);
          filter: saturate(1.02);
        }

        .pdBadge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 980;
          color: rgba(27, 27, 31, 0.92);
          background: rgba(255, 255, 255, 0.76);
          border: 1px solid rgba(27, 27, 31, 0.10);
          backdrop-filter: blur(8px);
        }

        .pdMedia {
          padding: 12px;
          background: linear-gradient(180deg, rgba(27, 27, 31, 0.03), rgba(27, 27, 31, 0));
          border-bottom: 1px solid rgba(27, 27, 31, 0.08);
        }

        .pdImageShell {
          height: 176px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(27, 27, 31, 0.08);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .pdImageShell img {
          width: 86%;
          height: 86%;
          object-fit: contain;
          transition: transform 0.32s ease, filter 0.32s ease;
        }

        .pdCard:hover .pdImageShell img {
          transform: scale(1.06);
          filter: saturate(1.06) contrast(1.02);
        }

        .pdBody {
          padding: 12px 12px 14px;
          display: grid;
          gap: 10px;
          min-width: 0;
        }

        .pdTopLine {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }

        .pdName {
          margin: 0;
          font-size: 1rem;
          font-weight: 980;
          letter-spacing: -0.02em;
          color: #1b1b1f;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pdTag {
          flex: 0 0 auto;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 950;
          color: rgba(27, 27, 31, 0.90);
          background: rgba(176, 141, 87, 0.16);
          border: 1px solid rgba(176, 141, 87, 0.20);
          white-space: nowrap;
        }

        .pdDesc {
          margin: 0;
          font-size: 0.86rem;
          color: rgba(27, 27, 31, 0.68);
          line-height: 1.3rem;
          min-height: 42px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pdPriceRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .pdPrice {
          font-weight: 990;
          color: #7a2941;
          letter-spacing: -0.02em;
        }

        .pdMini {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: rgba(27, 27, 31, 0.60);
          font-weight: 900;
          white-space: nowrap;
        }

        .pdDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #2ecc71;
          box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.18);
        }

        .pdHint {
          margin-top: -2px;
          font-size: 0.78rem;
          color: rgba(27, 27, 31, 0.56);
          font-weight: 850;
        }

        /* ===== CTA carrinho ===== */
        .pdBtn {
          height: 46px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 980;
          border: 1px solid rgba(27, 27, 31, 0.10);
          cursor: pointer;
          width: 100%;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          color: #fff;
          box-shadow: 0 16px 46px rgba(122, 41, 65, 0.16);
          transition: transform 0.16s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }

        .pdBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 62px rgba(122, 41, 65, 0.22);
          filter: brightness(1.02);
        }

        .pdBtn:disabled {
          opacity: 0.78;
          cursor: not-allowed;
          transform: none;
        }

        .pdBtn.ok {
          background: linear-gradient(135deg, #166534, #22c55e);
          box-shadow: 0 16px 46px rgba(34, 197, 94, 0.16);
        }

        .spin {
          animation: sp 0.9s linear infinite;
        }

        @keyframes sp {
          to {
            transform: rotate(360deg);
          }
        }

        /* ===== Fades laterais do carrossel ===== */
        .pdFade {
          position: absolute;
          top: 58px;
          bottom: 8px;
          width: 52px;
          pointer-events: none;
        }

        .pdFade--left {
          left: 0;
          background: linear-gradient(90deg, rgba(246, 239, 228, 0.98), rgba(246, 239, 228, 0));
        }

        .pdFade--right {
          right: 0;
          background: linear-gradient(270deg, rgba(246, 239, 228, 0.98), rgba(246, 239, 228, 0));
        }

        /* ===== Skeleton ===== */
        .pdCard--sk {
          pointer-events: none;
        }

        .pdSk {
          border-radius: 14px;
          background: linear-gradient(
            90deg,
            rgba(27, 27, 31, 0.06),
            rgba(27, 27, 31, 0.11),
            rgba(27, 27, 31, 0.06)
          );
          background-size: 220% 100%;
          animation: sh 1.05s linear infinite;
        }

        .pdSk--img {
          height: 176px;
          width: 100%;
          border-radius: 18px;
        }

        .pdSk--t {
          height: 16px;
          width: 72%;
          margin-top: 6px;
        }

        .pdSk--l {
          height: 10px;
          width: 100%;
          margin-bottom: 8px;
        }

        .pdSk--l.sm {
          width: 80%;
        }

        .pdSk--b {
          height: 46px;
          width: 100%;
          margin-top: 10px;
          border-radius: 16px;
        }

        @keyframes sh {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: -220% 0%;
          }
        }

        /* ===== Responsivo ===== */
        @media (max-width: 820px) {
          .pdBanner {
            flex-direction: column;
            align-items: stretch;
          }

          .pdBannerRight {
            justify-items: start;
            min-width: 0;
          }

          .pdAll {
            width: 100%;
            justify-content: center;
          }

          .pdFade {
            display: none;
          }
        }

        @media (max-width: 520px) {
          .pdNavBtn {
            width: 40px;
            height: 40px;
            border-radius: 14px;
          }
          .pdTrack {
            grid-auto-columns: minmax(240px, 1fr);
          }
        }
      `}</style>
    </section>
  );
}