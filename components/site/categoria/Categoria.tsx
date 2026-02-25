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
              <p>Toque em uma categoria para abrir a página da categoria.</p>
            </div>

            <Link className="allBtn" href="/catalogo">
              Ver catálogo completo <span aria-hidden>→</span>
            </Link>
          </header>

          <div className="rail" role="list">
            {top.map((c: any) => {
              const slug = String(c.slug ?? "").trim();
              if (!slug) return null;

              return (
                <Link
                  key={c.id_categoria ?? slug}
                  href={`/catalogo/categoria/${encodeURIComponent(slug)}`}
                  className="bubble"
                  role="listitem"
                  aria-label={`Abrir categoria ${c.nome}`}
                >
                  <span className="orb" aria-hidden="true">
                    <span className="orbBorder" />
                    <span className="orbGlow" />
                    <span className="iconWrap">
                      <i className={`bi ${c.icone || "bi-grid"} icon`} />
                    </span>
                  </span>

                  <span className="name">{c.nome}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <style jsx>{`
        .sec {
          padding: 60px 0 80px;
          background:
            radial-gradient(900px 360px at 12% -10%, rgba(183,110,121,.14), transparent 60%),
            radial-gradient(900px 360px at 88% -10%, rgba(212,175,55,.12), transparent 60%),
            linear-gradient(180deg, rgba(255,246,238,.55), rgba(255,255,255,1));
        }

        .wrap {
          width: min(1240px, 100%);
          margin: 0 auto;
          padding: 0 clamp(14px, 4vw, 28px);
        }

        .head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 18px;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(31, 41, 55, 0.1);
          box-shadow: 0 14px 34px rgba(31, 41, 55, 0.08);
          font-size: 12px;
          color: rgba(31, 41, 55, 0.72);
          font-weight: 900;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          width: fit-content;
          margin-bottom: 12px;
        }

        .kDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #d4af37, #b76e79);
          box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.1);
        }

        h2 {
          margin: 0;
          font-size: clamp(24px, 2.3vw, 34px);
          letter-spacing: -0.05em;
          color: #1f2937;
          font-weight: 950;
          line-height: 1.05;
        }

        .titleBlock p {
          margin: 10px 0 0;
          color: rgba(31, 41, 55, 0.68);
          font-size: 14px;
          line-height: 1.6;
        }

        .allBtn {
          text-decoration: none;
          padding: 11px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(31, 41, 55, 0.12);
          font-weight: 900;
          font-size: 12px;
          color: rgba(31, 41, 55, 0.82);
          box-shadow: 0 18px 44px rgba(31, 41, 55, 0.08);
          transition: transform 0.18s ease, background 0.18s ease;
          white-space: nowrap;
        }
        .allBtn:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.95);
        }

        .rail {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 22px;
        }

        .bubble {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: #1f2937;
          gap: 12px;
          user-select: none;
        }

        .orb {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          position: relative;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 18px 60px rgba(31, 41, 55, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          overflow: hidden;
        }

        .orbBorder {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4af37, #b76e79);
          opacity: 0.35;
          pointer-events: none;
        }

        .orbGlow {
          position: absolute;
          inset: -60px;
          background:
            radial-gradient(circle at 30% 30%, rgba(212,175,55,0.18), transparent 55%),
            radial-gradient(circle at 65% 70%, rgba(183,110,121,0.16), transparent 55%);
          pointer-events: none;
        }

        .iconWrap {
          position: relative;
          z-index: 1;
          width: 62px;
          height: 62px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(183, 110, 121, 0.18);
          background: linear-gradient(
            135deg,
            rgba(183, 110, 121, 0.12),
            rgba(212, 175, 55, 0.1),
            rgba(255, 255, 255, 0.3)
          );
          box-shadow: 0 18px 46px rgba(183, 110, 121, 0.12);
        }

        .icon {
          font-size: 26px;
          color: rgba(31, 41, 55, 0.9);
        }

        .name {
          font-size: 13px;
          font-weight: 950;
          text-align: center;
          line-height: 1.2;
          max-width: 160px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media (hover: hover) and (pointer: fine) {
          .bubble:hover .orb {
            transform: translateY(-5px);
            box-shadow: 0 30px 90px rgba(31, 41, 55, 0.16);
            filter: saturate(1.03);
          }
        }

        .bubble:focus-visible {
          outline: 3px solid rgba(183, 110, 121, 0.25);
          outline-offset: 6px;
          border-radius: 16px;
        }

        @media (max-width: 520px) {
          .rail {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
          .orb {
            width: 100px;
            height: 100px;
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