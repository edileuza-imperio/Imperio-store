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
  FiRotateCcw,
  FiTruck,
  FiXCircle,
  FiSearch,
  FiCreditCard,
  FiUser,
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
  const [busca, setBusca] = useState("");

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

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return pedidos;

    return pedidos.filter((pedido) => {
      return (
        String(pedido.id_pedido).includes(termo) ||
        String(pedido.usuario_nome ?? "").toLowerCase().includes(termo) ||
        String(pedido.usuario_email ?? "").toLowerCase().includes(termo) ||
        String(pedido.status_pagamento ?? "").toLowerCase().includes(termo) ||
        String(pedido.metodo_pagamento ?? "").toLowerCase().includes(termo) ||
        String(pedido.payment_id ?? "").toLowerCase().includes(termo)
      );
    });
  }, [pedidos, busca]);

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
    if (metodo.includes("credit")) return "Cartão de crédito";
    if (metodo.includes("debit")) return "Cartão de débito";

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

      <section className={styles.filterBox}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por pedido, cliente, e-mail, status ou pagamento..."
          />
        </div>

        <span>{pedidosFiltrados.length} pedido(s)</span>
      </section>

      {loading ? (
        <p className={styles.info}>Carregando pedidos...</p>
      ) : pedidosFiltrados.length === 0 ? (
        <p className={styles.info}>Nenhum pedido encontrado.</p>
      ) : (
        <section className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                  <th>Produtos</th>
                  <th>Total</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {pedidosFiltrados.map((pedido) => {
                  const itens = getItens(pedido);

                  return (
                    <tr key={pedido.id_pedido}>
                      <td>
                        <strong className={styles.orderNumber}>
                          #{pedido.id_pedido}
                        </strong>

                        {pedido.payment_id && (
                          <span className={styles.smallText}>
                            ID: {pedido.payment_id}
                          </span>
                        )}
                      </td>

                      <td>
                        <div className={styles.customer}>
                          <FiUser />
                          <div>
                            <strong>
                              {pedido.usuario_nome ??
                                `Usuário #${pedido.usuario_id}`}
                            </strong>
                            <span>{pedido.usuario_email ?? "Sem e-mail"}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${styles.badge} ${statusClasse(pedido)}`}
                        >
                          {statusIcone(pedido)}
                          {statusTexto(pedido)}
                        </span>
                      </td>

                      <td>
                        <div className={styles.payment}>
                          <FiCreditCard />
                          <strong>{metodoPagamento(pedido)}</strong>
                        </div>
                      </td>

                      <td>
                        {itens.length === 0 ? (
                          <span className={styles.emptyProducts}>
                            Sem itens
                          </span>
                        ) : (
                          <div className={styles.productsList}>
                            {itens.slice(0, 3).map((item, index) => (
                              <div
                                key={item.id_pedido_item ?? index}
                                className={styles.productMini}
                              >
                                <strong>{nomeItem(item)}</strong>
                                <span>
                                  {item.quantidade ?? 1}x{" "}
                                  {formatarMoeda(precoItem(item))} ={" "}
                                  {formatarMoeda(subtotalItem(item))}
                                </span>
                              </div>
                            ))}

                            {itens.length > 3 && (
                              <span className={styles.moreProducts}>
                                +{itens.length - 3} produto(s)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td>
                        <strong className={styles.total}>
                          {formatarMoeda(pedido.valor_total)}
                        </strong>
                      </td>

                      <td>
                        <span className={styles.date}>
                          {formatarData(pedido.criado_em)}
                        </span>
                      </td>

                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={`/sistema/pedidos/${pedido.id_pedido}`}
                            className={styles.viewButton}
                          >
                            <FiEye />
                            Ver
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}