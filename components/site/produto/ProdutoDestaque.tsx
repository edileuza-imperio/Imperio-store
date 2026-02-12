"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { useProdutoDestaque } from "@/hooks/produto/useProdutoDestaque";
import { Eye, ShoppingCart, ArrowRight, Star } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return "/placeholder.png";
  const base = api.defaults.baseURL || "";
  return `${base.replace(/\/+$/, "")}/${caminho.replace(/^\/+/, "")}`;
};

type MeResponse = {
  dados?: {
    id_usuario?: number;
    id?: number;
    nome?: string;
    email?: string;
  };
};

function SkeletonCard() {
  return (
    <div className="pCard pCard--sk">
      <div className="pMedia">
        <div className="sk skImg" />
      </div>
      <div className="pBody">
        <div className="sk skTitle" />
        <div className="sk skLine" />
        <div className="sk skLine sm" />
        <div className="pFooter">
          <div className="sk skPrice" />
          <div className="sk skBtn" />
        </div>
      </div>

      <style jsx>{`
        .pCard--sk { pointer-events: none; }
        .sk {
          background: linear-gradient(90deg, rgba(17,24,39,0.06), rgba(17,24,39,0.12), rgba(17,24,39,0.06));
          background-size: 220% 100%;
          animation: shimmer 1.1s linear infinite;
          border-radius: 12px;
        }
        .skImg { width: 74%; height: 72%; border-radius: 18px; }
        .skTitle { width: 78%; height: 14px; margin-bottom: 10px; }
        .skLine { width: 100%; height: 10px; margin-bottom: 8px; }
        .skLine.sm { width: 72%; }
        .skPrice { width: 96px; height: 18px; border-radius: 999px; }
        .skBtn { width: 110px; height: 38px; border-radius: 12px; }
        @keyframes shimmer { 0%{background-position:0% 0%} 100%{background-position:-220% 0%} }
      `}</style>
    </div>
  );
}

