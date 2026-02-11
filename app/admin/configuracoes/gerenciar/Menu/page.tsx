'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/Api/conectar';
import {
  BiSearch,
  BiChevronDown,
  BiChevronUp,
  BiLockAlt,
  BiKey,
  BiPlus,
} from 'react-icons/bi';

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

  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [q, setQ] = useState('');

  async function carregarMenus() {
    setLoading(true);
    try {
      const res = await api.get('/admin/menu', { withCredentials: true });
      const data: Menu[] = res.data?.dados ?? [];
      setMenus(data);

      // abre os 2 primeiros por padrão
      const initial: Record<number, boolean> = {};
      data.slice(0, 2).forEach((m) => (initial[m.id_menu] = true));
      setOpen(initial);
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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return menus;

    return menus
      .map((m) => {
        const menuHit =
          m.nome.toLowerCase().includes(term) ||
          (m.rota ?? '').toLowerCase().includes(term);

        const itens = (m.itens ?? []).filter((it) => {
          return (
            it.nome.toLowerCase().includes(term) ||
            (it.rota ?? '').toLowerCase().includes(term) ||
            (it.icone ?? '').toLowerCase().includes(term)
          );
        });

        // se bate no menu, mostra tudo; se não, só itens filtrados
        return menuHit ? m : { ...m, itens };
      })
      .filter((m) => {
        const menuHit =
          m.nome.toLowerCase().includes(term) ||
          (m.rota ?? '').toLowerCase().includes(term);
        return menuHit || (m.itens?.length ?? 0) > 0;
      });
  }, [menus, q]);

  const totalMenus = menus.length;
  const totalItens = useMemo(
    () => menus.reduce((acc, m) => acc + (m.itens?.length ?? 0), 0),
    [menus]
  );

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Gerenciar Menus</h1>
          <p className="sub">
            {totalMenus} menus • {totalItens} itens
          </p>
        </div>

        <div className="actions">
          <div className="search">
            <BiSearch size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar menu, rota, item..."
            />
          </div>

          <button className="btnPrimary" type="button">
            <BiPlus size={18} />
            Novo menu
          </button>
        </div>
      </header>

      {loading ? (
        <div className="state">Carregando menus…</div>
      ) : filtered.length === 0 ? (
        <div className="state">Nada encontrado.</div>
      ) : (
        <div className="grid">
          {filtered.map((menu) => {
            const isOpen = !!open[menu.id_menu];
            const itens = menu.itens ?? [];

            return (
              <section key={menu.id_menu} className="card">
                <button
                  className="cardHead"
                  onClick={() =>
                    setOpen((prev) => ({
                      ...prev,
                      [menu.id_menu]: !prev[menu.id_menu],
                    }))
                  }
                  type="button"
                >
                  <div className="titleArea">
                    <div className="titleRow">
                      <span className="title">{menu.nome}</span>
                      <span className="badge">{itens.length}</span>
                    </div>
                    <span className="meta">{menu.rota || '—'}</span>
                  </div>

                  <div className="headBtns">
                    <button
                      className="iconBtn"
                      title="Criar permissão do menu"
                      onClick={(e) => {
                        e.stopPropagation();
                        criarPermissaoMenu(menu.id_menu);
                      }}
                      type="button"
                    >
                      <BiLockAlt size={18} />
                    </button>

                    <span className="chev" aria-hidden>
                      {isOpen ? <BiChevronUp size={22} /> : <BiChevronDown size={22} />}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="content">
                    {itens.length === 0 ? (
                      <div className="empty">Nenhum item neste menu</div>
                    ) : (
                      <ul className="list">
                        {itens
                          .slice()
                          .sort((a, b) => (a.posicao ?? 9999) - (b.posicao ?? 9999))
                          .map((item) => (
                            <li key={item.id_item} className="row">
                              <div className="left">
                                <div className="rowTitle">{item.nome}</div>
                                <div className="rowMeta">
                                  <span className="pill">{item.rota || '—'}</span>
                                  <span className="pill">{item.icone || '—'}</span>
                                  <span className="pill">Pos: {item.posicao ?? '—'}</span>
                                </div>
                              </div>

                              <button
                                className="iconBtn soft"
                                title="Criar permissão do item"
                                onClick={() => criarPermissaoItem(menu.id_menu, item.id_item)}
                                type="button"
                              >
                                <BiKey size={18} />
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .wrap {
          padding: 28px;
          background: #f6f8fb;
          min-height: 100vh;
        }

        .top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.4px;
        }

        .sub {
          margin: 6px 0 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          min-width: 320px;
          box-shadow: 0 10px 22px rgba(2, 6, 23, 0.04);
        }

        .search input {
          width: 100%;
          border: none;
          outline: none;
          font-size: 14px;
          color: #0f172a;
          background: transparent;
        }

        .btnPrimary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          padding: 10px 14px;
          border-radius: 12px;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 12px 26px rgba(37, 99, 235, 0.25);
        }

        .state {
          padding: 44px 0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 14px;
        }

        .card {
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 14px 30px rgba(2, 6, 23, 0.05);
        }

        .cardHead {
          width: 100%;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 16px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .titleArea {
          text-align: left;
          display: grid;
          gap: 3px;
        }

        .titleRow {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.2px;
        }

        .badge {
          font-size: 12px;
          font-weight: 900;
          color: #1d4ed8;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .meta {
          font-size: 12px;
          color: #64748b;
        }

        .headBtns {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chev {
          color: #64748b;
          display: grid;
          place-items: center;
        }

        .content {
          padding: 0 14px 14px 14px;
        }

        .empty {
          padding: 12px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          color: #64748b;
          font-size: 13px;
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }

        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .left {
          min-width: 0;
        }

        .rowTitle {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .rowMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pill {
          font-size: 12px;
          color: #475569;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 4px 8px;
          border-radius: 999px;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .iconBtn {
          border: none;
          cursor: pointer;
          padding: 10px;
          border-radius: 12px;
          background: #eef2ff;
          color: #1d4ed8;
          display: grid;
          place-items: center;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .iconBtn.soft {
          background: #e0f2fe;
          color: #0369a1;
        }

        .iconBtn:hover {
          transform: translateY(-1px);
          background: #c7d2fe;
        }

        @media (max-width: 720px) {
          .top {
            flex-direction: column;
            align-items: stretch;
          }
          .search {
            min-width: 0;
            width: 100%;
          }
          .actions {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
