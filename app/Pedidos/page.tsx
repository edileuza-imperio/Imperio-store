"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Package,
  ShoppingBag,
  CreditCard,
  CalendarDays,
  Receipt,
} from "lucide-react";
import api from "@/Api/conectar";

// ✅ IMPORTANTE (adicionado)
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";

type Pedido = {
  id_pedido?: number;
  carrinho_id?: number;
  usuario_id?: number;
  status_id?: number;
  valor_produtos?: number | string;
  valor_desconto?: number | string;
  valor_frete?: number | string;
  valor_total?: number | string;
  preference_id?: string | null;
  payment_id?: string | null;
  external_reference?: string | null;
  metodo_pagamento?: string | null;
  status_pagamento?: string | null;
  status_detail?: string | null;
  data_aprovacao?: string | null;
  criado_em?: string;
  atualizado_em?: string;
};

function getPedidoId(pedido: Pedido): number {
  return Number(pedido.id_pedido ?? 0);
}

function getCodigoPedido(pedido: Pedido): string {
  return `PED-${String(getPedidoId(pedido)).padStart(5, "0")}`;
}

function toNumber(valor?: number | string | null): number {
  if (!valor) return 0;
  const n = typeof valor === "string" ? Number(valor) : valor;
  return Number.isFinite(n) ? n : 0;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string | null): string {
  if (!data) return "-";
  const dt = new Date(data.replace(" ", "T"));
  return Number.isNaN(dt.getTime()) ? data : dt.toLocaleString("pt-BR");
}

function getStatusPagamentoTexto(status?: string | null): string {
  if (!status) return "Pendente";
  const s = status.toLowerCase();

  if (s === "approved") return "Aprovado";
  if (s === "pending") return "Pendente";
  if (s === "rejected") return "Recusado";
  if (s === "cancelled") return "Cancelado";

  return status;
}

function getStatusClass(status?: string | null): string {
  const s = (status || "").toLowerCase();

  if (s === "approved") return "aprovado";
  if (s === "rejected") return "recusado";
  if (s === "cancelled") return "cancelado";

  return "pendente";
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  const carregarPedidos = async () => {
    try {
      setLoading(true);

      const res = await api.get("/pedidos");

      const lista = Array.isArray(res.data?.dados?.pedidos)
        ? res.data.dados.pedidos
        : [];

      setPedidos(lista);
    } catch (e: any) {
      setErro(e?.response?.data?.mensagem || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase();

    return pedidos.filter((p) => {
      return (
        getCodigoPedido(p).toLowerCase().includes(termo) ||
        (p.metodo_pagamento || "").toLowerCase().includes(termo)
      );
    });
  }, [pedidos, busca]);

  return (
    <div className="layout">
      {/* 🔥 NAVBAR */}
      <Navbar />

      <main className="pagina-pedidos">
        <div className="topo">
          <div>
            <span className="subtitulo">Pedidos da loja</span>
            <h1>Pedidos</h1>
          </div>

          <button className="btn-atualizar" onClick={carregarPedidos}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        <div className="barra">
          <input
            placeholder="Buscar pedido..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {loading && <p>Carregando...</p>}

        <div className="grid">
          {filtrados.map((p) => (
            <div key={p.id_pedido} className="card">
              <h2>{getCodigoPedido(p)}</h2>

              <p>{getStatusPagamentoTexto(p.status_pagamento)}</p>

              <strong>{formatarMoeda(toNumber(p.valor_total))}</strong>

              <span>{formatarData(p.criado_em)}</span>
            </div>
          ))}
        </div>
      </main>

      {/* 🔥 FOOTER */}
      <Footer />

      <style jsx>{`
        .layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;

          /* 🔥 FUNDO ROSA + CREME */
          background: linear-gradient(
            180deg,
            #fff1ec 0%,
            #ffe4dc 100%
          );
        }

        .pagina-pedidos {
          flex: 1;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        h1 {
          color: #7a2e2e; /* rosa queimado */
        }

        .btn-atualizar {
          background: #a44a4a; /* rosa queimado */
          color: white;
          padding: 10px 14px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
        }

        .barra input {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #ddd;
          margin: 20px 0;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .card {
          background: #fffaf7;
          border-radius: 16px;
          padding: 16px;

          /* efeito elegante */
          box-shadow: 0 8px 25px rgba(164, 74, 74, 0.15);
        }

        .card h2 {
          color: #7a2e2e;
        }

        .card strong {
          color: #a44a4a;
          font-size: 18px;
        }
      `}</style>
    </div>
  );
}