'use client';

import { usePesquisa } from "@/hooks/pesquisa/usePesquisa";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [hoverId, setHoverId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ui = useMemo(() => ({
    bg: "#ffffff",
    panel: "#fffaf0",
    border: "rgba(212,175,55,0.28)",
    accent: "#c97a7e",
    gold: "#d4af37",
    text: "#2b2b2b",
    muted: "#6c757d",
    shadow: "0 18px 45px rgba(0,0,0,0.12)",
    shadowSoft: "0 10px 26px rgba(0,0,0,0.06)",
  }), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermo(e.target.value);
    setOpen(true);
  };

  const hasDropdown = open && (loading || !!error || resultados.length > 0 || termo.trim().length > 0);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clear = () => {
    setTermo("");
    setOpen(false);
  };

  return (
    <div
      className={`position-relative ${className}`}
      ref={containerRef}
      style={{ width: "100%" }}
    >
      {/* WRAPPER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: ui.bg,
          border: `1px solid ${ui.border}`,
          borderRadius: 999,
          padding: "10px 12px",
          boxShadow: open ? ui.shadowSoft : "none",
          transition: "box-shadow .15s ease, transform .15s ease, border-color .15s ease",
          transform: open ? "translateY(-1px)" : "translateY(0)",
        }}
        onClick={() => setOpen(true)}
      >
        {/* LUPA */}
        <div
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(212,175,55,0.14)",
            border: `1px solid ${ui.border}`,
            flex: "0 0 auto",
          }}
        >
          <i className="bi bi-search" style={{ color: ui.accent, fontSize: 16 }} />
        </div>

        {/* INPUT */}
        <input
          type="search"
          className={`form-control border-0 shadow-none ${inputClassName}`}
          placeholder={placeholder}
          value={termo}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          style={{
            outline: "none",
            boxShadow: "none",
            fontSize: "1.03rem",
            color: ui.text,
            background: "transparent",
            padding: 0,
          }}
        />

        {/* LIMPAR */}
        {termo?.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpar pesquisa"
            style={{
              border: "none",
              background: "transparent",
              width: 34,
              height: 34,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform .12s ease, background .12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,122,126,0.10)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <i className="bi bi-x-lg" style={{ color: ui.muted, fontSize: 14 }} />
          </button>
        )}
      </div>

      {/* DROPDOWN */}
      {hasDropdown && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            marginTop: 10,
            zIndex: 9999,
            background: ui.panel,
            border: `1px solid ${ui.border}`,
            borderRadius: 18,
            boxShadow: ui.shadow,
            overflow: "hidden",
            maxHeight: 380,
          }}
        >
          {/* header */}
          <div
            style={{
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              background: "linear-gradient(180deg, rgba(212,175,55,0.08), transparent)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="bi bi-stars" style={{ color: ui.gold }} />
              <span style={{ fontWeight: 800, color: ui.text, fontSize: 13 }}>
                Resultados
              </span>
              {termo?.trim() && (
                <span style={{ color: ui.muted, fontSize: 13, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  para “{termo.trim()}”
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#6b4c4f",
                borderRadius: 999,
                padding: "6px 10px",
                border: `1px solid ${ui.border}`,
                background: "rgba(212,175,55,0.12)",
              }}
            >
              {loading ? "..." : resultados.length}
            </span>
          </div>

          {/* body */}
          <div style={{ overflowY: "auto", maxHeight: 330 }}>
            {loading && (
              <div style={{ padding: 12 }}>
                {[1, 2, 3].map((k) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 10px",
                      borderRadius: 14,
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.05)",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.06)",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, width: "70%", background: "rgba(0,0,0,0.06)", borderRadius: 8, marginBottom: 8 }} />
                      <div style={{ height: 10, width: "35%", background: "rgba(0,0,0,0.05)", borderRadius: 8 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div style={{ padding: 14, color: "#b02a37", fontWeight: 700 }}>
                {error}
              </div>
            )}

            {!loading && !error && termo.trim().length > 0 && resultados.length === 0 && (
              <div style={{ padding: 14, color: ui.muted }}>
                Nenhum resultado encontrado.
              </div>
            )}

            {!loading &&
              !error &&
              resultados.map((prod) => {
                const precoFormatado =
                  prod.preco != null && !isNaN(Number(prod.preco))
                    ? Number(prod.preco).toFixed(2)
                    : null;

                const isHover = hoverId === prod.id_produto;

                return (
                  <Link
                    key={prod.id_produto}
                    href={prod.slug ? `/produto/${prod.slug}` : "#"}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setHoverId(prod.id_produto)}
                    onMouseLeave={() => setHoverId(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 12px",
                      textDecoration: "none",
                      background: isHover ? "rgba(201,122,126,0.08)" : "transparent",
                      transition: "background .12s ease",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* img */}
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 999,
                        overflow: "hidden",
                        border: `1px solid ${ui.border}`,
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "0 0 auto",
                      }}
                    >
                      {prod.imagem ? (
                        <img
                          src={prod.imagem}
                          alt={prod.nome}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <i className="bi bi-image" style={{ color: ui.muted }} />
                      )}
                    </div>

                    {/* text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: ui.text,
                          fontWeight: 900,
                          fontSize: 14,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {prod.nome}
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 2 }}>
                        {precoFormatado ? (
                          <span style={{ color: ui.gold, fontWeight: 900, fontSize: 13 }}>
                            R$ {precoFormatado}
                          </span>
                        ) : (
                          <span style={{ color: ui.muted, fontSize: 13 }}>
                            Consulte
                          </span>
                        )}

                        <span
                          style={{
                            color: ui.muted,
                            fontSize: 12,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Ver detalhes
                        </span>
                      </div>
                    </div>

                    {/* arrow */}
                    <div
                      aria-hidden
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${ui.border}`,
                        background: isHover ? "rgba(212,175,55,0.14)" : "#fff",
                        transition: "background .12s ease",
                      }}
                    >
                      <i className="bi bi-arrow-right" style={{ color: ui.accent }} />
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
