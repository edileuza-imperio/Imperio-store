"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
  FiLogOut,
  FiGrid,
  FiPackage,
  FiSettings,
  FiMenu,
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

type CarrinhoItem = {
  id_carrinho_item: number;
  quantidade: number;
};

export default function Navbar() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [site, setSite] = useState<SiteConfig | null>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [quantidadeCarrinho, setQuantidadeCarrinho] = useState(0);

  useEffect(() => {
    carregar();

    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    const atualizarCarrinho = () => {
      carregarCarrinho();
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("carrinhoAtualizado", atualizarCarrinho);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("carrinhoAtualizado", atualizarCarrinho);
    };
  }, []);

  async function carregar() {
    try {
      const [menusRes, siteRes] = await Promise.all([
        api.get("/menus"),
        api.get("/site-configs"),
      ]);

      const menusDados = menusRes.data?.dados;
      setMenus(Array.isArray(menusDados) ? menusDados : []);

      const siteDados = siteRes.data?.dados;
      setSite(Array.isArray(siteDados) ? siteDados[0] : null);

      carregarUsuario();
      carregarCarrinho();
    } catch (error) {
      console.log(error);
    }
  }

  async function carregarCarrinho() {
    try {
      const response = await api.get("/carrinho/itens");

      const itens: CarrinhoItem[] = response.data?.dados || [];

      if (!Array.isArray(itens)) {
        setQuantidadeCarrinho(0);
        return;
      }

      const total = itens.reduce(
        (soma: number, item: CarrinhoItem) =>
          soma + Number(item.quantidade || 0),
        0
      );

      setQuantidadeCarrinho(total);
    } catch (error) {
      console.log("Erro ao carregar carrinho:", error);
      setQuantidadeCarrinho(0);
    }
  }

  async function carregarUsuario() {
    try {
      const res = await api.get("/me");

      const dados = res.data?.usuario || res.data?.dados?.usuario;

      if (dados) {
        setUsuario({
          id_usuario: dados.id_usuario,
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
    if (!Array.isArray(menus)) return null;

    return menus.find(
      (m) => m.nome?.toLowerCase()?.trim() === "carrinho"
    );
  }, [menus]);

  const login = useMemo(() => {
    if (!Array.isArray(menus)) return null;

    return menus.find(
      (m) => m.nome?.toLowerCase()?.trim() === "login"
    );
  }, [menus]);

  function iconFallback(nome: string) {
    const lower = nome.toLowerCase();

    if (lower.includes("perfil")) return <FiUser size={16} />;
    if (lower.includes("pedido")) return <FiPackage size={16} />;
    if (lower.includes("admin")) return <FiSettings size={16} />;
    if (lower.includes("sair")) return <FiLogOut size={16} />;

    return <FiGrid size={16} />;
  }

  const renderIcon = (
    name: string | null,
    size = 16,
    nome?: string
  ) => {
    if (!name) {
      return nome ? iconFallback(nome) : null;
    }

    const Icon = (FiIcons as any)[name] || (BiIcons as any)[name];

    if (!Icon) {
      return nome ? iconFallback(nome) : null;
    }

    return <Icon size={size} />;
  };

  const titulo = site?.titulo || "Universo Império";
  const subtitulo = site?.subtitulo || "DECORAÇÕES & EVENTOS";
  const tituloSplit = titulo.split(" ");

  const titulo1 = tituloSplit[0] || "Universo";
  const titulo2 = tituloSplit[1] || "Império";

  return (
    <>
      <header
        className={`${styles.header} ${
          scrolled ? styles.headerScrolled : ""
        }`}
      >
        {/* DESKTOP */}
        <div className={styles.desktopNavbar}>
          {/* LOGO */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoDark}>{titulo1}</span>
              <span className={styles.logoPink}>{titulo2}</span>
            </Link>

            <span className={styles.subtitle}>{subtitulo}</span>
          </div>

          {/* SEARCH */}
          <div className={styles.searchWrapper}>
            <div className={styles.searchBar}>
              <FiSearch size={18} />

              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Buscar produtos..."
              />

              {pesquisa.trim() !== "" && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setPesquisa("")}
                  aria-label="Limpar busca"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className={styles.right}>
            {usuario ? (
              <div className={styles.userDropdown}>
                <button
                  className={styles.userBtn}
                  onClick={() => setDropdown(!dropdown)}
                  type="button"
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
                  <div className={styles.dropdownMenu}>
                    {login?.itens
                      ?.slice()
                      .sort((a, b) => a.posicao - b.posicao)
                      .map((item) => {
                        const sair =
                          item.nome?.toLowerCase()?.trim() === "sair";

                        if (sair) {
                          return (
                            <button
                              key={item.id_item}
                              className={styles.dropdownItem}
                              onClick={logout}
                              type="button"
                            >
                              {renderIcon(item.icone, 16, item.nome)}
                              <span>{item.nome}</span>
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={item.id_item}
                            href={item.rota}
                            className={styles.dropdownItem}
                            onClick={() => setDropdown(false)}
                          >
                            {renderIcon(item.icone, 16, item.nome)}
                            <span>{item.nome}</span>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : (
              login && (
                <Link href={login.rota} className={styles.iconBtn}>
                  <FiUser size={18} />
                  <span>Entrar</span>
                </Link>
              )
            )}

            {carrinho && (
              <Link href={carrinho.rota} className={styles.cartButton}>
                <div className={styles.cartWrapper}>
                  <FiShoppingCart size={21} />

                  {quantidadeCarrinho > 0 && (
                    <span className={styles.badge}>
                      {quantidadeCarrinho}
                    </span>
                  )}
                </div>

                <div className={styles.cartInfo}>
                  <span className={styles.cartLabel}>Meu</span>
                  <span className={styles.cartTotal}>Carrinho</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* MOBILE */}
        <div className={styles.mobileNavbar}>
          <button
            className={styles.hamburger}
            onClick={() => setOpenMenu(true)}
            type="button"
            aria-label="Abrir menu"
          >
            <FiMenu size={22} />
          </button>

          <div className={styles.mobileBrand}>
            <Link href="/" className={styles.mobileLogo}>
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
                >
                  <div className={styles.mobileAvatar}>
                    {usuario.nome?.charAt(0)?.toUpperCase()}
                  </div>

                  <span className={styles.mobileUserName}>
                    {usuario.nome}
                  </span>
                </button>

                {dropdown && (
                  <div className={styles.mobileDropdown}>
                    {login?.itens
                      ?.slice()
                      .sort((a, b) => a.posicao - b.posicao)
                      .map((item) => {
                        const sair =
                          item.nome?.toLowerCase()?.trim() === "sair";

                        if (sair) {
                          return (
                            <button
                              key={item.id_item}
                              className={styles.mobileDropdownItem}
                              onClick={logout}
                              type="button"
                            >
                              {renderIcon(item.icone, 16, item.nome)}
                              <span>{item.nome}</span>
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={item.id_item}
                            href={item.rota}
                            className={styles.mobileDropdownItem}
                            onClick={() => setDropdown(false)}
                          >
                            {renderIcon(item.icone, 16, item.nome)}
                            <span>{item.nome}</span>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : (
              login && (
                <Link href={login.rota} className={styles.mobileBtn}>
                  <FiUser size={17} />
                </Link>
              )
            )}

            {carrinho && (
              <Link href={carrinho.rota} className={styles.mobileCartBtn}>
                <div className={styles.cartWrapper}>
                  <FiShoppingCart size={18} />

                  {quantidadeCarrinho > 0 && (
                    <span className={styles.badge}>
                      {quantidadeCarrinho}
                    </span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* MOBILE SEARCH */}
        <div className={styles.mobileSearch}>
          <div className={styles.searchBar}>
            <FiSearch size={16} />

            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Buscar produtos..."
            />

            {pesquisa.trim() !== "" && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setPesquisa("")}
                aria-label="Limpar busca"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* OVERLAY */}
      <div
        className={`${styles.overlay} ${
          openMenu ? styles.overlayShow : ""
        }`}
        onClick={() => setOpenMenu(false)}
      />

      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${
          openMenu ? styles.sidebarOpen : ""
        }`}
      >
        <div className={styles.sidebarHeader}>
          <h2>Menu</h2>

          <button
            className={styles.closeBtn}
            onClick={() => setOpenMenu(false)}
            type="button"
            aria-label="Fechar menu"
          >
            <FiX size={22} />
          </button>
        </div>

        {usuario && (
          <div className={styles.sidebarUser}>
            <div className={styles.sidebarAvatar}>
              {usuario.nome?.charAt(0)?.toUpperCase()}
            </div>

            <div className={styles.sidebarUserInfo}>
              <strong>{usuario.nome}</strong>
              <span>{usuario.email}</span>
            </div>
          </div>
        )}

        <div className={styles.menuList}>
          {menus.map((m) => (
            <Link
              key={m.id_menu}
              href={m.rota}
              className={styles.menuItem}
              onClick={() => setOpenMenu(false)}
            >
              {renderIcon(m.icone, 18, m.nome)}
              <span>{m.nome}</span>
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}