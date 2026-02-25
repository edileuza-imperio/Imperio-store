"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria();

  if (loading || erro || categorias.length === 0) return null;

  const top = categorias.slice(0, 12);

  return (
    <>
      <section className="sec" aria-label="Categorias em destaque">
        <div className="wrap">
          <header className="head">
            <div className="titleBlock">
              <div className="kicker">
                <span className="kDot" />
                Categorias
              </div>

              <h2>Categorias em destaque</h2>
              <p>Toque em uma categoria para filtrar o catálogo.</p>
            </div>

            <div className="rightSide">
              <Link className="allBtn" href="/catalogo" aria-label="Ver catálogo completo">
                Ver todas <span aria-hidden>→</span>
              </Link>
            </div>
          </header>

          {/* círculos com Link */}
          <div className="rail" role="list" aria-label="Lista de categorias">
            {top.map((c) => (
              <Link
                key={c.id_categoria}
                role="listitem"
                className="bubble"
                href={`/catalogo?categoria=${c.id_categoria}`}
                aria-label={`Filtrar catálogo por ${c.nome}`}
              >
                <span className="orb" aria-hidden>
                  <span className="orbBorder" />
                  <span className="orbGlow" />
                  <span className="orbShine" />

                  <span className="iconWrap">
                    <i className={`bi ${c.icone} icon`} />
                  </span>
                </span>

                <span className="name" title={c.nome}>
                  {c.nome}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        :global(:root) {
          --cream: #fff6ee;
          --paper: #ffffff;

          --rose: #b76e79;
          --rose2: #9f3d5f;
          --gold: #d4af37;

          --ink: #1f2937;
          --muted: rgba(31, 41, 55, 0.68);

          --line: rgba(31, 41, 55, 0.10);
          --shadow: 0 16px 44px rgba(31, 41, 55, 0.10);
          --shadowHover: 0 28px 80px rgba(31, 41, 55, 0.16);
        }

        .sec {
          padding: 54px 0 76px;
          background:
            radial-gradient(1100px 440px at 10% -18%, rgba(183, 110, 121, 0.14), transparent 62%),
            radial-gradient(950px 440px at 90% -18%, rgba(212, 175, 55, 0.13), transparent 64%),
            linear-gradient(180deg, rgba(255, 246, 238, 0.0), rgba(255, 246, 238, 0.40));
        }

        .wrap {
          width: min(1240px, 100%);
          margin: 0 auto;
          padding: 0 clamp(14px, 4vw, 28px);
        }

        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .titleBlock {
          max-width: 760px;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(31, 41, 55, 0.10);
          box-shadow: 0 14px 34px rgba(31, 41, 55, 0.08);
          font-size: 12px;
          color: rgba(31, 41, 55, 0.72);
          font-weight: 950;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          width: fit-content;
          margin-bottom: 12px;
        }

        .kDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold), var(--rose));
          box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.10);
        }

        .titleBlock h2 {
          margin: 0;
          font-size: clamp(24px, 2.3vw, 34px);
          letter-spacing: -0.05em;
          color: var(--ink);
          font-weight: 950;
          line-height: 1.05;
        }

        .titleBlock p {
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .rightSide {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .allBtn {
          border: 1px solid rgba(31, 41, 55, 0.12);
          background: rgba(255, 255, 255, 0.85);
          border-radius: 999px;
          padding: 12px 14px;
          font-size: 12px;
          font-weight: 950;
          color: rgba(31, 41, 55, 0.82);
          box-shadow: 0 18px 44px rgba(31, 41, 55, 0.08);
          transition: transform 0.18s ease, background 0.18s ease;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
        }
        .allBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.95);
        }

        /* ====== BOLHAS ====== */
        .rail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          gap: 14px;
          overflow-x: auto;
          padding: 8px 2px 14px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .rail::-webkit-scrollbar {
          display: none;
        }

        .bubble {
          scroll-snap-align: start;
          width: 132px;
          display: grid;
          justify-items: center;
          gap: 10px;
          padding: 10px 8px 2px;
          border-radius: 22px; /* área confortável pro toque */
          text-decoration: none;
          color: inherit;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        /* o círculo em si */
        .orb {
          width: 94px;
          height: 94px;
          border-radius: 999px;
          position: relative;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: var(--shadow);
          overflow: hidden;
          transform: translateZ(0);
          transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
        }

        .orbBorder {
          position: absolute;
          inset: -2px;
          border-radius: 999px;
          background: conic-gradient(
            from 210deg,
            rgba(212, 175, 55, 0.78),
            rgba(183, 110, 121, 0.70),
            rgba(212, 175, 55, 0.22),
            rgba(183, 110, 121, 0.72),
            rgba(212, 175, 55, 0.78)
          );
          opacity: 0.42;
          pointer-events: none;
          filter: blur(0.1px);
        }

        /* glow interno suave */
        .orbGlow {
          position: absolute;
          inset: -40px;
          background:
            radial-gradient(circle at 30% 30%, rgba(212, 175, 55, 0.20), transparent 55%),
            radial-gradient(circle at 70% 75%, rgba(183, 110, 121, 0.16), transparent 55%);
          pointer-events: none;
        }

        /* brilho especular */
        .orbShine {
          position: absolute;
          left: 16px;
          top: 14px;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
          opacity: 0.55;
          pointer-events: none;
        }

        .iconWrap {
          position: relative;
          z-index: 1;
          width: 74px;
          height: 74px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: linear-gradient(
            135deg,
            rgba(183, 110, 121, 0.10),
            rgba(212, 175, 55, 0.08),
            rgba(255, 255, 255, 0.55)
          );
          border: 1px solid rgba(31, 41, 55, 0.08);
        }

        .icon {
          font-size: 30px;
          color: rgba(31, 41, 55, 0.88);
        }

        .name {
          width: 100%;
          text-align: center;
          font-size: 13px;
          font-weight: 950;
          color: rgba(31, 41, 55, 0.90);
          letter-spacing: -0.01em;
          line-height: 1.15;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* hover/focus */
        @media (hover: hover) and (pointer: fine) {
          .bubble:hover .orb {
            transform: translateY(-4px) scale(1.02);
            box-shadow: var(--shadowHover);
            filter: saturate(1.04);
          }
          .bubble:hover .icon {
            color: rgba(159, 61, 95, 0.92);
          }
        }

        .bubble:active .orb {
          transform: translateY(-1px) scale(0.995);
        }

        .bubble:focus-visible {
          outline: 3px solid rgba(183, 110, 121, 0.25);
          outline-offset: 6px;
        }

        /* desktop: vira grid e mantém círculo */
        @media (min-width: 640px) {
          .rail {
            grid-auto-flow: initial;
            grid-auto-columns: initial;
            overflow: visible;
            padding: 0;
            scroll-snap-type: none;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 18px;
          }
          .bubble {
            width: auto;
          }
        }

        @media (min-width: 960px) {
          .rail {
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 22px;
          }
          .orb {
            width: 100px;
            height: 100px;
          }
          .iconWrap {
            width: 78px;
            height: 78px;
          }
          .icon {
            font-size: 32px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orb,
          .allBtn {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}