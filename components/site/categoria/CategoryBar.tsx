"use client";

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

interface CategoryBarProps {
  mobile?: boolean;
}

export default function CategoryBar({ mobile = false }: CategoryBarProps) {
  const { categorias, loading, erro } = useCategoria(); // ✅ nova mudança: sem (1)
  const [open, setOpen] = useState(false);
  const contentId = useId();

  const safeCategorias = useMemo(() => categorias ?? [], [categorias]);

  if (loading) {
    return (
      <div className="wrap">
        <div className="skeleton" />
        <style jsx>{`
          .wrap {
            padding: 12px;
          }
          .skeleton {
            height: 44px;
            border-radius: 14px;
            background: linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.04),
              rgba(0, 0, 0, 0.08),
              rgba(0, 0, 0, 0.04)
            );
            background-size: 200% 100%;
            animation: shimmer 1.1s infinite linear;
          }
          @keyframes shimmer {
            from {
              background-position: 200% 0;
            }
            to {
              background-position: -200% 0;
            }
          }
        `}</style>
      </div>
    );
  }

  // Se preferir mostrar erro, troque por um bloco vermelho.
  if (erro || safeCategorias.length === 0) return null;

  return (
    <>
      <div className={`wrap ${mobile ? "mobile" : "desktop"}`}>
        {/* Header / Toggle */}
        <button
          type="button"
          className="toggle"
          onClick={() => setOpen((p) => !p)}
          aria-expanded={open}
          aria-controls={contentId}
        >
          <span className="left">
            <span className="dot" aria-hidden="true" />
            Categorias
            <span className="count" aria-hidden="true">
              {safeCategorias.length}
            </span>
          </span>

          <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
        </button>

        {/* Content */}
        <div
          id={contentId}
          className={`content ${open ? "open" : ""} ${mobile ? "col" : "row"}`}
        >
          {safeCategorias.map((cat) => (
            <Link
              key={cat.id_categoria}
              href={`/categoria/${cat.id_categoria}`}
              className="item"
              onClick={() => setOpen(false)} // fecha ao clicar (bom no mobile)
            >
              {cat.icone ? (
                <span className="iconWrap" aria-hidden="true">
                  <i className={`bi ${cat.icone}`} />
                </span>
              ) : (
                <span className="iconWrap" aria-hidden="true">
                  <i className="bi bi-grid" />
                </span>
              )}

              <span className="name">{cat.nome}</span>
              <span className="chev" aria-hidden="true">
                <i className="bi bi-arrow-right-short" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .wrap {
          padding: 12px 12px 10px;
        }

        /* Paleta alinhada com seu tema */
        :global(:root) {
          --ui-bg: rgba(255, 250, 240, 0.8);
          --ui-card: rgba(255, 255, 255, 0.88);
          --ui-border: rgba(212, 175, 55, 0.26);
          --ui-rose: #c97a7e;
          --ui-gold: #d4af37;
          --ui-ink: #2b2b2b;
          --ui-muted: rgba(43, 43, 43, 0.62);
          --ui-shadow: 0 18px 45px rgba(0, 0, 0, 0.12);
          --ui-shadow-soft: 0 10px 26px rgba(0, 0, 0, 0.06);
          --ui-radius: 18px;
        }

        .toggle {
          width: 100%;
          height: 46px;
          border: 1px solid var(--ui-border);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 246, 242, 0.9));
          border-radius: 999px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: var(--ui-shadow-soft);
          transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
          color: var(--ui-ink);
          font-weight: 900;
        }

        .toggle:hover {
          transform: translateY(-1px);
          box-shadow: var(--ui-shadow);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 241, 236, 0.95));
        }

        .left {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          letter-spacing: -0.2px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--ui-gold), var(--ui-rose));
          box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.14);
        }

        .count {
          font-size: 12px;
          font-weight: 900;
          color: rgba(107, 76, 79, 0.95);
          background: rgba(212, 175, 55, 0.14);
          border: 1px solid var(--ui-border);
          padding: 6px 10px;
          border-radius: 999px;
        }

        .content {
          margin-top: 10px;
          border-radius: var(--ui-radius);
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: var(--ui-bg);
          box-shadow: var(--ui-shadow-soft);
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transform: translateY(-4px);
          transition: max-height 0.22s ease, opacity 0.18s ease, transform 0.18s ease;
        }

        .content.open {
          max-height: 420px; /* suficiente pra mobile com scroll */
          opacity: 1;
          transform: translateY(0);
        }

        /* layout */
        .content.row {
          display: flex;
          gap: 10px;
          padding: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }

        .content.col {
          display: grid;
          gap: 10px;
          padding: 12px;
        }

        /* item */
        .item {
          text-decoration: none;
          color: var(--ui-ink);
          background: var(--ui-card);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          box-shadow: var(--ui-shadow-soft);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 12px;
          transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
        }

        /* desktop “pílulas” com scroll */
        .desktop .item {
          min-width: 210px;
          scroll-snap-align: start;
        }

        /* mobile cards */
        .mobile .item {
          width: 100%;
        }

        .item:hover {
          transform: translateY(-2px);
          box-shadow: var(--ui-shadow);
          border-color: rgba(201, 122, 126, 0.22);
        }

        .iconWrap {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          background: rgba(201, 122, 126, 0.10);
          border: 1px solid rgba(201, 122, 126, 0.22);
          color: var(--ui-rose);
          font-size: 18px;
        }

        .name {
          font-size: 13px;
          font-weight: 900;
          letter-spacing: -0.15px;
          line-height: 1.2;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chev {
          color: var(--ui-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          opacity: 0.8;
        }

        /* scrollbar */
        .content.row::-webkit-scrollbar {
          height: 8px;
        }
        .content.row::-webkit-scrollbar-thumb {
          background: rgba(201, 122, 126, 0.55);
          border-radius: 99px;
        }
        .content.row::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.04);
          border-radius: 99px;
        }

        /* responsivo extra */
        @media (max-width: 480px) {
          .wrap {
            padding: 10px 10px 8px;
          }
          .toggle {
            height: 44px;
          }
          .desktop .item {
            min-width: 180px;
          }
          .name {
            font-size: 12.5px;
          }
        }

        /* acessibilidade */
        .toggle:focus-visible,
        .item:focus-visible {
          outline: 3px solid rgba(201, 122, 126, 0.25);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .toggle,
          .content,
          .item {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}