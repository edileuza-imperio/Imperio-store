'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import SearchBar from '../Pesquisa/SearchBar';
import useUsuario from '@/hooks/Auth/useUsuario';
import api from '@/Api/conectar';

interface Menu {
  id?: number;
  nome: string;
  icone?: string;
  rota?: string;
  pesquisa_placeholder?: string | null;
}

interface MenuItem {
  id_item?: number;
  nome: string;
  icone?: string;
  rota?: string;
  posicao?: number;
  menu_id?: number;
}

interface NavbarDesktopProps {
  menus: Menu[];
  searchPlaceholder?: string;
}

export default function NavbarDesktop({
  menus,
  searchPlaceholder,
}: NavbarDesktopProps) {
  const router = useRouter();
  const { usuario, loading: usuarioLoading, logado } = useUsuario();

  // 🔥 STATE LOCAL PARA ITENS
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // ==================================================
  // 🔥 BUSCAR ITENS POR NÍVEL
  // ==================================================
  useEffect(() => {
    if (!usuario?.nivel_id) return;

    const fetchMenuItems = async () => {
      try {
        setMenuLoading(true);
        setMenuError(null);

        console.log('👤 Usuário:', usuario);
        console.log('🎯 Nivel ID:', usuario.nivel_id);

        const response = await api.get(
          `/menu/nivel/${usuario.nivel_id}`
        );

        console.log('📦 Resposta completa:', response);
        console.log('📦 response.data:', response.data);

        const data = response.data;

        if (data.status !== 200) {
          throw new Error(data.mensagem || 'Erro ao buscar itens');
        }

        console.log('✅ Itens recebidos:', data.dados);

        setMenuItems(data.dados || []);
      } catch (err: any) {
        console.error('❌ Erro ao buscar menu:', err);
        setMenuError(err.message || 'Erro ao buscar menu');
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenuItems();
  }, [usuario]);

  console.log('📌 menuItems state:', menuItems);

  // ==================================================
  // HELPERS
  // ==================================================
  const searchMenu = useMemo(
    () => menus.find((m) => m.pesquisa_placeholder),
    [menus]
  );

  const placeholder =
    searchPlaceholder ??
    searchMenu?.pesquisa_placeholder ??
    'Buscar...';

  const menuPrincipal = useMemo(
    () => menus.filter((m) => !m.pesquisa_placeholder),
    [menus]
  );

  const getItemsForMenu = (menuId?: number) => {
    if (!menuId) return [];

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

  const handleLogout = async () => {
    try {
      await api.post('/logout', {}, { withCredentials: true });
    } catch (e) {
      console.warn('Logout falhou:', e);
    } finally {
      closeAllDropdowns();
      router.replace('/login');
      router.refresh();
    }
  };

  // ==================================================
  // RENDER
  // ==================================================
  return (
    <header
      className="d-none d-lg-flex flex-column border-bottom"
      style={{
        position: 'sticky',
        top: 0,
        background: '#fffaf0',
        zIndex: 50,
      }}
    >
      <div className="d-flex align-items-center justify-content-between px-5 py-3">

        {/* LOGO */}
        <Link href="/" style={{ textDecoration: 'none', fontWeight: 900 }}>
          Universo Império
        </Link>

        {/* SEARCH */}
        {searchMenu && (
          <div style={{ maxWidth: 600, width: '100%' }}>
            <SearchBar placeholder={placeholder} />
          </div>
        )}

        {/* MENU */}
        <nav className="d-flex align-items-center gap-2">

          {menuPrincipal.map((menu) => {
            const itensMenu = getItemsForMenu(menu.id);

            // LOGIN
            if (menu.nome.toLowerCase() === 'login') {

              if (usuarioLoading) {
                return <div key="loading">Carregando...</div>;
              }

              if (!logado) {
                return (
                  <button
                    key="login"
                    onClick={() => goTo('/login')}
                    className="btn btn-outline-dark"
                  >
                    Entrar
                  </button>
                );
              }

              const userItems = getItemsForMenu(menu.id);

              return (
                <div key="usuario" className="position-relative">

                  <button
                    className="btn btn-outline-dark"
                    onClick={() =>
                      setUserDropdownOpen((prev) => !prev)
                    }
                  >
                    {usuario?.nome}
                  </button>

                  {userDropdownOpen && (
                    <div className="position-absolute bg-white border p-3">
                      {userItems.length > 0 ? (
                        userItems.map((sub) => (
                          <div key={sub.id_item}>
                            <Link href={sub.rota || '#'}>
                              {sub.nome}
                            </Link>
                          </div>
                        ))
                      ) : (
                        <div>Nenhuma opção disponível</div>
                      )}

                      <hr />

                      <button
                        onClick={handleLogout}
                        className="btn btn-danger w-100"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // MENU COM DROPDOWN
            if (itensMenu.length > 0) {
              return (
                <div key={menu.id} className="position-relative">
                  <button
                    className="btn btn-outline-dark"
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === menu.id
                          ? null
                          : menu.id!
                      )
                    }
                  >
                    {menu.nome}
                  </button>

                  {openDropdown === menu.id && (
                    <div className="position-absolute bg-white border p-3">
                      {itensMenu.map((sub) => (
                        <div key={sub.id_item}>
                          <Link href={sub.rota || '#'}>
                            {sub.nome}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // LINK SIMPLES
            return (
              <Link
                key={menu.id}
                href={menu.rota || '#'}
                className="btn btn-outline-dark"
              >
                {menu.nome}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 🔥 DEBUG VISUAL */}
      <div style={{ padding: 15, background: '#fff' }}>
        <strong>DEBUG MENU ITEMS:</strong>

        {menuLoading && <div>Carregando...</div>}
        {menuError && <div style={{ color: 'red' }}>{menuError}</div>}

        {menuItems.map((item) => (
          <div key={item.id_item}>
            {item.nome} | menu_id: {item.menu_id}
          </div>
        ))}
      </div>
    </header>
  );
}