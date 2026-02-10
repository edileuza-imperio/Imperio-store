'use client';

import Link from "next/link";
import api from "@/Api/conectar";
import { useProdutoDestaque } from "@/hooks/produto/useProdutoDestaque";
import { Star, ShoppingCart, Eye, Sparkles, ArrowRight } from "lucide-react";

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return "/placeholder.png";
  const base = api.defaults.baseURL || "";
  // Garante barra entre baseURL e caminho
  return `${base.replace(/\/+$/, "")}/${caminho.replace(/^\/+/, "")}`;
};


export default function ProdutoDestaque() {
  const { destaques, loading, error } = useProdutoDestaque();

  if (loading || error || !destaques?.length) return null;

  const LIMITE_VITRINE = 8;
  const mostrarBotao = destaques.length > LIMITE_VITRINE;
  const vitrine = destaques.slice(0, LIMITE_VITRINE);

  return (
    <section className="container my-5 vitrine-wrapper">
      <div className="row g-4">

        {/* ===== MINI BANNER ===== */}
        <div className="col-lg-3 col-md-4">
          <div className="mini-banner">
            <div className="icone-banner">
              <Sparkles size={28} />
            </div>
            <h3>Destaques da Loja</h3>
            <p>
              Produtos selecionados com alto padrão, elegância e excelente custo-benefício.
            </p>
            <div className="linha-decorativa" />
          </div>
        </div>

        {/* ===== VITRINE ===== */}
        <div className="col-lg-9 col-md-8">
          <div className="row g-4">
            {vitrine.map((item) => (
              <div key={item.id_destaque} className="col-6 col-md-4 col-lg-3">
                <div className="produto-card">

                  {/* Faixa de destaque */}
                  <div className="faixa">
                    <Star size={14} />
                    Destaque
                  </div>

                  {/* Imagem */}
                  <Link href={`/produto/${item.produto_slug}`}>
                    <div className="produto-img">
                      <img
                        src={getImagemUrl(item.produto_imagem)}
                        alt={item.produto_nome}
                      />
                    </div>
                  </Link>

                  {/* Conteúdo */}
                  <div className="produto-info">
                    <h6>{item.produto_nome}</h6>
                    <p>
                      {item.produto_descricao
                        ? item.produto_descricao.slice(0, 60) + "..."
                        : "Produto em destaque de alta qualidade."}
                    </p>

                    <div className="footer-card">
                      <span className="preco">
                        R$ {Number(item.produto_preco).toFixed(2)}
                      </span>

                      <div className="acoes">
                        <Link href={`/produto/${item.produto_slug}`} className="icon-btn eye">
                          <Eye size={16} />
                        </Link>

                        <Link href={`/carrinho`} className="icon-btn cart">
                          <ShoppingCart size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Botão ver mais */}
          {mostrarBotao && (
            <div className="ver-mais-wrapper">
              <Link href="/produtos/destaques" className="btn-ver-mais">
                Ver todos os destaques
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ===== ESTILOS ===== */}
      <style jsx>{`
        .vitrine-wrapper {
          position: relative;
        }

        /* ===== MINI BANNER ===== */
        .mini-banner {
          background: linear-gradient(160deg, #b08d57, #7a2941);
          border-radius: 28px;
          padding: 36px 28px;
          color: #fff;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .mini-banner::after {
          content: '';
          position: absolute;
          top: -25%;
          left: -25%;
          width: 150%;
          height: 150%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          transform: rotate(30deg);
        }

        .icone-banner {
          width: 56px;
          height: 56px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.2);
          border-radius: 16px;
        }

        .mini-banner h3 {
          font-size: 1.6rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .mini-banner p {
          font-size: 0.95rem;
          opacity: 0.9;
          margin-bottom: 24px;
        }

        .linha-decorativa {
          width: 70px;
          height: 4px;
          margin: 0 auto;
          border-radius: 12px;
          background: linear-gradient(90deg, #fff4d1, #e3c78a);
        }

        /* ===== CARD ===== */
        .produto-card {
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 24px;
          overflow: hidden;
          height: 100%;
          box-shadow: 0 12px 35px rgba(0,0,0,0.12);
          transition: all 0.35s ease, transform 0.35s ease;
          position: relative;
        }

        .produto-card:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }

        .faixa {
          position: absolute;
          top: 16px;
          left: 16px;
          background: linear-gradient(135deg, #e3c78a, #b08d57);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 999px;
          display: flex;
          gap: 4px;
          align-items: center;
          z-index: 2;
        }

        .produto-img {
          height: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .produto-img::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent);
          pointer-events: none;
        }

        .produto-img img {
          max-width: 80%;
          max-height: 80%;
          object-fit: contain;
          transition: transform 0.5s ease, filter 0.5s ease;
        }

        .produto-card:hover img {
          transform: scale(1.15);
          filter: brightness(1.08);
        }

        .produto-info {
          padding: 16px;
        }

        .produto-info h6 {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 4px;
          color: #111;
        }

        .produto-info p {
          font-size: 0.85rem;
          color: #444;
          margin: 6px 0 12px;
          min-height: 44px;
        }

        .footer-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preco {
          font-weight: 800;
          color: #7a2941;
          font-size: 1.15rem;
        }

        .acoes {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .icon-btn.eye {
          background: rgba(17,24,39,0.85);
        }

        .icon-btn.eye:hover {
          background: rgba(17,24,39,1);
        }

        .icon-btn.cart {
          background: #b08d57;
        }

        .icon-btn.cart:hover {
          background: #9c7842;
        }

        /* ===== VER MAIS ===== */
        .ver-mais-wrapper {
          margin-top: 30px;
          text-align: center;
        }

        .btn-ver-mais {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          padding: 14px 32px;
          border-radius: 999px;
          background: linear-gradient(135deg, #111827, #1f2937);
          color: #fff;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .btn-ver-mais:hover {
          transform: translateY(-3px);
          background: linear-gradient(135deg, #1f2937, #111827);
        }

        @media (max-width: 768px) {
          .mini-banner {
            margin-bottom: 20px;
          }
        }

        @media (max-width: 576px) {
          .produto-img {
            height: 150px;
          }

          .produto-info p {
            font-size: 0.78rem;
            min-height: 38px;
          }
        }
      `}</style>
    </section>
  );
}
