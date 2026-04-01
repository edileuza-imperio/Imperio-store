"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useEffect, useRef, useState } from "react";
import SearchBar from "../Pesquisa/SearchBar";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

import {
  FiBox,
  FiUser,
  FiUserCheck,
  FiClipboard,
  FiActivity,
  FiLogOut,
  FiChevronDown,
  FiShoppingCart,
} from "react-icons/fi";
import { Menu, MenuItem } from "@/components/Bibioteca/Bibiotecas";
import useUsuario from "@/hooks/Auth/useUsuario";
import CarrinhoQuantidade from "@/components/Carrinho/CarrinhoQuantidade";

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

  const {
    usuario,
    loading: usuarioLoading,
    logado,
    isAdmin,
  } = useUsuario();

  const [openUserDropdown, setOpenUserDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current) return;

      if (!headerRef.current.contains(e.target as Node)) {
        setOpenUserDropdown(false);
        setOpenMenuId(null);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenUserDropdown(false);
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const irParaLogin = () => {
    setOpenUserDropdown(false);
    setOpenMenuId(null);
    router.push(rotas.paginas.login);
  };

  const handleProtectedDropdown = (menuId: number) => {
    if (usuarioLoading) return;

    if (!logado) {
      irParaLogin();
      return;
    }

    setOpenMenuId((prev) => (prev === menuId ? null : menuId));
  };

  const titleParts = (tituloNavbar || "Universo Império").split(" ");
  const first = titleParts[0] || "Universo";
  const rest = titleParts.slice(1).join(" ") || "Império";

  const getMenuNome = (menu?: Partial<Menu>) =>
    String(menu?.nome || menu?.titulo || "").trim();

  const getMenuId = (menu?: Partial<Menu>) =>
    Number(menu?.id_menu || menu?.id || 0);

  const getItemNome = (item?: Partial<MenuItem>) =>
    String(item?.nome || item?.titulo || "").trim();

  const getItemId = (item?: Partial<MenuItem>) =>
    Number(item?.id_item || item?.id || 0);

  const getMenuRota = (menu?: Partial<Menu>) => {
    const rota = String(menu?.rota || "").trim();
    if (!rota || rota === "0") return "#";
    return rota;
  };

  const getItemRota = (item?: Partial<MenuItem>) => {
    const rota = String(item?.rota || "").trim();
    if (!rota || rota === "0") return "#";
    return rota;
  };

  const isPainelAdministrativo = (item?: Partial<MenuItem>) => {
    const nome = String(item?.nome || item?.titulo || "")
      .trim()
      .toLowerCase();

    return nome.includes("painel administrativo");
  };

  const isCartIcon = (icone?: string | null) => {
    const name = String(icone || "").toLowerCase();
    return (
      name.includes("bi-cart") ||
      name.includes("cart") ||
      name.includes("carrito") ||
      name.includes("carrinho")
    );
  };

  const searchMenu = menus.find((m) => m.pesquisa_placeholder);

  const accountMenu = menus.find(
    (m) => getMenuNome(m).toLowerCase() === "login"
  );

  const mainMenus = menus.filter((m) => {
    if (m.pesquisa_placeholder) return false;

    const nome = getMenuNome(m).toLowerCase();

    if (nome === "login" && logado) return false;

    return true;
  });

  const accountItems = useMemo(() => {
    const itens = accountMenu?.itens || [];

    const itensFiltrados = itens.filter((item) => {
      if (isPainelAdministrativo(item)) {
        return isAdmin;
      }

      return true;
    });

    return [...itensFiltrados].sort(
      (a, b) => (a.posicao ?? 0) - (b.posicao ?? 0)
    );
  }, [accountMenu, isAdmin]);

  const renderIcon = (bi?: string | null) => {
    const name = (bi || "").toLowerCase();

    if (name.includes("bi-box-arrow-right")) return <FiLogOut size={18} />;
    if (name.includes("bi-speedometer")) return <FiActivity size={18} />;
    if (name.includes("bi-card-checklist")) return <FiClipboard size={18} />;
    if (name.includes("bi-person-circle")) return <FiUserCheck size={18} />;
    if (name.includes("bi-cart") || name.includes("carrito")) {
      return <FiShoppingCart size={18} />;
    }
    if (name.includes("bi-person") || name.includes("login")) {
      return <FiUser size={18} />;
    }
    if (name.includes("bi-box")) return <FiBox size={18} />;

    return <FiBox size={18} />;
  };

  const renderMenuIcon = (icone?: string | null) => {
    if (isCartIcon(icone)) {
      return <CarrinhoQuantidade size={18} />;
    }

    return renderIcon(icone);
  };

  const handleAccountItem = async (item: MenuItem) => {
    setOpenUserDropdown(false);
    setOpenMenuId(null);

    if (!logado) {
      irParaLogin();
      return;
    }

    if (isPainelAdministrativo(item) && !isAdmin) {
      return;
    }

    const titulo = String(item.titulo || item.nome || "").toLowerCase();

    if (titulo.includes("sair")) {
      try {
        await api.post(rotas.auth.logout, {}, { withCredentials: true });
      } catch (e) {
        console.error(e);
      } finally {
        router.replace(rotas.paginas.login);
        router.refresh();
      }
      return;
    }

    if (item.rota) {
      router.push(item.rota);
    }
  };

  return (
    <header
      ref={headerRef as any}
      className={`ui-navbar ${scrolled ? "ui-navbar--scrolled" : ""}`}
    >
      <div className="ui-navbar-container">
        <div className="ui-brand">
          <div className="ui-title">
            <span className="ui-titleFirst">{first}</span>
            <span className="ui-titleAccent">{rest}</span>
            <span className="ui-dot" />
          </div>

          <div className="ui-subtitle">
            {subtituloNavbar || "Decorações & Eventos"}
          </div>
        </div>

        {(searchMenu || searchPlaceholder) && (
          <div className="ui-searchWrap">
            <SearchBar
              placeholder={
                searchPlaceholder ||
                searchMenu?.pesquisa_placeholder ||
                "Buscar produtos..."
              }
              className="w-100"
            />
          </div>
        )}

        <nav className="ui-actions">
          <div className="ui-mainMenus">
            {mainMenus.map((m) => {
              const menuId = getMenuId(m);
              const itens = [...(m.itens || [])].sort(
                (a, b) => (a.posicao ?? 0) - (b.posicao ?? 0)
              );
              const hasItens = itens.length > 0;
              const isOpen = openMenuId === menuId;

              if (hasItens) {
                return (
                  <div key={menuId} className="ui-dropdown">
                    <button
                      type="button"
                      className="ui-pill ui-pill--primary ui-userBtn"
                      onClick={() => handleProtectedDropdown(menuId)}
                    >
                      <span className="ui-pillIcon">{renderMenuIcon(m.icone)}</span>
                      <span className="ui-pillText">{getMenuNome(m)}</span>
                      <FiChevronDown
                        size={16}
                        className={`ui-chevIcon ${isOpen ? "open" : ""}`}
                      />
                    </button>

                    {logado && isOpen && (
                      <div className="ui-menu">
                        {itens.map((it) => (
                          <button
                            key={getItemId(it)}
                            type="button"
                            className="ui-item"
                            onClick={() => handleAccountItem(it)}
                          >
                            <span className="ui-itemIcon">
                              {renderMenuIcon(it.icone)}
                            </span>
                            <span className="ui-itemText">
                              {getItemNome(it)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const rota = getMenuRota(m);
              const nomeMenu = getMenuNome(m).toLowerCase();
              const isLoginMenu = nomeMenu === "login";

              if (isLoginMenu && !logado) {
                return (
                  <button
                    key={menuId}
                    type="button"
                    className="ui-link"
                    onClick={irParaLogin}
                  >
                    <span className="ui-pill ui-pill--primary">
                      <span className="ui-pillIcon">{renderMenuIcon(m.icone)}</span>
                      <span className="ui-pillText">{getMenuNome(m)}</span>
                    </span>
                  </button>
                );
              }

              return (
                <Link key={menuId} href={rota} className="ui-link">
                  <span className="ui-pill ui-pill--primary">
                    <span className="ui-pillIcon">{renderMenuIcon(m.icone)}</span>
                    <span className="ui-pillText">{getMenuNome(m)}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          {!usuarioLoading && logado && accountItems.length > 0 && (
            <div className="ui-dropdown">
              <button
                type="button"
                className="ui-pill ui-pill--secondary ui-userBtn"
                onClick={() => {
                  if (!logado) {
                    irParaLogin();
                    return;
                  }
                  setOpenUserDropdown((v) => !v);
                }}
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
                    const texto = String(it.titulo || it.nome || "");
                    const isSair = texto.toLowerCase().includes("sair");

                    return (
                      <button
                        key={String(it.id || it.id_item || it.id_menu)}
                        type="button"
                        className={`ui-item ${isSair ? "ui-item--danger" : ""}`}
                        onClick={() => handleAccountItem(it)}
                      >
                        <span className="ui-itemIcon">
                          {renderMenuIcon(it.icone)}
                        </span>
                        <span className="ui-itemText">{texto}</span>
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
  );
}