"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiEye,
  FiPackage,
  FiRefreshCw,
  FiRotateCcw,
  FiTruck,
  FiXCircle,
  FiCreditCard,
  FiUser,
  FiShoppingBag,
  FiCalendar,
} from "react-icons/fi";

import styles from "./Pedidos.module.css";

type PedidoItem = {
  id_pedido_item?: number;
  produto_id?: number;
  produto_nome?: string | null;
  nome_produto?: string | null;
  nome?: string | null;
  quantidade?: number;
  preco_unitario?: number;
  preco?: number;
  subtotal?: number;
};

type Pedido = {
  id_pedido: number;
  usuario_id: number;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  status_id: number;
  valor_total: number;
  payment_id?: string | null;
  metodo_pagamento?: string | null;
  status_pagamento?: string | null;
  criado_em?: string | null;
  itens?: PedidoItem[];
  produtos?: PedidoItem[];
};

export default function SistemaPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [reembolsando, setReembolsando] = useState<number | null>(null);

  async function carregarPedidos() {
    try {
      setLoading(true);

      const response = await api.get("/pedidos", {
        withCredentials: true,
      });

      const data = response.data;

      const listaBase: Pedido[] = Array.isArray(data?.dados?.pedidos)
        ? data.dados.pedidos
        : Array.isArray(data?.pedidos)
        ? data.pedidos
        : Array.isArray(data?.dados)
        ? data.dados
        : Array.isArray(data)
        ? data
        : [];

      const listaComItens = await Promise.all(
        listaBase.map(async (pedido) => {
          try {
            const detalhes = await api.get(
              `/pedido/${pedido.id_pedido}/com-itens`,
              {
                withCredentials: true,
              }
            );

            const dados = detalhes.data?.dados ?? detalhes.data;

            return {
              ...pedido,
              ...(dados?.pedido ?? {}),
              itens: Array.isArray(dados?.itens) ? dados.itens : [],
            };
          } catch {
            return {
              ...pedido,
              itens: pedido.itens ?? pedido.produtos ?? [],
            };
          }
        })
      );

      setPedidos(listaComItens);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  function formatarMoeda(valor?: number | null) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor ?? 0));
  }

  function formatarData(data?: string | null) {
    if (!data) return "—";

    const dataConvertida = new Date(data.replace(" ", "T"));

    if (Number.isNaN(dataConvertida.getTime())) return data;

    return dataConvertida.toLocaleString("pt-BR");
  }

  function getItens(pedido: Pedido) {
    return pedido.itens ?? pedido.produtos ?? [];
  }

  function normalizarStatus(pedido: Pedido) {
    return String(pedido.status_pagamento ?? "").toLowerCase();
  }

  function pedidoPagoOuVendido(pedido: Pedido) {
    const status = normalizarStatus(pedido);

    return (
      status === "approved" ||
      status === "aprovado" ||
      status === "vendido" ||
      status === "pago" ||
      pedido.status_id === 8 ||
      pedido.status_id === 9 ||
      pedido.status_id === 14
    );
  }

  function pedidoReembolsado(pedido: Pedido) {
    const status = normalizarStatus(pedido);

    return (
      status === "refunded" ||
      status === "reembolsado" ||
      pedido.status_id === 13
    );
  }

  function pedidoRecusado(pedido: Pedido) {
    const status = normalizarStatus(pedido);

    return (
      status === "rejected" ||
      status === "recusado" ||
      pedido.status_id === 15
    );
  }

  function statusTexto(pedido: Pedido) {
    if (pedidoReembolsado(pedido)) return "Reembolsado";
    if (pedidoRecusado(pedido)) return "Recusado";
    if (pedido.status_id === 16) return "Enviado";
    if (pedido.status_id === 17) return "Entregue";
    if (pedidoPagoOuVendido(pedido)) return "Vendido";
    return "Pendente";
  }

  function statusIcone(pedido: Pedido) {
    if (pedidoReembolsado(pedido)) return <FiRotateCcw />;
    if (pedidoRecusado(pedido)) return <FiXCircle />;
    if (pedido.status_id === 16) return <FiTruck />;
    if (pedido.status_id === 17) return <FiCheckCircle />;
    if (pedidoPagoOuVendido(pedido)) return <FiCheckCircle />;
    return <FiClock />;
  }

  function statusClasse(pedido: Pedido) {
    if (pedidoReembolsado(pedido)) return styles.statusReembolsado;
    if (pedidoRecusado(pedido)) return styles.statusRecusado;
    if (pedido.status_id === 16) return styles.statusEnviado;
    if (pedido.status_id === 17) return styles.statusEntregue;
    if (pedidoPagoOuVendido(pedido)) return styles.statusPago;
    return styles.statusPendente;
  }

  function metodoPagamento(pedido: Pedido) {
    const metodo = String(pedido.metodo_pagamento ?? "").toLowerCase();

    if (metodo === "pix") return "PIX";
    if (metodo.includes("credit")) return "Cartão";
    if (metodo.includes("debit")) return "Débito";

    return pedido.metodo_pagamento || "—";
  }

  function nomeItem(item: PedidoItem) {
    return (
      item.produto_nome ??
      item.nome_produto ??
      item.nome ??
      `Produto #${item.produto_id ?? "?"}`
    );
  }

  function precoItem(item: PedidoItem) {
    return Number(item.preco_unitario ?? item.preco ?? 0);
  }

  function subtotalItem(item: PedidoItem) {
    return Number(
      item.subtotal ??
        Number(item.quantidade ?? 1) *
          Number(item.preco_unitario ?? item.preco ?? 0)
    );
  }

  function podeReembolsar(pedido: Pedido) {
    return pedidoPagoOuVendido(pedido) && !!pedido.payment_id;
  }

  async function reembolsarPedido(pedido: Pedido) {
    if (!pedido.payment_id) {
      alert("Este pedido não possui Payment ID.");
      return;
    }

    const confirmar = window.confirm(
      `Deseja reembolsar o pedido #${pedido.id_pedido} no valor de ${formatarMoeda(
        pedido.valor_total
      )}?`
    );

    if (!confirmar) return;

    try {
      setReembolsando(pedido.id_pedido);

      await api.post(`/mercado/pagamento/${pedido.payment_id}/reembolso`, null, {
        withCredentials: true,
      });

      alert("Reembolso solicitado com sucesso.");
      await carregarPedidos();
    } catch (error: any) {
      const mensagem =
        error?.response?.data?.dados?.mercadopago?.message ||
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        "Erro ao solicitar reembolso.";

      alert(mensagem);
    } finally {
      setReembolsando(null);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <FiPackage />
            Pedidos
          </h1>

          <p className={styles.subtitle}>
            Gerencie vendas, pagamentos, produtos comprados e reembolsos.
          </p>
        </div>

        <button onClick={carregarPedidos} className={styles.refreshButton}>
          <FiRefreshCw className={loading ? styles.spin : ""} />
          Atualizar
        </button>
      </div>

      <section className={styles.summary}>
        <div className={styles.summaryCard}>
          <span>Total de pedidos</span>
          <strong>{pedidos.length}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>Pedidos vendidos</span>
          <strong>{pedidos.filter(pedidoPagoOuVendido).length}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>Valor total</span>
          <strong>
            {formatarMoeda(
              pedidos.reduce(
                (total, pedido) => total + Number(pedido.valor_total ?? 0),
                0
              )
            )}
          </strong>
        </div>
      </section>

      {loading ? (
        <p className={styles.info}>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className={styles.info}>Nenhum pedido encontrado.</p>
      ) : (
        <section className={styles.ordersGrid}>
          {pedidos.map((pedido) => {
            const itens = getItens(pedido);

            return (
              <article key={pedido.id_pedido} className={styles.orderCard}>
                <div className={styles.orderTop}>
                  <div className={styles.orderMain}>
                    <span className={styles.orderId}>
                      Pedido #{pedido.id_pedido}
                    </span>

                    <h3>
                      {pedido.usuario_nome ?? `Usuário #${pedido.usuario_id}`}
                    </h3>

                    <small>{pedido.usuario_email ?? "Sem e-mail"}</small>

                    {pedido.payment_id && (
                      <small className={styles.paymentId}>
                        ID: {pedido.payment_id}
                      </small>
                    )}
                  </div>

                  <strong className={styles.orderTotal}>
                    {formatarMoeda(pedido.valor_total)}
                  </strong>
                </div>

                <div className={styles.orderMeta}>
                  <span className={`${styles.badge} ${statusClasse(pedido)}`}>
                    {statusIcone(pedido)}
                    {statusTexto(pedido)}
                  </span>

                  <span className={styles.metaItem}>
                    <FiCreditCard />
                    {metodoPagamento(pedido)}
                  </span>

                  <span className={styles.metaItem}>
                    <FiCalendar />
                    {formatarData(pedido.criado_em)}
                  </span>

                  <span className={styles.metaItem}>
                    <FiShoppingBag />
                    {itens.length} produto(s)
                  </span>
                </div>

                <div className={styles.productsBox}>
                  {itens.length === 0 ? (
                    <span className={styles.emptyProducts}>Sem itens</span>
                  ) : (
                    itens.slice(0, 3).map((item, index) => (
                      <div
                        key={item.id_pedido_item ?? index}
                        className={styles.productItem}
                      >
                        <strong>{nomeItem(item)}</strong>

                        <span>
                          {item.quantidade ?? 1}x {formatarMoeda(precoItem(item))} ={" "}
                          {formatarMoeda(subtotalItem(item))}
                        </span>
                      </div>
                    ))
                  )}

                  {itens.length > 3 && (
                    <span className={styles.moreProducts}>
                      +{itens.length - 3} produto(s)
                    </span>
                  )}
                </div>

                <div className={styles.actions}>
                  <Link
                    href={`/sistema/pedidos/${pedido.id_pedido}`}
                    className={styles.viewButton}
                  >
                    <FiEye />
                    Ver pedido
                  </Link>

                  {podeReembolsar(pedido) && (
                    <button
                      type="button"
                      onClick={() => reembolsarPedido(pedido)}
                      className={styles.refundButton}
                      disabled={reembolsando === pedido.id_pedido}
                    >
                      {reembolsando === pedido.id_pedido ? (
                        <FiRefreshCw className={styles.spin} />
                      ) : (
                        <FiRotateCcw />
                      )}
                      Reembolso
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}