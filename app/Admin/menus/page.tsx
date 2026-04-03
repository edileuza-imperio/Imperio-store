"use client";

import api from "@/Api/conectar";
import { useEffect, useState } from "react";

type MenuPermissao = {
  id_permissao: number;
  menu_id: number;
  item_id: number | null;
  nivel_id: number;
  status_id: number;
  criado?: string | null;
};

type MenuItem = {
  id_item: number;
  menu_id: number;
  nome: string;
  rota: string | null;
  icone: string | null;
  posicao?: number;
};

type Menu = {
  id_menu: number;
  site_config_id: number;
  nome: string;
  icone: string | null;
  rota: string | null;
  pesquisa_placeholder: string | null;
  itens: MenuItem[];
  permissoes?: MenuPermissao[];
};

type ApiResponse = {
  status: number;
  mensagem: string;
  dados:
    | Menu[]
    | {
        mensagem?: string;
        dados?: Menu[];
      };
};

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState<number | null>(null);

  function normalizarLista<T>(dados: any): T[] {
    if (Array.isArray(dados)) return dados;
    if (dados && Array.isArray(dados.dados)) return dados.dados;
    return [];
  }

  async function carregarPermissoesDoMenu(menuId: number): Promise<MenuPermissao[]> {
    try {
      const response = await api.get(`/painel/menu/${menuId}/permissoes`);
      return normalizarLista<MenuPermissao>(response?.data?.dados);
    } catch (error) {
      console.error(`Erro ao carregar permissões do menu ${menuId}:`, error);
      return [];
    }
  }

  useEffect(() => {
    async function carregarMenus() {
      try {
        setLoading(true);
        setErro(null);

        const response = await api.get<ApiResponse>("/painel/menus");
        const payload = response.data;

        let listaMenus: Menu[] = [];

        if (Array.isArray(payload?.dados)) {
          listaMenus = payload.dados;
        } else if (payload?.dados && Array.isArray(payload.dados.dados)) {
          listaMenus = payload.dados.dados;
        }

        const menusComPermissoes = await Promise.all(
          listaMenus.map(async (menu) => {
            const permissoes = await carregarPermissoesDoMenu(menu.id_menu);

            return {
              ...menu,
              permissoes,
            };
          })
        );

        setMenus(menusComPermissoes);
      } catch (error: any) {
        console.error("Erro ao buscar menus:", error);

        const mensagem =
          error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao carregar os menus.";

        setErro(mensagem);
      } finally {
        setLoading(false);
      }
    }

    carregarMenus();
  }, []);

  function irParaAdicionarItem(menuId: number) {
    window.location.href = `/Admin/menus/adicionar-item?menu_id=${menuId}`;
  }

  function irParaAdicionarPermissao(menuId: number) {
    window.location.href = `/Admin/menus/adicionar-permissao?menu_id=${menuId}`;
  }

  function alternarVisualizacaoPermissoes(menuId: number) {
    setMenuAberto((atual) => (atual === menuId ? null : menuId));
  }

  function getNiveisUnicos(menu: Menu) {
    const niveis = (menu.permissoes || []).map((p) => p.nivel_id);
    return [...new Set(niveis)];
  }

  function getStatusUnicos(menu: Menu) {
    const status = (menu.permissoes || []).map((p) => p.status_id);
    return [...new Set(status)];
  }

  function getNomeItem(menu: Menu, itemId: number | null) {
    if (!itemId) return "Menu inteiro";
    const item = (menu.itens || []).find((i) => i.id_item === itemId);
    return item ? item.nome : `Item ${itemId}`;
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Listar Menus</h1>
            <p style={styles.subtitle}>
              Visualização dos menus cadastrados com seus itens e permissões.
            </p>
          </div>

          <button
            style={styles.refreshButton}
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </header>

        {loading && (
          <div style={styles.boxInfo}>
            <p style={styles.infoText}>Carregando menus...</p>
          </div>
        )}

        {erro && (
          <div
            style={{
              ...styles.boxInfo,
              borderColor: "#fecaca",
              background: "#fef2f2",
            }}
          >
            <p style={{ ...styles.infoText, color: "#b91c1c" }}>
              <strong>Erro:</strong> {erro}
            </p>
          </div>
        )}

        {!loading && !erro && (
          <>
            <section style={styles.statsRow}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total de menus</span>
                <strong style={styles.statValue}>{menus.length}</strong>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total de itens</span>
                <strong style={styles.statValue}>
                  {menus.reduce((total, menu) => total + (menu.itens?.length || 0), 0)}
                </strong>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total de permissões</span>
                <strong style={styles.statValue}>
                  {menus.reduce(
                    (total, menu) => total + (menu.permissoes?.length || 0),
                    0
                  )}
                </strong>
              </div>
            </section>

            <section style={styles.tableSection}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Tabela de Menus</h2>
              </div>

              {menus.length > 0 ? (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Nome</th>
                        <th style={styles.th}>Rota</th>
                        <th style={styles.th}>Itens</th>
                        <th style={styles.th}>Permissões</th>
                        <th style={styles.th}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menus.map((menu) => (
                        <tr key={menu.id_menu}>
                          <td style={styles.td}>{menu.id_menu}</td>
                          <td style={styles.td}>{menu.nome}</td>
                          <td style={styles.td}>{menu.rota || "Sem rota"}</td>
                          <td style={styles.td}>{menu.itens?.length || 0}</td>
                          <td style={styles.td}>{menu.permissoes?.length || 0}</td>
                          <td style={styles.td}>
                            <div style={styles.actionsInline}>
                              <button
                                style={styles.itemButton}
                                onClick={() => irParaAdicionarItem(menu.id_menu)}
                              >
                                + Item
                              </button>

                              <button
                                style={styles.permissionButton}
                                onClick={() => irParaAdicionarPermissao(menu.id_menu)}
                              >
                                + Permissão
                              </button>

                              <button
                                style={styles.viewButton}
                                onClick={() => alternarVisualizacaoPermissoes(menu.id_menu)}
                                title="Visualizar permissões"
                              >
                                <span style={styles.eyeIcon}>👁</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.emptyBox}>
                  <p style={styles.emptyText}>Nenhum menu encontrado.</p>
                </div>
              )}
            </section>

            <section style={styles.cardsSection}>
              <div style={styles.sectionHeaderTransparent}>
                <h2 style={styles.sectionTitle}>Cards dos Menus</h2>
              </div>

              {menus.length > 0 ? (
                <div style={styles.grid}>
                  {menus.map((menu) => {
                    const aberto = menuAberto === menu.id_menu;

                    return (
                      <article key={menu.id_menu} style={styles.card}>
                        <div style={styles.cardHeader}>
                          <div>
                            <h3 style={styles.cardTitle}>{menu.nome}</h3>
                            <p style={styles.cardSub}>Menu administrativo</p>
                          </div>
                          <span style={styles.badge}>ID {menu.id_menu}</span>
                        </div>

                        <div style={styles.cardBody}>
                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Site Config</span>
                            <span style={styles.infoValue}>{menu.site_config_id}</span>
                          </div>

                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Rota</span>
                            <span style={styles.infoValue}>
                              {menu.rota || "Sem rota"}
                            </span>
                          </div>

                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Ícone</span>
                            <span style={styles.infoValue}>
                              {menu.icone || "Sem ícone"}
                            </span>
                          </div>

                          <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Placeholder</span>
                            <span style={styles.infoValue}>
                              {menu.pesquisa_placeholder || "Sem placeholder"}
                            </span>
                          </div>

                          <div style={styles.actionRow}>
                            <button
                              style={styles.itemButton}
                              onClick={() => irParaAdicionarItem(menu.id_menu)}
                            >
                              Adicionar Item
                            </button>

                            <button
                              style={styles.permissionButton}
                              onClick={() => irParaAdicionarPermissao(menu.id_menu)}
                            >
                              Adicionar Permissão
                            </button>

                            <button
                              style={styles.viewButton}
                              onClick={() => alternarVisualizacaoPermissoes(menu.id_menu)}
                              title="Visualizar permissões"
                            >
                              <span style={styles.eyeIcon}>👁</span>
                              {aberto ? " Ocultar" : " Ver permissões"}
                            </button>
                          </div>

                          <div style={styles.permissionsBox}>
                            <h4 style={styles.itemsTitle}>
                              Permissões ({menu.permissoes?.length || 0})
                            </h4>

                            <div style={styles.badgesWrap}>
                              <span style={styles.permissionCountBadge}>
                                {menu.permissoes?.length || 0} permissões
                              </span>

                              {getNiveisUnicos(menu).map((nivelId) => (
                                <span
                                  key={`nivel-${menu.id_menu}-${nivelId}`}
                                  style={styles.levelBadge}
                                >
                                  Nível {nivelId}
                                </span>
                              ))}

                              {getStatusUnicos(menu).map((statusId) => (
                                <span
                                  key={`status-${menu.id_menu}-${statusId}`}
                                  style={styles.statusBadge}
                                >
                                  Status {statusId}
                                </span>
                              ))}
                            </div>

                            {(menu.permissoes?.length || 0) === 0 && (
                              <p style={styles.emptyText}>
                                Esse menu não possui permissões cadastradas.
                              </p>
                            )}

                            {aberto && (menu.permissoes?.length || 0) > 0 && (
                              <div style={styles.permissionListBox}>
                                <h5 style={styles.permissionListTitle}>
                                  Permissões detalhadas
                                </h5>

                                <ul style={styles.permissionList}>
                                  {(menu.permissoes || []).map((permissao) => (
                                    <li
                                      key={permissao.id_permissao}
                                      style={styles.permissionListItem}
                                    >
                                      <div style={styles.permissionTop}>
                                        <span style={styles.permissionIdBadge}>
                                          #{permissao.id_permissao}
                                        </span>
                                        <span style={styles.permissionItemBadge}>
                                          {getNomeItem(menu, permissao.item_id)}
                                        </span>
                                      </div>

                                      <p style={styles.permissionText}>
                                        <strong>Menu:</strong> {permissao.menu_id}
                                      </p>
                                      <p style={styles.permissionText}>
                                        <strong>Item:</strong>{" "}
                                        {getNomeItem(menu, permissao.item_id)}
                                      </p>
                                      <p style={styles.permissionText}>
                                        <strong>Nível:</strong> {permissao.nivel_id}
                                      </p>
                                      <p style={styles.permissionText}>
                                        <strong>Status:</strong> {permissao.status_id}
                                      </p>
                                      <p style={styles.permissionText}>
                                        <strong>Criado:</strong>{" "}
                                        {permissao.criado || "Não informado"}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div style={styles.itemsBox}>
                            <h4 style={styles.itemsTitle}>
                              Itens do menu ({menu.itens?.length || 0})
                            </h4>

                            {menu.itens && menu.itens.length > 0 ? (
                              <ul style={styles.list}>
                                {menu.itens.map((item) => (
                                  <li key={item.id_item} style={styles.listItem}>
                                    <div style={styles.itemTop}>
                                      <strong>{item.nome}</strong>
                                      <span style={styles.itemBadge}>
                                        #{item.id_item}
                                      </span>
                                    </div>

                                    <p style={styles.itemText}>
                                      <strong>Rota:</strong> {item.rota || "Sem rota"}
                                    </p>

                                    <p style={styles.itemText}>
                                      <strong>Ícone:</strong> {item.icone || "Sem ícone"}
                                    </p>

                                    <p style={styles.itemText}>
                                      <strong>Posição:</strong> {item.posicao ?? 0}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p style={styles.emptyText}>Esse menu não possui itens.</p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptyBox}>
                  <p style={styles.emptyText}>Nenhum menu encontrado.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px 16px 40px",
  },
  container: {
    maxWidth: "1280px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    fontSize: "15px",
    color: "#64748b",
    marginTop: "8px",
    marginBottom: 0,
  },
  refreshButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  boxInfo: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "20px",
  },
  infoText: {
    margin: "6px 0",
    color: "#1e293b",
    fontSize: "15px",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
  },
  statLabel: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },
  statValue: {
    fontSize: "20px",
    color: "#0f172a",
  },
  tableSection: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    marginBottom: "24px",
    overflow: "hidden",
  },
  cardsSection: {
    marginBottom: "24px",
  },
  sectionHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #e2e8f0",
    background: "#fff",
  },
  sectionHeaderTransparent: {
    marginBottom: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "13px",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#0f172a",
    verticalAlign: "top",
  },
  actionsInline: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
  },
  cardHeader: {
    padding: "16px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "capitalize",
  },
  cardSub: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },
  badge: {
    fontSize: "12px",
    fontWeight: 700,
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    whiteSpace: "nowrap",
  },
  cardBody: {
    padding: "16px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px dashed #e2e8f0",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  infoValue: {
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: 600,
    textAlign: "right",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "16px",
  },
  itemButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },
  permissionButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#7c3aed",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },
  viewButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },
  eyeIcon: {
    marginRight: "4px",
  },
  permissionsBox: {
    marginTop: "16px",
    padding: "14px",
    background: "#faf5ff",
    borderRadius: "14px",
    border: "1px solid #e9d5ff",
  },
  badgesWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "10px",
  },
  permissionCountBadge: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#6d28d9",
    background: "#ede9fe",
    padding: "6px 10px",
    borderRadius: "999px",
  },
  levelBadge: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#1d4ed8",
    background: "#dbeafe",
    padding: "6px 10px",
    borderRadius: "999px",
  },
  statusBadge: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#065f46",
    background: "#d1fae5",
    padding: "6px 10px",
    borderRadius: "999px",
  },
  permissionListBox: {
    marginTop: "14px",
    padding: "12px",
    background: "#ffffff",
    border: "1px solid #e9d5ff",
    borderRadius: "12px",
  },
  permissionListTitle: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    color: "#581c87",
    fontWeight: 800,
  },
  permissionList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: "10px",
  },
  permissionListItem: {
    background: "#faf5ff",
    border: "1px solid #e9d5ff",
    borderRadius: "12px",
    padding: "12px",
  },
  permissionTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  permissionIdBadge: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#7c3aed",
    background: "#ede9fe",
    padding: "4px 8px",
    borderRadius: "999px",
  },
  permissionItemBadge: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#1f2937",
    background: "#f3f4f6",
    padding: "4px 8px",
    borderRadius: "999px",
  },
  permissionText: {
    margin: "4px 0",
    color: "#334155",
    fontSize: "14px",
  },
  itemsBox: {
    marginTop: "16px",
    padding: "14px",
    background: "#f8fafc",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
  },
  itemsTitle: {
    margin: "0 0 12px 0",
    fontSize: "16px",
    color: "#0f172a",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: "10px",
  },
  listItem: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  },
  itemBadge: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#1d4ed8",
    background: "#eff6ff",
    padding: "4px 8px",
    borderRadius: "999px",
  },
  itemText: {
    margin: "4px 0",
    color: "#334155",
    fontSize: "14px",
  },
  emptyBox: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
  },
  emptyText: {
    margin: 0,
    color: "#64748b",
  },
};