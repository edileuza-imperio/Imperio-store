"use client";

import { useState } from "react";
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
  if (!name) return null;

  const Icon = (FiIcons as any)[name] || (BiIcons as any)[name];
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
      <header className={`header ${scrolled ? "headerScrolled" : ""}`}>
        <div className="desktopNavbar">
          <div className="brand">
            <Link href="/" className="logo" aria-label="Ir para a página inicial">
              <span className="logoDark">{titulo1}</span>
              <span className="logoPink">{titulo2}</span>
            </Link>

            <span className="subtitle">{subtitulo}</span>
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

              {pesquisa.trim() !== "" && (
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
                  className="userBtn"
                  onClick={() => setDropdown(!dropdown)}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario.nome}`}
                >
                  <div className="userAvatar">
                    {usuario.nome?.charAt(0)?.toUpperCase()}
                  </div>

                  <div className="userInfo">
                    <span>Olá,</span>
                    <strong>{usuario.nome}</strong>
                  </div>
                </button>

                {dropdown && (
                  <div className="dropdownMenu" role="menu">
                    {login?.itens
                      ?.slice()
                      .sort((a, b) => a.posicao - b.posicao)
                      .map((item) => {
                        const sair =
                          item.nome?.toLowerCase()?.trim() === "sair";

                        if (sair) {
                          return (
                            <button
                              key={item.id_item}
                              onClick={logout}
                              className="dropdownItem"
                              type="button"
                              role="menuitem"
                            >
                              {getIcon(item.icone, 16)}
                              <span>{item.nome}</span>
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={item.id_item}
                            href={item.rota}
                            className="dropdownItem"
                            onClick={() => setDropdown(false)}
                            role="menuitem"
                          >
                            {getIcon(item.icone, 16)}
                            <span>{item.nome}</span>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : (
              login && (
                <Link
                  href={login.rota}
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
                href={carrinho.rota}
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
            onClick={() => setOpenMenu(true)}
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
              <span className="logoDark">{titulo1}</span>
              <span className="logoPink">{titulo2}</span>
            </Link>

            <span className="mobileSubtitle">{subtitulo}</span>
          </div>

          <div className="mobileRight">
            {usuario ? (
              <div className="mobileUserDropdown">
                <button
                  className="mobileUserBtn"
                  onClick={() => setDropdown(!dropdown)}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario.nome}`}
                >
                  <div className="mobileAvatar">
                    {usuario.nome?.charAt(0)?.toUpperCase()}
                  </div>

                  <span className="mobileUserName">{usuario.nome}</span>
                </button>

                {dropdown && (
                  <div className="mobileDropdown" role="menu">
                    {login?.itens
                      ?.slice()
                      .sort((a, b) => a.posicao - b.posicao)
                      .map((item) => {
                        const sair =
                          item.nome?.toLowerCase()?.trim() === "sair";

                        if (sair) {
                          return (
                            <button
                              key={item.id_item}
                              className="mobileDropdownItem"
                              onClick={logout}
                              type="button"
                              role="menuitem"
                            >
                              {getIcon(item.icone, 16)}
                              <span>{item.nome}</span>
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={item.id_item}
                            href={item.rota}
                            className="mobileDropdownItem"
                            onClick={() => setDropdown(false)}
                            role="menuitem"
                          >
                            {getIcon(item.icone, 16)}
                            <span>{item.nome}</span>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : (
              login && (
                <Link
                  href={login.rota}
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
                href={carrinho.rota}
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

            {pesquisa.trim() !== "" && (
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
      />

      <aside
        id="mobileSidebar"
        className={`sidebar ${openMenu ? "sidebarOpen" : ""}`}
        aria-label="Menu lateral"
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
                {usuario.nome?.charAt(0)?.toUpperCase()}
              </div>

              <div className="sidebarUserData">
                <strong>{usuario.nome}</strong>
                <span>{usuario.email}</span>
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

      <style jsx global>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 999;
          width: 100%;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #efe7e2;
          transition: 0.3s ease;
          color: #2b2b2b;
        }

        .headerScrolled {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
        }

        .desktopNavbar {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 0 32px;
        }

        .brand {
          display: flex;
          flex-direction: column;
          min-width: 220px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }

        .logoDark {
          font-size: 30px;
          font-weight: 800;
          color: #232323;
          letter-spacing: -1px;
        }

        .logoPink {
          font-size: 30px;
          font-weight: 800;
          color: #b56f5a;
          letter-spacing: -1px;
        }

        .subtitle {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #6f655f;
          margin-top: 2px;
        }

        .searchWrapper {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .searchBar {
          width: 100%;
          max-width: 620px;
          height: 52px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 18px;
          background: #f8f6f4;
          border: 1px solid #ece5df;
          border-radius: 14px;
          transition: 0.2s ease;
        }

        .searchBar:focus-within {
          background: #fff;
          border-color: #d7b5a8;
          box-shadow: 0 0 0 4px rgba(181, 111, 90, 0.12);
        }

        .searchBar input {
          flex: 1;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: #2c2c2c;
        }

        .searchBar input::placeholder {
          color: #7b6f69;
        }

        .clearBtn {
          width: 26px;
          height: 26px;
          border: none;
          background: #eee5e0;
          border-radius: 50%;
          cursor: pointer;
          color: #7f726d;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s ease;
        }

        .clearBtn:hover {
          background: #d8c2b8;
          color: #fff;
        }

        .right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .iconBtn {
          height: 48px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 18px;
          background: #fff;
          border: 1px solid #ece5df;
          border-radius: 14px;
          text-decoration: none;
          color: #2b2b2b;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s ease;
          overflow: visible;
        }

        .iconBtn:hover {
          transform: translateY(-2px);
          border-color: #d8b7aa;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }

        .cartWrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .badge {
          position: absolute;
          top: -10px;
          right: -10px;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 999px;
          background: linear-gradient(135deg, #e09b84, #c97d63);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          border: 2px solid #fff;
          box-shadow: 0 6px 16px rgba(201, 125, 99, 0.35);
          animation: badgePop 0.25s ease;
          z-index: 10;
        }

        @keyframes badgePop {
          from {
            transform: scale(0.7);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .cartButton {
          position: relative;
          height: 52px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 18px;
          border-radius: 16px;
          background: linear-gradient(135deg, #fff, #f9f6f4);
          border: 1px solid #ece5df;
          text-decoration: none;
          transition: 0.25s ease;
          color: #2b2b2b;
          overflow: visible;
        }

        .cartButton:hover {
          transform: translateY(-2px);
          border-color: #d7b5a8;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.07);
        }

        .cartInfo {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .cartLabel {
          font-size: 11px;
          font-weight: 600;
          color: #6f655f;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .cartTotal {
          font-size: 14px;
          font-weight: 700;
          color: #222;
        }

        .userDropdown {
          position: relative;
        }

        .userBtn {
          height: 52px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 14px;
          border: 1px solid #ece5df;
          background: #fff;
          border-radius: 14px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .userBtn:hover {
          border-color: #d8b7aa;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
        }

        .userAvatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d8b3a5, #bf8d78);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
        }

        .userInfo {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .userInfo span {
          font-size: 11px;
          color: #6f655f;
        }

        .userInfo strong {
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          color: #222;
        }

        .dropdownMenu {
          position: absolute;
          top: 62px;
          right: 0;
          width: 240px;
          background: #fff;
          border-radius: 18px;
          border: 1px solid #ece5df;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
          padding: 10px;
          z-index: 999;
        }

        .dropdownItem {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border: none;
          outline: none;
          background: transparent;
          border-radius: 12px;
          text-decoration: none;
          color: #2c2c2c;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .dropdownItem:hover {
          background: #f7f4f2;
        }

        .dropdownItem:focus-visible,
        .iconBtn:focus-visible,
        .cartButton:focus-visible,
        .userBtn:focus-visible,
        .hamburger:focus-visible,
        .mobileBtn:focus-visible,
        .mobileCartBtn:focus-visible,
        .mobileUserBtn:focus-visible,
        .clearBtn:focus-visible,
        .quickAction:focus-visible,
        .footerButton:focus-visible,
        .footerButtonSecondary:focus-visible,
        .footerButtonDanger:focus-visible,
        .closeBtn:focus-visible {
          outline: 3px solid rgba(181, 111, 90, 0.25);
          outline-offset: 2px;
        }

        .mobileNavbar {
          display: none;
        }

        .mobileSearch {
          display: none;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          opacity: 0;
          visibility: hidden;
          transition: 0.3s ease;
          z-index: 998;
        }

        .overlayShow {
          opacity: 1;
          visibility: visible;
        }

        .sidebar {
          position: fixed;
          top: 0;
          left: -360px;
          width: 340px;
          height: 100vh;
          background: #fff;
          z-index: 999;
          transition: 0.3s ease;
          box-shadow: 10px 0 40px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
        }

        .sidebarOpen {
          left: 0;
        }

        .sidebarHeader {
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 22px;
          border-bottom: 1px solid #f2ece8;
        }

        .sidebarHeader h2 {
          font-size: 22px;
          color: #222;
          margin: 0;
        }

        .sidebarSubtitle {
          display: block;
          font-size: 12px;
          color: #6f655f;
          margin-top: 4px;
        }

        .closeBtn {
          border: none;
          background: transparent;
          cursor: pointer;
          color: #444;
        }

        .sidebarContent {
          padding: 14px;
          overflow-y: auto;
          flex: 1;
        }

        .sidebarUserCard,
        .sidebarGuestCard {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(135deg, #fcfaf8, #f8f4f1);
          border: 1px solid #efe5df;
          margin-bottom: 14px;
        }

        .sidebarAvatarLarge {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d8b3a5, #bf8d78);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
        }

        .sidebarGuestIcon {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #f1ece8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8e847d;
          flex-shrink: 0;
        }

        .sidebarUserData {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .sidebarUserData strong {
          font-size: 15px;
          color: #222;
          line-height: 1.2;
        }

        .sidebarUserData span {
          font-size: 12px;
          color: #6f655f;
          margin-top: 4px;
          word-break: break-word;
        }

        .quickSection {
          margin-top: 16px;
        }

        .sectionTitle {
          font-size: 13px;
          font-weight: 700;
          color: #5a514b;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .quickGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .quickAction {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          padding: 14px;
          border-radius: 16px;
          background: #fff;
          border: 1px solid #ece5df;
          color: #2d2d2d;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .quickAction:hover {
          transform: translateY(-1px);
          border-color: #d8b7aa;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
        }

        .quickActionIcon {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: #f7f3f1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2b2b2b;
        }

        .quickActionLabel {
          font-size: 13px;
          font-weight: 600;
        }

        .quickBadge {
          position: absolute;
          top: -7px;
          right: -7px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #d97d63;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
        }

        .sidebarFooter {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-bottom: 10px;
        }

        .footerButton,
        .footerButtonSecondary,
        .footerButtonDanger {
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: flex-start;
          padding: 0 14px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .footerButton {
          background: #fff;
          border: 1px solid #ece5df;
          color: #2d2d2d;
        }

        .footerButtonSecondary {
          background: #f7f3f1;
          border: 1px solid #eee2dc;
          color: #2d2d2d;
        }

        .footerButtonDanger {
          border: 1px solid #f3d7d0;
          background: #fff5f3;
          color: #a85c4f;
          cursor: pointer;
        }

        .footerButton:hover,
        .footerButtonSecondary:hover,
        .footerButtonDanger:hover {
          transform: translateY(-1px);
        }

        @media (max-width: 991px) {
          .desktopNavbar {
            display: none;
          }

          .mobileNavbar {
            width: 100%;
            height: 74px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 0 16px;
          }

          .hamburger {
            width: 42px;
            height: 42px;
            border: none;
            background: #f7f3f1;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #2c2c2c;
          }

          .mobileBrand {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .mobileLogo {
            display: flex;
            gap: 4px;
            text-decoration: none;
          }

          .mobileSubtitle {
            font-size: 9px;
            color: #6f655f;
            letter-spacing: 2px;
            margin-top: 2px;
          }

          .mobileRight {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .mobileBtn {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: #f7f3f1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #2b2b2b;
            text-decoration: none;
            overflow: visible;
          }

          .mobileCartBtn {
            position: relative;
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: #f7f3f1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #2b2b2b;
            text-decoration: none;
            overflow: visible;
          }

          .mobileUserDropdown {
            position: relative;
          }

          .mobileUserBtn {
            display: flex;
            align-items: center;
            gap: 8px;
            border: none;
            background: transparent;
            cursor: pointer;
          }

          .mobileAvatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d8b3a5, #bf8d78);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 13px;
            font-weight: 700;
          }

          .mobileUserName {
            max-width: 70px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 13px;
            font-weight: 600;
            color: #222;
          }

          .mobileDropdown {
            position: absolute;
            top: 52px;
            right: 0;
            width: 220px;
            background: #fff;
            border-radius: 16px;
            border: 1px solid #ece5df;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
            padding: 10px;
            z-index: 999;
          }

          .mobileDropdownItem {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: none;
            background: transparent;
            border-radius: 12px;
            text-decoration: none;
            color: #2c2c2c;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }

          .mobileDropdownItem:hover {
            background: #f7f4f2;
          }

          .mobileSearch {
            display: block;
            padding: 0 16px 16px 16px;
          }

          .mobileSearch .searchBar {
            max-width: 100%;
            height: 48px;
          }

          .mobileSearch input {
            font-size: 14px;
          }

          .logoDark,
          .logoPink {
            font-size: 22px;
          }

          .sidebar {
            width: min(92vw, 340px);
          }
        }

        @media (max-width: 480px) {
          .mobileNavbar {
            padding: 0 12px;
          }

          .mobileUserName {
            display: none;
          }

          .mobileLogo {
            transform: scale(0.92);
          }

          .mobileSearch {
            padding: 0 12px 14px 12px;
          }

          .mobileSearch .searchBar {
            height: 46px;
            border-radius: 12px;
          }

          .sidebarHeader {
            padding: 0 16px;
          }

          .sidebarContent {
            padding: 12px;
          }

          .quickGrid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </>
  );
}