"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "../Pesquisa/SearchBar";
import useUsuario from "@/hooks/Auth/useUsuario";
import api from "@/Api/conectar";

import {
  FiMenu,
  FiX,
  FiChevronRight,
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiShoppingCart,
  FiBox,
  FiTag,
  FiHeart,
} from "react-icons/fi";

import { Menu, MenuItem } from "@/components/Bibioteca/Bibiotecas";

interface Categoria {
  id_categoria?: number;
  nome?: string;
  slug?: string;
  icone?: string;
}

interface NavbarMobileProps {
  menus: Menu[];
  categorias: Categoria[];
  searchPlaceholder?: string;
  tituloNavbar?: string | null;
  subtituloNavbar?: string | null;
}

export default function NavbarMobile({
  menus,
  categorias,
  searchPlaceholder,
  tituloNavbar,
  subtituloNavbar,
}: NavbarMobileProps) {
  const router = useRouter();
  const { usuario, loading, logado } = useUsuario();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const searchMenu = menus?.find((m) => m.pesquisa_placeholder) || null;
  const accountMenu =
    menus?.find((m) => (m.titulo || "").toLowerCase() === "login") || null;

  // Encontrar el item del carrito
  const carrinhoItem = menus.find((m) =>
    (m.titulo || "").toLowerCase().includes("carrinho")
  ) || null;

  const accountItems = useMemo(() => {
    const itens = accountMenu?.itens || [];
    return [...itens].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0));
  }, [accountMenu]);

  const titleParts = (tituloNavbar || "Universo Império").split(" ");
  const first = titleParts[0] || "Universo";
  const rest = titleParts.slice(1).join(" ") || "Império";

  const closeAll = () => {
    setSidebarOpen(false);
    setUserDropdownOpen(false);
  };

  const renderIcon = (bi?: string) => {
    const name = (bi || "").toLowerCase();
    if (name.includes("bi-box-arrow-right")) return <FiLogOut size={18} />;
    if (name.includes("bi-tags")) return <FiTag size={18} />;
    if (name.includes("bi-cart")) return <FiShoppingCart size={18} />;
    if (name.includes("bi-person")) return <FiUser size={18} />;
    return <FiBox size={18} />;
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout", {}, { withCredentials: true });
    } catch (error) {
      console.warn("Logout falhou, seguindo o fluxo.", error);
    } finally {
      closeAll();
      router.replace("/login");
      router.refresh();
    }
  };

  const handleAccountItem = async (item: MenuItem) => {
    setUserDropdownOpen(false);
    setSidebarOpen(false);

    const titulo = (item.titulo || "").toLowerCase();

    if (titulo.includes("sair")) {
      await handleLogout();
      return;
    }

    if (item.rota) {
      router.push(item.rota);
    }
  };

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userDropdownOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userDropdownOpen]);

  // Calcular ancho del sidebar
  useEffect(() => {
    const getSidebarWidth = () => {
      if (typeof window === "undefined") return 320;
      const w = window.innerWidth;
      if (w <= 360) return Math.min(300, Math.floor(w * 0.92));
      if (w <= 480) return Math.min(340, Math.floor(w * 0.9));
      return 360;
    };
    const sync = () => setSidebarWidth(getSidebarWidth());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <>
      {/* HEADER MOBILE */}
      <header className={`mobile-header ${scrolled ? "mobile-header--scrolled" : ""}`}>
        {/* TOPO */}
        <div className="mobile-topBar">
          {/* BOTÓN MENU */}
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(true);
              setUserDropdownOpen(false);
            }}
            aria-label="Abrir menu"
            className="mobile-btn"
          >
            <FiMenu size={22} />
          </button>

          {/* LOGO */}
          <Link href="/" onClick={closeAll} className="mobile-logo">
            <div className="mobile-logoTitle">
              {first} <span className="mobile-logoAccent">{rest}</span>
            </div>
            <div className="mobile-logoSubtitle">
              {subtituloNavbar || "Decorações & Eventos"}
            </div>
          </Link>

          {/* AÇÕES DIREITA */}
          <div className="mobile-actions" ref={dropdownRef}>
            {/* FAVORITOS */}
            <button className="mobile-btn mobile-btn-badge" title="Mis favoritos">
              <FiHeart size={20} />
              <span className="mobile-badge">0</span>
            </button>

            {/* CARRITO - UNIFICADO */}
            {carrinhoItem ? (
              <Link
                href={carrinhoItem.rota || "/carrito"}
                onClick={closeAll}
                className="mobile-btn mobile-btn-badge"
              >
                <FiShoppingCart size={20} />
                <span className="mobile-badge">0</span>
              </Link>
            ) : (
              <Link href="/carrito" onClick={closeAll} className="mobile-btn mobile-btn-badge">
                <FiShoppingCart size={20} />
                <span className="mobile-badge">0</span>
              </Link>
            )}

            {/* LOGIN O USUARIO */}
            {!loading && !logado && (
              <Link href="/login" onClick={closeAll} className="mobile-btn">
                <FiUser size={20} />
              </Link>
            )}

            {!loading && logado && (
              <div className="mobile-dropdown">
                <button
                  type="button"
                  className="mobile-dropdownBtn"
                  onClick={() => setUserDropdownOpen((v) => !v)}
                >
                  <FiUser size={16} />
                  <span>{usuario?.nome?.split(" ")[0] || "Usuario"}</span>
                  <FiChevronDown
                    className={`mobile-dropdownChevron ${userDropdownOpen ? "open" : ""}`}
                  />
                </button>

                {userDropdownOpen && (
                  <div className="mobile-dropdownMenu">
                    {accountItems.map((it) => {
                      const isSair = String(it.titulo).toLowerCase().includes("sair");
                      return (
                        <button
                          key={it.id}
                          type="button"
                          className={`mobile-dropdownItem ${isSair ? "mobile-dropdownItem--danger" : ""}`}
                          onClick={() => handleAccountItem(it)}
                        >
                          {renderIcon(it.icone)}
                          <span>{it.titulo}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SEARCH BAR */}
        {(searchMenu || searchPlaceholder) && (
          <div className="mobile-searchWrap">
            <SearchBar
              placeholder={searchPlaceholder || searchMenu?.pesquisa_placeholder || "Buscar produtos..."}
              className="w-100"
            />
          </div>
        )}
      </header>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="mobile-sidebarOverlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR - SOLO CATEGORÍAS */}
      <aside
        className="mobile-sidebar"
        style={{
          width: `${sidebarWidth}px`,
          transform: sidebarOpen ? "translateX(0)" : `translateX(-${sidebarWidth}px)`,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="mobile-sidebarHeader">
          <h2 className="mobile-sidebarTitle">Categorías</h2>
          <button type="button" onClick={() => setSidebarOpen(false)} className="mobile-sidebarCloseBtn">
            <FiX size={20} />
          </button>
        </div>

        <div className="mobile-sidebarContent">
          {/* CATEGORÍAS */}
          {categorias && categorias.length > 0 && (
            <nav>
              {categorias.map((cat) => (
                <Link
                  key={cat.id_categoria}
                  href={`/categoria/${cat.slug}`}
                  onClick={closeAll}
                  className="mobile-categoryItem"
                >
                  <span className="mobile-categoryItemIcon">{renderIcon(cat.icone)}</span>
                  <span>{cat.nome}</span>
                  <FiChevronRight size={16} style={{ marginLeft: "auto" }} />
                </Link>
              ))}
            </nav>
          )}

          {(!categorias || categorias.length === 0) && (
            <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--color-textMuted)" }}>
              No hay categorías disponibles
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
