"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";

import api from "@/Api/conectar";

import { imagemFundo } from "@/components/Bibioteca/imagem";

import type { IconType } from "react-icons";
import {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
  FiMenu,
  FiHome,
  FiShoppingBag,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiHeart,
  FiPackage,
  FiUserPlus,
  FiLock,
  FiGrid,
  FiEdit,
  FiList,
  FiCreditCard,
  FiMapPin,
  FiTruck,
} from "react-icons/fi";
import {
  BiUserCircle,
  BiLogOut,
  BiShoppingBag,
  BiHome,
  BiCategory,
  BiStore,
} from "react-icons/bi";

import { Menu, Usuario } from "@/components/site/menu/menu";
import "./../../../styles/navbar/menu.css";
import { rotas } from "@/components/Bibioteca/config/rotas";

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

type FloatingStyle = {
  top: number;
  left: number;
  width: number;
  arrowLeft: number;
};

type CarrinhoItem = {
  id_carrinho_item: number;
  carrinho_id: number;
  produto_id: number;
  produto_nome: string;
  produto_slug?: string | null;
  imagem?: string | null;
  quantidade: number;
  preco_unitario: number;
  preco_promocional_unitario?: number | null;
  subtotal: number;
};

const ICONS: Record<string, IconType> = {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
  FiMenu,
  FiHome,
  FiShoppingBag,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiHeart,
  FiPackage,
  FiUserPlus,
  FiLock,
  FiGrid,
  FiEdit,
  FiList,
  FiCreditCard,
  FiMapPin,
  FiTruck,
  BiUserCircle,
  BiLogOut,
  BiShoppingBag,
  BiHome,
  BiCategory,
  BiStore,
};

function getIcon(name?: string | null, size = 16) {
  const iconName = (name ?? "").trim();
  if (!iconName) return null;

  const Icon = ICONS[iconName];
  if (!Icon) return null;

  return <Icon size={size} aria-hidden="true" focusable="false" />;
}

function corrigirRota(rota?: string | null, fallback = "#") {
  const valor = (rota || fallback).trim();

  if (valor === "/carrinho") return "/Carrinho";
  if (valor === "/pedidos") return "/pedido";
  if (valor === "/Pedido") return "/pedido";

  return valor;
}

function pegarDados<T>(res: any): T {
  return (
    res?.data?.dados?.dados ??
    res?.data?.dados?.lista ??
    res?.data?.dados?.itens ??
    res?.data?.dados ??
    res?.data ??
    []
  ) as T;
}

