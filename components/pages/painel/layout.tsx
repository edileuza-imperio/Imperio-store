"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard,
  Box,
  Tags,
  Users,
  MenuSquare,
  Image,
  CreditCard,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Settings,
} from "lucide-react";

import styles from "./DashboardLayout.module.css";

interface MenuChild {
  label: string;
  url: string;
}

interface MenuItem {
  label: string;
  icon?: string;
  url?: string;
  children?: MenuChild[];
}

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  nivel_id?: number;
  status_id?: number;
}

const icons = {
  dashboard: LayoutDashboard,
  box: Box,
  tags: Tags,
  users: Users,
  menu: MenuSquare,
  imagem: Image,
  "credit-card": CreditCard,
  settings: Settings,
};

const sidebarPadrao: MenuItem[] = [
  {
    label: "Dashboard",
    icon: "dashboard",
    url: "/painel/sistema",
  },
  {
    label: "Produtos",
    icon: "box",
    children: [
      {
        label: "Todos os produtos",
        url: "/painel/sistema/produtos",
      },
      {
        label: "Cadastrar produto",
        url: "/painel/sistema/produtos/cadastrar",
      },
    ],
  },
  {
    label: "Categorias",
    icon: "tags",
    url: "/painel/sistema/categorias",
  },
  {
    label: "Usuários",
    icon: "users",
    url: "/painel/sistema/usuarios",
  },
  {
    label: "Pedidos",
    icon: "credit-card",
    url: "/painel/sistema/pedidos",
  },
  {
    label: "Banners",
    icon: "imagem",
    url: "/painel/sistema/banners",
  },
  {
    label: "Configurações",
    icon: "settings",
    url: "/painel/sistema/site",
  },
];

export default function DashboardLayout({
  children,
}: {
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebar, setSidebar] = useState<MenuItem[]>(sidebarPadrao);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    carregarSidebar();
    carregarUsuario();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);

    const indexAtivo = sidebar.findIndex((item) =>
      item.children?.some((child) => pathname.startsWith(child.url))
    );

    if (indexAtivo >= 0) {
      setOpenMenu(indexAtivo);
    }
  }, [pathname, sidebar]);

  async function carregarSidebar() {
    try {
      const response = await api.get("/painel/dados");

      const menuApi = response.data?.dados?.dados?.sidebar;

      if (Array.isArray(menuApi) && menuApi.length > 0) {
        setSidebar(menuApi);
      } else {
        setSidebar(sidebarPadrao);
      }
    } catch (error) {
      console.error("Erro ao carregar sidebar:", error);
      setSidebar(sidebarPadrao);
    }
  }

  async function carregarUsuario() {
    try {
      setLoadingUser(true);

      const response = await api.get("/me", {
        withCredentials: true,
      });

      const usuarioAPI =
        response.data?.dados?.usuario ||
        response.data?.dados?.dados?.usuario ||
        response.data?.usuario ||
        null;

      setUsuario(usuarioAPI);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      setUsuario(null);
    } finally {
      setLoadingUser(false);
    }
  }

  async function sair() {
    try {
      await api.post(
        "/logout",
        {},
        {
          withCredentials: true,
        }
      );
    } catch {
      // mesmo se falhar, manda para login
    } finally {
      router.push("/login");
    }
  }

  function toggleMenu(index: number) {
    setOpenMenu((current) => (current === index ? null : index));
  }

  function rotaAtiva(url?: string) {
    if (!url) return false;

    return pathname === url || pathname.startsWith(`${url}/`);
  }

  const iniciais = useMemo(() => {
    const nome = usuario?.nome?.trim();

    if (!nome) return "U";

    const partes = nome.split(" ").filter(Boolean);

    if (partes.length === 1) {
      return partes[0].charAt(0).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(
      0
    )}`.toUpperCase();
  }, [usuario?.nome]);

  const nomeUsuario = usuario?.nome || (loadingUser ? "Carregando..." : "Usuário");
  const emailUsuario =
    usuario?.email || (loadingUser ? "Buscando usuário..." : "Sem e-mail");

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu lateral"
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        <button
          className={styles.closeButton}
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu"
          type="button"
        >
          <X size={22} />
        </button>

        <Link href="/painel/sistema" className={styles.brand}>
          <div className={styles.brandLogo}>I</div>

          <div>
            <h1>Império</h1>
            <span>Painel Administrativo</span>
          </div>
        </Link>

        <nav className={styles.menu}>
          {sidebar.map((item, index) => {
            const hasChildren = Boolean(item.children?.length);
            const Icon =
              icons[item.icon as keyof typeof icons] || LayoutDashboard;

            const isParentActive =
              rotaAtiva(item.url) ||
              Boolean(item.children?.some((child) => rotaAtiva(child.url)));

            if (!hasChildren && item.url) {
              return (
                <Link
                  key={`${item.label}-${index}`}
                  href={item.url}
                  className={`${styles.menuLink} ${
                    isParentActive ? styles.active : ""
                  }`}
                >
                  <div className={styles.menuLeft}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            }

            return (
              <div key={`${item.label}-${index}`} className={styles.menuGroup}>
                <button
                  type="button"
                  className={`${styles.menuButton} ${
                    isParentActive ? styles.active : ""
                  }`}
                  onClick={() => toggleMenu(index)}
                >
                  <div className={styles.menuLeft}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>

                  <ChevronRight
                    size={16}
                    className={`${styles.arrow} ${
                      openMenu === index ? styles.rotate : ""
                    }`}
                  />
                </button>

                {openMenu === index && hasChildren && (
                  <div className={styles.submenu}>
                    {item.children?.map((child, childIndex) => (
                      <Link
                        key={`${child.label}-${childIndex}`}
                        href={child.url}
                        className={`${styles.submenuItem} ${
                          rotaAtiva(child.url) ? styles.activeSubmenu : ""
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.logoutButton} onClick={sair}>
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.mobileMenu}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>

            <div className={styles.headerText}>
              <h2>Painel Administrativo</h2>
              <span>Gerencie seu sistema</span>
            </div>
          </div>

          <div className={styles.user}>
            <div className={styles.userInfo}>
              <strong>{nomeUsuario}</strong>
              <small>{emailUsuario}</small>
            </div>

            <div className={styles.avatar}>{iniciais}</div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.card}>{children}</div>
        </main>
      </div>
    </div>
  );
}