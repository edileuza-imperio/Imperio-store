"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import type { IconType } from "react-icons";
import {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
  FiMenu,
  FiHome,
  FiShoppingBag,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiHeart,
  FiPackage,
  FiUserPlus,
  FiLock,
  FiGrid,
  FiEdit,
  FiList,
  FiCreditCard,
  FiMapPin,
  FiTruck,
} from "react-icons/fi";
import {
  BiUserCircle,
  BiLogOut,
  BiShoppingBag,
  BiHome,
  BiCategory,
  BiStore,
} from "react-icons/bi";

import CarrinhoSidebar from "@/components/site/carrinho/CarrinhoSidebar";
import { Menu, Usuario } from "@/components/site/menu/menu";
import "./../../../styles/navbar/menu.css";

type Props = {
  scrolled: boolean;
  titulo1: string;
  titulo2: string;
  subtitulo: string;
  pesquisa: string;
  setPesquisa: (v: string) => void;
  usuario: Usuario | null;
  dropdown: boolean;
  setDropdown: (v: boolean) => void;
  login: Menu | null;
  carrinho: Menu | null;
  quantidadeCarrinho: number;
  logout: () => void;
};

type FloatingStyle = {
  top: number;
  left: number;
  width: number;
  arrowLeft: number;
};

const ICONS: Record<string, IconType> = {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
  FiMenu,
  FiHome,
  FiShoppingBag,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiHeart,
  FiPackage,
  FiUserPlus,
  FiLock,
  FiGrid,
  FiEdit,
  FiList,
  FiCreditCard,
  FiMapPin,
  FiTruck,
  BiUserCircle,
  BiLogOut,
  BiShoppingBag,
  BiHome,
  BiCategory,
  BiStore,
};

function getIcon(name?: string | null, size = 16) {
  const iconName = (name ?? "").trim();
  if (!iconName) return null;

  const Icon = ICONS[iconName];
  if (!Icon) return null;

  return <Icon size={size} aria-hidden="true" focusable="false" />;
}

function corrigirRota(rota?: string | null, fallback = "#") {
  const valor = (rota || fallback).trim();

  if (valor === "/carrinho") return "/Carrinho";
  if (valor === "/pedidos") return "/pedido";
  if (valor === "/Pedido") return "/pedido";

  return valor;
}

