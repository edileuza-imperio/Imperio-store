"use client";

import Link from "next/link";
import api from "@/Api/conectar";
import { useProdutoDestaque } from "@/hooks/produto/useProdutoDestaque";
import { Star, ShoppingCart, Eye, ArrowRight } from "lucide-react";

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return "/placeholder.png";
  const base = api.defaults.baseURL || "";
  return `${base.replace(/\/+$/, "")}/${caminho.replace(/^\/+/, "")}`;
};

function SkeletonCard() {
  return (
    <div className="cardp cardp--sk">
      <div className="cardp__media">
        <div className="sk sk-media" />
      </div>
      <div className="cardp__body">
        <div className="sk sk-title" />
        <div className="sk sk-line" />
        <div className="sk sk-line sm" />
        <div className="cardp__footer">
          <div className="sk sk-price" />
          <div className="sk sk-actions" />
        </div>
      </div>

      <style jsx>{`
        .cardp--sk { pointer-events: none; }
        .sk {
          background: linear-gradient(90deg, rgba(17,24,39,0.06), rgba(17,24,39,0.12), rgba(17,24,39,0.06));
          background-size: 220% 100%;
          animation: shimmer 1.1s linear infinite;
          border-radius: 12px;
        }
        .sk-media { width: 74%; height: 70%; border-radius: 16px; }
        .sk-title { width: 75%; height: 14px; margin-bottom: 10px; }
        .sk-line { width: 100%; height: 10px; margin-bottom: 8px; }
        .sk-line.sm { width: 70%; }
        .sk-price { width: 92px; height: 18px; border-radius: 999px; }
        .sk-actions { width: 84px; height: 38px; border-radius: 999px; }
        @keyframes shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: -220% 0%; }
        }
      `}</style>
    </div>
  );
}

