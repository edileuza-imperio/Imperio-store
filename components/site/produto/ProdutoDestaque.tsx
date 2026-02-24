"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
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

const LIMITE = 12;
const CAROUSEL_MIN = 6; // carrossel só se tiver 6+ (mais de 5)

type AnyObj = Record<string, any>;

const PLACEHOLDER = "/placeholder.png";

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return PLACEHOLDER;
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

function clampText(value: unknown, max = 88) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function SkeletonCard() {
  return (
    <div className="pdItem pdItem--sk" aria-hidden="true">
      <div className="pdCard">
        <div className="pdMedia">
          <div className="pdSk pdSk--img" />
        </div>
        <div className="pdBody">
          <div className="pdSk pdSk--t" />
          <div className="pdSk pdSk--l" />
          <div className="pdSk pdSk--l sm" />
          <div className="pdSk pdSk--p" />
        </div>
      </div>
      <div className="pdSk pdSk--btn" />
    </div>
  );
}

function TopBanner({ mostrarVerTodos }: { mostrarVerTodos: boolean }) {
  return (
    <div className="pdBanner">
      <div className="pdBannerLeft">
        <div className="pdKicker">
          <Sparkles size={16} />
          Destaques
        </div>

        <h2 className="pdTitle">Selecionados para você</h2>
        <p className="pdSub">
          Visual creme, cards premium e layout limpo. Clique no produto para ver os detalhes.
        </p>

        <div className="pdTrust">
          <span className="pdPill">
            <ShieldCheck size={16} /> Compra segura
          </span>
          <span className="pdPill">
            <BadgeCheck size={16} /> Curadoria da loja
          </span>
          <span className="pdPill pdPill--gold">Entrega rápida</span>
        </div>
      </div>

      {mostrarVerTodos && (
        <Link href={rotas.produtos.paginas.destaques} className="pdAll">
          Ver todos <ArrowRight size={18} />
        </Link>
      )}
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
  const usarCarousel = lista.length >= CAROUSEL_MIN;

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
    const amount = Math.max(320, Math.round(el.clientWidth * 0.62));
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
        <TopBanner mostrarVerTodos={mostrarVerTodos} />

        {/* CONTROLES DO CARROSSEL (só aparece se tiver 6+) */}
        {usarCarousel && (
          <div className="pdCarouselTop">
            <div className="pdCarouselTitle">Destaques</div>
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
        )}

        {/* LISTA */}
        <div
          className={usarCarousel ? "pdTrack pdTrack--carousel" : "pdTrack pdTrack--grid"}
          ref={usarCarousel ? trackRef : null}
        >
          {loading ? (
            Array.from({ length: usarCarousel ? 6 : 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : (
            lista.map((item: AnyObj) => {
              const produtoId = getProdutoId(item) ?? 0;
              const slug = getSlug(item);
              const href = slug
                ? rotas.produtos.paginas.produto(slug)
                : rotas.produtos.paginas.destaques;

              const isAdding = addingId === produtoId;
              const isAdded = !!added[produtoId];

              const nome = item?.produto_nome ?? "Produto";
              const desc = item?.produto_descricao
                ? clampText(item.produto_descricao, 92)
                : "Destaque selecionado com ótimo custo-benefício.";

              const preco = formatBRL(item?.produto_preco);

              return (
                <div className="pdItem" key={item?.id_destaque ?? produtoId ?? href}>
                  <div className="pdCardWrap">
                    <Link href={href} className="pdCard" aria-label={`Ver ${nome}`}>
                      <div className="pdBadge">
                        <Sparkles size={14} />
                        Destaque
                      </div>

                      {/* IMAGEM SEM “BRANCÃO”: aspect-ratio + fallback */}
                      <div className="pdMedia">
                        <div className="pdImageShell" aria-label={`Imagem do produto ${nome}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImagemUrl(item?.produto_imagem)}
                            alt={nome}
                            loading="lazy"
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (img.src.endsWith(PLACEHOLDER)) return;
                              img.src = PLACEHOLDER;
                            }}
                          />
                        </div>
                      </div>

                      <div className="pdBody">
                        <div className="pdTopLine">
                          <h4 className="pdName" title={nome}>
                            {nome}
                          </h4>
                          <span className="pdTag">Em alta</span>
                        </div>

                        <p className="pdDesc">{desc}</p>

                        <div className="pdPriceRow">
                          <div className="pdPrice">{preco}</div>
                          <div className="pdMini">
                            <span className="pdDot" /> pronta entrega
                          </div>
                        </div>
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

        {/* fades só no carrossel */}
        {usarCarousel && (
          <>
            <div className="pdFade pdFade--left" aria-hidden="true" />
            <div className="pdFade pdFade--right" aria-hidden="true" />
          </>
        )}
      </div>

      <style jsx>{`
        /* ===== TEMA CREME PREMIUM ===== */
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
          overflow: hidden;
        }

        /* ===== BANNER ===== */
        .pdBanner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          border-radius: 22px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.70),
            rgba(255, 255, 255, 0.52)
          );
          border: 1px solid rgba(27, 27, 31, 0.08);
          box-shadow: 0 14px 46px rgba(27, 27, 31, 0.06);
          margin-bottom: 14px;
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

        .pdPill--gold {
          background: rgba(176, 141, 87, 0.16);
          border: 1px solid rgba(176, 141, 87, 0.20);
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
          background: linear-gradient(
            135deg,
            rgba(27, 27, 31, 0.92),
            rgba(27, 27, 31, 0.76)
          );
          box-shadow: 0 16px 46px rgba(27, 27, 31, 0.14);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          white-space: nowrap;
          height: fit-content;
        }

        .pdAll:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 60px rgba(27, 27, 31, 0.18);
        }

        /* ===== CAROUSEL HEADER ===== */
        .pdCarouselTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 6px 2px 10px;
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

        /* ===== TRACK (GRID ou CAROUSEL) ===== */
        .pdTrack {
          position: relative;
          min-width: 0;
        }

        /* grid quando <=5 */
        .pdTrack--grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          margin-top: 6px;
        }

        /* carrossel quando >=6 */
        .pdTrack--carousel {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(260px, 1fr);
          gap: 14px;
          overflow-x: auto;
          padding: 4px 2px 14px;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .pdTrack--carousel::-webkit-scrollbar {
          display: none;
        }

        .pdItem {
          min-width: 0;
          scroll-snap-align: start;
        }

        .pdCardWrap {
          display: grid;
          gap: 10px;
        }

        /* ===== CARD PROFISSIONAL (SEM BRANCÃO) ===== */
        .pdCard {
          position: relative;
          display: block;
          border-radius: 20px;
          overflow: hidden;
          text-decoration: none;

          background: linear-gradient(
            180deg,
            rgba(255, 251, 245, 0.94),
            rgba(255, 246, 236, 0.84)
          );
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
          background: linear-gradient(
            180deg,
            rgba(27, 27, 31, 0.03),
            rgba(27, 27, 31, 0)
          );
          border-bottom: 1px solid rgba(27, 27, 31, 0.08);
        }

        /* AQUI some o “card branco”: altura controlada e sempre preenchida */
        .pdImageShell {
          border-radius: 18px;
          border: 1px solid rgba(27, 27, 31, 0.08);
          background:
            radial-gradient(420px 180px at 50% 30%, rgba(176, 141, 87, 0.16), transparent 60%),
            rgba(255, 255, 255, 0.70);
          overflow: hidden;
          display: grid;
          place-items: center;
          /* sem altura fixa gigante: */
          aspect-ratio: 16 / 10;
          min-height: 150px;
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
          min-height: 40px;
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

        /* ===== BOTÃO ===== */
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

        /* ===== fades (só carrossel) ===== */
        .pdFade {
          position: absolute;
          top: 140px;
          bottom: 0;
          width: 56px;
          pointer-events: none;
          z-index: 2;
        }

        .pdFade--left {
          left: 0;
          background: linear-gradient(
            90deg,
            rgba(246, 239, 228, 0.98),
            rgba(246, 239, 228, 0)
          );
        }

        .pdFade--right {
          right: 0;
          background: linear-gradient(
            270deg,
            rgba(246, 239, 228, 0.98),
            rgba(246, 239, 228, 0)
          );
        }

        /* ===== skeleton ===== */
        .pdItem--sk {
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
          width: 100%;
          aspect-ratio: 16 / 10;
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

        .pdSk--p {
          height: 14px;
          width: 44%;
          border-radius: 12px;
          margin-top: 2px;
        }

        .pdSk--btn {
          height: 46px;
          width: 100%;
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

        /* ===== responsive ===== */
        @media (max-width: 820px) {
          .pdBanner {
            flex-direction: column;
            align-items: stretch;
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
          }

          .pdTrack--carousel {
            grid-auto-columns: minmax(240px, 1fr);
          }
        }
      `}</style>
    </section>
  );
}