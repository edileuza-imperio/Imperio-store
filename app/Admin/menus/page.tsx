"use client";

import api from "@/Api/conectar";
import { useEffect, useState } from "react";

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
  const [respostaBruta, setRespostaBruta] = useState<ApiResponse | null>(null);

  useEffect(() => {
    async function carregarMenus() {
      try {
        setLoading(true);
        setErro(null);

        const response = await api.get<ApiResponse>("/painel/menus");
        const payload = response.data;

        setRespostaBruta(payload);

        let listaMenus: Menu[] = [];

        if (Array.isArray(payload?.dados)) {
          listaMenus = payload.dados;
        } else if (payload?.dados && Array.isArray(payload.dados.dados)) {
          listaMenus = payload.dados.dados;
        }

        setMenus(listaMenus);
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

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Listar Menus</h1>
            <p style={styles.subtitle}>
              Visualização dos menus cadastrados em tabela e cards.
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
                <span style={styles.statLabel}>Status</span>
                <strong style={styles.statValue}>
                  {respostaBruta?.status ?? "-"}
                </strong>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statLabel}>Mensagem</span>
                <strong style={styles.statValue}>
                  {respostaBruta?.mensagem ?? "-"}
                </strong>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total de menus</span>
                <strong style={styles.statValue}>{menus.length}</strong>
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
                        <th style={styles.th}>Ícone</th>
                        <th style={styles.th}>Placeholder</th>
                        <th style={styles.th}>Itens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menus.map((menu) => (
                        <tr key={menu.id_menu}>
                          <td style={styles.td}>{menu.id_menu}</td>
                          <td style={styles.td}>{menu.nome}</td>
                          <td style={styles.td}>{menu.rota || "Sem rota"}</td>
                          <td style={styles.td}>{menu.icone || "Sem ícone"}</td>
                          <td style={styles.td}>
                            {menu.pesquisa_placeholder || "Sem placeholder"}
                          </td>
                          <td style={styles.td}>{menu.itens?.length || 0}</td>
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
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Cards dos Menus</h2>
              </div>

              {menus.length > 0 ? (
                <div style={styles.grid}>
                  {menus.map((menu) => (
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
                          <span style={styles.infoValue}>
                            {menu.site_config_id}
                          </span>
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
                                    <strong>Rota:</strong>{" "}
                                    {item.rota || "Sem rota"}
                                  </p>
                                  <p style={styles.itemText}>
                                    <strong>Ícone:</strong>{" "}
                                    {item.icone || "Sem ícone"}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p style={styles.emptyText}>
                              Esse menu não possui itens.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyBox}>
                  <p style={styles.emptyText}>Nenhum menu encontrado.</p>
                </div>
              )}
            </section>

            <section style={styles.jsonBox}>
              <h2 style={styles.jsonTitle}>Resposta bruta da API</h2>
              <pre style={styles.pre}>
                {JSON.stringify(respostaBruta, null, 2)}
              </pre>
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
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#0f172a",
    verticalAlign: "top",
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
  jsonBox: {
    marginTop: "24px",
    background: "#0f172a",
    borderRadius: "18px",
    padding: "18px",
    overflow: "auto",
  },
  jsonTitle: {
    color: "#f8fafc",
    fontSize: "18px",
    marginBottom: "12px",
  },
  pre: {
    color: "#cbd5e1",
    fontSize: "13px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: 0,
  },
};