function formatarMoeda(valor?: number | string | null) {
  const numero = Number(valor ?? 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
  const [openCart, setOpenCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartItens, setCartItens] = useState<CarrinhoItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [floatingStyle, setFloatingStyle] = useState<FloatingStyle | null>(null);

  const desktopUserBtnRef = useRef<HTMLButtonElement | null>(null);
  const mobileUserBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const safePesquisa = (pesquisa ?? "").trim();
  const rotaCarrinho = corrigirRota(carrinho?.rota, "/Carrinho");

  const totalCarrinho = useMemo(() => {
    return cartItens.reduce((total, item) => {
      const subtotal = Number(item.subtotal ?? 0);

      if (subtotal > 0) return total + subtotal;

      const preco =
        item.preco_promocional_unitario && item.preco_promocional_unitario > 0
          ? item.preco_promocional_unitario
          : item.preco_unitario;

      return total + Number(preco ?? 0) * Number(item.quantidade ?? 1);
    }, 0);
  }, [cartItens]);

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
      href: "/pedido",
      icon: <FiShoppingBag size={18} aria-hidden="true" focusable="false" />,
    },
    {
      label: "Ajuda",
      href: "/contato",
      icon: <FiHelpCircle size={18} aria-hidden="true" focusable="false" />,
    },
    {
      label: "Carrinho",
      href: rotaCarrinho,
      icon: <FiShoppingCart size={18} aria-hidden="true" focusable="false" />,
      badge: quantidadeCarrinho > 0 ? quantidadeCarrinho : 0,
      action: "cart",
    },
  ];

  const closeMenu = () => setOpenMenu(false);

  const openSidebar = () => {
    setDropdown(false);
    setOpenCart(false);
    setOpenMenu(true);
  };

  const toggleUserDropdown = () => {
    setOpenMenu(false);
    setOpenCart(false);
    setDropdown(!dropdown);
  };

  async function carregarItensCarrinho() {
    try {
      setCartLoading(true);

      const res = await api.get(rotas.carrinho.itens);
      const dados = pegarDados<CarrinhoItem[]>(res);

      setCartItens(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
      setCartItens([]);
    } finally {
      setCartLoading(false);
    }
  }

  async function abrirCarrinhoLateral() {
    setDropdown(false);
    setOpenMenu(false);
    setOpenCart(true);
    await carregarItensCarrinho();
  }

  function fecharCarrinhoLateral() {
    setOpenCart(false);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menuLock", openMenu || openCart);

    return () => {
      document.body.classList.remove("menuLock");
    };
  }, [openMenu, openCart]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(false);
        setOpenCart(false);
        setDropdown(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setDropdown]);

  useEffect(() => {
    const atualizar = () => {
      if (openCart) carregarItensCarrinho();
    };

    window.addEventListener("carrinhoAtualizado", atualizar);

    return () => {
      window.removeEventListener("carrinhoAtualizado", atualizar);
    };
  }, [openCart]);

  useLayoutEffect(() => {
    if (!dropdown) return;

    const updatePosition = () => {
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth <= 991;

      const btn = isMobile
        ? mobileUserBtnRef.current
        : desktopUserBtnRef.current;

      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const menuWidth = isMobile ? 220 : 240;
      const gap = isMobile ? 10 : 6;
      const margin = 12;

      let left = rect.right - menuWidth;

      left = Math.max(
        margin,
        Math.min(left, viewportWidth - menuWidth - margin)
      );

      const buttonCenter = rect.left + rect.width / 2;

      const arrowLeft = Math.max(
        18,
        Math.min(buttonCenter - left - 6, menuWidth - 30)
      );

      setFloatingStyle({
        top: rect.bottom + gap,
        left,
        width: menuWidth,
        arrowLeft,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [dropdown]);

  useEffect(() => {
    if (!dropdown) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (desktopUserBtnRef.current?.contains(target)) return;
      if (mobileUserBtnRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;

      setDropdown(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [dropdown, setDropdown]);

  const renderDropdownMenu = () => {
    if (!dropdown || !mounted || !floatingStyle) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        className="floatingDropdown"
        role="menu"
        style={{
          position: "fixed",
          top: floatingStyle.top,
          left: floatingStyle.left,
          width: floatingStyle.width,
          zIndex: 13000,
          ["--dropdown-arrow-left" as any]: `${floatingStyle.arrowLeft}px`,
        }}
      >
        <div className="floatingDropdownArrow" aria-hidden="true" />

        {loginItems.length === 0 && (
          <span className="floatingDropdownEmpty">
            Nenhuma opção disponível
          </span>
        )}

        {loginItems.map((item) => {
          const nome = (item.nome ?? "").toLowerCase().trim();
          const sair = nome === "sair";

          if (sair) {
            return (
              <button
                key={item.id_item}
                onClick={() => {
                  setDropdown(false);
                  logout();
                }}
                className="floatingDropdownItem danger"
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
              href={corrigirRota(item.rota, "#")}
              className="floatingDropdownItem"
              onClick={() => setDropdown(false)}
              role="menuitem"
            >
              {getIcon(item.icone, 16)}
              <span>{item.nome ?? "Item"}</span>
            </Link>
          );
        })}
      </div>,
      document.body
    );
  };

  return (
    <>
      <header className={`header ${scrolled ? "headerScrolled" : ""}`}>
        <div className="desktopNavbar">
          <div className="brand">
            <Link href="/" className="logo" aria-label="Ir para a página inicial">
              <span className="logoDark">{titulo1 || "Universo"}</span>
              <span className="logoPink">{titulo2 || "Império"}</span>
            </Link>

            <span className="subtitle">{subtitulo || ""}</span>
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

              {safePesquisa !== "" && (
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
                  ref={desktopUserBtnRef}
                  className="userBtn"
                  onClick={toggleUserDropdown}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario?.nome ?? ""}`}
                >
                  <div className="userAvatar">
                    {(usuario?.nome ?? "?").charAt(0)?.toUpperCase()}
                  </div>

                  <div className="userInfo">
                    <span>Olá,</span>
                    <strong>{usuario?.nome ?? "Usuário"}</strong>
                  </div>
                </button>
              </div>
            ) : (
              login && (
                <Link
                  href={corrigirRota(login.rota, "#")}
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
              <button
                type="button"
                className="cartButton"
                onClick={abrirCarrinhoLateral}
                aria-label="Abrir carrinho de compras"
                title="Carrinho"
              >
                <div className="cartWrapper">
                  <FiShoppingCart size={21} aria-hidden="true" focusable="false" />

                  {quantidadeCarrinho > 0 && (
                    <span className="badge">{quantidadeCarrinho}</span>
                  )}
                </div>

                <div className="cartInfo">
                  <span className="cartLabel">Meu</span>
                  <span className="cartTotal">Carrinho</span>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="mobileNavbar">
          <button
            className="hamburger"
            onClick={openSidebar}
            type="button"
            aria-label="Abrir menu"
            title="Abrir menu"
            aria-expanded={openMenu}
            aria-controls="mobileSidebar"
          >
            <FiMenu size={22} aria-hidden="true" focusable="false" />
          </button>

          <div className="mobileBrand">
            <Link href="/" className="mobileLogo" aria-label="Ir para a página inicial">
              <span className="logoDark">{titulo1 || "Universo"}</span>
              <span className="logoPink">{titulo2 || "Império"}</span>
            </Link>

            <span className="mobileSubtitle">{subtitulo || ""}</span>
          </div>

          <div className="mobileRight">
            {usuario ? (
              <div className="mobileUserDropdown">
                <button
                  ref={mobileUserBtnRef}
                  className="mobileUserBtn"
                  onClick={toggleUserDropdown}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario?.nome ?? ""}`}
                >
                  <div className="mobileAvatar">
                    {(usuario?.nome ?? "?").charAt(0)?.toUpperCase()}
                  </div>

                  <span className="mobileUserName">
                    {usuario?.nome ?? "Usuário"}
                  </span>
                </button>
              </div>
            ) : (
              login && (
                <Link
                  href={corrigirRota(login.rota, "#")}
                  className="mobileBtn"
                  aria-label="Entrar na conta"
                  title="Entrar"
                >
                  <FiUser size={17} aria-hidden="true" focusable="false" />
                </Link>
              )
            )}

            {carrinho && (
              <button
                type="button"
                className="mobileCartBtn"
                onClick={abrirCarrinhoLateral}
                aria-label="Abrir carrinho"
                title="Carrinho"
              >
                <div className="cartWrapper">
                  <FiShoppingCart size={18} aria-hidden="true" focusable="false" />

                  {quantidadeCarrinho > 0 && (
                    <span className="badge">{quantidadeCarrinho}</span>
                  )}
                </div>
              </button>
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

            {safePesquisa !== "" && (
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
        aria-hidden="true"
      />

      <aside
        id="mobileSidebar"
        className={`sidebar ${openMenu ? "sidebarOpen" : ""}`}
        aria-label="Menu lateral"
        aria-hidden={!openMenu}
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
                {(usuario?.nome ?? "?").charAt(0)?.toUpperCase()}
              </div>

              <div className="sidebarUserData">
                <strong>{usuario?.nome ?? "Usuário"}</strong>
                <span>{usuario?.email ?? ""}</span>
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
              {menuItems.map((item) => {
                if (item.action === "cart") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="quickAction"
                      onClick={abrirCarrinhoLateral}
                    >
                      <span className="quickActionIcon">{item.icon}</span>
                      <span className="quickActionLabel">{item.label}</span>

                      {item.badge && item.badge > 0 && (
                        <span className="quickBadge">{item.badge}</span>
                      )}
                    </button>
                  );
                }

                return (
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
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`cartOverlay ${openCart ? "cartOverlayShow" : ""}`}
        onClick={fecharCarrinhoLateral}
        aria-hidden="true"
      />

      <aside
        className={`cartSidebar ${openCart ? "cartSidebarOpen" : ""}`}
        aria-label="Carrinho lateral"
        aria-hidden={!openCart}
      >
        <div className="cartSidebarHeader">
          <div>
            <h2>Meu carrinho</h2>
            <span>{cartItens.length} item(s)</span>
          </div>

          <button
            type="button"
            onClick={fecharCarrinhoLateral}
            aria-label="Fechar carrinho"
            title="Fechar carrinho"
          >
            <FiX size={22} aria-hidden="true" focusable="false" />
          </button>
        </div>

        <div className="cartSidebarContent">
          {cartLoading ? (
            <div className="cartEmpty">
              <div className="cartLoader" />
              <strong>Carregando carrinho...</strong>
            </div>
          ) : cartItens.length === 0 ? (
            <div className="cartEmpty">
              <FiShoppingCart size={36} />
              <strong>Seu carrinho está vazio</strong>
              <span>Adicione produtos para continuar.</span>
            </div>
          ) : (
            cartItens.map((item) => {
              const imagem = imagemFundo(item.imagem);
              const preco =
                item.preco_promocional_unitario &&
                item.preco_promocional_unitario > 0
                  ? item.preco_promocional_unitario
                  : item.preco_unitario;

              return (
                <div key={item.id_carrinho_item} className="cartMiniItem">
                  <div className="cartMiniImage">
                    {imagem ? (
                      <Image
                        src={imagem}
                        alt={item.produto_nome}
                        fill
                        sizes="76px"
                      />
                    ) : (
                      <FiPackage size={22} aria-hidden="true" focusable="false" />
                    )}
                  </div>

                  <div className="cartMiniInfo">
                    <strong>{item.produto_nome}</strong>
                    <span>Qtd: {item.quantidade}</span>
                    <b>{formatarMoeda(preco)}</b>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cartSidebarFooter">
          <div className="cartTotalBox">
            <span>Total</span>
            <strong>{formatarMoeda(totalCarrinho)}</strong>
          </div>

          <Link href={rotas.paginas.carrinho} onClick={fecharCarrinhoLateral}>
            Ver carrinho completo
          </Link>
        </div>
      </aside>

      {renderDropdownMenu()}
    </>
  );
}