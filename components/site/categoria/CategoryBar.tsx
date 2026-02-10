'use client';

import useCategoria from "@/hooks/categoria/useCategoria";
import Link from "next/link";
import { useState } from "react";

interface CategoryBarProps {
  mobile?: boolean;
}

export default function CategoryBar({ mobile = false }: CategoryBarProps) {
  const { categorias, loading, erro } = useCategoria(1);
  const [open, setOpen] = useState(false); // controla abrir/fechar

  if (loading) return <div className="p-3 text-gray-400">Carregando categorias...</div>;
  if (erro) return <div className="p-3 text-red-500">{erro}</div>;
  if (!categorias || categorias.length === 0) return null;

  return (
    <>
      <div className="category-wrapper px-3 py-3">
        {/* Botão de abrir/fechar */}
        <button
          onClick={() => setOpen(!open)}
          className="category-toggle d-flex align-items-center justify-content-between w-100 px-3 py-2"
        >
          <span>Categorias</span>
          <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
        </button>

        {/* Conteúdo colapsável */}
        {open && (
          <div
            className={`d-flex ${mobile ? "flex-column" : "flex-row"} gap-3 mt-2 overflow-auto`}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: '12px',
            }}
          >
            {categorias.map((cat) => (
              <Link
                key={cat.id_categoria}
                href={`/categoria/${cat.id_categoria}`}
                className="category-item text-decoration-none d-flex align-items-center"
              >
                {cat.icone && (
                  <div className="category-icon d-flex align-items-center justify-content-center">
                    <i className={`bi ${cat.icone}`} />
                  </div>
                )}
                <span className="category-name ms-2">{cat.nome}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .category-toggle {
          font-weight: 600;
          background-color: #fdf4f4;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .category-toggle:hover {
          background-color: #fce8e5;
        }

        .category-item {
          min-width: 150px;
          padding: 0.75rem 1rem;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          transition: all 0.3s ease;
          text-align: left;
        }

        .category-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.12);
          background-color: #fff7f3;
        }

        .category-icon {
          width: 48px;
          height: 48px;
          background-color: #f0d7d4;
          color: #c97a7e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 1.25rem;
        }

        .category-item:hover .category-icon {
          transform: scale(1.1);
          background-color: #f4b7b0;
        }

        .category-name {
          font-size: 1rem;
          font-weight: 600;
          color: #444;
        }

        /* Scrollbar styling */
        .overflow-auto::-webkit-scrollbar {
          height: 6px;
        }
        .overflow-auto::-webkit-scrollbar-thumb {
          background: #c97a7e;
          border-radius: 3px;
        }
        .overflow-auto::-webkit-scrollbar-track {
          background: #fdf4f4;
          border-radius: 3px;
        }
      `}</style>
    </>
  );
}
