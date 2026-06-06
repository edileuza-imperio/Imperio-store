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
  RotateCcw,
} from "lucide-react";

import api from "@/Api/conectar";
import styles from "./PedidosPage.module.css";

type Pedido = {
  id_pedido?: number;
  carrinho_id?: number;
  usuario_id?: number;
  status_id?: number;
  valor_produtos?: number | string;
  valor_desconto?: number | string;
  valor_frete?: number | string;
  valor_total?: number | string;
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
  const valor = String(status || "").toLowerCase();

  if (valor === "approved" || valor === "aprovado") return "Aprovado";
  if (valor === "pending" || valor === "pendente") return "Pendente";
  if (valor === "rejected" || valor === "recusado") return "Recusado";
  if (valor === "cancelled" || valor === "cancelado") return "Cancelado";
  if (valor === "in_process") return "Em análise";
  if (valor === "refunded" || valor === "reembolsado") return "Reembolsado";

  return status || "Pendente";
}

function getStatusClass(status?: string | null): string {
  const valor = String(status || "").toLowerCase();

  if (valor === "approved" || valor === "aprovado") return styles.aprovado;
  if (valor === "rejected" || valor === "recusado") return styles.recusado;
  if (valor === "cancelled" || valor === "cancelado") return styles.cancelado;
  if (valor === "in_process") return styles.analise;
  if (valor === "refunded" || valor === "reembolsado") return styles.reembolsado;

  return styles.pendente;
}

function getEtapaPedido(status?: string | null): number {
  const valor = String(status || "").toLowerCase();

  if (valor === "approved" || valor === "aprovado") return 2;
  if (valor === "in_process") return 1;

  if (
    valor === "rejected" ||
    valor === "recusado" ||
    valor === "cancelled" ||
    valor === "cancelado" ||
    valor === "refunded" ||
    valor === "reembolsado"
  ) {
    return 0;
  }

  return 1;
}

function getEtapaTexto(status?: string | null): string {
  const valor = String(status || "").toLowerCase();

  if (valor === "refunded" || valor === "reembolsado") return "Pagamento reembolsado";
  if (valor === "rejected" || valor === "recusado") return "Pagamento recusado";
  if (valor === "cancelled" || valor === "cancelado") return "Pedido cancelado";
  if (valor === "approved" || valor === "aprovado") return "Pagamento aprovado";
  if (valor === "in_process") return "Pagamento em análise";

  return "Aguardando pagamento";
}

