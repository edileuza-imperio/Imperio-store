"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import SearchBar from "../Pesquisa/SearchBar";

import {
  FiUser,
  FiShoppingCart,
  FiChevronDown,
  FiLogOut,
  FiPackage,
  FiSettings,
} from "react-icons/fi";

import api from "@/Api/conectar";

type MenuItem = {
  id_item: number;
  menu_id: number;
  nome: string;
  rota: string;
  icone?: string | null;
  posicao?: number;
};

type Menu = {
  id_menu: number;
  site_config_id: number;
  nome: string;
  rota?: string | null;
  icone?: string | null;
  pesquisa_placeholder?: string | null;
  itens?: MenuItem[];
};

type Usuario = {
  id?: number;
  nome?: string;
  email?: string;
};

type Props = {
  menus: Menu[];
  searchPlaceholder?: string;
  tituloNavbar?: string | null;
  subtituloNavbar?: string | null;
};

export default function NavbarDesktop({
  menus,
  searchPlaceholder,
  tituloNavbar,
  subtituloNavbar,
}: Props) {
  const [openLoginMenu, setOpenLoginMenu] =
    useState(false);

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  /* ========================================= */
  /* VERIFICAR LOGIN */
  /* ========================================= */

  useEffect(() => {
    async function buscarUsuario() {
      try {
        const response =
          await api.get("/me");

        if (
          response?.data?.dados
        ) {
          setUsuario(
            response.data.dados
          );
        }
      } catch (error) {
        setUsuario(null);
      }
    }

    buscarUsuario();
  }, []);

  /* ========================================= */
  /* FECHAR MENU */
  /* ========================================= */

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenLoginMenu(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* ========================================= */
  /* MENU PESQUISA */
  /* ========================================= */

  const menuPesquisa =
    useMemo(() => {
      return menus.find(
        (menu) =>
          menu.pesquisa_placeholder
      );
    }, [menus]);

  /* ========================================= */
  /* MENU CARRINHO */
  /* ========================================= */

  const menuCarrinho =
    useMemo(() => {
      return menus.find(
        (menu) =>
          menu.rota?.toLowerCase() ===
          "/carrinho"
      );
    }, [menus]);

  /* ========================================= */
  /* MENU LOGIN */
  /* ========================================= */

  const menuLogin = useMemo(() => {
    return menus.find(
      (menu) =>
        menu.rota?.toLowerCase() ===
        "/login"
    );
  }, [menus]);

  /* ========================================= */
  /* MENUS NORMAIS */
  /* ========================================= */

  const menusNormais =
    useMemo(() => {
      return menus.filter(
        (menu) => {
          if (
            menu.pesquisa_placeholder
          ) {
            return false;
          }

          if (
            menu.rota?.toLowerCase() ===
            "/carrinho"
          ) {
            return false;
          }

          if (
            menu.rota?.toLowerCase() ===
            "/login"
          ) {
            return false;
          }

          return true;
        }
      );
    }, [menus]);

  /* ========================================= */
  /* LOGOUT */
  /* ========================================= */

  async function handleLogout() {
    try {
      await api.post("/logout");

      window.location.href =
        "/login";
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      {/* CSS TEMPORÁRIO */}

      <style jsx>{`
        .navbar {
          width: 100%;
          height: 82px;
          background: #ffffff;
          border-bottom: 1px solid #ececec;
          position: sticky;
          top: 0;
          z-index: 999;
        }

        .container {
          max-width: 1450px;
          width: 100%;
          height: 100%;
          margin: 0 auto;
          padding: 0 28px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
          text-decoration: none;
          min-width: 220px;
        }

        .title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #111827;
          line-height: 1;
        }

        .subtitle {
          margin-top: 6px;
          font-size: 0.78rem;
          color: #6b7280;
        }

        .searchWrap {
          flex: 1;
          max-width: 650px;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .menuLink {
          text-decoration: none;
          color: #111827;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 10px 14px;
          border-radius: 12px;
          transition: 0.2s;
        }

        .menuLink:hover {
          background: #f5f5f5;
        }

        .iconButton {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: #f8fafc;
          color: #111827;

          display: flex;
          align-items: center;
          justify-content: center;

          text-decoration: none;
          transition: 0.2s;
        }

        .iconButton:hover {
          background: #ececec;
        }

        .userDropdown {
          position: relative;
        }

        .userButton {
          border: none;
          background: #f8fafc;
          border-radius: 16px;
          padding: 10px 14px;
          cursor: pointer;

          display: flex;
          align-items: center;
          gap: 12px;

          transition: 0.2s;
        }

        .userButton:hover {
          background: #ececec;
        }

        .userAvatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #111827;
          color: white;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .userInfo {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .userName {
          font-size: 0.9rem;
          font-weight: 700;
          color: #111827;
        }

        .userText {
          font-size: 0.72rem;
          color: #6b7280;
        }

        .dropdownMenu {
          position: absolute;
          top: 62px;
          right: 0;

          width: 250px;

          background: white;
          border-radius: 18px;
          border: 1px solid #ececec;

          padding: 10px;

          display: flex;
          flex-direction: column;
          gap: 6px;

          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.08);
        }

        .dropdownItem {
          width: 100%;
          border: none;
          background: transparent;
          text-decoration: none;

          display: flex;
          align-items: center;
          gap: 12px;

          padding: 12px 14px;

          border-radius: 12px;

          font-size: 0.92rem;
          font-weight: 600;

          color: #111827;

          transition: 0.2s;
        }

        .dropdownItem:hover {
          background: #f4f4f5;
        }

        .logoutButton {
          width: 100%;
          border: none;
          cursor: pointer;

          display: flex;
          align-items: center;
          gap: 12px;

          padding: 12px 14px;
          margin-top: 6px;

          border-radius: 12px;

          background: #fff1f2;
          color: #dc2626;

          font-size: 0.92rem;
          font-weight: 700;

          transition: 0.2s;
        }

        .logoutButton:hover {
          background: #ffe4e6;
        }

        @media (max-width: 1100px) {
          .navbar {
            display: none;
          }
        }
      `}</style>

      <header className="navbar">
        <div className="container">

          {/* LOGO */}

          <Link
            href="/"
            className="brand"
          >
            <div className="title">
              {tituloNavbar ||
                "Universo Império"}
            </div>

            <div className="subtitle">
              {subtituloNavbar ||
                "Decorações & Eventos"}
            </div>
          </Link>

          {/* SEARCH */}

          <div className="searchWrap">
            <SearchBar
              placeholder={
                searchPlaceholder ||
                menuPesquisa?.pesquisa_placeholder ||
                "Buscar produtos..."
              }
              className="w-100"
            />
          </div>

          {/* ACTIONS */}

          <nav className="actions">

            {/* MENUS */}

            {menusNormais.map(
              (menu) => (
                <Link
                  key={menu.id_menu}
                  href={
                    menu.rota || "#"
                  }
                  className="menuLink"
                >
                  {menu.nome}
                </Link>
              )
            )}

            {/* CARRINHO */}

            {menuCarrinho && (
              <Link
                href={
                  menuCarrinho.rota ||
                  "/carrinho"
                }
                className="iconButton"
              >
                <FiShoppingCart
                  size={20}
                />
              </Link>
            )}

            {/* LOGIN */}

            {menuLogin && (
              <div
                className="userDropdown"
                ref={dropdownRef}
              >
                <button
                  type="button"
                  className="userButton"
                  onClick={() =>
                    setOpenLoginMenu(
                      !openLoginMenu
                    )
                  }
                >
                  <div className="userAvatar">
                    <FiUser size={16} />
                  </div>

                  <div className="userInfo">
                    <span className="userName">
                      {usuario?.nome
                        ? usuario.nome
                        : "Minha Conta"}
                    </span>

                    <span className="userText">
                      {usuario
                        ? "Bem-vindo"
                        : "Entrar"}
                    </span>
                  </div>

                  <FiChevronDown
                    size={16}
                  />
                </button>

                {openLoginMenu && (
                  <div className="dropdownMenu">

                    {/* NÃO LOGADO */}

                    {!usuario && (
                      <Link
                        href={
                          menuLogin.rota ||
                          "/login"
                        }
                        className="dropdownItem"
                      >
                        <FiUser />
                        Entrar
                      </Link>
                    )}

                    {/* LOGADO */}

                    {usuario && (
                      <>
                        {menuLogin.itens
                          ?.sort(
                            (a, b) =>
                              (a.posicao ||
                                0) -
                              (b.posicao ||
                                0)
                          )
                          .map((item) => (
                            <Link
                              key={
                                item.id_item
                              }
                              href={
                                item.rota
                              }
                              className="dropdownItem"
                            >
                              {item.nome
                                .toLowerCase()
                                .includes(
                                  "pedido"
                                ) && (
                                <FiPackage />
                              )}

                              {item.nome
                                .toLowerCase()
                                .includes(
                                  "painel"
                                ) && (
                                <FiSettings />
                              )}

                              {!item.nome
                                .toLowerCase()
                                .includes(
                                  "pedido"
                                ) &&
                                !item.nome
                                  .toLowerCase()
                                  .includes(
                                    "painel"
                                  ) && (
                                  <FiUser />
                                )}

                              {item.nome}
                            </Link>
                          ))}

                        <button
                          type="button"
                          onClick={
                            handleLogout
                          }
                          className="logoutButton"
                        >
                          <FiLogOut />
                          Sair
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}