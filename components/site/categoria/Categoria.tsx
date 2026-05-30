"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as FiIcons from "react-icons/fi";
import * as BiIcons from "react-icons/bi";
import { FiGrid } from "react-icons/fi";

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
    Icon =
      (FiIcons as any)[key] ||
      (BiIcons as any)[key];

    if (Icon) break;
  }

  if (!Icon) Icon = FiGrid;

  return <Icon size={size} aria-hidden="true" focusable="false" />;
}

export default function CategoriasDestaque() {
  const { categorias, loading, erro } = useCategoria();

  const railRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const top = useMemo(() => {
    const lista = Array.isArray(categorias) ? categorias : [];
    return lista.slice(0, 20) as Categoria[];
  }, [categorias]);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const wheelScroll = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", wheelScroll, { passive: false });

    return () => {
      el.removeEventListener("wheel", wheelScroll);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el) return;

    setIsDragging(true);
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el || !isDragging) return;

    e.preventDefault();

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;

    el.scrollLeft = scrollLeft.current - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  if (loading || erro || !top.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>✨ Categorias</span>

          <h2>Explore nossas categorias</h2>

          <p>
            Arraste para descobrir novas categorias e encontre o presente perfeito.
          </p>
        </div>

        <div
          ref={railRef}
          className={`${styles.rail} ${isDragging ? styles.dragging : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
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
                <div className={styles.circle}>
                  <div className={styles.innerCircle}>
                    {getCategoryIcon(categoria?.icone, 22)}
                  </div>
                </div>

                <span className={styles.name}>{nome}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}