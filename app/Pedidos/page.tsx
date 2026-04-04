"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Package,
  ShoppingBag,
  CreditCard,
  User,
  CalendarDays,
  MapPin,
} from "lucide-react";
import api from "@/Api/conectar";

type Pedido = {
  id_pedido?: number;
  id?: number;
  codigo?: string;
  numero?: string;
  cliente_nome?: string;
  cliente?: string;
  nome_cliente?: string;
  status_id?: number;
  status?: string;
  total?: number | string;
  valor_total?: number | string;
  subtotal?: number | string;
  criado_em?: string;
  criado?: string;
  atualizado_em?: string;
  atualizado?: string;
  endereco?: string;
  pagamento?: string;
  forma_pagamento?: string;
};

function getPedidoId(pedido: Pedido): number {
  return Number(pedido.id_pedido ?? pedido.id ?? 0);
}

function getCodigoPedido(pedido: Pedido): string {
  return String(pedido.codigo ?? pedido.numero ?? `PED-${getPedidoId(pedido)}`);
}

function getNomeCliente(pedido: Pedido): string {
  return String(
    pedido.cliente_nome ??
      pedido.nome_cliente ??
      pedido.cliente ??
      "Cliente não informado"
  );
}

function getValorPedido(pedido: Pedido): number {
  const valor = pedido.total ?? pedido.valor_total ?? pedido.subtotal ?? 0;
  const numero = typeof valor === "string" ? Number(valor) : valor;
  return Number.isFinite(numero) ? Number(numero) : 0;
}

function getStatusPedido(pedido: Pedido): string {
  if (pedido.status) return String(pedido.status);

  switch (pedido.status_id) {
    case 1:
      return "Pendente";
    case 2:
      return "Pago";
    case 3:
      return "Em separação";
    case 4:
      return "Enviado";
    case 5:
      return "Entregue";
    case 6:
      return "Cancelado";
    default:
      return "Sem status";
  }
}

function getStatusClass(status: string): string {
  const valor = status.toLowerCase();

  if (valor.includes("pago")) return "pago";
  if (valor.includes("entregue")) return "entregue";
  if (valor.includes("enviado")) return "enviado";
  if (valor.includes("cancelado")) return "cancelado";
  if (valor.includes("separação") || valor.includes("separacao")) return "separacao";
  return "pendente";
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string): string {
  if (!data) return "-";

  const normalizada = data.replace(" ", "T");
  const dt = new Date(normalizada);

  if (Number.isNaN(dt.getTime())) return data;

  return dt.toLocaleString("pt-BR");
}

