"use client";

import api from "@/Api/conectar";
import { useEffect, useMemo, useState } from "react";

type Menu = {
  id_menu: number;
  site_config_id: number;
  nome: string;
  icone: string | null;
  rota: string | null;
  pesquisa_placeholder: string | null;
  itens?: MenuItem[];
};

type MenuItem = {
  id_item: number;
  menu_id: number;
  nome: string;
  rota: string | null;
  icone: string | null;
  posicao: number;
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

export default function AdicionarItemMenuPage() {
  const [menuId, setMenuId] = useState<number | null>(null);
  const [menuNome, setMenuNome] = useState<string>("");

  const [nome, setNome] = useState("");
  const [rota, setRota] = useState("");
  const [icone, setIcone] = useState("");
  const [posicao, setPosicao] = useState("0");

  const [itens, setItens] = useState<MenuItem[]>([]);
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

  async function carregarNomeMenu(id: number) {
    try {
      const response = await api.get<ApiResponse>("/painel/menus");
      const payload = response.data;

      let listaMenus: Menu[] = [];

      if (Array.isArray(payload?.dados)) {
        listaMenus = payload.dados;
      } else if (payload?.dados && Array.isArray(payload.dados.dados)) {
        listaMenus = payload.dados.dados;
      }

      const menuEncontrado = listaMenus.find((menu) => menu.id_menu === id);

      if (menuEncontrado) {
        setMenuNome(menuEncontrado.nome);
      } else {
        setMenuNome("");
      }
    } catch (error) {
      console.error("Erro ao carregar nome do menu:", error);
      setMenuNome("");
    }
  }

  async function carregarItens(id: number) {
    try {
      const response = await api.get(`/painel/menu/${id}/itens`);
      const dados = response?.data?.dados;

      if (Array.isArray(dados)) {
        setItens(dados);
        return;
      }

      if (dados && Array.isArray(dados.dados)) {
        setItens(dados.dados);
        return;
      }

      setItens([]);
    } catch (error) {
      console.error("Erro ao carregar itens do menu:", error);
      setItens([]);
    }
  }

  useEffect(() => {
    async function carregarTudo() {
      if (!menuId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await Promise.all([carregarNomeMenu(menuId), carregarItens(menuId)]);
      } finally {
        setLoading(false);
      }
    }

    carregarTudo();
  }, [menuId]);

  const posicaoNumero = useMemo(() => {
    const n = Number(posicao);
    return Number.isNaN(n) ? 0 : n;
  }, [posicao]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErro(null);
    setSucesso(null);

    if (!menuId) {
      setErro("menu_id inválido ou não informado na URL.");
      return;
    }

    if (!nome.trim()) {
      setErro("O nome do item é obrigatório.");
      return;
    }

    try {
      setSalvando(true);

      await api.post("/painel/menu-item", {
        menu_id: menuId,
        nome: nome.trim(),
        rota: rota.trim() || null,
        icone: icone.trim() || null,
        posicao: posicaoNumero,
      });

      setSucesso("Item cadastrado com sucesso.");
      setNome("");
      setRota("");
      setIcone("");
      setPosicao("0");

      await carregarItens(menuId);
    } catch (error: any) {
      console.error("Erro ao cadastrar item:", error);

      setErro(
        error?.response?.data?.mensagem ||
          "Não foi possível cadastrar o item."
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
            <h1 style={styles.title}>Adicionar Item ao Menu</h1>
            <p style={styles.subtitle}>
              {menuNome
                ? `Menu selecionado: ${menuNome}`
                : "Cadastre um novo item para o menu selecionado."}
            </p>
          </div>

          <button style={styles.secondaryButton} onClick={voltar}>
            Voltar
          </button>
        </div>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Dados do item</h2>
            <span style={styles.badge}>
              {menuNome ? `${menuNome} • ID ${menuId}` : `Menu ID: ${menuId ?? "não informado"}`}
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
                <label style={styles.label}>Nome do item *</label>
                <input
                  style={styles.input}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Painel Administrativo"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Rota</label>
                <input
                  style={styles.input}
                  value={rota}
                  onChange={(e) => setRota(e.target.value)}
                  placeholder="Ex.: /Admin"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Ícone</label>
                <input
                  style={styles.input}
                  value={icone}
                  onChange={(e) => setIcone(e.target.value)}
                  placeholder="Ex.: bi-house"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Posição</label>
                <input
                  style={styles.input}
                  type="number"
                  value={posicao}
                  onChange={(e) => setPosicao(e.target.value)}
                  placeholder="0"
                />
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
                {salvando ? "Salvando..." : "Salvar item"}
              </button>
            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              {menuNome ? `Itens do menu ${menuNome}` : "Itens já cadastrados"}
            </h2>
            <span style={styles.badge}>{itens.length} item(ns)</span>
          </div>

          {itens.length === 0 ? (
            <div style={styles.infoBox}>Nenhum item cadastrado para este menu.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Rota</th>
                    <th style={styles.th}>Ícone</th>
                    <th style={styles.th}>Posição</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.id_item}>
                      <td style={styles.td}>{item.id_item}</td>
                      <td style={styles.td}>{item.nome}</td>
                      <td style={styles.td}>{item.rota || "Sem rota"}</td>
                      <td style={styles.td}>{item.icone || "Sem ícone"}</td>
                      <td style={styles.td}>{item.posicao ?? 0}</td>
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
    background: "#eff6ff",
    color: "#1d4ed8",
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
    background: "#2563eb",
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