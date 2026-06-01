"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
  FiMenu,
  FiHome,
  FiShoppingBag,
  FiHelpCircle,
} from "react-icons/fi";
import * as FiIcons from "react-icons/fi";
import * as BiIcons from "react-icons/bi";

import { Menu, Usuario } from "@/components/site/menu/menu";
import styles from "./NavbarHeader.module.css";

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

  const closeMenu = () => setOpenMenu(false);

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

  return (
    <>
      <header
        className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}
      >
        <div className={styles.desktopNavbar}>
          <div className={styles.brand}>
            <Link
              href="/"
              className={styles.logo}
              aria-label="Ir para a página inicial"
            >
              <span className={styles.logoDark}>{titulo1 || "Universo"}</span>
              <span className={styles.logoPink}>{titulo2 || "Império"}</span>
            </Link>

            <span className={styles.subtitle}>{subtitulo || ""}</span>
          </div>

          <div className={styles.searchWrapper}>
            <div className={styles.searchBar}>
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
                  className={styles.clearBtn}
                  onClick={() => setPesquisa("")}
                  aria-label="Limpar busca"
                  title="Limpar busca"
                >
                  <FiX size={14} aria-hidden="true" focusable="false" />
                </button>
              )}
            </div>
          </div>

          <div className={styles.right}>
            {usuario ? (
              <div className={styles.userDropdown}>
                <button
                  className={styles.userBtn}
                  onClick={() => setDropdown(!dropdown)}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario?.nome ?? ""}`}
                >
                  <div className={styles.userAvatar}>
                    {(usuario?.nome ?? "?").charAt(0)?.toUpperCase()}
                  </div>

                  <div className={styles.userInfo}>
                    <span>Olá,</span>
                    <strong>{usuario?.nome ?? "Usuário"}</strong>
                  </div>
                </button>

                {dropdown && (
                  <div className={styles.dropdownMenu} role="menu">
                    {loginItems.map((item) => {
                      const nome = (item.nome ?? "").toLowerCase().trim();
                      const sair = nome === "sair";

                      if (sair) {
                        return (
                          <button
                            key={item.id_item}
                            onClick={logout}
                            className={styles.dropdownItem}
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
                          className={styles.dropdownItem}
                          onClick={() => setDropdown(false)}
                          role="menuitem"
                        >
                          {getIcon(item.icone, 16)}
                          <span>{item.nome ?? "Item"}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              login && (
                <Link
                  href={login.rota || "#"}
                  className={styles.iconBtn}
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
                className={styles.cartButton}
                aria-label={
                  quantidadeCarrinho > 0
                    ? `Ver carrinho de compras, ${quantidadeCarrinho} item(s)`
                    : "Ver carrinho de compras"
                }
                title="Carrinho"
              >
                <div className={styles.cartWrapper}>
                  <FiShoppingCart
                    size={21}
                    aria-hidden="true"
                    focusable="false"
                  />

                  {quantidadeCarrinho > 0 && (
                    <span className={styles.badge}>{quantidadeCarrinho}</span>
                  )}
                </div>

                <div className={styles.cartInfo}>
                  <span className={styles.cartLabel}>Meu</span>
                  <span className={styles.cartTotal}>Carrinho</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className={styles.mobileNavbar}>
          <button
            className={styles.hamburger}
            onClick={() => setOpenMenu(true)}
            type="button"
            aria-label="Abrir menu"
            title="Abrir menu"
            aria-expanded={openMenu}
            aria-controls="mobileSidebar"
          >
            <FiMenu size={22} aria-hidden="true" focusable="false" />
          </button>

          <div className={styles.mobileBrand}>
            <Link
              href="/"
              className={styles.mobileLogo}
              aria-label="Ir para a página inicial"
            >
              <span className={styles.logoDark}>{titulo1 || "Universo"}</span>
              <span className={styles.logoPink}>{titulo2 || "Império"}</span>
            </Link>

            <span className={styles.mobileSubtitle}>{subtitulo || ""}</span>
          </div>

          <div className={styles.mobileRight}>
            {usuario ? (
              <div className={styles.mobileUserDropdown}>
                <button
                  className={styles.mobileUserBtn}
                  onClick={() => setDropdown(!dropdown)}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario?.nome ?? ""}`}
                >
                  <div className={styles.mobileAvatar}>
                    {(usuario?.nome ?? "?").charAt(0)?.toUpperCase()}
                  </div>

                  <span className={styles.mobileUserName}>
                    {usuario?.nome ?? "Usuário"}
                  </span>
                </button>

                {dropdown && (
                  <div className={styles.mobileDropdown} role="menu">
                    {loginItems.map((item) => {
                      const nome = (item.nome ?? "").toLowerCase().trim();
                      const sair = nome === "sair";

                      if (sair) {
                        return (
                          <button
                            key={item.id_item}
                            className={styles.mobileDropdownItem}
                            onClick={logout}
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
                          className={styles.mobileDropdownItem}
                          onClick={() => setDropdown(false)}
                          role="menuitem"
                        >
                          {getIcon(item.icone, 16)}
                          <span>{item.nome ?? "Item"}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              login && (
                <Link
                  href={login.rota || "#"}
                  className={styles.mobileBtn}
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
                className={styles.mobileCartBtn}
                aria-label={
                  quantidadeCarrinho > 0
                    ? `Ver carrinho de compras, ${quantidadeCarrinho} item(s)`
                    : "Ver carrinho de compras"
                }
                title="Carrinho"
              >
                <div className={styles.cartWrapper}>
                  <FiShoppingCart
                    size={18}
                    aria-hidden="true"
                    focusable="false"
                  />

                  {quantidadeCarrinho > 0 && (
                    <span className={styles.badge}>{quantidadeCarrinho}</span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className={styles.mobileSearch}>
          <div className={styles.searchBar}>
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
                className={styles.clearBtn}
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
        className={`${styles.overlay} ${openMenu ? styles.overlayShow : ""}`}
        onClick={closeMenu}
      />

      <aside
        id="mobileSidebar"
        className={`${styles.sidebar} ${openMenu ? styles.sidebarOpen : ""}`}
        aria-label="Menu lateral"
      >
        <div className={styles.sidebarHeader}>
          <div>
            <h2>Menu</h2>
            <span className={styles.sidebarSubtitle}>
              Acesse tudo em um só lugar
            </span>
          </div>

          <button
            className={styles.closeBtn}
            onClick={closeMenu}
            type="button"
            aria-label="Fechar menu"
            title="Fechar menu"
          >
            <FiX size={22} aria-hidden="true" focusable="false" />
          </button>
        </div>

        <div className={styles.sidebarContent}>
          {usuario ? (
            <div className={styles.sidebarUserCard}>
              <div className={styles.sidebarAvatarLarge}>
                {(usuario?.nome ?? "?").charAt(0)?.toUpperCase()}
              </div>

              <div className={styles.sidebarUserData}>
                <strong>{usuario?.nome ?? "Usuário"}</strong>
                <span>{usuario?.email ?? ""}</span>
              </div>
            </div>
          ) : (
            <div className={styles.sidebarGuestCard}>
              <div className={styles.sidebarGuestIcon}>
                <FiUser size={20} aria-hidden="true" focusable="false" />
              </div>

              <div className={styles.sidebarUserData}>
                <strong>Bem-vindo</strong>
                <span>Entre para ver seus pedidos e favoritos</span>
              </div>
            </div>
          )}

          <div className={styles.quickSection}>
            <div className={styles.sectionTitle}>Atalhos rápidos</div>

            <div className={styles.quickGrid}>
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={styles.quickAction}
                  onClick={closeMenu}
                >
                  <span className={styles.quickActionIcon}>{item.icon}</span>

                  <span className={styles.quickActionLabel}>{item.label}</span>

                  {item.badge && item.badge > 0 && (
                    <span className={styles.quickBadge}>{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
} 