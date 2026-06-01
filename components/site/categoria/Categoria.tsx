"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as FiIcons from "react-icons/fi";
import * as BiIcons from "react-icons/bi";
import { FiGrid, FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";

import styles from "./CategoriasDestaque.module.css";

type Categoria = {
  id_categoria?: number | string;
  nome?: string;
  slug?: string;
  icone?: string | null;
};

function normalizeIconName(name?: string | null) {
  if (!name) return "";

  const value = String(name).trim();
  if (!value) return "";

  if (value.includes("-")) {
    const parts = value.split("-").filter(Boolean);
    if (parts.length >= 2) {
      const prefix = parts[0].toLowerCase();
      const rest = parts
        .slice(1)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");

      return `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}${rest}`;
    }
  }

  return value;
}

function getCategoryIcon(name?: string | null, size = 20) {
  const raw = normalizeIconName(name);

  const candidates = [
    raw,
    raw.replace(/^fi/i, "Fi"),
    raw.replace(/^bi/i, "Bi"),
  ].filter(Boolean);

  let Icon: any = null;

  for (const key of candidates) {
    Icon = (FiIcons as any)[key] || (BiIcons as any)[key];
    if (Icon) break;
  }

  if (!Icon) Icon = FiGrid;

  return <Icon size={size} aria-hidden="true" focusable="false" />;
}

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria();

  const railRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const top = useMemo(() => {
    const lista = Array.isArray(categorias) ? categorias : [];
    return lista.slice(0, 20) as Categoria[];
  }, [categorias]);

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    updateArrows();

    const wheelScroll = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    const handleScroll = () => updateArrows();

    el.addEventListener("wheel", wheelScroll, { passive: false });
    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("wheel", wheelScroll);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [top.length]);

  const scrollByAmount = (amount: number) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el) return;

    setIsDragging(true);
    startX.current = e.clientX - el.getBoundingClientRect().left;
    scrollLeft.current = el.scrollLeft;
    el.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el || !isDragging) return;

    e.preventDefault();

    const x = e.clientX - el.getBoundingClientRect().left;
    const walk = (x - startX.current) * 1.4;
    el.scrollLeft = scrollLeft.current - walk;
  };

  const stopDragging = () => setIsDragging(false);

  if (loading || erro || !top.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.backgroundOrb1} />
      <div className={styles.backgroundOrb2} />

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.badge}>✨ Categorias em destaque</span>

            <div className={styles.controls}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => scrollByAmount(-360)}
                disabled={!canScrollLeft}
                aria-label="Mover categorias para a esquerda"
              >
                <FiChevronLeft size={18} />
              </button>

              <button
                type="button"
                className={styles.navBtn}
                onClick={() => scrollByAmount(360)}
                disabled={!canScrollRight}
                aria-label="Mover categorias para a direita"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>

          <h2>Explore nossas categorias</h2>

          <p>
            Arraste, deslize ou use os botões para navegar pelas categorias e encontrar exatamente o que você procura.
          </p>
        </div>

        <div
          ref={railRef}
          className={`${styles.rail} ${isDragging ? styles.dragging : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerLeave={stopDragging}
          onPointerCancel={stopDragging}
        >
          {top.map((categoria, index) => {
            const nome = categoria?.nome || "Categoria";
            const slug = String(categoria?.slug || "").trim();

            return (
              <Link
                key={categoria?.id_categoria || index}
                href={slug ? `/categorias/${slug}` : "#"}
                className={styles.card}
                draggable={false}
              >
                <div className={styles.cardGlow} />

                <div className={styles.circle}>
                  <div className={styles.innerCircle}>
                    {getCategoryIcon(categoria?.icone, 22)}
                  </div>
                </div>

                <span className={styles.name}>{nome}</span>
                <span className={styles.cta}>
                  Ver categoria <FiArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}