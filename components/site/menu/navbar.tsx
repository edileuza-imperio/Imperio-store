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
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const safeMenus = useMemo(() => {
    return Array.isArray(menus) ? menus : [];
  }, [menus]);

  const safeCategorias = useMemo<Categoria[]>(() => {
    if (catLoading || catErro) return [];
    return Array.isArray(categorias) ? (categorias as Categoria[]) : [];
  }, [catLoading, catErro, categorias]);

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

        <div className="navbar-desktop__bottom">
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

        {safeCategorias.length > 0 && (
          <div className="navbar-categorias">
            {safeCategorias
              .filter((cat) => !!cat?.nome)
              .map((cat) => {
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

                  <span className="mobile-dropdownChevron">
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
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="mobile-sidebarHeader">
          <h2 className="mobile-sidebarTitle">Categorias</h2>

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
          {safeCategorias.length > 0 ? (
            <nav>
              {safeCategorias
                .filter((cat) => !!cat?.nome)
                .map((cat) => {
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

                      <span>{cat.nome}</span>

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

      <style jsx>{`
        .navbar-erro {
          padding: 18px;
          text-align: center;
          color: #c62828;
          font-weight: 600;
        }

        .navbar-desktop {
          position: sticky;
          top: 0;
          z-index: 60;
          display: none;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(226, 210, 198, 0.8);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }

        .navbar-desktop.is-scrolled {
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.08);
        }

        .navbar-desktop__top {
          max-width: 1320px;
          margin: 0 auto;
          padding: 16px 20px;
          display: grid;
          grid-template-columns: 240px 1fr auto;
          gap: 18px;
          align-items: center;
        }

        .navbar-logo {
          text-decoration: none;
        }

        .navbar-logo__title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #2f241f;
          line-height: 1.1;
        }

        .navbar-logo__title span {
          color: #b55f53;
        }

        .navbar-logo__subtitle {
          margin-top: 2px;
          color: #8a6d61;
          font-size: 0.84rem;
          font-weight: 500;
        }

        .navbar-search {
          width: 100%;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .navbar-icon-btn,
        .navbar-login-btn {
          height: 46px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: 0.25s ease;
        }

        .navbar-icon-btn {
          width: 46px;
          background: #fff7f2;
          color: #5c4339;
          border: 1px solid #ead7cb;
        }

        .navbar-icon-btn:hover {
          transform: translateY(-2px);
          background: #fdf1ea;
        }

        .navbar-login-btn {
          padding: 0 18px;
          background: linear-gradient(135deg, #b55f53 0%, #d18b72 100%);
          color: white;
          font-weight: 700;
          box-shadow: 0 12px 22px rgba(181, 95, 83, 0.22);
        }

        .navbar-login-btn:hover {
          transform: translateY(-2px);
        }

        .navbar-account {
          position: relative;
        }

        .navbar-account__button {
          height: 46px;
          padding: 0 14px;
          border: 1px solid #ead7cb;
          background: #fff;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          color: #3f3029;
          font-weight: 700;
        }

        .navbar-account__avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d18b72 0%, #b55f53 100%);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .navbar-account__name {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rotate {
          transform: rotate(180deg);
          transition: transform 0.2s ease;
        }

        .navbar-account__menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 220px;
          background: white;
          border: 1px solid #efdfd5;
          border-radius: 18px;
          padding: 10px;
          box-shadow: 0 18px 34px rgba(0, 0, 0, 0.09);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .navbar-account__item {
          border: none;
          background: transparent;
          min-height: 44px;
          border-radius: 12px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          color: #41322c;
          font-weight: 600;
          text-align: left;
        }

        .navbar-account__item:hover {
          background: #fff6f1;
        }

        .navbar-account__item.danger {
          color: #c62828;
        }

        .navbar-desktop__bottom {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 20px 14px;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .navbar-link {
          text-decoration: none;
          color: #4a3730;
          font-weight: 700;
          padding: 10px 14px;
          border-radius: 12px;
          transition: 0.2s ease;
        }

        .navbar-link:hover {
          background: #fff2ea;
          color: #b55f53;
        }

        .navbar-categorias {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 20px 16px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .navbar-categoria-item {
          text-decoration: none;
          color: #59433a;
          background: #fff;
          border: 1px solid #f0dfd4;
          border-radius: 999px;
          padding: 10px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.92rem;
          font-weight: 600;
          transition: 0.22s ease;
        }

        .navbar-categoria-item:hover {
          background: #fff4ed;
          color: #b55f53;
          transform: translateY(-1px);
        }

        .mobile-header {
          position: sticky;
          top: 0;
          z-index: 70;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(230, 212, 201, 0.78);
          padding: 10px 12px 12px;
          display: block;
        }

        .mobile-header--scrolled {
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
        }

        .mobile-topBar {
          display: grid;
          grid-template-columns: 44px 1fr auto;
          align-items: center;
          gap: 10px;
        }

        .mobile-btn,
        .mobile-dropdownBtn {
          border: 1px solid #ead7cb;
          background: #fff8f4;
          color: #523b32;
          border-radius: 14px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-decoration: none;
        }

        .mobile-btn {
          width: 44px;
          position: relative;
        }

        .mobile-btn-badge {
          overflow: visible;
        }

        .mobile-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          background: #d32f2f;
          color: white;
          font-size: 0.66rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-logo {
          min-width: 0;
          text-decoration: none;
          text-align: center;
        }

        .mobile-logoTitle {
          font-size: 1.08rem;
          font-weight: 800;
          color: #2f241f;
          line-height: 1.1;
        }

        .mobile-logoAccent {
          color: #b55f53;
        }

        .mobile-logoSubtitle {
          font-size: 0.74rem;
          color: #8a6d61;
          margin-top: 2px;
        }

        .mobile-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .mobile-dropdown {
          position: relative;
        }

        .mobile-dropdownBtn {
          padding: 0 10px;
          gap: 8px;
          font-weight: 700;
        }

        .mobile-dropdownMenu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 210px;
          background: #fff;
          border: 1px solid #efdfd5;
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 18px 34px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mobile-dropdownItem {
          border: none;
          background: transparent;
          min-height: 42px;
          border-radius: 12px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          color: #41322c;
          font-weight: 600;
          text-align: left;
        }

        .mobile-dropdownItem:hover {
          background: #fff6f1;
        }

        .mobile-dropdownItem--danger {
          color: #c62828;
        }

        .mobile-searchWrap {
          margin-top: 10px;
        }

        .mobile-sidebarOverlay {
          position: fixed;
          inset: 0;
          z-index: 79;
          background: rgba(26, 18, 15, 0.42);
          backdrop-filter: blur(2px);
        }

        .mobile-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 80;
          background: linear-gradient(180deg, #fffaf7 0%, #fff2ea 100%);
          box-shadow: 18px 0 42px rgba(0, 0, 0, 0.14);
          overflow-y: auto;
        }

        .mobile-sidebarHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 16px;
          border-bottom: 1px solid #efdacf;
        }

        .mobile-sidebarTitle {
          margin: 0;
          font-size: 1.1rem;
          color: #322621;
        }

        .mobile-sidebarCloseBtn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid #ead7cb;
          background: white;
          cursor: pointer;
          color: #4b3730;
        }

        .mobile-sidebarContent {
          padding: 14px;
        }

        .mobile-categoryItem {
          text-decoration: none;
          color: #412f28;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid #eeddd2;
          border-radius: 16px;
          min-height: 52px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          font-weight: 600;
        }

        .mobile-categoryItem:hover {
          background: #fff7f2;
        }

        .mobile-categoryArrow {
          margin-left: auto;
        }

        .mobile-empty {
          padding: 24px 16px;
          text-align: center;
          color: #7f6559;
        }

        @media (min-width: 1024px) {
          .navbar-desktop {
            display: block;
          }

          .mobile-header,
          .mobile-sidebar,
          .mobile-sidebarOverlay {
            display: none;
          }
        }

        @media (max-width: 1023px) {
          .navbar-desktop {
            display: none;
          }
        }
      `}</style>
    </>
  );
}