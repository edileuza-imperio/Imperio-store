"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/Api/conectar";
import useUsuario from "@/hooks/Auth/useUsuario";

type SidebarItem = {
  url: string;
  label: string;
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { usuario, loading, logado } = useUsuario();

  const [menu, setMenu] = useState<SidebarItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuErro, setMenuErro] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!logado) {
      router.replace("/login");
      return;
    }

    async function carregarMenu() {
      try {
        setMenuLoading(true);
        setMenuErro(null);

        const response = await api.get("/painel/dados", {
          withCredentials: true,
        });

        const data = response.data;
        setMenu(data?.dados?.dados?.sidebar || []);
      } catch (error: any) {
        console.error("Erro ao carregar menu:", error?.response?.data || error);

        setMenu([]);
        setMenuErro(
          error?.response?.data?.mensagem ||
            error?.message ||
            "Erro ao carregar menu."
        );
      } finally {
        setMenuLoading(false);
      }
    }

    carregarMenu();
  }, [loading, logado, router]);

  async function handleLogout() {
    try {
      setSaindo(true);

      await api.post(
        "/painel/logout",
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error: any) {
      console.error("Erro ao sair:", error?.response?.data || error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("Imperio_token");
      }

      router.replace("/login");
      router.refresh();
      setSaindo(false);
    }
  }

  const inicial = useMemo(() => {
    return usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : "U";
  }, [usuario?.nome]);

  const primeiroNome = useMemo(() => {
    return usuario?.nome?.split(" ")[0] || "Usuário";
  }, [usuario?.nome]);

  const nivelNome = useMemo(() => {
    const nomeDireto =
      (usuario as any)?.nivel_nome ||
      (usuario as any)?.nivel?.nome ||
      (usuario as any)?.nivelName;

    if (nomeDireto) return nomeDireto;

    switch (usuario?.nivel_id) {
      case 1:
        return "Sistema";
      case 2:
        return "Administrador";
      case 3:
        return "Cliente";
      default:
        return "Não definido";
    }
  }, [usuario]);

  if (loading) return null;

  return (
    <div className="admin-layout">
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-glow sidebar-glow-1" />
        <div className="sidebar-glow sidebar-glow-2" />

        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon">{inicial}</div>

            <div className="brand-text">
              <h2>Admin Panel</h2>
              <span>Gestão profissional</span>
            </div>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="user-card">
          <div className="avatar">{inicial}</div>

          <div className="user-info">
            <strong title={usuario?.nome || "Usuário"}>
              {usuario?.nome || "Usuário"}
            </strong>

            <small title={usuario?.email || "Sem e-mail"}>
              {usuario?.email || "Sem e-mail"}
            </small>

            <div className="user-meta">
              <span className="badge online">Online</span>
              <span className="badge nivel">{nivelNome}</span>
            </div>
          </div>
        </div>

        <div className="menu-wrapper">
          <div className="menu-header">
            <p className="menu-title">Navegação</p>
            <span className="menu-count">{menu.length}</span>
          </div>

          <nav className="menu">
            {menuLoading ? (
              <div className="menu-state">
                <span className="loader" />
                <p>Carregando menu...</p>
              </div>
            ) : menuErro ? (
              <div className="erro">{menuErro}</div>
            ) : (
              menu.map((item, index) => {
                const ativo = pathname === item.url;

                return (
                  <button
                    key={`${item.url}-${index}`}
                    type="button"
                    className={`menu-item ${ativo ? "active" : ""}`}
                    onClick={() => {
                      router.push(item.url);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="menu-icon" />
                    <span className="menu-label">{item.label}</span>
                    {ativo && <span className="menu-active-pill">Ativo</span>}
                  </button>
                );
              })
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="footer-box">
            <p>Sessão autenticada</p>
            <small>Seu acesso está ativo e protegido.</small>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            disabled={saindo}
          >
            <span className="logout-icon">↩</span>
            <span>{saindo ? "Saindo..." : "Sair da conta"}</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <section className="main-area">
        <header className="header">
          <div className="header-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              type="button"
            >
              ☰
            </button>

            <div className="header-title">
              <span className="header-kicker">Painel administrativo</span>
              <h1>Olá, {primeiroNome}</h1>
              <p>
                Gerencie seu sistema com uma interface mais moderna e
                profissional.
              </p>
            </div>
          </div>

          <div className="header-right">
            <div className="header-status-card">
              <span className="status-dot" />
              <div>
                <strong>{nivelNome}</strong>
                <small>Sessão ativa</small>
              </div>
            </div>

            <div className="header-user">
              <div className="header-avatar">{inicial}</div>

              <div className="header-user-text">
                <strong>{usuario?.nome || "Usuário"}</strong>
                <span>{usuario?.email || "Sem e-mail"}</span>
              </div>
            </div>

            <button
              type="button"
              className="header-logout"
              onClick={handleLogout}
              disabled={saindo}
            >
              {saindo ? "Saindo..." : "Sair"}
            </button>
          </div>
        </header>

        <main className="content">
          <div className="content-inner">{children}</div>
        </main>
      </section>

      <style jsx>{`
        .admin-layout {
          min-height: 100vh;
          display: flex;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 25%),
            radial-gradient(circle at bottom right, rgba(79, 70, 229, 0.1), transparent 30%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
          position: relative;
          overflow: hidden;
        }

        .sidebar {
          width: 320px;
          min-width: 320px;
          position: relative;
          z-index: 30;
          color: #fff;
          padding: 22px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          background:
            linear-gradient(180deg, rgba(9, 14, 28, 0.98) 0%, rgba(15, 23, 42, 0.98) 45%, rgba(22, 30, 49, 0.98) 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 18px 0 50px rgba(2, 6, 23, 0.18);
          backdrop-filter: blur(16px);
        }

        .sidebar-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(60px);
          opacity: 0.32;
          pointer-events: none;
        }

        .sidebar-glow-1 {
          width: 170px;
          height: 170px;
          background: rgba(37, 99, 235, 0.35);
          top: -40px;
          left: -50px;
        }

        .sidebar-glow-2 {
          width: 160px;
          height: 160px;
          background: rgba(99, 102, 241, 0.28);
          right: -40px;
          bottom: 110px;
        }

        .sidebar-top,
        .user-card,
        .menu-wrapper,
        .sidebar-footer {
          position: relative;
          z-index: 2;
        }

        .sidebar-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .brand-icon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          box-shadow:
            0 16px 30px rgba(37, 99, 235, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.16);
          flex-shrink: 0;
        }

        .brand-text h2 {
          margin: 0;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: 0.2px;
        }

        .brand-text span {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }

        .mobile-close {
          display: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 24px;
          cursor: pointer;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.04) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 10px 24px rgba(2, 6, 23, 0.14);
        }

        .avatar,
        .header-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 17px;
          color: #fff;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          box-shadow:
            0 16px 28px rgba(37, 99, 235, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.16);
          flex-shrink: 0;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .user-info strong {
          font-size: 15px;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-info small {
          font-size: 12px;
          color: #cbd5e1;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .badge {
          font-size: 11px;
          font-weight: 700;
          padding: 5px 9px;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .badge.online {
          color: #bbf7d0;
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.18);
        }

        .badge.nivel {
          color: #dbeafe;
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.18);
        }

        .menu-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          min-height: 0;
        }

        .menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 6px;
        }

        .menu-title {
          margin: 0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
          font-weight: 700;
        }

        .menu-count {
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #dbeafe;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: auto;
          padding-right: 2px;
        }

        .menu::-webkit-scrollbar {
          width: 6px;
        }

        .menu::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
        }

        .menu-item {
          border: 1px solid transparent;
          background: transparent;
          color: #e5e7eb;
          text-align: left;
          padding: 14px;
          border-radius: 18px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.22s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.07);
          color: #fff;
          transform: translateX(4px);
        }

        .menu-item.active {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow:
            0 14px 30px rgba(37, 99, 235, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .menu-icon {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.45);
        }

        .menu-item.active .menu-icon {
          background: #fff;
          box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.16);
        }

        .menu-label {
          flex: 1;
        }

        .menu-active-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 999px;
          color: #fff;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .menu-state {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #cbd5e1;
          font-size: 14px;
          padding: 12px 8px;
        }

        .loader {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }

        .erro {
          color: #fecaca;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.22);
          padding: 12px;
          border-radius: 14px;
          font-size: 14px;
        }

        .sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-box {
          padding: 15px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .footer-box p {
          margin: 0;
          font-size: 13px;
          color: #e2e8f0;
          font-weight: 700;
        }

        .footer-box small {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #94a3b8;
        }

        .logout-button,
        .header-logout {
          border: none;
          cursor: pointer;
          transition: 0.22s ease;
          font-weight: 700;
        }

        .logout-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 18px;
          padding: 15px 16px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #fff;
          box-shadow:
            0 16px 30px rgba(239, 68, 68, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.16);
        }

        .logout-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .logout-button:disabled,
        .header-logout:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .logout-icon {
          font-size: 15px;
          line-height: 1;
        }

        .main-area {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 20;
          min-height: 98px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 28px;
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.95);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }

        .mobile-menu-button {
          display: none;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          border: 1px solid #dbeafe;
          background: rgba(255, 255, 255, 0.95);
          color: #0f172a;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
        }

        .header-kicker {
          display: inline-block;
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #2563eb;
        }

        .header-title h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.1;
          color: #0f172a;
          font-weight: 800;
        }

        .header-title p {
          margin: 8px 0 0 0;
          color: #64748b;
          font-size: 14px;
          max-width: 600px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .header-status-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
        }

        .header-status-card strong {
          display: block;
          font-size: 13px;
          color: #0f172a;
        }

        .header-status-card small {
          display: block;
          margin-top: 2px;
          font-size: 12px;
          color: #64748b;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.14);
          flex-shrink: 0;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
          min-width: 0;
        }

        .header-user-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .header-user-text strong {
          font-size: 14px;
          color: #0f172a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 220px;
        }

        .header-user-text span {
          font-size: 12px;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 220px;
        }

        .header-logout {
          border-radius: 16px;
          padding: 12px 18px;
          background: #fff;
          color: #dc2626;
          border: 1px solid #fecaca;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }

        .header-logout:hover:not(:disabled) {
          background: #fff5f5;
        }

        .content {
          flex: 1;
          padding: 30px;
        }

        .content-inner {
          min-height: calc(100vh - 158px);
          padding: 30px;
          border-radius: 30px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.74) 100%);
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow:
            0 20px 55px rgba(15, 23, 42, 0.07),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
        }

        .mobile-overlay {
          display: none;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1200px) {
          .header-right {
            gap: 10px;
          }

          .header-status-card {
            display: none;
          }
        }

        @media (max-width: 1100px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: -100%;
            height: 100vh;
            transition: left 0.25s ease;
          }

          .sidebar.open {
            left: 0;
          }

          .mobile-close {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .mobile-menu-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .mobile-overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 25;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(2px);
          }

          .header {
            padding: 16px 18px;
          }

          .content {
            padding: 18px;
          }

          .content-inner {
            min-height: calc(100vh - 130px);
            padding: 18px;
            border-radius: 22px;
          }
        }

        @media (max-width: 760px) {
          .header {
            align-items: flex-start;
            flex-direction: column;
          }

          .header-left,
          .header-right {
            width: 100%;
          }

          .header-right {
            justify-content: flex-start;
          }

          .header-user {
            flex: 1;
          }

          .header-title h1 {
            font-size: 24px;
          }

          .header-title p {
            font-size: 13px;
          }

          .sidebar {
            width: 290px;
            min-width: 290px;
          }

          .header-logout {
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .content {
            padding: 14px;
          }

          .content-inner {
            padding: 14px;
          }

          .header-user-text strong,
          .header-user-text span {
            max-width: 150px;
          }
        }
      `}</style>
    </div>
  );
}