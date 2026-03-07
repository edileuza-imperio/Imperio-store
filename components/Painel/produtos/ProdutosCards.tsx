"use client";

import api from "@/Api/conectar";
import { FiPackage } from "react-icons/fi";
import type { Produto } from "@/app/painel/produtos/page";

type Props = {
  produtos: Produto[];
  loading?: boolean;
};

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";
  const base = api.defaults.baseURL || "";
  if (caminho.startsWith("http")) return caminho;
  return `${base.replace(/\/$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
}

function formatMoney(value: number | string | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosCards({ produtos, loading = false }: Props) {
  if (loading) {
    return (
      <div style={styles.center}>
        <p style={styles.loadingText}>Carregando produtos...</p>
      </div>
    );
  }

  if (!produtos.length) {
    return (
      <div style={styles.center}>
        <FiPackage size={42} />
        <h3 style={styles.emptyTitle}>Nenhum produto encontrado</h3>
        <p style={styles.emptyText}>Ainda não há produtos cadastrados.</p>
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {produtos.map((produto) => {
        const precoFinal =
          Number(produto.preco_promocional || 0) > 0
            ? produto.preco_promocional
            : produto.preco;

        return (
          <div key={produto.id_produto} style={styles.card}>
            <div style={styles.imageArea}>
              {produto.imagem ? (
                <img
                  src={getImagemUrl(produto.imagem)}
                  alt={produto.nome}
                  style={styles.image}
                />
              ) : (
                <div style={styles.imagePlaceholder}>Sem imagem</div>
              )}
            </div>

            <div style={styles.content}>
              <span style={styles.category}>
                {produto.categoria_nome || "Sem categoria"}
              </span>

              <h3 style={styles.name}>{produto.nome}</h3>

              <p style={styles.price}>{formatMoney(precoFinal)}</p>

              <div style={styles.meta}>
                <span style={styles.badge}>
                  Estoque:{" "}
                  {Number(produto.ilimitado ?? 0) === 1
                    ? "∞"
                    : Number(produto.estoque ?? 0)}
                </span>

                <span
                  style={{
                    ...styles.badge,
                    ...(Number(produto.catalogo ?? 0) === 1
                      ? styles.badgeVisible
                      : styles.badgeHidden),
                  }}
                >
                  {Number(produto.catalogo ?? 0) === 1 ? "Visível" : "Oculto"}
                </span>

                {produto.destaque ? (
                  <span style={{ ...styles.badge, ...styles.badgeFeatured }}>
                    Destaque
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #ececec",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    transition: "0.2s ease",
  },
  imageArea: {
    width: "100%",
    height: "220px",
    background: "#f8f8f8",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#777",
    fontSize: "14px",
    background: "#f3f3f3",
  },
  content: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  category: {
    fontSize: "12px",
    color: "#888",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  name: {
    margin: 0,
    fontSize: "16px",
    color: "#111",
    fontWeight: 700,
    lineHeight: 1.4,
  },
  price: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#111",
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  badge: {
    fontSize: "12px",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: 700,
    background: "#f2f2f2",
    color: "#333",
  },
  badgeVisible: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgeHidden: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  badgeFeatured: {
    background: "#fef3c7",
    color: "#92400e",
  },
  center: {
    minHeight: "320px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#666",
  },
  loadingText: {
    fontSize: "15px",
    fontWeight: 600,
  },
  emptyTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#222",
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
  },
};