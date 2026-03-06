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
       
      `}</style>
    </>
  );
}