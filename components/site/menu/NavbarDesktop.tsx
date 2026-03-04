'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import SearchBar from "../Pesquisa/SearchBar";
import useUsuario from "@/hooks/Auth/useUsuario";
import api from "@/Api/conectar";

import {
  FiBox,
  FiShoppingCart,
  FiUser,
  FiUserCheck,
  FiClipboard,
  FiActivity,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";
import { rotas } from "@/components/Bibioteca/config/rotas";

interface MenuItem {
  id?: number;
  titulo: string;
  rota?: string | null;
  icone?: string;
  posicao?: number;
  permissoes?: string[];
}

interface Menu {
  id?: number;
  titulo: string;
  icone?: string;
  rota?: string | null;
  pesquisa_placeholder?: string | null;
  permissoes?: string[];
  itens?: MenuItem[];
}

export default function NavbarDesktop() {
  const router = useRouter();
  const { usuario, loading: usuarioLoading, logado } = useUsuario();

  const [menus, setMenus] = useState<Menu[]>([]);
  const [tituloNavbar, setTituloNavbar] = useState<string | null>(null);
  const [subtituloNavbar, setSubtituloNavbar] = useState<string | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(true);

  const [openUserDropdown, setOpenUserDropdown] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const ui = useMemo(() => ({
    accent: "#D6A24A",                // dourado
    accentSoft: "rgba(214, 162, 74, 0.18)",
    text: "#2b2b2b",
    muted: "#6c757d",
    bg: "#f4efe8",
    borderSoft: "rgba(43, 43, 43, 0.07)",
    hoverBg: "#fdf4f2",
    shadowSoft: "0 8px 30px rgba(0,0,0,0.08)",
  }), []);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const { data } = await api.get(rotas.inicio.navbar);
        if (data?.dados) {
          setMenus(data.dados.menus || []);
          setTituloNavbar(data.dados.titulo || null);
          setSubtituloNavbar(data.dados.subtitulo || null);
        }
      } catch (e) {
        console.error("Erro ao carregar menus:", e);
      } finally {
        setLoadingMenus(false);
      }
    };
    fetchMenus();
  }, []);

  // Fecha dropdown ao clicar fora + ESC
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current) return;
      if (!headerRef.current.contains(e.target as Node)) setOpenUserDropdown(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenUserDropdown(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const titleParts = (tituloNavbar || "Universo Império").split(" ");
  const first = titleParts[0] || "Universo";
  const rest = titleParts.slice(1).join(" ") || "Império";

  const searchMenu = menus.find((m) => m.pesquisa_placeholder);
  const accountMenu = menus.find((m) => (m.titulo || "").toLowerCase() === "login");
  const mainMenus = menus.filter(
    (m) => !m.pesquisa_placeholder && (m.titulo || "").toLowerCase() !== "login"
  );

  const accountItems = useMemo(() => {
    const itens = accountMenu?.itens || [];
    return [...itens].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0));
  }, [accountMenu]);

  const renderIcon = (bi?: string) => {
    const name = (bi || "").toLowerCase();
    if (name.includes("bi-box-arrow-right")) return <FiLogOut size={18} />;
    if (name.includes("bi-speedometer")) return <FiActivity size={18} />;
    if (name.includes("bi-card-checklist")) return <FiClipboard size={18} />;
    if (name.includes("bi-person-circle")) return <FiUserCheck size={18} />;
    if (name.includes("bi-cart")) return <FiShoppingCart size={18} />;
    if (name.includes("bi-person")) return <FiUser size={18} />;
    if (name.includes("bi-box")) return <FiBox size={18} />;
    return <FiBox size={18} />;
  };

  const handleAccountItem = async (item: MenuItem) => {
    setOpenUserDropdown(false);

    const titulo = (item.titulo || "").toLowerCase();
    if (titulo.includes("sair")) {
      try {
        await api.post("/logout");
      } catch (e) {
        console.error(e);
      } finally {
        router.replace("/login");
        router.refresh();
      }
      return;
    }

    if (item.rota) router.push(item.rota);
  };

  if (loadingMenus) return null;

  return (
    <>
      <header
        ref={headerRef as any}
        className="ui-navbar d-none d-lg-flex align-items-center justify-content-between px-5"
      >
        {/* LOGO */}
        <div className="ui-brand">
          <div className="ui-title">
            <span className="ui-titleFirst">{first} </span>
            <span className="ui-titleAccent">{rest}</span>
            <span className="ui-dot" />
          </div>
          <div className="ui-subtitle">{subtituloNavbar || "Decorações & Eventos"}</div>
        </div>

        {/* ✅ SEARCH: agora só 1 (a do SearchBar) */}
        {searchMenu && (
          <div className="ui-searchWrap">
            <SearchBar
              placeholder={searchMenu.pesquisa_placeholder || "Buscar produtos"}
              className="w-100"
            />
          </div>
        )}

        {/* MENUS */}
        <nav className="ui-actions">
          {mainMenus.map((m) => (
            <Link key={m.id} href={m.rota || "#"} className="ui-link">
              <span className="ui-pill">
                <span className="ui-pillIcon">{renderIcon(m.icone)}</span>
                <span className="ui-pillText">{m.titulo}</span>
              </span>
            </Link>
          ))}

          {!usuarioLoading && !logado && (
            <Link href="/login" className="ui-link">
              <span className="ui-pill ui-pillSoft">
                <span className="ui-pillIcon">{renderIcon(accountMenu?.icone || "bi-person")}</span>
                <span className="ui-pillText">Login</span>
              </span>
            </Link>
          )}

          {!usuarioLoading && logado && (
            <div className="ui-dropdown">
              <button
                type="button"
                className="ui-pill ui-pillSoft ui-userBtn"
                onClick={() => setOpenUserDropdown((v) => !v)}
                aria-expanded={openUserDropdown}
              >
                <span className="ui-pillIcon"><FiUser size={18} /></span>
                <span className="ui-pillText ui-strong">Olá, {usuario?.nome}</span>
                <FiChevronDown size={16} className={`ui-chevIcon ${openUserDropdown ? "open" : ""}`} />
              </button>

              {openUserDropdown && (
                <div className="ui-menu">
                  {accountItems.map((it) => {
                    const isSair = String(it.titulo).toLowerCase().includes("sair");
                    return (
                      <button
                        key={it.id}
                        type="button"
                        className={`ui-item ${isSair ? "ui-itemDanger" : ""}`}
                        onClick={() => handleAccountItem(it)}
                      >
                        <span className="ui-itemIcon">{renderIcon(it.icone)}</span>
                        <span className="ui-itemText">{it.titulo}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      <style jsx>{`
        .ui-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          height: 86px;
          width: 100%;
          background: ${ui.bg};
          box-shadow: ${ui.shadowSoft};
          gap: 18px;
          border-bottom: 1px solid ${ui.borderSoft};
        }

        .ui-brand {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
          min-width: 240px;
        }

        .ui-title {
          display: flex;
          align-items: baseline;
          gap: 8px;
          font-size: 23px;
          font-weight: 950;
          letter-spacing: -0.4px;
        }

        .ui-titleFirst { color: ${ui.text}; }

        .ui-titleAccent {
          color: ${ui.accent};
          font-style: italic;
        }

        .ui-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: ${ui.accent};
          opacity: 0.65;
          display: inline-block;
          transform: translateY(-4px);
        }

        .ui-subtitle {
          font-size: 13px;
          color: ${ui.muted};
          font-weight: 650;
          margin-top: 2px;
        }

        /* ✅ só controla tamanho/posição da SearchBar */
        .ui-searchWrap {
          flex: 1;
          max-width: 520px; /* menor */
          margin: 0 24px;
        }

        .ui-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ui-link { text-decoration: none; }

        .ui-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid ${ui.borderSoft};
          background: #fff;
          font-size: 14px;
          font-weight: 750;
          color: ${ui.text};
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease,
            box-shadow 0.15s ease, border-color 0.15s ease;
          user-select: none;
        }

        .ui-pill:hover {
          background: ${ui.hoverBg};
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(0,0,0,0.06);
          border-color: rgba(43, 43, 43, 0.12);
        }

        .ui-pillSoft {
          background: #fff8ef;
          border-color: rgba(214, 162, 74, 0.25);
        }

        .ui-pillIcon { display: inline-flex; color: ${ui.accent}; }
        .ui-pillText { line-height: 1; }
        .ui-strong { font-weight: 900; }

        .ui-dropdown { position: relative; }
        .ui-userBtn { border: 1px solid rgba(214, 162, 74, 0.25); }

        .ui-chevIcon { opacity: 0.8; transition: transform 0.15s ease; }
        .ui-chevIcon.open { transform: rotate(180deg); }

        .ui-menu {
          position: absolute;
          top: 118%;
          right: 0;
          min-width: 270px;
          background: #fff;
          border: 1px solid ${ui.borderSoft};
          border-radius: 16px;
          box-shadow: ${ui.shadowSoft};
          padding: 10px;
          z-index: 99;
          overflow: hidden;
        }

        .ui-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          font-weight: 750;
          color: ${ui.text};
          transition: background 0.15s ease;
        }

        .ui-item:hover { background: ${ui.hoverBg}; }
        .ui-itemIcon { display: inline-flex; color: ${ui.accent}; }
        .ui-itemDanger { color: ${ui.accent}; font-weight: 900; }
      `}</style>
    </>
  );
}