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
    <div className="pdCard pdCard--sk" aria-hidden>
      <div className="pdMedia">
        <div className="pdSk pdSk--img" />
      </div>
      <div className="pdBody">
        <div className="pdSk pdSk--t" />
        <div className="pdSk pdSk--l" />
        <div className="pdSk pdSk--l sm" />
        <div className="pdSk pdSk--b" />
      </div>

      <style jsx>{`
        .pdCard--sk {
          pointer-events: none;
        }
        .pdSk {
          border-radius: 14px;
          background: linear-gradient(
            90deg,
            rgba(122, 41, 65, 0.06),
            rgba(176, 141, 87, 0.10),
            rgba(122, 41, 65, 0.06)
          );
          background-size: 220% 100%;
          animation: sh 1.05s linear infinite;
        }
        .pdSk--img {
          height: 170px;
          width: 100%;
          border-radius: 18px;
        }
        .pdSk--t {
          height: 16px;
          width: 70%;
          margin: 14px 0 10px;
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
        <div className="pdHead">
          <div className="pdHeadLeft">
            <div className="pdKicker">
              <Sparkles size={16} />
              Destaques
            </div>

            <h2 className="pdTitle">Selecionados para você</h2>
            <p className="pdSub">
              Produtos em alta com qualidade e entrega rápida. Clique em um card
              para ver os detalhes.
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
            <Link href="/produtos/destaques" className="pdAll">
              Ver todos <ArrowRight size={18} />
            </Link>
          )}
        </div>

        <div className="pdGrid">
          <aside className="pdHero">
            <div className="pdHeroTop">
              <div className="pdHeroIcon">
                <Star size={18} />
              </div>
              <span className="pdHeroChip">Seleção Premium</span>
            </div>

            <h3 className="pdHeroTitle">Destaques com acabamento premium</h3>
            <p className="pdHeroText">
              Visual mais “e-commerce”: fundo creme, cards limpos e foco no
              produto.
            </p>

            <div className="pdHeroBullets">
              <span>✓ Card inteiro clicável</span>
              <span>✓ CTA único para carrinho</span>
              <span>✓ Responsivo sem overflow</span>
            </div>

            <Link href="/produtos/destaques" className="pdHeroCta">
              Explorar destaques <ArrowRight size={18} />
            </Link>
          </aside>

          <div className="pdCards">
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

                  const href = `/produto/${item.produto_slug}`;

                  return (
                    <div
                      className="pdCardOuter"
                      key={item.id_destaque ?? produtoId}
                    >
                      {/* CARD INTEIRO CLICÁVEL */}
                      <Link
                        href={href}
                        className="pdCard"
                        aria-label={`Ver detalhes de ${item.produto_nome}`}
                      >
                        <div className="pdBorder" />
                        <div className="pdBadge">
                          <Sparkles size={14} />
                          Destaque
                        </div>

                        <div className="pdMedia">
                          <div className="pdImageShell">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getImagemUrl(item.produto_imagem)}
                              alt={item.produto_nome}
                              loading="lazy"
                            />
                          </div>
                        </div>

                        <div className="pdBody">
                          <div className="pdTopLine">
                            <h4 className="pdName" title={item.produto_nome}>
                              {item.produto_nome}
                            </h4>
                            <span className="pdTag">Em alta</span>
                          </div>

                          <p className="pdDesc">
                            {item.produto_descricao
                              ? item.produto_descricao.slice(0, 76) + "…"
                              : "Destaque selecionado com ótimo custo-benefício."}
                          </p>

                          <div className="pdPriceRow">
                            <div className="pdPrice">
                              {formatBRL(item.produto_preco)}
                            </div>
                            <div className="pdMini">
                              <span className="pdDot" /> pronta entrega
                            </div>
                          </div>

                          <div className="pdHint">
                            Clique no card para ver detalhes
                          </div>
                        </div>
                      </Link>

                      {/* BOTÃO DO CARRINHO (fora do link) */}
                      <div className="pdFooter">
                        <button
                          type="button"
                          className={`pdBtn pdBtnSolid ${isAdded ? "ok" : ""}`}
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
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* base */
        .pdWrap {
          position: relative;
          padding: 34px 0;
          overflow-x: clip;
          /* fundo creme geral (e-commerce) */
          background: #fbf7f0;
        }
        @supports not (overflow: clip) {
          .pdWrap {
            overflow-x: hidden;
          }
        }

        /* textura/aurora suave em creme */
        .pdWrap::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
              900px 380px at 10% 0%,
              rgba(176, 141, 87, 0.18),
              transparent 60%
            ),
            radial-gradient(
              760px 340px at 100% 10%,
              rgba(122, 41, 65, 0.12),
              transparent 58%
            ),
            radial-gradient(
              900px 420px at 50% 100%,
              rgba(249, 245, 239, 0.92),
              rgba(249, 245, 239, 0) 65%
            );
          pointer-events: none;
          z-index: 0;
        }

        /* container (tirando “card branco” / glass) */
        .pdContainer {
          position: relative;
          z-index: 1;
          width: min(1200px, calc(100% - 24px));
          margin: 0 auto;
          padding: clamp(14px, 2.2vw, 22px);
          border-radius: 26px;

          background: rgba(249, 245, 239, 0.92); /* creme */
          border: 1px solid rgba(122, 41, 65, 0.10);
          backdrop-filter: none; /* remove glass */
          box-shadow: 0 16px 50px rgba(11, 18, 32, 0.08);

          overflow: hidden;
        }

        /* head */
        .pdHead {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .pdKicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.82rem;
          color: #7a2941;
          background: rgba(122, 41, 65, 0.10);
          border: 1px solid rgba(122, 41, 65, 0.16);
          width: fit-content;
        }

        .pdTitle {
          margin: 10px 0 6px;
          font-size: clamp(1.55rem, 2.4vw, 2.15rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #0b1220;
        }

        .pdSub {
          margin: 0;
          max-width: 70ch;
          color: rgba(11, 18, 32, 0.72);
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
          background: rgba(11, 18, 32, 0.04);
          border: 1px solid rgba(11, 18, 32, 0.10);
          color: rgba(11, 18, 32, 0.78);
          font-weight: 700;
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
          font-weight: 800;
          background: linear-gradient(135deg, #0b1220, #1f2937);
          box-shadow: 0 14px 42px rgba(17, 24, 39, 0.16);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }
        .pdAll:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 58px rgba(17, 24, 39, 0.22);
        }

        /* layout */
        .pdGrid {
          display: grid;
          grid-template-columns: minmax(260px, 340px) 1fr;
          gap: 16px;
          align-items: stretch;
        }

        /* hero */
        .pdHero {
          position: relative;
          border-radius: 22px;
          padding: 18px;
          overflow: hidden;
          color: #fff;
          background: linear-gradient(
            160deg,
            #0b1220 0%,
            #7a2941 55%,
            #b08d57 120%
          );
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 18px 56px rgba(122, 41, 65, 0.16);
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
          font-weight: 800;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .pdHeroTitle {
          margin: 8px 0 8px;
          font-size: 1.22rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .pdHeroText {
          margin: 0 0 14px;
          opacity: 0.92;
          line-height: 1.4rem;
          font-size: 0.95rem;
        }

        .pdHeroBullets {
          display: grid;
          gap: 6px;
          margin-bottom: 16px;
          font-weight: 700;
          opacity: 0.95;
        }

        .pdHeroCta {
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
          font-weight: 900;
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .pdHeroCta:hover {
          transform: translateY(-2px);
          filter: brightness(0.98);
        }

        /* cards */
        .pdCards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          align-content: start;
          min-width: 0;
        }

        .pdCardOuter {
          display: grid;
          grid-template-rows: 1fr auto;
          gap: 10px;
          min-width: 0;
        }

        /* Card clicável (agora creme, não branco) */
        .pdCard {
          position: relative;
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 330px;
          border-radius: 20px;
          overflow: hidden;
          text-decoration: none;

          background: rgba(252, 248, 242, 0.96); /* creme */
          border: 1px solid rgba(122, 41, 65, 0.10);
          box-shadow: 0 10px 30px rgba(11, 18, 32, 0.07);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        /* borda gradiente premium */
        .pdBorder {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(122, 41, 65, 0.40),
            rgba(176, 141, 87, 0.32),
            rgba(11, 18, 32, 0.10)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0.9;
        }

        .pdCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 22px 66px rgba(11, 18, 32, 0.12);
        }

        .pdBadge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 850;
          color: #0b1220;
          background: rgba(249, 245, 239, 0.92); /* creme */
          border: 1px solid rgba(122, 41, 65, 0.12);
          backdrop-filter: blur(8px);
        }

        /* header do card (menos “branco”) */
        .pdMedia {
          padding: 12px;
          background: linear-gradient(
            180deg,
            rgba(176, 141, 87, 0.10),
            rgba(176, 141, 87, 0.00)
          );
          border-bottom: 1px solid rgba(122, 41, 65, 0.06);
        }

        .pdImageShell {
          height: 178px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.55); /* bem leve */
          border: 1px solid rgba(122, 41, 65, 0.08);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .pdImageShell img {
          width: 86%;
          height: 86%;
          object-fit: contain;
          transition: transform 0.35s ease, filter 0.35s ease;
          filter: saturate(1.03);
        }

        .pdCard:hover .pdImageShell img {
          transform: scale(1.06);
          filter: saturate(1.06) brightness(1.02);
        }

        .pdBody {
          padding: 12px 12px 14px;
          display: grid;
          gap: 10px;
          min-width: 0;
        }

        .pdTopLine {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }

        .pdName {
          margin: 0;
          font-size: 1rem;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #0b1220;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-width: 0;
        }

        .pdTag {
          flex: 0 0 auto;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #0b1220;
          background: rgba(176, 141, 87, 0.14);
          border: 1px solid rgba(176, 141, 87, 0.22);
          white-space: nowrap;
        }

        .pdDesc {
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

        .pdPriceRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .pdPrice {
          font-weight: 950;
          color: #7a2941;
          letter-spacing: -0.02em;
        }

        .pdMini {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: rgba(11, 18, 32, 0.66);
          font-weight: 750;
          white-space: nowrap;
        }

        .pdDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
        }

        .pdHint {
          margin-top: -2px;
          font-size: 0.78rem;
          color: rgba(11, 18, 32, 0.58);
          font-weight: 700;
        }

        /* footer com CTA único */
        .pdFooter {
          display: grid;
        }

        .pdBtn {
          height: 46px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 900;
          border: 1px solid rgba(11, 18, 32, 0.10);
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.22s ease,
            filter 0.22s ease;
          user-select: none;
          outline: none;
          width: 100%;
        }

        .pdBtn:hover {
          transform: translateY(-2px);
        }

        .pdBtnSolid {
          color: #fff;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 14px 44px rgba(122, 41, 65, 0.16);
        }
        .pdBtnSolid:hover {
          box-shadow: 0 22px 70px rgba(122, 41, 65, 0.22);
          filter: brightness(1.02);
        }
        .pdBtnSolid.ok {
          background: linear-gradient(135deg, #166534, #22c55e);
          box-shadow: 0 14px 44px rgba(34, 197, 94, 0.14);
        }

        .pdBtn:disabled {
          opacity: 0.78;
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

        /* responsivo */
        @media (max-width: 1100px) {
          .pdGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 780px) {
          .pdAll {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 520px) {
          .pdContainer {
            border-radius: 22px;
          }
        }
      `}</style>
    </section>
  );
}