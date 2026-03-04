"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria();

  const railRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  if (loading || erro || categorias.length === 0) return null;

  const top = categorias.slice(0, 12);
  const showArrows = top.length > 10;

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;
    const left = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(left > 4);
    setCanRight(left < max - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = railRef.current;
    if (!el) return;

    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [top.length]);

  const scrollByCards = (dir: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    const amount = Math.max(260, Math.floor(el.clientWidth * 0.72));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

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

            <div className="rightSide">
              <Link className="allBtn" href="/catalogo" aria-label="Ver catálogo completo">
                Ver todas <span aria-hidden>→</span>
              </Link>
            </div>
          </header>

          <div className="railWrap">
            {/* Fades laterais (dá cara premium) */}
            <div className={`fade left ${canLeft ? "on" : ""}`} aria-hidden />
            <div className={`fade right ${canRight ? "on" : ""}`} aria-hidden />

            {/* Setas (só se > 10) */}
            {showArrows && (
              <>
                <button
                  type="button"
                  className={`arrow left ${canLeft ? "on" : ""}`}
                  onClick={() => scrollByCards("left")}
                  aria-label="Categorias anteriores"
                >
                  <span aria-hidden>‹</span>
                </button>

                <button
                  type="button"
                  className={`arrow right ${canRight ? "on" : ""}`}
                  onClick={() => scrollByCards("right")}
                  aria-label="Próximas categorias"
                >
                  <span aria-hidden>›</span>
                </button>
              </>
            )}

            {/* Lista */}
            <div ref={railRef} className="rail" role="list" aria-label="Lista de categorias">
              {top.map((c: any) => {
                const slug = (c?.slug || "").toString().trim();
                const href = slug ? `/catalogo/categoria/${encodeURIComponent(slug)}` : "/catalogo";

                return (
                  <Link
                    key={slug || c.id_categoria}
                    role="listitem"
                    className={`card ${slug ? "" : "disabled"}`}
                    href={href}
                    aria-label={
                      slug
                        ? `Abrir categoria ${c.nome}`
                        : `Categoria ${c.nome} sem slug (abrindo catálogo)`
                    }
                  >
                    <span className="orb" aria-hidden>
                      <span className="orbGlow" />
                      <span className="orbRing" />
                      <span className="orbInner">
                        <i className={`bi ${c.icone || "bi-grid"} icon`} />
                      </span>
                    </span>

                    <span className="name" title={c.nome}>
                      {c.nome}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        :global(:root) {
          --cream: #fff6ee;
          --ink: #1f2937;
          --muted: rgba(31, 41, 55, 0.68);

          --rose: #b76e79;
          --rose2: #d9a5ad;
          --gold: #d4af37;

          --shadow: 0 18px 56px rgba(31, 41, 55, 0.10);
          --shadow2: 0 30px 90px rgba(31, 41, 55, 0.16);
        }

        .sec {
          padding: 56px 0 72px;
          background:
            radial-gradient(1100px 440px at 10% -18%, rgba(183, 110, 121, 0.12), transparent 62%),
            radial-gradient(950px 440px at 90% -18%, rgba(212, 175, 55, 0.11), transparent 64%),
            linear-gradient(180deg, rgba(255, 246, 238, 0.0), rgba(255, 246, 238, 0.46));
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
          margin-bottom: 18px;
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
          background: rgba(255, 255, 255, 0.82);
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
          background: rgba(255, 255, 255, 0.88);
          border-radius: 999px;
          padding: 12px 14px;
          font-size: 12px;
          font-weight: 950;
          color: rgba(31, 41, 55, 0.82);
          box-shadow: 0 18px 44px rgba(31, 41, 55, 0.08);
          transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
        }
        .allBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 26px 70px rgba(31, 41, 55, 0.14);
        }

        /* ====== WRAPPER do rail + setas + fades ====== */
        .railWrap {
          position: relative;
          border-radius: 22px;
          padding: 8px 0;
        }

        .fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 64px;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          z-index: 2;
        }
        .fade.on { opacity: 1; }
        .fade.left {
          left: 0;
          background: linear-gradient(90deg, rgba(255, 246, 238, 1), rgba(255, 246, 238, 0));
        }
        .fade.right {
          right: 0;
          background: linear-gradient(270deg, rgba(255, 246, 238, 1), rgba(255, 246, 238, 0));
        }

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(31, 41, 55, 0.12);
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 16px 44px rgba(31, 41, 55, 0.12);
          display: grid;
          place-items: center;
          cursor: pointer;
          z-index: 3;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.18s ease, background 0.18s ease;
        }
        .arrow.on {
          opacity: 1;
          pointer-events: auto;
        }
        .arrow:hover {
          transform: translateY(-50%) translateY(-1px);
          background: rgba(255, 255, 255, 0.92);
        }
        .arrow.left { left: 6px; }
        .arrow.right { right: 6px; }
        .arrow span {
          font-size: 22px;
          font-weight: 900;
          color: rgba(31, 41, 55, 0.82);
          line-height: 1;
        }

        /* ====== LISTA ====== */
        .rail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          gap: 14px;
          overflow-x: auto;
          padding: 10px 54px 14px; /* espaço pras setas/fade */
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .rail::-webkit-scrollbar { display: none; }

        /* ====== ITEM ====== */
        .card {
          scroll-snap-align: start;
          width: 136px;
          display: grid;
          justify-items: center;
          gap: 10px;
          padding: 14px 10px 10px;
          border-radius: 22px;
          text-decoration: none;
          color: inherit;
          user-select: none;
          -webkit-tap-highlight-color: transparent;

          background: rgba(255, 255, 255, 0.60);
          border: 1px solid rgba(31, 41, 55, 0.10);
          box-shadow: 0 16px 48px rgba(31, 41, 55, 0.08);
          backdrop-filter: blur(10px);
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .card.disabled { opacity: 0.72; }

        .orb {
          width: 94px;
          height: 94px;
          border-radius: 999px;
          position: relative;
          display: grid;
          place-items: center;
          overflow: hidden;
          transform: translateZ(0);
        }

        .orbGlow {
          position: absolute;
          inset: -35px;
          background:
            radial-gradient(circle at 26% 30%, rgba(212, 175, 55, 0.22), transparent 56%),
            radial-gradient(circle at 72% 76%, rgba(183, 110, 121, 0.18), transparent 60%);
          filter: blur(0px);
          opacity: 1;
        }

        .orbRing {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: conic-gradient(
            from 210deg,
            rgba(212, 175, 55, 0.90),
            rgba(183, 110, 121, 0.82),
            rgba(255, 255, 255, 0.25),
            rgba(183, 110, 121, 0.86),
            rgba(212, 175, 55, 0.92)
          );
          opacity: 0.42;
        }

        .orbInner {
          position: relative;
          z-index: 1;
          width: 78px;
          height: 78px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.90);
          border: 1px solid rgba(31, 41, 55, 0.10);
          box-shadow: var(--shadow);
        }

        .icon {
          font-size: 30px;
          color: rgba(31, 41, 55, 0.86);
          transition: transform 0.18s ease, color 0.18s ease;
        }

        .name {
          width: 100%;
          text-align: center;
          font-size: 13px;
          font-weight: 950;
          color: rgba(31, 41, 55, 0.92);
          letter-spacing: -0.01em;
          line-height: 1.15;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (hover: hover) and (pointer: fine) {
          .card:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow2);
            background: rgba(255, 255, 255, 0.74);
          }
          .card:hover .icon {
            transform: scale(1.05);
            color: rgba(159, 61, 95, 0.92);
          }
        }

        .card:active { transform: translateY(-1px) scale(0.995); }

        .card:focus-visible {
          outline: 3px solid rgba(183, 110, 121, 0.24);
          outline-offset: 6px;
        }

        /* Desktop: vira grid bonito */
        @media (min-width: 860px) {
          .railWrap { padding: 0; }
          .fade, .arrow { display: none; }

          .rail {
            grid-auto-flow: initial;
            grid-auto-columns: initial;
            overflow: visible;
            padding: 0;
            scroll-snap-type: none;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 18px;
          }
          .card { width: auto; }
        }

        @media (prefers-reduced-motion: reduce) {
          .card, .allBtn, .arrow, .icon { transition: none !important; }
        }
      `}</style>
    </>
  );
}