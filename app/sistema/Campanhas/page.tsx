"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiEdit,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiSearch,
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
  const [busca, setBusca] = useState("");

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
      console.error(error);
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }

  async function excluirCampanha(id: number) {
    if (!confirm("Deseja realmente excluir esta campanha?")) return;

    try {
      await api.delete(`/painel/campanhas/${id}`);

      setCampanhas((lista) =>
        lista.filter((campanha) => campanha.id_campanha !== id)
      );
    } catch (error) {
      console.error(error);
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

  const campanhasFiltradas = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    if (!texto) return campanhas;

    return campanhas.filter((campanha) =>
      `${campanha.titulo} ${campanha.slug} ${campanha.descricao || ""}`
        .toLowerCase()
        .includes(texto)
    );
  }, [busca, campanhas]);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingCard}>Carregando campanhas...</div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <header style={styles.header}>
          <div>
            <span style={styles.kicker}>Painel administrativo</span>
            <h1 style={styles.title}>Campanhas</h1>
            <p style={styles.subtitle}>
              Organize campanhas promocionais, banners e produtos vinculados.
            </p>
          </div>

          <button onClick={carregarCampanhas} style={styles.refreshButton}>
            <FiRefreshCw />
            Atualizar
          </button>
        </header>

        <section style={styles.toolbar}>
          <div style={styles.searchBox}>
            <FiSearch size={18} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar campanha..."
              style={styles.searchInput}
            />
          </div>

          <Link href="/sistema/campanhas/cadastrar" style={styles.newButton}>
            <FiPlus />
            Nova campanha
          </Link>
        </section>

        {campanhasFiltradas.length === 0 ? (
          <section style={styles.empty}>
            <h2>Nenhuma campanha encontrada</h2>
            <p>Cadastre uma campanha para aparecer aqui.</p>
          </section>
        ) : (
          <section style={styles.grid}>
            {campanhasFiltradas.map((campanha) => (
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
                      ...styles.status,
                      ...(campanha.statusid === 1
                        ? styles.statusActive
                        : styles.statusInactive),
                    }}
                  >
                    {campanha.statusid === 1 ? "Ativa" : "Inativa"}
                  </span>
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
                        <small>Início</small>
                        <strong>{formatarData(campanha.inicio)}</strong>
                      </div>
                    </div>

                    <div style={styles.dateBox}>
                      <FiCalendar />
                      <div>
                        <small>Fim</small>
                        <strong>{formatarData(campanha.fim)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <footer style={styles.cardFooter}>
                  <Link
                    href={`/sistema/campanhas/${campanha.id_campanha}`}
                    style={styles.viewButton}
                  >
                    <FiEye />
                    Visualizar
                  </Link>

                  <div style={styles.iconActions}>
                    <Link
                      href={`/sistema/campanhas/${campanha.id_campanha}/editar`}
                      style={styles.iconButton}
                      title="Editar"
                    >
                      <FiEdit />
                    </Link>

                    <button
                      onClick={() => excluirCampanha(campanha.id_campanha)}
                      style={{
                        ...styles.iconButton,
                        ...styles.deleteButton,
                      }}
                      title="Excluir"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </footer>
              </article>
            ))}
          </section>
        )}
      </section>

      <Link href="/sistema/campanhas/cadastrar" style={styles.floatingButton}>
        <FiPlus />
      </Link>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #faf7f8 0%, #f3edf0 100%)",
    padding: "32px 20px 90px",
    color: "#2f2529",
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },

  kicker: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#b8325b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  title: {
    margin: "8px 0 4px",
    fontSize: "36px",
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: 0,
    color: "#77676d",
    fontSize: "15px",
  },

  refreshButton: {
    height: "44px",
    border: "1px solid #eadde2",
    borderRadius: "14px",
    padding: "0 16px",
    background: "#fff",
    color: "#3b2d32",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 24px rgba(76, 45, 55, 0.06)",
  },

  toolbar: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid #eadde2",
    borderRadius: "22px",
    padding: "14px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    boxShadow: "0 16px 35px rgba(70, 38, 48, 0.07)",
    backdropFilter: "blur(8px)",
    flexWrap: "wrap",
  },

  searchBox: {
    flex: 1,
    minWidth: "260px",
    height: "46px",
    borderRadius: "15px",
    background: "#f8f3f5",
    border: "1px solid #eadde2",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 14px",
    color: "#9a7f89",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
    color: "#302428",
  },

  newButton: {
    height: "46px",
    borderRadius: "15px",
    padding: "0 18px",
    background: "#b8325b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    fontWeight: 900,
    boxShadow: "0 14px 28px rgba(184, 50, 91, 0.28)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "22px",
    alignItems: "stretch",
  },

  card: {
    background: "#fff",
    border: "1px solid #eadde2",
    borderRadius: "26px",
    overflow: "hidden",
    boxShadow: "0 18px 42px rgba(70, 38, 48, 0.09)",
    display: "flex",
    flexDirection: "column",
  },

  bannerArea: {
    position: "relative",
    width: "100%",
    height: "150px",
    background: "#f1e8ec",
    overflow: "hidden",
  },

  banner: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#f1e8ec",
    display: "block",
    padding: "8px",
  },

  noBanner: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#927a83",
    fontWeight: 800,
  },

  status: {
    position: "absolute",
    top: "12px",
    left: "12px",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.7)",
  },

  statusActive: {
    background: "#dcfce7",
    color: "#166534",
  },

  statusInactive: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  cardBody: {
    padding: "18px 18px 12px",
    flex: 1,
  },

  cardTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 900,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },

  slug: {
    margin: "7px 0 12px",
    fontSize: "13px",
    color: "#b8325b",
    fontWeight: 800,
  },

  description: {
    margin: 0,
    color: "#73646a",
    fontSize: "14px",
    lineHeight: 1.55,
    minHeight: "44px",
  },

  dateRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "16px",
  },

  dateBox: {
    background: "#faf6f8",
    border: "1px solid #f0e3e7",
    borderRadius: "16px",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#8b6672",
  },

  cardFooter: {
    padding: "14px 18px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  viewButton: {
    height: "40px",
    flex: 1,
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

  iconActions: {
    display: "flex",
    gap: "8px",
  },

  iconButton: {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    border: "1px solid #eadde2",
    background: "#fff",
    color: "#3b2d32",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    textDecoration: "none",
  },

  deleteButton: {
    color: "#b91c1c",
  },

  floatingButton: {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#b8325b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 20px 40px rgba(184, 50, 91, 0.38)",
    textDecoration: "none",
    zIndex: 50,
  },

  empty: {
    background: "#fff",
    border: "1px solid #eadde2",
    borderRadius: "24px",
    padding: "42px",
    textAlign: "center",
    boxShadow: "0 18px 42px rgba(70, 38, 48, 0.08)",
  },

  loadingCard: {
    maxWidth: "480px",
    margin: "80px auto",
    background: "#fff",
    padding: "30px",
    borderRadius: "22px",
    textAlign: "center",
    fontWeight: 800,
    boxShadow: "0 18px 42px rgba(70, 38, 48, 0.08)",
  },
};