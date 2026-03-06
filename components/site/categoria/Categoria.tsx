"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Categoria = {
  id_categoria?: number | string;
  nome?: string;
  slug?: string;
  icone?: string;
};

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria();

  const railRef = useRef<HTMLDivElement | null>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const top = useMemo(() => {
    const lista = Array.isArray(categorias) ? categorias : [];
    return lista.slice(0, 12) as Categoria[];
  }, [categorias]);

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

    const amount = Math.max(280, Math.floor(el.clientWidth * 0.78));
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

  const stopDragging = () => {
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
  if (!top.length) return null;

  return (
    <>
      <section className="categoriasSection" aria-label="Categorias em destaque">
        <div className="container">
          <div className="surface">
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
                <Link href="/catalogo" className="allBtn">
                  Ver todas <span aria-hidden>→</span>
                </Link>
              </div>
            </header>

            <div className="carouselWrap">
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
                onMouseLeave={stopDragging}
                onMouseUp={stopDragging}
                onMouseMove={onMouseMove}
                role="list"
                aria-label="Lista de categorias"
              >
                {top.map((c, index) => {
                  const nome = String(c?.nome || "Categoria");
                  const slug = String(c?.slug || "").trim();
                  const href = slug
                    ? `/catalogo/categoria/${encodeURIComponent(slug)}`
                    : "/catalogo";

                  return (
                    <Link
                      key={String(c?.id_categoria || slug || index)}
                      href={href}
                      className={`card ${slug ? "" : "disabled"}`}
                      draggable={false}
                      role="listitem"
                    >
                      <span className="circle">
                        <span className="circleInner">
                          <i className={`bi ${c?.icone || "bi-grid"} icon`} />
                        </span>
                      </span>

                      <span className="name" title={nome}>
                        {nome}
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
          --bg-page: #f6f2ee;
          --bg-surface: #f8f5f2;
          --bg-card: #ffffff;

          --text-main: #111827;
          --text-soft: #6b7280;

          --border-surface: #e7e0da;
          --border-card: #e6e2dd;
          --border-btn: #ddd7d1;

          --gold: #d3b06c;
          --rose: #d8b2bc;

          --shadow-soft: 0 6px 18px rgba(17, 24, 39, 0.05);
          --shadow-hover: 0 10px 28px rgba(17, 24, 39, 0.08);
        }

        .categoriasSection {
          padding: 34px 0 56px;
          background: transparent;
        }

        .container {
          width: min(1280px, 100%);
          margin: 0 auto;
          padding: 0 18px;
        }

        .surface {
          position: relative;
          background: linear-gradient(180deg, #f8f5f2 0%, #f6f2ee 100%);
          border: 1px solid var(--border-surface);
          border-radius: 30px;
          padding: 26px 18px 26px;
          overflow: hidden;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
          padding: 0 8px;
          flex-wrap: wrap;
        }

        .headerLeft {
          min-width: 0;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 999px;
          background: #f1ece7;
          border: 1px solid #ddd6cf;
          color: #667085;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .tagDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold), #c88977);
          flex-shrink: 0;
        }

        .title {
          margin: 0;
          color: #0f172a;
          font-size: clamp(30px, 3.2vw, 40px);
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .subtitle {
          margin: 12px 0 0;
          color: var(--text-soft);
          font-size: 16px;
          line-height: 1.55;
        }

        .headerRight {
          margin-left: auto;
          display: flex;
          align-items: center;
        }

        .allBtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 18px;
          min-height: 48px;
          border-radius: 999px;
          text-decoration: none;
          color: #374151;
          background: #ffffff;
          border: 1px solid var(--border-btn);
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(17, 24, 39, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .allBtn:hover {
          transform: translateY(-1px);
          background: #fff;
          box-shadow: 0 6px 18px rgba(17, 24, 39, 0.05);
        }

        .carouselWrap {
          position: relative;
        }

        .rail {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          gap: 16px;
          overflow-x: auto;
          padding: 4px 58px 6px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          cursor: grab;
          user-select: none;
          align-items: stretch;
        }

        .rail::-webkit-scrollbar {
          display: none;
        }

        .rail.dragging {
          cursor: grabbing;
        }

        .card {
          width: 158px;
          min-height: 188px;
          padding: 16px 12px 18px;
          border-radius: 24px;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          text-decoration: none;
          color: inherit;
          scroll-snap-align: start;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;

          transition: transform 0.2s ease, box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-hover);
          border-color: #ddd6d0;
        }

        .card.disabled {
          opacity: 0.72;
        }

        .circle {
          width: 100px;
          height: 100px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #d3b06c 0%, #d9b4c0 100%);
          flex-shrink: 0;
        }

        .circleInner {
          width: 82px;
          height: 82px;
          border-radius: 999px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon {
          font-size: 30px;
          color: #3f4652;
          line-height: 1;
        }

        .name {
          width: 100%;
          max-width: 100%;
          text-align: center;
          color: #1f2937;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.3;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
          min-height: 39px;
        }

        .navBtn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 16px;
          border: 1px solid #e1dbd5;
          background: #f6f2ee;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 4;
          opacity: 0;
          pointer-events: none;
          box-shadow: var(--shadow-soft);
          transition: opacity 0.2s ease, background 0.2s ease,
            transform 0.2s ease;
        }

        .navBtn.show {
          opacity: 1;
          pointer-events: auto;
        }

        .navBtn:hover {
          background: #ffffff;
        }

        .navBtn.left {
          left: 10px;
        }

        .navBtn.right {
          right: 10px;
        }

        .navBtn span {
          font-size: 28px;
          color: #4b5563;
          line-height: 1;
          margin-top: -1px;
        }

        @media (max-width: 1024px) {
          .surface {
            padding: 24px 14px 24px;
          }

          .rail {
            padding: 4px 54px 6px;
          }

          .card {
            width: 152px;
            min-height: 182px;
          }
        }

        @media (max-width: 768px) {
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
            font-size: 14px;
          }

          .card {
            width: 146px;
            min-height: 176px;
            border-radius: 22px;
          }

          .circle {
            width: 92px;
            height: 92px;
          }

          .circleInner {
            width: 74px;
            height: 74px;
          }

          .icon {
            font-size: 27px;
          }

          .name {
            font-size: 14px;
            min-height: 36px;
          }
        }

        @media (max-width: 520px) {
          .categoriasSection {
            padding: 26px 0 42px;
          }

          .container {
            padding: 0 12px;
          }

          .surface {
            border-radius: 24px;
            padding: 18px 10px 18px;
          }

          .header {
            padding: 0 6px;
            margin-bottom: 18px;
          }

          .tag {
            margin-bottom: 12px;
          }

          .title {
            font-size: 27px;
          }

          .subtitle {
            margin-top: 10px;
          }

          .allBtn {
            min-height: 44px;
            padding: 11px 16px;
            font-size: 14px;
          }

          .rail {
            gap: 14px;
            padding: 4px 48px 6px;
          }

          .card {
            width: 140px;
            min-height: 170px;
            padding: 14px 10px 16px;
          }

          .circle {
            width: 86px;
            height: 86px;
          }

          .circleInner {
            width: 70px;
            height: 70px;
          }

          .icon {
            font-size: 24px;
          }

          .navBtn {
            width: 44px;
            height: 44px;
            border-radius: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .card,
          .allBtn,
          .navBtn {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}