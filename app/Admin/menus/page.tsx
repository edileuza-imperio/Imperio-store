"use client";

import api from "@/Api/conectar";
import { useEffect, useState } from "react";


type MenuItem = {
  id_item: number;
  menu_id: number;
  nome: string;
  rota: string | null;
  icone: string | null;
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
  dados: Menu[];
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

        setRespostaBruta(response.data);
        setMenus(Array.isArray(response.data?.dados) ? response.data.dados : []);
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
          <h1 style={styles.title}>Teste de Menus</h1>
          <p style={styles.subtitle}>
            Página simples para verificar se a rota <strong>/painel/menus</strong>{" "}
            está retornando corretamente.
          </p>
        </header>

        {loading && (
          <div style={styles.boxInfo}>
            <p style={styles.infoText}>Carregando menus...</p>
          </div>
        )}

        {erro && (
          <div style={{ ...styles.boxInfo, borderColor: "#dc2626", background: "#fef2f2" }}>
            <p style={{ ...styles.infoText, color: "#991b1b" }}>
              <strong>Erro:</strong> {erro}
            </p>
          </div>
        )}

        {!loading && !erro && (
          <>
            <section style={styles.boxInfo}>
              <p style={styles.infoText}>
                <strong>Status:</strong> {respostaBruta?.status ?? "-"}
              </p>
              <p style={styles.infoText}>
                <strong>Mensagem:</strong> {respostaBruta?.mensagem ?? "-"}
              </p>
              <p style={styles.infoText}>
                <strong>Total de menus:</strong> {menus.length}
              </p>
            </section>

            <section style={styles.grid}>
              {menus.length > 0 ? (
                menus.map((menu) => (
                  <article key={menu.id_menu} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <h2 style={styles.cardTitle}>{menu.nome}</h2>
                      <span style={styles.badge}>ID {menu.id_menu}</span>
                    </div>

                    <div style={styles.cardBody}>
                      <p>
                        <strong>Site Config ID:</strong> {menu.site_config_id}
                      </p>

                      <p>
                        <strong>Ícone:</strong> {menu.icone || "Sem ícone"}
                      </p>

                      <p>
                        <strong>Rota:</strong> {menu.rota || "Sem rota"}
                      </p>

                      <p>
                        <strong>Placeholder:</strong>{" "}
                        {menu.pesquisa_placeholder || "Sem placeholder"}
                      </p>

                      <div style={styles.itemsBox}>
                        <h3 style={styles.itemsTitle}>
                          Itens do menu ({menu.itens?.length || 0})
                        </h3>

                        {menu.itens && menu.itens.length > 0 ? (
                          <ul style={styles.list}>
                            {menu.itens.map((item) => (
                              <li key={item.id_item} style={styles.listItem}>
                                <p>
                                  <strong>Nome:</strong> {item.nome}
                                </p>
                                <p>
                                  <strong>ID Item:</strong> {item.id_item}
                                </p>
                                <p>
                                  <strong>Rota:</strong> {item.rota || "Sem rota"}
                                </p>
                                <p>
                                  <strong>Ícone:</strong> {item.icone || "Sem ícone"}
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
                ))
              ) : (
                <div style={styles.boxInfo}>
                  <p style={styles.infoText}>Nenhum menu encontrado.</p>
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
    padding: "32px 16px",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#475569",
    margin: 0,
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
    alignItems: "center",
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
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.6,
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