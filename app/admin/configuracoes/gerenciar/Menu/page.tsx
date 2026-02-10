'use client';

import { useEffect, useState } from 'react';
import api from '@/Api/conectar';

interface MenuItem {
  id_item: number;
  nome: string;
  icone?: string | null;
  rota?: string | null;
  posicao?: number;
}

interface Menu {
  id_menu: number;
  nome: string;
  icone?: string | null;
  rota?: string | null;
  itens: MenuItem[];
}

export default function GerenciarMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarMenus() {
    try {
      console.log('📂 Carregando menus com itens...');
      const res = await api.get('/admin/menu', { withCredentials: true });
      setMenus(res.data?.dados ?? []);
    } catch (e) {
      console.error('❌ Erro ao carregar menus', e);
      setMenus([]);
    } finally {
      setLoading(false);
    }
  }

  function criarPermissaoMenu(menuId: number) {
    console.log('🔐 Criar permissão MENU:', menuId);
    // abrir modal futuramente
  }

  function criarPermissaoItem(menuId: number, itemId: number) {
    console.log('🔑 Criar permissão ITEM:', { menuId, itemId });
    // abrir modal futuramente
  }

  useEffect(() => {
    carregarMenus();
  }, []);

  return (
    <div className="page">
      <header className="header">
        <h1>📂 Gerenciar Menus</h1>
        <button className="btn-primary">+ Novo Menu</button>
      </header>

      {loading ? (
        <p className="info">Carregando menus...</p>
      ) : menus.length === 0 ? (
        <p className="info">Nenhum menu cadastrado</p>
      ) : (
        <div className="menu-list">
          {menus.map(menu => (
            <div key={menu.id_menu} className="menu-card">
              <div className="menu-header">
                <div>
                  <strong>{menu.nome}</strong>
                  <span className="rota">{menu.rota || '—'}</span>
                </div>

                <button
                  className="icon-btn"
                  title="Criar permissão para o menu"
                  onClick={() => criarPermissaoMenu(menu.id_menu)}
                >
                  🔐
                </button>
              </div>

              {menu.itens.length === 0 ? (
                <p className="sem-itens">Nenhum item neste menu</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Ícone</th>
                      <th>Rota</th>
                      <th>Posição</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.itens.map(item => (
                      <tr key={item.id_item}>
                        <td>{item.nome}</td>
                        <td>{item.icone || '—'}</td>
                        <td>{item.rota || '—'}</td>
                        <td>{item.posicao ?? '—'}</td>
                        <td>
                          <button
                            className="icon-btn small"
                            title="Criar permissão para o item"
                            onClick={() =>
                              criarPermissaoItem(menu.id_menu, item.id_item)
                            }
                          >
                            🔑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .page {
          padding: 32px;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        h1 {
          font-size: 26px;
          font-weight: 800;
          color: #111827;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          color: #fff;
          border: none;
          padding: 12px 18px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .info {
          text-align: center;
          color: #6b7280;
          margin-top: 40px;
          font-size: 15px;
        }

        .menu-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .menu-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
        }

        .menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .menu-header strong {
          font-size: 17px;
          color: #111827;
        }

        .rota {
          display: block;
          font-size: 13px;
          color: #6b7280;
          margin-top: 2px;
        }

        .sem-itens {
          color: #9ca3af;
          font-size: 14px;
          padding: 10px 0;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }

        th,
        td {
          padding: 12px 14px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          font-size: 14px;
        }

        th {
          background: #f9fafb;
          font-weight: 700;
          color: #374151;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .icon-btn {
          background: #eef2ff;
          border: none;
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .icon-btn.small {
          padding: 6px 8px;
          font-size: 15px;
        }

        .icon-btn:hover {
          background: #c7d2fe;
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
