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

  return value
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function getCategoryIcon(name?: string | null, size = 20) {
  const raw = normalizeIconName(name);

  const candidates = [
    raw,
    raw.replace(/^fi/i, "Fi"),
    raw.replace(/^bi/i, "Bi"),
    `Fi${raw}`,
    `Bi${raw}`,
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const top = useMemo(() => {
    const lista = Array.isArray(categorias) ? categorias : [];
    return lista.slice(0, 20) as Categoria[];
  }, [categorias]);

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;

    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setCanScrollLeft(hasOverflow && el.scrollLeft > 8);
    setCanScrollRight(hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    updateArrows();

    const handleScroll = () => updateArrows();
    const handleResize = () => updateArrows();

    el.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateArrows) : null;
    ro?.observe(el);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      ro?.disconnect();
    };
  }, [top.length]);

  const scrollByAmount = (direction: "prev" | "next") => {
    const el = railRef.current;
    if (!el) return;

    const firstCard = el.querySelector(`.${styles.card}`) as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? 200;
    const gap = 16;
    const amount = cardWidth + gap;

    el.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  if (loading || erro || !top.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.badge}>Categorias em destaque</span>

            <div className={styles.controls}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => scrollByAmount("prev")}
                disabled={!canScrollLeft}
                aria-label="Mover categorias para a esquerda"
              >
                <FiChevronLeft size={18} />
              </button>

              <button
                type="button"
                className={styles.navBtn}
                onClick={() => scrollByAmount("next")}
                disabled={!canScrollRight}
                aria-label="Mover categorias para a direita"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>

          <h2>Explore nossas categorias</h2>

          <p>
            Navegue com conforto pelas categorias mais importantes e encontre o que procura de
            forma rápida e visual.
          </p>
        </div>

        <div ref={railRef} className={styles.rail}>
          {top.map((categoria, index) => {
            const nome = categoria?.nome || "Categoria";
            const slug = String(categoria?.slug || "").trim();
            const href = slug ? `/categorias/${slug}` : "/categorias";

            return (
              <Link
                key={categoria?.id_categoria || `${nome}-${index}`}
                href={href}
                className={styles.card}
              >
                <div className={styles.cardAccent} />

                <div className={styles.iconBox}>{getCategoryIcon(categoria?.icone, 24)}</div>

                <div className={styles.content}>
                  <span className={styles.name}>{nome}</span>
                  <span className={styles.subtitle}>Ver produtos da categoria</span>
                </div>

                <span className={styles.cta}>
                  Explorar <FiArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}