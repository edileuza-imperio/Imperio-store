"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useEffect, useRef, useState } from "react";

import SearchBar from "../Pesquisa/SearchBar";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

import {
  FiUser,
  FiChevronDown,
} from "react-icons/fi";

import {
  Menu,
  MenuItem,
} from "@/components/Bibioteca/Bibiotecas";

import useUsuario from "@/hooks/Auth/useUsuario";

import CarrinhoQuantidade from "@/components/Carrinho/CarrinhoQuantidade";

import { IconHelper } from "@/components/Bibioteca/icons/IconHelper";

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

  const [openUserDropdown, setOpenUserDropdown] =
    useState(false);

  const [openMenuId, setOpenMenuId] =
    useState<number | null>(null);

  const [scrolled, setScrolled] =
    useState(false);

  const headerRef =
    useRef<HTMLElement | null>(null);

  /* =========================================================
     SCROLL
  ========================================================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  /* =========================================================
     CLICK OUTSIDE
  ========================================================= */

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current) return;

      if (
        !headerRef.current.contains(
          e.target as Node
        )
      ) {
        setOpenUserDropdown(false);
        setOpenMenuId(null);
      }
    };

    const onKey = (
      e: KeyboardEvent
    ) => {
      if (e.key === "Escape") {
        setOpenUserDropdown(false);
        setOpenMenuId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      onDown
    );

    document.addEventListener(
      "keydown",
      onKey
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        onDown
      );

      document.removeEventListener(
        "keydown",
        onKey
      );
    };
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const titleParts = (
    tituloNavbar ||
    "Universo Império"
  ).split(" ");

  const first =
    titleParts[0] || "Universo";

  const rest =
    titleParts.slice(1).join(" ") ||
    "Império";

  const getMenuNome = (
    menu?: Partial<Menu>
  ) =>
    String(
      menu?.nome ||
        menu?.titulo ||
        ""
    ).trim();

  const getMenuId = (
    menu?: Partial<Menu>
  ) =>
    Number(
      menu?.id_menu ||
        menu?.id ||
        0
    );

  const getItemNome = (
    item?: Partial<MenuItem>
  ) =>
    String(
      item?.nome ||
        item?.titulo ||
        ""
    ).trim();

  const getItemId = (
    item?: Partial<MenuItem>
  ) =>
    Number(
      item?.id_item ||
        item?.id ||
        0
    );

  const getMenuRota = (
    menu?: Partial<Menu>
  ) => {
    const rota = String(
      menu?.rota || ""
    ).trim();

    if (!rota || rota === "0") {
      return "#";
    }

    return rota;
  };

  const getItemRota = (
    item?: Partial<MenuItem>
  ) => {
    const rota = String(
      item?.rota || ""
    ).trim();

    if (!rota || rota === "0") {
      return "#";
    }

    return rota;
  };

  const isPainelAdministrativo = (
    item?: Partial<MenuItem>
  ) => {
    const nome = String(
      item?.nome ||
        item?.titulo ||
        ""
    )
      .trim()
      .toLowerCase();

    return nome.includes(
      "painel administrativo"
    );
  };

  const isCartIcon = (
    icone?: string | null
  ) => {
    const name = String(
      icone || ""
    ).toLowerCase();

    return (
      name.includes("bi-cart") ||
      name.includes("cart") ||
      name.includes("carrito") ||
      name.includes("carrinho")
    );
  };

  const isCarrinhoMenu = (
    menu?: Partial<Menu>
  ) => {
    const nome =
      getMenuNome(menu).toLowerCase();

    return (
      nome.includes("carrinho") ||
      nome.includes("carrito") ||
      isCartIcon(menu?.icone)
    );
  };

  /* =========================================================
     MENUS
  ========================================================= */

  const searchMenu = menus.find(
    (m) => m.pesquisa_placeholder
  );

  const accountMenu = menus.find(
    (m) =>
      getMenuNome(m).toLowerCase() ===
      "login"
  );

  const mainMenus = menus.filter(
    (m) => {
      if (m.pesquisa_placeholder) {
        return false;
      }

      const nome =
        getMenuNome(m).toLowerCase();

      if (
        nome === "login" &&
        logado
      ) {
        return false;
      }

      return true;
    }
  );

  const accountItems = useMemo(() => {
    const itens =
      accountMenu?.itens || [];

    return [...itens]
      .filter((item) => {
        if (
          isPainelAdministrativo(
            item
          )
        ) {
          return isAdmin;
        }

        return true;
      })
      .sort(
        (a, b) =>
          (a.posicao ?? 0) -
          (b.posicao ?? 0)
      );
  }, [accountMenu, isAdmin]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const irParaLogin = () => {
    setOpenUserDropdown(false);
    setOpenMenuId(null);

    router.push(rotas.paginas.login);
  };

  const abrirCarrinho = () => {
    setOpenUserDropdown(false);
    setOpenMenuId(null);

    router.push("/Carrinho");
  };

  const handleProtectedDropdown = (
    menuId: number
  ) => {
    if (usuarioLoading) return;

    if (!logado) {
      irParaLogin();
      return;
    }

    setOpenMenuId((prev) =>
      prev === menuId ? null : menuId
    );
  };

  const handleAccountItem = async (
    item: MenuItem
  ) => {
    setOpenUserDropdown(false);
    setOpenMenuId(null);

    if (!logado) {
      irParaLogin();
      return;
    }

    const titulo = String(
      item.titulo ||
        item.nome ||
        ""
    ).toLowerCase();

    if (titulo.includes("sair")) {
      try {
        await api.post(
          rotas.auth.logout,
          {},
          {
            withCredentials: true,
          }
        );
      } catch (e) {
        console.error(e);
      } finally {
        router.replace(
          rotas.paginas.login
        );

        router.refresh();
      }

      return;
    }

    const rota = getItemRota(item);

    if (rota !== "#") {
      router.push(rota);
    }
  };

  /* =========================================================
     ICONS
  ========================================================= */

  const renderMenuIcon = (
    icone?: string | null
  ) => {
    if (isCartIcon(icone)) {
      return (
        <CarrinhoQuantidade size={18} />
      );
    }

    return IconHelper.render({
      nome: icone,
      size: 18,
    });
  };

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <header
      ref={headerRef as any}
      className={`ui-navbar ${
        scrolled
          ? "ui-navbar--scrolled"
          : ""
      }`}
    >
      <div className="ui-navbar-container">

        {/* ========================================= */}
        {/* LOGO */}
        {/* ========================================= */}

        <Link
          href="/"
          className="ui-brand"
        >
          <div className="ui-title">
            <span className="ui-titleFirst">
              {first}
            </span>

            <span className="ui-titleAccent">
              {rest}
            </span>

            <span className="ui-dot" />
          </div>

          <div className="ui-subtitle">
            {subtituloNavbar ||
              "Decorações & Eventos"}
          </div>
        </Link>

        {/* ========================================= */}
        {/* SEARCH */}
        {/* ========================================= */}

        {(searchMenu ||
          searchPlaceholder) && (
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

        {/* ========================================= */}
        {/* ACTIONS */}
        {/* ========================================= */}

        <nav className="ui-actions">
          <div className="ui-mainMenus">

            {mainMenus.map((m) => {
              const menuId =
                getMenuId(m);

              const itens = [
                ...(m.itens || []),
              ].sort(
                (a, b) =>
                  (a.posicao ?? 0) -
                  (b.posicao ?? 0)
              );

              const hasItens =
                itens.length > 0;

              const isOpen =
                openMenuId === menuId;

              const isCartMenu =
                isCarrinhoMenu(m);

              /* ========================================= */
              /* DROPDOWN */
              /* ========================================= */

              if (hasItens) {
                return (
                  <div
                    key={menuId}
                    className="ui-dropdown"
                  >
                    <button
                      type="button"
                      className="ui-pill ui-pill--primary ui-userBtn"
                      onClick={() =>
                        handleProtectedDropdown(
                          menuId
                        )
                      }
                    >
                      <span className="ui-pillIcon">
                        {renderMenuIcon(
                          m.icone
                        )}
                      </span>

                      <span className="ui-pillText">
                        {getMenuNome(m)}
                      </span>

                      <FiChevronDown
                        size={16}
                        className={`ui-chevIcon ${
                          isOpen
                            ? "open"
                            : ""
                        }`}
                      />
                    </button>

                    {logado && isOpen && (
                      <div className="ui-menu">
                        {itens.map((it) => (
                          <button
                            key={getItemId(
                              it
                            )}
                            type="button"
                            className="ui-item"
                            onClick={() =>
                              handleAccountItem(
                                it
                              )
                            }
                          >
                            <span className="ui-itemIcon">
                              {renderMenuIcon(
                                it.icone
                              )}
                            </span>

                            <span className="ui-itemText">
                              {getItemNome(
                                it
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              /* ========================================= */
              /* CARRINHO */
              /* ========================================= */

              if (isCartMenu) {
                return (
                  <button
                    key={menuId}
                    type="button"
                    className="ui-linkButton"
                    onClick={
                      abrirCarrinho
                    }
                  >
                    <span className="ui-pill ui-pill--primary">
                      <span className="ui-pillIcon">
                        {renderMenuIcon(
                          m.icone
                        )}
                      </span>

                      <span className="ui-pillText">
                        {getMenuNome(m)}
                      </span>
                    </span>
                  </button>
                );
              }

              /* ========================================= */
              /* LOGIN */
              /* ========================================= */

              const nomeMenu =
                getMenuNome(
                  m
                ).toLowerCase();

              if (
                nomeMenu === "login" &&
                !logado
              ) {
                return (
                  <button
                    key={menuId}
                    type="button"
                    className="ui-linkButton"
                    onClick={
                      irParaLogin
                    }
                  >
                    <span className="ui-pill ui-pill--secondary">
                      <span className="ui-pillIcon">
                        {renderMenuIcon(
                          m.icone
                        )}
                      </span>

                      <span className="ui-pillText">
                        Entrar
                      </span>
                    </span>
                  </button>
                );
              }

              /* ========================================= */
              /* LINK NORMAL */
              /* ========================================= */

              return (
                <Link
                  key={menuId}
                  href={getMenuRota(m)}
                  className="ui-link"
                >
                  <span className="ui-pill ui-pill--primary">
                    <span className="ui-pillIcon">
                      {renderMenuIcon(
                        m.icone
                      )}
                    </span>

                    <span className="ui-pillText">
                      {getMenuNome(m)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ========================================= */}
          {/* USER */}
          {/* ========================================= */}

          {!usuarioLoading &&
            logado &&
            accountItems.length > 0 && (
              <div className="ui-dropdown">
                <button
                  type="button"
                  className="ui-pill ui-pill--secondary ui-userBtn"
                  onClick={() =>
                    setOpenUserDropdown(
                      (v) => !v
                    )
                  }
                >
                  <span className="ui-pillIcon">
                    <FiUser size={18} />
                  </span>

                  <span className="ui-pillText ui-strong">
                    {usuario?.nome?.split(
                      " "
                    )[0] || "Usuário"}
                  </span>

                  <FiChevronDown
                    size={16}
                    className={`ui-chevIcon ${
                      openUserDropdown
                        ? "open"
                        : ""
                    }`}
                  />
                </button>

                {openUserDropdown && (
                  <div className="ui-menu">
                    {accountItems.map(
                      (it) => {
                        const texto =
                          String(
                            it.titulo ||
                              it.nome ||
                              ""
                          );

                        const isSair =
                          texto
                            .toLowerCase()
                            .includes(
                              "sair"
                            );

                        return (
                          <button
                            key={String(
                              it.id ||
                                it.id_item
                            )}
                            className={`ui-item ${
                              isSair
                                ? "ui-item--danger"
                                : ""
                            }`}
                            onClick={() =>
                              handleAccountItem(
                                it
                              )
                            }
                          >
                            <span className="ui-itemIcon">
                              {renderMenuIcon(
                                it.icone
                              )}
                            </span>

                            <span className="ui-itemText">
                              {texto}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}
        </nav>
      </div>
    </header>
  );
}