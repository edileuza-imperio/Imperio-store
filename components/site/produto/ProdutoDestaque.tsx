"use client";

import Link from "next/link";
import api from "@/Api/conectar";
import { useProdutoDestaque } from "@/hooks/produto/useProdutoDestaque";
import { Star, ShoppingCart, Eye, Sparkles, ArrowRight } from "lucide-react";

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return "/placeholder.png";
  const base = api.defaults.baseURL || "";
  return `${base.replace(/\/+$/, "")}/${caminho.replace(/^\/+/, "")}`;
};

function SkeletonCard() {
  return (
    <div className="produto-card skeleton">
      <div className="produto-img">
        <div className="sk sk-img" />
      </div>
      <div className="produto-info">
        <div className="sk sk-title" />
        <div className="sk sk-line" />
        <div className="sk sk-line small" />
        <div className="footer-card">
          <div className="sk sk-price" />
          <div className="sk sk-btn" />
        </div>
      </div>

      <style jsx>{`
        .skeleton { pointer-events: none; }
        .sk {
          background: linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.12), rgba(0,0,0,0.06));
          background-size: 220% 100%;
          animation: shimmer 1.2s infinite linear;
          border-radius: 12px;
        }
        .sk-img { width: 78%; height: 70%; border-radius: 18px; }
        .sk-title { height: 16px; width: 75%; margin-bottom: 10px; }
        .sk-line { height: 10px; width: 100%; margin-bottom: 8px; }
        .sk-line.small { width: 75%; }
        .sk-price { height: 18px; width: 90px; border-radius: 10px; }
        .sk-btn { height: 38px; width: 90px; border-radius: 999px; }
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

  const LIMITE_VITRINE = 8;
  const mostrarBotao = (destaques?.length || 0) > LIMITE_VITRINE;
  const vitrine = (destaques || []).slice(0, LIMITE_VITRINE);

  return (
    <section className="container my-5 vitrine-wrapper">
      <div className="vitrine-shell">
        {/* Header premium */}
        <div className="vitrine-header">
          <div className="header-left">
            <div className="pill">
              <Sparkles size={16} />
              Seleção especial
            </div>
            <h2 className="titulo">Destaques da Loja</h2>
            <p className="subtitulo">
              Peças selecionadas com elegância, qualidade e excelente custo-benefício.
            </p>
          </div>

          {mostrarBotao && (
            <Link href="/produtos/destaques" className="btn-ver-todos">
              Ver todos <ArrowRight size={18} />
            </Link>
          )}
        </div>

        <div className="row g-4">
          {/* Mini banner / card editorial */}
          <div className="col-lg-3 col-md-4">
            <div className="mini-banner">
              <div className="mini-top">
                <div className="icone-banner">
                  <Sparkles size={26} />
                </div>
                <span className="mini-chip">Vitrine premium</span>
              </div>

              <h3>Curadoria Império</h3>
              <p>
                Uma seleção pensada para quem busca estilo, presença e acabamento superior.
              </p>

              <div className="mini-actions">
                <Link href="/produtos/destaques" className="mini-cta">
                  Explorar coleção <ArrowRight size={18} />
                </Link>
              </div>

              <div className="mini-glow" />
            </div>
          </div>

          {/* Grid */}
          <div className="col-lg-9 col-md-8">
            <div className="row g-4">
              {loading ? (
                Array.from({ length: LIMITE_VITRINE }).map((_, i) => (
                  <div key={i} className="col-6 col-md-4 col-lg-3">
                    <SkeletonCard />
                  </div>
                ))
              ) : error || !vitrine.length ? null : (
                vitrine.map((item) => (
                  <div key={item.id_destaque} className="col-6 col-md-4 col-lg-3">
                    <div className="produto-card">
                      {/* Ribbon */}
                      <div className="ribbon">
                        <Star size={14} />
                        Destaque
                      </div>

                      {/* Imagem */}
                      <Link href={`/produto/${item.produto_slug}`} className="img-link">
                        <div className="produto-img">
                          <img
                            src={getImagemUrl(item.produto_imagem)}
                            alt={item.produto_nome}
                            loading="lazy"
                          />
                        </div>
                      </Link>

                      {/* Conteúdo */}
                      <div className="produto-info">
                        <h6 className="produto-nome" title={item.produto_nome}>
                          {item.produto_nome}
                        </h6>

                        <p className="produto-desc">
                          {item.produto_descricao
                            ? item.produto_descricao.slice(0, 70) + "…"
                            : "Produto em destaque com acabamento premium."}
                        </p>

                        <div className="footer-card">
                          <div className="preco-wrap">
                            <span className="preco">
                              R$ {Number(item.produto_preco).toFixed(2)}
                            </span>
                            <span className="tag">Pronta entrega</span>
                          </div>

                          <div className="acoes">
                            <Link
                              href={`/produto/${item.produto_slug}`}
                              className="icon-btn ghost"
                              title="Ver produto"
                            >
                              <Eye size={16} />
                            </Link>

                            <Link href={`/carrinho`} className="icon-btn solid" title="Ir ao carrinho">
                              <ShoppingCart size={16} />
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="hover-glow" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Botão ver mais (mobile/extra) */}
            {mostrarBotao && (
              <div className="ver-mais-wrapper d-md-none">
                <Link href="/produtos/destaques" className="btn-ver-mais">
                  Ver todos os destaques <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .vitrine-wrapper {
          position: relative;
        }

        .vitrine-shell {
          border-radius: 28px;
          padding: 22px;
          background: radial-gradient(1200px 420px at 20% 0%, rgba(176,141,87,0.18), transparent 55%),
                      radial-gradient(900px 380px at 95% 10%, rgba(122,41,65,0.16), transparent 55%),
                      rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.7);
          box-shadow: 0 18px 55px rgba(17, 24, 39, 0.10);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        /* ===== HEADER ===== */
        .vitrine-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(122,41,65,0.10);
          color: #7a2941;
          font-weight: 700;
          font-size: 0.85rem;
          border: 1px solid rgba(122,41,65,0.12);
        }

        .titulo {
          margin: 10px 0 6px;
          font-size: 1.9rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #1f2937;
        }

        .subtitulo {
          margin: 0;
          color: rgba(17, 24, 39, 0.70);
          font-size: 0.98rem;
          max-width: 560px;
        }

        .btn-ver-todos {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 999px;
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          background: linear-gradient(135deg, #111827, #1f2937);
          box-shadow: 0 12px 30px rgba(17,24,39,0.18);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          white-space: nowrap;
        }
        .btn-ver-todos:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(17,24,39,0.22);
        }

        /* ===== MINI BANNER ===== */
        .mini-banner {
          position: relative;
          height: 100%;
          border-radius: 26px;
          padding: 26px 22px;
          color: #fff;
          overflow: hidden;
          background: linear-gradient(160deg, #b08d57 0%, #7a2941 70%);
          box-shadow: 0 20px 55px rgba(122,41,65,0.22);
          border: 1px solid rgba(255,255,255,0.22);
        }

        .mini-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
          position: relative;
          z-index: 2;
        }

        .icone-banner {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.22);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
        }

        .mini-chip {
          font-size: 0.78rem;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(255,255,255,0.18);
        }

        .mini-banner h3 {
          position: relative;
          z-index: 2;
          font-size: 1.35rem;
          font-weight: 900;
          margin: 10px 0 10px;
        }

        .mini-banner p {
          position: relative;
          z-index: 2;
          margin: 0 0 18px;
          opacity: 0.92;
          font-size: 0.95rem;
          line-height: 1.35rem;
        }

        .mini-actions {
          position: relative;
          z-index: 2;
          margin-top: 10px;
        }

        .mini-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.22);
          color: #fff;
          text-decoration: none;
          font-weight: 800;
          transition: transform 0.25s ease, background 0.25s ease;
        }
        .mini-cta:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.22);
        }

        .mini-glow {
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle, rgba(255,255,255,0.22), transparent 58%);
          transform: rotate(25deg);
          z-index: 1;
        }

        /* ===== CARD ===== */
        .produto-card {
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          height: 100%;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(255,255,255,0.8);
          box-shadow: 0 14px 40px rgba(17, 24, 39, 0.10);
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .produto-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(17, 24, 39, 0.18);
        }

        .hover-glow {
          position: absolute;
          inset: -1px;
          background: radial-gradient(600px 180px at 30% 0%, rgba(176,141,87,0.18), transparent 55%),
                      radial-gradient(520px 160px at 90% 20%, rgba(122,41,65,0.14), transparent 55%);
          opacity: 0;
          transition: opacity 0.28s ease;
          pointer-events: none;
        }

        .produto-card:hover .hover-glow {
          opacity: 1;
        }

        .ribbon {
          position: absolute;
          top: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 900;
          color: #fff;
          background: linear-gradient(135deg, #b08d57, #7a2941);
          box-shadow: 0 10px 24px rgba(122,41,65,0.22);
          z-index: 2;
        }

        .img-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }

        .produto-img {
          height: 190px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(17,24,39,0.04), rgba(122,41,65,0.03));
          border-bottom: 1px solid rgba(17,24,39,0.06);
          position: relative;
          overflow: hidden;
        }

        .produto-img::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 10%, rgba(255,255,255,0.45), transparent 55%);
          pointer-events: none;
        }

        .produto-img img {
          width: 86%;
          height: 86%;
          object-fit: contain;
          transition: transform 0.45s ease, filter 0.45s ease;
          filter: saturate(1.02);
        }

        .produto-card:hover .produto-img img {
          transform: scale(1.10);
          filter: saturate(1.05) brightness(1.03);
        }

        .produto-info {
          padding: 14px 14px 16px;
          position: relative;
          z-index: 2;
        }

        .produto-nome {
          font-weight: 900;
          font-size: 0.98rem;
          color: #111827;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .produto-desc {
          font-size: 0.84rem;
          color: rgba(17, 24, 39, 0.72);
          margin: 0 0 12px;
          min-height: 44px;
          line-height: 1.25rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .footer-card {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }

        .preco-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .preco {
          font-weight: 1000;
          font-size: 1.05rem;
          color: #7a2941;
          letter-spacing: -0.01em;
        }

        .tag {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          width: fit-content;
          color: rgba(17,24,39,0.75);
          background: rgba(17,24,39,0.06);
          border: 1px solid rgba(17,24,39,0.08);
        }

        .acoes {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
          text-decoration: none;
        }

        .icon-btn:hover {
          transform: translateY(-2px);
        }

        .icon-btn.ghost {
          color: #111827;
          background: rgba(17,24,39,0.06);
          border: 1px solid rgba(17,24,39,0.10);
        }
        .icon-btn.ghost:hover {
          background: rgba(17,24,39,0.10);
        }

        .icon-btn.solid {
          color: #fff;
          background: linear-gradient(135deg, #b08d57, #7a2941);
          box-shadow: 0 12px 28px rgba(122,41,65,0.20);
          border: 1px solid rgba(255,255,255,0.18);
        }
        .icon-btn.solid:hover {
          box-shadow: 0 18px 40px rgba(122,41,65,0.28);
        }

        /* ===== MOBILE CTA ===== */
        .ver-mais-wrapper {
          margin-top: 18px;
          text-align: center;
        }

        .btn-ver-mais {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          padding: 14px 26px;
          border-radius: 999px;
          background: linear-gradient(135deg, #111827, #1f2937);
          color: #fff;
          font-weight: 800;
          text-decoration: none;
          transition: transform 0.25s ease;
        }

        .btn-ver-mais:hover {
          transform: translateY(-2px);
        }

        /* ===== RESPONSIVO ===== */
        @media (max-width: 768px) {
          .vitrine-shell { padding: 16px; }
          .vitrine-header { flex-direction: column; align-items: flex-start; }
          .btn-ver-todos { display: none; }
          .mini-banner { margin-bottom: 6px; }
        }

        @media (max-width: 576px) {
          .produto-img { height: 150px; }
          .produto-desc { min-height: 38px; }
        }
      `}</style>
    </section>
  );
}
