'use client';

import useCategoria from "@/hooks/categoria/useCategoria";
import { useRouter } from "next/navigation";

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria(1);
  const router = useRouter();

  if (loading || erro || categorias.length === 0) return null;

  return (
    <>
      {/* CSS INLINE */}
      <style jsx>{`
        .cat-section {
          padding: 60px 0;
          text-align: center;
        }

        .cat-title {
          font-size: 1.9rem;
          font-weight: 700;
          margin-bottom: 40px;
          color: #1f2937;
        }

        .cat-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 28px;
        }

        .cat-item {
          width: 130px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.25s ease;
        }

        .cat-item:hover {
          transform: translateY(-6px);
        }

        .cat-circle {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(183, 110, 121, 0.14),
            rgba(30, 58, 138, 0.14)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .cat-item:hover .cat-circle {
          background: linear-gradient(
            135deg,
            rgba(183, 110, 121, 0.26),
            rgba(30, 58, 138, 0.26)
          );
        }

        .cat-icon {
          font-size: 42px;
          color: #b76e79;
        }

        .cat-name {
          margin-top: 14px;
          font-size: 0.95rem;
          font-weight: 600;
          color: #374151;
          line-height: 1.3;
          max-width: 120px;
        }

        /* 📱 Mobile */
        @media (max-width: 575px) {
          .cat-item {
            width: 100px;
          }

          .cat-circle {
            width: 85px;
            height: 85px;
          }

          .cat-icon {
            font-size: 30px;
          }

          .cat-name {
            font-size: 0.8rem;
          }
        }

        /* 💻 Desktop grande */
        @media (min-width: 1200px) {
          .cat-item {
            width: 150px;
          }

          .cat-circle {
            width: 125px;
            height: 125px;
          }

          .cat-icon {
            font-size: 48px;
          }

          .cat-name {
            font-size: 1rem;
          }
        }
      `}</style>

      {/* CATEGORIAS */}
      <section className="container cat-section">
        <h2 className="cat-title">Categorias em destaque</h2>

        <div className="cat-grid">
          {categorias.slice(0, 6).map((categoria) => (
            <div
              key={categoria.id_categoria}
              className="cat-item"
              onClick={() =>
                router.push(`/catalogo?categoria=${categoria.id_categoria}`)
              }
            >
              <div className="cat-circle">
                <i className={`bi ${categoria.icone} cat-icon`} />
              </div>

              <div className="cat-name">
                {categoria.nome}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
