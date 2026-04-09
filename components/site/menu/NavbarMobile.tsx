"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "../Pesquisa/SearchBar";
import useUsuario from "@/hooks/Auth/useUsuario";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { IconHelper } from "@/components/Bibioteca/icons/IconHelper";
import { Menu, MenuItem } from "@/components/Bibioteca/Bibiotecas";
import CarrinhoQuantidade from "@/components/Carrinho/CarrinhoQuantidade";
import CarrinhoLateralDesktop from "../carrinho/CarrinhoLateralDesktop";


interface Categoria {
  id_categoria?: number | string;
  nome?: string;
  slug?: string;
  icone?: string;
}

interface NavbarMobileProps {
  menus: Menu[];
  categorias: Categoria[];
  searchPlaceholder?: string;
  tituloNavbar?: string | null;
  subtituloNavbar?: string | null;
}

export default function NavbarMobile({
  menus,
  categorias,
  searchPlaceholder,
  tituloNavbar,
  subtituloNavbar,
}: NavbarMobileProps) {
  const router = useRouter();

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
  const [cartOpen, setCartOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

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

  const isCartIcon = (icone?: string | null) => {
    const name = String(icone || "").toLowerCase();
    return (
      name.includes("bi-cart") ||
      name.includes("cart") ||
      name.includes("carrito") ||
      name.includes("carrinho")
    );
  };

  const searchMenu = menus?.find((m) => !!m.pesquisa_placeholder);

  const accountMenu = menus?.find(
    (m) => getMenuNome(m).toLowerCase() === "login"
  );

  const carrinhoMenu = menus?.find((m) => {
    const nome = getMenuNome(m).toLowerCase();
    return nome.includes("carrinho") || nome.includes("carrito");
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

  const titleParts = (tituloNavbar || "Universo Império").split(" ");
  const first = titleParts[0] || "Universo";
  const rest = titleParts.slice(1).join(" ") || "Império";

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
      setScrolled(window.scrollY > 10);
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

  const carrinhoHref =
    carrinhoMenu && getMenuRota(carrinhoMenu) !== "#"
      ? getMenuRota(carrinhoMenu)
      : "/carrinho";

  return (
    <>
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

            <div className="mobile-logoSubtitle">
              {subtituloNavbar || "Decorações & Eventos"}
            </div>
          </Link>

          <div className="mobile-actions" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                closeAll();
                setCartOpen(true);
              }}
              className="mobile-btn mobile-btn-badge"
              title={getMenuNome(carrinhoMenu) || "Carrinho"}
              aria-label={getMenuNome(carrinhoMenu) || "Abrir carrinho"}
            >
              {isCartIcon(carrinhoMenu?.icone) ? (
                <CarrinhoQuantidade size={20} />
              ) : (
                IconHelper.render({
                  nome: carrinhoMenu?.icone || "carrito",
                  size: 20,
                })
              )}
            </button>

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
                      className: userDropdownOpen ? "open" : "",
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

        {(searchMenu || searchPlaceholder) && (
          <div className="mobile-searchWrap">
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
          {categorias && categorias.length > 0 ? (
            <nav>
              {[...categorias]
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

                      <span style={{ marginLeft: "auto" }}>
                        {IconHelper.render({ nome: "right", size: 16 })}
                      </span>
                    </Link>
                  );
                })}
            </nav>
          ) : (
            <div
              style={{
                padding: "20px 16px",
                textAlign: "center",
                color: "var(--color-textMuted)",
              }}
            >
              Nenhuma categoria disponível
            </div>
          )}
        </div>
      </aside>

      <CarrinhoLateralDesktop
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}