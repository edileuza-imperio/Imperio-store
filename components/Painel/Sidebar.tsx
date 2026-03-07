"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/Api/conectar";

import {
  FiHome,
  FiUsers,
  FiImage,
  FiBox,
  FiTag,
  FiChevronDown,
  FiX,
  FiSearch,
  FiGrid,
  FiLogOut,
  FiShield,
  FiAlertTriangle,
  FiMenu,
} from "react-icons/fi";

/** ✅ usa sua função /me (logado ou não) */
async function buscarUsuarioAutenticado() {
  try {
    const res = await api.get("/me", { withCredentials: true });
    return res.data?.dados?.usuario ?? null;
  } catch {
    return null;
  }
}

type SidebarItem = {
  type: "link" | "group";
  label: string;
  href?: string;
  match?: string;
  children?: SidebarItem[];
};

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [items, setItems] = useState<SidebarItem[]>([]);
  const [groups, setGroups] = useState<Record<string, boolean>>({});
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [q, setQ] = useState("");

  // ✅ auth state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  function isActive(href?: string) {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function getIcon(label: string) {
    const t = label.toLowerCase();
    if (t.includes("dashboard") || t.includes("painel")) return FiHome;
    if (t.includes("usu")) return FiUsers;
    if (t.includes("banner")) return FiImage;
    if (t.includes("prod")) return FiBox;
    if (t.includes("categ")) return FiTag;
    if (t.includes("catálogo") || t.includes("catalogo")) return FiGrid;
    if (t.includes("gest")) return FiGrid;
    if (t.includes("camp")) return FiGrid; // ✅ campanhas
    return FiBox;
  }

  async function checarAuth() {
    try {
      setCheckingAuth(true);
      const u = await buscarUsuarioAutenticado();
      setUsuario(u);

      // ✅ se não estiver logado e tentar acessar /painel, manda pro login
      if (!u && pathname?.toLowerCase().startsWith("/painel")) {
        router.replace("/login");
      }
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadMenu() {
    try {
      setLoadingMenu(true);

      // ✅ menu vem do backend
      const res = await api.get("/admin/dashboard");
      const data = res?.data?.dados?.dados ?? res?.data?.dados ?? [];

      if (Array.isArray(data)) {
        setItems(data);

        // ✅ abre automaticamente o grupo do item ativo
        const auto: Record<string, boolean> = {};
        data.forEach((it: SidebarItem) => {
          if (it.type === "group" && it.children?.some((c) => isActive(c.href))) {
            auto[it.label] = true;
          }
        });
        setGroups((prev) => ({ ...prev, ...auto }));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Erro ao carregar sidebar:", err);
      setItems([]);
    } finally {
      setLoadingMenu(false);
    }
  }

  // ✅ roda ao abrir a tela
  useEffect(() => {
    checarAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ se logou / deslogou, recarrega menu
  useEffect(() => {
    if (!checkingAuth && usuario) loadMenu();
    if (!checkingAuth && !usuario) {
      setItems([]);
      setLoadingMenu(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth, usuario]);

  // ✅ fecha no mobile ao navegar (apenas no mobile)
  useEffect(() => {
    if (open && window?.innerWidth <= 900) onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const filteredItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;

    const hit = (s?: string) => (s || "").toLowerCase().includes(term);

    return items
      .map((it) => {
        if (it.type === "link") return hit(it.label) ? it : null;

        const children = (it.children || []).filter((c) => hit(c.label) || hit(c.href));

        if (hit(it.label) || children.length > 0) return { ...it, children };
        return null;
      })
      .filter(Boolean) as SidebarItem[];
  }, [items, q]);

  async function sair() {
    try {
      // se você tiver rota de logout, use aqui:
      // await api.post("/logout", {}, { withCredentials: true });
    } catch {}
    setUsuario(null);
    router.replace("/login");
  }

  const nomeUsuario = usuario?.nome || usuario?.name || usuario?.email || "Usuário";
  const emailUsuario = usuario?.email || "";

  return (
    <>
      {/* ✅ overlay mobile */}
      <button
        type="button"
        aria-label="Fechar menu"
        className={`overlay ${open ? "show" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* TOP BAR */}
        <div className="topbar">
          <div className="brand">
            <div className="logo">
              <div className="logoDot" />
            </div>

            <div className="brandText">
              <strong>Universo Império</strong>
              <span>Admin</span>
            </div>
          </div>

          <button
            type="button"
            className="closeBtn"
            onClick={onClose}
            aria-label="Fechar sidebar"
            title="Fechar"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* USER CARD */}
        <div className="userCard">
          <div className="userAvatar">
            <div className="avatarBg">
              {nomeUsuario.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="userInfo">
            <div className="userName">{checkingAuth ? "Verificando..." : nomeUsuario}</div>
            <div className="userEmail">
              {checkingAuth ? "Aguarde" : emailUsuario || "Sessão administrativa"}
            </div>
          </div>

          <div className={`statusBadge ${usuario ? "online" : "offline"}`}>
            <span className="statusDot" />
          </div>
        </div>

        {/* SEARCH */}
        <div className="searchContainer">
          <FiSearch className="searchIcon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            disabled={!usuario}
            className="searchInput"
          />
        </div>

        {/* CONTENT */}
        <nav className="nav">
          {/* não logado */}
          {!checkingAuth && !usuario && (
            <div className="authBox">
              <div className="authIcon">
                <FiAlertTriangle size={20} />
              </div>
              <div className="authContent">
                <b>Não autenticado</b>
                <p>Faça login para acessar o painel.</p>
              </div>

              <Link href="/login" className="authBtn">
                Acessar
              </Link>
            </div>
          )}

          {/* loading */}
          {usuario && loadingMenu && (
            <div className="loaderContainer">
              <div className="spinner" />
              <span>Carregando...</span>
            </div>
          )}

          {/* menu */}
          {usuario &&
            !loadingMenu &&
            filteredItems.map((item, i) => {
              const Icon = getIcon(item.label);

              if (item.type === "link") {
                return (
                  <Link
                    key={i}
                    href={item.href || "#"}
                    className={`navLink ${isActive(item.href) ? "active" : ""}`}
                  >
                    <span className="navIcon">
                      <Icon size={18} />
                    </span>

                    <span className="navLabel">{item.label}</span>

                    {isActive(item.href) && <span className="activeMark" />}
                  </Link>
                );
              }

              const opened = !!groups[item.label];
              const anyChildActive = item.children?.some((c) => isActive(c.href));

              return (
                <div key={i} className="groupContainer">
                  <button
                    type="button"
                    className={`groupBtn ${opened ? "expanded" : ""} ${anyChildActive ? "active" : ""}`}
                    onClick={() =>
                      setGroups((prev) => ({
                        ...prev,
                        [item.label]: !opened,
                      }))
                    }
                  >
                    <span className="navIcon">
                      <Icon size={18} />
                    </span>

                    <span className="navLabel">{item.label}</span>

                    <FiChevronDown className={`chevron ${opened ? "rotated" : ""}`} size={18} />
                  </button>

                  <div className={`submenu ${opened ? "visible" : ""}`}>
                    {item.children?.map((c, j) => {
                      const IconChild = getIcon(c.label);
                      return (
                        <Link
                          key={j}
                          href={c.href || "#"}
                          className={`subLink ${isActive(c.href) ? "active" : ""}`}
                        >
                          <span className="subIcon">
                            <IconChild size={16} />
                          </span>

                          <span className="subLabel">{c.label}</span>

                          {isActive(c.href) && <span className="activeMark" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </nav>

        {/* FOOTER */}
        <div className="footer">
          <button type="button" className="logoutBtn" onClick={sair} disabled={!usuario} title="Sair">
            <FiLogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <style jsx>{`
        /* ✅ OVERLAY */
        .overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0);
          z-index: 2999;
          transition: background 0.3s ease;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        .overlay.show {
          display: block;
          background: rgba(0, 0, 0, 0.5);
        }

        /* ✅ SIDEBAR CONTAINER */
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 280px;
          height: 100vh;
          display: flex;
          flex-direction: column;

          background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%);
          border-right: 1px solid rgba(148, 163, 184, 0.1);
          box-shadow: -2px 0 12px rgba(0, 0, 0, 0.3);

          z-index: 3000;
          overflow: hidden;
        }

        /* ✅ TOP BAR */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .logo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .logoDot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
        }

        .brandText {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .brandText strong {
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .brandText span {
          color: rgba(148, 163, 184, 0.8);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .closeBtn {
          display: none;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s ease;
          place-items: center;
        }

        .closeBtn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        /* ✅ USER CARD */
        .userCard {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          margin: 12px 12px 0;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(148, 163, 184, 0.08);
        }

        .userAvatar {
          flex-shrink: 0;
        }

        .avatarBg {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .userInfo {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .userName {
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .userEmail {
          margin-top: 3px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(148, 163, 184, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .statusBadge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .statusBadge.online {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .statusBadge.offline {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .statusDot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          display: inline-block;
        }

        /* ✅ SEARCH */
        .searchContainer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          margin: 12px 12px 0;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.2s ease;
        }

        .searchContainer:focus-within {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .searchIcon {
          color: rgba(148, 163, 184, 0.7);
          flex-shrink: 0;
        }

        .searchInput {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
        }

        .searchInput::placeholder {
          color: rgba(148, 163, 184, 0.7);
        }

        .searchInput:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ✅ NAVIGATION */
        .nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 12px 12px;
          flex: 1;
        }

        .nav::-webkit-scrollbar {
          width: 6px;
        }

        .nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .nav::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 3px;
        }

        .nav::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.3);
        }

        /* ✅ NAV LINK */
        .navLink {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          color: rgba(203, 213, 225, 0.8);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .navLink:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          border-color: rgba(148, 163, 184, 0.1);
        }

        .navLink.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.15));
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
        }

        .navIcon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.1);
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .navLink:hover .navIcon {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(148, 163, 184, 0.15);
        }

        .navLink.active .navIcon {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.25));
          border-color: rgba(59, 130, 246, 0.4);
        }

        .navLabel {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .activeMark {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.15);
          flex-shrink: 0;
        }

        /* ✅ GROUP */
        .groupContainer {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .groupBtn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          cursor: pointer;
          color: rgba(203, 213, 225, 0.8);
          font-size: 13px;
          font-weight: 500;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .groupBtn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          border-color: rgba(148, 163, 184, 0.1);
        }

        .groupBtn.active {
          color: #fff;
          border-color: rgba(59, 130, 246, 0.2);
        }

        .chevron {
          margin-left: auto;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .chevron.rotated {
          transform: rotate(180deg);
        }

        /* ✅ SUBMENU */
        .submenu {
          display: none;
          flex-direction: column;
          gap: 6px;
          margin-left: 12px;
          padding-left: 12px;
          border-left: 2px solid rgba(59, 130, 246, 0.2);
        }

        .submenu.visible {
          display: flex;
        }

        .subLink {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          border-radius: 10px;
          color: rgba(148, 163, 184, 0.8);
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .subLink:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(203, 213, 225, 0.95);
          border-color: rgba(148, 163, 184, 0.1);
        }

        .subLink.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1));
          border-color: rgba(59, 130, 246, 0.25);
        }

        .subIcon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(148, 163, 184, 0.08);
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .subLink:hover .subIcon {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(148, 163, 184, 0.12);
        }

        .subLink.active .subIcon {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.15));
          border-color: rgba(59, 130, 246, 0.3);
        }

        .subLabel {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ✅ AUTH BOX */
        .authBox {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(59, 130, 246, 0.2);
          text-align: center;
          margin: 12px 0;
        }

        .authIcon {
          display: flex;
          justify-content: center;
          color: rgba(239, 68, 68, 0.8);
        }

        .authContent {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .authContent b {
          color: #fff;
          font-size: 12px;
          font-weight: 600;
        }

        .authContent p {
          margin: 0;
          font-size: 11px;
          font-weight: 500;
          color: rgba(148, 163, 184, 0.8);
        }

        .authBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 14px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #fff;
          font-weight: 600;
          font-size: 12px;
          border: none;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .authBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        /* ✅ LOADER */
        .loaderContainer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 12px;
          color: rgba(148, 163, 184, 0.8);
          font-size: 12px;
          font-weight: 500;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ✅ FOOTER */
        .footer {
          padding: 12px 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }

        .logoutBtn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.1);
          color: rgba(203, 213, 225, 0.8);
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logoutBtn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .logoutBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ✅ MOBILE RESPONSIVE */
        @media (max-width: 900px) {
          .sidebar {
            position: fixed;
            left: -280px;
            transition: left 0.3s ease;
          }

          .sidebar.open {
            left: 0;
          }

          .closeBtn {
            display: grid;
          }
        }
      `}</style>
    </>
  );
}
