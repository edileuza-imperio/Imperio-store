"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiEdit,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string | null;
  banner?: string | null;
  statusid: number;
  inicio?: string | null;
  fim?: string | null;
};

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCampanhas();
  }, []);

  async function carregarCampanhas() {
    try {
      setLoading(true);

      const response = await api.get("/painel/campanhas");
      const lista = response.data?.dados?.campanhas || [];

      setCampanhas(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }

  async function excluirCampanha(id: number) {
    const confirmar = confirm("Deseja realmente excluir esta campanha?");

    if (!confirmar) return;

    try {
      await api.delete(`/painel/campanhas/${id}`);

      setCampanhas((lista) =>
        lista.filter((campanha) => campanha.id_campanha !== id)
      );
    } catch (error) {
      console.error("Erro ao excluir campanha:", error);
      alert("Erro ao excluir campanha.");
    }
  }

  function imagemUrl(caminho?: string | null) {
    if (!caminho) return "";

    const baseUrl = String(api.defaults.baseURL || "")
      .replace("/api/v1", "")
      .replace(/\/$/, "");

    return `${baseUrl}/${caminho.replace(/^\//, "")}`;
  }

  function formatarData(data?: string | null) {
    if (!data) return "Sem data";

    return new Date(data.replace(" ", "T")).toLocaleDateString("pt-BR");
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.loadingCard}>Carregando campanhas...</section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Campanhas</h1>
            <span style={styles.counter}>
              {campanhas.length} campanha(s) cadastrada(s)
            </span>
          </div>

          <div style={styles.headerActions}>
            <button onClick={carregarCampanhas} style={styles.refreshButton}>
              <FiRefreshCw />
              Atualizar
            </button>

            <Link href="/sistema/campanhas/cadastrar" style={styles.newButton}>
              <FiPlus />
              Nova campanha
            </Link>
          </div>
        </header>

        {campanhas.length === 0 ? (
          <section style={styles.empty}>
            <h2>Nenhuma campanha encontrada</h2>
            <p>Cadastre uma campanha para começar.</p>
          </section>
        ) : (
          <section style={styles.grid}>
            {campanhas.map((campanha) => (
              <article key={campanha.id_campanha} style={styles.card}>
                <div style={styles.bannerArea}>
                  {campanha.banner ? (
                    <img
                      src={imagemUrl(campanha.banner)}
                      alt={campanha.titulo}
                      style={styles.banner}
                    />
                  ) : (
                    <div style={styles.noBanner}>Sem banner</div>
                  )}

                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(campanha.statusid === 1
                        ? styles.statusActive
                        : styles.statusInactive),
                    }}
                  >
                    {campanha.statusid === 1 ? "Ativa" : "Inativa"}
                  </span>

                  <div style={styles.floatActions}>
                    <Link
                      href={`/sistema/campanhas/${campanha.id_campanha}`}
                      style={styles.floatIcon}
                      title="Visualizar"
                    >
                      <FiEye />
                    </Link>

                    <Link
                      href={`/sistema/campanhas/${campanha.id_campanha}/editar`}
                      style={styles.floatIcon}
                      title="Editar"
                    >
                      <FiEdit />
                    </Link>

                    <button
                      onClick={() => excluirCampanha(campanha.id_campanha)}
                      style={styles.floatDelete}
                      title="Excluir"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <h2 style={styles.cardTitle}>{campanha.titulo}</h2>

                  <p style={styles.slug}>/{campanha.slug}</p>

                  <p style={styles.description}>
                    {campanha.descricao || "Sem descrição cadastrada."}
                  </p>

                  <div style={styles.dateRow}>
                    <div style={styles.dateBox}>
                      <FiCalendar />
                      <div>
                        <small style={styles.dateLabel}>Início</small>
                        <strong style={styles.dateValue}>
                          {formatarData(campanha.inicio)}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.dateBox}>
                      <FiCalendar />
                      <div>
                        <small style={styles.dateLabel}>Fim</small>
                        <strong style={styles.dateValue}>
                          {formatarData(campanha.fim)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <footer style={styles.cardFooter}>
                  <span style={styles.cardId}>ID #{campanha.id_campanha}</span>

                  <Link
                    href={`/sistema/campanhas/${campanha.id_campanha}`}
                    style={styles.viewButton}
                  >
                    <FiEye />
                    Visualizar
                  </Link>
                </footer>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px 22px 80px",
    background: "linear-gradient(180deg, #fbf7f8 0%, #f5edf0 100%)",
    color: "#2b2025",
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    marginBottom: "32px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#261b20",
  },

  counter: {
    display: "block",
    marginTop: "6px",
    fontSize: "14px",
    color: "#8a737d",
    fontWeight: 600,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  refreshButton: {
    height: "44px",
    border: "1px solid #eadde2",
    borderRadius: "14px",
    padding: "0 16px",
    background: "#fff",
    color: "#3a2c31",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 24px rgba(70, 38, 48, 0.06)",
  },

  newButton: {
    height: "44px",
    borderRadius: "14px",
    padding: "0 18px",
    background: "#c33162",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    fontWeight: 900,
    boxShadow: "0 14px 28px rgba(195, 49, 98, 0.28)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
    gap: "24px",
    alignItems: "stretch",
  },

  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "26px",
    background: "#fff",
    border: "1px solid #f1e4e9",
    boxShadow: "0 18px 45px rgba(70, 38, 48, 0.09)",
    display: "flex",
    flexDirection: "column",
  },

  bannerArea: {
    position: "relative",
    width: "100%",
    height: "240px",
    overflow: "hidden",
    background: "#f1e8ec",
  },

  banner: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  noBanner: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#927a83",
    fontWeight: 900,
  },

  statusBadge: {
    position: "absolute",
    top: "14px",
    left: "14px",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.75)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
  },

  statusActive: {
    background: "#dcfce7",
    color: "#166534",
  },

  statusInactive: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  floatActions: {
    position: "absolute",
    top: "14px",
    right: "14px",
    display: "flex",
    gap: "8px",
  },

  floatIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "13px",
    background: "rgba(255,255,255,0.95)",
    color: "#2d2227",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    boxShadow: "0 10px 25px rgba(0,0,0,0.16)",
  },

  floatDelete: {
    width: "40px",
    height: "40px",
    borderRadius: "13px",
    border: "none",
    background: "rgba(255,255,255,0.95)",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(0,0,0,0.16)",
  },

  cardBody: {
    padding: "22px 22px 16px",
    flex: 1,
  },

  cardTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 900,
    lineHeight: 1.2,
    letterSpacing: "-0.03em",
    color: "#23191e",
  },

  slug: {
    margin: "8px 0 14px",
    fontSize: "13px",
    color: "#c33162",
    fontWeight: 800,
    wordBreak: "break-word",
  },

  description: {
    margin: 0,
    color: "#6f5e65",
    fontSize: "14px",
    lineHeight: 1.55,
    minHeight: "44px",
  },

  dateRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "18px",
  },

  dateBox: {
    background: "#fbf6f8",
    border: "1px solid #f0e3e8",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#9a6a79",
  },

  dateLabel: {
    display: "block",
    fontSize: "11px",
    color: "#9b828a",
    fontWeight: 700,
    marginBottom: "2px",
  },

  dateValue: {
    display: "block",
    fontSize: "13px",
    color: "#3a2c31",
    fontWeight: 900,
  },

  cardFooter: {
    padding: "16px 22px 20px",
    borderTop: "1px solid #f2e6ea",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
  },

  cardId: {
    color: "#947c85",
    fontSize: "13px",
    fontWeight: 700,
  },

  viewButton: {
    minWidth: "140px",
    height: "42px",
    borderRadius: "14px",
    background: "#2f2529",
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: 900,
  },

  empty: {
    background: "#fff",
    border: "1px solid #eadde2",
    borderRadius: "24px",
    padding: "44px",
    textAlign: "center",
    boxShadow: "0 18px 42px rgba(70, 38, 48, 0.08)",
  },

  loadingCard: {
    maxWidth: "480px",
    margin: "80px auto",
    background: "#fff",
    padding: "32px",
    borderRadius: "22px",
    textAlign: "center",
    fontWeight: 900,
    boxShadow: "0 18px 42px rgba(70, 38, 48, 0.08)",
  },
};