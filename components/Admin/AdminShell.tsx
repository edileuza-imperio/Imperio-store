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
  FiBell,
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
      String(text || "").toLowerCase().includes(term);

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
      <div className="shell">
        <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
          <div className="sidebarTop">
            <Link href="/painel" className="brand">
              <div className="brandIcon">UI</div>
              <div className="brandText">
                <strong>Universo Império</strong>
                <span>Central administrativa</span>
              </div>
            </Link>

            <button
              type="button"
              className="mobileClose"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
            >
              <FiX size={19} />
            </button>
          </div>

          <div className="searchBox">
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Buscar menu"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!usuario}
            />
          </div>

          <div className="profileCard">
            <div className="profileAvatar">
              {String(nomeUsuario).charAt(0).toUpperCase()}
            </div>

            <div className="profileText">
              <strong>{checkingAuth ? "Verificando..." : nomeUsuario}</strong>
              <span>{checkingAuth ? "Aguarde..." : emailUsuario}</span>
            </div>

            <span className={`statusDot ${usuario ? "online" : "offline"}`} />
          </div>

          <nav className="navArea">
            {!checkingAuth && !usuario && (
              <div className="warningCard">
                <div className="warningIcon">
                  <FiAlertCircle size={18} />
                </div>
                <div className="warningBody">
                  <strong>Login necessário</strong>
                  <p>Entre com sua conta para acessar o painel.</p>
                </div>
                <Link href="/login" className="warningBtn">
                  Ir para login
                </Link>
              </div>
            )}

            {usuario && loadingMenu && (
              <div className="loadingCard">
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
                      className={`navLink ${isActive(item.href) ? "active" : ""}`}
                    >
                      <span className="navIcon">
                        <Icon size={18} />
                      </span>
                      <span className="navLabel">{item.label}</span>
                    </Link>
                  );
                }

                const expanded = !!openGroups[item.label];
                const hasActiveChild = item.children?.some((c) => isActive(c.href));

                return (
                  <div key={`${item.label}-${index}`} className="navGroup">
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
                      <span className="navIcon">
                        <Icon size={18} />
                      </span>

                      <span className="navLabel">{item.label}</span>

                      <FiChevronDown
                        size={18}
                        className={`chevron ${expanded ? "rotate" : ""}`}
                      />
                    </button>

                    <div className={`subMenu ${expanded ? "show" : ""}`}>
                      {item.children?.map((child, childIndex) => {
                        const ChildIcon = getIcon(child.label);

                        return (
                          <Link
                            key={`${child.label}-${childIndex}`}
                            href={child.href || "#"}
                            className={`subLink ${isActive(child.href) ? "active" : ""}`}
                          >
                            <span className="subIcon">
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

          <div className="sidebarBottom">
            <button
              type="button"
              className="logoutBtn"
              onClick={sair}
              disabled={!usuario}
            >
              <FiLogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </aside>

        <div
          className={`overlay ${menuOpen ? "show" : ""}`}
          onClick={() => setMenuOpen(false)}
        />

        <div className="main">
          <header className="topbar">
            <div className="topbarLeft">
              <button
                type="button"
                className="menuBtn"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menu"
              >
                <FiMenu size={20} />
              </button>

              <div className="titleWrap">
                <h1 className="title">Painel Administrativo</h1>
                <p className="subtitle">
                  Controle geral da sua loja e do catálogo
                </p>
              </div>
            </div>

            <div className="topbarRight">
              <button type="button" className="notifyBtn" aria-label="Notificações">
                <FiBell size={18} />
              </button>

              <div className="miniProfile">
                <div className="miniAvatar">
                  {String(nomeUsuario).charAt(0).toUpperCase()}
                </div>
                <div className="miniText">
                  <strong>{nomeUsuario}</strong>
                  <span>{emailUsuario}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="content">{children}</main>
        </div>
      </div>

      <style jsx>{`
        .shell {
          min-height: 100vh;
          display: flex;
          background:
            radial-gradient(circle at top left, rgba(139, 92, 246, 0.08) 0%, transparent 22%),
            radial-gradient(circle at bottom right, rgba(79, 70, 229, 0.08) 0%, transparent 20%),
            #f8fafc;
        }

        .sidebar {
          width: 310px;
          min-width: 310px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          border-right: 1px solid #ebe7f2;
          z-index: 40;
        }

        .sidebarTop {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #f0ebf7;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          min-width: 0;
        }

        .brandIcon {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: 0 14px 28px rgba(124, 58, 237, 0.22);
        }

        .brandText {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .brandText strong {
          font-size: 15px;
          color: #111827;
          line-height: 1.2;
        }

        .brandText span {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .mobileClose {
          display: none;
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 14px;
          background: #f5f3ff;
          color: #5b21b6;
          cursor: pointer;
          flex-shrink: 0;
        }

        .searchBox {
          margin: 18px 20px 0;
          height: 48px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e7e9f0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
        }

        .searchBox input {
          flex: 1;
          border: 0;
          outline: none;
          background: transparent;
          color: #111827;
          font-size: 14px;
        }

        .profileCard {
          margin: 18px 20px 0;
          padding: 16px;
          border-radius: 22px;
          background: linear-gradient(135deg, #faf7ff 0%, #f4edff 100%);
          border: 1px solid #eadcff;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .profileAvatar,
        .miniAvatar {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          flex-shrink: 0;
        }

        .profileText,
        .miniText {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .profileText strong,
        .miniText strong {
          font-size: 14px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profileText span,
        .miniText span {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .statusDot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          display: block;
        }

        .statusDot.online {
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
        }

        .statusDot.offline {
          background: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.14);
        }

        .navArea {
          flex: 1;
          overflow-y: auto;
          padding: 18px 14px;
        }

        .navArea::-webkit-scrollbar {
          width: 8px;
        }

        .navArea::-webkit-scrollbar-thumb {
          background: #ddd6fe;
          border-radius: 999px;
        }

        .navLink,
        .groupButton,
        .subLink {
          width: 100%;
          text-decoration: none;
          border: 0;
          outline: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .navLink,
        .groupButton {
          min-height: 50px;
          padding: 0 14px;
          border-radius: 16px;
          background: transparent;
          color: #334155;
          cursor: pointer;
          transition: 0.2s ease;
          margin-bottom: 8px;
        }

        .navLink:hover,
        .groupButton:hover {
          background: #f6f0ff;
          color: #5b21b6;
        }

        .navLink.active,
        .groupButton.active {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
          box-shadow: 0 14px 24px rgba(124, 58, 237, 0.22);
        }

        .navGroup {
          margin-bottom: 8px;
        }

        .navIcon,
        .subIcon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .navLabel {
          flex: 1;
          font-size: 14px;
          font-weight: 700;
        }

        .chevron {
          transition: transform 0.2s ease;
        }

        .chevron.rotate {
          transform: rotate(180deg);
        }

        .subMenu {
          display: none;
          padding: 2px 0 8px 14px;
        }

        .subMenu.show {
          display: block;
        }

        .subLink {
          min-height: 42px;
          border-radius: 14px;
          padding: 0 14px;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          margin-top: 6px;
          transition: 0.2s ease;
        }

        .subLink:hover {
          background: #f8fafc;
          color: #4f46e5;
        }

        .subLink.active {
          background: #ede9fe;
          color: #5b21b6;
        }

        .sidebarBottom {
          padding: 16px 20px 20px;
          border-top: 1px solid #f0ebf7;
        }

        .logoutBtn {
          width: 100%;
          min-height: 48px;
          border: 0;
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

        .logoutBtn:hover {
          background: #ffe4e6;
        }

        .logoutBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .warningCard,
        .loadingCard {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid #ece7f5;
          background: #fff;
        }

        .warningCard {
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

        .warningBody strong {
          color: #111827;
          font-size: 15px;
        }

        .warningBody p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .warningBtn {
          width: fit-content;
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
        }

        .loadingCard {
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #6b7280;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #ddd6fe;
          border-top-color: #7c3aed;
          border-radius: 999px;
          animation: spin 0.8s linear infinite;
        }

        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          min-height: 82px;
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

        .titleWrap {
          min-width: 0;
        }

        .title {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          line-height: 1.2;
          color: #111827;
        }

        .subtitle {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .menuBtn,
        .notifyBtn {
          width: 44px;
          height: 44px;
          border: 0;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .menuBtn {
          display: none;
          background: #f5f3ff;
          color: #5b21b6;
        }

        .notifyBtn {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #ece7f5;
          color: #475569;
        }

        .notifyBtn:hover {
          background: #fff;
        }

        .miniProfile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #ece7f5;
          min-width: 0;
        }

        .content {
          padding: 24px;
          width: 100%;
          max-width: 100%;
        }

        .overlay {
          display: none;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100dvh;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 0 24px 80px rgba(15, 23, 42, 0.2);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.45);
            z-index: 30;
          }

          .overlay.show {
            display: block;
          }

          .menuBtn,
          .mobileClose {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .miniProfile {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 290px;
            min-width: 290px;
          }

          .topbar {
            padding: 14px 16px;
          }

          .content {
            padding: 16px;
          }

          .title {
            font-size: 19px;
          }

          .subtitle {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}