"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./CategoriasDestaque.module.css";

type Categoria = {
  id_categoria?: number | string;
  nome?: string;
  slug?: string;
  icone?: string;
};

export default function CategoriasDestaque() {
  const { categorias, loading, erro } =
    useCategoria();

  const railRef =
    useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const startX = useRef(0);

  const scrollLeft = useRef(0);

  const top = useMemo(() => {
    const lista = Array.isArray(categorias)
      ? categorias
      : [];

    return lista.slice(0, 20) as Categoria[];
  }, [categorias]);

  useEffect(() => {
    const el = railRef.current;

    if (!el) return;

    const wheelScroll = (
      e: WheelEvent
    ) => {
      if (
        Math.abs(e.deltaY) >
        Math.abs(e.deltaX)
      ) {
        e.preventDefault();

        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener(
      "wheel",
      wheelScroll,
      {
        passive: false,
      }
    );

    return () => {
      el.removeEventListener(
        "wheel",
        wheelScroll
      );
    };
  }, []);

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const el = railRef.current;

    if (!el) return;

    setIsDragging(true);

    startX.current =
      e.pageX - el.offsetLeft;

    scrollLeft.current = el.scrollLeft;
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const el = railRef.current;

    if (!el || !isDragging) return;

    e.preventDefault();

    const x = e.pageX - el.offsetLeft;

    const walk =
      (x - startX.current) * 1.5;

    el.scrollLeft =
      scrollLeft.current - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  if (loading) return null;
  if (erro) return null;
  if (!top.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <span className={styles.badge}>
            ✨ Categorias
          </span>

          <h2>
            Explore nossas categorias
          </h2>

          <p>
            Arraste para descobrir novas
            categorias e encontre o presente
            perfeito.
          </p>
        </div>

        {/* CARROSSEL */}
        <div
          ref={railRef}
          className={`${styles.rail} ${
            isDragging
              ? styles.dragging
              : ""
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          {top.map((categoria, index) => {
            const nome =
              categoria?.nome ||
              "Categoria";

            const slug = String(
              categoria?.slug || ""
            ).trim();

            return (
              <Link
                key={
                  categoria?.id_categoria ||
                  index
                }
                href={`/categorias/${slug}`}
                className={styles.card}
                draggable={false}
              >
                <div className={styles.circle}>
                  <div
                    className={styles.innerCircle}
                  >
                    <i
                      className={`bi ${
                        categoria?.icone ||
                        "bi-grid"
                      }`}
                    />
                  </div>
                </div>

                <span className={styles.name}>
                  {nome}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}