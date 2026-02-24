"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import api from "@/Api/conectar";

import { useProdutoDestaque } from "@/hooks/produto/useProdutoDestaque";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  Star,
  ShoppingCart,
  Loader2,
  Check,
} from "lucide-react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { rotas } from "@/components/Bibioteca/config/rotas";

const LIMITE = 8;

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

function SkeletonCard() {
  return (
    <div className="pdShell pdShell--sk" aria-hidden="true">
      <div className="pdCard">
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

function Header({ mostrarVerTodos }: { mostrarVerTodos: boolean }) {
  return (
    <div className="pdHead">
      <div className="pdHeadLeft">
        <div className="pdKicker">
          <Sparkles size={16} />
          Destaques
        </div>

        <h2 className="pdTitle">Selecionados para você</h2>
        <p className="pdSub">
          Produtos em alta com estética premium e entrega rápida. Clique no card
          para ver detalhes.
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

      {mostrarVerTodos && (
        <Link href={rotas.produtos.paginas.destaques} className="pdAll">
          Ver todos <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}

function Hero() {
  return (
    <aside className="pdHero">
      <div className="pdHeroTop">
        <div className="pdHeroIcon">
          <Star size={18} />
        </div>
        <span className="pdHeroChip">Seleção Premium</span>
      </div>

      <h3 className="pdHeroTitle">Destaques com visual creme</h3>
      <p className="pdHeroText">
        Um layout mais clean, claro e elegante — com foco na imagem e no preço.
      </p>

      <div className="pdHeroBullets">
        <span>• Card inteiro clicável</span>
        <span>• CTA único e claro</span>
        <span>• Responsivo e alinhado</span>
      </div>

      <Link href={rotas.produtos.paginas.destaques} className="pdHeroCta">
        Explorar destaques <ArrowRight size={18} />
      </Link>
    </aside>
  );
}

export default function ProdutoDestaque() {
  const router = useRouter();
  const { destaques, loading, error } = useProdutoDestaque();

  const [addingId, setAddingId] = useState<number | null>(null);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  const lista = useMemo(() => (destaques || []).slice(0, LIMITE), [destaques]);
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
        <Header mostrarVerTodos={mostrarVerTodos} />

        <div className="pdGrid">
          <Hero />

          <div className="pdCards">
            {loading ? (
              Array.from({ length: LIMITE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            ) : (
              lista.map((item: AnyObj) => {
                const produtoId = getProdutoId(item) ?? 0;
                const isAdding = addingId === produtoId;
                const isAdded = !!added[produtoId];

                const slug = getSlug(item);
                const href = slug
                  ? rotas.produtos.paginas.produto(slug)
                  : rotas.produtos.paginas.destaques;

                return (
                  <div className="pdShell" key={item?.id_destaque ?? produtoId ?? href}>
                    <Link
                      href={href}
                      className="pdCard"
                      aria-label={`Ver ${item?.produto_nome ?? "produto"}`}
                    >
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
                            ? String(item.produto_descricao).slice(0, 90) + "…"
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
                          Adicionar ao carrinho
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ====== TEMA CREME PREMIUM ====== */
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
              900px 340px at 12% 4%,
              rgba(176, 141, 87, 0.2),
              transparent 60%
            ),
            radial-gradient(
              720px 320px at 96% 10%,
              rgba(122, 41, 65, 0.16),
              transparent 58%
            ),
            radial-gradient(
              700px 360px at 55% 100%,
              rgba(27, 27, 31, 0.08),
              transparent 60%
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

        /* ====== HEADER ====== */
        .pdHead {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .pdHeadLeft {
          max-width: 74ch;
        }

        .pdKicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 0.82rem;
          color: #7a2941;
          background: rgba(122, 41, 65, 0.1);
          border: 1px solid rgba(122, 41, 65, 0.16);
          width: fit-content;
        }

        .pdTitle {
          margin: 10px 0 6px;
          font-size: clamp(1.55rem, 2.4vw, 2.15rem);
          font-weight: 950;
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
          border: 1px solid rgba(27, 27, 31, 0.1);
          color: rgba(27, 27, 31, 0.78);
          font-weight: 800;
          font-size: 0.88rem;
        }

        .pdAll {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 999px;
          color: #fff;
          text-decoration: none;
          font-weight: 900;
          background: linear-gradient(
            135deg,
            rgba(27, 27, 31, 0.92),
            rgba(27, 27, 31, 0.76)
          );
          box-shadow: 0 16px 46px rgba(27, 27, 31, 0.14);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          white-space: nowrap;
        }

        .pdAll:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 60px rgba(27, 27, 31, 0.18);
        }

        /* ====== GRID LAYOUT ====== */
        .pdGrid {
          display: grid;
          grid-template-columns: minmax(280px, 360px) 1fr;
          gap: 16px;
          align-items: start;
        }

        /* ====== HERO ====== */
        .pdHero {
          border-radius: 22px;
          padding: 18px;
          background: linear-gradient(
            160deg,
            #1c1b20 0%,
            #7a2941 55%,
            #b08d57 120%
          );
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 18px 56px rgba(122, 41, 65, 0.18);
          position: sticky;
          top: 14px;
        }

        .pdHeroTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .pdHeroIcon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .pdHeroChip {
          font-size: 0.78rem;
          font-weight: 900;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .pdHeroTitle {
          margin: 8px 0 8px;
          font-size: 1.18rem;
          font-weight: 950;
          letter-spacing: -0.02em;
        }

        .pdHeroText {
          margin: 0 0 14px;
          opacity: 0.92;
          line-height: 1.45rem;
          font-size: 0.95rem;
        }

        .pdHeroBullets {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
          font-weight: 800;
          opacity: 0.96;
        }

        .pdHeroCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          height: 46px;
          border-radius: 16px;
          color: #1c1b20;
          background: rgba(255, 255, 255, 0.96);
          text-decoration: none;
          font-weight: 950;
          transition: transform 0.18s ease, filter 0.18s ease;
        }

        .pdHeroCta:hover {
          transform: translateY(-2px);
          filter: brightness(0.98);
        }

        /* ====== CARDS GRID ====== */
        .pdCards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          min-width: 0;
        }

        .pdShell {
          display: grid;
          gap: 10px;
          min-width: 0;
        }

        .pdCard {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.74);
          border: 1px solid rgba(27, 27, 31, 0.1);
          box-shadow: 0 14px 40px rgba(27, 27, 31, 0.1);
          transition: transform 0.18s ease, box-shadow 0.18s ease,
            background 0.18s ease;
          display: block;
        }

        .pdCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 26px 70px rgba(27, 27, 31, 0.14);
          background: rgba(255, 255, 255, 0.86);
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
          font-weight: 950;
          color: rgba(27, 27, 31, 0.92);
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(27, 27, 31, 0.1);
          backdrop-filter: blur(8px);
        }

        .pdMedia {
          padding: 12px;
          background: linear-gradient(
            180deg,
            rgba(27, 27, 31, 0.04),
            rgba(27, 27, 31, 0)
          );
          border-bottom: 1px solid rgba(27, 27, 31, 0.08);
        }

        .pdImageShell {
          height: 178px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.82);
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
          font-weight: 950;
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
          font-weight: 900;
          color: rgba(27, 27, 31, 0.9);
          background: rgba(176, 141, 87, 0.18);
          border: 1px solid rgba(176, 141, 87, 0.24);
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
          font-weight: 980;
          color: #7a2941;
          letter-spacing: -0.02em;
        }

        .pdMini {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: rgba(27, 27, 31, 0.6);
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
          font-weight: 800;
        }

        /* ====== BOTÃO ====== */
        .pdBtn {
          height: 46px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 950;
          border: 1px solid rgba(27, 27, 31, 0.1);
          cursor: pointer;
          width: 100%;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          color: #fff;
          box-shadow: 0 16px 46px rgba(122, 41, 65, 0.16);
          transition: transform 0.16s ease, box-shadow 0.18s ease,
            filter 0.18s ease;
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

        /* ====== SKELETON ====== */
        .pdShell--sk {
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
          height: 178px;
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

        /* ====== RESPONSIVO ====== */
        @media (max-width: 1100px) {
          .pdGrid {
            grid-template-columns: 1fr;
          }
          .pdHero {
            position: relative;
            top: auto;
          }
        }

        @media (max-width: 780px) {
          .pdAll {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}