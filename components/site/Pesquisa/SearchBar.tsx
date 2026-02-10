// components/menu/Pesquisa/SearchBar.tsx
'use client';

import { usePesquisa } from "@/hooks/pesquisa/usePesquisa";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export default function SearchBar({
  placeholder = "Buscar...",
  className = "",
  inputClassName = "",
}: SearchBarProps) {
  const { termo, setTermo, resultados, loading, error } = usePesquisa();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermo(e.target.value);
    setOpen(true);
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`flex-grow-1 position-relative ${className}`}
      ref={containerRef}
    >
      {/* Input */}
      <input
        type="search"
        className={`form-control py-3 shadow-sm ${inputClassName}`}
        placeholder={placeholder}
        value={termo}
        onChange={handleChange}
        style={{
          border: "2px solid #d4af37",
          borderRadius: "12px",
          fontSize: "1.05rem",
          paddingLeft: "15px",
          transition: "all 0.3s ease",
        }}
        onFocus={() => setOpen(true)}
      />

      {/* Dropdown */}
      {open && (loading || error || resultados.length > 0) && (
        <div
          className="position-absolute w-100 mt-2 shadow rounded overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #fffaf0, #fff0f0)",
            zIndex: 9999,
            maxHeight: 350,
            overflowY: "auto",
            border: "2px solid #d4af37",
            animation: "fadeSlideDown 0.3s ease",
          }}
        >
          {loading && <p className="p-3 text-muted mb-0">Carregando...</p>}
          {error && <p className="p-3 text-danger mb-0">{error}</p>}
          {!loading && !error && resultados.length === 0 && (
            <p className="p-3 text-muted mb-0">Nenhum resultado</p>
          )}
          {!loading &&
            resultados.map((prod) => {
              const precoFormatado =
                prod.preco != null && !isNaN(Number(prod.preco))
                  ? Number(prod.preco).toFixed(2)
                  : null;

              return (
                <Link
                  key={prod.id_produto}
                  href={prod.slug ? `/produto/${prod.slug}` : "#"}
                  className="d-flex align-items-center list-group-item list-group-item-action px-3 py-2"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onClick={() => setOpen(false)}
                >
                  {prod.imagem && (
                    <img
                      src={prod.imagem}
                      alt={prod.nome}
                      style={{
                        width: 50,
                        height: 50,
                        objectFit: "cover",
                        marginRight: 12,
                        borderRadius: "50%",
                        border: "1px solid #d4af37",
                      }}
                    />
                  )}
                  <div>
                    <div
                      className="fw-bold"
                      style={{
                        color: "#c97a7e",
                        fontSize: "1rem",
                      }}
                    >
                      {prod.nome}
                    </div>
                    {precoFormatado && (
                      <small
                        style={{
                          color: "#d4af37",
                          fontWeight: 500,
                        }}
                      >
                        R$ {precoFormatado}
                      </small>
                    )}
                  </div>
                </Link>
              );
            })}
        </div>
      )}

      {/* Animação CSS */}
      <style jsx>{`
        @keyframes fadeSlideDown {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .list-group-item-action:hover {
          background: linear-gradient(90deg, #d4af37, #c97a7e);
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}