export default function ProdutoDestaque() {
  const { destaques, loading, error } = useProdutoDestaque();

  // usuário sem localStorage: pega do /me
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    const carregarMe = async () => {
      try {
        const res = await api.get<MeResponse>("/me");
        const id = res.data?.dados?.id_usuario ?? res.data?.dados?.id ?? null;
        setUsuarioId(typeof id === "number" ? id : null);
      } catch {
        setUsuarioId(null);
      }
    };
    carregarMe();
  }, []);

  const LIMITE_VITRINE = 8;
  const vitrine = useMemo(() => (destaques || []).slice(0, LIMITE_VITRINE), [destaques]);
  const mostrarBotao = (destaques?.length || 0) > LIMITE_VITRINE;

  if (error) return null;
  if (!loading && !vitrine.length) return null;

  const adicionarAoCarrinho = async (produto: any) => {
    try {
      // se não tiver usuário logado
      if (!usuarioId) {
        toast.info("Faça login para adicionar ao carrinho.");
        window.location.href = "/login";
        return;
      }

      setAddingId(produto.id_produto);

      await api.post("/carrinho/adicionar", {
        usuarioId: usuarioId,
        produtoId: produto.id_produto,
        quantidade: 1,
        precoUnitario: Number(produto.preco),
      });

      toast.success("Adicionado ao carrinho ✅");
    } catch (err: any) {
      console.error("❌ Erro ao adicionar no carrinho:", err.response?.data || err.message || err);
      toast.error("Erro ao adicionar no carrinho");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="pd">
      <ToastContainer position="top-right" />

      <div className="container">
        {/* header profissional */}
        <div className="pdHead">
          <div>
            <div className="pdKicker">
              <Star size={14} />
              Produtos em destaque
            </div>
            <h2 className="pdTitle">Seleção premium da vitrine</h2>
            <p className="pdSub">
              Os melhores itens para você comprar rápido e com confiança.
            </p>
          </div>

          {mostrarBotao && (
            <Link href="/produtos/destaques" className="pdAll">
              Ver todos <ArrowRight size={18} />
            </Link>
          )}
        </div>

        {/* grid */}
        <div className="row g-4">
          {(loading ? Array.from({ length: LIMITE_VITRINE }) : vitrine).map((item: any, idx: number) => {
            if (loading) {
              return (
                <div key={idx} className="col-6 col-md-4 col-lg-3">
                  <SkeletonCard />
                </div>
              );
            }

            // seu hook parece devolver campos "produto_*" (site) — então converto para um shape único
            const produto = {
              id_produto: item.produto_id ?? item.id_produto ?? item.produtoId ?? item.produto_id_produto ?? item.produto_id,
              nome: item.produto_nome ?? item.nome,
              slug: item.produto_slug ?? item.slug,
              descricao: item.produto_descricao ?? item.descricao,
              preco: item.produto_preco ?? item.preco,
              imagem: item.produto_imagem ?? item.imagem,
              id_destaque: item.id_destaque,
            };

            const isAdding = addingId === produto.id_produto;

            return (
              <div key={item.id_destaque ?? produto.id_produto} className="col-6 col-md-4 col-lg-3">
                <article className="pCard">
                  {/* badge */}
                  <div className="pBadge">
                    <Star size={13} />
                    Destaque
                  </div>

                  {/* media */}
                  <Link href={`/produto/${produto.slug}`} className="pMedia" aria-label={`Ver ${produto.nome}`}>
                    <img src={getImagemUrl(produto.imagem)} alt={produto.nome} loading="lazy" />
                  </Link>

                  {/* body */}
                  <div className="pBody">
                    <h6 className="pName" title={produto.nome}>{produto.nome}</h6>
                    <p className="pDesc">
                      {produto.descricao ? String(produto.descricao).slice(0, 72) + "…" : "Produto premium em destaque."}
                    </p>

                    <div className="pFooter">
                      <div className="pPrice">R$ {Number(produto.preco).toFixed(2)}</div>

                      <Link href={`/produto/${produto.slug}`} className="pQuick" title="Ver detalhes">
                        <Eye size={16} />
                      </Link>
                    </div>

                    {/* CTA real */}
                    <button
                      className="pAdd"
                      onClick={() => adicionarAoCarrinho(produto)}
                      disabled={isAdding}
                      title="Adicionar ao carrinho"
                    >
                      <ShoppingCart size={16} />
                      {isAdding ? "Adicionando..." : "Adicionar ao carrinho"}
                    </button>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* CTA mobile */}
        {mostrarBotao && (
          <div className="pdMore d-md-none">
            <Link href="/produtos/destaques" className="pdMoreBtn">
              Ver todos os destaques <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ===== seção profissional ===== */
        .pd {
          padding: 38px 0;
          background:
            radial-gradient(900px 260px at 15% 0%, rgba(176,141,87,0.10), transparent 60%),
            radial-gradient(900px 260px at 85% 0%, rgba(122,41,65,0.08), transparent 60%);
        }

        .pdHead {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .pdKicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 0.82rem;
          color: #7a2941;
          background: rgba(122,41,65,0.10);
          border: 1px solid rgba(122,41,65,0.12);
          width: fit-content;
          margin-bottom: 10px;
        }

        .pdTitle {
          margin: 0 0 6px;
          font-size: 2.0rem;
          font-weight: 1000;
          letter-spacing: -0.03em;
          color: #111827;
        }

        .pdSub {
          margin: 0;
          color: rgba(17,24,39,0.70);
          max-width: 640px;
        }

        .pdAll {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 999px;
          color: #111827;
          background: #fff;
          border: 1px solid rgba(17,24,39,0.10);
          text-decoration: none;
          font-weight: 900;
          box-shadow: 0 10px 28px rgba(17,24,39,0.08);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          white-space: nowrap;
        }
        .pdAll:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 44px rgba(17,24,39,0.12);
        }

        /* ===== card premium clean ===== */
        .pCard {
          position: relative;
          height: 100%;
          border-radius: 18px;
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(17,24,39,0.10);
          box-shadow: 0 14px 42px rgba(17,24,39,0.08);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .pCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 22px 62px rgba(17,24,39,0.12);
        }

        .pBadge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 0.72rem;
          color: #fff;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          box-shadow: 0 12px 30px rgba(122,41,65,0.18);
        }

        .pMedia {
          display: grid;
          place-items: center;
          padding: 18px 14px;
          height: 190px;
          background: linear-gradient(135deg, rgba(17,24,39,0.03), rgba(122,41,65,0.02));
          border-bottom: 1px solid rgba(17,24,39,0.06);
          text-decoration: none;
        }

        .pMedia img {
          width: 88%;
          height: 88%;
          object-fit: contain;
          transition: transform 0.35s ease, filter 0.35s ease;
          filter: saturate(1.02);
        }

        .pCard:hover .pMedia img {
          transform: scale(1.08);
          filter: saturate(1.06) brightness(1.02);
        }

        .pBody {
          padding: 14px 14px 16px;
        }

        .pName {
          margin: 0 0 6px;
          font-size: 0.98rem;
          font-weight: 1000;
          color: #111827;
          letter-spacing: -0.02em;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pDesc {
          margin: 0 0 12px;
          font-size: 0.84rem;
          color: rgba(17,24,39,0.72);
          line-height: 1.25rem;
          min-height: 44px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pFooter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .pPrice {
          font-weight: 1100;
          color: #7a2941;
          font-size: 1.05rem;
          letter-spacing: -0.01em;
        }

        .pQuick {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(17,24,39,0.06);
          border: 1px solid rgba(17,24,39,0.10);
          color: #111827;
          text-decoration: none;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .pQuick:hover { transform: translateY(-2px); background: rgba(17,24,39,0.10); }

        /* CTA principal (profissional) */
        .pAdd {
          width: 100%;
          height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.18);
          background: linear-gradient(135deg, #7a2941, #b08d57);
          color: #fff;
          font-weight: 1000;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 14px 36px rgba(122,41,65,0.18);
          transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
          cursor: pointer;
        }
        .pAdd:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 52px rgba(122,41,65,0.24);
          filter: brightness(0.98);
        }
        .pAdd:disabled {
          opacity: 0.75;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 10px 26px rgba(122,41,65,0.12);
        }

        /* mobile */
        .pdMore { margin-top: 18px; text-align: center; }
        .pdMoreBtn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 26px;
          border-radius: 999px;
          background: #111827;
          color: #fff;
          font-weight: 1000;
          text-decoration: none;
          transition: transform 0.22s ease;
        }
        .pdMoreBtn:hover { transform: translateY(-2px); }

        @media (max-width: 768px) {
          .pdHead { flex-direction: column; align-items: flex-start; }
          .pdAll { display: none; }
        }
        @media (max-width: 576px) {
          .pMedia { height: 150px; }
          .pDesc { min-height: 38px; }
        }
      `}</style>
    </section>
  );
}
