"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useUsuario from "@/hooks/Auth/useUsuario";
import { PainelApi } from "@/services/api/api";

import {
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronRight,
  FiShield,
  FiChevronDown,
} from "react-icons/fi";
import { SidebarItem, buscarMenuPainel } from "@/components/functions/menu/menu";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { usuario, loading, logado } = useUsuario();

  const [menu, setMenu] = useState<SidebarItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuErro, setMenuErro] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

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

        const menuNormalizado = await buscarMenuPainel();
        setMenu(menuNormalizado);

        const openState: Record<string, boolean> = {};

        menuNormalizado.forEach((item) => {
          if (item.children?.length) {
            openState[item.label] = item.children.some(
              (child) => child.url === pathname
            );
          }
        });

        setOpenMenus(openState);
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
  }, [loading, logado, pathname, router]);

  async function handleLogout() {
    try {
      setSaindo(true);
      await PainelApi.post("/logout", {});
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

  function handleNavigate(url?: string) {
    if (!url) return;

    router.push(url);
    setMobileMenuOpen(false);
  }

  function toggleMenu(label: string) {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }

  const inicial = useMemo(() => {
    return usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : "U";
  }, [usuario?.nome]);

  const primeiroNome = useMemo(() => {
    return usuario?.nome?.split(" ")[0] || "Usuário";
  }, [usuario?.nome]);

  const nivelNome = useMemo(() => {
    const usuarioTipado = usuario as
      | {
          nivel_nome?: string;
          nivel?: { nome?: string };
          nivelName?: string;
          nivel_id?: number;
        }
      | undefined;

    const nomeDireto =
      usuarioTipado?.nivel_nome ||
      usuarioTipado?.nivel?.nome ||
      usuarioTipado?.nivelName;

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
        <div className="sidebar-top">
          <div className="brand-box">
            <div className="brand-icon">{inicial}</div>

            <div className="brand-text">
              <strong>Império Admin</strong>
              <span>Painel profissional</span>
            </div>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu"
            type="button"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="user-card">
          <div className="user-avatar">{inicial}</div>

          <div className="user-content">
            <strong title={usuario?.nome || "Usuário"}>
              {usuario?.nome || "Usuário"}
            </strong>

            <span title={usuario?.email || "Sem e-mail"}>
              {usuario?.email || "Sem e-mail"}
            </span>

            <div className="user-badges">
              <span className="badge badge-online">Online</span>
              <span className="badge badge-role">{nivelNome}</span>
            </div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-header">
            <span>Navegação</span>
            <small>{menu.length}</small>
          </div>

          <nav className="nav-list">
            {menuLoading ? (
              <div className="menu-state">Carregando menu...</div>
            ) : menuErro ? (
              <div className="menu-error">{menuErro}</div>
            ) : menu.length === 0 ? (
              <div className="menu-state">Nenhum item de menu disponível.</div>
            ) : (
              menu.map((item, index) => {
                const temChildren =
                  Array.isArray(item.children) && item.children.length > 0;

                const ativoPai = !!item.url && pathname === item.url;
                const submenuAberto = !!openMenus[item.label];
                const childAtivo = temChildren
                  ? item.children!.some((child) => pathname === child.url)
                  : false;

                if (temChildren) {
                  return (
                    <div
                      key={`${item.label}-${index}`}
                      className={`nav-group ${submenuAberto ? "open" : ""} ${
                        childAtivo ? "group-active" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className={`nav-item nav-parent ${
                          childAtivo ? "active" : ""
                        }`}
                        onClick={() => toggleMenu(item.label)}
                      >
                        <div className="nav-item-left">
                          <span className="nav-dot" />
                          <span className="nav-label">{item.label}</span>
                        </div>

                        {submenuAberto ? (
                          <FiChevronDown size={16} className="nav-arrow" />
                        ) : (
                          <FiChevronRight size={16} className="nav-arrow" />
                        )}
                      </button>

                      <div className={`submenu ${submenuAberto ? "show" : ""}`}>
                        {item.children!.map((child, childIndex) => {
                          const ativoFilho = pathname === child.url;

                          return (
                            <button
                              key={`${child.url}-${childIndex}`}
                              type="button"
                              className={`submenu-item ${
                                ativoFilho ? "active" : ""
                              }`}
                              onClick={() => handleNavigate(child.url)}
                            >
                              <span className="submenu-bullet" />
                              <span className="submenu-label">{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={`${item.url || item.label}-${index}`}
                    type="button"
                    className={`nav-item ${ativoPai ? "active" : ""}`}
                    onClick={() => handleNavigate(item.url)}
                  >
                    <div className="nav-item-left">
                      <span className="nav-dot" />
                      <span className="nav-label">{item.label}</span>
                    </div>

                    <FiChevronRight size={16} className="nav-arrow" />
                  </button>
                );
              })
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="footer-info">
            <FiShield size={16} />
            <div>
              <strong>Sessão segura</strong>
              <span>Seu acesso está ativo.</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            disabled={saindo}
          >
            <FiLogOut size={17} />
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
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              type="button"
            >
              <FiMenu size={20} />
            </button>

            <div className="topbar-title">
              <span className="topbar-kicker">Painel administrativo</span>
              <h1>Olá, {primeiroNome}</h1>
              <p>Gerencie seu sistema com um visual mais limpo e profissional.</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="status-card">
              <span className="status-indicator" />
              <div>
                <strong>{nivelNome}</strong>
                <small>Sessão ativa</small>
              </div>
            </div>

            <div className="profile-chip">
              <div className="profile-avatar">{inicial}</div>
              <div className="profile-text">
                <strong>{usuario?.nome || "Usuário"}</strong>
                <span>{usuario?.email || "Sem e-mail"}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">
          <div className="content-wrapper">
            <div className="content-card">{children}</div>
          </div>
        </main>
      </section>

      <style jsx>{`
        .admin-layout {
          min-height: 100vh;
          display: flex;
          background:
            radial-gradient(circle at top left, rgba(210, 140, 108, 0.08), transparent 22%),
            radial-gradient(circle at bottom right, rgba(181, 95, 83, 0.08), transparent 24%),
            linear-gradient(180deg, #fffaf6 0%, #fff4ec 100%);
          color: #2f241f;
          overflow-x: hidden;
        }

        .sidebar {
          width: 300px;
          min-width: 300px;
          max-width: 300px;
          min-height: 100vh;
          background: linear-gradient(180deg, #2c201c 0%, #3a2924 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: sticky;
          top: 0;
          align-self: flex-start;
          z-index: 30;
          box-shadow: 12px 0 40px rgba(52, 30, 20, 0.16);
        }

        .sidebar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .brand-box {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #d18b72 0%, #b55f53 100%);
          color: #fff;
          font-weight: 900;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 12px 24px rgba(181, 95, 83, 0.26);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .brand-text strong {
          color: #fff;
          font-size: 17px;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .brand-text span {
          color: rgba(255, 255, 255, 0.68);
          font-size: 12px;
          margin-top: 4px;
        }

        .mobile-close {
          display: none;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          cursor: pointer;
          flex-shrink: 0;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .user-avatar,
        .profile-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #d18b72 0%, #b55f53 100%);
          color: #fff;
          font-weight: 900;
          font-size: 16px;
          flex-shrink: 0;
        }

        .user-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .user-content strong {
          color: #fff;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-content span {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
        }

        .badge-online {
          background: rgba(34, 197, 94, 0.14);
          color: #bbf7d0;
          border: 1px solid rgba(34, 197, 94, 0.22);
        }

        .badge-role {
          background: rgba(255, 255, 255, 0.08);
          color: #fff3ea;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .nav-section {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .nav-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
          padding: 0 6px;
        }

        .nav-header small {
          min-width: 22px;
          height: 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 11px;
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: auto;
          padding-right: 4px;
        }

        .nav-list::-webkit-scrollbar {
          width: 5px;
        }

        .nav-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.14);
          border-radius: 999px;
        }

        .nav-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-item {
          border: 1px solid transparent;
          background: transparent;
          color: #f7ede8;
          border-radius: 16px;
          min-height: 50px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.22s ease;
          text-align: left;
        }

        .nav-parent {
          width: 100%;
        }

        .nav-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }

        .nav-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.46);
          flex-shrink: 0;
        }

        .nav-label {
          font-size: 14px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-arrow {
          opacity: 0.55;
          flex-shrink: 0;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateX(3px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #d18b72 0%, #b55f53 100%);
          color: #fff;
          box-shadow: 0 14px 26px rgba(181, 95, 83, 0.24);
        }

        .nav-item.active .nav-dot {
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.16);
        }

        .nav-item.active .nav-arrow {
          opacity: 1;
        }

        .submenu {
          display: none;
          flex-direction: column;
          gap: 6px;
          padding-left: 18px;
          margin-top: 2px;
        }

        .submenu.show {
          display: flex;
        }

        .submenu-item {
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.88);
          border-radius: 14px;
          min-height: 42px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.22s ease;
        }

        .submenu-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateX(2px);
        }

        .submenu-item.active {
          background: rgba(209, 139, 114, 0.18);
          border-color: rgba(209, 139, 114, 0.34);
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(209, 139, 114, 0.12);
        }

        .submenu-bullet {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d9b2a5;
          flex-shrink: 0;
        }

        .submenu-item.active .submenu-bullet {
          background: #fff;
        }

        .submenu-label {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
        }

        .menu-state,
        .menu-error {
          border-radius: 16px;
          padding: 14px;
          font-size: 13px;
        }

        .menu-state {
          color: rgba(255, 255, 255, 0.72);
          background: rgba(255, 255, 255, 0.05);
        }

        .menu-error {
          color: #fecaca;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.16);
        }

        .sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-info {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.84);
        }

        .footer-info strong {
          display: block;
          font-size: 13px;
          color: #fff;
        }

        .footer-info span {
          display: block;
          font-size: 12px;
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.68);
        }

        .logout-button {
          border: none;
          min-height: 50px;
          border-radius: 16px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #fff;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.22s ease;
          box-shadow: 0 14px 24px rgba(239, 68, 68, 0.18);
        }

        .logout-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .logout-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .main-area {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 24px;
          background: rgba(255, 250, 246, 0.82);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(228, 210, 199, 0.9);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }

        .mobile-menu-button {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid #ead7cb;
          background: #fff;
          color: #533b33;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 10px 18px rgba(83, 59, 51, 0.06);
        }

        .topbar-title {
          min-width: 0;
        }

        .topbar-kicker {
          display: inline-block;
          margin-bottom: 6px;
          color: #b55f53;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .topbar-title h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.1;
          color: #352720;
          font-weight: 900;
        }

        .topbar-title p {
          margin: 6px 0 0;
          color: #7d6358;
          font-size: 14px;
          max-width: 580px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .status-card,
        .profile-chip {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(230, 212, 201, 0.9);
          border-radius: 18px;
          box-shadow: 0 12px 24px rgba(83, 59, 51, 0.05);
        }

        .status-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.14);
          flex-shrink: 0;
        }

        .status-card strong {
          display: block;
          font-size: 13px;
          color: #352720;
        }

        .status-card small {
          display: block;
          margin-top: 2px;
          font-size: 11px;
          color: #7d6358;
        }

        .profile-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          min-width: 0;
          max-width: 290px;
        }

        .profile-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .profile-text strong {
          font-size: 13px;
          color: #352720;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-text span {
          font-size: 11px;
          color: #7d6358;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .content-area {
          flex: 1;
          padding: 22px;
        }

        .content-wrapper {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
        }

        .content-card {
          min-height: calc(100vh - 138px);
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(232, 214, 204, 0.92);
          border-radius: 30px;
          box-shadow: 0 20px 50px rgba(83, 59, 51, 0.08);
          backdrop-filter: blur(8px);
          padding: 22px;
          overflow: hidden;
        }

        .mobile-overlay {
          display: none;
        }

        @media (max-width: 1180px) {
          .status-card {
            display: none;
          }
        }

        @media (max-width: 1080px) {
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
            background: rgba(33, 24, 20, 0.4);
            backdrop-filter: blur(2px);
          }

          .topbar {
            padding: 16px 18px;
          }

          .content-area {
            padding: 16px;
          }

          .content-card {
            min-height: calc(100vh - 120px);
            padding: 16px;
            border-radius: 24px;
          }
        }

        @media (max-width: 760px) {
          .topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .topbar-left,
          .topbar-right {
            width: 100%;
          }

          .topbar-right {
            justify-content: flex-start;
          }

          .profile-chip {
            max-width: 100%;
            width: 100%;
          }

          .topbar-title h1 {
            font-size: 24px;
          }

          .topbar-title p {
            font-size: 13px;
          }

          .sidebar {
            width: 286px;
            min-width: 286px;
            max-width: 286px;
          }
        }

        @media (max-width: 520px) {
          .content-area {
            padding: 10px;
          }

          .content-card {
            padding: 12px;
            border-radius: 18px;
          }

          .profile-text strong,
          .profile-text span {
            max-width: 160px;
          }
        }
      `}</style>
    </div>
  );
}