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

     
    </>
  );
}