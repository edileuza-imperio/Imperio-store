"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
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
} from "react-icons/fi";

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

  const [items, setItems] = useState<SidebarItem[]>([]);
  const [groups, setGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

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

  async function loadMenu() {
    try {
      setLoading(true);

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
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        const children = (it.children || []).filter(
          (c) => hit(c.label) || hit(c.href)
        );

        if (hit(it.label) || children.length > 0) return { ...it, children };
        return null;
      })
      .filter(Boolean) as SidebarItem[];
  }, [items, q]);

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
        {/* HEADER */}
        <div className="header">
          <div className="brand">
            <div className="logo">
              <span className="logoDot" />
            </div>

            <div className="brandText">
              <strong>Universo Império</strong>
              <span>Painel Administrativo</span>
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

        {/* SEARCH */}
        <div className="search">
          <FiSearch className="sicon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
          />
        </div>

        {/* MENU */}
        <nav className="nav">
          <div className="navTitle">NAVEGAÇÃO</div>

          {loading && (
            <div className="loader">
              <div className="bar" />
              <span>Carregando menu...</span>
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="empty">Nenhum item encontrado.</div>
          )}

          {!loading &&
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
                    <span className="activeMark" />
                  </Link>
                );
              }

              const opened = !!groups[item.label];
              const anyChildActive = item.children?.some((c) => isActive(c.href));

              return (
                <div key={i} className="groupWrap">
                  <button
                    type="button"
                    className={`group ${opened ? "opened" : ""} ${
                      anyChildActive ? "hint" : ""
                    }`}
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
          <div className="status">
            <span className="statusDot" />
            <div className="statusTxt">
              <strong>Online</strong>
              <span>Sistema operacional</span>
            </div>
          </div>
        </div>
      </aside>

      <style jsx>{`
        :global(a) {
          text-decoration: none;
          color: inherit;
        }

        /* ===== Overlay Mobile ===== */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.58);
          border: none;
          display: none;
          z-index: 9998;
        }
        .overlay.show {
          display: block;
        }

        /* ===== Sidebar ===== */
        .sidebar {
          width: 304px;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 9999;

          display: flex;
          flex-direction: column;

          background: linear-gradient(180deg, #0b1020, #070a14);
          border-right: 1px solid rgba(255, 255, 255, 0.06);

          padding: 16px 14px 14px;
        }

        /* subtle background accents */
        .sidebar:before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
              900px 520px at 10% 10%,
              rgba(124, 58, 237, 0.22),
              transparent 55%
            ),
            radial-gradient(
              820px 520px at 90% 18%,
              rgba(14, 165, 233, 0.14),
              transparent 58%
            );
          opacity: 1;
        }

        .sidebar > * {
          position: relative;
          z-index: 1;
        }

        /* ===== Header ===== */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .logo {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
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
          line-height: 1.1;
        }

        .brandText strong {
          font-size: 14px;
          font-weight: 900;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .brandText span {
          font-size: 11px;
          font-weight: 800;
          color: rgba(148, 163, 184, 0.9);
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .closeBtn {
          display: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
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

        /* ===== Search ===== */
        .search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);

          margin-bottom: 14px;
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
          font-weight: 800;
        }

        .search input::placeholder {
          color: rgba(148, 163, 184, 0.85);
          font-weight: 800;
        }

        /* ===== Nav ===== */
        .nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: auto;
          padding-right: 4px;
          flex: 1;
        }

        .navTitle {
          font-size: 11px;
          letter-spacing: 0.08em;
          color: rgba(148, 163, 184, 0.9);
          font-weight: 900;
          margin: 4px 0 6px;
          padding-left: 6px;
        }

        .loader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(148, 163, 184, 0.9);
          font-weight: 800;
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

        .empty {
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(148, 163, 184, 0.9);
          font-weight: 800;
          font-size: 12px;
        }

        /* ===== Link item ===== */
        .item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 14px;

          color: rgba(203, 213, 225, 0.95);
          font-size: 13px;
          font-weight: 900;

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
          width: 36px;
          height: 36px;
          border-radius: 13px;
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

        .activeMark {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: transparent;
        }

        .active {
          color: #fff;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.32),
            rgba(14, 165, 233, 0.14)
          );
          border-color: rgba(124, 58, 237, 0.28);
          box-shadow: 0 18px 40px rgba(124, 58, 237, 0.14);
        }

        .active .ico {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.28);
        }

        .active .activeMark {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          box-shadow: 0 0 0 7px rgba(124, 58, 237, 0.14);
        }

        /* ===== Groups ===== */
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
          border-radius: 14px;

          cursor: pointer;

          color: #fff;
          font-size: 13px;
          font-weight: 900;

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
          margin-left: 10px;
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
          border-radius: 14px;

          color: rgba(148, 163, 184, 0.95) !important;
          font-size: 12.5px;
          font-weight: 900;

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
          width: 30px;
          height: 30px;
          border-radius: 12px;
          display: grid;
          place-items: center;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .subMark {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: transparent;
        }

        .subactive {
          color: #fff !important;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.25),
            rgba(14, 165, 233, 0.12)
          );
          border-color: rgba(124, 58, 237, 0.22);
        }

        .subactive .subMark {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          box-shadow: 0 0 0 7px rgba(124, 58, 237, 0.14);
        }

        /* ===== Footer ===== */
        .footer {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;

          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .statusDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 7px rgba(34, 197, 94, 0.14);
        }

        .statusTxt {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
        }

        .statusTxt strong {
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }

        .statusTxt span {
          color: rgba(148, 163, 184, 0.9);
          font-size: 11px;
          font-weight: 800;
          margin-top: 4px;
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

        /* mobile */
        @media (max-width: 900px) {
          .sidebar {
            position: fixed;
            left: -110%;
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