'use client';

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import CategoryBar from "../categoria/CategoryBar";
import SearchBar from "../Pesquisa/SearchBar";
import useUsuario from "@/hooks/Auth/useUsuario";

interface NavbarMobileProps {
  menus: any[];
  categorias: any[];
  searchPlaceholder?: string;
}

export default function NavbarMobile({
  menus,
  categorias,
  searchPlaceholder,
}: NavbarMobileProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { usuario, loading, logado } = useUsuario();

  const dropdownRef = useRef<HTMLDivElement>(null);

  const ui = useMemo(() => ({
    bgA: "#fffaf0",
    bgB: "#fdf4f4",
    border: "rgba(212,175,55,0.26)",
    accent: "#c97a7e",
    gold: "#d4af37",
    text: "#2b2b2b",
    muted: "#6c757d",
    shadow: "0 18px 45px rgba(0,0,0,0.12)",
    shadowSoft: "0 10px 26px rgba(0,0,0,0.06)",
  }), []);

  const searchItem = menus?.find((m) => m.pesquisa_placeholder) || null;

  // remove login se estiver logado
  const menuItems = menus
    ?.filter((m) => !m.pesquisa_placeholder)
    ?.filter((m) => !(logado && m.nome.toLowerCase() === "login")) || [];

  const carrinhoItem = menuItems.find(
    (item) => item.nome.toLowerCase() === "carrinho"
  );

  const sidebarItems = menuItems.filter(
    (item) => item.nome.toLowerCase() !== "carrinho"
  );

  const closeAll = () => {
    setSidebarOpen(false);
    setUserDropdownOpen(false);
  };

  // fecha dropdown do usuário clicando fora
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userDropdownOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userDropdownOpen]);

  // trava scroll do body quando sidebar abrir
  useEffect(() => {
    if (sidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sidebarOpen]);

  // largura responsiva do offcanvas (inline)
  const getSidebarWidth = () => {
    // sem window no SSR: fallback seguro
    if (typeof window === "undefined") return 320;
    const w = window.innerWidth;
    if (w <= 360) return Math.min(300, Math.floor(w * 0.9));
    if (w <= 480) return Math.min(340, Math.floor(w * 0.85));
    return 360;
  };

  const [sidebarWidth, setSidebarWidth] = useState(320);

  useEffect(() => {
    const sync = () => setSidebarWidth(getSidebarWidth());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <>
      {/* ================= HEADER MOBILE ================= */}
      <div
        className="d-lg-none w-100"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          background: `linear-gradient(135deg, ${ui.bgA} 0%, ${ui.bgB} 100%)`,
          borderBottom: `1px solid ${ui.border}`,
          boxShadow: ui.shadowSoft,
        }}
      >
        <div
          style={{
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* ROW TOP */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr auto",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* MENU */}
            <button
              className="btn"
              onClick={() => {
                setSidebarOpen(true);
                setUserDropdownOpen(false);
              }}
              aria-label="Abrir menu"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "#fff",
                border: `1px solid ${ui.border}`,
                boxShadow: ui.shadowSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-list fs-3" style={{ color: ui.accent, lineHeight: 0 }} />
            </button>

            {/* LOGO */}
            <Link
              href="/"
              onClick={closeAll}
              style={{
                textDecoration: "none",
                color: ui.text,
                textAlign: "center",
                lineHeight: 1.1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: -0.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Universo{" "}
                <span
                  style={{
                    background: `linear-gradient(90deg, ${ui.gold}, ${ui.accent})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontStyle: "italic",
                    fontWeight: 900,
                  }}
                >
                  Império
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: ui.muted,
                  fontWeight: 700,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Decorações & Eventos
              </div>
            </Link>

            {/* DIREITA */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                justifyContent: "flex-end",
              }}
              ref={dropdownRef}
            >
              {/* CARRINHO */}
              {carrinhoItem && (
                <Link
                  href={carrinhoItem.rota || "#"}
                  onClick={closeAll}
                  aria-label="Carrinho"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "#fff",
                    border: `1px solid ${ui.border}`,
                    boxShadow: ui.shadowSoft,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: ui.accent,
                  }}
                >
                  <i className={`bi ${carrinhoItem.icone} fs-4`} />
                </Link>
              )}

              {/* USUÁRIO */}
              {!loading && (
                logado ? (
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((p) => !p)}
                    aria-label="Abrir menu do usuário"
                    style={{
                      height: 44,
                      maxWidth: 170, // evita quebrar layout
                      borderRadius: 14,
                      padding: "0 10px",
                      background: "#fff",
                      border: `1px solid ${userDropdownOpen ? "rgba(201,122,126,0.35)" : ui.border}`,
                      boxShadow: userDropdownOpen ? ui.shadow : ui.shadowSoft,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <i className="bi bi-person-circle fs-4" style={{ color: ui.accent }} />
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: 13,
                        color: ui.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {usuario?.nome}
                    </span>
                    <i
                      className={`bi ${userDropdownOpen ? "bi-chevron-up" : "bi-chevron-down"}`}
                      style={{ fontSize: 12, color: ui.muted }}
                    />
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeAll}
                    style={{
                      height: 44,
                      borderRadius: 14,
                      padding: "0 12px",
                      background: "#fff",
                      border: `1px solid ${ui.border}`,
                      boxShadow: ui.shadowSoft,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      textDecoration: "none",
                      color: ui.text,
                      fontWeight: 900,
                      fontSize: 13,
                    }}
                  >
                    <i className="bi bi-person" style={{ color: ui.accent, fontSize: 18 }} />
                    Entrar
                  </Link>
                )
              )}

              {/* DROPDOWN USUÁRIO */}
              {userDropdownOpen && logado && (
                <div
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 62,
                    minWidth: 220,
                    maxWidth: "calc(100vw - 24px)",
                    background: ui.bgA,
                    border: `1px solid ${ui.border}`,
                    borderRadius: 18,
                    boxShadow: ui.shadow,
                    zIndex: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: 12,
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      background: "linear-gradient(180deg, rgba(212,175,55,0.08), transparent)",
                    }}
                  >
                    <div style={{ fontSize: 12, color: ui.muted, fontWeight: 800 }}>Minha conta</div>
                    <div style={{ fontSize: 14, color: ui.text, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {usuario?.nome}
                    </div>
                  </div>

                  <div style={{ padding: 8 }}>
                    {[
                      { href: "/perfil", label: "Meu Perfil", icon: "bi-person-badge" },
                      { href: "/pedidos", label: "Meus Pedidos", icon: "bi-receipt" },
                    ].map((x) => (
                      <Link
                        key={x.href}
                        href={x.href}
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 14,
                          textDecoration: "none",
                          color: ui.text,
                          fontWeight: 900,
                          fontSize: 13,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,122,126,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <i className={`bi ${x.icon}`} style={{ color: ui.accent }} />
                        {x.label}
                      </Link>
                    ))}

                    {usuario?.nivel_id === 1 && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 14,
                          textDecoration: "none",
                          color: ui.text,
                          fontWeight: 900,
                          fontSize: 13,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,122,126,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <i className="bi bi-speedometer2" style={{ color: ui.accent }} />
                        Painel Administrativo
                      </Link>
                    )}

                    <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "8px 0" }} />

                    <Link
                      href="/sair"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 14,
                        textDecoration: "none",
                        background: "rgba(220,53,69,0.08)",
                        border: "1px solid rgba(220,53,69,0.22)",
                        color: "#b02a37",
                        fontWeight: 900,
                        fontSize: 13,
                      }}
                    >
                      <i className="bi bi-box-arrow-right" />
                      Sair
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEARCH */}
          {searchItem && (
            <SearchBar
              placeholder={searchItem.pesquisa_placeholder || searchPlaceholder || "Buscar produtos..."}
              className="w-100"
            />
          )}
        </div>
      </div>

      {/* ================= SIDEBAR (CUSTOM) ================= */}
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(3px)",
            zIndex: 70,
          }}
        />
      )}

      {/* Panel */}
      <div
        aria-hidden={!sidebarOpen}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: sidebarWidth,
          maxWidth: "92vw",
          background: `linear-gradient(180deg, ${ui.bgA}, #fff)`,
          borderRight: `1px solid ${ui.border}`,
          boxShadow: ui.shadow,
          zIndex: 80,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-105%)",
          transition: "transform .18s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              aria-hidden
              style={{
                width: 36,
                height: 36,
                borderRadius: 14,
                background: "rgba(212,175,55,0.14)",
                border: `1px solid ${ui.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-grid-3x3-gap" style={{ color: ui.accent }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, color: ui.text, lineHeight: 1.1 }}>Menu</div>
              <div style={{ fontSize: 12, color: ui.muted, fontWeight: 800 }}>
                Navegue pelas opções
              </div>
            </div>
          </div>

          <button
            className="btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: "#fff",
              border: `1px solid ${ui.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="bi bi-x-lg" style={{ color: ui.muted }} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 12,
            overflowY: "auto",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sidebarItems.map((item) => (
              <Link
                key={item.id ?? item.nome}
                href={item.rota || "#"}
                onClick={closeAll}
                style={{
                  textDecoration: "none",
                  color: ui.text,
                  background: "rgba(255,255,255,0.85)",
                  border: `1px solid rgba(0,0,0,0.06)`,
                  borderRadius: 16,
                  padding: "12px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 8px 18px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    background: "rgba(201,122,126,0.10)",
                    border: "1px solid rgba(201,122,126,0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                  }}
                >
                  <i className={`bi ${item.icone}`} style={{ color: ui.accent, fontSize: 18 }} />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.nome}
                  </div>
                  <div style={{ fontSize: 12, color: ui.muted, fontWeight: 700 }}>
                    Toque para abrir
                  </div>
                </div>

                <i className="bi bi-chevron-right" style={{ color: ui.muted }} />
              </Link>
            ))}
          </div>

          {/* Categorias */}
          {categorias?.length > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 18,
                background: "linear-gradient(180deg, rgba(212,175,55,0.10), rgba(201,122,126,0.06))",
                border: `1px solid ${ui.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <i className="bi bi-tags" style={{ color: ui.accent }} />
                <span style={{ fontWeight: 900, color: ui.text, fontSize: 14 }}>Categorias</span>
              </div>
              <CategoryBar mobile />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 12,
            borderTop: "1px solid rgba(0,0,0,0.06)",
            background: "rgba(255,255,255,0.75)",
          }}
        >
          <Link
            href="/"
            onClick={closeAll}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 16,
              background: "#fff",
              border: `1px solid ${ui.border}`,
              color: ui.text,
              fontWeight: 900,
            }}
          >
            <i className="bi bi-house" style={{ color: ui.accent }} />
            Voltar para Home
          </Link>
        </div>
      </div>
    </>
  );
}
