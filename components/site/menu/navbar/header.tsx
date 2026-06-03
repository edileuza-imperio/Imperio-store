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
import { FiSearch } from "react-icons/fi";
import { FiShoppingCart } from "react-icons/fi";
import { FiUser } from "react-icons/fi";
import { FiX } from "react-icons/fi";
import { FiMenu } from "react-icons/fi";
import { FiHome } from "react-icons/fi";
import { FiShoppingBag } from "react-icons/fi";
import { FiHelpCircle } from "react-icons/fi";
import * as FiIcons from "react-icons/fi";
import * as BiIcons from "react-icons/bi";

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
};

function getIcon(name?: string | null, size = 16) {
  const iconName = (name ?? "").trim();
  if (!iconName) return null;

  const Icon = (FiIcons as any)[iconName] || (BiIcons as any)[iconName];
  if (!Icon) return null;

  return <Icon size={size} aria-hidden="true" focusable="false" />;
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
  const [mounted, setMounted] = useState(false);
  const [floatingStyle, setFloatingStyle] = useState<FloatingStyle | null>(null);

  const userBtnRef = useRef<HTMLButtonElement | null>(null);
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
      icon: <FiHome size={18} aria-hidden="true" focusable="false" />,
    },
    {
      label: "Pedidos",
      href: "/pedidos",
      icon: <FiShoppingBag size={18} aria-hidden="true" focusable="false" />,
    },
    {
      label: "Ajuda",
      href: "/contato",
      icon: <FiHelpCircle size={18} aria-hidden="true" focusable="false" />,
    },
    {
      label: "Carrinho",
      href: carrinho?.rota || "/carrinho",
      icon: <FiShoppingCart size={18} aria-hidden="true" focusable="false" />,
      badge: quantidadeCarrinho > 0 ? quantidadeCarrinho : 0,
    },
  ];

  const closeMenu = () => setOpenMenu(false);

  const openSidebar = () => {
    setDropdown(false);
    setOpenMenu(true);
  };

  const toggleUserDropdown = () => {
    setOpenMenu(false);
    setDropdown(!dropdown);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menuLock", openMenu);

    return () => {
      document.body.classList.remove("menuLock");
    };
  }, [openMenu]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(false);
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
      const btn = userBtnRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const menuWidth = viewportWidth <= 480 ? 220 : 240;
      const gap = 12;

      let left = rect.right - menuWidth;
      left = Math.max(12, Math.min(left, viewportWidth - menuWidth - 12));

      setFloatingStyle({
        top: rect.bottom + gap,
        left,
        width: menuWidth,
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

      if (userBtnRef.current?.contains(target)) return;
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
          zIndex: 11000,
        }}
      >
        <div className="floatingDropdownArrow" aria-hidden="true" />

        {loginItems.length === 0 && (
          <span className="floatingDropdownEmpty">Nenhuma opção disponível</span>
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
              href={item.rota || "#"}
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
            <Link
              href="/"
              className="logo"
              aria-label="Ir para a página inicial"
            >
              <span className="logoDark">{titulo1 || "Universo"}</span>
              <span className="logoPink">{titulo2 || "Império"}</span>
            </Link>

            <span className="subtitle">{subtitulo || ""}</span>
          </div>

          <div className="searchWrapper">
            <div className="searchBar">
              <FiSearch size={18} aria-hidden="true" focusable="false" />

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
                  title="Limpar busca"
                >
                  <FiX size={14} aria-hidden="true" focusable="false" />
                </button>
              )}
            </div>
          </div>

          <div className="right">
            {usuario ? (
              <div className="userDropdown">
                <button
                  ref={userBtnRef}
                  className="userBtn"
                  onClick={toggleUserDropdown}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario?.nome ?? ""}`}
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
                <Link
                  href={login.rota || "#"}
                  className="iconBtn"
                  aria-label="Entrar na conta"
                  title="Entrar"
                >
                  <FiUser size={18} aria-hidden="true" focusable="false" />
                  <span>Entrar</span>
                </Link>
              )
            )}

            {carrinho && (
              <Link
                href={carrinho.rota || "/carrinho"}
                className="cartButton"
                aria-label={
                  quantidadeCarrinho > 0
                    ? `Ver carrinho de compras, ${quantidadeCarrinho} item(s)`
                    : "Ver carrinho de compras"
                }
                title="Carrinho"
              >
                <div className="cartWrapper">
                  <FiShoppingCart
                    size={21}
                    aria-hidden="true"
                    focusable="false"
                  />

                  {quantidadeCarrinho > 0 && (
                    <span className="badge">{quantidadeCarrinho}</span>
                  )}
                </div>

                <div className="cartInfo">
                  <span className="cartLabel">Meu</span>
                  <span className="cartTotal">Carrinho</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="mobileNavbar">
          <button
            className="hamburger"
            onClick={openSidebar}
            type="button"
            aria-label="Abrir menu"
            title="Abrir menu"
            aria-expanded={openMenu}
            aria-controls="mobileSidebar"
          >
            <FiMenu size={22} aria-hidden="true" focusable="false" />
          </button>

          <div className="mobileBrand">
            <Link
              href="/"
              className="mobileLogo"
              aria-label="Ir para a página inicial"
            >
              <span className="logoDark">{titulo1 || "Universo"}</span>
              <span className="logoPink">{titulo2 || "Império"}</span>
            </Link>

            <span className="mobileSubtitle">{subtitulo || ""}</span>
          </div>

          <div className="mobileRight">
            {usuario ? (
              <div className="mobileUserDropdown">
                <button
                  ref={userBtnRef}
                  className="mobileUserBtn"
                  onClick={toggleUserDropdown}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario?.nome ?? ""}`}
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
                <Link
                  href={login.rota || "#"}
                  className="mobileBtn"
                  aria-label="Entrar na conta"
                  title="Entrar"
                >
                  <FiUser size={17} aria-hidden="true" focusable="false" />
                </Link>
              )
            )}

            {carrinho && (
              <Link
                href={carrinho.rota || "/carrinho"}
                className="mobileCartBtn"
                aria-label={
                  quantidadeCarrinho > 0
                    ? `Ver carrinho de compras, ${quantidadeCarrinho} item(s)`
                    : "Ver carrinho de compras"
                }
                title="Carrinho"
              >
                <div className="cartWrapper">
                  <FiShoppingCart
                    size={18}
                    aria-hidden="true"
                    focusable="false"
                  />

                  {quantidadeCarrinho > 0 && (
                    <span className="badge">{quantidadeCarrinho}</span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="mobileSearch">
          <div className="searchBar">
            <FiSearch size={16} aria-hidden="true" focusable="false" />

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
                title="Limpar busca"
              >
                <FiX size={14} aria-hidden="true" focusable="false" />
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

          <button
            className="closeBtn"
            onClick={closeMenu}
            type="button"
            aria-label="Fechar menu"
            title="Fechar menu"
          >
            <FiX size={22} aria-hidden="true" focusable="false" />
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
                <FiUser size={20} aria-hidden="true" focusable="false" />
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
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="quickAction"
                  onClick={closeMenu}
                >
                  <span className="quickActionIcon">{item.icon}</span>

                  <span className="quickActionLabel">{item.label}</span>

                  {item.badge && item.badge > 0 && (
                    <span className="quickBadge">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {renderDropdownMenu()}
    </>
  );
}