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
  const { usuario, loading: usuarioLoading, logado, isAdmin } = useUsuario();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [scrolled, setScrolled] = useState(false);

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

    return [...itens]
      .filter((item) => {
        if (isPainelAdministrativo(item)) return isAdmin;
        return true;
      })
      .sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0));
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
      console.warn("Logout falhou", error);
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

    const titulo = String(item.titulo || item.nome || "").toLowerCase();

    if (titulo.includes("sair")) {
      await handleLogout();
      return;
    }

    const rota = getItemRota(item);
    if (rota !== "#") router.push(rota);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userDropdownOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userDropdownOpen]);

  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth;
      setSidebarWidth(w <= 360 ? 300 : w <= 480 ? 340 : 360);
    };

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const carrinhoHref =
    carrinhoMenu && getMenuRota(carrinhoMenu) !== "#"
      ? getMenuRota(carrinhoMenu)
      : "/Carrinho";

  return (
    <>
      <header className={`mobile-header ${scrolled ? "mobile-header--scrolled" : ""}`}>
        <div className="mobile-topBar">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="mobile-btn"
            aria-label="Abrir categorias"
          >
            {IconHelper.render({ nome: "menu", size: 22 })}
          </button>

          <Link href="/" className="mobile-logo" onClick={closeAll}>
            <div className="mobile-logoTitle">
              {first} <span className="mobile-logoAccent">{rest}</span>
            </div>
            <div className="mobile-logoSubtitle">
              {subtituloNavbar || "Decorações & Eventos"}
            </div>
          </Link>

          <div className="mobile-actions" ref={dropdownRef}>
            <Link
              href={carrinhoHref}
              className="mobile-btn mobile-btn-badge"
              title="Carrinho"
              aria-label="Ir para o carrinho"
            >
              {isCartIcon(carrinhoMenu?.icone) ? (
                <CarrinhoQuantidade size={20} />
              ) : (
                IconHelper.render({
                  nome: carrinhoMenu?.icone || "carrito",
                  size: 20,
                })
              )}
            </Link>

            {!usuarioLoading && !logado && (
              <Link href={rotas.paginas.login} className="mobile-btn" aria-label="Entrar">
                {IconHelper.render({ nome: "user", size: 20 })}
              </Link>
            )}

            {!usuarioLoading && logado && (
              <div className="mobile-dropdown">
                <button
                  className="mobile-dropdownBtn"
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  type="button"
                  aria-expanded={userDropdownOpen}
                >
                  {IconHelper.render({ nome: "user", size: 18 })}
                  <span style={{ marginLeft: 8 }}>
                    {usuario?.nome?.split(" ")[0] || "Usuário"}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="mobile-dropdownMenu">
                    {accountItems.map((it) => (
                      <button
                        key={String(it.id)}
                        className="mobile-dropdownItem"
                        onClick={() => handleAccountItem(it)}
                        type="button"
                      >
                        <span>{getItemNome(it)}</span>
                      </button>
                    ))}
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
        }}
      >
        <div className="mobile-sidebarHeader">
          <h2>Categorias</h2>
          <button
            type="button"
            className="mobile-sidebarCloseBtn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar categorias"
          >
            ✕
          </button>
        </div>

        <div className="mobile-sidebarContent">
          {categorias?.map((cat) => (
            <Link
              key={cat.id_categoria}
              href={cat.slug ? `/categoria/${cat.slug}` : "#"}
              onClick={closeAll}
              className="mobile-categoryItem"
            >
              {cat.icone && (
                <span className="mobile-categoryItemIcon">
                  {IconHelper.render({ nome: cat.icone, size: 18 })}
                </span>
              )}
              <span>{cat.nome}</span>
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}