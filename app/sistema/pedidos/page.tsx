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
  status_detail?: string | null;
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

      const response = await api.get("/pedidos");
      const data = response.data;

      const lista = Array.isArray(data?.dados?.pedidos)
        ? data.dados.pedidos
        : Array.isArray(data?.pedidos)
        ? data.pedidos
        : Array.isArray(data?.dados)
        ? data.dados
        : Array.isArray(data)
        ? data
        : [];

      setPedidos(lista);
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

  function statusTexto(pedido: Pedido) {
    if (pedido.status_pagamento === "refunded") return "Reembolsado";
    if (pedido.status_pagamento === "rejected") return "Recusado";
    if (pedido.status_id === 16) return "Enviado";
    if (pedido.status_id === 17) return "Entregue";
    if (pedido.status_pagamento === "approved") return "Pago";
    return "Pendente";
  }

  function statusIcone(pedido: Pedido) {
    if (pedido.status_pagamento === "refunded") return <FiRotateCcw />;
    if (pedido.status_pagamento === "rejected") return <FiXCircle />;
    if (pedido.status_id === 16) return <FiTruck />;
    if (pedido.status_id === 17) return <FiCheckCircle />;
    if (pedido.status_pagamento === "approved") return <FiCheckCircle />;
    return <FiClock />;
  }

  function statusClasse(pedido: Pedido) {
    if (pedido.status_pagamento === "refunded") return styles.statusReembolsado;
    if (pedido.status_pagamento === "rejected") return styles.statusRecusado;
    if (pedido.status_id === 16) return styles.statusEnviado;
    if (pedido.status_id === 17) return styles.statusEntregue;
    if (pedido.status_pagamento === "approved") return styles.statusPago;
    return styles.statusPendente;
  }

  function podeReembolsar(pedido: Pedido) {
    return pedido.status_pagamento === "approved" && !!pedido.payment_id;
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

      await api.post(`/mercado/pagamento/${pedido.payment_id}/reembolso`);

      alert("Reembolso solicitado com sucesso.");
      await carregarPedidos();
    } catch (error: any) {
      const mensagem =
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
            Gerencie pedidos, produtos comprados e reembolsos.
          </p>
        </div>

        <button onClick={carregarPedidos} className={styles.refreshButton}>
          <FiRefreshCw />
          Atualizar
        </button>
      </div>

      {loading ? (
        <p className={styles.info}>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className={styles.info}>Nenhum pedido encontrado.</p>
      ) : (
        <section className={styles.orders}>
          {pedidos.map((pedido) => {
            const itens = getItens(pedido);

            return (
              <article key={pedido.id_pedido} className={styles.orderCard}>
                <div className={styles.orderTop}>
                  <div>
                    <strong className={styles.orderNumber}>
                      Pedido #{pedido.id_pedido}
                    </strong>
                    <p className={styles.orderDate}>
                      {formatarData(pedido.criado_em)}
                    </p>
                  </div>

                  <span className={`${styles.badge} ${statusClasse(pedido)}`}>
                    {statusIcone(pedido)}
                    {statusTexto(pedido)}
                  </span>
                </div>

                <div className={styles.customer}>
                  <strong>
                    {pedido.usuario_nome ?? `Usuário #${pedido.usuario_id}`}
                  </strong>
                  <span>{pedido.usuario_email ?? "Sem e-mail"}</span>
                </div>

                <div className={styles.paymentBox}>
                  <div>
                    <span>Método</span>
                    <strong>{pedido.metodo_pagamento ?? "—"}</strong>
                  </div>

                  <div>
                    <span>Payment ID</span>
                    <strong>{pedido.payment_id ?? "—"}</strong>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>{formatarMoeda(pedido.valor_total)}</strong>
                  </div>
                </div>

                <div className={styles.products}>
                  <div className={styles.productsTitle}>
                    <FiPackage />
                    Produtos pedidos
                  </div>

                  {itens.length === 0 ? (
                    <p className={styles.emptyProducts}>
                      Nenhum produto carregado neste pedido.
                    </p>
                  ) : (
                    itens.map((item, index) => (
                      <div
                        key={item.id_pedido_item ?? index}
                        className={styles.productItem}
                      >
                        <div>
                          <strong>{nomeItem(item)}</strong>
                          <span>Quantidade: {item.quantidade ?? 1}</span>
                        </div>

                        <div className={styles.productPrice}>
                          <span>{formatarMoeda(precoItem(item))}</span>
                          <strong>{formatarMoeda(subtotalItem(item))}</strong>
                        </div>
                      </div>
                    ))
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
                        <>
                          <FiRefreshCw />
                          Reembolsando...
                        </>
                      ) : (
                        <>
                          <FiRotateCcw />
                          Reembolso
                        </>
                      )}
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