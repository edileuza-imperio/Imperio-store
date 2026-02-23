'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import CategoryBar from '../categoria/CategoryBar';
import SearchBar from '../Pesquisa/SearchBar';
import useMenuItems from '@/hooks/menu/useMenuItems';
import useUsuario from '@/hooks/Auth/useUsuario';
import api from '@/Api/conectar';

interface Menu {
  id?: number;
  nome: string;
  icone?: string;
  rota?: string;
  pesquisa_placeholder?: string | null;
}

interface NavbarDesktopProps {
  menus: Menu[];
  categorias?: any[];
  searchPlaceholder?: string;
}

export default function NavbarDesktop({ menus, categorias, searchPlaceholder }: NavbarDesktopProps) {
  const router = useRouter();
  const { usuario, loading: usuarioLoading, logado } = useUsuario();
  const { menuItems } = useMenuItems(usuario?.nivel_id);

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const ui = {
    bgTop: '#fffaf0',
    bgBottom: '#fff6f2',
    border: 'rgba(212,175,55,0.26)',
    accent: '#c97a7e',
    gold: '#d4af37',
    text: '#2b2b2b',
    muted: '#6c757d',
    shadow: '0 18px 45px rgba(0,0,0,0.12)',
    shadowSoft: '0 10px 26px rgba(0,0,0,0.06)',
  };

  const searchMenu = useMemo(() => menus.find((m) => m.pesquisa_placeholder), [menus]);
  const placeholder = searchPlaceholder ?? searchMenu?.pesquisa_placeholder ?? 'Buscar...';
  const menuPrincipal = useMemo(() => menus.filter((m) => !m.pesquisa_placeholder), [menus]);

  const getItemsForMenu = (menuId?: number) => {
    if (!menuId || !menuItems) return [];
    return menuItems
      .filter((item) => item.menu_id === menuId)
      .sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0));
  };

  const closeAllDropdowns = () => {
    setOpenDropdown(null);
    setUserDropdownOpen(false);
  };

  const goTo = (href: string) => {
    closeAllDropdowns();
    router.push(href);
  };

  // ✅ LOGOUT CORRETO (rota do seu backend)
  const handleLogout = async () => {
    try {
      await api.post('/logout', {}, { withCredentials: true });
    } catch (e) {
      console.warn('Logout falhou, mas vou seguir o fluxo.', e);
    } finally {
      closeAllDropdowns();
      router.replace('/login'); // ou '/' se preferir
      router.refresh();
    }
  };

  const PillIconButton = ({
    icon,
    active,
    onClick,
    ariaLabel,
  }: {
    icon: string;
    active?: boolean;
    onClick: () => void;
    ariaLabel: string;
  }) => (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="btn d-flex align-items-center justify-content-center"
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        background: active ? 'rgba(201,122,126,0.10)' : '#fff',
        border: `1px solid ${active ? 'rgba(201,122,126,0.35)' : ui.border}`,
        boxShadow: active ? ui.shadowSoft : 'none',
        transition: 'transform .12s ease, box-shadow .12s ease, background .12s ease',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <i className={`bi ${icon} fs-5`} style={{ color: ui.accent }} />
    </button>
  );

  const Dropdown = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 10px)',
        minWidth: 260,
        borderRadius: 18,
        background: '#fffaf0',
        border: `1px solid ${ui.border}`,
        boxShadow: ui.shadow,
        overflow: 'hidden',
        zIndex: 60,
      }}
    >
      {children}
    </div>
  );

  return (
    <header
      className="d-none d-lg-flex flex-column"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: `1px solid ${ui.border}`,
        background: `linear-gradient(180deg, ${ui.bgTop}, ${ui.bgBottom})`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="d-flex align-items-center justify-content-between px-5"
        style={{ paddingTop: 14, paddingBottom: 14 }}
      >
        {/* LOGO */}
        <Link href="/" onClick={closeAllDropdowns} style={{ textDecoration: 'none', color: ui.text }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.3 }}>Universo</span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  background: `linear-gradient(90deg, ${ui.gold}, ${ui.accent})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Império
              </span>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: ui.gold,
                  opacity: 0.85,
                  display: 'inline-block',
                }}
              />
            </div>
            <small style={{ color: ui.muted, marginTop: -2 }}>Decorações & Eventos</small>
          </div>
        </Link>

        {/* SEARCH */}
        {searchMenu && (
          <div
            className="mx-5 flex-grow-1"
            style={{
              maxWidth: 720,
              padding: 2,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.55)',
              border: `1px solid ${ui.border}`,
              boxShadow: ui.shadowSoft,
            }}
          >
            <SearchBar placeholder={placeholder} className="w-100" />
          </div>
        )}

        {/* MENU */}
        <nav className="d-flex align-items-center" style={{ gap: 10 }}>
          {menuPrincipal.map((item) => {
            const itensMenu = getItemsForMenu(item.id);

            // LOGIN / USER
            if (item.nome.toLowerCase() === 'login') {
              if (usuarioLoading) {
                return (
                  <div
                    key="usuario-loading"
                    style={{
                      height: 44,
                      borderRadius: 999,
                      padding: '0 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: '#fff',
                      border: `1px solid ${ui.border}`,
                      color: ui.muted,
                    }}
                  >
                    <i className="bi bi-person-circle" style={{ color: ui.accent, fontSize: 18 }} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Carregando...</span>
                  </div>
                );
              }

              if (!logado) {
                return (
                  <button
                    key="login"
                    type="button"
                    onClick={() => goTo('/login')}
                    className="btn"
                    style={{
                      height: 44,
                      borderRadius: 999,
                      padding: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: '#fff',
                      border: `1px solid ${ui.border}`,
                      boxShadow: ui.shadowSoft,
                      color: ui.text,
                      fontWeight: 900,
                    }}
                  >
                    <i className="bi bi-box-arrow-in-right" style={{ color: ui.accent, fontSize: 18 }} />
                    <span style={{ fontSize: 13 }}>Entrar</span>
                  </button>
                );
              }

              const userItems = getItemsForMenu(4) || [];

              return (
                <div key="usuario" className="position-relative">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setOpenDropdown(null);
                      setUserDropdownOpen((p) => !p);
                    }}
                    style={{
                      height: 44,
                      borderRadius: 999,
                      padding: '0 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: '#fff',
                      border: `1px solid ${userDropdownOpen ? 'rgba(201,122,126,0.35)' : ui.border}`,
                      boxShadow: userDropdownOpen ? ui.shadow : ui.shadowSoft,
                      color: ui.text,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(201,122,126,0.10)',
                        border: '1px solid rgba(201,122,126,0.22)',
                      }}
                      aria-hidden
                    >
                      <i className="bi bi-person-fill" style={{ color: ui.accent }} />
                    </div>

                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: 13,
                        maxWidth: 170,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {usuario?.nome}
                    </span>

                    <i
                      className={`bi ${userDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                      style={{ fontSize: 12, color: ui.muted }}
                    />
                  </button>

                  {userDropdownOpen && (
                    <Dropdown>
                      <div style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: 12, color: ui.muted, fontWeight: 700 }}>Minha conta</div>
                        <div style={{ fontSize: 14, color: ui.text, fontWeight: 900 }}>
                          {usuario?.nome}
                        </div>
                      </div>

                      <div style={{ padding: 8 }}>
                        {userItems.length > 0 ? (
                          userItems.map((sub) => (
                            <Link
                              key={sub.id}
                              href={sub.rota || '#'}
                              onClick={closeAllDropdowns}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 14,
                                textDecoration: 'none',
                                color: ui.text,
                                fontWeight: 800,
                                fontSize: 13,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,122,126,0.08)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <i className="bi bi-chevron-right" style={{ color: ui.accent }} />
                              <span>{sub.nome}</span>
                            </Link>
                          ))
                        ) : (
                          <div style={{ padding: 12, color: ui.muted, fontSize: 13 }}>
                            Nenhuma opção disponível
                          </div>
                        )}

                        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />

                        {/* ✅ LOGOUT USANDO A ROTA /logout */}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="btn w-100"
                          style={{
                            borderRadius: 14,
                            padding: '10px 12px',
                            background: 'rgba(220,53,69,0.08)',
                            border: '1px solid rgba(220,53,69,0.22)',
                            color: '#b02a37',
                            fontWeight: 900,
                          }}
                        >
                          <i className="bi bi-box-arrow-right me-2" />
                          Sair
                        </button>
                      </div>
                    </Dropdown>
                  )}
                </div>
              );
            }

            // dropdown por itens
            if (itensMenu.length > 0 && item.id !== undefined) {
              const menuId = item.id;
              const active = openDropdown === menuId;

              return (
                <div key={menuId} className="position-relative">
                  <PillIconButton
                    icon={item.icone || 'bi-grid'}
                    active={active}
                    ariaLabel={`Abrir menu ${item.nome}`}
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setOpenDropdown(active ? null : menuId);
                    }}
                  />

                  {active && (
                    <Dropdown>
                      <div
                        style={{
                          padding: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid rgba(0,0,0,0.06)',
                          background: 'linear-gradient(180deg, rgba(212,175,55,0.08), transparent)',
                        }}
                      >
                        <span style={{ fontWeight: 900, color: ui.text, fontSize: 14 }}>
                          {item.nome}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: '#6b4c4f',
                            borderRadius: 999,
                            padding: '6px 10px',
                            border: `1px solid ${ui.border}`,
                            background: 'rgba(212,175,55,0.12)',
                          }}
                        >
                          {itensMenu.length}
                        </span>
                      </div>

                      <div style={{ padding: 8 }}>
                        {itensMenu.map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.rota || '#'}
                            onClick={closeAllDropdowns}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 12px',
                              borderRadius: 14,
                              textDecoration: 'none',
                              color: ui.text,
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,122,126,0.08)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <i className="bi bi-chevron-right" style={{ color: ui.accent }} />
                            <span>{sub.nome}</span>
                          </Link>
                        ))}
                      </div>
                    </Dropdown>
                  )}
                </div>
              );
            }

            // link simples
            return (
              <Link
                key={item.id ?? item.nome}
                href={item.rota || '#'}
                onClick={closeAllDropdowns}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    height: 44,
                    borderRadius: 999,
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#fff',
                    border: `1px solid ${ui.border}`,
                    boxShadow: ui.shadowSoft,
                    color: ui.text,
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  <i className={`bi ${item.icone}`} style={{ color: ui.accent, fontSize: 18 }} />
                  <span>{item.nome}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      

      {/* clique fora */}
      {(openDropdown !== null || userDropdownOpen) && (
        <button
          type="button"
          aria-label="Fechar menus"
          onClick={closeAllDropdowns}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'default',
            zIndex: 40,
          }}
        />
      )}
    </header>
  );
}