export default function NavbarHeader({
  scrolled,
  titulo1,
  titulo2,
  subtitulo,
  pesquisa,
  setPesquisa,
  usuario,
  dropdown,
  setDropdown,
  login,
  carrinho,
  quantidadeCarrinho,
  logout,
}: Props) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [floatingStyle, setFloatingStyle] = useState<FloatingStyle | null>(null);

  const desktopUserBtnRef = useRef<HTMLButtonElement | null>(null);
  const mobileUserBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const safePesquisa = (pesquisa ?? "").trim();

  const loginItems = useMemo(() => {
    return Array.isArray(login?.itens)
      ? [...login.itens].sort((a, b) => a.posicao - b.posicao)
      : [];
  }, [login]);

  const menuItems = [
    {
      label: "Início",
      href: "/",
      icon: <FiHome size={18} />,
    },
    {
      label: "Pedidos",
      href: "/pedido",
      icon: <FiShoppingBag size={18} />,
    },
    {
      label: "Ajuda",
      href: "/contato",
      icon: <FiHelpCircle size={18} />,
    },
    {
      label: "Carrinho",
      href: "#",
      icon: <FiShoppingCart size={18} />,
      badge: quantidadeCarrinho > 0 ? quantidadeCarrinho : 0,
      action: "cart",
    },
  ];

  function closeMenu() {
    setOpenMenu(false);
  }

  function openSidebar() {
    setDropdown(false);
    setOpenCart(false);
    setOpenMenu(true);
  }

  function abrirCarrinhoLateral() {
    setDropdown(false);
    setOpenMenu(false);
    setOpenCart(true);
  }

  function fecharCarrinhoLateral() {
    setOpenCart(false);
  }

  function toggleUserDropdown() {
    setOpenMenu(false);
    setOpenCart(false);
    setDropdown(!dropdown);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menuLock", openMenu || openCart);

    return () => {
      document.body.classList.remove("menuLock");
    };
  }, [openMenu, openCart]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(false);
        setOpenCart(false);
        setDropdown(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setDropdown]);

  useLayoutEffect(() => {
    if (!dropdown) return;

    const updatePosition = () => {
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth <= 991;

      const btn = isMobile
        ? mobileUserBtnRef.current
        : desktopUserBtnRef.current;

      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const menuWidth = isMobile ? 220 : 240;
      const gap = isMobile ? 10 : 6;
      const margin = 12;

      let left = rect.right - menuWidth;

      left = Math.max(
        margin,
        Math.min(left, viewportWidth - menuWidth - margin)
      );

      const buttonCenter = rect.left + rect.width / 2;

      const arrowLeft = Math.max(
        18,
        Math.min(buttonCenter - left - 6, menuWidth - 30)
      );

      setFloatingStyle({
        top: rect.bottom + gap,
        left,
        width: menuWidth,
        arrowLeft,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [dropdown]);

  useEffect(() => {
    if (!dropdown) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (desktopUserBtnRef.current?.contains(target)) return;
      if (mobileUserBtnRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;

      setDropdown(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [dropdown, setDropdown]);

  const renderDropdownMenu = () => {
    if (!dropdown || !mounted || !floatingStyle) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        className="floatingDropdown"
        role="menu"
        style={{
          position: "fixed",
          top: floatingStyle.top,
          left: floatingStyle.left,
          width: floatingStyle.width,
          zIndex: 13000,
          ["--dropdown-arrow-left" as any]: `${floatingStyle.arrowLeft}px`,
        }}
      >
        <div className="floatingDropdownArrow" aria-hidden="true" />

        {loginItems.length === 0 && (
          <span className="floatingDropdownEmpty">
            Nenhuma opção disponível
          </span>
        )}

        {loginItems.map((item) => {
          const nome = (item.nome ?? "").toLowerCase().trim();
          const sair = nome === "sair";

          if (sair) {
            return (
              <button
                key={item.id_item}
                onClick={() => {
                  setDropdown(false);
                  logout();
                }}
                className="floatingDropdownItem danger"
                type="button"
                role="menuitem"
              >
                {getIcon(item.icone, 16)}
                <span>{item.nome ?? "Sair"}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id_item}
              href={corrigirRota(item.rota, "#")}
              className="floatingDropdownItem"
              onClick={() => setDropdown(false)}
              role="menuitem"
            >
              {getIcon(item.icone, 16)}
              <span>{item.nome ?? "Item"}</span>
            </Link>
          );
        })}
      </div>,
      document.body
    );
  };

  return (
    <>
      <header className={`header ${scrolled ? "headerScrolled" : ""}`}>
        <div className="desktopNavbar">
          <div className="brand">
            <Link href="/" className="logo" aria-label="Ir para a página inicial">
              <span className="logoDark">{titulo1 || "Universo"}</span>
              <span className="logoPink">{titulo2 || "Império"}</span>
            </Link>

            <span className="subtitle">{subtitulo || ""}</span>
          </div>

          <div className="searchWrapper">
            <div className="searchBar">
              <FiSearch size={18} />

              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Buscar produtos..."
                aria-label="Buscar produtos"
              />

              {safePesquisa !== "" && (
                <button
                  type="button"
                  className="clearBtn"
                  onClick={() => setPesquisa("")}
                  aria-label="Limpar busca"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="right">
            {usuario ? (
              <div className="userDropdown">
                <button
                  ref={desktopUserBtnRef}
                  className="userBtn"
                  onClick={toggleUserDropdown}
                  type="button"
                >
                  <div className="userAvatar">
                    {(usuario?.nome ?? "?").charAt(0)?.toUpperCase()}
                  </div>

                  <div className="userInfo">
                    <span>Olá,</span>
                    <strong>{usuario?.nome ?? "Usuário"}</strong>
                  </div>
                </button>
              </div>
            ) : (
              login && (
                <Link href={corrigirRota(login.rota, "#")} className="iconBtn">
                  <FiUser size={18} />
                  <span>Entrar</span>
                </Link>
              )
            )}

            {carrinho && (
              <button
                type="button"
                className="cartButton"
                onClick={abrirCarrinhoLateral}
                aria-label="Abrir carrinho"
              >
                <div className="cartWrapper">
                  <FiShoppingCart size={21} />

                  {quantidadeCarrinho > 0 && (
                    <span className="badge">{quantidadeCarrinho}</span>
                  )}
                </div>

                <div className="cartInfo">
                  <span className="cartLabel">Meu</span>
                  <span className="cartTotal">Carrinho</span>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="mobileNavbar">
          <button
            className="hamburger"
            onClick={openSidebar}
            type="button"
            aria-label="Abrir menu"
          >
            <FiMenu size={22} />
          </button>

          <div className="mobileBrand">
            <Link href="/" className="mobileLogo">
              <span className="logoDark">{titulo1 || "Universo"}</span>
              <span className="logoPink">{titulo2 || "Império"}</span>
            </Link>

            <span className="mobileSubtitle">{subtitulo || ""}</span>
          </div>

          <div className="mobileRight">
            {usuario ? (
              <div className="mobileUserDropdown">
                <button
                  ref={mobileUserBtnRef}
                  className="mobileUserBtn"
                  onClick={toggleUserDropdown}
                  type="button"
                >
                  <div className="mobileAvatar">
                    {(usuario?.nome ?? "?").charAt(0)?.toUpperCase()}
                  </div>

                  <span className="mobileUserName">
                    {usuario?.nome ?? "Usuário"}
                  </span>
                </button>
              </div>
            ) : (
              login && (
                <Link href={corrigirRota(login.rota, "#")} className="mobileBtn">
                  <FiUser size={17} />
                </Link>
              )
            )}

            {carrinho && (
              <button
                type="button"
                className="mobileCartBtn"
                onClick={abrirCarrinhoLateral}
                aria-label="Abrir carrinho"
              >
                <div className="cartWrapper">
                  <FiShoppingCart size={18} />

                  {quantidadeCarrinho > 0 && (
                    <span className="badge">{quantidadeCarrinho}</span>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="mobileSearch">
          <div className="searchBar">
            <FiSearch size={16} />

            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Buscar produtos..."
              aria-label="Buscar produtos"
            />

            {safePesquisa !== "" && (
              <button
                type="button"
                className="clearBtn"
                onClick={() => setPesquisa("")}
                aria-label="Limpar busca"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div
        className={`overlay ${openMenu ? "overlayShow" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside
        id="mobileSidebar"
        className={`sidebar ${openMenu ? "sidebarOpen" : ""}`}
        aria-label="Menu lateral"
        aria-hidden={!openMenu}
      >
        <div className="sidebarHeader">
          <div>
            <h2>Menu</h2>
            <span className="sidebarSubtitle">Acesse tudo em um só lugar</span>
          </div>

          <button className="closeBtn" onClick={closeMenu} type="button">
            <FiX size={22} />
          </button>
        </div>

        <div className="sidebarContent">
          {usuario ? (
            <div className="sidebarUserCard">
              <div className="sidebarAvatarLarge">
                {(usuario?.nome ?? "?").charAt(0)?.toUpperCase()}
              </div>

              <div className="sidebarUserData">
                <strong>{usuario?.nome ?? "Usuário"}</strong>
                <span>{usuario?.email ?? ""}</span>
              </div>
            </div>
          ) : (
            <div className="sidebarGuestCard">
              <div className="sidebarGuestIcon">
                <FiUser size={20} />
              </div>

              <div className="sidebarUserData">
                <strong>Bem-vindo</strong>
                <span>Entre para ver seus pedidos e favoritos</span>
              </div>
            </div>
          )}

          <div className="quickSection">
            <div className="sectionTitle">Atalhos rápidos</div>

            <div className="quickGrid">
              {menuItems.map((item) => {
                if (item.action === "cart") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="quickAction"
                      onClick={abrirCarrinhoLateral}
                    >
                      <span className="quickActionIcon">{item.icon}</span>
                      <span className="quickActionLabel">{item.label}</span>

                      {item.badge && item.badge > 0 && (
                        <span className="quickBadge">{item.badge}</span>
                      )}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="quickAction"
                    onClick={closeMenu}
                  >
                    <span className="quickActionIcon">{item.icon}</span>
                    <span className="quickActionLabel">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      <CarrinhoSidebar aberto={openCart} aoFechar={fecharCarrinhoLateral} />

      {renderDropdownMenu()}
    </>
  );
}