'use client';

import useCategoria from "@/hooks/categoria/useCategoria";
import { useRouter } from "next/navigation";

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria(1);
  const router = useRouter();

  if (loading || erro || categorias.length === 0) return null;

  return (
    <>
      {/* CSS INLINE (PRO) */}
      <style jsx>{`
        :global(:root) {
          --brand: #b5486d;       /* rosa queimado */
          --brandHover: #9f3d5f;
          --text: #111827;
          --muted: #6b7280;
          --border: #e5e7eb;
          --bg: #f7f7f8;
          --card: #ffffff;
          --radius: 16px;
          --shadow: 0 10px 24px rgba(17, 24, 39, 0.08);
          --shadowHover: 0 16px 36px rgba(17, 24, 39, 0.12);
        }

        /* Evita depender de bootstrap container */
        .wrap {
          width: min(1200px, 92vw);
          margin: 0 auto;
          padding: 28px 0;
        }

        .section {
          padding: 10px 0 22px;
        }

        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .titleBlock h2 {
          margin: 0;
          font-size: 22px;
          letter-spacing: -0.02em;
          color: var(--text);
        }

        .titleBlock p {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.4;
        }

        .hint {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--muted);
          font-size: 12px;
          white-space: nowrap;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: var(--brand);
          box-shadow: 0 0 0 4px rgba(181, 72, 109, 0.14);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        /* card */
        .item {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          user-select: none;
        }

        .item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadowHover);
          border-color: rgba(181, 72, 109, 0.22);
        }

        .iconWrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(
            135deg,
            rgba(181, 72, 109, 0.14),
            rgba(17, 24, 39, 0.03)
          );
          border: 1px solid rgba(181, 72, 109, 0.18);
          flex: 0 0 auto;
        }

        /* bootstrap icon */
        .icon {
          font-size: 22px;
          color: var(--brand);
          line-height: 1;
        }

        .nameBlock {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .name {
          font-size: 14px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.01em;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sub {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.2;
        }

        /* Responsivo */
        @media (min-width: 640px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }
        }

        @media (min-width: 980px) {
          .grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 16px;
          }

          .item {
            padding: 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            min-height: 130px;
          }

          .iconWrap {
            width: 52px;
            height: 52px;
            border-radius: 14px;
          }

          .icon {
            font-size: 24px;
          }

          .name {
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .sub {
            margin-top: 2px;
          }
        }

        /* Acessibilidade */
        .item:focus-visible {
          outline: 3px solid rgba(181, 72, 109, 0.25);
          outline-offset: 2px;
        }
      `}</style>

      <section className="section">
        <div className="wrap">
          <div className="head">
            <div className="titleBlock">
              <h2>Categorias em destaque</h2>
              <p>Encontre rápido o que você procura</p>
            </div>

            <div className="hint" aria-hidden="true">
              <span className="dot" />
              Toque para filtrar
            </div>
          </div>

          <div className="grid">
            {categorias.slice(0, 6).map((categoria) => (
              <button
                key={categoria.id_categoria}
                type="button"
                className="item"
                onClick={() => router.push(`/catalogo?categoria=${categoria.id_categoria}`)}
                aria-label={`Ver produtos da categoria ${categoria.nome}`}
              >
                <div className="iconWrap" aria-hidden="true">
                  <i className={`bi ${categoria.icone} icon`} />
                </div>

                <div className="nameBlock">
                  <div className="name">{categoria.nome}</div>
                  <div className="sub">Ver produtos</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
