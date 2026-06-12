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
  ShieldCheck,
  ReceiptText,
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

function normalizarStatus(status?: string | null): string {
  return String(status || "").toLowerCase();
}

function isAprovado(status?: string | null): boolean {
  const valor = normalizarStatus(status);
  return valor === "approved" || valor === "aprovado";
}

function isPendente(status?: string | null): boolean {
  const valor = normalizarStatus(status);
  return valor === "pending" || valor === "pendente" || valor === "in_process";
}

function isFinalizadoRuim(status?: string | null): boolean {
  const valor = normalizarStatus(status);

  return (
    valor === "rejected" ||
    valor === "recusado" ||
    valor === "cancelled" ||
    valor === "cancelado" ||
    valor === "refunded" ||
    valor === "reembolsado"
  );
}

function getStatusPagamentoTexto(status?: string | null): string {
  const valor = normalizarStatus(status);

  if (valor === "approved" || valor === "aprovado") return "Aprovado";
  if (valor === "pending" || valor === "pendente") return "Pendente";
  if (valor === "rejected" || valor === "recusado") return "Recusado";
  if (valor === "cancelled" || valor === "cancelado") return "Cancelado";
  if (valor === "in_process") return "Em análise";
  if (valor === "refunded" || valor === "reembolsado") return "Reembolsado";

  return status || "Pendente";
}

function getStatusClass(status?: string | null): string {
  const valor = normalizarStatus(status);

  if (valor === "approved" || valor === "aprovado") return styles.aprovado;
  if (valor === "rejected" || valor === "recusado") return styles.recusado;
  if (valor === "cancelled" || valor === "cancelado") return styles.cancelado;
  if (valor === "in_process") return styles.analise;
  if (valor === "refunded" || valor === "reembolsado") return styles.reembolsado;

  return styles.pendente;
}

function getEtapaTexto(status?: string | null): string {
  const valor = normalizarStatus(status);

  if (valor === "refunded" || valor === "reembolsado") return "Pagamento reembolsado";
  if (valor === "rejected" || valor === "recusado") return "Pagamento recusado";
  if (valor === "cancelled" || valor === "cancelado") return "Pedido cancelado";
  if (valor === "approved" || valor === "aprovado") return "Pagamento aprovado";
  if (valor === "in_process") return "Pagamento em análise";

  return "Aguardando pagamento";
}

function getPaymentIcon(status?: string | null) {
  const valor = normalizarStatus(status);

  if (valor === "approved" || valor === "aprovado") return <CheckCircle2 size={18} />;
  if (valor === "refunded" || valor === "reembolsado") return <RotateCcw size={18} />;

  if (
    valor === "rejected" ||
    valor === "recusado" ||
    valor === "cancelled" ||
    valor === "cancelado"
  ) {
    return <XCircle size={18} />;
  }

  if (valor === "in_process") return <TimerReset size={18} />;

  return <Clock3 size={18} />;
}

function getMetodoTexto(metodo?: string | null): string {
  const valor = String(metodo || "").toLowerCase();

  if (valor === "pix") return "PIX";
  if (valor.includes("credit")) return "Cartão de crédito";
  if (valor.includes("debit")) return "Cartão de débito";

  return metodo || "Cartão/PIX";
}

function extrairUsuarioId(data: any): number {
  const usuarioId =
    data?.dados?.usuario?.id_usuario ||
    data?.dados?.usuario?.id ||
    data?.dados?.id_usuario ||
    data?.dados?.id ||
    data?.usuario?.id_usuario ||
    data?.usuario?.id ||
    data?.id_usuario ||
    data?.id;

  return Number(usuarioId || 0);
}

