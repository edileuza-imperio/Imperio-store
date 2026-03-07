"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useEffect, useRef, useState } from "react";
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
  FiHeart,
} from "react-icons/fi";
import { Menu, MenuItem } from "@/components/Bibioteca/Bibiotecas";

export interface Categoria {
  id_categoria?: number;
  nome?: string;
  slug?: string;
  icone?: string;
}

type Props = {
  menus: Menu[];
  categorias?: Categoria[];
  searchPlaceholder?: string;
  tituloNavbar?: string | null;
  subtituloNavbar?: string | null;
};

export default function NavbarDesktop({
  menus,
  categorias,
  searchPlaceholder,
  tituloNavbar,
  subtituloNavbar,
}: Props) {
  const router = useRouter();
  const { usuario, loading: usuarioLoading, logado } = useUsuario();

  const [openUserDropdown, setOpenUserDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  // Paleta de cores profissional para e-commerce
  const ui = useMemo(
    () => ({
      // Rosa Queimado (Dusty Rose/Terracotta)
      rosaBurn: "#B8756B",
      rosaBurnLight: "#D4A5A0",
      rosaBurnDark: "#8B5A52",
      
      // Dourado (Gold)
      gold: "#D4AF37",
      goldLight: "#E8C547",
      goldDark: "#AA8C2C",
      
      // Creme (Cream/Off-white)
      cream: "#F5F1ED",
      creamLight: "#FDFBF9",
      creamDark: "#E8DFD7",
      
      // Neutros
      text: "#2B2B2B",
      textLight: "#5A5A5A",
      textMuted: "#8B8B8B",
      
      // Backgrounds e Borders
      bgPrimary: "#FDFBF9",
      bgSecondary: "#F5F1ED",
      borderColor: "rgba(184, 117, 107, 0.15)",
      borderColorHover: "rgba(212, 175, 160, 0.3)",
      
      // Sombras sofisticadas
      shadowSoft: "0 4px 12px rgba(0, 0, 0, 0.06)",
      shadowMedium: "0 8px 24px rgba(0, 0, 0, 0.08)",
      shadowHover: "0 12px 32px rgba(184, 117, 107, 0.12)",
      
      // Efectos
      accentSoft: "rgba(212, 175, 160, 0.1)",
      accentSoftGold: "rgba(212, 175, 160, 0.08)",
    }),
    []
  );

  // Detectar scroll para efecto de vidrio
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar dropdown al hacer clic fuera + ESC
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

  return (
    <>
      <header
        ref={headerRef as any}
        className={`ui-navbar ${scrolled ? "ui-navbar--scrolled" : ""}`}
      >
        {/* CONTAINER PRINCIPAL */}
        <div className="ui-navbar-container">
          {/* LOGO / BRAND */}
          <div className="ui-brand">
            <div className="ui-title">
              <span className="ui-titleFirst">{first}</span>
              <span className="ui-titleAccent">{rest}</span>
              <span className="ui-dot" />
            </div>
            <div className="ui-subtitle">{subtituloNavbar || "Decorações & Eventos"}</div>
          </div>

          {/* SEARCH BAR - CENTRO */}
          {(searchMenu || searchPlaceholder) && (
            <div className="ui-searchWrap">
              <SearchBar
                placeholder={searchPlaceholder || searchMenu?.pesquisa_placeholder || "Buscar produtos..."}
                className="w-100"
              />
            </div>
          )}

          {/* ACCIONES - DERECHA */}
          <nav className="ui-actions">
            {/* MENUS PRINCIPALES */}
            <div className="ui-mainMenus">
              {mainMenus.map((m) => (
                <Link key={m.id} href={m.rota || "#"} className="ui-link">
                  <span className="ui-pill ui-pill--primary">
                    <span className="ui-pillIcon">{renderIcon(m.icone)}</span>
                    <span className="ui-pillText">{m.titulo}</span>
                  </span>
                </Link>
              ))}
            </div>

            {/* FAVORITOS (Opcional) */}
            <button className="ui-iconBtn ui-iconBtn--heart" title="Mis favoritos">
              <FiHeart size={20} />
              <span className="ui-badge">0</span>
            </button>

            {/* CARRITO (Opcional) */}
            <button className="ui-iconBtn ui-iconBtn--cart" title="Carrito de compras">
              <FiShoppingCart size={20} />
              <span className="ui-badge">0</span>
            </button>

            {/* LOGIN O USUARIO */}
            {!usuarioLoading && !logado && (
              <Link href="/login" className="ui-link">
                <span className="ui-pill ui-pill--secondary">
                  <span className="ui-pillIcon">{renderIcon(accountMenu?.icone || "bi-person")}</span>
                  <span className="ui-pillText">Ingresar</span>
                </span>
              </Link>
            )}

            {!usuarioLoading && logado && (
              <div className="ui-dropdown">
                <button
                  type="button"
                  className="ui-pill ui-pill--secondary ui-userBtn"
                  onClick={() => setOpenUserDropdown((v) => !v)}
                  aria-expanded={openUserDropdown}
                >
                  <span className="ui-pillIcon">
                    <FiUser size={18} />
                  </span>
                  <span className="ui-pillText ui-strong">
                    {usuario?.nome?.split(" ")[0] || "Usuario"}
                  </span>
                  <FiChevronDown
                    size={16}
                    className={`ui-chevIcon ${openUserDropdown ? "open" : ""}`}
                  />
                </button>

                {openUserDropdown && (
                  <div className="ui-menu">
                    {accountItems.map((it) => {
                      const isSair = String(it.titulo).toLowerCase().includes("sair");
                      return (
                        <button
                          key={it.id}
                          type="button"
                          className={`ui-item ${isSair ? "ui-item--danger" : ""}`}
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
        </div>
      </header>

      <style jsx>{`
       
      `}</style>
    </>
  );
}
