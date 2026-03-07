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

    </>
  );
}
