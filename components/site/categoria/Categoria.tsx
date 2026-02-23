"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import { useRouter } from "next/navigation";

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria();
  const router = useRouter();

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
              <p>Filtre o catálogo com um toque — categorias mais acessadas aparecem aqui.</p>
            </div>

            <div className="rightSide">
              <div className="hint" aria-hidden="true">
                <span className="hDot" />
                Toque para filtrar
              </div>

              <button
                type="button"
                className="allBtn"
                onClick={() => router.push("/catalogo")}
                aria-label="Ver todas as categorias no catálogo"
              >
                Ver todas <span aria-hidden>→</span>
              </button>
            </div>
          </header>

          {/* Mobile: carrossel horizontal com snap | Desktop: grid */}
          <div className="rail" role="list">
            {top.map((c) => (
              <button
                key={c.id_categoria}
                type="button"
                className="card"
                role="listitem"
                onClick={() => router.push(`/catalogo?categoria=${c.id_categoria}`)}
                aria-label={`Ver produtos da categoria ${c.nome}`}
              >
                <span className="topLine" aria-hidden />

                <div className="iconWrap" aria-hidden="true">
                  <span className="iconGlow" />
                  <i className={`bi ${c.icone} icon`} />
                </div>

                <div className="content">
                  <div className="name">{c.nome}</div>

                  <div className="meta">
                    <span className="pill">
                      Ver produtos <span className="arrow">→</span>
                    </span>
                  </div>
                </div>

                <span className="shine" aria-hidden />
              </button>
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

          --r: 26px;
          --shadow: 0 18px 60px rgba(31, 41, 55, 0.10);
          --shadowHover: 0 30px 90px rgba(31, 41, 55, 0.16);
        }

        .sec {
          padding: 54px 0 76px;
          background:
            radial-gradient(1100px 440px at 10% -18%, rgba(183, 110, 121, 0.14), transparent 62%),
            radial-gradient(950px 440px at 90% -18%, rgba(212, 175, 55, 0.13), transparent 64%),
            linear-gradient(180deg, rgba(255, 246, 238, 0.0), rgba(255, 246, 238, 0.40));
        }

        /* container fluido */
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
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
          margin-left: auto;
        }

        .hint {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 999px;
          border: 1px solid rgba(31, 41, 55, 0.10);
          background: rgba(255, 255, 255, 0.82);
          color: rgba(31, 41, 55, 0.70);
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 18px 44px rgba(31, 41, 55, 0.08);
        }

        .hDot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: var(--rose);
          box-shadow: 0 0 0 6px rgba(183, 110, 121, 0.10);
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
        }
        .allBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.95);
        }

        /* MOBILE FIRST: rail horizontal com snap */
        .rail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(240px, 78%);
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

        /* CARD */
        .card {
          scroll-snap-align: start;
          position: relative;
          text-align: left;
          border: 1px solid rgba(31, 41, 55, 0.10);
          border-radius: var(--r);
          background: rgba(255, 255, 255, 0.94);
          box-shadow: var(--shadow);
          padding: 18px;
          display: grid;
          grid-template-columns: 68px 1fr;
          gap: 14px;
          align-items: center;
          cursor: pointer;
          overflow: hidden;
          user-select: none;
          min-height: 108px;
          transition: transform 0.20s ease, box-shadow 0.20s ease, border-color 0.20s ease, filter 0.20s ease;
        }

        .topLine {
          position: absolute;
          left: 16px;
          right: 16px;
          top: 12px;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(212,175,55,0),
            rgba(212,175,55,0.55),
            rgba(183,110,121,0.45),
            rgba(212,175,55,0)
          );
          opacity: 0.78;
        }

        .iconWrap {
          width: 68px;
          height: 68px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          position: relative;
          border: 1px solid rgba(183, 110, 121, 0.18);
          background: linear-gradient(
            135deg,
            rgba(183, 110, 121, 0.14),
            rgba(212, 175, 55, 0.10),
            rgba(255, 255, 255, 0.35)
          );
          box-shadow: 0 18px 46px rgba(183, 110, 121, 0.12);
          overflow: hidden;
          flex: 0 0 auto;
        }

        .iconGlow {
          position: absolute;
          inset: -48px;
          background: radial-gradient(circle at 30% 30%, rgba(212,175,55,0.18), transparent 55%),
            radial-gradient(circle at 65% 70%, rgba(183,110,121,0.16), transparent 55%);
          filter: blur(1px);
        }

        .icon {
          position: relative;
          z-index: 1;
          font-size: 28px;
          color: rgba(31, 41, 55, 0.90);
        }

        .content {
          min-width: 0;
          padding-top: 8px;
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
          margin-bottom: 10px;
        }

        .meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(31, 41, 55, 0.10);
          background: rgba(255, 255, 255, 0.74);
          color: rgba(183, 110, 121, 0.96);
          box-shadow: 0 12px 26px rgba(31, 41, 55, 0.08);
          font-size: 12px;
          font-weight: 950;
          transition: transform 0.16s ease;
          white-space: nowrap;
        }

        .arrow {
          display: inline-block;
          transition: transform 0.16s ease;
        }

        .shine {
          position: absolute;
          right: -80px;
          top: -80px;
          width: 220px;
          height: 220px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(212, 175, 55, 0.20),
            rgba(183, 110, 121, 0.14),
            transparent 62%
          );
          pointer-events: none;
        }

        /* Desktop hover apenas onde faz sentido */
        @media (hover: hover) and (pointer: fine) {
          .card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadowHover);
            border-color: rgba(183, 110, 121, 0.20);
            filter: saturate(1.02);
          }
          .card:hover .pill {
            transform: translateX(2px);
          }
          .card:hover .arrow {
            transform: translateX(2px);
          }
        }

        .card:active {
          transform: translateY(-1px);
        }

        /* TRANSFORMA rail -> GRID em telas maiores */
        @media (min-width: 640px) {
          .rail {
            grid-auto-flow: initial;
            grid-auto-columns: initial;
            overflow: visible;
            padding: 0;
            scroll-snap-type: none;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
          }

          .card {
            min-height: 120px;
          }
        }

        @media (min-width: 860px) {
          .rail {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 20px;
          }
        }

        @media (min-width: 1100px) {
          .sec {
            padding: 64px 0 86px;
          }

          .rail {
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 20px;
          }

          /* cards viram verticais no desktop grande */
          .card {
            grid-template-columns: 1fr;
            align-items: flex-start;
            min-height: 200px;
            padding: 20px;
          }

          .iconWrap {
            width: 72px;
            height: 72px;
            border-radius: 26px;
          }

          .icon {
            font-size: 30px;
          }

          .name {
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            margin-bottom: 12px;
          }
        }

        /* Acessibilidade */
        .card:focus-visible,
        .allBtn:focus-visible {
          outline: 3px solid rgba(183, 110, 121, 0.25);
          outline-offset: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .card,
          .pill,
          .arrow,
          .allBtn {
            transition: none !important;
          }
        }

        @media (max-width: 420px) {
          .hint {
            display: none;
          }
        }
      `}</style>
    </>
  );
}