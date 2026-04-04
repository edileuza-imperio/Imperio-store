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
  Wallet,
  Truck,
  BadgeDollarSign,
} from "lucide-react";
import api from "@/Api/conectar";
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
      const referencia = String(pedido.external_reference || "").toLowerCase();

      return (
        codigo.includes(termo) ||
        statusPagamento.includes(termo) ||
        metodo.includes(termo) ||
        referencia.includes(termo)
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

  return (
    <div className="layout">
      <Navbar />

      <main className="pagina-pedidos">
        <section className="hero">
          <div className="hero-texto">
            <span className="tag">Painel de pedidos</span>
            <h1>Gestão de pedidos da loja</h1>
            <p>
              Acompanhe status, pagamento, valores e evolução dos pedidos em um
              painel mais profissional.
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
          <div className="card-resumo destaque">
            <div className="icone-wrap">
              <ShoppingBag size={20} />
            </div>
            <div>
              <span>Total de pedidos</span>
              <strong>{totalPedidos}</strong>
            </div>
          </div>

          <div className="card-resumo">
            <div className="icone-wrap">
              <BadgeDollarSign size={20} />
            </div>
            <div>
              <span>Total vendido</span>
              <strong>{formatarMoeda(totalVendas)}</strong>
            </div>
          </div>

          <div className="card-resumo">
            <div className="icone-wrap">
              <Truck size={20} />
            </div>
            <div>
              <span>Total de frete</span>
              <strong>{formatarMoeda(totalFrete)}</strong>
            </div>
          </div>

          <div className="card-resumo">
            <div className="icone-wrap">
              <Wallet size={20} />
            </div>
            <div>
              <span>Total descontos</span>
              <strong>{formatarMoeda(totalDescontos)}</strong>
            </div>
          </div>
        </section>

        <section className="filtros-box">
          <div className="campo-busca">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por código, pagamento, referência..."
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
                    <a href={`/Pedidos/${id}`} className="btn-detalhes">
                      Ver detalhes
                    </a>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(circle at top left, rgba(164, 74, 74, 0.10), transparent 24%),
            radial-gradient(circle at top right, rgba(255, 241, 236, 0.9), transparent 22%),
            linear-gradient(180deg, #fff8f4 0%, #fff1ec 55%, #ffede6 100%);
        }

        .pagina-pedidos {
          flex: 1;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 18px 48px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 24px;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(164, 74, 74, 0.92), rgba(122, 46, 46, 0.92));
          color: #fffaf7;
          box-shadow: 0 18px 45px rgba(122, 46, 46, 0.22);
        }

        .tag {
          display: inline-block;
          margin-bottom: 10px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
        }

        .hero h1 {
          margin: 0 0 10px;
          font-size: 34px;
          line-height: 1.1;
        }

        .hero p {
          margin: 0;
          max-width: 720px;
          color: rgba(255, 250, 247, 0.92);
          font-size: 15px;
          line-height: 1.7;
        }

        .btn-atualizar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 14px;
          padding: 13px 18px;
          background: #fffaf7;
          color: #7a2e2e;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(255, 250, 247, 0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-atualizar:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(255, 250, 247, 0.34);
        }

        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        .card-resumo {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255, 250, 247, 0.86);
          border: 1px solid rgba(255, 235, 228, 0.95);
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 12px 32px rgba(122, 46, 46, 0.08);
          backdrop-filter: blur(8px);
        }

        .card-resumo.destaque {
          background: linear-gradient(135deg, #fff7f3, #ffeae1);
          border-color: #f8d7ca;
        }

        .icone-wrap {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, #a44a4a, #7a2e2e);
          color: #fffaf7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 10px 25px rgba(164, 74, 74, 0.24);
        }

        .card-resumo span {
          display: block;
          margin-bottom: 5px;
          color: #8b5e57;
          font-size: 13px;
          font-weight: 600;
        }

        .card-resumo strong {
          font-size: 24px;
          color: #5c2323;
        }

        .filtros-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 16px;
          background: rgba(255, 250, 247, 0.88);
          border: 1px solid #f3dfd7;
          border-radius: 20px;
          box-shadow: 0 10px 28px rgba(122, 46, 46, 0.06);
        }

        .campo-busca {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #edd8cf;
          border-radius: 14px;
          padding: 0 14px;
          background: #fffdfb;
        }

        .campo-busca input {
          width: 100%;
          border: none;
          outline: none;
          padding: 14px 0;
          background: transparent;
          font-size: 14px;
          color: #5c2323;
        }

        .contador {
          padding: 12px 16px;
          border-radius: 14px;
          background: #fff6f1;
          color: #8a4b4b;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid #f0d8cf;
        }

        .estado {
          background: rgba(255, 250, 247, 0.94);
          border: 1px solid #f0ddd5;
          border-radius: 24px;
          padding: 44px 20px;
          text-align: center;
          color: #7d5a54;
          box-shadow: 0 12px 30px rgba(122, 46, 46, 0.06);
        }

        .estado h3 {
          margin: 12px 0 8px;
          color: #5c2323;
        }

        .estado.erro {
          background: #fff4f4;
          border-color: #f4caca;
          color: #b23b3b;
        }

        .loading .loader {
          width: 42px;
          height: 42px;
          margin: 0 auto 14px;
          border-radius: 50%;
          border: 4px solid #f2d7cf;
          border-top-color: #a44a4a;
          animation: girar 0.8s linear infinite;
        }

        .grid-pedidos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 22px;
        }

        .card-pedido {
          background: rgba(255, 250, 247, 0.92);
          border: 1px solid rgba(243, 223, 215, 0.95);
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 14px 34px rgba(122, 46, 46, 0.09);
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card-pedido:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(122, 46, 46, 0.13);
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
          font-size: 12px;
          font-weight: 700;
          color: #a06a61;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .card-header h2 {
          margin: 0;
          font-size: 24px;
          color: #5c2323;
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
          background: #fff2e8;
          color: #c26528;
        }

        .status.aprovado {
          background: #eafaf1;
          color: #1f7a49;
        }

        .status.recusado {
          background: #fff1f2;
          color: #c13552;
        }

        .status.cancelado {
          background: #f3f4f6;
          color: #556070;
        }

        .status.analise {
          background: #eef4ff;
          color: #315fd3;
        }

        .info-lista {
          display: grid;
          gap: 11px;
          margin-bottom: 18px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #7d5a54;
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
          border: 1px solid #f1ddd5;
          background: #fffdfb;
          border-radius: 16px;
          padding: 14px;
        }

        .valor-item span {
          display: block;
          font-size: 12px;
          color: #9a6d65;
          margin-bottom: 5px;
          font-weight: 600;
        }

        .valor-item strong {
          color: #5c2323;
          font-size: 18px;
        }

        .valor-item.destaque-total {
          background: linear-gradient(135deg, #fff0ea, #ffe4dc);
          border-color: #f0cfc3;
        }

        .meta-box {
          display: grid;
          gap: 8px;
          margin-bottom: 18px;
          color: #7d5a54;
          font-size: 13px;
          word-break: break-word;
          padding: 14px;
          background: #fffaf7;
          border-radius: 16px;
          border: 1px solid #f2dfd7;
        }

        .rodape-card {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .btn-detalhes {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: linear-gradient(135deg, #a44a4a, #7a2e2e);
          color: #fffaf7;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(164, 74, 74, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-detalhes:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(164, 74, 74, 0.28);
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

          .hero {
            padding: 20px;
          }

          .hero h1 {
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
        }
      `}</style>
    </div>
  );
}