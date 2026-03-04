"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria();

  // ✅ hooks SEMPRE no topo
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // ✅ evita crash quando categorias ainda não veio
  const top = useMemo(() => {
    const list = Array.isArray(categorias) ? categorias : [];
    return list.slice(0, 12);
  }, [categorias]);

  const showArrows = top.length > 10;

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft < max - 6);
  };

  // ✅ este useEffect agora roda SEMPRE (ordem fixa)
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
    const amount = Math.max(320, Math.floor(el.clientWidth * 0.78));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // ✅ AGORA sim: returns condicionais DEPOIS dos hooks
  if (loading || erro || top.length === 0) return null;

  return (
    <>
      <section className="sec" aria-label="Categorias em destaque">
        <div className="wrap">
          <div className="surface">
            <header className="head">
              <div className="titleBlock">
                <div className="kicker">
                  <span className="kDot" />
                  CATEGORIAS
                </div>

                <h2 className="h2">Categorias em destaque</h2>
                <p className="sub">Escolha uma categoria para ver os produtos disponíveis.</p>
              </div>

              <div className="rightSide">
                <Link className="allBtn" href="/catalogo" aria-label="Ver catálogo completo">
                  Ver todas <span aria-hidden>→</span>
                </Link>
              </div>
            </header>

            <div className="railWrap">
              {/* fades */}
              <div className={`fade left ${canLeft ? "on" : ""}`} aria-hidden />
              <div className={`fade right ${canRight ? "on" : ""}`} aria-hidden />

              {/* setas */}
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

              <div ref={railRef} className="rail" role="list" aria-label="Lista de categorias">
                {top.map((c: any) => {
                  const slug = (c?.slug || "").toString().trim();

                  // ✅ URL correta no Next:
                  // se seu arquivo é: /catalogo/categoria/[slug]/page.tsx
                  // o link é: /catalogo/categoria/${slug}
                  const href = slug
                    ? `/catalogo/categoria/${encodeURIComponent(slug)}`
                    : "/catalogo";

                  return (
                    <Link
                      key={slug || c.id_categoria}
                      role="listitem"
                      className={`item ${slug ? "" : "disabled"}`}
                      href={href}
                      aria-label={slug ? `Abrir categoria ${c.nome}` : `Categoria ${c.nome} sem slug`}
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

                      <span className="hint" aria-hidden>
                        Ver produtos →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        :global(:root) {
          --cream: #fff6ee;
          --ink: #111827;
          --muted: rgba(17, 24, 39, 0.62);

          --rose: #b76e79;
          --gold: #d4af37;

          --shadow2: 0 32px 92px rgba(17, 24, 39, 0.18);
        }

        .sec {
          padding: 52px 0 78px;
          background: radial-gradient(1100px 480px at 10% -14%, rgba(183, 110, 121, 0.12), transparent 62%),
            radial-gradient(980px 460px at 90% -14%, rgba(212, 175, 55, 0.1), transparent 64%),
            linear-gradient(180deg, rgba(255, 246, 238, 0), rgba(255, 246, 238, 0.55));
        }

        .wrap {
          width: min(1240px, 100%);
          margin: 0 auto;
          padding: 0 clamp(14px, 4vw, 28px);
        }

        .surface {
          border-radius: 26px;
          border: 1px solid rgba(255, 255, 255, 0.55);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.52));
          box-shadow: 0 24px 80px rgba(17, 24, 39, 0.1);
          backdrop-filter: blur(14px);
          overflow: hidden;
          position: relative;
        }

        .surface::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(700px 240px at 14% 0%, rgba(183, 110, 121, 0.12), transparent 60%),
            radial-gradient(680px 240px at 86% 0%, rgba(212, 175, 55, 0.1), transparent 60%);
          pointer-events: none;
        }

        .head {
          position: relative;
          z-index: 1;
          padding: 22px 22px 10px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.04);
          border: 1px solid rgba(17, 24, 39, 0.08);
          font-size: 12px;
          color: rgba(17, 24, 39, 0.7);
          font-weight: 950;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          width: fit-content;
          margin-bottom: 10px;
        }

        .kDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold), var(--rose));
          box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.1);
        }

        .h2 {
          margin: 0;
          font-size: clamp(24px, 2.4vw, 34px);
          letter-spacing: -0.05em;
          color: var(--ink);
          font-weight: 950;
          line-height: 1.05;
        }

        .sub {
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .rightSide {
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .allBtn {
          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(255, 255, 255, 0.72);
          border-radius: 999px;
          padding: 12px 14px;
          font-size: 12px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.86);
          box-shadow: 0 18px 44px rgba(17, 24, 39, 0.08);
          transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
          text-decoration: none;
          white-space: nowrap;
        }
        .allBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 28px 70px rgba(17, 24, 39, 0.12);
        }

        .railWrap {
          position: relative;
          padding: 8px 0 18px;
        }

        .fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 70px;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          z-index: 2;
        }
        .fade.on {
          opacity: 1;
        }
        .fade.left {
          left: 0;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0));
        }
        .fade.right {
          right: 0;
          background: linear-gradient(270deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0));
        }

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: 1px solid rgba(17, 24, 39, 0.12);
          background: rgba(255, 255, 255, 0.62);
          backdrop-filter: blur(14px);
          box-shadow: 0 18px 56px rgba(17, 24, 39, 0.14);
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
          background: rgba(255, 255, 255, 0.82);
        }
        .arrow.left {
          left: 10px;
        }
        .arrow.right {
          right: 10px;
        }
        .arrow span {
          font-size: 24px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.78);
          line-height: 1;
        }

        .rail {
          position: relative;
          z-index: 1;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          gap: 14px;
          overflow-x: auto;
          padding: 10px 60px 6px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .rail::-webkit-scrollbar {
          display: none;
        }

        .item {
          scroll-snap-align: start;
          width: 160px;
          display: grid;
          justify-items: center;
          gap: 10px;
          padding: 16px 12px 14px;
          border-radius: 22px;
          text-decoration: none;
          color: inherit;
          user-select: none;
          -webkit-tap-highlight-color: transparent;

          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(255, 255, 255, 0.62);
          backdrop-filter: blur(14px);
          box-shadow: 0 16px 48px rgba(17, 24, 39, 0.08);

          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .item.disabled {
          opacity: 0.72;
        }

        .orb {
          width: 96px;
          height: 96px;
          border-radius: 999px;
          position: relative;
          display: grid;
          place-items: center;
          overflow: hidden;
          transform: translateZ(0);
        }

        .orbGlow {
          position: absolute;
          inset: -40px;
          background: radial-gradient(circle at 26% 30%, rgba(212, 175, 55, 0.22), transparent 56%),
            radial-gradient(circle at 72% 76%, rgba(183, 110, 121, 0.18), transparent 60%);
        }

        .orbRing {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: conic-gradient(
            from 210deg,
            rgba(212, 175, 55, 0.92),
            rgba(183, 110, 121, 0.84),
            rgba(255, 255, 255, 0.22),
            rgba(183, 110, 121, 0.88),
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
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(17, 24, 39, 0.1);
          box-shadow: 0 18px 54px rgba(17, 24, 39, 0.1);
        }

        .icon {
          font-size: 30px;
          color: rgba(17, 24, 39, 0.84);
          transition: transform 0.18s ease, color 0.18s ease;
        }

        .name {
          width: 100%;
          text-align: center;
          font-size: 13px;
          font-weight: 950;
          color: rgba(17, 24, 39, 0.92);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hint {
          font-size: 12px;
          font-weight: 850;
          color: rgba(17, 24, 39, 0.52);
          opacity: 0;
          transform: translateY(-2px);
          transition: 0.18s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .item:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow2);
            background: rgba(255, 255, 255, 0.78);
          }
          .item:hover .icon {
            transform: scale(1.06);
            color: rgba(159, 61, 95, 0.92);
          }
          .item:hover .hint {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (min-width: 920px) {
          .railWrap {
            padding: 6px 22px 22px;
          }
          .fade,
          .arrow {
            display: none;
          }

          .rail {
            grid-auto-flow: initial;
            grid-auto-columns: initial;
            overflow: visible;
            padding: 0;
            scroll-snap-type: none;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 18px;
          }

          .item {
            width: auto;
          }
        }
      `}</style>
    </>
  );
}