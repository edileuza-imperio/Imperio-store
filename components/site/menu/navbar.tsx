"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "../Pesquisa/SearchBar";
import useUsuario from "@/hooks/Auth/useUsuario";
import { useMenu } from "@/hooks/menu/useMenu";
import useCategoria from "@/hooks/categoria/useCategoria";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { IconHelper } from "@/components/Bibioteca/icons/IconHelper";
import { Menu, MenuItem } from "@/components/Bibioteca/Bibiotecas";

interface Categoria {
  id_categoria?: number | string;
  nome?: string;
  slug?: string;
  icone?: string;
}

export default function Navbar() {
  const router = useRouter();

  const { menus, loading, error } = useMenu();
  const {
    categorias,
    loading: catLoading,
    erro: catErro,
  } = useCategoria();

  const {
    usuario,
    loading: usuarioLoading,
    logado,
    isAdmin,
  } = useUsuario();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const safeMenus = useMemo(() => {
    return Array.isArray(menus) ? menus : [];
  }, [menus]);

  const safeCategorias = useMemo<Categoria[]>(() => {
    if (catLoading || catErro) return [];
    return Array.isArray(categorias) ? (categorias as Categoria[]) : [];
  }, [catLoading, catErro, categorias]);

  const categoriasValidas = useMemo(() => {
    return safeCategorias.filter((cat) => !!cat?.nome);
  }, [safeCategorias]);

  const getMenuNome = (menu?: Partial<Menu>) =>
    String(menu?.nome || menu?.titulo || "").trim();

  const getItemNome = (item?: Partial<MenuItem>) =>
    String(item?.nome || item?.titulo || "").trim();

  const getItemRota = (item?: Partial<MenuItem>) => {
    const rota = String(item?.rota || "").trim();
    if (!rota || rota === "0") return "#";
    return rota;
  };

  const getMenuRota = (menu?: Partial<Menu>) => {
    const rota = String(menu?.rota || "").trim();
    if (!rota || rota === "0") return "#";
    return rota;
  };

  const isPainelAdministrativo = (item?: Partial<MenuItem>) => {
    const nome = String(item?.nome || item?.titulo || "")
      .trim()
      .toLowerCase();

    return nome.includes("painel administrativo");
  };

  const searchItem = useMemo(() => {
    return safeMenus.find((m) => !!m?.pesquisa_placeholder) ?? null;
  }, [safeMenus]);

  const searchPlaceholder =
    searchItem?.pesquisa_placeholder || "Buscar produtos...";

  const accountMenu = useMemo(() => {
    return safeMenus.find((m) => getMenuNome(m).toLowerCase() === "login");
  }, [safeMenus]);

  const carrinhoMenu = useMemo(() => {
    return safeMenus.find((m) => {
      const nome = getMenuNome(m).toLowerCase();
      return nome.includes("carrinho") || nome.includes("carrito");
    });
  }, [safeMenus]);

  const menusPrincipais = useMemo(() => {
    return safeMenus.filter((menu) => {
      const nome = getMenuNome(menu).toLowerCase();

      return (
        nome !== "login" &&
        !nome.includes("carrinho") &&
        !menu?.pesquisa_placeholder
      );
    });
  }, [safeMenus]);

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

  const tituloNavbar = "Universo Império";
  const subtituloNavbar = "Decorações & Eventos";

  const titleParts = tituloNavbar.split(" ");
  const first = titleParts[0] || "Universo";
  const rest = titleParts.slice(1).join(" ") || "Império";

  const carrinhoHref =
    carrinhoMenu && getMenuRota(carrinhoMenu) !== "#"
      ? getMenuRota(carrinhoMenu)
      : "/carrinho";

  const closeAll = () => {
    setSidebarOpen(false);
    setUserDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post(rotas.auth.logout, {}, { withCredentials: true });
    } catch (error) {
      console.warn("Logout falhou, seguindo fluxo local.", error);
    } finally {
      closeAll();
      router.replace(rotas.paginas.login);
      router.refresh();
    }
  };

  const handleAccountItem = async (item: MenuItem) => {
    setUserDropdownOpen(false);
    setSidebarOpen(false);

    if (!logado) {
      router.push(rotas.paginas.login);
      return;
    }

    if (isPainelAdministrativo(item) && !isAdmin) {
      return;
    }

    const titulo = String(item.titulo || item.nome || "").toLowerCase();

    if (titulo.includes("sair")) {
      await handleLogout();
      return;
    }

    const rota = getItemRota(item);
    if (rota !== "#") {
      router.push(rota);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userDropdownOpen) return;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserDropdownOpen(false);
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userDropdownOpen]);

  useEffect(() => {
    const getSidebarWidth = () => {
      if (typeof window === "undefined") return 340;

      const w = window.innerWidth;

      if (w <= 360) return Math.min(300, Math.floor(w * 0.94));
      if (w <= 480) return Math.min(340, Math.floor(w * 0.92));
      if (w <= 768) return Math.min(380, Math.floor(w * 0.86));

      return 380;
    };

    const sync = () => setSidebarWidth(getSidebarWidth());

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  if (loading) return null;

  if (error) {
    return <div className="navbar-erro">{error}</div>;
  }

  return (
    <>
      {/* DESKTOP */}
      <header className={`navbar-desktop ${scrolled ? "is-scrolled" : ""}`}>
        <div className="navbar-desktop__top">
          <Link href="/" onClick={closeAll} className="navbar-logo">
            <div className="navbar-logo__title">
              {first} <span>{rest}</span>
            </div>
            <div className="navbar-logo__subtitle">{subtituloNavbar}</div>
          </Link>

          <div className="navbar-search">
            <SearchBar placeholder={searchPlaceholder} className="w-100" />
          </div>

          <div className="navbar-actions" ref={dropdownRef}>
            <Link
              href={carrinhoHref}
              onClick={closeAll}
              className="navbar-icon-btn"
              title={getMenuNome(carrinhoMenu) || "Carrinho"}
            >
              {IconHelper.render({
                nome: carrinhoMenu?.icone || "carrito",
                size: 20,
              })}
            </Link>

            {!usuarioLoading && !logado && (
              <Link
                href={rotas.paginas.login}
                onClick={closeAll}
                className="navbar-login-btn"
              >
                Entrar
              </Link>
            )}

            {!usuarioLoading && logado && (
              <div className="navbar-account">
                <button
                  type="button"
                  className="navbar-account__button"
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  aria-expanded={userDropdownOpen}
                >
                  <span className="navbar-account__avatar">
                    {usuario?.nome?.charAt(0)?.toUpperCase() || "U"}
                  </span>

                  <span className="navbar-account__name">
                    {usuario?.nome?.split(" ")[0] || "Usuário"}
                  </span>

                  <span className={userDropdownOpen ? "rotate" : ""}>
                    {IconHelper.render({ nome: "down", size: 16 })}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="navbar-account__menu">
                    {accountItems.map((it) => {
                      const texto = getItemNome(it);
                      const isSair = texto.toLowerCase().includes("sair");

                      return (
                        <button
                          key={String(it.id || it.id_item || it.id_menu)}
                          type="button"
                          className={`navbar-account__item ${
                            isSair ? "danger" : ""
                          }`}
                          onClick={() => handleAccountItem(it)}
                        >
                          {IconHelper.render({
                            nome: it.icone || texto,
                            size: 18,
                          })}
                          <span>{texto}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-desktop__middle">
          <nav className="navbar-links">
            {menusPrincipais.map((menu) => {
              const rota = getMenuRota(menu);

              return (
                <Link
                  key={String(menu.id || menu.id_menu || menu.nome || menu.titulo)}
                  href={rota !== "#" ? rota : "/"}
                  className="navbar-link"
                >
                  {getMenuNome(menu)}
                </Link>
              );
            })}
          </nav>
        </div>

        {categoriasValidas.length > 0 && (
          <div className="navbar-categorias-wrap">
            <div className="navbar-categorias-label">Categorias</div>

            <div className="navbar-categorias">
              {categoriasValidas.map((cat) => {
                const slug = String(cat.slug || "").trim();
                const href = slug ? `/categoria/${slug}` : "#";

                return (
                  <Link
                    key={String(cat.id_categoria || slug || cat.nome)}
                    href={href}
                    className="navbar-categoria-item"
                  >
                    <span className="navbar-categoria-item__icon">
                      {IconHelper.render({
                        nome: cat.icone,
                        size: 16,
                      })}
                    </span>

                    <span>{cat.nome}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* MOBILE */}
      <header
        className={`mobile-header ${
          scrolled ? "mobile-header--scrolled" : ""
        }`}
      >
        <div className="mobile-topBar">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(true);
              setUserDropdownOpen(false);
            }}
            aria-label="Abrir menu"
            className="mobile-btn"
          >
            {IconHelper.render({ nome: "menu", size: 22 })}
          </button>

          <Link href="/" onClick={closeAll} className="mobile-logo">
            <div className="mobile-logoTitle">
              {first} <span className="mobile-logoAccent">{rest}</span>
            </div>

            <div className="mobile-logoSubtitle">{subtituloNavbar}</div>
          </Link>

          <div className="mobile-actions" ref={dropdownRef}>
            <Link
              href={carrinhoHref}
              onClick={closeAll}
              className="mobile-btn mobile-btn-badge"
              title={getMenuNome(carrinhoMenu) || "Carrinho"}
            >
              {IconHelper.render({
                nome: carrinhoMenu?.icone || "carrito",
                size: 20,
              })}
              <span className="mobile-badge">0</span>
            </Link>

            {!usuarioLoading && !logado && (
              <Link
                href={rotas.paginas.login}
                onClick={closeAll}
                className="mobile-btn"
                title={getMenuNome(accountMenu) || "Login"}
              >
                {IconHelper.render({
                  nome: accountMenu?.icone || "user",
                  size: 20,
                })}
              </Link>
            )}

            {!usuarioLoading && logado && (
              <div className="mobile-dropdown">
                <button
                  type="button"
                  className="mobile-dropdownBtn"
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  aria-expanded={userDropdownOpen}
                >
                  {IconHelper.render({
                    nome: accountMenu?.icone || "user",
                    size: 16,
                  })}

                  <span>{usuario?.nome?.split(" ")[0] || "Usuário"}</span>

                  <span className={`mobile-dropdownChevron ${userDropdownOpen ? "open" : ""}`}>
                    {IconHelper.render({
                      nome: "down",
                      size: 16,
                    })}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="mobile-dropdownMenu">
                    {accountItems.map((it) => {
                      const texto = getItemNome(it);
                      const isSair = texto.toLowerCase().includes("sair");

                      return (
                        <button
                          key={String(it.id || it.id_item || it.id_menu)}
                          type="button"
                          className={`mobile-dropdownItem ${
                            isSair ? "mobile-dropdownItem--danger" : ""
                          }`}
                          onClick={() => handleAccountItem(it)}
                        >
                          {IconHelper.render({
                            nome: it.icone || texto,
                            size: 18,
                          })}
                          <span>{texto}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mobile-searchWrap">
          <SearchBar placeholder={searchPlaceholder} className="w-100" />
        </div>

        {categoriasValidas.length > 0 && (
          <div className="mobile-categorias-scroll">
            {categoriasValidas.map((cat) => {
              const slug = String(cat.slug || "").trim();
              const href = slug ? `/categoria/${slug}` : "#";

              return (
                <Link
                  key={String(cat.id_categoria || slug || cat.nome)}
                  href={href}
                  className="mobile-categoria-chip"
                >
                  <span className="mobile-categoria-chip__icon">
                    {IconHelper.render({
                      nome: cat.icone,
                      size: 14,
                    })}
                  </span>
                  <span>{cat.nome}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {sidebarOpen && (
        <div
          className="mobile-sidebarOverlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className="mobile-sidebar"
        style={{
          width: `${sidebarWidth}px`,
          transform: sidebarOpen
            ? "translateX(0)"
            : `translateX(-${sidebarWidth}px)`,
          transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="mobile-sidebarHeader">
          <div>
            <h2 className="mobile-sidebarTitle">Explorar categorias</h2>
            <p className="mobile-sidebarSubTitle">
              Navegue por todas as categorias da loja
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="mobile-sidebarCloseBtn"
            aria-label="Fechar menu"
          >
            {IconHelper.render({ nome: "close", size: 20 })}
          </button>
        </div>

        <div className="mobile-sidebarContent">
          {categoriasValidas.length > 0 ? (
            <nav className="mobile-categoria-lista">
              {categoriasValidas.map((cat) => {
                const slug = String(cat.slug || "").trim();
                const href = slug ? `/categoria/${slug}` : "#";

                return (
                  <Link
                    key={String(cat.id_categoria || slug || cat.nome)}
                    href={href}
                    onClick={closeAll}
                    className="mobile-categoryItem"
                  >
                    <span className="mobile-categoryItemIcon">
                      {IconHelper.render({
                        nome: cat.icone,
                        size: 18,
                      })}
                    </span>

                    <span className="mobile-categoryItemText">{cat.nome}</span>

                    <span className="mobile-categoryArrow">
                      {IconHelper.render({ nome: "right", size: 16 })}
                    </span>
                  </Link>
                );
              })}
            </nav>
          ) : (
            <div className="mobile-empty">Nenhuma categoria disponível</div>
          )}
        </div>
      </aside>

    </>
  );
}