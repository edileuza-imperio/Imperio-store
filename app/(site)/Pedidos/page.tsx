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
  ArrowRight,
  CheckCircle2,
  Clock3,
  Truck,
  XCircle,
  TimerReset,
} from "lucide-react";
import api from "@/Api/conectar";
import "./PedidosPage.css";

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

function getEtapaPedido(status?: string | null): number {
  const valor = (status || "").toLowerCase();

  if (valor === "approved" || valor === "aprovado") return 2;
  if (valor === "in_process") return 1;
  if (valor === "rejected" || valor === "recusado" || valor === "cancelled" || valor === "cancelado")
    return 0;

  return 1;
}

function getEtapaTexto(etapa: number): string {
  if (etapa === 0) return "Pedido recebido";
  if (etapa === 1) return "Pagamento em análise";
  if (etapa === 2) return "Pagamento aprovado";
  return "Pedido recebido";
}

function getEtapaIcone(etapa: number) {
  if (etapa === 0) return <Clock3 size={16} />;
  if (etapa === 1) return <TimerReset size={16} />;
  return <CheckCircle2 size={16} />;
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
      const detail = String(pedido.status_detail || "").toLowerCase();
      const criado = String(pedido.criado_em || "").toLowerCase();

      return (
        codigo.includes(termo) ||
        statusPagamento.includes(termo) ||
        metodo.includes(termo) ||
        detail.includes(termo) ||
        criado.includes(termo)
      );
    });
  }, [pedidos, busca]);

  const totalPedidos = pedidosFiltrados.length;

  const pedidosAprovados = pedidosFiltrados.filter((pedido) => {
    const status = (pedido.status_pagamento || "").toLowerCase();
    return status === "approved" || status === "aprovado";
  }).length;

  const pedidosPendentes = pedidosFiltrados.filter((pedido) => {
    const status = (pedido.status_pagamento || "").toLowerCase();
    return status === "pending" || status === "pendente" || status === "in_process";
  }).length;

  const pedidosCancelados = pedidosFiltrados.filter((pedido) => {
    const status = (pedido.status_pagamento || "").toLowerCase();
    return (
      status === "rejected" ||
      status === "recusado" ||
      status === "cancelled" ||
      status === "cancelado"
    );
  }).length;

  const valorTotalFiltrado = pedidosFiltrados.reduce((total, pedido) => {
    return total + toNumber(pedido.valor_total);
  }, 0);

  return (
    <div className="layout">
      <main className="pagina-pedidos">
        <section className="cabecalho">
          <div className="cabecalho-texto">
            <span className="tag">Minha conta</span>
            <h1>Meus pedidos</h1>
            <p>
              Acompanhe suas compras, veja o andamento do pagamento e acesse
              os detalhes de cada pedido com facilidade.
            </p>
          </div>

          <button
            type="button"
            className="btn-atualizar"
            onClick={carregarPedidos}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "icone-girando" : ""} />
            {loading ? "Atualizando" : "Atualizar"}
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
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span>Pagamentos aprovados</span>
              <strong>{pedidosAprovados}</strong>
            </div>
          </article>

          <article className="card-resumo">
            <div className="icone-wrap">
              <Clock3 size={20} />
            </div>
            <div>
              <span>Em aberto</span>
              <strong>{pedidosPendentes}</strong>
            </div>
          </article>

          <article className="card-resumo">
            <div className="icone-wrap">
              <XCircle size={20} />
            </div>
            <div>
              <span>Cancelados</span>
              <strong>{pedidosCancelados}</strong>
            </div>
          </article>

          <article className="card-resumo card-resumo-total">
            <div className="icone-wrap">
              <CreditCard size={20} />
            </div>
            <div>
              <span>Total em compras</span>
              <strong>{formatarMoeda(valorTotalFiltrado)}</strong>
            </div>
          </article>
        </section>

        <section className="filtros-box">
          <div className="campo-busca">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar pedido, forma de pagamento, status ou data..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="contador">{pedidosFiltrados.length} pedido(s)</div>
        </section>

        {loading && (
          <section className="estado loading">
            <div className="loader" />
            <h3>Carregando seus pedidos</h3>
            <p>Estamos buscando o histórico das suas compras.</p>
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
            <p>Quando você fizer uma compra, ela vai aparecer aqui.</p>
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
              const etapa = getEtapaPedido(pedido.status_pagamento);

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

                  <div className="timeline">
                    <div className={`step ${etapa >= 0 ? "ativo" : ""}`}>
                      <span className="step-icone">
                        <ShoppingBag size={16} />
                      </span>
                      <div>
                        <strong>Pedido feito</strong>
                        <small>{formatarData(pedido.criado_em)}</small>
                      </div>
                    </div>

                    <div className={`linha ${etapa >= 1 ? "ativo" : ""}`} />

                    <div className={`step ${etapa >= 1 ? "ativo" : ""}`}>
                      <span className="step-icone">
                        {getEtapaIcone(etapa)}
                      </span>
                      <div>
                        <strong>{getEtapaTexto(etapa)}</strong>
                        <small>
                          {pedido.status_detail || "Aguardando atualização"}
                        </small>
                      </div>
                    </div>

                    <div className={`linha ${etapa >= 2 ? "ativo" : ""}`} />

                    <div className={`step ${etapa >= 2 ? "ativo" : ""}`}>
                      <span className="step-icone">
                        <Truck size={16} />
                      </span>
                      <div>
                        <strong>Próxima etapa</strong>
                        <small>Envio e entrega</small>
                      </div>
                    </div>
                  </div>

                  <div className="resumo-pedido">
                    <div className="resumo-linha">
                      <span>Forma de pagamento</span>
                      <strong>
                        <CreditCard size={15} />
                        {pedido.metodo_pagamento || "Não informado"}
                      </strong>
                    </div>

                    <div className="resumo-linha">
                      <span>Data do pedido</span>
                      <strong>
                        <CalendarDays size={15} />
                        {formatarData(pedido.criado_em)}
                      </strong>
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

    </div>
  );
}
