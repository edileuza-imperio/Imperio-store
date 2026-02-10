'use client';

import Link from "next/link";
import { useState } from "react";
import CategoryBar from "../categoria/CategoryBar";
import SearchBar from "../Pesquisa/SearchBar";
import useMenuItems from "@/hooks/menu/useMenuItems";
import useUsuario from "@/hooks/Auth/useUsuario";

interface Menu {
  id?: number;
  nome: string;
  icone?: string;
  rota?: string;
  pesquisa_placeholder?: string | null;
}

interface NavbarDesktopProps {
  menus: Menu[];
  categorias?: any[];
  searchPlaceholder?: string;
}

export default function NavbarDesktop({
  menus,
  categorias,
  searchPlaceholder
}: NavbarDesktopProps) {

  const { usuario, loading: usuarioLoading, logado } = useUsuario();
  const { menuItems } = useMenuItems(usuario?.nivel_id);

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // -------------------------------
  // Helpers
  // -------------------------------
  const searchMenu = menus.find(m => m.pesquisa_placeholder);
  const placeholder =
    searchPlaceholder ??
    searchMenu?.pesquisa_placeholder ??
    "Buscar...";

  const menuPrincipal = menus.filter(m => !m.pesquisa_placeholder);

  const getItemsForMenu = (menuId?: number) => {
    if (!menuId || !menuItems) return [];
    return menuItems
      .filter(item => item.menu_id === menuId)
      .sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0));
  };

  // -------------------------------
  // JSX
  // -------------------------------
  return (
    <div
      className="d-none d-lg-flex flex-column shadow-sm"
      style={{
        background: "#fffaf0",
        borderBottom: "1px solid rgba(212,175,55,0.25)"
      }}
    >

      {/* TOPO */}
      <div className="d-flex align-items-center justify-content-between py-3 px-5">

        {/* LOGO */}
        <Link href="/" className="text-decoration-none">
          <h1 className="fs-4 fw-bold mb-0">
            Universo{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #d4af37, #c97a7e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "italic",
                fontWeight: 900
              }}
            >
              Império
            </span>
          </h1>
          <small className="text-muted">Decorações & Eventos</small>
        </Link>

        {/* SEARCH */}
        {searchMenu && (
          <SearchBar
            placeholder={placeholder}
            className="mx-5"
          />
        )}

        {/* MENU */}
        <div className="d-flex align-items-center gap-3">

          {menuPrincipal.map(item => {
            const itensMenu = getItemsForMenu(item.id);

            // -------------------------------
            // LOGIN / USUÁRIO
            // -------------------------------
            if (item.nome.toLowerCase() === "login") {

              if (!logado) {
                return (
                  <Link
                    key="login"
                    href="/login"
                    className="text-decoration-none text-center"
                    style={{ color: "#555" }}
                  >
                    <i
                      className="bi bi-box-arrow-in-right fs-5"
                      style={{ color: "#c97a7e" }}
                    />
                    <span className="d-block small">Login</span>
                  </Link>
                );
              }

              const userItems = getItemsForMenu(4) || [];

              return (
                <div key="usuario" className="position-relative">
                  <button
                    className="btn d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(212,175,55,0.4)",
                      color: "#6b4c4f"
                    }}
                    onClick={() =>
                      setUserDropdownOpen(!userDropdownOpen)
                    }
                  >
                    <i className="bi bi-person-circle fs-5" />
                    <span className="fw-semibold small">
                      {usuario?.nome}
                    </span>
                  </button>

                  {userDropdownOpen && userItems.length > 0 && (
                    <ul
                      className="dropdown-menu dropdown-menu-end show mt-2"
                      style={{
                        display: "block",
                        position: "absolute",
                        right: 0,
                        background: "#fffaf0",
                        border: "1px solid rgba(212,175,55,0.3)",
                        minWidth: 200
                      }}
                    >
                      {userItems.map(sub => (
                        <li key={sub.id}>
                          <Link
                            className="dropdown-item"
                            href={sub.rota || "#"}
                          >
                            {sub.nome}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }

            // -------------------------------
            // MENU COM DROPDOWN
            // -------------------------------
            if (itensMenu.length > 0 && item.id !== undefined) {
              const menuId = item.id; // number garantido

              return (
                <div key={menuId} className="position-relative">
                  <button
                    className="btn btn-light rounded-circle p-2"
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === menuId ? null : menuId
                      )
                    }
                  >
                    <i
                      className={`bi ${item.icone} fs-5`}
                      style={{ color: "#c97a7e" }}
                    />
                  </button>

                  {openDropdown === menuId && (
                    <ul
                      className="dropdown-menu dropdown-menu-end show"
                      style={{
                        display: "block",
                        position: "absolute",
                        right: 0,
                        background: "#fffaf0",
                        border: "1px solid rgba(212,175,55,0.3)"
                      }}
                    >
                      {itensMenu.map(sub => (
                        <li key={sub.id}>
                          <Link
                            className="dropdown-item"
                            href={sub.rota || "#"}
                          >
                            {sub.nome}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }

            // -------------------------------
            // MENU SIMPLES
            // -------------------------------
            return (
              <Link
                key={item.id ?? item.nome}
                href={item.rota || "#"}
                className="text-decoration-none text-center"
                style={{ color: "#555" }}
              >
                <i
                  className={`bi ${item.icone} fs-5`}
                  style={{ color: "#c97a7e" }}
                />
                <span className="d-block small">{item.nome}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CATEGORIAS */}
      {categorias && categorias.length > 0 && (
        <div
          className="border-top py-2 px-5"
          style={{ background: "#fffaf0" }}
        >
          <CategoryBar />
        </div>
      )}
    </div>
  );
}
