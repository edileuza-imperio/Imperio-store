"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
  FiMenu,
  FiTag,
  FiHome,
  FiShoppingBag,
  FiHelpCircle,
  FiChevronRight,
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
  id_site_config?: number;
  titulo: string;
  subtitulo: string;
};

type Categoria = {
  id_categoria?: number;
  nome?: string;
  slug?: string;
  icone?: string | null;
  imagem?: string | null;
  ordem?: number;
  status_id?: number;
};

type BootstrapNavbar = {
  menus?: Menu[];
  site?: SiteConfig | SiteConfig[] | null;
  categorias?: Categoria[];
  usuario?: Usuario | null;
  carrinho_total?: number;
};

function normalizarRota(rota?: string | null) {
  if (!rota) return "/";
  const valor = rota.trim();
  if (!valor) return "/";
  if (valor.startsWith("http://") || valor.startsWith("https://")) return valor;

  // mantém query/hash, mas normaliza o caminho
  const [path, resto = ""] = valor.split(/([?#].*)/, 2);
  const caminho = path.startsWith("/") ? path : `/${path}`;
  return `${caminho.toLowerCase()}${resto || ""}`;
}

export default function Navbar() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [site, setSite] = useState<SiteConfig | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [openMenu, setOpenMenu] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [sidebarPesquisa, setSidebarPesquisa] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [quantidadeCarrinho, setQuantidadeCarrinho] = useState(0);

  useEffect(() => {
    carregarBootstrap();

    const handleScroll = () => setScrolled(window.scrollY > 8);
    const atualizarNavbar = () => carregarBootstrap();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("carrinhoAtualizado", atualizarNavbar);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("carrinhoAtualizado", atualizarNavbar);
    };
  }, []);

  async function carregarBootstrap() {
    try {
      const res = await api.get("/bootstrap/navbar");

      const bootstrap: BootstrapNavbar =
        res.data?.dados?.dados ?? res.data?.dados ?? {};

      setMenus(Array.isArray(bootstrap.menus) ? bootstrap.menus : []);

      const siteDados = bootstrap.site;
      if (Array.isArray(siteDados)) {
        setSite((siteDados[0] as SiteConfig) || null);
      } else {
        setSite((siteDados as SiteConfig) || null);
      }

      setCategorias(Array.isArray(bootstrap.categorias) ? bootstrap.categorias : []);
      setUsuario(bootstrap.usuario || null);
      setQuantidadeCarrinho(Number(bootstrap.carrinho_total || 0));
    } catch {
      setMenus([]);
      setSite(null);
      setCategorias([]);
      setUsuario(null);
      setQuantidadeCarrinho(0);
    }
  }

  async function logout() {
    try {
      await api.post("/logout");
      setDropdown(false);
      setUsuario(null);
      window.location.href = "/";
    } catch {
      setDropdown(false);
    }
  }

  const carrinho = useMemo(
    () => menus.find((m) => m.nome?.toLowerCase()?.trim() === "carrinho") || null,
    [menus]
  );

  const login = useMemo(
    () => menus.find((m) => m.nome?.toLowerCase()?.trim() === "login") || null,
    [menus]
  );

  const pedidoMenu = useMemo(
    () => menus.find((m) => m.nome?.toLowerCase()?.includes("pedido")) || null,
    [menus]
  );

  const contatoMenu = useMemo(
    () => menus.find((m) => m.nome?.toLowerCase()?.includes("contato")) || null,
    [menus]
  );

  const renderIcon = (name: string | null, size = 16) => {
    if (!name) return null;
    const Icon = (FiIcons as any)[name] || (BiIcons as any)[name];
    if (!Icon) return null;
    return <Icon size={size} aria-hidden="true" focusable="false" />;
  };

  const titulo = site?.titulo || "Universo Império";
  const subtitulo = site?.subtitulo || "DECORAÇÕES & EVENTOS";
  const [titulo1, titulo2 = "Império"] = titulo.split(" ");

  const categoriasFiltradas = categorias.filter((categoria) => {
    const nome = (categoria.nome || "").toLowerCase();
    const slug = (categoria.slug || "").toLowerCase();
    const filtro = sidebarPesquisa.toLowerCase().trim();
    if (!filtro) return true;
    return nome.includes(filtro) || slug.includes(filtro);
  });

  const actions = [
    { label: "Início", href: "/", icon: <FiHome size={18} aria-hidden="true" focusable="false" /> },
    {
      label: "Carrinho",
      href: normalizarRota(carrinho?.rota || "/carrinho"),
      icon: <FiShoppingCart size={18} aria-hidden="true" focusable="false" />,
      badge: quantidadeCarrinho > 0 ? quantidadeCarrinho : 0,
    },
    {
      label: "Pedidos",
      href: normalizarRota(pedidoMenu?.rota || "/pedidos"),
      icon: <FiShoppingBag size={18} aria-hidden="true" focusable="false" />,
    },
    {
      label: "Ajuda",
      href: normalizarRota(contatoMenu?.rota || "/"),
      icon: <FiHelpCircle size={18} aria-hidden="true" focusable="false" />,
    },
  ];

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
        <div className={styles.desktopNavbar}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} aria-label="Ir para a página inicial">
              <span className={styles.logoDark}>{titulo1}</span>
              <span className={styles.logoPink}>{titulo2}</span>
            </Link>
            <span className={styles.subtitle}>{subtitulo}</span>
          </div>

          <div className={styles.searchWrapper}>
            <div className={styles.searchBar}>
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
                  className={styles.clearBtn}
                  onClick={() => setPesquisa("")}
                  aria-label="Limpar busca"
                  title="Limpar busca"
                >
                  <FiX size={14} aria-hidden="true" focusable="false" />
                </button>
              )}
            </div>
          </div>

          <div className={styles.right}>
            {usuario ? (
              <div className={styles.userDropdown}>
                <button
                  className={styles.userBtn}
                  onClick={() => setDropdown(!dropdown)}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario.nome}`}
                >
                  <div className={styles.userAvatar}>
                    {usuario.nome?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className={styles.userInfo}>
                    <span>Olá,</span>
                    <strong>{usuario.nome}</strong>
                  </div>
                </button>

                {dropdown && (
                  <div className={styles.dropdownMenu} role="menu">
                    {login?.itens
                      ?.slice()
                      .sort((a, b) => a.posicao - b.posicao)
                      .map((item) => {
                        const sair = item.nome?.toLowerCase()?.trim() === "sair";

                        if (sair) {
                          return (
                            <button
                              key={item.id_item}
                              className={styles.dropdownItem}
                              onClick={logout}
                              type="button"
                              role="menuitem"
                            >
                              {renderIcon(item.icone, 16)}
                              <span>{item.nome}</span>
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={item.id_item}
                            href={normalizarRota(item.rota)}
                            className={styles.dropdownItem}
                            onClick={() => setDropdown(false)}
                            role="menuitem"
                          >
                            {renderIcon(item.icone, 16)}
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
                  href={normalizarRota(login.rota)}
                  className={styles.iconBtn}
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
                href={normalizarRota(carrinho.rota)}
                className={styles.cartButton}
                aria-label={quantidadeCarrinho > 0 ? `Ver carrinho de compras, ${quantidadeCarrinho} item(s)` : "Ver carrinho de compras"}
                title="Carrinho"
              >
                <div className={styles.cartWrapper}>
                  <FiShoppingCart size={21} aria-hidden="true" focusable="false" />
                  {quantidadeCarrinho > 0 && <span className={styles.badge}>{quantidadeCarrinho}</span>}
                </div>
                <div className={styles.cartInfo}>
                  <span className={styles.cartLabel}>Meu</span>
                  <span className={styles.cartTotal}>Carrinho</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className={styles.mobileNavbar}>
          <button
            className={styles.hamburger}
            onClick={() => setOpenMenu(true)}
            type="button"
            aria-label="Abrir menu"
            title="Abrir menu"
          >
            <FiMenu size={22} aria-hidden="true" focusable="false" />
          </button>

          <div className={styles.mobileBrand}>
            <Link href="/" className={styles.mobileLogo} aria-label="Ir para a página inicial">
              <span className={styles.logoDark}>{titulo1}</span>
              <span className={styles.logoPink}>{titulo2}</span>
            </Link>
            <span className={styles.mobileSubtitle}>{subtitulo}</span>
          </div>

          <div className={styles.mobileRight}>
            {usuario ? (
              <div className={styles.mobileUserDropdown}>
                <button
                  className={styles.mobileUserBtn}
                  onClick={() => setDropdown(!dropdown)}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={dropdown}
                  aria-label={`Abrir menu do usuário: ${usuario.nome}`}
                >
                  <div className={styles.mobileAvatar}>
                    {usuario.nome?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className={styles.mobileUserName}>{usuario.nome}</span>
                </button>

                {dropdown && (
                  <div className={styles.mobileDropdown} role="menu">
                    {login?.itens
                      ?.slice()
                      .sort((a, b) => a.posicao - b.posicao)
                      .map((item) => {
                        const sair = item.nome?.toLowerCase()?.trim() === "sair";

                        if (sair) {
                          return (
                            <button
                              key={item.id_item}
                              className={styles.mobileDropdownItem}
                              onClick={logout}
                              type="button"
                              role="menuitem"
                            >
                              {renderIcon(item.icone, 16)}
                              <span>{item.nome}</span>
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={item.id_item}
                            href={normalizarRota(item.rota)}
                            className={styles.mobileDropdownItem}
                            onClick={() => setDropdown(false)}
                            role="menuitem"
                          >
                            {renderIcon(item.icone, 16)}
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
                  href={normalizarRota(login.rota)}
                  className={styles.mobileBtn}
                  aria-label="Entrar na conta"
                  title="Entrar"
                >
                  <FiUser size={17} aria-hidden="true" focusable="false" />
                </Link>
              )
            )}

            {carrinho && (
              <Link
                href={normalizarRota(carrinho.rota)}
                className={styles.mobileCartBtn}
                aria-label={quantidadeCarrinho > 0 ? `Ver carrinho de compras, ${quantidadeCarrinho} item(s)` : "Ver carrinho de compras"}
                title="Carrinho"
              >
                <div className={styles.cartWrapper}>
                  <FiShoppingCart size={18} aria-hidden="true" focusable="false" />
                  {quantidadeCarrinho > 0 && <span className={styles.badge}>{quantidadeCarrinho}</span>}
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}