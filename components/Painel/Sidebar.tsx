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
              <span className="logo-dot" />
            </div>

            <div className="brand-text">
              <strong>Universo Império</strong>
              <span>Admin</span>
            </div>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Fechar sidebar"
            title="Fechar"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* USER CARD */}
        <div className="user-card">
          <div className="user-icon">
            <FiShield size={18} />
          </div>

          <div className="user-info">
            <div className="user-name">{checkingAuth ? "Verificando..." : nomeUsuario}</div>
            <div className="user-email">
              {checkingAuth ? "Aguarde" : emailUsuario || "Sessão administrativa"}
            </div>
          </div>

          <div className={`pill ${usuario ? "ok" : "bad"}`}>{usuario ? "LOGADO" : "OFF"}</div>
        </div>

        {/* SEARCH */}
        <div className="search">
          <FiSearch className="search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no menu..."
            disabled={!usuario}
          />
        </div>

        {/* CONTENT */}
        <nav className="nav">
          <div className="nav-title">Navegação</div>

          {/* não logado */}
          {!checkingAuth && !usuario && (
            <div className="auth-box">
              <div className="auth-top">
                <FiAlertTriangle />
                <b>Você não está logado</b>
              </div>
              <p>Faça login para acessar o painel.</p>

              <Link href="/login" className="auth-btn">
                Ir para login
              </Link>
            </div>
          )}

          {/* loading */}
          {usuario && loadingMenu && (
            <div className="loader">
              <div className="bar" />
              <span>Carregando menu...</span>
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
                    className={`item ${isActive(item.href) ? "active" : ""}`}
                  >
                    <span className="ico">
                      <Icon size={18} />
                    </span>

                    <span className="label">{item.label}</span>

                    <span className="right-mark" />
                  </Link>
                );
              }

              const opened = !!groups[item.label];
              const anyChildActive = item.children?.some((c) => isActive(c.href));

              return (
                <div key={i} className="group-wrap">
                  <button
                    type="button"
                    className={`group ${opened ? "opened" : ""} ${anyChildActive ? "hint" : ""}`}
                    onClick={() =>
                      setGroups((prev) => ({
                        ...prev,
                        [item.label]: !opened,
                      }))
                    }
                  >
                    <span className="ico">
                      <Icon size={18} />
                    </span>

                    <span className="label">{item.label}</span>

                    <FiChevronDown className={`chev ${opened ? "rot" : ""}`} />
                  </button>

                  <div className={`submenu ${opened ? "show" : ""}`}>
                    {item.children?.map((c, j) => {
                      const IconChild = getIcon(c.label);
                      return (
                        <Link
                          key={j}
                          href={c.href || "#"}
                          className={`subitem ${isActive(c.href) ? "subactive" : ""}`}
                        >
                          <span className="sub-ico">
                            <IconChild size={16} />
                          </span>

                          <span className="label">{c.label}</span>

                          <span className="sub-mark" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </nav>

        {/* FOOTER */}
        <div className="sidebar-footer">
          <button type="button" className="logout" onClick={sair} disabled={!usuario} title="Sair">
            <FiLogOut size={16} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