function getEtapaIcone(status?: string | null) {
  const valor = String(status || "").toLowerCase();

  if (valor === "approved" || valor === "aprovado") return <CheckCircle2 size={16} />;
  if (valor === "refunded" || valor === "reembolsado") return <RotateCcw size={16} />;
  if (valor === "rejected" || valor === "recusado") return <XCircle size={16} />;
  if (valor === "cancelled" || valor === "cancelado") return <XCircle size={16} />;
  if (valor === "in_process") return <TimerReset size={16} />;

  return <Clock3 size={16} />;
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

      const response = await api.get("/pedidos", {
        withCredentials: true,
      });

      const lista = Array.isArray(response.data?.dados?.pedidos)
        ? response.data.dados.pedidos
        : Array.isArray(response.data?.dados)
          ? response.data.dados
          : Array.isArray(response.data)
            ? response.data
            : [];

      setPedidos(lista);
    } catch (error: any) {
      console.error("Erro ao carregar pedidos:", error);

      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
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
    const status = String(pedido.status_pagamento || "").toLowerCase();
    return status === "approved" || status === "aprovado";
  }).length;

  const pedidosPendentes = pedidosFiltrados.filter((pedido) => {
    const status = String(pedido.status_pagamento || "").toLowerCase();
    return status === "pending" || status === "pendente" || status === "in_process";
  }).length;

  const pedidosFinalizados = pedidosFiltrados.filter((pedido) => {
    const status = String(pedido.status_pagamento || "").toLowerCase();
    return (
      status === "rejected" ||
      status === "recusado" ||
      status === "cancelled" ||
      status === "cancelado" ||
      status === "refunded" ||
      status === "reembolsado"
    );
  }).length;

  const valorTotalFiltrado = pedidosFiltrados.reduce((total, pedido) => {
    return total + toNumber(pedido.valor_total);
  }, 0);

  return (
    <div className={styles.layout}>
      <main className={styles.paginaPedidos}>
        <section className={styles.cabecalho}>
          <div className={styles.cabecalhoTexto}>
            <span className={styles.tag}>Minha conta</span>
            <h1>Meus pedidos</h1>
            <p>
              Acompanhe suas compras, pagamentos, reembolsos e detalhes de cada
              pedido em um só lugar.
            </p>
          </div>

          <button
            type="button"
            className={styles.btnAtualizar}
            onClick={carregarPedidos}
            disabled={loading}
          >
            <RefreshCw
              size={18}
              className={loading ? styles.iconeGirando : ""}
            />
            {loading ? "Atualizando" : "Atualizar"}
          </button>
        </section>

        <section className={styles.resumoGrid}>
          <article className={styles.cardResumo}>
            <div className={styles.iconeWrap}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <span>Total de pedidos</span>
              <strong>{totalPedidos}</strong>
            </div>
          </article>

          <article className={styles.cardResumo}>
            <div className={styles.iconeWrap}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span>Aprovados</span>
              <strong>{pedidosAprovados}</strong>
            </div>
          </article>

          <article className={styles.cardResumo}>
            <div className={styles.iconeWrap}>
              <Clock3 size={20} />
            </div>
            <div>
              <span>Em aberto</span>
              <strong>{pedidosPendentes}</strong>
            </div>
          </article>

          <article className={styles.cardResumo}>
            <div className={styles.iconeWrap}>
              <XCircle size={20} />
            </div>
            <div>
              <span>Finalizados</span>
              <strong>{pedidosFinalizados}</strong>
            </div>
          </article>

          <article className={`${styles.cardResumo} ${styles.cardResumoTotal}`}>
            <div className={styles.iconeWrap}>
              <CreditCard size={20} />
            </div>
            <div>
              <span>Total em compras</span>
              <strong>{formatarMoeda(valorTotalFiltrado)}</strong>
            </div>
          </article>
        </section>

        <section className={styles.filtrosBox}>
          <div className={styles.campoBusca}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por pedido, pagamento, status ou data..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className={styles.contador}>{pedidosFiltrados.length} pedido(s)</div>
        </section>

        {loading && (
          <section className={`${styles.estado} ${styles.loading}`}>
            <div className={styles.loader} />
            <h3>Carregando seus pedidos</h3>
            <p>Estamos buscando o histórico das suas compras.</p>
          </section>
        )}

        {!loading && erro && (
          <section className={`${styles.estado} ${styles.erro}`}>
            <XCircle size={42} />
            <h3>Não foi possível carregar</h3>
            <p>{erro}</p>
            <button type="button" onClick={carregarPedidos}>
              Tentar novamente
            </button>
          </section>
        )}

        {!loading && !erro && pedidosFiltrados.length === 0 && (
          <section className={`${styles.estado} ${styles.vazio}`}>
            <Package size={42} />
            <h3>Nenhum pedido encontrado</h3>
            <p>Quando você fizer uma compra, ela vai aparecer aqui.</p>
            <Link href="/">Voltar para a loja</Link>
          </section>
        )}

        {!loading && !erro && pedidosFiltrados.length > 0 && (
          <section className={styles.gridPedidos}>
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
                <article key={id} className={styles.cardPedido}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span className={styles.pedidoLabel}>Pedido</span>
                      <h2>{codigo}</h2>
                    </div>

                    <span
                      className={`${styles.status} ${getStatusClass(
                        pedido.status_pagamento
                      )}`}
                    >
                      {statusPagamento}
                    </span>
                  </div>

                  <div className={styles.timeline}>
                    <div className={`${styles.step} ${styles.ativo}`}>
                      <span className={styles.stepIcone}>
                        <ShoppingBag size={16} />
                      </span>
                      <div>
                        <strong>Pedido feito</strong>
                        <small>{formatarData(pedido.criado_em)}</small>
                      </div>
                    </div>

                    <div
                      className={`${styles.linha} ${
                        etapa >= 1 ? styles.ativo : ""
                      }`}
                    />

                    <div
                      className={`${styles.step} ${
                        etapa >= 1 ? styles.ativo : ""
                      }`}
                    >
                      <span className={styles.stepIcone}>
                        {getEtapaIcone(pedido.status_pagamento)}
                      </span>
                      <div>
                        <strong>{getEtapaTexto(pedido.status_pagamento)}</strong>
                        <small>{pedido.status_detail || "Aguardando atualização"}</small>
                      </div>
                    </div>

                    <div
                      className={`${styles.linha} ${
                        etapa >= 2 ? styles.ativo : ""
                      }`}
                    />

                    <div
                      className={`${styles.step} ${
                        etapa >= 2 ? styles.ativo : ""
                      }`}
                    >
                      <span className={styles.stepIcone}>
                        <Truck size={16} />
                      </span>
                      <div>
                        <strong>Envio</strong>
                        <small>Separação e entrega</small>
                      </div>
                    </div>
                  </div>

                  <div className={styles.resumoPedido}>
                    <div className={styles.resumoLinha}>
                      <span>Pagamento</span>
                      <strong>
                        <CreditCard size={15} />
                        {pedido.metodo_pagamento || "Cartão/PIX"}
                      </strong>
                    </div>

                    <div className={styles.resumoLinha}>
                      <span>Data</span>
                      <strong>
                        <CalendarDays size={15} />
                        {formatarData(pedido.criado_em)}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.valores}>
                    <div className={styles.valorItem}>
                      <span>Produtos</span>
                      <strong>{formatarMoeda(valorProdutos)}</strong>
                    </div>

                    <div className={styles.valorItem}>
                      <span>Desconto</span>
                      <strong>{formatarMoeda(valorDesconto)}</strong>
                    </div>

                    <div className={styles.valorItem}>
                      <span>Frete</span>
                      <strong>{formatarMoeda(valorFrete)}</strong>
                    </div>

                    <div className={`${styles.valorItem} ${styles.destaqueTotal}`}>
                      <span>Total</span>
                      <strong>{formatarMoeda(valorTotal)}</strong>
                    </div>
                  </div>

                  <div className={styles.rodapeCard}>
                    <Link href={`/Pedidos/${id}`} className={styles.btnDetalhes}>
                      Ver detalhess
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