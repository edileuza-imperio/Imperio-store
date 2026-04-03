"use client";

import api from "@/Api/conectar";
import { useEffect, useState } from "react";

type Permissao = {
  id_permissao: number;
  menu_id: number;
  item_id: number | null;
  nivel_id: number;
  status_id: number;
  criado?: string | null;
};

type Nivel = {
  id_nivel: number;
  nome: string;
};

type Status = {
  id_status: number;
  nome: string;
};

export default function AdicionarPermissaoPage() {
  const [menuId, setMenuId] = useState<number | null>(null);

  const [itemId, setItemId] = useState("");
  const [nivelId, setNivelId] = useState("");
  const [statusId, setStatusId] = useState("");

  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("menu_id");

    if (id) {
      const numero = Number(id);
      if (!Number.isNaN(numero)) {
        setMenuId(numero);
      }
    }
  }, []);

  async function carregarPermissoes(id: number) {
    try {
      const response = await api.get(`/painel/menu/${id}/permissoes`);
      const dados = response?.data?.dados;

      if (Array.isArray(dados)) {
        setPermissoes(dados);
        return;
      }

      if (dados && Array.isArray(dados.dados)) {
        setPermissoes(dados.dados);
        return;
      }

      setPermissoes([]);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setPermissoes([]);
    }
  }

  async function carregarNiveis() {
    try {
      const response = await api.get("/painel/niveis");
      const dados = response?.data?.dados;

      if (Array.isArray(dados)) {
        setNiveis(dados);
        return;
      }

      if (dados && Array.isArray(dados.dados)) {
        setNiveis(dados.dados);
        return;
      }

      setNiveis([]);
    } catch (error) {
      console.error("Erro ao carregar níveis:", error);
      setNiveis([]);
    }
  }

  async function carregarStatus() {
    try {
      const response = await api.get("/painel/status");
      const dados = response?.data?.dados;

      if (Array.isArray(dados)) {
        setStatusList(dados);
        return;
      }

      if (dados && Array.isArray(dados.dados)) {
        setStatusList(dados.dados);
        return;
      }

      setStatusList([]);
    } catch (error) {
      console.error("Erro ao carregar status:", error);
      setStatusList([]);
    }
  }

  useEffect(() => {
    async function carregarTudo() {
      try {
        setLoading(true);
        setErro(null);

        await Promise.all([carregarNiveis(), carregarStatus()]);

        if (menuId) {
          await carregarPermissoes(menuId);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    carregarTudo();
  }, [menuId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErro(null);
    setSucesso(null);

    if (!menuId) {
      setErro("menu_id inválido ou não informado na URL.");
      return;
    }

    if (!nivelId) {
      setErro("Selecione um nível.");
      return;
    }

    if (!statusId) {
      setErro("Selecione um status.");
      return;
    }

    try {
      setSalvando(true);

      await api.post("/painel/menu-permissao", {
        menu_id: menuId,
        item_id: itemId ? Number(itemId) : null,
        nivel_id: Number(nivelId),
        status_id: Number(statusId),
      });

      setSucesso("Permissão cadastrada com sucesso.");
      setItemId("");
      setNivelId("");
      setStatusId("");

      await carregarPermissoes(menuId);
    } catch (error: any) {
      console.error("Erro ao cadastrar permissão:", error);

      setErro(
        error?.response?.data?.mensagem ||
          "Não foi possível cadastrar a permissão."
      );
    } finally {
      setSalvando(false);
    }
  }

  function voltar() {
    window.location.href = "/Admin/menus";
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.infoBox}>Carregando...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Adicionar Permissão</h1>
            <p style={styles.subtitle}>
              Cadastre permissões para o menu selecionado.
            </p>
          </div>

          <button style={styles.secondaryButton} onClick={voltar}>
            Voltar
          </button>
        </div>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Dados da permissão</h2>
            <span style={styles.badge}>
              Menu ID: {menuId ?? "não informado"}
            </span>
          </div>

          {!menuId && (
            <div style={styles.errorBox}>
              Não foi encontrado <strong>menu_id</strong> na URL.
            </div>
          )}

          {erro && <div style={styles.errorBox}>{erro}</div>}
          {sucesso && <div style={styles.successBox}>{sucesso}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Item do menu (opcional)</label>
                <input
                  style={styles.input}
                  type="number"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  placeholder="Ex.: 1"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nível *</label>
                <select
                  style={styles.input}
                  value={nivelId}
                  onChange={(e) => setNivelId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {niveis.map((nivel: any) => (
                    <option
                      key={nivel.id_nivel ?? nivel.id ?? nivel.nivel_id}
                      value={nivel.id_nivel ?? nivel.id ?? nivel.nivel_id}
                    >
                      {nivel.nome ?? nivel.titulo ?? `Nível ${nivel.id_nivel}`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Status *</label>
                <select
                  style={styles.input}
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {statusList.map((status: any) => (
                    <option
                      key={status.id_status ?? status.id}
                      value={status.id_status ?? status.id}
                    >
                      {status.nome ?? status.titulo ?? `Status ${status.id_status}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={voltar}
              >
                Cancelar
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={salvando || !menuId}
              >
                {salvando ? "Salvando..." : "Salvar permissão"}
              </button>
            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Permissões cadastradas</h2>
            <span style={styles.badge}>{permissoes.length} permissão(ões)</span>
          </div>

          {permissoes.length === 0 ? (
            <div style={styles.infoBox}>
              Nenhuma permissão cadastrada para este menu.
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Menu</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Nível</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Criado</th>
                  </tr>
                </thead>
                <tbody>
                  {permissoes.map((permissao) => (
                    <tr key={permissao.id_permissao}>
                      <td style={styles.td}>{permissao.id_permissao}</td>
                      <td style={styles.td}>{permissao.menu_id}</td>
                      <td style={styles.td}>
                        {permissao.item_id ?? "Sem item"}
                      </td>
                      <td style={styles.td}>{permissao.nivel_id}</td>
                      <td style={styles.td}>{permissao.status_id}</td>
                      <td style={styles.td}>
                        {permissao.criado || "Não informado"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gap: "20px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
    color: "#0f172a",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "15px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(15,23,42,0.05)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
  },
  badge: {
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
  },
  form: {
    padding: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  field: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    background: "#7c3aed",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 18px",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBox: {
    margin: "16px 20px 0",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "14px",
  },
  successBox: {
    margin: "16px 20px 0",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "14px",
  },
  infoBox: {
    padding: "16px 20px",
    color: "#475569",
    fontSize: "14px",
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
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "13px",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
    color: "#0f172a",
    fontSize: "14px",
  },
};