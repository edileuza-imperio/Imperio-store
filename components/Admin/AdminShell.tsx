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
  FiSearch,
  FiGrid,
  FiLogOut,
  FiAlertCircle,
  FiMenu,
  FiX,
  FiLayers,
  FiShoppingBag,
  FiSettings,
} from "react-icons/fi";

type SidebarItem = {
  type: "link" | "group";
  label: string;
  href?: string;
  match?: string;
  children?: SidebarItem[];
};

type Props = {
  children: React.ReactNode;
};

async function buscarUsuarioAutenticado() {
  try {
    const res = await api.get("/me", { withCredentials: true });
    return res.data?.dados?.usuario ?? null;
  } catch {
    return null;
  }
}

function resolveMenu(payload: any): SidebarItem[] {
  const data = payload?.dados?.dados ?? payload?.dados ?? payload ?? [];
  return Array.isArray(data) ? data : [];
}

function getIcon(label: string) {
  const t = String(label || "").toLowerCase();

  if (t.includes("dashboard") || t.includes("painel") || t.includes("inicio")) {
    return FiHome;
  }
  if (t.includes("usu")) return FiUsers;
  if (t.includes("banner")) return FiImage;
  if (t.includes("prod")) return FiShoppingBag;
  if (t.includes("categ")) return FiTag;
  if (t.includes("catálogo") || t.includes("catalogo")) return FiGrid;
  if (t.includes("camp")) return FiLayers;
  if (t.includes("config")) return FiSettings;

  return FiBox;
}

