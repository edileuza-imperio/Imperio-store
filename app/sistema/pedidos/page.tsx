"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiEye,
  FiPackage,
  FiRefreshCw,
  FiTruck,
  FiXCircle,
  FiRotateCcw,
  FiDollarSign,
} from "react-icons/fi";

import styles from "./Pedidos.module.css";

type Pedido = {
  id_pedido: number;
  carrinho_id: number;
  usuario_id: number;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  status_id: number;
  valor_produtos: number;
  valor_desconto: number;
  valor_frete: number;
  valor_total: number;
  preference_id?: string | null;
  payment_id?: string | null;
  external_reference?: string | null;
  metodo_pagamento?: string | null;
  status_pagamento?: string | null;
  status_detail?: string | null;
  data_aprovacao?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
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

  const resumo = useMemo(() => {
    return {
      total: pedidos.length,
      pagos: pedidos.filter((p) => p.status_pagamento === "approved").length,
      pendentes: pedidos.filter(
        (p) =>
          p.status_pagamento === "pendente" ||
          p.status_pagamento === "pending" ||
          !p.status_pagamento
      ).length,
      recusados: pedidos.filter((p) => p.status_pagamento === "rejected").length,
      reembolsados: pedidos.filter((p) => p.status_pagamento === "refunded").length,
    };
  }, [pedidos]);

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor ?? 0));
  }

  function formatarData(data?: string | null) {
    if (!data) return "—";

    const dataConvertida = new Date(data.replace(" ", "T"));

    if (Number.isNaN(dataConvertida.getTime())) {
      return data;
    }

    return dataConvertida.toLocaleString("pt-BR");
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
    return (
      pedido.status_pagamento === "approved" &&
      !!pedido.payment_id &&
      reembolsando !== pedido.id_pedido
    );
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
      console.error("Erro ao reembolsar:", error);

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
          <p className={styles.subtitle}>Gerencie pagamentos, pedidos e reembolsos.</p>
        </div>

        <button onClick={carregarPedidos} className={styles.refreshButton}>
          <FiRefreshCw />
          Atualizar
        </button>
      </div>

      <section className={styles.cards}>
        <div className={styles.card}>
          <FiPackage />
          <div>
            <strong>{resumo.total}</strong>
            <span>Total de pedidos</span>
          </div>
        </div>

        <div className={styles.card}>
          <FiCheckCircle />
          <div>
            <strong>{resumo.pagos}</strong>
            <span>Pagos</span>
          </div>
        </div>

        <div className={styles.card}>
          <FiClock />
          <div>
            <strong>{resumo.pendentes}</strong>
            <span>Pendentes</span>
          </div>
        </div>

        <div className={styles.card}>
          <FiRotateCcw />
          <div>
            <strong>{resumo.reembolsados}</strong>
            <span>Reembolsados</span>
          </div>
        </div>

        <div className={styles.card}>
          <FiXCircle />
          <div>
            <strong>{resumo.recusados}</strong>
            <span>Recusados</span>
          </div>
        </div>
      </section>

      {loading ? (
        <p className={styles.info}>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className={styles.info}>Nenhum pedido encontrado.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Pagamento</th>
                <th>Payment ID</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id_pedido}>
                  <td>
                    <strong>#{pedido.id_pedido}</strong>
                  </td>

                  <td>
                    <div className={styles.cliente}>
                      <strong>{pedido.usuario_nome ?? `Usuário #${pedido.usuario_id}`}</strong>
                      <span>{pedido.usuario_email ?? "Sem e-mail"}</span>
                    </div>
                  </td>

                  <td>
                    <strong className={styles.valor}>
                      {formatarMoeda(pedido.valor_total)}
                    </strong>
                  </td>

                  <td>
                    <span className={styles.pagamento}>
                      {pedido.metodo_pagamento ?? "—"}
                    </span>
                  </td>

                  <td>
                    <span className={styles.paymentId}>
                      {pedido.payment_id ?? "—"}
                    </span>
                  </td>

                  <td>
                    <span className={`${styles.badge} ${statusClasse(pedido)}`}>
                      {statusIcone(pedido)}
                      {statusTexto(pedido)}
                    </span>
                  </td>

                  <td>{formatarData(pedido.criado_em)}</td>

                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/sistema/pedidos/${pedido.id_pedido}`}
                        className={styles.link}
                      >
                        <FiEye />
                        Ver
                      </Link>

                      {podeReembolsar(pedido) && (
                        <button
                          type="button"
                          onClick={() => reembolsarPedido(pedido)}
                          className={styles.refundButton}
                        >
                          <FiRotateCcw />
                          Reembolso
                        </button>
                      )}

                      {reembolsando === pedido.id_pedido && (
                        <button type="button" disabled className={styles.refundLoading}>
                          <FiRefreshCw />
                          Reembolsando...
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}