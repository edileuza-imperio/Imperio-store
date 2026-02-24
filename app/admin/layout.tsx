"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAutenticado from "@/hooks/Usuario/useAutenticado";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

type Props = { children: React.ReactNode };

type BackendSidebarItem = {
  titulo: string;
  rota: string;
  icone: string; // ex: "fa-solid fa-chart-line"
};

type BackendSidebar = Record<string, BackendSidebarItem>;

type SimpleItem = {
  type: "link";
  label: string;
  href: string;
  icon: string;
  match?: string;
};

type GroupItem = {
  type: "group";
  label: string;
  icon: string;
  children: Omit<SimpleItem, "type">[];
};

type MenuItem = SimpleItem | GroupItem;

type ApiResponse<T> = {
  message?: string;
  status?: number;
  data?: T;
  dados?: T;
};

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  return payload as T;
}

/** Fecha dropdown ao clicar fora */
function useClickOutside(
  refs: Array<React.RefObject<HTMLElement | null>>,
  onOutside: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    function handler(e: MouseEvent) {
      const target = e.target as Node;

      const clickedInside = refs.some(
        (ref) => ref.current && ref.current.contains(target)
      );

      if (!clickedInside) onOutside();
    }

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [refs, onOutside, enabled]);
}

function matchFromHref(href: string) {
  // "/admin/produtos" -> "/produtos"
  const parts = href.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  return `/${last}`;
}

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const { usuario, loading } = useAutenticado([1, 4]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useClickOutside([userMenuRef], () => setUserMenuOpen(false), userMenuOpen);
  useClickOutside([notifRef], () => setNotifOpen(false), notifOpen);

  // ✅ menu do backend
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function carregarMenu() {
      setMenuLoading(true);

      try {
        // rota do backend do admin (PainelAdministrativo@index)
        const res = await api.get<ApiResponse<any>>(rotas.admin.dashboard);

        // Mensagemjson provavelmente devolve { dados: { dados: sidebar } } OU { dados: sidebar }
        const root = resolveApi<any>(res.data);
        const maybeSidebar = root?.dados ?? root;

        const sidebar = (maybeSidebar || {}) as BackendSidebar;

        const items: MenuItem[] = Object.values(sidebar).map((it) => ({
          type: "link",
          label: it.titulo,
          href: it.rota,
          icon: it.icone,
          match: matchFromHref(it.rota),
        }));

        if (!alive) return;
        setMenu(items);
      } catch (e) {
        console.error("❌ Erro ao carregar menu admin:", e);

        // fallback básico
        if (!alive) return;
        setMenu([
          {
            type: "link",
            label: "Dashboard",
            href: "/admin",
            icon: "fa-solid fa-chart-line",
            match: "/admin",
          },
          {
            type: "link",
            label: "Usuários",
            href: "/admin/usuarios",
            icon: "fa-solid fa-users",
            match: "/usuarios",
          },
          {
            type: "link",
            label: "Produtos",
            href: "/admin/produtos",
            icon: "fa-solid fa-box",
            match: "/produtos",
          },
          {
            type: "link",
            label: "Categorias",
            href: "/admin/categorias",
            icon: "fa-solid fa-tags",
            match: "/categorias",
          },
        ]);
      } finally {
        if (!alive) return;
        setMenuLoading(false);
      }
    }

    carregarMenu();
    return () => {
      alive = false;
    };
  }, []);

  const notifications = useMemo(
    () => [
      { id: 1, title: "Novo pedido recebido", time: "Agora", href: "/admin/pedidos" },
      { id: 2, title: "Cupom prestes a expirar", time: "Há 1h", href: "/admin/cupons" },
      { id: 3, title: "Novo usuário cadastrado", time: "Hoje", href: "/admin/usuarios" },
    ],
    []
  );

  const unreadCount = notifications.length;

  function isActive(match?: string, href?: string) {
    if (href && pathname === href) return true;
    if (match && pathname.includes(match)) return true;
    return false;
  }

  const iniciais =
    (usuario?.nome?.trim()?.split(" ")[0]?.[0] || "U").toUpperCase();

  async function sair() {
    try {
      // se você tem endpoint de logout real:
      await api.post(rotas.auth.logout);
    } catch (e) {
      // mesmo se falhar, manda pro login
    } finally {
      router.push("/login");
    }
  }

  return (
    <>
      <div className="adm-shell">
        {/* Sidebar */}
        <aside className={`adm-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="adm-sidebar__top">
            <div className="adm-brand">
              <div className="adm-brand__logo">
                <i className="bi bi-shield-lock" />
              </div>
              <div className="adm-brand__text">
                <div className="adm-brand__name">Admin</div>
                <div className="adm-brand__sub">Painel de controle</div>
              </div>
            </div>

            <button
              className="btn btn-sm btn-outline-light d-lg-none"
              onClick={() => setSidebarOpen(false)}
              type="button"
              aria-label="Fechar menu"
            >
              ✕
            </button>
          </div>

          <div className="adm-sidebar__search">
            <i className="bi bi-search" />
            <input placeholder="Buscar no menu…" />
            <span className="adm-kbd">⌘K</span>
          </div>

          <div className="adm-section">MENU</div>

          <nav className="adm-nav">
            {menuLoading ? (
              <div style={{ padding: 12, color: "rgba(255,255,255,.75)" }}>
                Carregando menu…
              </div>
            ) : (
              menu.map((item) => {
                if (item.type === "link") {
                  const active = isActive(item.match, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`adm-item ${active ? "active" : ""}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {/* ✅ backend manda FA icons, então renderizamos como className normal */}
                      <i className={item.icon} />
                      <span className="adm-item__label">{item.label}</span>
                      {active && <span className="adm-item__pill" />}
                    </Link>
                  );
                }

                // se futuramente quiser grupos do backend, pode expandir aqui
                const anyActive = item.children.some((c) => isActive(c.match, c.href));
                const opened = openGroup === item.label;

                return (
                  <div
                    key={item.label}
                    className={`adm-group ${anyActive ? "group-active" : ""}`}
                  >
                    <button
                      type="button"
                      className={`adm-item adm-item--btn ${opened ? "open" : ""}`}
                      onClick={() => setOpenGroup(opened ? null : item.label)}
                    >
                      <i className={item.icon} />
                      <span className="adm-item__label">{item.label}</span>
                      <i className={`bi bi-chevron-down adm-chevron ${opened ? "rot" : ""}`} />
                    </button>

                    <div className={`adm-sub ${opened ? "show" : ""}`}>
                      {item.children.map((c) => {
                        const active = isActive(c.match, c.href);
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            className={`adm-subitem ${active ? "active" : ""}`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <i className={c.icon} />
                            <span>{c.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </nav>

          <div className="adm-sidebar__footer">
            <div className="adm-miniuser">
              <div className="adm-miniuser__avatar">{loading ? "…" : iniciais}</div>
              <div className="adm-miniuser__text">
                <div className="adm-miniuser__name">
                  {loading ? "Carregando..." : usuario?.nome || "Usuário"}
                </div>
                <div className="adm-miniuser__email">
                  {loading ? "" : usuario?.email || ""}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop mobile */}
        <div
          className={`adm-backdrop ${sidebarOpen ? "show" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Main */}
        <div className="adm-main">
          {/* Topbar */}
          <header className="adm-topbar">
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-light d-lg-none"
                onClick={() => setSidebarOpen(true)}
                type="button"
                aria-label="Abrir menu"
              >
                <i className="bi bi-list" />
              </button>

              <div className="adm-topbar__title">
                <div className="adm-title">Painel Administrativo</div>
                <div className="adm-subtitle">Gerencie tudo em um só lugar</div>
              </div>
            </div>

            <div className="adm-actions">
              {/* Search */}
              <div className="adm-topsearch d-none d-md-flex">
                <i className="bi bi-search" />
                <input placeholder="Pesquisar…" />
              </div>

              {/* Notifications */}
              <div className="adm-dd" ref={notifRef}>
                <button
                  type="button"
                  className="adm-iconbtn"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setUserMenuOpen(false);
                  }}
                  aria-label="Notificações"
                >
                  <i className="bi bi-bell" />
                  {unreadCount > 0 && <span className="adm-badge">{unreadCount}</span>}
                </button>

                <div className={`adm-pop adm-pop--notif ${notifOpen ? "show" : ""}`}>
                  <div className="adm-pop__head">
                    <div>
                      <div className="adm-pop__title">Notificações</div>
                      <div className="adm-pop__sub">{unreadCount} novas</div>
                    </div>
                    <button
                      type="button"
                      className="adm-linkbtn"
                      onClick={() => setNotifOpen(false)}
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="adm-pop__list">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        className="adm-notif"
                        onClick={() => setNotifOpen(false)}
                      >
                        <div className="adm-notif__dot" />
                        <div className="adm-notif__txt">
                          <div className="adm-notif__t">{n.title}</div>
                          <div className="adm-notif__m">{n.time}</div>
                        </div>
                        <i className="bi bi-chevron-right" />
                      </Link>
                    ))}
                  </div>

                  <div className="adm-pop__foot">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary w-100"
                      onClick={() => {
                        setNotifOpen(false);
                        router.push("/admin/pedidos");
                      }}
                    >
                      Ver tudo
                    </button>
                  </div>
                </div>
              </div>

              {/* User dropdown */}
              <div className="adm-dd" ref={userMenuRef}>
                <button
                  type="button"
                  className="adm-userbtn"
                  onClick={() => {
                    setUserMenuOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                >
                  <div className="adm-avatar">{loading ? "…" : iniciais}</div>
                  <div className="adm-usertext d-none d-sm-block">
                    <div className="adm-username">
                      {loading ? "Carregando..." : usuario?.nome || "Usuário"}
                    </div>
                    <div className="adm-useremail">
                      {loading ? "" : usuario?.email || ""}
                    </div>
                  </div>
                  <i className={`bi bi-chevron-down adm-chevron2 ${userMenuOpen ? "rot" : ""}`} />
                </button>

                <div className={`adm-pop adm-pop--user ${userMenuOpen ? "show" : ""}`}>
                  <div className="adm-pop__head">
                    <div className="adm-usercard">
                      <div className="adm-usercard__avatar">{loading ? "…" : iniciais}</div>
                      <div className="adm-usercard__info">
                        <div className="adm-usercard__name">
                          {loading ? "Carregando..." : usuario?.nome || "Usuário"}
                        </div>
                        <div className="adm-usercard__mail">
                          {loading ? "" : usuario?.email || ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="adm-menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/admin/configuracoes");
                    }}
                  >
                    <i className="bi bi-person" />
                    Meu perfil
                  </button>

                  <button
                    type="button"
                    className="adm-menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/admin/configuracoes");
                    }}
                  >
                    <i className="bi bi-gear" />
                    Configurações
                  </button>

                  <div className="adm-sep" />

                  <button
                    type="button"
                    className="adm-menuitem danger"
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await sair();
                    }}
                  >
                    <i className="bi bi-box-arrow-right" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="adm-content">
            <div className="adm-content__inner">{children}</div>
          </main>

          <footer className="adm-footer">
            <span className="text-muted">Sistema • v1.0</span>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        :root{
          --bg:#f4f6fb;
          --card:#ffffff;
          --text:#0f172a;
          --muted:#64748b;
          --border:rgba(15,23,42,.08);
          --shadow:0 22px 60px rgba(2,6,23,.10);

          --sb:#0b1220;
          --sb2:#101b3a;
          --sbLine:rgba(255,255,255,.08);

          --primary:#0d6efd;
          --primarySoft: rgba(13,110,253,.16);
        }

        body{ background: var(--bg); }
        .adm-shell{ min-height:100vh; display:flex; }

        .adm-sidebar{
          width:292px;
          position:fixed;
          inset:0 auto 0 0;
          background: radial-gradient(1200px 600px at 20% -10%, rgba(13,110,253,.25), transparent 60%),
                      linear-gradient(180deg, var(--sb), var(--sb2));
          color:#fff;
          display:flex;
          flex-direction:column;
          z-index:1050;
          border-right:1px solid var(--sbLine);
        }

        .adm-sidebar__top{
          padding:18px 16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          border-bottom:1px solid var(--sbLine);
        }

        .adm-brand{ display:flex; gap:12px; align-items:center; }
        .adm-brand__logo{
          width:46px; height:46px; border-radius:16px;
          background: rgba(13,110,253,.22);
          border:1px solid rgba(13,110,253,.30);
          display:flex; align-items:center; justify-content:center;
          font-weight:900;
          box-shadow: 0 14px 34px rgba(13,110,253,.18);
        }
        .adm-brand__logo i{ font-size:20px; }
        .adm-brand__name{ font-weight:900; line-height:1.05; letter-spacing:.2px; }
        .adm-brand__sub{ font-size:12px; color:rgba(255,255,255,.62); }

        .adm-sidebar__search{
          margin:14px 14px 6px;
          display:flex; align-items:center; gap:10px;
          padding:10px 12px;
          border-radius:16px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.10);
        }
        .adm-sidebar__search i{ opacity:.9; }
        .adm-sidebar__search input{
          width:100%;
          background:transparent;
          border:0;
          outline:none;
          color:#fff;
          font-size:13px;
        }
        .adm-sidebar__search input::placeholder{ color: rgba(255,255,255,.55); }
        .adm-kbd{
          font-size:11px;
          padding:2px 8px;
          border-radius:999px;
          background: rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.10);
          color: rgba(255,255,255,.75);
          user-select:none;
        }

        .adm-section{
          padding: 10px 18px 4px;
          font-size:11px;
          letter-spacing:1.2px;
          color: rgba(255,255,255,.55);
        }

        .adm-nav{ padding:10px 12px 14px; overflow:auto; display:flex; flex-direction:column; gap:8px; }

        .adm-item{
          position:relative;
          display:flex;
          align-items:center;
          gap:12px;
          padding:12px 12px;
          border-radius:16px;
          text-decoration:none;
          color: rgba(255,255,255,.86);
          border:1px solid transparent;
          transition: .18s ease;
        }
        .adm-item i{ font-size:18px; opacity:.95; }

        .adm-item:hover{
          background: rgba(255,255,255,.07);
          border-color: rgba(255,255,255,.10);
          transform: translateX(2px);
        }

        .adm-item.active{
          background: rgba(13,110,253,.22);
          border-color: rgba(13,110,253,.28);
          color:#fff;
          box-shadow: 0 18px 44px rgba(13,110,253,.14);
        }

        .adm-item__label{ font-weight:650; }
        .adm-item__pill{
          position:absolute;
          right:10px;
          width:8px;
          height:8px;
          border-radius:999px;
          background: #fff;
          opacity:.9;
        }

        .adm-item--btn{
          width:100%;
          background:transparent;
          border:1px solid transparent;
          text-align:left;
        }
        .adm-item--btn.open{
          background: rgba(255,255,255,.06);
          border-color: rgba(255,255,255,.10);
        }

        .adm-group .adm-sub{
          margin:8px 4px 2px 34px;
          padding:8px 8px;
          border-left: 1px dashed rgba(255,255,255,.18);
          display:none;
        }
        .adm-group .adm-sub.show{ display:block; }

        .adm-subitem{
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px 10px;
          border-radius:14px;
          text-decoration:none;
          color: rgba(255,255,255,.78);
          transition:.16s ease;
        }
        .adm-subitem i{ opacity:.95; }
        .adm-subitem:hover{ background: rgba(255,255,255,.06); color:#fff; }
        .adm-subitem.active{ background: rgba(13,110,253,.18); color:#fff; }

        .adm-chevron{ margin-left:auto; font-size:12px; opacity:.8; transition:.16s ease; }
        .adm-chevron.rot{ transform: rotate(180deg); }

        .adm-sidebar__footer{
          margin-top:auto;
          padding:14px 14px;
          border-top:1px solid var(--sbLine);
        }
        .adm-miniuser{
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px;
          border-radius:16px;
          background: rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.10);
        }
        .adm-miniuser__avatar{
          width:40px; height:40px; border-radius:14px;
          background: rgba(13,110,253,.22);
          border:1px solid rgba(13,110,253,.30);
          display:flex; align-items:center; justify-content:center;
          font-weight:900;
        }
        .adm-miniuser__name{ font-weight:800; font-size:13px; }
        .adm-miniuser__email{
          font-size:12px;
          color: rgba(255,255,255,.65);
          max-width: 175px;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .adm-backdrop{ display:none; }
        @media (max-width: 991.98px){
          .adm-sidebar{ transform: translateX(-105%); transition: transform .22s ease; }
          .adm-sidebar.open{ transform: translateX(0); }
          .adm-backdrop{
            display:block;
            position:fixed; inset:0;
            background: rgba(2,6,23,.55);
            opacity:0; pointer-events:none;
            transition: opacity .22s ease;
            z-index:1040;
          }
          .adm-backdrop.show{ opacity:1; pointer-events:auto; }
        }

        .adm-main{
          margin-left:292px;
          width: calc(100% - 292px);
          min-height:100vh;
          display:flex;
          flex-direction:column;
        }
        @media (max-width: 991.98px){
          .adm-main{ margin-left:0; width:100%; }
        }

        .adm-topbar{
          position: sticky;
          top: 0;
          z-index: 1020;
          background: rgba(255,255,255,.86);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 14px 16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          box-shadow: 0 12px 34px rgba(2,6,23,.07);
        }

        .adm-title{ font-weight:950; color: var(--text); line-height:1.05; letter-spacing:.2px; }
        .adm-subtitle{ font-size:12px; color: var(--muted); }

        .adm-actions{ display:flex; align-items:center; gap:10px; }

        .adm-topsearch{
          display:flex; align-items:center; gap:10px;
          padding:10px 12px;
          border-radius:16px;
          border:1px solid var(--border);
          background:#fff;
          min-width: 320px;
          box-shadow: 0 10px 26px rgba(2,6,23,.06);
        }
        .adm-topsearch i{ color: var(--muted); }
        .adm-topsearch input{
          width:100%;
          border:0;
          outline:none;
          background:transparent;
          font-size:14px;
          color: var(--text);
        }

        .adm-iconbtn{
          position:relative;
          width:44px; height:44px;
          border-radius:16px;
          border:1px solid var(--border);
          background:#fff;
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 10px 26px rgba(2,6,23,.06);
          transition:.16s ease;
        }
        .adm-iconbtn:hover{ transform: translateY(-1px); box-shadow: 0 16px 40px rgba(2,6,23,.10); }
        .adm-iconbtn i{ font-size:18px; color: var(--text); }

        .adm-badge{
          position:absolute;
          top:8px; right:8px;
          min-width:18px;
          height:18px;
          padding:0 6px;
          border-radius:999px;
          background:#dc3545;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:11px;
          font-weight:800;
          border:2px solid #fff;
          line-height:1;
        }

        .adm-dd{ position:relative; }

        .adm-pop{
          position:absolute;
          right:0;
          top: calc(100% + 10px);
          width: 320px;
          background:#fff;
          border:1px solid var(--border);
          border-radius:18px;
          box-shadow: var(--shadow);
          overflow:hidden;
          display:none;
        }
        .adm-pop.show{ display:block; }

        .adm-pop--user{ width: 280px; }
        .adm-pop__head{
          padding:12px 12px;
          border-bottom:1px solid rgba(2,6,23,.06);
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        }
        .adm-pop__title{ font-weight:900; color: var(--text); }
        .adm-pop__sub{ font-size:12px; color: var(--muted); }

        .adm-linkbtn{
          border:0;
          background:transparent;
          color: var(--primary);
          font-weight:700;
          font-size:12px;
        }

        .adm-pop__list{ padding:8px; max-height: 320px; overflow:auto; }

        .adm-notif{
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px 10px;
          border-radius:14px;
          text-decoration:none;
          color: var(--text);
          transition:.14s ease;
        }
        .adm-notif:hover{ background: rgba(2,6,23,.05); }
        .adm-notif__dot{
          width:10px; height:10px;
          border-radius:999px;
          background: var(--primary);
          opacity:.9;
          flex:0 0 auto;
        }
        .adm-notif__txt{ flex:1; }
        .adm-notif__t{ font-weight:750; font-size:13px; }
        .adm-notif__m{ font-size:12px; color: var(--muted); }
        .adm-notif i{ color: var(--muted); }

        .adm-pop__foot{ padding:10px; border-top:1px solid rgba(2,6,23,.06); }

        .adm-userbtn{
          display:flex;
          align-items:center;
          gap:12px;
          padding:10px 12px;
          border-radius:18px;
          border:1px solid var(--border);
          background:#fff;
          box-shadow: 0 10px 26px rgba(2,6,23,.06);
          transition: .16s ease;
        }
        .adm-userbtn:hover{ transform: translateY(-1px); box-shadow: 0 16px 40px rgba(2,6,23,.10); }

        .adm-avatar{
          width:42px; height:42px; border-radius:16px;
          background: var(--primarySoft);
          border:1px solid rgba(13,110,253,.22);
          color: var(--text);
          display:flex; align-items:center; justify-content:center;
          font-weight:950;
        }

        .adm-usertext{ text-align:left; line-height:1.05; }
        .adm-username{ font-weight:900; font-size:14px; color: var(--text); }
        .adm-useremail{
          font-size:12px; color: var(--muted);
          max-width: 220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .adm-chevron2{ font-size:12px; opacity:.75; transition:.16s ease; }
        .adm-chevron2.rot{ transform: rotate(180deg); }

        .adm-usercard{ display:flex; align-items:center; gap:10px; }
        .adm-usercard__avatar{
          width:44px; height:44px; border-radius:16px;
          background: var(--primarySoft);
          border:1px solid rgba(13,110,253,.22);
          display:flex; align-items:center; justify-content:center;
          font-weight:950;
        }
        .adm-usercard__name{ font-weight:950; }
        .adm-usercard__mail{ font-size:12px; color: var(--muted); }

        .adm-menuitem{
          width:100%;
          display:flex;
          align-items:center;
          gap:10px;
          padding:12px 12px;
          border:0;
          background:transparent;
          color: var(--text);
          text-align:left;
          transition:.14s ease;
        }
        .adm-menuitem:hover{ background: rgba(2,6,23,.05); }
        .adm-menuitem.danger{ color:#dc3545; }
        .adm-sep{ height:1px; background: rgba(2,6,23,.08); margin:6px 12px; }

        .adm-content{ padding: 22px; flex:1; }
        .adm-content__inner{
          background: linear-gradient(180deg, rgba(255,255,255,.92), #fff);
          border:1px solid var(--border);
          border-radius: 22px;
          box-shadow: var(--shadow);
          padding: 18px;
          min-height: calc(100vh - 170px);
        }

        .adm-footer{
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          background:#fff;
        }
      `}</style>
    </>
  );
}