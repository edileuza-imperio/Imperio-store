"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria();

  const railRef = useRef<HTMLDivElement | null>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const top = useMemo(() => categorias.slice(0, 12), [categorias]);
  const showArrows = top.length > 6;

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;

    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft < max - 6);
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
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const el = railRef.current;
    if (!el) return;

    isDownRef.current = true;
    startXRef.current = e.pageX;
    startScrollLeftRef.current = el.scrollLeft;
    el.classList.add("dragging");
  };

  const onMouseLeave = () => {
    const el = railRef.current;
    if (!el) return;
    isDownRef.current = false;
    el.classList.remove("dragging");
  };

  const onMouseUp = () => {
    const el = railRef.current;
    if (!el) return;
    isDownRef.current = false;
    el.classList.remove("dragging");
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const el = railRef.current;
    if (!el || !isDownRef.current) return;

    e.preventDefault();
    const dx = e.pageX - startXRef.current;
    el.scrollLeft = startScrollLeftRef.current - dx;
  };

  if (loading) return null;
  if (erro) return null;
  if (!categorias || categorias.length === 0) return null;

  return (
    <>
      <section className="categoriasSection" aria-label="Categorias em destaque">
        <div className="container">
          <div className="box">
            <header className="header">
              <div className="headerLeft">
                <div className="tag">
                  <span className="tagDot" />
                  <span>CATEGORIAS</span>
                </div>

                <h2 className="title">Categorias em destaque</h2>
                <p className="subtitle">
                  Escolha uma categoria para ver os produtos disponíveis.
                </p>
              </div>

              <div className="headerRight">
                <Link href="/catalogo" className="verTodasBtn">
                  <span>Ver todas</span>
                  <span className="arrowText" aria-hidden>
                    →
                  </span>
                </Link>
              </div>
            </header>

            <div className="carouselArea">
              {showArrows && (
                <>
                  <button
                    type="button"
                    className={`navBtn left ${canLeft ? "show" : ""}`}
                    onClick={() => scrollByCards("left")}
                    aria-label="Ver categorias anteriores"
                  >
                    <span>‹</span>
                  </button>

                  <button
                    type="button"
                    className={`navBtn right ${canRight ? "show" : ""}`}
                    onClick={() => scrollByCards("right")}
                    aria-label="Ver próximas categorias"
                  >
                    <span>›</span>
                  </button>
                </>
              )}

              <div
                ref={railRef}
                className="rail"
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                role="list"
                aria-label="Lista de categorias"
              >
                {top.map((c: any) => {
                  const slug = String(c?.slug || "").trim();
                  const href = slug
                    ? `/catalogo/categoria/${encodeURIComponent(slug)}`
                    : "/catalogo";

                  return (
                    <Link
                      key={slug || c.id_categoria}
                      href={href}
                      className={`card ${slug ? "" : "disabled"}`}
                      draggable={false}
                      role="listitem"
                    >
                      <div className="iconCircle">
                        <div className="iconCircleInner">
                          <i className={`bi ${c.icone || "bi-grid"} icon`} />
                        </div>
                      </div>

                      <span className="cardName">{c.nome}</span>
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
          --bg-soft: #f7f3ef;
          --bg-card: #ffffff;
          --text-main: #111827;
          --text-soft: #6b7280;
          --border-soft: #e8e2dc;
          --border-card: #ebe7e3;
          --gold: #d3b06c;
          --rose: #d9b2bd;
          --shadow-soft: 0 8px 24px rgba(17, 24, 39, 0.04);
        }

        .categoriasSection {
          padding: 34px 0 54px;
          background: transparent;
        }

        .container {
          width: min(1280px, 100%);
          margin: 0 auto;
          padding: 0 20px;
        }

        .box {
          background: linear-gradient(180deg, #f8f5f2 0%, #f5f2ef 100%);
          border: 1px solid var(--border-soft);
          border-radius: 34px;
          padding: 28px 28px 24px;
          position: relative;
          overflow: hidden;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 26px;
          flex-wrap: wrap;
        }

        .headerLeft {
          min-width: 0;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid #ddd6cf;
          background: #f2eeea;
          font-size: 12px;
          font-weight: 800;
          color: #6b7280;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }

        .tagDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold), #c48c70);
          flex-shrink: 0;
        }

        .title {
          margin: 0;
          font-size: clamp(30px, 3vw, 38px);
          line-height: 1.08;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.04em;
        }

        .subtitle {
          margin: 12px 0 0;
          font-size: 16px;
          line-height: 1.5;
          color: var(--text-soft);
        }

        .headerRight {
          margin-left: auto;
          display: flex;
          align-items: center;
        }

        .verTodasBtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 48px;
          padding: 0 18px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid #dfd9d3;
          color: #374151;
          text-decoration: none;
          font-size: 15px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(17, 24, 39, 0.03);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .verTodasBtn:hover {
          transform: translateY(-1px);
          background: #ffffff;
        }

        .arrowText {
          font-size: 18px;
          line-height: 1;
        }

        .carouselArea {
          position: relative;
        }

        .rail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          gap: 16px;
          overflow-x: auto;
          padding: 2px 56px 10px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          user-select: none;
          cursor: grab;
        }

        .rail::-webkit-scrollbar {
          display: none;
        }

        .rail.dragging {
          cursor: grabbing;
        }

        .card {
          width: 172px;
          min-height: 194px;
          border-radius: 26px;
          background: #fcfcfc;
          border: 1px solid var(--border-card);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          text-decoration: none;
          color: inherit;
          scroll-snap-align: start;
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            border-color 0.2s ease;
          box-shadow: none;
          flex-shrink: 0;
        }

        .card:hover {
          transform: translateY(-3px);
          border-color: #ddd5cf;
          box-shadow: var(--shadow-soft);
        }

        .card.disabled {
          opacity: 0.72;
          pointer-events: none;
        }

        .iconCircle {
          width: 102px;
          height: 102px;
          border-radius: 999px;
          background: linear-gradient(135deg, #d7b56f 0%, #d8b9c7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .iconCircleInner {
          width: 84px;
          height: 84px;
          border-radius: 999px;
          background: #fcfcfc;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon {
          font-size: 31px;
          color: #3f4652;
          line-height: 1;
        }

        .cardName {
          width: 100%;
          padding: 0 12px;
          text-align: center;
          font-size: 16px;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .navBtn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 18px;
          border: 1px solid #e2ddd8;
          background: #f8f5f2;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          cursor: pointer;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease;
          box-shadow: 0 4px 14px rgba(17, 24, 39, 0.04);
        }

        .navBtn.show {
          opacity: 1;
          pointer-events: auto;
        }

        .navBtn:hover {
          background: #ffffff;
        }

        .navBtn.left {
          left: 8px;
        }

        .navBtn.right {
          right: 8px;
        }

        .navBtn span {
          font-size: 30px;
          line-height: 1;
          color: #4b5563;
          margin-top: -2px;
        }

        @media (max-width: 900px) {
          .box {
            padding: 24px 18px 20px;
            border-radius: 28px;
          }

          .header {
            align-items: flex-start;
          }

          .headerRight {
            margin-left: 0;
          }

          .title {
            font-size: 30px;
          }

          .subtitle {
            font-size: 15px;
          }

          .rail {
            padding: 2px 50px 8px;
          }

          .card {
            width: 158px;
            min-height: 184px;
          }

          .iconCircle {
            width: 94px;
            height: 94px;
          }

          .iconCircleInner {
            width: 76px;
            height: 76px;
          }

          .icon {
            font-size: 28px;
          }
        }

        @media (max-width: 640px) {
          .categoriasSection {
            padding: 24px 0 40px;
          }

          .container {
            padding: 0 14px;
          }

          .box {
            padding: 18px 14px 18px;
            border-radius: 24px;
          }

          .tag {
            margin-bottom: 14px;
          }

          .title {
            font-size: 28px;
          }

          .subtitle {
            font-size: 14px;
          }

          .verTodasBtn {
            min-height: 44px;
            padding: 0 16px;
            font-size: 14px;
          }

          .rail {
            gap: 14px;
            padding: 2px 46px 6px;
          }

          .card {
            width: 150px;
            min-height: 176px;
            border-radius: 22px;
          }

          .iconCircle {
            width: 88px;
            height: 88px;
          }

          .iconCircleInner {
            width: 72px;
            height: 72px;
          }

          .icon {
            font-size: 26px;
          }

          .cardName {
            font-size: 15px;
          }

          .navBtn {
            width: 44px;
            height: 44px;
            border-radius: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .card,
          .navBtn,
          .verTodasBtn {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}