function extrairListaPedidos(response: any): Pedido[] {
  const possibilidades = [
    response?.data?.dados?.dados,
    response?.data?.dados,
    response?.data,
  ];

  for (const item of possibilidades) {
    if (Array.isArray(item)) return item;
  }

  return [];
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      setErro("");

      const response = await api.get("/pedidos");
      const lista = extrairListaPedidos(response);

      setPedidos(lista);
    } catch (error: any) {
      console.error("Erro ao carregar pedidos:", error);
      setErro(
        error?.response?.data?.mensagem || "Não foi possível carregar os pedidos."
      );
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return pedidos;

    return pedidos.filter((pedido) => {
      const codigo = getCodigoPedido(pedido).toLowerCase();
      const cliente = getNomeCliente(pedido).toLowerCase();
      const status = getStatusPedido(pedido).toLowerCase();

      return (
        codigo.includes(termo) ||
        cliente.includes(termo) ||
        status.includes(termo)
      );
    });
  }, [pedidos, busca]);

  const totalPedidos = pedidosFiltrados.length;
  const totalVendas = pedidosFiltrados.reduce(
    (acc, pedido) => acc + getValorPedido(pedido),
    0
  );

  return (
    <div className="pagina-pedidos">
      <div className="topo">
        <div>
          <span className="subtitulo">Área de pedidos</span>
          <h1>Pedidos</h1>
          <p>Acompanhe os pedidos cadastrados na loja.</p>
        </div>

        <button
          type="button"
          className="btn-atualizar"
          onClick={carregarPedidos}
        >
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      <div className="resumo">
        <div className="card-resumo">
          <div className="icone-box">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span>Total de pedidos</span>
            <strong>{totalPedidos}</strong>
          </div>
        </div>

        <div className="card-resumo">
          <div className="icone-box">
            <CreditCard size={20} />
          </div>
          <div>
            <span>Total em vendas</span>
            <strong>{formatarMoeda(totalVendas)}</strong>
          </div>
        </div>
      </div>

      <div className="barra">
        <div className="campo-busca">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por pedido, cliente ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="estado">
          <p>Carregando pedidos...</p>
        </div>
      )}

      {!loading && erro && (
        <div className="estado erro">
          <p>{erro}</p>
        </div>
      )}

      {!loading && !erro && pedidosFiltrados.length === 0 && (
        <div className="estado vazio">
          <Package size={42} />
          <h3>Nenhum pedido encontrado</h3>
          <p>Quando houver pedidos, eles aparecerão aqui.</p>
        </div>
      )}

      {!loading && !erro && pedidosFiltrados.length > 0 && (
        <div className="grid-pedidos">
          {pedidosFiltrados.map((pedido) => {
            const id = getPedidoId(pedido);
            const codigo = getCodigoPedido(pedido);
            const cliente = getNomeCliente(pedido);
            const valor = getValorPedido(pedido);
            const status = getStatusPedido(pedido);

            return (
              <div key={id || codigo} className="card-pedido">
                <div className="card-topo">
                  <div>
                    <span className="pedido-label">Pedido</span>
                    <h2>{codigo}</h2>
                  </div>

                  <span className={`status ${getStatusClass(status)}`}>
                    {status}
                  </span>
                </div>

                <div className="info-lista">
                  <div className="info-item">
                    <User size={16} />
                    <span>{cliente}</span>
                  </div>

                  <div className="info-item">
                    <CreditCard size={16} />
                    <span>{pedido.forma_pagamento ?? pedido.pagamento ?? "Pagamento não informado"}</span>
                  </div>

                  <div className="info-item">
                    <CalendarDays size={16} />
                    <span>{formatarData(pedido.criado_em ?? pedido.criado)}</span>
                  </div>

                  <div className="info-item">
                    <MapPin size={16} />
                    <span>{pedido.endereco || "Endereço não informado"}</span>
                  </div>
                </div>

                <div className="rodape-card">
                  <div className="valor-box">
                    <span>Total</span>
                    <strong>{formatarMoeda(valor)}</strong>
                  </div>

                  <a href={`/Pedidos/${id || codigo}`} className="btn-detalhes">
                    Ver detalhes
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .pagina-pedidos {
          min-height: 100vh;
          padding: 24px;
          background: #f8fafc;
        }

        .topo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .subtitulo {
          display: inline-block;
          margin-bottom: 6px;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        h1 {
          margin: 0;
          font-size: 32px;
          color: #0f172a;
        }

        .topo p {
          margin: 8px 0 0;
          color: #475569;
        }

        .btn-atualizar {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #dbe2ea;
          background: #fff;
          color: #0f172a;
          border-radius: 12px;
          padding: 12px 16px;
          cursor: pointer;
          font-weight: 700;
        }

        .resumo {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-resumo {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.05);
        }

        .icone-box {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-resumo span {
          display: block;
          color: #64748b;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .card-resumo strong {
          font-size: 22px;
          color: #0f172a;
        }

        .barra {
          margin-bottom: 24px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
        }

        .campo-busca {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 12px;
        }

        .campo-busca input {
          width: 100%;
          border: none;
          outline: none;
          padding: 12px 0;
          background: transparent;
          font-size: 14px;
        }

        .estado {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 40px 20px;
          text-align: center;
          color: #475569;
        }

        .estado.erro {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #be123c;
        }

        .estado.vazio h3 {
          margin: 12px 0 6px;
          color: #0f172a;
        }

        .grid-pedidos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .card-pedido {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .card-topo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }

        .pedido-label {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 6px;
        }

        .card-topo h2 {
          margin: 0;
          font-size: 22px;
          color: #0f172a;
        }

        .status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status.pendente {
          background: #fff7ed;
          color: #c2410c;
        }

        .status.pago {
          background: #ecfdf5;
          color: #166534;
        }

        .status.separacao {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .status.enviado {
          background: #eef2ff;
          color: #4338ca;
        }

        .status.entregue {
          background: #dcfce7;
          color: #166534;
        }

        .status.cancelado {
          background: #fff1f2;
          color: #be123c;
        }

        .info-lista {
          display: grid;
          gap: 10px;
          margin-bottom: 18px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #475569;
          font-size: 14px;
          line-height: 1.5;
        }

        .rodape-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .valor-box span {
          display: block;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .valor-box strong {
          font-size: 22px;
          color: #0f172a;
        }

        .btn-detalhes {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: #2563eb;
          color: #fff;
          border-radius: 12px;
          padding: 12px 16px;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .pagina-pedidos {
            padding: 16px;
          }

          h1 {
            font-size: 26px;
          }

          .grid-pedidos {
            grid-template-columns: 1fr;
          }

          .rodape-card {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-detalhes {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}