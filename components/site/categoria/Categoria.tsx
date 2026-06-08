"use client";


import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IconType } from "react-icons";

import {
  FiGrid,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiShoppingBag,
  FiGift,
  FiTag,
  FiStar,
  FiHeart,
  FiMonitor,
  FiSmartphone,
  FiWatch,
  FiCamera,
  FiBook,
  FiCoffee,
  FiShoppingCart,
} from "react-icons/fi";

import {
  BiCategory,
  BiStore,
  BiCloset,
  BiShoppingBag,
  BiHome,
  BiGift,
} from "react-icons/bi";

import styles from "./Categorias.module.css";
import useCategoria, { Categoria } from "./useCategoria";

const ICONS: Record<string, IconType> = {
  FiGrid,
  FiHome,
  FiShoppingBag,
  FiGift,
  FiTag,
  FiStar,
  FiHeart,
  FiMonitor,
  FiSmartphone,
  FiWatch,
  FiCamera,
  FiBook,
  FiCoffee,
  FiShoppingCart,
  BiCategory,
  BiStore,
  BiCloset,
  BiShoppingBag,
  BiHome,
  BiGift,
};

function normalizeIconName(name?: string | null) {
  if (!name) return "";

  return String(name)
    .trim()
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

  for (const key of candidates) {
    const Icon = ICONS[key];

    if (Icon) {
      return <Icon size={size} aria-hidden="true" focusable="false" />;
    }
  }

  return <FiGrid size={size} aria-hidden="true" focusable="false" />;
}

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria();

  const railRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const top = useMemo<Categoria[]>(() => {
    return Array.isArray(categorias) ? categorias.slice(0, 20) : [];
  }, [categorias]);

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;

    const hasOverflow = el.scrollWidth > el.clientWidth + 2;

    setCanScrollLeft(hasOverflow && el.scrollLeft > 8);
    setCanScrollRight(
      hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 8
    );
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    updateArrows();

    const handleScroll = () => updateArrows();
    const handleResize = () => updateArrows();

    el.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateArrows)
        : null;

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

    const firstCard = el.querySelector(
      `.${styles.card}`
    ) as HTMLElement | null;

    const cardWidth = firstCard?.offsetWidth ?? 200;
    const amount = cardWidth + 16;

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
            Navegue com conforto pelas categorias mais importantes e encontre o
            que procura de forma rápida e visual.
          </p>
        </div>

        <div ref={railRef} className={styles.rail}>
          {top.map((categoria, index) => {
            const nome = categoria?.nome || categoria?.titulo || "Categoria";
            const slug = String(categoria?.slug || "").trim();
            const href = slug ? `/categorias/${slug}` : "/categorias";

            return (
              <Link
                key={categoria?.id_categoria || categoria?.id || `${nome}-${index}`}
                href={href}
                className={styles.card}
              >
                <div className={styles.cardAccent} />

                <div className={styles.iconBox}>
                  {getCategoryIcon(categoria?.icone, 24)}
                </div>

                <div className={styles.content}>
                  <span className={styles.name}>{nome}</span>
                  <span className={styles.subtitle}>
                    Ver produtos da categoria
                  </span>
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