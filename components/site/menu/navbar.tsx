"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiMenu,
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
} from "react-icons/fi";

import * as FiIcons from "react-icons/fi";
import * as BiIcons from "react-icons/bi";

import api from "@/Api/conectar";

import styles from "./Navbar.module.css";

type MenuItem = {
  id_item: number;
  menu_id: number;
  nome: string;
  rota: string;
  icone: string | null;
  posicao: number;
};

type Menu = {
  id_menu: number;
  nome: string;
  rota: string;
  icone: string | null;
  itens?: MenuItem[];
};

type Usuario = {
  id_usuario: number;
  nome: string;
  email: string;
};

type SiteConfig = {
  titulo: string;
  subtitulo: string;
};

export default function Navbar() {

  const [menus, setMenus] =
    useState<Menu[]>([]);

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [site, setSite] =
    useState<SiteConfig | null>(null);

  const [openMenu, setOpenMenu] =
    useState(false);

  const [dropdown, setDropdown] =
    useState(false);

  const [pesquisa, setPesquisa] =
    useState("");

  const [scrolled, setScrolled] =
    useState(false);

  useEffect(() => {

    carregar();

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );

  }, []);

  async function carregar() {

    try {

      const [
        menusRes,
        siteRes,
      ] = await Promise.all([
        api.get("/menus"),
        api.get("/site-configs"),
      ]);

      const menusDados =
        menusRes.data?.dados;

      setMenus(
        Array.isArray(menusDados)
          ? menusDados
          : []
      );

      const siteDados =
        siteRes.data?.dados;

      setSite(
        Array.isArray(siteDados)
          ? siteDados[0]
          : null
      );

    } catch (error) {

      console.log(error);

      setMenus([]);

    }

    carregarUsuario();
  }

  async function carregarUsuario() {

    try {

      const res =
        await api.get("/me");

      const dados =
        res.data?.usuario ||
        res.data?.dados?.usuario;

      if (dados) {

        setUsuario({
          id_usuario:
            dados.id_usuario,
          nome: dados.nome,
          email: dados.email,
        });

      }

    } catch (error) {

      setUsuario(null);

    }
  }

  async function logout() {

    try {

      await api.post("/logout");

      setDropdown(false);

      setUsuario(null);

      window.location.href = "/";

    } catch (error) {

      console.log(error);

    }
  }

  const carrinho = useMemo(() => {

    if (!Array.isArray(menus))
      return null;

    return menus.find(
      (m) =>
        m.nome
          ?.toLowerCase()
          ?.trim() ===
        "carrinho"
    );

  }, [menus]);

  const login = useMemo(() => {

    if (!Array.isArray(menus))
      return null;

    return menus.find(
      (m) =>
        m.nome
          ?.toLowerCase()
          ?.trim() ===
        "login"
    );

  }, [menus]);

  const renderIcon = (
    name: string | null,
    size = 16
  ) => {

    if (!name) return null;

    const Icon =
      (FiIcons as any)[name] ||
      (BiIcons as any)[name];

    if (!Icon) return null;

    return <Icon size={size} />;
  };

  const titulo =
    site?.titulo ||
    "Universo Império";

  const subtitulo =
    site?.subtitulo ||
    "DECORAÇÕES & EVENTOS";

  const tituloSplit =
    titulo.split(" ");

  return (
    <>
      <header
        className={`${styles.header} ${
          scrolled
            ? styles.headerScrolled
            : ""
        }`}
      >

        {/* DESKTOP */}

        <div
          className={
            styles.desktopNavbar
          }
        >

          {/* LOGO */}

          <div className={styles.brand}>

            <Link
              href="/"
              className={styles.logo}
            >

              <span
                className={
                  styles.logoDark
                }
              >
                {tituloSplit[0]}
              </span>

              <span
                className={
                  styles.logoPink
                }
              >
                {tituloSplit[1]}
              </span>

            </Link>

            <span
              className={
                styles.subtitle
              }
            >
              {subtitulo}
            </span>

          </div>

          {/* SEARCH */}

          <div
            className={
              styles.searchWrapper
            }
          >

            <div
              className={
                styles.searchBar
              }
            >

              <FiSearch
                size={18}
              />

              <input
                type="text"
                value={pesquisa}
                onChange={(e) =>
                  setPesquisa(
                    e.target.value
                  )
                }
                placeholder="Buscar produtos..."
              />

            </div>

          </div>

          {/* RIGHT */}

          <div className={styles.right}>

            {usuario ? (

              <div
                className={
                  styles.userDropdown
                }
              >

                <button
                  className={
                    styles.userBtn
                  }
                  onClick={() =>
                    setDropdown(
                      !dropdown
                    )
                  }
                >

                  <div
                    className={
                      styles.userAvatar
                    }
                  >
                    {usuario.nome
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>

                  <div
                    className={
                      styles.userInfo
                    }
                  >

                    <span>
                      Olá,
                    </span>

                    <strong>
                      {usuario.nome}
                    </strong>

                  </div>

                </button>

                {dropdown && (

                  <div
                    className={
                      styles.dropdownMenu
                    }
                  >

                    {login?.itens
                      ?.sort(
                        (a, b) =>
                          a.posicao -
                          b.posicao
                      )
                      .map((item) => {

                        const sair =
                          item.nome
                            ?.toLowerCase()
                            ?.trim() ===
                          "sair";

                        if (sair) {

                          return (
                            <button
                              key={
                                item.id_item
                              }
                              className={
                                styles.dropdownItem
                              }
                              onClick={
                                logout
                              }
                            >

                              {renderIcon(
                                item.icone,
                                16
                              )}

                              <span>
                                {
                                  item.nome
                                }
                              </span>

                            </button>
                          );
                        }

                        return (

                          <Link
                            key={
                              item.id_item
                            }
                            href={
                              item.rota
                            }
                            className={
                              styles.dropdownItem
                            }
                          >

                            {renderIcon(
                              item.icone,
                              16
                            )}

                            <span>
                              {
                                item.nome
                              }
                            </span>

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
                  className={
                    styles.iconBtn
                  }
                >

                  <FiUser size={18} />

                  <span>
                    Entrar
                  </span>

                </Link>
              )

            )}

            {carrinho && (

              <Link
                href={carrinho.rota}
                className={
                  styles.iconBtn
                }
              >

                <FiShoppingCart
                  size={18}
                />

                <span>
                  Carrinho
                </span>

              </Link>

            )}

          </div>

        </div>

        {/* MOBILE */}

        <div
          className={
            styles.mobileNavbar
          }
        >

          <button
            className={
              styles.hamburger
            }
            onClick={() =>
              setOpenMenu(true)
            }
          >

            <FiMenu size={22} />

          </button>

          <div
            className={
              styles.mobileBrand
            }
          >

            <Link
              href="/"
              className={
                styles.mobileLogo
              }
            >

              <span
                className={
                  styles.logoDark
                }
              >
                {tituloSplit[0]}
              </span>

              <span
                className={
                  styles.logoPink
                }
              >
                {tituloSplit[1]}
              </span>

            </Link>

            <span
              className={
                styles.mobileSubtitle
              }
            >
              {subtitulo}
            </span>

          </div>

          <div
            className={
              styles.mobileRight
            }
          >

            {usuario ? (

              <div
                className={
                  styles.mobileUserDropdown
                }
              >

                <button
                  className={
                    styles.mobileUserBtn
                  }
                  onClick={() =>
                    setDropdown(
                      !dropdown
                    )
                  }
                >

                  <div
                    className={
                      styles.mobileAvatar
                    }
                  >
                    {usuario.nome
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>

                </button>

                {dropdown && (

                  <div
                    className={
                      styles.mobileDropdown
                    }
                  >

                    {login?.itens
                      ?.sort(
                        (a, b) =>
                          a.posicao -
                          b.posicao
                      )
                      .map((item) => {

                        const sair =
                          item.nome
                            ?.toLowerCase()
                            ?.trim() ===
                          "sair";

                        if (sair) {

                          return (
                            <button
                              key={
                                item.id_item
                              }
                              className={
                                styles.mobileDropdownItem
                              }
                              onClick={
                                logout
                              }
                            >

                              {renderIcon(
                                item.icone,
                                16
                              )}

                              <span>
                                {
                                  item.nome
                                }
                              </span>

                            </button>
                          );
                        }

                        return (

                          <Link
                            key={
                              item.id_item
                            }
                            href={
                              item.rota
                            }
                            className={
                              styles.mobileDropdownItem
                            }
                          >

                            {renderIcon(
                              item.icone,
                              16
                            )}

                            <span>
                              {
                                item.nome
                              }
                            </span>

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
                  className={
                    styles.mobileBtn
                  }
                >

                  <FiUser size={17} />

                </Link>
              )

            )}

            {carrinho && (

              <Link
                href={carrinho.rota}
                className={
                  styles.mobileBtn
                }
              >

                <FiShoppingCart
                  size={17}
                />

              </Link>

            )}

          </div>

        </div>

        {/* MOBILE SEARCH */}

        <div
          className={
            styles.mobileSearch
          }
        >

          <div
            className={
              styles.searchBar
            }
          >

            <FiSearch
              size={16}
            />

            <input
              type="text"
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(
                  e.target.value
                )
              }
              placeholder="Buscar produtos..."
            />

          </div>

        </div>

      </header>

      {/* OVERLAY */}

      <div
        className={`${styles.overlay} ${
          openMenu
            ? styles.overlayShow
            : ""
        }`}
        onClick={() =>
          setOpenMenu(false)
        }
      />

      {/* SIDEBAR */}

      <aside
        className={`${styles.sidebar} ${
          openMenu
            ? styles.sidebarOpen
            : ""
        }`}
      >

        <div
          className={
            styles.sidebarHeader
          }
        >

          <h2>
            Menu
          </h2>

          <button
            className={
              styles.closeBtn
            }
            onClick={() =>
              setOpenMenu(false)
            }
          >

            <FiX size={22} />

          </button>

        </div>

        {usuario && (

          <div
            className={
              styles.sidebarUser
            }
          >

            <div
              className={
                styles.sidebarAvatar
              }
            >
              {usuario.nome
                ?.charAt(0)
                ?.toUpperCase()}
            </div>

            <div
              className={
                styles.sidebarUserInfo
              }
            >

              <strong>
                {usuario.nome}
              </strong>

              <span>
                {usuario.email}
              </span>

            </div>

          </div>

        )}

        <div className={styles.menuList}>

          {menus.map((m) => (

            <Link
              key={m.id_menu}
              href={m.rota}
              className={
                styles.menuItem
              }
              onClick={() =>
                setOpenMenu(false)
              }
            >

              {renderIcon(
                m.icone,
                18
              )}

              <span>
                {m.nome}
              </span>

            </Link>

          ))}

        </div>

      </aside>
    </>
  );
}