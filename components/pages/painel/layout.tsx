"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
};

export default function DashboardLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const pathname = usePathname();

  const [sidebar, setSidebar] = useState<MenuItem[]>([]);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    carregarSidebar();
    carregarUsuario();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function carregarSidebar() {
    try {
      const response = await api.get("/painel/dados");
      console.log("SIDEBAR:", response.data);

      setSidebar(response.data?.dados?.dados?.sidebar || []);
    } catch (error) {
      console.error("Erro ao carregar sidebar:", error);
    }
  }

  async function carregarUsuario() {
    try {
      console.log("Iniciando carregamento do usuário...");

      const response = await api.get("/me");

      console.log("Resposta completa /me:", response);
      console.log("Dados /me:", response.data);
      console.log("Usuário recebido:", response.data?.dados?.usuario);

      const usuarioAPI = response.data?.dados?.usuario;

      if (usuarioAPI) {
        setUsuario(usuarioAPI);
        console.log("Usuário salvo:", usuarioAPI);
      } else {
        console.warn("Usuário não encontrado na resposta");
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  }

  function toggleMenu(index: number) {
    setOpenMenu((current) => (current === index ? null : index));
  }

  const iniciais = useMemo(() => {
    const nome = usuario?.nome?.trim();

    if (!nome) return "U";

    const partes = nome.split(" ").filter(Boolean);

    if (partes.length === 1) {
      return partes[0].charAt(0).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(0)}`.toUpperCase();
  }, [usuario?.nome]);

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
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

        <div className={styles.brand}>
          <div className={styles.brandLogo}>I</div>

          <div>
            <h1>Império</h1>
            <span>Painel Administrativo</span>
          </div>
        </div>

        <nav className={styles.menu}>
          {sidebar.map((item, index) => {
            const hasChildren = !!item.children?.length;
            const Icon =
              icons[item.icon as keyof typeof icons] || LayoutDashboard;

            const isParentActive =
              item.url === pathname ||
              item.children?.some((child) => child.url === pathname);

            if (!hasChildren && item.url) {
              return (
                <Link
                  key={index}
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
              <div key={index} className={styles.menuGroup}>
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
                        key={childIndex}
                        href={child.url}
                        className={`${styles.submenuItem} ${
                          pathname === child.url ? styles.activeSubmenu : ""
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
              <strong>{usuario?.nome || "Carregando..."}</strong>
              <small>{usuario?.email || "Buscando usuário..."}</small>
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