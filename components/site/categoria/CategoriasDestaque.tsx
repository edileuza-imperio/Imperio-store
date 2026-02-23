// app/components/CategoriasDestaque.tsx (ou onde estiver)
"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import { useRouter } from "next/navigation";

export default function CategoriasDestaque() {
  // ✅ nova mudança: sem parâmetro
  const { categorias, loading, erro } = useCategoria();
  const router = useRouter();

  if (loading || erro || categorias.length === 0) return null;

  return (
    <>
      <style jsx>{`
        :global(:root) {
          /* Paleta do site */
          --cream: #fff6ee;
          --cream2: #fff1e6;
          --paper: #ffffff;

          --rose: #b76e79; /* rosa queimado */
          --rose2: #9f3d5f;
          --gold: #d4af37;

          --ink: #1f2937;
          --muted: rgba(31, 41, 55, 0.68);
          --muted2: rgba(31, 41, 55, 0.55);
          --line: rgba(31, 41, 55, 0.10);

          --radius: 22px;
          --shadow: 0 20px 60px rgba(31, 41, 55, 0.10);
          --shadowHover: 0 30px 80px rgba(31, 41, 55, 0.16);
        }

        /* SECTION com mais respiro */
        .section {
          padding: 34px 0 44px;
          background:
            radial-gradient(1100px 380px at 14% -10%, rgba(183, 110, 121, 0.13), transparent 60%),
            radial-gradient(900px 380px at 86% -10%, rgba(212, 175, 55, 0.12), transparent 60%);
        }

        .wrap {
          width: min(1200px, 92vw);
          margin: 0 auto;
        }

        /* Head mais “premium” */
        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .titleBlock {
          max-width: 720px;
        }

        .titleBlock h2 {
          margin: 0;
          font-size: clamp(22px, 2.2vw, 30px);
          letter-spacing: -0.04em;
          color: var(--ink);
          font-weight: 950;
          line-height: 1.1;
        }

        .titleBlock p {
          margin: 8px 0 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.55;
        }

        .hint {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.75);
          color: rgba(31, 41, 55, 0.70);
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 16px 40px rgba(31, 41, 55, 0.08);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold), var(--rose));
          box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.10);
        }

        /* GRID com mais espaçamento */
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        /* ITEM mais “luxo” */
        .item {
          position: relative;
          width: 100%;
          text-align: left;

          background: rgba(255, 255, 255, 0.90);
          border: 1px solid rgba(31, 41, 55, 0.10);
          border-radius: var(--radius);
          box-shadow: var(--shadow);

          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;

          cursor: pointer;
          user-select: none;
          overflow: hidden;

          transition: transform 0.20s ease, box-shadow 0.20s ease, border-color 0.20s ease, filter 0.20s ease;
        }

        /* linha premium no topo do card */
        .item::after {
          content: "";
          position: absolute;
          left: 14px;
          right: 14px;
          top: 12px;
          height: 2px;
          border-radius: 99px;
          background: linear-gradient(90deg, rgba(183,110,121,0), rgba(183,110,121,.45), rgba(212,175,55,.55), rgba(183,110,121,0));
          opacity: 0.65;
          pointer-events: none;
        }

        /* glow de canto */
        .item::before {
          content: "";
          position: absolute;
          right: -60px;
          bottom: -60px;
          width: 190px;
          height: 190px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(212, 175, 55, 0.22),
            rgba(183, 110, 121, 0.18),
            transparent 62%
          );
          pointer-events: none;
        }

        .item:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadowHover);
          border-color: rgba(183, 110, 121, 0.22);
          filter: saturate(1.02);
        }

        .item:active {
          transform: translateY(-1px);
        }

        .iconWrap {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;

          background: linear-gradient(
            135deg,
            rgba(183, 110, 121, 0.16),
            rgba(212, 175, 55, 0.10),
            rgba(31, 41, 55, 0.02)
          );
          border: 1px solid rgba(183, 110, 121, 0.18);
          box-shadow: 0 18px 44px rgba(183, 110, 121, 0.10);
          flex: 0 0 auto;
        }

        .icon {
          font-size: 24px;
          color: rgba(31, 41, 55, 0.88);
          line-height: 1;
        }

        .nameBlock {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 6px; /* respiro por causa da linha do card */
        }

        .name {
          font-size: 15px;
          font-weight: 950;
          color: var(--ink);
          letter-spacing: -0.02em;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sub {
          font-size: 12px;
          color: var(--muted2);
          line-height: 1.2;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
        }

        /* badge seta */
        .sub .chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(31, 41, 55, 0.10);
          background: rgba(255, 255, 255, 0.70);
          color: rgba(183, 110, 121, 0.95);
          box-shadow: 0 12px 26px rgba(31, 41, 55, 0.08);
          transition: transform 0.16s ease;
          white-space: nowrap;
        }

        .item:hover .sub .chip {
          transform: translateX(2px);
        }

        /* Responsivo */
        @media (min-width: 640px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
          }
        }

        @media (min-width: 980px) {
          .section {
            padding: 44px 0 54px;
          }

          .grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 18px;
          }

          .item {
            padding: 18px;
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
            min-height: 170px;
          }

          .iconWrap {
            width: 62px;
            height: 62px;
            border-radius: 20px;
          }

          .icon {
            font-size: 26px;
          }

          .name {
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .nameBlock {
            padding-top: 8px;
          }
        }

        /* Acessibilidade */
        .item:focus-visible {
          outline: 3px solid rgba(183, 110, 121, 0.25);
          outline-offset: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .item,
          .sub .chip {
            transition: none;
          }
        }

        @media (max-width: 420px) {
          .hint {
            display: none;
          }
        }
      `}</style>

      <section className="section">
        <div className="wrap">
          <div className="head">
            <div className="titleBlock">
              <h2>Categorias em destaque</h2>
              <p>
                Encontre rápido o que você procura — selecione uma categoria para
                filtrar o catálogo.
              </p>
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
                onClick={() =>
                  router.push(`/catalogo?categoria=${categoria.id_categoria}`)
                }
                aria-label={`Ver produtos da categoria ${categoria.nome}`}
              >
                <div className="iconWrap" aria-hidden="true">
                  <i className={`bi ${categoria.icone} icon`} />
                </div>

                <div className="nameBlock">
                  <div className="name">{categoria.nome}</div>

                  <div className="sub">
                    <span className="chip">Ver produtos →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}