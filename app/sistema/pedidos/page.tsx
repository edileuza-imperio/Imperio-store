"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiPackage,
  FiEye,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

type Pedido = {
  id_pedido: number;
  usuario_id: number;
  status_id: number;
  valor_total: number;
  metodo_pagamento?: string | null;
  status_pagamento?: string | null;
  status_detail?: string | null;
  payment_id?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

const API_URL = "https://api.universoimperio.com.br";

export default function SistemaPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarPedidos() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/pedidos`, {
        cache: "no-store",
      });

      const data = await response.json();

      setPedidos(data?.dados ?? []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor ?? 0));
  }

  function statusTexto(pedido: Pedido) {
    if (pedido.status_pagamento === "approved") return "Pago";
    if (pedido.status_pagamento === "refunded") return "Reembolsado";
    if (pedido.status_pagamento === "rejected") return "Recusado";
    if (pedido.status_id === 16) return "Enviado";
    if (pedido.status_id === 17) return "Entregue";
    return "Pendente";
  }

  function statusIcone(pedido: Pedido) {
    if (pedido.status_pagamento === "approved") return <FiCheckCircle />;
    if (pedido.status_pagamento === "rejected") return <FiXCircle />;
    if (pedido.status_id === 16) return <FiTruck />;
    if (pedido.status_id === 17) return <FiCheckCircle />;
    return <FiClock />;
  }

  return (
    <main style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiPackage />
            Pedidos
          </h1>
          <p>Gerencie os pedidos da loja.</p>
        </div>

        <button
          onClick={carregarPedidos}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          <FiRefreshCw /> Atualizar
        </button>
      </div>

      {loading ? (
        <p>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={th}>Pedido</th>
                <th style={th}>Cliente</th>
                <th style={th}>Valor</th>
                <th style={th}>Pagamento</th>
                <th style={th}>Status</th>
                <th style={th}>Data</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id_pedido}>
                  <td style={td}>#{pedido.id_pedido}</td>
                  <td style={td}>Usuário #{pedido.usuario_id}</td>
                  <td style={td}>{formatarMoeda(pedido.valor_total)}</td>
                  <td style={td}>{pedido.metodo_pagamento ?? "—"}</td>
                  <td style={td}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "#eef2ff",
                        color: "#3730a3",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {statusIcone(pedido)}
                      {statusTexto(pedido)}
                    </span>
                  </td>
                  <td style={td}>{pedido.criado_em ?? "—"}</td>
                  <td style={td}>
                    <Link
                      href={`/sistema/pedidos/${pedido.id_pedido}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#111827",
                        color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      <FiEye />
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const th: React.CSSProperties = {
  padding: 14,
  textAlign: "left",
  fontSize: 14,
  color: "#374151",
  borderBottom: "1px solid #e5e7eb",
};

const td: React.CSSProperties = {
  padding: 14,
  borderBottom: "1px solid #e5e7eb",
  fontSize: 14,
  color: "#111827",
};