export default function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [menuItems, setMenuItems] = useState<SidebarItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function isActive(href?: string) {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function checarAuth() {
    try {
      setCheckingAuth(true);
      const u = await buscarUsuarioAutenticado();
      setUsuario(u);

      if (!u && pathname?.startsWith("/painel")) {
        router.replace("/login");
      }
    } catch {
      setUsuario(null);
      router.replace("/login");
    } finally {
      setCheckingAuth(false);
    }
  }

  async function carregarMenu() {
    try {
      setLoadingMenu(true);

      const res = await api.get("/admin/dashboard", {
        withCredentials: true,
      });

      const data = resolveMenu(res.data);
      setMenuItems(data);

      const autoOpen: Record<string, boolean> = {};
      data.forEach((item) => {
        if (item.type === "group" && item.children?.some((c) => isActive(c.href))) {
          autoOpen[item.label] = true;
        }
      });

      setOpenGroups((prev) => ({ ...prev, ...autoOpen }));
    } catch (error) {
      console.error("Erro ao carregar menu:", error);
      setMenuItems([]);
    } finally {
      setLoadingMenu(false);
    }
  }

  useEffect(() => {
    checarAuth();
  }, []);

  useEffect(() => {
    if (!checkingAuth && usuario) {
      carregarMenu();
    }

    if (!checkingAuth && !usuario) {
      setMenuItems([]);
      setLoadingMenu(false);
    }
  }, [checkingAuth, usuario]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return menuItems;

    const match = (text?: string) =>
      String(text || "")
        .toLowerCase()
        .includes(term);

    return menuItems
      .map((item) => {
        if (item.type === "link") {
          return match(item.label) || match(item.href) ? item : null;
        }

        const children = (item.children || []).filter(
          (child) => match(child.label) || match(child.href)
        );

        if (match(item.label) || children.length > 0) {
          return { ...item, children };
        }

        return null;
      })
      .filter(Boolean) as SidebarItem[];
  }, [menuItems, query]);

  async function sair() {
    try {
      // await api.post("/logout", {}, { withCredentials: true });
    } catch {}

    setUsuario(null);
    router.replace("/login");
  }

  const nomeUsuario =
    usuario?.nome || usuario?.name || usuario?.email || "Administrador";

  const emailUsuario = usuario?.email || "Sessão administrativa";

  return (
    <>
      <div className="adminLayout">
        <aside className={`adminSidebar ${menuOpen ? "open" : ""}`}>
          <div className="sidebarHeader">
            <Link href="/painel" className="brandBox">
              <div className="brandLogo">UI</div>
              <div className="brandText">
                <strong>Universo Império</strong>
                <span>Painel administrativo</span>
              </div>
            </Link>

            <button
              type="button"
              className="mobileClose"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="sidebarSearch">
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Buscar menu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!usuario}
            />
          </div>

          <div className="userPanel">
            <div className="userAvatar">
              {String(nomeUsuario).charAt(0).toUpperCase()}
            </div>

            <div className="userTexts">
              <strong>{checkingAuth ? "Verificando..." : nomeUsuario}</strong>
              <span>{checkingAuth ? "Aguarde..." : emailUsuario}</span>
            </div>

            <span className={`userStatus ${usuario ? "on" : "off"}`} />
          </div>

          <nav className="menuArea">
            {!checkingAuth && !usuario && (
              <div className="loginWarning">
                <div className="warningIcon">
                  <FiAlertCircle size={18} />
                </div>
                <div>
                  <strong>Você precisa entrar</strong>
                  <p>Faça login para acessar o painel administrativo.</p>
                </div>
                <Link href="/login" className="loginBtn">
                  Ir para login
                </Link>
              </div>
            )}

            {usuario && loadingMenu && (
              <div className="menuLoading">
                <div className="spinner" />
                <span>Carregando menu...</span>
              </div>
            )}

            {usuario &&
              !loadingMenu &&
              filteredItems.map((item, index) => {
                const Icon = getIcon(item.label);

                if (item.type === "link") {
                  return (
                    <Link
                      key={`${item.label}-${index}`}
                      href={item.href || "#"}
                      className={`menuLink ${isActive(item.href) ? "active" : ""}`}
                    >
                      <span className="menuIcon">
                        <Icon size={18} />
                      </span>
                      <span className="menuText">{item.label}</span>
                    </Link>
                  );
                }

                const expanded = !!openGroups[item.label];
                const hasActiveChild = item.children?.some((c) => isActive(c.href));

                return (
                  <div
                    key={`${item.label}-${index}`}
                    className={`menuGroup ${expanded ? "expanded" : ""}`}
                  >
                    <button
                      type="button"
                      className={`groupButton ${hasActiveChild ? "active" : ""}`}
                      onClick={() =>
                        setOpenGroups((prev) => ({
                          ...prev,
                          [item.label]: !expanded,
                        }))
                      }
                    >
                      <span className="menuIcon">
                        <Icon size={18} />
                      </span>

                      <span className="menuText">{item.label}</span>

                      <FiChevronDown
                        size={18}
                        className={`groupChevron ${expanded ? "rotate" : ""}`}
                      />
                    </button>

                    <div className={`submenu ${expanded ? "show" : ""}`}>
                      {item.children?.map((child, childIndex) => {
                        const ChildIcon = getIcon(child.label);

                        return (
                          <Link
                            key={`${child.label}-${childIndex}`}
                            href={child.href || "#"}
                            className={`submenuLink ${isActive(child.href) ? "active" : ""}`}
                          >
                            <span className="submenuIcon">
                              <ChildIcon size={15} />
                            </span>
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </nav>

          <div className="sidebarFooter">
            <button
              type="button"
              className="logoutButton"
              onClick={sair}
              disabled={!usuario}
            >
              <FiLogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </aside>

        <div
          className={`sidebarOverlay ${menuOpen ? "show" : ""}`}
          onClick={() => setMenuOpen(false)}
        />

        <div className="adminMain">
          <header className="adminTopbar">
            <div className="topbarLeft">
              <button
                type="button"
                className="menuToggle"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <FiMenu size={20} />
              </button>

              <div className="topbarTitleWrap">
                <h1 className="topbarTitle">Painel Administrativo</h1>
                <p className="topbarSubtitle">
                  Gerencie produtos, categorias, banners e mais
                </p>
              </div>
            </div>

            <div className="topbarRight">
              <div className="miniUserCard">
                <div className="miniAvatar">
                  {String(nomeUsuario).charAt(0).toUpperCase()}
                </div>
                <div className="miniUserTexts">
                  <strong>{nomeUsuario}</strong>
                  <span>{emailUsuario}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="adminContent">{children}</main>
        </div>
      </div>

      <style jsx>{`
        .adminLayout {
          min-height: 100vh;
          display: flex;
          background:
            radial-gradient(circle at top left, #f7f1ff 0%, transparent 30%),
            linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%);
        }

        .adminSidebar {
          width: 300px;
          min-width: 300px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(14px);
          border-right: 1px solid #ebe7f2;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 40;
        }

        .sidebarHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px;
          border-bottom: 1px solid #f0ebf7;
        }

        .brandBox {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .brandLogo {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          color: #fff;
          font-weight: 900;
          font-size: 15px;
          box-shadow: 0 12px 24px rgba(124, 58, 237, 0.2);
        }

        .brandText {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .brandText strong {
          color: #111827;
          font-size: 15px;
          line-height: 1.2;
        }

        .brandText span {
          color: #6b7280;
          font-size: 12px;
        }

        .mobileClose {
          display: none;
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 12px;
          background: #f5f3ff;
          color: #5b21b6;
          cursor: pointer;
        }

        .sidebarSearch {
          margin: 18px 20px 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          height: 46px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e8eaf0;
        }

        .sidebarSearch input {
          flex: 1;
          border: 0;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #111827;
        }

        .userPanel {
          margin: 18px 20px 0;
          padding: 16px;
          border-radius: 20px;
          background: linear-gradient(135deg, #faf7ff 0%, #f3ecff 100%);
          border: 1px solid #eadcff;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .userAvatar,
        .miniAvatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
          font-weight: 900;
        }

        .userTexts,
        .miniUserTexts {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .userTexts strong,
        .miniUserTexts strong {
          font-size: 14px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .userTexts span,
        .miniUserTexts span {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .userStatus {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          display: inline-block;
        }

        .userStatus.on {
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
        }

        .userStatus.off {
          background: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.14);
        }

        .menuArea {
          flex: 1;
          overflow-y: auto;
          padding: 18px 14px 18px;
        }

        .menuArea::-webkit-scrollbar {
          width: 8px;
        }

        .menuArea::-webkit-scrollbar-thumb {
          background: #ddd6fe;
          border-radius: 999px;
        }

        .menuLink,
        .groupButton,
        .submenuLink {
          width: 100%;
          text-decoration: none;
          border: 0;
          outline: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .menuLink,
        .groupButton {
          min-height: 48px;
          padding: 0 14px;
          border-radius: 16px;
          color: #334155;
          background: transparent;
          margin-bottom: 8px;
          transition: 0.2s ease;
        }

        .menuLink:hover,
        .groupButton:hover {
          background: #f6f0ff;
          color: #5b21b6;
        }

        .menuLink.active,
        .groupButton.active {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
          box-shadow: 0 10px 20px rgba(124, 58, 237, 0.2);
        }

        .menuGroup {
          margin-bottom: 8px;
        }

        .menuIcon,
        .submenuIcon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .menuText {
          flex: 1;
          font-size: 14px;
          font-weight: 700;
        }

        .groupChevron {
          transition: transform 0.2s ease;
        }

        .groupChevron.rotate {
          transform: rotate(180deg);
        }

        .submenu {
          display: none;
          padding: 4px 0 8px 14px;
        }

        .submenu.show {
          display: block;
        }

        .submenuLink {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 14px;
          color: #475569;
          margin-top: 6px;
          font-size: 13px;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .submenuLink:hover {
          background: #f8fafc;
          color: #4f46e5;
        }

        .submenuLink.active {
          background: #ede9fe;
          color: #5b21b6;
        }

        .sidebarFooter {
          padding: 16px 20px 20px;
          border-top: 1px solid #f0ebf7;
        }

        .logoutButton {
          width: 100%;
          min-height: 48px;
          border: 0;
          outline: 0;
          border-radius: 16px;
          background: #fff1f2;
          color: #be123c;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .logoutButton:hover {
          background: #ffe4e6;
        }

        .logoutButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .adminMain {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .adminTopbar {
          position: sticky;
          top: 0;
          z-index: 20;
          min-height: 78px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: rgba(248, 250, 252, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #ebe7f2;
        }

        .topbarLeft,
        .topbarRight {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .topbarTitleWrap {
          min-width: 0;
        }

        .topbarTitle {
          margin: 0;
          font-size: 22px;
          line-height: 1.2;
          font-weight: 900;
          color: #111827;
        }

        .topbarSubtitle {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .menuToggle {
          display: none;
          width: 44px;
          height: 44px;
          border: 0;
          border-radius: 14px;
          background: #f5f3ff;
          color: #5b21b6;
          cursor: pointer;
        }

        .miniUserCard {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #ece7f5;
        }

        .adminContent {
          padding: 24px;
          width: 100%;
          max-width: 100%;
        }

        .sidebarOverlay {
          display: none;
        }

        .menuLoading,
        .loginWarning {
          border-radius: 18px;
          border: 1px solid #ece7f5;
          background: #fff;
          padding: 18px;
        }

        .menuLoading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #6b7280;
          min-height: 120px;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #ddd6fe;
          border-top-color: #7c3aed;
          border-radius: 999px;
          animation: spin 0.8s linear infinite;
        }

        .loginWarning {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .warningIcon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff7ed;
          color: #c2410c;
        }

        .loginWarning strong {
          color: #111827;
          font-size: 15px;
        }

        .loginWarning p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .loginBtn {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 14px;
          background: #111827;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          width: fit-content;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .adminSidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100dvh;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 0 24px 80px rgba(15, 23, 42, 0.2);
          }

          .adminSidebar.open {
            transform: translateX(0);
          }

          .sidebarOverlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.45);
            z-index: 30;
          }

          .sidebarOverlay.show {
            display: block;
          }

          .menuToggle,
          .mobileClose {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .miniUserCard {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .adminTopbar {
            padding: 14px 16px;
          }

          .adminContent {
            padding: 16px;
          }

          .topbarTitle {
            font-size: 18px;
          }

          .topbarSubtitle {
            font-size: 12px;
          }

          .adminSidebar {
            width: 290px;
            min-width: 290px;
          }
        }
      `}</style>
    </>
  );
}