function normalizarPedidos(data: any): Pedido[] {
  if (Array.isArray(data?.dados?.pedidos)) {
    return data.dados.pedidos;
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
      setPedidos([]);

      const meResponse = await api.get("/me", {
        withCredentials: true,
      });

      const usuarioId = extrairUsuarioId(meResponse.data);

      if (!usuarioId) {
        throw new Error("Usuário não encontrado. Faça login novamente.");
      }

      const response = await api.get(`/pedidos/usuario/${usuarioId}`, {
        withCredentials: true,
      });

      setPedidos(normalizarPedidos(response.data));
    } catch (error: any) {
      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          error?.message ||
          "Não foi possível carregar os seus pedidos."
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

  const pedidosAprovados = pedidosFiltrados.filter((pedido) =>
    isAprovado(pedido.status_pagamento)
  ).length;

  const pedidosPendentes = pedidosFiltrados.filter((pedido) =>
    isPendente(pedido.status_pagamento)
  ).length;

  const pedidosFinalizados = pedidosFiltrados.filter((pedido) =>
    isFinalizadoRuim(pedido.status_pagamento)
  ).length;

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
              Acompanhe suas compras em 3 etapas: pedido realizado, pagamento e
              envio.
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

          <div className={styles.contador}>
            {pedidosFiltrados.length} pedido(s)
          </div>
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
              const aprovado = isAprovado(pedido.status_pagamento);
              const problema = isFinalizadoRuim(pedido.status_pagamento);

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

                  <div className={styles.etapasGrid}>
                    <div className={`${styles.etapaCard} ${styles.etapaOk}`}>
                      <div className={styles.etapaTopo}>
                        <span className={styles.etapaIcone}>
                          <ReceiptText size={18} />
                        </span>

                        <span className={styles.etapaNumero}>1</span>
                      </div>

                      <strong>Pedido feito</strong>
                      <small>{formatarData(pedido.criado_em)}</small>
                    </div>

                    <div
                      className={`${styles.etapaCard} ${
                        aprovado
                          ? styles.etapaOk
                          : problema
                          ? styles.etapaErro
                          : styles.etapaAtual
                      }`}
                    >
                      <div className={styles.etapaTopo}>
                        <span className={styles.etapaIcone}>
                          {getPaymentIcon(pedido.status_pagamento)}
                        </span>

                        <span className={styles.etapaNumero}>2</span>
                      </div>

                      <strong>{getEtapaTexto(pedido.status_pagamento)}</strong>
                      <small>
                        {pedido.status_detail || "Aguardando atualização"}
                      </small>
                    </div>

                    <div
                      className={`${styles.etapaCard} ${
                        aprovado ? styles.etapaAtual : styles.etapaPendente
                      }`}
                    >
                      <div className={styles.etapaTopo}>
                        <span className={styles.etapaIcone}>
                          <Truck size={18} />
                        </span>

                        <span className={styles.etapaNumero}>3</span>
                      </div>

                      <strong>{aprovado ? "Preparando envio" : "Envio"}</strong>
                      <small>
                        {aprovado
                          ? "Seu pedido será separado para entrega"
                          : "Liberado após pagamento"}
                      </small>
                    </div>
                  </div>

                  <div className={styles.resumoPedido}>
                    <div className={styles.resumoLinha}>
                      <span>Pagamento</span>

                      <strong>
                        <CreditCard size={15} />
                        {getMetodoTexto(pedido.metodo_pagamento)}
                      </strong>
                    </div>

                    <div className={styles.resumoLinha}>
                      <span>Compra realizada</span>

                      <strong>
                        <CalendarDays size={15} />
                        {formatarData(pedido.criado_em)}
                      </strong>
                    </div>

                    <div className={styles.resumoLinha}>
                      <span>Segurança</span>

                      <strong>
                        <ShieldCheck size={15} />
                        Mercado Pago
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

                    <div
                      className={`${styles.valorItem} ${styles.destaqueTotal}`}
                    >
                      <span>Total</span>
                      <strong>{formatarMoeda(valorTotal)}</strong>
                    </div>
                  </div>

                  <div className={styles.rodapeCard}>
                    <Link href={`/Pedidos/${id}`} className={styles.btnDetalhes}>
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