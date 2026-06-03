"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Package,
  ShoppingBag,
  CreditCard,
  CalendarDays,
  Receipt,
  Wallet,
  Truck,
  BadgeDollarSign,
  ArrowRight,
  CircleDollarSign,
  TimerReset,
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

  if (typeof valor === "string") {
    const normalizado = valor.replace(/\./g, "").replace(",", ".");
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }

  return Number.isFinite(valor) ? valor : 0;
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

  return dt.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
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
      const referencia = String(pedido.external_reference || "").toLowerCase();
      const detail = String(pedido.status_detail || "").toLowerCase();

      return (
        codigo.includes(termo) ||
        statusPagamento.includes(termo) ||
        metodo.includes(termo) ||
        referencia.includes(termo) ||
        detail.includes(termo)
      );
    });
  }, [pedidos, busca]);

  const totalPedidos = pedidosFiltrados.length;

  const totalVendas = pedidosFiltrados.reduce((acc, pedido) => {
    return acc + toNumber(pedido.valor_total);
  }, 0);

  const totalFrete = pedidosFiltrados.reduce((acc, pedido) => {
    return acc + toNumber(pedido.valor_frete);
  }, 0);

  const totalDescontos = pedidosFiltrados.reduce((acc, pedido) => {
    return acc + toNumber(pedido.valor_desconto);
  }, 0);

  const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

  const pedidosAprovados = pedidosFiltrados.filter((pedido) => {
    const status = (pedido.status_pagamento || "").toLowerCase();
    return status === "approved" || status === "aprovado";
  }).length;

  return (
    <div className="layout">
      <main className="pagina-pedidos">
        <section className="cabecalho">
          <div className="cabecalho-texto">
            <span className="tag">Painel de pedidos</span>
            <h1>Gestão de pedidos da loja</h1>
            <p>
              Acompanhe status, pagamento, valores e evolução dos pedidos em
              uma interface limpa, moderna e fácil de ler.
            </p>
          </div>

          <button
            type="button"
            className="btn-atualizar"
            onClick={carregarPedidos}
          >
            <RefreshCw size={18} />
            Atualizar pedidos
          </button>
        </section>

        <section className="resumo-grid">
          <article className="card-resumo">
            <div className="icone-wrap">
              <ShoppingBag size={20} />
            </div>
            <div>
              <span>Total de pedidos</span>
              <strong>{totalPedidos}</strong>
            </div>
          </article>

          <article className="card-resumo">
            <div className="icone-wrap">
              <BadgeDollarSign size={20} />
            </div>
            <div>
              <span>Total vendido</span>
              <strong>{formatarMoeda(totalVendas)}</strong>
            </div>
          </article>

          <article className="card-resumo">
            <div className="icone-wrap">
              <CircleDollarSign size={20} />
            </div>
            <div>
              <span>Ticket médio</span>
              <strong>{formatarMoeda(ticketMedio)}</strong>
            </div>
          </article>

          <article className="card-resumo">
            <div className="icone-wrap">
              <Truck size={20} />
            </div>
            <div>
              <span>Total de frete</span>
              <strong>{formatarMoeda(totalFrete)}</strong>
            </div>
          </article>
        </section>

        <section className="resumo-secundario">
          <div className="mini-card">
            <TimerReset size={18} />
            <div>
              <span>Pedidos aprovados</span>
              <strong>{pedidosAprovados}</strong>
            </div>
          </div>

          <div className="mini-card">
            <Wallet size={18} />
            <div>
              <span>Total de descontos</span>
              <strong>{formatarMoeda(totalDescontos)}</strong>
            </div>
          </div>
        </section>

        <section className="filtros-box">
          <div className="campo-busca">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por código, pagamento, referência ou detalhe..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="contador">{pedidosFiltrados.length} pedido(s)</div>
        </section>

        {loading && (
          <section className="estado loading">
            <div className="loader" />
            <h3>Carregando pedidos</h3>
            <p>Aguarde enquanto buscamos os pedidos da loja.</p>
          </section>
        )}

        {!loading && erro && (
          <section className="estado erro">
            <h3>Não foi possível carregar</h3>
            <p>{erro}</p>
          </section>
        )}

        {!loading && !erro && pedidosFiltrados.length === 0 && (
          <section className="estado vazio">
            <Package size={42} />
            <h3>Nenhum pedido encontrado</h3>
            <p>Quando houver pedidos, eles aparecerão aqui.</p>
          </section>
        )}

        {!loading && !erro && pedidosFiltrados.length > 0 && (
          <section className="grid-pedidos">
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
                <article key={id} className="card-pedido">
                  <div className="card-header">
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
                      <span>Criado em: {formatarData(pedido.criado_em)}</span>
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

                    <div className="valor-item destaque-total">
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
                    <Link href={`/Pedidos/${id}`} className="btn-detalhes">
                      Ver detalhes
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          background: #f4f6f8;
        }

        .pagina-pedidos {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 28px 20px 52px;
        }

        .cabecalho {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          padding: 26px;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .cabecalho-texto {
          max-width: 760px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          margin-bottom: 10px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .cabecalho h1 {
          margin: 0 0 8px;
          font-size: clamp(28px, 3vw, 40px);
          line-height: 1.05;
          color: #0f172a;
        }

        .cabecalho p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
        }

        .btn-atualizar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #dbe3ea;
          border-radius: 14px;
          padding: 13px 18px;
          background: #ffffff;
          color: #0f172a;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .btn-atualizar:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.07);
          border-color: #cbd5e1;
        }

        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .card-resumo {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }

        .icone-wrap {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: #0f172a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-resumo span,
        .mini-card span {
          display: block;
          margin-bottom: 4px;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
        }

        .card-resumo strong,
        .mini-card strong {
          font-size: 22px;
          color: #0f172a;
          line-height: 1.1;
        }

        .resumo-secundario {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .mini-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
        }

        .mini-card :global(svg) {
          color: #475569;
          flex-shrink: 0;
        }

        .filtros-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          padding: 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
        }

        .campo-busca {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border: 1px solid #dbe3ea;
          border-radius: 14px;
          background: #f8fafc;
          color: #64748b;
        }

        .campo-busca input {
          width: 100%;
          border: none;
          outline: none;
          padding: 14px 0;
          background: transparent;
          font-size: 14px;
          color: #0f172a;
        }

        .contador {
          padding: 12px 14px;
          border-radius: 14px;
          background: #f8fafc;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .estado {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 46px 20px;
          text-align: center;
          color: #64748b;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }

        .estado h3 {
          margin: 12px 0 8px;
          color: #0f172a;
        }

        .estado.erro {
          background: #fff7f7;
          border-color: #fecaca;
          color: #b91c1c;
        }

        .loading .loader {
          width: 42px;
          height: 42px;
          margin: 0 auto 14px;
          border-radius: 50%;
          border: 4px solid #e2e8f0;
          border-top-color: #0f172a;
          animation: girar 0.8s linear infinite;
        }

        .grid-pedidos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 18px;
        }

        .card-pedido {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          padding: 22px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .card-pedido:hover {
          transform: translateY(-2px);
          border-color: #d1d5db;
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }

        .pedido-label {
          display: inline-block;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .card-header h2 {
          margin: 0;
          font-size: 24px;
          color: #0f172a;
          line-height: 1.15;
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
          border: 1px solid transparent;
        }

        .status.pendente {
          background: #fef3c7;
          color: #92400e;
          border-color: #fde68a;
        }

        .status.aprovado {
          background: #dcfce7;
          color: #166534;
          border-color: #bbf7d0;
        }

        .status.recusado {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .status.cancelado {
          background: #e2e8f0;
          color: #334155;
          border-color: #cbd5e1;
        }

        .status.analise {
          background: #dbeafe;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        .info-lista {
          display: grid;
          gap: 10px;
          margin-bottom: 18px;
          padding-bottom: 18px;
          border-bottom: 1px solid #eef2f7;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #475569;
          font-size: 14px;
          line-height: 1.5;
        }

        .info-item :global(svg) {
          color: #64748b;
          flex-shrink: 0;
        }

        .valores {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .valor-item {
          padding: 14px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .valor-item span {
          display: block;
          margin-bottom: 5px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .valor-item strong {
          color: #0f172a;
          font-size: 17px;
          line-height: 1.1;
        }

        .valor-item.destaque-total {
          background: #0f172a;
          border-color: #0f172a;
        }

        .valor-item.destaque-total span,
        .valor-item.destaque-total strong {
          color: #ffffff;
        }

        .meta-box {
          display: grid;
          gap: 8px;
          margin-bottom: 18px;
          padding: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          color: #475569;
          font-size: 13px;
          word-break: break-word;
        }

        .meta-box strong {
          color: #0f172a;
        }

        .rodape-card {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: auto;
        }

        .btn-detalhes {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          background: #0f172a;
          color: #ffffff;
          border-radius: 14px;
          padding: 12px 16px;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            background 0.2s ease;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
        }

        .btn-detalhes:hover {
          transform: translateY(-1px);
          background: #111827;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
        }

        @keyframes girar {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .pagina-pedidos {
            padding: 18px 12px 36px;
          }

          .cabecalho {
            padding: 20px;
          }

          .cabecalho h1 {
            font-size: 28px;
          }

          .grid-pedidos {
            grid-template-columns: 1fr;
          }

          .valores {
            grid-template-columns: 1fr;
          }

          .rodape-card {
            justify-content: stretch;
          }

          .btn-detalhes {
            width: 100%;
          }

          .filtros-box {
            padding: 14px;
          }

          .campo-busca {
            min-width: 100%;
          }

          .contador {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}