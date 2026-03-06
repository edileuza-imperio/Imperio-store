"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CategoryBar from "../categoria/CategoryBar";
import SearchBar from "../Pesquisa/SearchBar";
import useUsuario from "@/hooks/Auth/useUsuario";
import api from "@/Api/conectar";

import {
  FiMenu,
  FiX,
  FiChevronRight,
  FiChevronDown,
  FiUser,
  FiHome,
  FiLogOut,
  FiShoppingCart,
  FiGrid,
  FiBox,
  FiClipboard,
  FiActivity,
  FiUserCheck,
  FiTag,
} from "react-icons/fi";

import { Menu, MenuItem } from "@/components/Bibioteca/Bibiotecas";

interface Categoria {
  id_categoria?: number;
  nome?: string;
  slug?: string;
  icone?: string;
}

interface NavbarMobileProps {
  menus: Menu[];
  categorias: Categoria[];
  searchPlaceholder?: string;
}

export default function NavbarMobile({
  menus,
  categorias,
  searchPlaceholder,
}: NavbarMobileProps) {
  const router = useRouter();
  const { usuario, loading, logado } = useUsuario();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const ui = useMemo(
    () => ({
      accent: "#D6A24A",
      accentSoft: "rgba(214, 162, 74, 0.14)",
      accentSoftStrong: "rgba(214, 162, 74, 0.22)",
      text: "#2b2b2b",
      muted: "#6c757d",
      bg: "#f4efe8",
      bgSoft: "#fbf8f3",
      white: "#ffffff",
      borderSoft: "rgba(43, 43, 43, 0.08)",
      hoverBg: "#fdf4f2",
      danger: "#b54747",
      dangerBg: "rgba(181, 71, 71, 0.08)",
      dangerBorder: "rgba(181, 71, 71, 0.18)",
      shadowSoft: "0 10px 26px rgba(0,0,0,0.08)",
      shadowStrong: "0 18px 45px rgba(0,0,0,0.14)",
    }),
    []
  );

  const searchMenu = menus?.find((m) => m.pesquisa_placeholder) || null;
  const accountMenu =
    menus?.find((m) => (m.titulo || "").toLowerCase() === "login") || null;

  const menuItems =
    menus?.filter(
      (m) =>
        !m.pesquisa_placeholder &&
        (m.titulo || "").toLowerCase() !== "login"
    ) || [];

  const carrinhoItem =
    menuItems.find((item) =>
      (item.titulo || "").toLowerCase().includes("carrinho")
    ) || null;

  const sidebarItems = menuItems.filter(
    (item) => !(item.titulo || "").toLowerCase().includes("carrinho")
  );

  const accountItems = useMemo(() => {
    const itens = accountMenu?.itens || [];
    return [...itens].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0));
  }, [accountMenu]);

  const closeAll = () => {
    setSidebarOpen(false);
    setUserDropdownOpen(false);
  };

  const renderIcon = (bi?: string) => {
    const name = (bi || "").toLowerCase();

    if (name.includes("bi-box-arrow-right")) return <FiLogOut size={18} />;
    if (name.includes("bi-speedometer")) return <FiActivity size={18} />;
    if (name.includes("bi-card-checklist")) return <FiClipboard size={18} />;
    if (name.includes("bi-person-circle")) return <FiUserCheck size={18} />;
    if (name.includes("bi-cart")) return <FiShoppingCart size={18} />;
    if (name.includes("bi-person")) return <FiUser size={18} />;
    if (name.includes("bi-house")) return <FiHome size={18} />;
    if (name.includes("bi-tags")) return <FiTag size={18} />;
    if (name.includes("bi-grid")) return <FiGrid size={18} />;

    return <FiBox size={18} />;
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout", {}, { withCredentials: true });
    } catch (error) {
      console.warn("Logout falhou, seguindo o fluxo.", error);
    } finally {
      closeAll();
      router.replace("/login");
      router.refresh();
    }
  };

  const handleAccountItem = async (item: MenuItem) => {
    setUserDropdownOpen(false);
    setSidebarOpen(false);

    const titulo = (item.titulo || "").toLowerCase();

    if (titulo.includes("sair")) {
      await handleLogout();
      return;
    }

    if (item.rota) {
      router.push(item.rota);
    }
  };

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const getSidebarWidth = () => {
      if (typeof window === "undefined") return 320;

      const w = window.innerWidth;
      if (w <= 360) return Math.min(300, Math.floor(w * 0.92));
      if (w <= 480) return Math.min(340, Math.floor(w * 0.9));
      return 360;
    };

    const sync = () => setSidebarWidth(getSidebarWidth());

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <>
      {/* HEADER MOBILE */}
      <header
        className="d-lg-none w-100"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          background: ui.bg,
          borderBottom: `1px solid ${ui.borderSoft}`,
          boxShadow: ui.shadowSoft,
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* TOPO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "46px 1fr auto",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* BOTÃO MENU */}
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(true);
                setUserDropdownOpen(false);
              }}
              aria-label="Abrir menu"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: `1px solid ${ui.borderSoft}`,
                background: ui.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: ui.accent,
                boxShadow: ui.shadowSoft,
              }}
            >
              <FiMenu size={22} />
            </button>

            {/* LOGO */}
            <Link
              href="/"
              onClick={closeAll}
              style={{
                textDecoration: "none",
                color: ui.text,
                textAlign: "center",
                lineHeight: 1.05,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 950,
                  letterSpacing: -0.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Universo{" "}
                <span
                  style={{
                    color: ui.accent,
                    fontStyle: "italic",
                  }}
                >
                  Império
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: ui.muted,
                  fontWeight: 700,
                  marginTop: 3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Decorações & Eventos
              </div>
            </Link>

            {/* AÇÕES DIREITA */}
            <div
              ref={dropdownRef}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                position: "relative",
              }}
            >
              {carrinhoItem && (
                <Link
                  href={carrinhoItem.rota || "#"}
                  onClick={closeAll}
                  aria-label="Carrinho"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    border: `1px solid ${ui.borderSoft}`,
                    background: ui.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: ui.accent,
                    boxShadow: ui.shadowSoft,
                  }}
                >
                  {renderIcon(carrinhoItem.icone)}
                </Link>
              )}

              {!loading && !logado && (
                <Link
                  href="/login"
                  onClick={closeAll}
                  style={{
                    height: 44,
                    borderRadius: 14,
                    padding: "0 12px",
                    border: `1px solid ${ui.borderSoft}`,
                    background: ui.white,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                    color: ui.text,
                    fontWeight: 800,
                    fontSize: 13,
                    boxShadow: ui.shadowSoft,
                  }}
                >
                  <FiUser size={17} color={ui.accent} />
                  Entrar
                </Link>
              )}

              {!loading && logado && (
                <>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    aria-label="Abrir menu do usuário"
                    style={{
                      height: 44,
                      maxWidth: 170,
                      borderRadius: 14,
                      padding: "0 10px",
                      border: `1px solid ${
                        userDropdownOpen ? ui.accentSoftStrong : ui.borderSoft
                      }`,
                      background: "#fff8ef",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      boxShadow: userDropdownOpen ? ui.shadowStrong : ui.shadowSoft,
                    }}
                  >
                    <FiUser size={18} color={ui.accent} />
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
                    <FiChevronDown
                      size={14}
                      color={ui.muted}
                      style={{
                        transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform .18s ease",
                      }}
                    />
                  </button>

                  {userDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 52,
                        minWidth: 245,
                        maxWidth: "calc(100vw - 24px)",
                        background: ui.white,
                        border: `1px solid ${ui.borderSoft}`,
                        borderRadius: 18,
                        boxShadow: ui.shadowStrong,
                        overflow: "hidden",
                        zIndex: 999,
                      }}
                    >
                      <div
                        style={{
                          padding: 14,
                          borderBottom: `1px solid ${ui.borderSoft}`,
                          background:
                            "linear-gradient(180deg, rgba(214, 162, 74, 0.12), rgba(214, 162, 74, 0.03))",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: ui.muted,
                            fontWeight: 800,
                          }}
                        >
                          Minha conta
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: ui.text,
                            fontWeight: 900,
                            marginTop: 2,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {usuario?.nome}
                        </div>
                      </div>

                      <div style={{ padding: 8 }}>
                        {accountItems.length > 0 ? (
                          accountItems.map((item) => {
                            const isSair = (item.titulo || "")
                              .toLowerCase()
                              .includes("sair");

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleAccountItem(item)}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "11px 12px",
                                  borderRadius: 14,
                                  border: "none",
                                  background: isSair ? ui.dangerBg : "transparent",
                                  color: isSair ? ui.danger : ui.text,
                                  fontWeight: 850,
                                  fontSize: 13,
                                  textAlign: "left",
                                  cursor: "pointer",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    color: isSair ? ui.danger : ui.accent,
                                  }}
                                >
                                  {renderIcon(item.icone)}
                                </span>
                                <span>{item.titulo}</span>
                              </button>
                            );
                          })
                        ) : (
                          <>
                            <Link
                              href="/perfil"
                              onClick={() => setUserDropdownOpen(false)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "11px 12px",
                                borderRadius: 14,
                                textDecoration: "none",
                                color: ui.text,
                                fontWeight: 850,
                                fontSize: 13,
                              }}
                            >
                              <FiUserCheck size={18} color={ui.accent} />
                              Meu Perfil
                            </Link>

                            <Link
                              href="/pedidos"
                              onClick={() => setUserDropdownOpen(false)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "11px 12px",
                                borderRadius: 14,
                                textDecoration: "none",
                                color: ui.text,
                                fontWeight: 850,
                                fontSize: 13,
                              }}
                            >
                              <FiClipboard size={18} color={ui.accent} />
                              Meus Pedidos
                            </Link>

                            {usuario?.nivel_id === 1 && (
                              <Link
                                href="/admin/dashboard"
                                onClick={() => setUserDropdownOpen(false)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "11px 12px",
                                  borderRadius: 14,
                                  textDecoration: "none",
                                  color: ui.text,
                                  fontWeight: 850,
                                  fontSize: 13,
                                }}
                              >
                                <FiActivity size={18} color={ui.accent} />
                                Painel Administrativo
                              </Link>
                            )}

                            <div
                              style={{
                                height: 1,
                                background: ui.borderSoft,
                                margin: "8px 0",
                              }}
                            />

                            <button
                              type="button"
                              onClick={handleLogout}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                padding: "11px 12px",
                                borderRadius: 14,
                                background: ui.dangerBg,
                                border: `1px solid ${ui.dangerBorder}`,
                                color: ui.danger,
                                fontWeight: 900,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              <FiLogOut size={17} />
                              Sair
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* SEARCH */}
          {(searchMenu || searchPlaceholder) && (
            <SearchBar
              placeholder={
                searchMenu?.pesquisa_placeholder ||
                searchPlaceholder ||
                "Buscar produtos"
              }
              className="w-100"
            />
          )}
        </div>
      </header>

      {/* BACKDROP */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu"
          style={{
            position: "fixed",
            inset: 0,
            border: "none",
            background: "rgba(0,0,0,0.42)",
            backdropFilter: "blur(3px)",
            zIndex: 70,
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        aria-hidden={!sidebarOpen}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: sidebarWidth,
          maxWidth: "92vw",
          background: `linear-gradient(180deg, ${ui.bgSoft}, ${ui.white})`,
          borderRight: `1px solid ${ui.borderSoft}`,
          boxShadow: ui.shadowStrong,
          zIndex: 80,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-105%)",
          transition: "transform .2s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER SIDEBAR */}
        <div
          style={{
            padding: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${ui.borderSoft}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background: ui.accentSoft,
                border: `1px solid ${ui.accentSoftStrong}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: ui.accent,
              }}
            >
              <FiGrid size={18} />
            </div>

            <div>
              <div
                style={{
                  fontWeight: 900,
                  color: ui.text,
                  lineHeight: 1.1,
                  fontSize: 15,
                }}
              >
                Menu
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: ui.muted,
                  fontWeight: 700,
                }}
              >
                Navegue pelas opções
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: ui.white,
              border: `1px solid ${ui.borderSoft}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: ui.muted,
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
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
                key={item.id ?? item.titulo}
                href={item.rota || "#"}
                onClick={closeAll}
                style={{
                  textDecoration: "none",
                  color: ui.text,
                  background: "rgba(255,255,255,0.94)",
                  border: `1px solid ${ui.borderSoft}`,
                  borderRadius: 16,
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 8px 18px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: ui.accentSoft,
                    border: `1px solid ${ui.accentSoftStrong}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: ui.accent,
                    flex: "0 0 auto",
                  }}
                >
                  {renderIcon(item.icone)}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 14,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.titulo}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: ui.muted,
                      fontWeight: 700,
                    }}
                  >
                    Toque para abrir
                  </div>
                </div>

                <FiChevronRight size={16} color={ui.muted} />
              </Link>
            ))}
          </div>

          {/* CATEGORIAS */}
          {categorias?.length > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 18,
                background:
                  "linear-gradient(180deg, rgba(214, 162, 74, 0.10), rgba(214, 162, 74, 0.04))",
                border: `1px solid ${ui.accentSoftStrong}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <FiTag size={16} color={ui.accent} />
                <span
                  style={{
                    fontWeight: 900,
                    color: ui.text,
                    fontSize: 14,
                  }}
                >
                  Categorias
                </span>
              </div>

              <CategoryBar mobile />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: 12,
            borderTop: `1px solid ${ui.borderSoft}`,
            background: "rgba(255,255,255,0.8)",
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
              padding: "11px 12px",
              borderRadius: 16,
              background: ui.white,
              border: `1px solid ${ui.borderSoft}`,
              color: ui.text,
              fontWeight: 900,
              boxShadow: ui.shadowSoft,
            }}
          >
            <FiHome size={17} color={ui.accent} />
            Voltar para Home
          </Link>
        </div>
      </aside>
    </>
  );
}