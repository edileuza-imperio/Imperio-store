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
    const text = label.toLowerCase();
    if (text.includes("dashboard")) return FiHome;
    if (text.includes("painel")) return FiHome;
    if (text.includes("usu")) return FiUsers;
    if (text.includes("banner")) return FiImage;
    if (text.includes("prod")) return FiBox;
    if (text.includes("categ")) return FiTag;
    if (text.includes("catálogo") || text.includes("catalogo")) return FiGrid;
    if (text.includes("gest")) return FiGrid;
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
    } catch (error) {
      console.error("Erro ao carregar sidebar:", error);
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

        if (hit(it.label) || children.length > 0) {
          return { ...it, children };
        }
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
        <div className="top">
          <div className="brand">
            <div className="mark">
              <span className="dot" />
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
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="search">
          <FiSearch className="sicon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no menu..."
          />
        </div>

        <nav className="nav">
          <div className="navTitle">NAVEGAÇÃO</div>

          {loading && <div className="skeleton">Carregando menu...</div>}

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

                    <span className="txt">{item.label}</span>

                    <span className="pill" />
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

                    <span className="txt">{item.label}</span>

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
                          <span className="bullet" />
                          <span className="subico">
                            <IconChild size={16} />
                          </span>
                          <span className="txt">{c.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </nav>

        <div className="footer">
          <div className="mini">
            <div className="miniDot" />
            <div className="miniTxt">
              <strong>Sistema</strong>
              <span>v1.0</span>
            </div>
          </div>
        </div>
      </aside>

      <style jsx>{`
        :global(a) {
          text-decoration: none;
          color: inherit;
        }

        /* overlay (mobile) */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.55);
          border: none;
          display: none;
          z-index: 9998;
        }
        .overlay.show {
          display: block;
        }

        .sidebar {
          width: 292px;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 9999;

          display: flex;
          flex-direction: column;

          background: radial-gradient(
              1200px 600px at 10% 0%,
              rgba(124, 58, 237, 0.25),
              transparent 55%
            ),
            linear-gradient(180deg, #070a12, #060913 55%, #050814);

          border-right: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 22px 0 60px rgba(0, 0, 0, 0.35);

          padding: 16px 14px 14px;
        }

        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .mark {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.35);
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.15);
        }

        .brandText {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1.05;
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
          margin: 2px 0 6px;
          padding-left: 4px;
        }

        .skeleton,
        .empty {
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(148, 163, 184, 0.9);
          font-weight: 800;
          font-size: 12px;
        }

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

          border: 1px solid transparent;
          transition: 0.18s;
          overflow: hidden;
        }

        .item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
          color: #fff;
        }

        .ico {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: grid;
          place-items: center;

          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .txt {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pill {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: transparent;
        }

        .active {
          color: #fff;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.35),
            rgba(168, 85, 247, 0.18)
          );
          border-color: rgba(124, 58, 237, 0.35);
          box-shadow: 0 16px 40px rgba(124, 58, 237, 0.15);
        }

        .active .ico {
          background: rgba(124, 58, 237, 0.25);
          border-color: rgba(124, 58, 237, 0.35);
        }

        .active .pill {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          box-shadow: 0 0 0 7px rgba(124, 58, 237, 0.16);
        }

        /* groups */
        .groupWrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .group {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 11px 12px;
          border-radius: 14px;

          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #fff;

          cursor: pointer;
          font-size: 13px;
          font-weight: 900;

          transition: 0.18s;
        }

        .group:hover {
          background: rgba(255, 255, 255, 0.07);
          transform: translateY(-1px);
        }

        .group.hint {
          border-color: rgba(124, 58, 237, 0.26);
        }

        .group .chev {
          margin-left: auto;
          opacity: 0.9;
          transition: 0.2s;
        }

        .group .chev.rot {
          transform: rotate(180deg);
        }

        .group.opened {
          background: rgba(255, 255, 255, 0.06);
        }

        .submenu {
          display: none;
          flex-direction: column;
          gap: 6px;
          margin-left: 8px;
          padding-left: 10px;
          border-left: 1px dashed rgba(255, 255, 255, 0.12);
        }

        .submenu.show {
          display: flex;
        }

        .subitem {
          display: flex;
          align-items: center;
          gap: 10px;

          padding: 10px 12px;
          border-radius: 14px;

          color: rgba(148, 163, 184, 0.95) !important;
          font-size: 12.5px;
          font-weight: 900;

          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.03);
          transition: 0.18s;
        }

        .subitem:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff !important;
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .subactive {
          color: #fff !important;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.26),
            rgba(168, 85, 247, 0.12)
          );
          border-color: rgba(124, 58, 237, 0.26);
        }

        .bullet {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.65);
        }

        .subactive .bullet {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.14);
        }

        .subico {
          width: 28px;
          height: 28px;
          border-radius: 12px;
          display: grid;
          place-items: center;

          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* footer */
        .footer {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .mini {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .miniDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.14);
        }

        .miniTxt {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
        }

        .miniTxt strong {
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }

        .miniTxt span {
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

        /* mobile behavior */
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