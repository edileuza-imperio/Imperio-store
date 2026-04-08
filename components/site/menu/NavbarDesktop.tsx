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
  FiX,
  FiArrowRight,
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
  const [openCartDrawer, setOpenCartDrawer] = useState(false);

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
        setOpenCartDrawer(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (openCartDrawer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [openCartDrawer]);

  const irParaLogin = () => {
    setOpenUserDropdown(false);
    setOpenMenuId(null);
    setOpenCartDrawer(false);
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

  const isCarrinhoMenu = (menu?: Partial<Menu>) => {
    const nome = getMenuNome(menu).toLowerCase();
    return (
      nome.includes("carrinho") ||
      nome.includes("carrito") ||
      isCartIcon(menu?.icone)
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
    setOpenCartDrawer(false);

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

    const rota = getItemRota(item);
    if (rota !== "#") {
      router.push(rota);
    }
  };

  const abrirCarrinho = () => {
    setOpenUserDropdown(false);
    setOpenMenuId(null);
    setOpenCartDrawer(true);
  };

  const fecharCarrinho = () => {
    setOpenCartDrawer(false);
  };

  return (
    <>
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
                const isCartMenu = isCarrinhoMenu(m);

                if (hasItens) {
                  return (
                    <div key={menuId} className="ui-dropdown">
                      <button
                        type="button"
                        className="ui-pill ui-pill--primary ui-userBtn"
                        onClick={() => handleProtectedDropdown(menuId)}
                      >
                        <span className="ui-pillIcon">
                          {renderMenuIcon(m.icone)}
                        </span>
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

                if (isCartMenu) {
                  return (
                    <button
                      key={menuId}
                      type="button"
                      className="ui-link ui-linkButton"
                      onClick={abrirCarrinho}
                    >
                      <span className="ui-pill ui-pill--primary">
                        <span className="ui-pillIcon">
                          {renderMenuIcon(m.icone)}
                        </span>
                        <span className="ui-pillText">{getMenuNome(m)}</span>
                      </span>
                    </button>
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
                      className="ui-link ui-linkButton"
                      onClick={irParaLogin}
                    >
                      <span className="ui-pill ui-pill--primary">
                        <span className="ui-pillIcon">
                          {renderMenuIcon(m.icone)}
                        </span>
                        <span className="ui-pillText">{getMenuNome(m)}</span>
                      </span>
                    </button>
                  );
                }

                return (
                  <Link key={menuId} href={rota} className="ui-link">
                    <span className="ui-pill ui-pill--primary">
                      <span className="ui-pillIcon">
                        {renderMenuIcon(m.icone)}
                      </span>
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

      <div
        className={`cart-drawer-overlay ${openCartDrawer ? "is-open" : ""}`}
        onClick={fecharCarrinho}
      />

      <aside className={`cart-drawer ${openCartDrawer ? "is-open" : ""}`}>
        <div className="cart-drawer-header">
          <div className="cart-drawer-titleWrap">
            <div className="cart-drawer-icon">
              <FiShoppingCart size={20} />
            </div>
            <div>
              <h3 className="cart-drawer-title">Seu carrinho</h3>
              <p className="cart-drawer-subtitle">
                Veja seus itens antes de finalizar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fecharCarrinho}
            className="cart-drawer-close"
            aria-label="Fechar carrinho"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="cart-drawer-body">
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <FiShoppingCart size={28} />
            </div>

            <h4 className="cart-empty-title">Seu carrinho está vazio</h4>

            <p className="cart-empty-text">
              Adicione produtos para visualizar o resumo da compra aqui.
            </p>

            <button
              type="button"
              className="cart-empty-button"
              onClick={fecharCarrinho}
            >
              Continuar comprando
            </button>
          </div>

          {/*
            Quando você quiser puxar os itens reais,
            aqui entra o map do carrinho.
          */}
        </div>

        <div className="cart-drawer-footer">
          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>R$ 0,00</strong>
            </div>
          </div>

          <div className="cart-actions">
            <Link
              href="/carrinho"
              className="cart-secondary-btn"
              onClick={fecharCarrinho}
            >
              Ver carrinho completo
            </Link>

            <Link
              href="/checkout"
              className="cart-primary-btn"
              onClick={fecharCarrinho}
            >
              Finalizar compra
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .ui-linkButton {
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
        }

        .cart-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.42);
          backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.28s ease, visibility 0.28s ease;
          z-index: 9998;
        }

        .cart-drawer-overlay.is-open {
          opacity: 1;
          visibility: visible;
        }

        .cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: min(420px, 92vw);
          height: 100vh;
          background: linear-gradient(180deg, #ffffff 0%, #fffaf7 100%);
          box-shadow: -24px 0 60px rgba(15, 23, 42, 0.18);
          border-left: 1px solid rgba(148, 163, 184, 0.18);
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 9999;
          display: flex;
          flex-direction: column;
        }

        .cart-drawer.is-open {
          transform: translateX(0);
        }

        .cart-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 20px 20px 18px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px);
        }

        .cart-drawer-titleWrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cart-drawer-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #8b5e3c;
          background: linear-gradient(135deg, #f7e5d8 0%, #efd3bf 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .cart-drawer-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #1e293b;
        }

        .cart-drawer-subtitle {
          margin: 3px 0 0;
          font-size: 0.92rem;
          color: #64748b;
        }

        .cart-drawer-close {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: #fff;
          color: #334155;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cart-drawer-close:hover {
          transform: translateY(-1px);
          background: #f8fafc;
        }

        .cart-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .cart-empty {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px 12px;
        }

        .cart-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          margin-bottom: 18px;
          color: #8b5e3c;
          background: linear-gradient(135deg, #f6e7db 0%, #f2d6c3 100%);
          box-shadow: 0 12px 30px rgba(139, 94, 60, 0.16);
        }

        .cart-empty-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
        }

        .cart-empty-text {
          margin: 10px 0 0;
          max-width: 280px;
          line-height: 1.6;
          color: #64748b;
          font-size: 0.96rem;
        }

        .cart-empty-button {
          margin-top: 18px;
          border: 0;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 700;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(135deg, #b77b56 0%, #8b5e3c 100%);
          box-shadow: 0 12px 24px rgba(139, 94, 60, 0.22);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .cart-empty-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 28px rgba(139, 94, 60, 0.28);
        }

        .cart-drawer-footer {
          border-top: 1px solid rgba(148, 163, 184, 0.16);
          padding: 18px 20px 20px;
          background: #fff;
        }

        .cart-summary {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 16px;
          padding: 14px 16px;
          background: #fcfcfd;
        }

        .cart-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #334155;
          font-size: 0.97rem;
        }

        .cart-summary-row strong {
          font-size: 1.05rem;
          color: #0f172a;
        }

        .cart-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 14px;
        }

        .cart-secondary-btn,
        .cart-primary-btn {
          width: 100%;
          border-radius: 14px;
          padding: 13px 16px;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .cart-secondary-btn {
          border: 1px solid rgba(148, 163, 184, 0.22);
          color: #334155;
          background: #fff;
        }

        .cart-secondary-btn:hover {
          background: #f8fafc;
          transform: translateY(-1px);
        }

        .cart-primary-btn {
          border: 0;
          color: #fff;
          background: linear-gradient(135deg, #b77b56 0%, #8b5e3c 100%);
          box-shadow: 0 14px 26px rgba(139, 94, 60, 0.22);
        }

        .cart-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 32px rgba(139, 94, 60, 0.28);
        }
      `}</style>
    </>
  );
}