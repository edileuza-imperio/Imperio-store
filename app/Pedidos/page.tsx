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
  if (valor === null || valor === undefined) return 0;
  const numero = typeof valor === "string" ? Number(valor) : valor;
  return Number.isFinite(numero) ? Number(numero) : 0;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string | null): string {
  if (!data) return "-";

  const normalizada = data.replace(" ", "T");
  const dt = new Date(normalizada);

  if (Number.isNaN(dt.getTime())) return data;

  return dt.toLocaleString("pt-BR");
}

function getStatusPagamentoTexto(status?: string | null): string {
  if (!status) return "Pendente";

  const valor = status.toLowerCase();

  if (valor === "approved" || valor === "aprovado") return "Aprovado";
  if (valor === "pending" || valor === "pendente") return "Pendente";
  if (valor === "rejected" || valor === "recusado") return "Recusado";
  if (valor === "cancelled" || valor === "cancelado") return "Cancelado";
  if (valor === "in_process") return "Em análise";

  return status;
}

function getStatusClass(status?: string | null): string {
  const valor = (status || "").toLowerCase();

  if (valor === "approved" || valor === "aprovado") return "aprovado";
  if (valor === "rejected" || valor === "recusado") return "recusado";
  if (valor === "cancelled" || valor === "cancelado") return "cancelado";
  if (valor === "in_process") return "analise";

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
      setErro("");

      const response = await api.get("/pedidos");

      const lista = Array.isArray(response.data?.dados?.pedidos)
        ? response.data.dados.pedidos
        : [];

      setPedidos(lista);
    } catch (error: any) {
      console.error("Erro ao carregar pedidos:", error);
      setErro(
        error?.response?.data?.mensagem ||
          "Não foi possível carregar os pedidos."
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
      const statusPagamento = getStatusPagamentoTexto(
        pedido.status_pagamento
      ).toLowerCase();
      const metodo = String(pedido.metodo_pagamento || "").toLowerCase();
      const externalReference = String(
        pedido.external_reference || ""
      ).toLowerCase();

      return (
        codigo.includes(termo) ||
        statusPagamento.includes(termo) ||
        metodo.includes(termo) ||
        externalReference.includes(termo)
      );
    });
  }, [pedidos, busca]);

  const totalPedidos = pedidosFiltrados.length;

  const totalVendas = pedidosFiltrados.reduce((acc, pedido) => {
    return acc + toNumber(pedido.valor_total);
  }, 0);

  return (
    <div className="pagina-pedidos">
      <div className="topo">
        <div>
          <span className="subtitulo">Pedidos da loja</span>
          <h1>Pedidos</h1>
          <p>Acompanhe pagamentos, valores e status dos pedidos.</p>
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
            <span>Total vendido</span>
            <strong>{formatarMoeda(totalVendas)}</strong>
          </div>
        </div>
      </div>

      <div className="barra">
        <div className="campo-busca">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por código, pagamento ou referência..."
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
            const valorProdutos = toNumber(pedido.valor_produtos);
            const valorDesconto = toNumber(pedido.valor_desconto);
            const valorFrete = toNumber(pedido.valor_frete);
            const valorTotal = toNumber(pedido.valor_total);
            const statusPagamento = getStatusPagamentoTexto(
              pedido.status_pagamento
            );

            return (
              <div key={id} className="card-pedido">
                <div className="card-topo">
                  <div>
                    <span className="pedido-label">Pedido</span>
                    <h2>{codigo}</h2>
                  </div>

                  <span
                    className={`status ${getStatusClass(
                      pedido.status_pagamento
                    )}`}
                  >
                    {statusPagamento}
                  </span>
                </div>

                <div className="info-lista">
                  <div className="info-item">
                    <Receipt size={16} />
                    <span>Status ID: {pedido.status_id ?? "-"}</span>
                  </div>

                  <div className="info-item">
                    <CreditCard size={16} />
                    <span>
                      {pedido.metodo_pagamento || "Método não informado"}
                    </span>
                  </div>

                  <div className="info-item">
                    <CalendarDays size={16} />
                    <span>{formatarData(pedido.criado_em)}</span>
                  </div>

                  <div className="info-item">
                    <CalendarDays size={16} />
                    <span>
                      Aprovação: {formatarData(pedido.data_aprovacao)}
                    </span>
                  </div>
                </div>

                <div className="valores">
                  <div className="valor-item">
                    <span>Produtos</span>
                    <strong>{formatarMoeda(valorProdutos)}</strong>
                  </div>

                  <div className="valor-item">
                    <span>Desconto</span>
                    <strong>{formatarMoeda(valorDesconto)}</strong>
                  </div>

                  <div className="valor-item">
                    <span>Frete</span>
                    <strong>{formatarMoeda(valorFrete)}</strong>
                  </div>

                  <div className="valor-item destaque">
                    <span>Total</span>
                    <strong>{formatarMoeda(valorTotal)}</strong>
                  </div>
                </div>

                <div className="meta-box">
                  <span>
                    <strong>Payment ID:</strong>{" "}
                    {pedido.payment_id || "Não informado"}
                  </span>
                  <span>
                    <strong>Preference ID:</strong>{" "}
                    {pedido.preference_id || "Não informado"}
                  </span>
                  <span>
                    <strong>Referência:</strong>{" "}
                    {pedido.external_reference || "Não informada"}
                  </span>
                  <span>
                    <strong>Detalhe:</strong>{" "}
                    {pedido.status_detail || "Não informado"}
                  </span>
                </div>

                <div className="rodape-card">
                  <a href={`/Pedidos/${id}`} className="btn-detalhes">
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
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
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

        .status.aprovado {
          background: #ecfdf5;
          color: #166534;
        }

        .status.recusado {
          background: #fff1f2;
          color: #be123c;
        }

        .status.cancelado {
          background: #f1f5f9;
          color: #475569;
        }

        .status.analise {
          background: #eff6ff;
          color: #1d4ed8;
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

        .valores {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .valor-item {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 14px;
          padding: 12px;
        }

        .valor-item span {
          display: block;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .valor-item strong {
          color: #0f172a;
          font-size: 18px;
        }

        .valor-item.destaque {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .meta-box {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
          color: #475569;
          font-size: 13px;
          word-break: break-word;
        }

        .rodape-card {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 8px;
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

          .valores {
            grid-template-columns: 1fr;
          }

          .btn-detalhes {
            width: 100%;
          }

          .rodape-card {
            justify-content: stretch;
          }
        }
      `}</style>
    </div>
  );
}