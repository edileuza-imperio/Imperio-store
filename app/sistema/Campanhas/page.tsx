"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
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
    if (!data) return "Não informado";

    return new Date(data.replace(" ", "T")).toLocaleDateString("pt-BR");
  }

  const campanhasFiltradas = useMemo(() => {
    const texto = busca.toLowerCase().trim();

    if (!texto) return campanhas;

    return campanhas.filter((campanha) => {
      return (
        campanha.titulo?.toLowerCase().includes(texto) ||
        campanha.slug?.toLowerCase().includes(texto) ||
        campanha.descricao?.toLowerCase().includes(texto)
      );
    });
  }, [busca, campanhas]);

  if (loading) {
    return (
      <main style={styles.page}>
        <h1 style={styles.title}>Carregando campanhas...</h1>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <span style={styles.badge}>Painel</span>
          <h1 style={styles.title}>Campanhas</h1>
          <p style={styles.subtitle}>
            Gerencie campanhas, produtos, banners e status.
          </p>
        </div>

        <button onClick={carregarCampanhas} style={styles.refreshButton}>
          <FiRefreshCw />
          Atualizar
        </button>
      </section>

      <section style={styles.searchBox}>
        <FiSearch />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título, slug ou descrição..."
          style={styles.searchInput}
        />
      </section>

      {campanhasFiltradas.length === 0 ? (
        <section style={styles.empty}>
          <h2>Nenhuma campanha encontrada.</h2>
          <p>Cadastre uma nova campanha para começar.</p>
        </section>
      ) : (
        <section style={styles.grid}>
          {campanhasFiltradas.map((campanha) => (
            <article key={campanha.id_campanha} style={styles.card}>
              <div style={styles.imageWrap}>
                {campanha.banner ? (
                  <img
                    src={imagemUrl(campanha.banner)}
                    alt={campanha.titulo}
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.noImage}>Sem banner</div>
                )}

                <span
                  style={{
                    ...styles.status,
                    ...(campanha.statusid === 1
                      ? styles.statusAtivo
                      : styles.statusInativo),
                  }}
                >
                  {campanha.statusid === 1 ? "Ativa" : "Inativa"}
                </span>
              </div>

              <div style={styles.content}>
                <h2 style={styles.cardTitle}>{campanha.titulo}</h2>

                <p style={styles.slug}>/{campanha.slug}</p>

                <p style={styles.description}>
                  {campanha.descricao || "Sem descrição cadastrada."}
                </p>

                <div style={styles.infoGrid}>
                  <div>
                    <strong>Início</strong>
                    <span>{formatarData(campanha.inicio)}</span>
                  </div>

                  <div>
                    <strong>Fim</strong>
                    <span>{formatarData(campanha.fim)}</span>
                  </div>
                </div>
              </div>

              <div style={styles.actions}>
                <Link
                  href={`/sistema/campanhas/${campanha.id_campanha}`}
                  style={styles.actionButton}
                  title="Visualizar"
                >
                  <FiEye />
                </Link>

                <Link
                  href={`/sistema/campanhas/${campanha.id_campanha}/editar`}
                  style={styles.actionButton}
                  title="Editar"
                >
                  <FiEdit />
                </Link>

                <button
                  onClick={() => excluirCampanha(campanha.id_campanha)}
                  style={{
                    ...styles.actionButton,
                    ...styles.deleteButton,
                  }}
                  title="Excluir"
                >
                  <FiTrash2 />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <Link href="/sistema/campanhas/cadastrar" style={styles.floatingButton}>
        <FiPlus />
        <span>Cadastrar</span>
      </Link>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "28px",
    background: "#f8f5f6",
    color: "#33282c",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "22px",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#fff0f4",
    color: "#b8325b",
    fontSize: "13px",
    fontWeight: 700,
  },
  title: {
    margin: "10px 0 4px",
    fontSize: "34px",
  },
  subtitle: {
    margin: 0,
    color: "#7c6c72",
  },
  refreshButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    background: "#fff",
    color: "#33282c",
    boxShadow: "0 10px 28px rgba(50, 30, 36, 0.08)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fff",
    padding: "14px 16px",
    borderRadius: "18px",
    marginBottom: "24px",
    boxShadow: "0 12px 30px rgba(50, 30, 36, 0.07)",
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "15px",
    background: "transparent",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "24px",
    background: "#fff",
    boxShadow: "0 18px 38px rgba(70, 38, 48, 0.1)",
  },
  imageWrap: {
    position: "relative",
    height: "180px",
    background: "#f0e7ea",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  noImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8a747c",
    fontWeight: 700,
  },
  status: {
    position: "absolute",
    top: "12px",
    left: "12px",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
  },
  statusAtivo: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusInativo: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  content: {
    padding: "18px",
  },
  cardTitle: {
    margin: "0 0 6px",
    fontSize: "20px",
  },
  slug: {
    margin: "0 0 12px",
    color: "#b8325b",
    fontWeight: 700,
    fontSize: "14px",
  },
  description: {
    margin: "0 0 16px",
    color: "#6f5f65",
    lineHeight: 1.5,
    minHeight: "44px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  actions: {
    position: "absolute",
    top: "12px",
    right: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  actionButton: {
    width: "38px",
    height: "38px",
    borderRadius: "13px",
    border: "none",
    background: "rgba(255,255,255,0.94)",
    color: "#33282c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
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
    zIndex: 20,
    padding: "15px 20px",
    borderRadius: "999px",
    background: "#b8325b",
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 800,
    boxShadow: "0 18px 35px rgba(184, 50, 91, 0.35)",
  },
  empty: {
    background: "#fff",
    padding: "35px",
    borderRadius: "22px",
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(50, 30, 36, 0.07)",
  },
};