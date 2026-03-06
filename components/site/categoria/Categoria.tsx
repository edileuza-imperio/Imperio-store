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
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < max - 8);
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

    const amount = Math.max(280, Math.floor(el.clientWidth * 0.72));
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
      <section className="sec" aria-label="Categorias em destaque">
        <div className="wrap">
          <div className="surface">
            <header className="head">
              <div className="titleBlock">
                <div className="kicker">
                  <span className="kDot" />
                  <span>CATEGORIAS</span>
                </div>

                <h2 className="h2">Categorias em destaque</h2>
                <p className="sub">
                  Escolha uma categoria para ver os produtos disponíveis.
                </p>
              </div>

              <div className="rightSide">
                <Link href="/catalogo" className="allBtn">
                  <span>Ver todas</span>
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </header>

            <div className="railWrap">
              <div className={`fade left ${canLeft ? "on" : ""}`} />
              <div className={`fade right ${canRight ? "on" : ""}`} />

              {showArrows && (
                <>
                  <button
                    type="button"
                    className={`arrow left ${canLeft ? "on" : ""}`}
                    onClick={() => scrollByCards("left")}
                    aria-label="Ver categorias anteriores"
                  >
                    <span>‹</span>
                  </button>

                  <button
                    type="button"
                    className={`arrow right ${canRight ? "on" : ""}`}
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
                      className={`item ${slug ? "" : "disabled"}`}
                      draggable={false}
                      role="listitem"
                    >
                      <span className="orb">
                        <span className="orbRing" />
                        <span className="orbInner">
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
          --page: #f5f1ed;
          --surface: #f7f4f1;
          --surface-2: #f8f5f2;
          --card: #fcfcfc;

          --ink: #111827;
          --muted: #6b7280;

          --line: #e7e0da;
          --line-2: #e5dfd9;

          --gold: #d5b06e;
          --rose: #d7b3be;

          --shadow-soft: 0 8px 22px rgba(17, 24, 39, 0.04);
          --shadow-hover: 0 14px 28px rgba(17, 24, 39, 0.07);
        }

        .sec {
          padding: 34px 0 56px;
          background: transparent;
        }

        .wrap {
          width: min(1280px, 100%);
          margin: 0 auto;
          padding: 0 18px;
        }

        .surface {
          position: relative;
          border-radius: 34px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%);
          padding: 28px 20px 24px;
          overflow: hidden;
        }

        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 0 4px 20px;
          flex-wrap: wrap;
        }

        .titleBlock {
          min-width: 0;
          max-width: 760px;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: #f1ece7;
          border: 1px solid #ddd6cf;
          color: #667085;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .kDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold), #c89072);
          flex-shrink: 0;
        }

        .h2 {
          margin: 0;
          font-size: clamp(30px, 3vw, 44px);
          line-height: 1.04;
          letter-spacing: -0.05em;
          font-weight: 900;
          color: #0f172a;
        }

        .sub {
          margin: 12px 0 0;
          font-size: 16px;
          line-height: 1.55;
          color: var(--muted);
        }

        .rightSide {
          margin-left: auto;
          display: flex;
          align-items: center;
        }

        .allBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 18px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #ddd7d1;
          color: #374151;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(17, 24, 39, 0.03);
          transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .allBtn:hover {
          transform: translateY(-1px);
          background: #fff;
          box-shadow: 0 8px 18px rgba(17, 24, 39, 0.05);
        }

        .railWrap {
          position: relative;
          padding: 2px 0 8px;
        }

        .fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 74px;
          opacity: 0;
          pointer-events: none;
          z-index: 2;
          transition: opacity 0.2s ease;
        }

        .fade.on {
          opacity: 1;
        }

        .fade.left {
          left: 0;
          background: linear-gradient(90deg, rgba(247, 244, 241, 1), rgba(247, 244, 241, 0));
        }

        .fade.right {
          right: 0;
          background: linear-gradient(270deg, rgba(247, 244, 241, 1), rgba(247, 244, 241, 0));
        }

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 46px;
          height: 46px;
          border-radius: 16px;
          border: 1px solid #e1dad3;
          background: #f8f5f2;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 4;
          opacity: 0;
          pointer-events: none;
          box-shadow: var(--shadow-soft);
          transition: opacity 0.2s ease, transform 0.18s ease, background 0.18s ease;
        }

        .arrow.on {
          opacity: 1;
          pointer-events: auto;
        }

        .arrow:hover {
          background: #ffffff;
          transform: translateY(-50%) translateY(-1px);
        }

        .arrow.left {
          left: 10px;
        }

        .arrow.right {
          right: 10px;
        }

        .arrow span {
          font-size: 28px;
          line-height: 1;
          color: #4b5563;
          margin-top: -2px;
        }

        .rail {
          position: relative;
          z-index: 1;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          gap: 16px;
          overflow-x: auto;
          padding: 8px 56px 10px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          cursor: grab;
          user-select: none;
          overscroll-behavior-x: contain;
          align-items: stretch;
        }

        .rail::-webkit-scrollbar {
          display: none;
        }

        .rail.dragging {
          cursor: grabbing;
        }

        .item {
          scroll-snap-align: start;
          width: 172px;
          min-height: 192px;
          padding: 18px 14px 16px;
          border-radius: 24px;
          border: 1px solid var(--line-2);
          background: var(--card);
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          box-shadow: none;
          -webkit-tap-highlight-color: transparent;
        }

        .item:hover {
          transform: translateY(-3px);
          border-color: #ddd6d0;
          box-shadow: var(--shadow-hover);
        }

        .item.disabled {
          opacity: 0.72;
        }

        .orb {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .orbRing {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold) 0%, var(--rose) 100%);
        }

        .orbInner {
          position: relative;
          z-index: 1;
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
          line-height: 1;
          color: #444b57;
        }

        .name {
          width: 100%;
          text-align: center;
          color: #1f2937;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.28;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
          min-height: 38px;
          word-break: break-word;
          text-decoration: none;
        }

        @media (max-width: 1024px) {
          .surface {
            padding: 24px 16px 22px;
          }

          .rail {
            padding: 8px 54px 10px;
          }

          .item {
            width: 164px;
            min-height: 186px;
          }
        }

        @media (max-width: 768px) {
          .head {
            align-items: flex-start;
          }

          .rightSide {
            margin-left: 0;
          }

          .h2 {
            font-size: 31px;
          }

          .sub {
            font-size: 14px;
          }

          .item {
            width: 154px;
            min-height: 180px;
            border-radius: 22px;
          }

          .orb {
            width: 92px;
            height: 92px;
          }

          .orbInner {
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
          .sec {
            padding: 24px 0 40px;
          }

          .wrap {
            padding: 0 12px;
          }

          .surface {
            padding: 18px 10px 18px;
            border-radius: 24px;
          }

          .head {
            padding: 0 4px 16px;
          }

          .kicker {
            margin-bottom: 12px;
          }

          .h2 {
            font-size: 27px;
          }

          .allBtn {
            min-height: 42px;
            padding: 0 16px;
            font-size: 14px;
          }

          .rail {
            gap: 14px;
            padding: 8px 48px 8px;
          }

          .item {
            width: 146px;
            min-height: 172px;
            padding: 14px 10px;
          }

          .orb {
            width: 86px;
            height: 86px;
          }

          .orbInner {
            width: 70px;
            height: 70px;
          }

          .icon {
            font-size: 24px;
          }

          .arrow {
            width: 42px;
            height: 42px;
            border-radius: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .item,
          .allBtn,
          .arrow {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}