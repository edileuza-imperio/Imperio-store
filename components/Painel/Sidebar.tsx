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

      const res = await api.get("/admin/dashboard");
      const data = res?.data?.dados?.dados ?? res?.data?.dados ?? [];

      if (Array.isArray(data)) {
        setItems(data);

        // abre automaticamente o grupo do item ativo
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

  // fecha no mobile ao navegar
  useEffect(() => {
    if (open) onClose?.();
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
      {/* overlay mobile */}
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
              <span className="logoDot" />
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
            <FiX size={18} />
          </button>
        </div>

        {/* USER CARD */}
        <div className="userCard">
          <div className="userIcon">
            <FiShield size={18} />
          </div>

          <div className="userInfo">
            <div className="userName">
              {checkingAuth ? "Verificando..." : nomeUsuario}
            </div>
            <div className="userEmail">
              {checkingAuth ? "Aguarde" : emailUsuario || "Sessão administrativa"}
            </div>
          </div>

          <div className={`pill ${usuario ? "ok" : "bad"}`}>{usuario ? "LOGADO" : "OFF"}</div>
        </div>

        {/* SEARCH */}
        <div className="search">
          <FiSearch className="sicon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no menu..."
            disabled={!usuario}
          />
        </div>

        {/* CONTENT */}
        <nav className="nav">
          <div className="navTitle">NAVEGAÇÃO</div>

          {/* não logado */}
          {!checkingAuth && !usuario && (
            <div className="authBox">
              <div className="authTop">
                <FiAlertTriangle />
                <b>Você não está logado</b>
              </div>
              <p>Faça login para acessar o painel.</p>

              <Link href="/login" className="authBtn">
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

                    <span className="rightMark" />
                  </Link>
                );
              }

              const opened = !!groups[item.label];
              const anyChildActive = item.children?.some((c) => isActive(c.href));

              return (
                <div key={i} className="groupWrap">
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
                          <span className="subIco">
                            <IconChild size={16} />
                          </span>

                          <span className="label">{c.label}</span>

                          <span className="subMark" />
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
          <button
            type="button"
            className="logout"
            onClick={sair}
            disabled={!usuario}
            title="Sair"
          >
            <FiLogOut size={16} />
            Sair
          </button>

          <div className="hintFoot">
            <span className="dot" />
            <span>Versão admin • UI profissional</span>
          </div>
        </div>
      </aside>

      <style jsx>{`
        :global(a) {
          text-decoration: none;
          color: inherit;
        }

        /* ✅ overlay mobile (abaixo do sidebar, acima do resto) */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.58);
          border: none;
          display: none;
          z-index: 9999; /* ✅ overlay */
        }
        .overlay.show {
          display: block;
        }

        /* ✅ sidebar DESKTOP: não pode ficar por cima do header */
        .sidebar {
          width: 320px;
          height: 100vh;
          position: sticky;
          top: 0;

          z-index: 10; /* ✅ antes era 9999 (cobria o header) */

          display: flex;
          flex-direction: column;

          background: linear-gradient(180deg, #070a14, #050713);
          border-right: 1px solid rgba(255, 255, 255, 0.06);

          padding: 16px 14px 14px;
          overflow: hidden;
        }

        /* premium background */
        .sidebar:before {
          content: "";
          position: absolute;
          inset: -1px;
          pointer-events: none;
          background: radial-gradient(
              900px 520px at 10% 12%,
              rgba(124, 58, 237, 0.26),
              transparent 55%
            ),
            radial-gradient(
              820px 520px at 92% 18%,
              rgba(14, 165, 233, 0.16),
              transparent 58%
            ),
            radial-gradient(
              700px 400px at 50% 90%,
              rgba(34, 197, 94, 0.08),
              transparent 55%
            );
        }

        .sidebar > * {
          position: relative;
          z-index: 1;
        }

        /* topbar */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .logo {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: grid;
          place-items: center;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.35);
        }

        .logoDot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          box-shadow: 0 0 0 7px rgba(124, 58, 237, 0.14);
        }

        .brandText {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1.08;
        }

        .brandText strong {
          font-size: 14px;
          font-weight: 950;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .brandText span {
          margin-top: 4px;
          font-size: 11px;
          font-weight: 800;
          color: rgba(148, 163, 184, 0.9);
        }

        .closeBtn {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          cursor: pointer;
          transition: 0.2s;
        }
        .closeBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.1);
        }

        /* user card */
        .userCard {
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 12px;
          border-radius: 16px;

          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

          margin-bottom: 12px;
        }

        .userIcon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;

          background: rgba(124, 58, 237, 0.18);
          border: 1px solid rgba(124, 58, 237, 0.22);
          color: #fff;
        }

        .userInfo {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .userName {
          color: #fff;
          font-weight: 950;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .userEmail {
          margin-top: 4px;
          font-size: 11px;
          font-weight: 800;
          color: rgba(148, 163, 184, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pill {
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.08em;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid transparent;
          user-select: none;
        }

        .pill.ok {
          color: #052e16;
          background: rgba(34, 197, 94, 0.9);
          border-color: rgba(34, 197, 94, 0.4);
        }

        .pill.bad {
          color: #fff;
          background: rgba(239, 68, 68, 0.86);
          border-color: rgba(239, 68, 68, 0.35);
        }

        /* search */
        .search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 16px;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);

          margin-bottom: 12px;
        }

        .sicon {
          color: rgba(203, 213, 225, 0.9);
        }

        .search input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #fff;
          font-size: 13px;
          font-weight: 850;
        }

        .search input::placeholder {
          color: rgba(148, 163, 184, 0.85);
          font-weight: 850;
        }

        .search input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* nav */
        .nav {
          display: flex;
          flex-direction: column;
          gap: 7px;
          overflow: auto;
          padding-right: 4px;
          flex: 1;
        }

        .navTitle {
          font-size: 11px;
          letter-spacing: 0.1em;
          color: rgba(148, 163, 184, 0.9);
          font-weight: 950;
          margin: 2px 0 6px;
          padding-left: 6px;
        }

        .loader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(148, 163, 184, 0.9);
          font-weight: 850;
          font-size: 12px;
        }

        .loader .bar {
          width: 32px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
        }

        .loader .bar:before {
          content: "";
          position: absolute;
          left: -40%;
          top: 0;
          height: 100%;
          width: 55%;
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          animation: slide 1.1s infinite;
        }

        @keyframes slide {
          0% {
            left: -50%;
          }
          100% {
            left: 120%;
          }
        }

        /* not logged box */
        .authBox {
          padding: 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: rgba(203, 213, 225, 0.95);
        }

        .authTop {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-weight: 950;
        }

        .authBox p {
          margin: 8px 0 12px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(148, 163, 184, 0.95);
        }

        .authBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 10px 12px;
          border-radius: 14px;

          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: #fff;
          font-weight: 950;
          border: 1px solid rgba(124, 58, 237, 0.35);
          transition: 0.18s;
        }

        .authBtn:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        /* items */
        .item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 16px;

          color: rgba(203, 213, 225, 0.95);
          font-size: 13px;
          font-weight: 950;

          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: 0.18s;
          overflow: hidden;
        }

        .item:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .ico {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          display: grid;
          place-items: center;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .label {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rightMark {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: transparent;
        }

        .active {
          color: #fff;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.33),
            rgba(14, 165, 233, 0.14)
          );
          border-color: rgba(124, 58, 237, 0.28);
          box-shadow: 0 18px 40px rgba(124, 58, 237, 0.14);
        }

        .active .ico {
          background: rgba(124, 58, 237, 0.22);
          border-color: rgba(124, 58, 237, 0.28);
        }

        .active .rightMark {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          box-shadow: 0 0 0 7px rgba(124, 58, 237, 0.14);
        }

        /* groups */
        .groupWrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .group {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 16px;

          cursor: pointer;

          color: #fff;
          font-size: 13px;
          font-weight: 950;

          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: 0.18s;
        }

        .group:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .group.hint {
          border-color: rgba(124, 58, 237, 0.22);
        }

        .chev {
          margin-left: auto;
          opacity: 0.9;
          transition: 0.2s;
        }

        .chev.rot {
          transform: rotate(180deg);
        }

        .group.opened {
          background: rgba(255, 255, 255, 0.055);
        }

        .submenu {
          display: none;
          flex-direction: column;
          gap: 6px;
          margin-left: 12px;
          padding-left: 12px;
          border-left: 1px dashed rgba(255, 255, 255, 0.12);
        }

        .submenu.show {
          display: flex;
        }

        .subitem {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 10px 12px;
          border-radius: 16px;

          color: rgba(148, 163, 184, 0.95) !important;
          font-size: 12.5px;
          font-weight: 950;

          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);

          transition: 0.18s;
          overflow: hidden;
        }

        .subitem:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.06);
          color: #fff !important;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .subIco {
          width: 32px;
          height: 32px;
          border-radius: 14px;
          display: grid;
          place-items: center;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .subMark {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: transparent;
        }

        .subactive {
          color: #fff !important;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.24),
            rgba(14, 165, 233, 0.12)
          );
          border-color: rgba(124, 58, 237, 0.22);
        }

        .subactive .subMark {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          box-shadow: 0 0 0 7px rgba(124, 58, 237, 0.14);
        }

        /* footer */
        .footer {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: grid;
          gap: 10px;
        }

        .logout {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 16px;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;

          cursor: pointer;
          font-weight: 950;
          transition: 0.18s;
        }

        .logout:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.1);
        }

        .logout:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .hintFoot {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(148, 163, 184, 0.9);
          font-size: 11px;
          font-weight: 900;
          padding: 0 4px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(168, 85, 247, 0.95);
          box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.14);
        }

        /* scrollbar */
        .nav::-webkit-scrollbar {
          width: 8px;
        }
        .nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
        }
        .nav::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        /* ✅ mobile: sidebar por cima do header (menu lateral) */
        @media (max-width: 900px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: -120%;
            z-index: 10000; /* ✅ sidebar acima do overlay e acima do header */
            transition: 0.28s ease;
          }
          .sidebar.open {
            left: 0;
          }
          .closeBtn {
            display: inline-grid;
            place-items: center;
          }
        }
      `}</style>
    </>
  );
}