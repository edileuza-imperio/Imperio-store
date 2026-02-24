"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { useProdutoDestaque } from "@/hooks/produto/useProdutoDestaque";
 // ✅ usa o arquivo de rotas
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  Star,
  ShoppingCart,
  Loader2,
  Check,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { rotas } from "@/components/Bibioteca/config/rotas";

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
          background: rgba(255, 250, 242, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.05);
          border-radius: 18px;
          overflow: hidden;
        }
        .pdSk {
          border-radius: 12px;
          background: linear-gradient(
            90deg,
            rgba(122, 41, 65, 0.05),
            rgba(176, 141, 87, 0.14),
            rgba(122, 41, 65, 0.05)
          );
          background-size: 220% 100%;
          animation: sh 1.05s linear infinite;
        }
        .pdSk--img {
          height: 170px;
          width: 100%;
          border-radius: 16px;
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
          border-radius: 14px;
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
      // ✅ usa a rota do arquivo de rotas (API)
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
        {/* topo da vitrine */}
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
            // ✅ usa rota de página do arquivo rotas
            <Link href={rotas.produtos.paginas.destaques} className="pdAll">
              Ver todos <ArrowRight size={18} />
            </Link>
          )}
        </div>

        {/* vitrine */}
        <div className="pdGrid">
          {/* hero menor e mais premium */}
          <aside className="pdHero">
            <div className="pdHeroTop">
              <div className="pdHeroIcon">
                <Star size={18} />
              </div>
              <span className="pdHeroChip">
                <TrendingUp size={14} /> Em alta
              </span>
            </div>

            <h3 className="pdHeroTitle">Vitrine premium da semana</h3>
            <p className="pdHeroText">
              Seleção enxuta, elegante e com foco em conversão.
            </p>

            <div className="pdHeroBullets">
              <span>✓ Imagem em destaque</span>
              <span>✓ Preço com contraste</span>
              <span>✓ CTA direto</span>
            </div>

            {/* ✅ CTA com brilho + seta animada */}
            <Link href={rotas.produtos.paginas.destaques} className="pdHeroCta">
              Explorar destaques{" "}
              <span className="pdHeroCtaIcon">
                <ArrowRight size={18} />
              </span>
            </Link>
          </aside>

          {/* cards */}
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

                  // ✅ usa rota de página do arquivo rotas
                  const href = rotas.produtos.paginas.produto(item.produto_slug);

                  return (
                    <div
                      className="pdCardOuter"
                      key={item.id_destaque ?? produtoId}
                    >
                      <Link
                        href={href}
                        className="pdCard"
                        aria-label={`Ver detalhes de ${item.produto_nome}`}
                      >
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

                          <div className="pdHint">Clique para ver detalhes</div>
                        </div>
                      </Link>

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
                              Adicionar
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
        /* fundo geral */
        .pdWrap {
          position: relative;
          padding: 64px 0;
          background: #f8f3ea;
          overflow: hidden;
        }
        .pdWrap::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
              900px 420px at 0% 0%,
              rgba(176, 141, 87, 0.2),
              transparent 60%
            ),
            radial-gradient(
              700px 380px at 100% 0%,
              rgba(122, 41, 65, 0.12),
              transparent 60%
            );
          pointer-events: none;
          z-index: 0;
        }

        .pdContainer {
          position: relative;
          z-index: 1;
          width: min(1220px, calc(100% - 40px));
          margin: 0 auto;
        }

        /* head */
        .pdHead {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }
        .pdKicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
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
          font-size: clamp(1.9rem, 2.8vw, 2.6rem);
          font-weight: 950;
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
          margin-top: 14px;
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
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(0, 0, 0, 0.06);
          color: rgba(11, 18, 32, 0.82);
          font-weight: 850;
          font-size: 0.88rem;
          backdrop-filter: blur(8px);
        }
        .pdAll {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 999px;
          color: #fff;
          text-decoration: none;
          font-weight: 950;
          background: linear-gradient(135deg, #0b1220, #1f2937);
          box-shadow: 0 14px 42px rgba(17, 24, 39, 0.16);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }
        .pdAll:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 58px rgba(17, 24, 39, 0.22);
        }

        /* vitrine layout */
        .pdGrid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 22px;
          align-items: start;
        }

        /* hero */
        .pdHero {
          border-radius: 24px;
          padding: 20px;
          color: #fff;
          background: linear-gradient(160deg, #0b1220, #7a2941, #b08d57);
          box-shadow: 0 22px 70px rgba(122, 41, 65, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.18);
          position: sticky;
          top: 18px;
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
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 950;
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
          opacity: 0.94;
          line-height: 1.4rem;
          font-size: 0.95rem;
        }
        .pdHeroBullets {
          display: grid;
          gap: 7px;
          margin-bottom: 16px;
          font-weight: 850;
          opacity: 0.96;
        }

        /* ✅ CTA HERO MAIS “DESTAQUE” */
        .pdHeroCta {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          height: 48px;
          border-radius: 16px;

          background: linear-gradient(135deg, #ffffff, #fff3df);
          color: #0b1220;
          font-weight: 950;
          text-decoration: none;

          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.22) inset;

          transition: transform 0.18s ease, box-shadow 0.22s ease,
            filter 0.22s ease;
          overflow: hidden;
        }

        .pdHeroCta::before {
          content: "";
          position: absolute;
          inset: -2px;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.55) 35%,
            transparent 70%
          );
          transform: translateX(-120%);
          transition: transform 0.7s ease;
        }

        .pdHeroCta:hover {
          transform: translateY(-2px);
          filter: brightness(1.03);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.33),
            0 0 0 1px rgba(255, 255, 255, 0.26) inset;
        }
        .pdHeroCta:hover::before {
          transform: translateX(120%);
        }
        .pdHeroCta:active {
          transform: translateY(0px);
        }

        .pdHeroCtaIcon {
          display: inline-flex;
          transition: transform 0.18s ease;
        }
        .pdHeroCta:hover .pdHeroCtaIcon {
          transform: translateX(4px);
        }

        /* cards */
        .pdCards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
          min-width: 0;
        }
        .pdCardOuter {
          display: grid;
          grid-template-rows: 1fr auto;
          gap: 12px;
          min-width: 0;
        }
        .pdCard {
          position: relative;
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 330px;
          border-radius: 18px;
          overflow: hidden;
          text-decoration: none;
          background: #fffaf2;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .pdCard:hover {
          transform: translateY(-7px);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.1);
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
          font-weight: 950;
          color: #0b1220;
          background: #f3e8d8;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .pdMedia {
          padding: 12px;
          background: linear-gradient(
            180deg,
            rgba(176, 141, 87, 0.1),
            rgba(176, 141, 87, 0)
          );
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .pdImageShell {
          height: 178px;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.04);
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
          font-weight: 950;
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
          font-size: 1.02rem;
        }
        .pdMini {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: rgba(11, 18, 32, 0.66);
          font-weight: 850;
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
          font-weight: 850;
        }

        /* botão carrinho */
        .pdFooter {
          display: grid;
        }
        .pdBtn {
          height: 46px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 950;
          border: 1px solid rgba(11, 18, 32, 0.1);
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
          border: none;
          box-shadow: 0 15px 40px rgba(122, 41, 65, 0.22);
        }
        .pdBtnSolid:hover {
          box-shadow: 0 22px 55px rgba(122, 41, 65, 0.34);
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