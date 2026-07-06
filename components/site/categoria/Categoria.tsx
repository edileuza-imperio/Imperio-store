"use client";

import Link from "next/link";
import { useMemo } from "react";

import type { IconType } from "react-icons";

import {
  FiGrid,
  FiArrowRight,
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
  FiBox,
  FiPackage,
} from "react-icons/fi";

import {
  BiCategory,
  BiStore,
  BiCloset,
  BiShoppingBag,
  BiHome,
  BiGift,
} from "react-icons/bi";

import "./Categorias.css";
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
  FiBox,
  FiPackage,
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

function getCategoryIcon(name?: string | null, size = 28) {
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

  const categoriasDestaque = useMemo<Categoria[]>(() => {
    return Array.isArray(categorias) ? categorias.slice(0, 16) : [];
  }, [categorias]);

  if (loading || erro || !categoriasDestaque.length) return null;

  return (
    <section className="categorias-section">
      <div className="categorias-container">
        <header className="categorias-header">
          <span className="categorias-badge">Categorias em destaque</span>

          <div className="categorias-title-row">
            <div>
              <h2>Explore nossas categorias</h2>

              <p>
                Navegue com conforto pelas categorias mais importantes e encontre
                o que procura de forma rápida e visual.
              </p>
            </div>

            <Link href="/categorias" className="categorias-top-link">
              Ver todas
              <FiArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="categorias-divider" aria-hidden="true">
          <span />
          <strong>✦</strong>
          <span />
        </div>

        <div className="categorias-list">
          {categoriasDestaque.map((categoria, index) => {
            const nome = categoria?.nome || categoria?.titulo || "Categoria";
            const slug = String(categoria?.slug || "").trim();
            const href = slug ? `/categorias/${slug}` : "/categorias";

            return (
              <Link
                key={
                  categoria?.id_categoria ||
                  categoria?.id ||
                  `${nome}-${index}`
                }
                href={href}
                className="categorias-item"
              >
                <span className="categorias-icon-wrap">
                  <span className="categorias-icon">
                    {getCategoryIcon(categoria?.icone, 30)}
                  </span>
                </span>

                <span className="categorias-info">
                  <strong>{nome}</strong>
                  <small>Ver produtos da categoria</small>

                  <span className="categorias-cta">
                    Explorar
                    <FiArrowRight size={14} aria-hidden="true" />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="categorias-bottom">
          <div className="categorias-divider categorias-divider-small" aria-hidden="true">
            <span />
            <strong>✦</strong>
            <span />
          </div>

          <Link href="/categorias" className="categorias-all-button">
            Ver todas as categorias
            <FiArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}