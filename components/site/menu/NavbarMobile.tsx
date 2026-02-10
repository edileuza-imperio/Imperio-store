'use client';

import Link from "next/link";
import { useState } from "react";
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

  const searchItem = menus?.find((m) => m.pesquisa_placeholder) || null;

  // 🔹 remove login se estiver logado
  const menuItems = menus
    ?.filter((m) => !m.pesquisa_placeholder)
    ?.filter((m) => !(logado && m.nome.toLowerCase() === "login")) || [];

  const carrinhoItem = menuItems.find(
    (item) => item.nome.toLowerCase() === "carrinho"
  );

  const sidebarItems = menuItems.filter(
    (item) => item.nome.toLowerCase() !== "carrinho"
  );

  return (
    <>
      {/* ================= HEADER MOBILE ================= */}
      <div
        className="d-lg-none d-flex flex-column w-100 gap-3 p-3 shadow-sm"
        style={{
          background: "linear-gradient(135deg, #fffaf0 0%, #fdf4f4 100%)",
          borderBottom: "1px solid rgba(212,175,55,0.25)",
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          {/* MENU */}
          <button className="btn p-2" onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list fs-3" style={{ color: "#c97a7e" }} />
          </button>

          {/* LOGO */}
          <Link
            href="/"
            className="text-center flex-grow-1"
            style={{ textDecoration: "none", color: "#444" }}
          >
            <h1 className="mb-0 fs-4 fw-bold lh-1">
              Universo{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #d4af37, #c97a7e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontStyle: "italic",
                  fontWeight: 900,
                }}
              >
                Império
              </span>
            </h1>
            <small className="text-muted d-block fs-6 fw-medium">
              Decorações & Eventos
            </small>
          </Link>

          {/* DIREITA */}
          <div className="d-flex align-items-center gap-3 position-relative">
            {/* CARRINHO */}
            {carrinhoItem && (
              <Link
                href={carrinhoItem.rota || "#"}
                style={{ color: "#c97a7e", textDecoration: "none" }}
              >
                <i className={`bi ${carrinhoItem.icone} fs-4`} />
              </Link>
            )}

            {/* USUÁRIO */}
            {!loading &&
              (logado ? (
                <button
                  className="btn p-0 d-flex align-items-center gap-1"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    color: "#6b4c4f",
                    background: "none",
                  }}
                >
                  <i className="bi bi-person-circle fs-4" />
                  <span className="fw-semibold fs-6">{usuario?.nome}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="d-flex align-items-center gap-1"
                  style={{
                    textDecoration: "none",
                    color: "#6b4c4f",
                  }}
                >
                  <i className="bi bi-person fs-4" />
                  <span className="fw-semibold fs-6">Entrar</span>
                </Link>
              ))}

            {/* DROPDOWN USUÁRIO */}
            {userDropdownOpen && logado && (
              <div
                className="position-absolute end-0 mt-2 rounded-3 shadow-sm"
                style={{
                  top: "100%",
                  minWidth: 200,
                  background: "#fffaf0",
                  border: "1px solid rgba(212,175,55,0.3)",
                  zIndex: 999,
                }}
              >
                <Link
                  href="/perfil"
                  className="dropdown-item py-2 px-3"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  Meu Perfil
                </Link>

                <Link
                  href="/pedidos"
                  className="dropdown-item py-2 px-3"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  Meus Pedidos
                </Link>

                {usuario?.nivel_id === 1 && (
                  <Link
                    href="/admin/dashboard"
                    className="dropdown-item py-2 px-3"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    Painel Administrativo
                  </Link>
                )}

                <div className="dropdown-divider my-1" />

                <Link
                  href="/sair"
                  className="dropdown-item py-2 px-3 text-danger"
                >
                  Sair
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* SEARCH */}
        {searchItem && (
          <SearchBar
            placeholder={
              searchItem.pesquisa_placeholder ||
              searchPlaceholder ||
              "Buscar produtos..."
            }
            className="w-100"
          />
        )}
      </div>

      {/* ================= SIDEBAR ================= */}
      <div className={`offcanvas offcanvas-start ${sidebarOpen ? "show" : ""}`}>
        <div className="offcanvas-header border-bottom">
          <h5 className="mb-0 fw-bold">Menu</h5>
          <button className="btn-close" onClick={() => setSidebarOpen(false)} />
        </div>

        <div className="offcanvas-body pt-4">
          <ul className="list-unstyled">
            {sidebarItems.map((item) => (
              <li key={item.id ?? item.nome} className="mb-2">
                <Link
                  href={item.rota || "#"}
                  onClick={() => setSidebarOpen(false)}
                  className="d-flex align-items-center rounded-3 px-3 py-2"
                  style={{
                    textDecoration: "none",
                    color: "#444",
                    background:
                      "linear-gradient(90deg, #fff7f3, #fffaf0)",
                  }}
                >
                  <i
                    className={`bi ${item.icone} me-3`}
                    style={{ color: "#c97a7e" }}
                  />
                  {item.nome}
                </Link>
              </li>
            ))}

            {categorias?.length > 0 && (
              <li className="mt-4">
                <CategoryBar mobile />
              </li>
            )}
          </ul>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