export default function ProdutoDestaque() {
  const { destaques, loading, error } = useProdutoDestaque();
  if (error) return null;

  const LIMITE_VITRINE = 8;
  const mostrarBotao = (destaques?.length || 0) > LIMITE_VITRINE;
  const vitrine = (destaques || []).slice(0, LIMITE_VITRINE);

  // Se estiver carregando, ainda assim renderiza a seção com skeleton (fica mais profissional)
  if (!loading && (!vitrine?.length || !destaques?.length)) return null;

  return (
    <section className="pd">
      <div className="container">
        {/* HEADER PROFISSIONAL */}
        <div className="pd__header">
          <div className="pd__titleWrap">
            <div className="pd__kicker">
              <Star size={14} />
              Destaques
            </div>
            <h2 className="pd__title">Produtos em destaque</h2>
            <p className="pd__subtitle">
              Selecionados para a vitrine — qualidade, elegância e ótimo custo-benefício.
            </p>
          </div>

          {mostrarBotao && (
            <Link href="/produtos/destaques" className="pd__linkAll">
              Ver todos <ArrowRight size={18} />
            </Link>
          )}
        </div>

        {/* GRID */}
        <div className="row g-4">
          {(loading ? Array.from({ length: LIMITE_VITRINE }) : vitrine).map((item: any, idx: number) => (
            <div key={loading ? idx : item.id_destaque} className="col-6 col-md-4 col-lg-3">
              {loading ? (
                <SkeletonCard />
              ) : (
                <article className="cardp">
                  {/* Badge discreto */}
                  <div className="cardp__badge">
                    <Star size={13} />
                    Destaque
                  </div>

                  <Link href={`/produto/${item.produto_slug}`} className="cardp__media">
                    <img
                      src={getImagemUrl(item.produto_imagem)}
                      alt={item.produto_nome}
                      loading="lazy"
                    />
                  </Link>

                  <div className="cardp__body">
                    <h6 className="cardp__name" title={item.produto_nome}>
                      {item.produto_nome}
                    </h6>

                    <p className="cardp__desc">
                      {item.produto_descricao
                        ? item.produto_descricao.slice(0, 70) + "…"
                        : "Produto em destaque com acabamento premium."}
                    </p>

                    <div className="cardp__footer">
                      <div className="cardp__price">
                        R$ {Number(item.produto_preco).toFixed(2)}
                      </div>

                      <div className="cardp__actions">
                        <Link
                          href={`/produto/${item.produto_slug}`}
                          className="btnIcon"
                          title="Ver produto"
                          aria-label="Ver produto"
                        >
                          <Eye size={16} />
                        </Link>

                        <Link
                          href="/carrinho"
                          className="btnIcon btnIcon--primary"
                          title="Ir ao carrinho"
                          aria-label="Ir ao carrinho"
                        >
                          <ShoppingCart size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )}
            </div>
          ))}
        </div>

        {/* CTA MOBILE */}
        {mostrarBotao && (
          <div className="pd__more d-md-none">
            <Link href="/produtos/destaques" className="pd__moreBtn">
              Ver todos os destaques <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ===== SEÇÃO CLEAN PROFISSIONAL ===== */
        .pd {
          padding: 34px 0;
          background:
            radial-gradient(900px 280px at 15% 0%, rgba(176,141,87,0.10), transparent 55%),
            radial-gradient(900px 280px at 85% 0%, rgba(122,41,65,0.08), transparent 55%);
        }

        .pd__header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 16px;
        }

        .pd__kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.82rem;
          color: #7a2941;
          background: rgba(122,41,65,0.10);
          border: 1px solid rgba(122,41,65,0.12);
          width: fit-content;
          margin-bottom: 10px;
        }

        .pd__title {
          margin: 0 0 6px;
          font-size: 1.85rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #111827;
        }

        .pd__subtitle {
          margin: 0;
          color: rgba(17,24,39,0.70);
          max-width: 620px;
        }

        .pd__linkAll {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 999px;
          color: #111827;
          background: #fff;
          border: 1px solid rgba(17,24,39,0.10);
          text-decoration: none;
          font-weight: 800;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          box-shadow: 0 10px 28px rgba(17,24,39,0.08);
          white-space: nowrap;
        }
        .pd__linkAll:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 44px rgba(17,24,39,0.12);
        }

        /* ===== CARD ===== */
        .cardp {
          position: relative;
          height: 100%;
          border-radius: 18px;
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(17,24,39,0.10);
          box-shadow: 0 14px 42px rgba(17,24,39,0.08);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .cardp:hover {
          transform: translateY(-6px);
          box-shadow: 0 22px 62px rgba(17,24,39,0.12);
        }

        .cardp__badge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 0.72rem;
          color: #fff;
          background: linear-gradient(135deg, #7a2941, #b08d57);
          box-shadow: 0 12px 30px rgba(122,41,65,0.18);
        }

        .cardp__media {
          display: grid;
          place-items: center;
          padding: 18px 14px;
          height: 190px;
          background: linear-gradient(135deg, rgba(17,24,39,0.03), rgba(122,41,65,0.02));
          border-bottom: 1px solid rgba(17,24,39,0.06);
          text-decoration: none;
        }

        .cardp__media img {
          width: 88%;
          height: 88%;
          object-fit: contain;
          transition: transform 0.35s ease, filter 0.35s ease;
          filter: saturate(1.02);
        }

        .cardp:hover .cardp__media img {
          transform: scale(1.08);
          filter: saturate(1.06) brightness(1.02);
        }

        .cardp__body {
          padding: 14px 14px 16px;
        }

        .cardp__name {
          margin: 0 0 6px;
          font-size: 0.98rem;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.02em;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cardp__desc {
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

        .cardp__footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }

        .cardp__price {
          font-weight: 1000;
          color: #7a2941;
          font-size: 1.05rem;
          letter-spacing: -0.01em;
        }

        .cardp__actions {
          display: flex;
          gap: 8px;
        }

        .btnIcon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(17,24,39,0.06);
          border: 1px solid rgba(17,24,39,0.10);
          color: #111827;
          text-decoration: none;
          transition: transform 0.20s ease, background 0.20s ease, box-shadow 0.20s ease;
        }
        .btnIcon:hover { transform: translateY(-2px); background: rgba(17,24,39,0.10); }

        .btnIcon--primary {
          color: #fff;
          border: 1px solid rgba(255,255,255,0.18);
          background: linear-gradient(135deg, #7a2941, #b08d57);
          box-shadow: 0 14px 36px rgba(122,41,65,0.18);
        }
        .btnIcon--primary:hover {
          box-shadow: 0 20px 52px rgba(122,41,65,0.24);
          background: linear-gradient(135deg, #6b2438, #a5814f);
        }

        /* MOBILE CTA */
        .pd__more {
          margin-top: 18px;
          text-align: center;
        }

        .pd__moreBtn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 26px;
          border-radius: 999px;
          background: #111827;
          color: #fff;
          font-weight: 900;
          text-decoration: none;
          transition: transform 0.22s ease;
        }
        .pd__moreBtn:hover { transform: translateY(-2px); }

        @media (max-width: 768px) {
          .pd__header { flex-direction: column; align-items: flex-start; }
          .pd__linkAll { display: none; }
        }

        @media (max-width: 576px) {
          .cardp__media { height: 150px; }
          .cardp__desc { min-height: 38px; }
        }
      `}</style>
    </section>
  );
}
