"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/Api/conectar";
import useAutenticado from "@/hooks/Usuario/useAutenticado";

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  // 🔐 somente nível 1 e 4
  const { usuario, loading } = useAutenticado([1, 4]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    function fechar(e: MouseEvent) {
      const el = e.target as HTMLElement;
      if (!el.closest(".user-box")) setUserOpen(false);
    }
    document.addEventListener("click", fechar);
    return () => document.removeEventListener("click", fechar);
  }, []);

  async function logout() {
    await api.post("/logout", {}, { withCredentials: true });
    router.replace("/login");
  }

  if (loading || !usuario) return null;

  return (
    <>
      <div className="admin-wrapper">
        {/* overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">Império Admin</div>

          <nav>
            <Link
              className={`sidebar-item ${
                pathname.includes("/dashboard") ? "active" : ""
              }`}
              href="/admin/dashboard"
            >
              <i className="bi bi-speedometer2" /> Dashboard
            </Link>

            <Link
              className={`sidebar-item ${
                pathname.includes("/usuarios") ? "active" : ""
              }`}
              href="/admin/usuarios"
            >
              <i className="bi bi-people" /> Usuários
            </Link>

            <Link
              className={`sidebar-item ${
                pathname.includes("/produtos") ? "active" : ""
              }`}
              href="/admin/produtos"
            >
              <i className="bi bi-box-seam" /> Produtos
            </Link>

            <Link
              className={`sidebar-item ${
                pathname.includes("/pedidos") ? "active" : ""
              }`}
              href="/admin/pedidos"
            >
              <i className="bi bi-cart-check" /> Pedidos
            </Link>

            <Link
              className={`sidebar-item ${
                pathname.includes("/cupons") ? "active" : ""
              }`}
              href="/admin/cupons"
            >
              <i className="bi bi-ticket-perforated" /> Cupons
            </Link>

            <Link
              className={`sidebar-item ${
                pathname.includes("/configuracoes") ? "active" : ""
              }`}
              href="/admin/configuracoes"
            >
              <i className="bi bi-gear" /> Configurações
            </Link>
          </nav>

          <footer>© 2025 Império</footer>
        </aside>

        {/* main */}
        <main className="admin-main">
          <header className="admin-header">
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list" />
            </button>

            <h5>Painel Administrativo</h5>

            <div className="user-box" onClick={() => setUserOpen(!userOpen)}>
              <i className="bi bi-person-circle" />
              <span>{usuario.nome}</span>

              <div className={`dropdown ${userOpen ? "show" : ""}`}>
                <button onClick={logout}>
                  <i className="bi bi-box-arrow-right" /> Sair
                </button>
              </div>
            </div>
          </header>

          <section className="content">{children}</section>
        </main>
      </div>

      {/* STYLES */}
      <style jsx global>{`
        body {
          margin: 0;
          font-family: Inter, sans-serif;
          background: #f4f6fb;
        }

        /* SIDEBAR */
        .sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 260px;
          background: linear-gradient(180deg, #1e1e2f, #141421);
          color: #fff;
          padding: 20px;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: 0.3s;
          z-index: 1001;
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .sidebar-logo {
          font-weight: 700;
          margin-bottom: 24px;
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-item {
          padding: 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #cfd3ff;
          text-decoration: none;
        }

        .sidebar-item.active {
          background: rgba(212, 175, 55, 0.18);
          color: #d4af37;
        }

        footer {
          margin-top: auto;
          font-size: 12px;
          text-align: center;
          color: #aaa;
        }

        /* OVERLAY */
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          opacity: 0;
          pointer-events: none;
          transition: 0.3s;
          z-index: 1000;
        }

        .sidebar-overlay.show {
          opacity: 1;
          pointer-events: all;
        }

        /* MAIN */
        .admin-main {
          margin-left: 0;
        }

        @media (min-width: 992px) {
          .sidebar {
            transform: translateX(0);
          }
          .admin-main {
            margin-left: 260px;
          }
          .menu-btn {
            display: none;
          }
          .sidebar-overlay {
            display: none;
          }
        }

        /* HEADER */
        .admin-header {
          background: #fff;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-btn {
          background: #f4f6fb;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          position: relative;
        }

        .badge {
          position: absolute;
          top: 2px;
          right: 4px;
          background: #dc3545;
          color: #fff;
          font-size: 10px;
          border-radius: 50%;
          padding: 2px 6px;
        }

        /* USER DROPDOWN */
        .user-box {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .dropdown {
          position: absolute;
          top: 130%;
          right: 0;
          background: #fff;
          border-radius: 10px;
          min-width: 140px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          opacity: 0;
          transform: translateY(-5px);
          pointer-events: none;
          transition: 0.2s;
        }

        .dropdown.show {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
        }

        .dropdown button {
          width: 100%;
          border: none;
          background: none;
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* CONTENT */
        .content {
          padding: 24px;
        }
      `}</style>
    </>
  );
}
