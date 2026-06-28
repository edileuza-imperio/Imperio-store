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
  FiCreditCard,
  FiShoppingBag,
  FiCalendar,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
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
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(3);

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
      setPaginaAtual(1);
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

    return dataConvertida.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  function precoItem(item: PedidoItem) {
    return Number(item.preco_unitario ?? item.preco ?? 0);
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

  const totalVendido = useMemo(() => {
    return pedidos.reduce(
      (total, pedido) => total + Number(pedido.valor_total ?? 0),
      0
    );
  }, [pedidos]);

  const pedidosVendidos = useMemo(() => {
    return pedidos.filter(pedidoPagoOuVendido).length;
  }, [pedidos]);

  const totalPaginas = Math.max(1, Math.ceil(pedidos.length / itensPorPagina));

  const pedidosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    return pedidos.slice(inicio, fim);
  }, [pedidos, paginaAtual, itensPorPagina]);

  function mudarItensPorPagina(valor: number) {
    setItensPorPagina(valor);
    setPaginaAtual(1);
  }

  function paginaAnterior() {
    setPaginaAtual((pagina) => Math.max(1, pagina - 1));
  }

  function proximaPagina() {
    setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1));
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            <FiPackage />
            Pedidos
          </h1>

          <p className={styles.subtitle}>
            Controle de vendas, pagamentos, rastreamentos e reembolsos.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.headerStats}>
            <span>{pedidos.length} pedidos</span>
            <span>{pedidosVendidos} vendidos</span>
            <strong>{formatarMoeda(totalVendido)}</strong>
          </div>

          <button
            type="button"
            onClick={carregarPedidos}
            className={styles.refreshButton}
          >
            <FiRefreshCw className={loading ? styles.spin : ""} />
            Atualizar
          </button>
        </div>
      </header>

      {loading ? (
        <p className={styles.info}>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className={styles.info}>Nenhum pedido encontrado.</p>
      ) : (
        <>
          <section className={styles.ordersList}>
            {pedidosPaginados.map((pedido) => {
              const itens = getItens(pedido);
              const primeiroItem = itens[0];

              return (
                <article key={pedido.id_pedido} className={styles.orderCard}>
                  <div className={styles.cardTop}>
                    <span className={styles.orderId}>
                      Pedido #{pedido.id_pedido}
                    </span>

                    <span className={`${styles.badge} ${statusClasse(pedido)}`}>
                      {statusIcone(pedido)}
                      {statusTexto(pedido)}
                    </span>
                  </div>

                  <div className={styles.customerBlock}>
                    <h3>
                      {pedido.usuario_nome ?? `Usuário #${pedido.usuario_id}`}
                    </h3>

                    <small>{pedido.usuario_email ?? "Sem e-mail"}</small>

                    {pedido.payment_id && (
                      <small className={styles.paymentId}>
                        Pagamento: {pedido.payment_id}
                      </small>
                    )}
                  </div>

                  <div className={styles.statusBlock}>
                    <span className={styles.metaItem}>
                      <FiCreditCard />
                      {metodoPagamento(pedido)}
                    </span>

                    <span className={styles.metaItem}>
                      <FiCalendar />
                      {formatarData(pedido.criado_em)}
                    </span>
                  </div>

                  <div className={styles.productBlock}>
                    {primeiroItem ? (
                      <>
                        <strong>{itens.length} produto(s)</strong>

                        <span>
                          {primeiroItem.quantidade ?? 1}x{" "}
                          {formatarMoeda(precoItem(primeiroItem))}
                        </span>

                        {itens.length > 1 && (
                          <em>+{itens.length - 1} item(ns)</em>
                        )}
                      </>
                    ) : (
                      <strong>Sem itens</strong>
                    )}
                  </div>

                  <div className={styles.totalBlock}>
                    <strong>{formatarMoeda(pedido.valor_total)}</strong>

                    <span>
                      <FiShoppingBag />
                      {itens.length} item(ns)
                    </span>
                  </div>

                  <div className={styles.actionBlock}>
                    <Link
                      href={`/sistema/pedidos/${pedido.id_pedido}`}
                      className={styles.viewButton}
                      title="Ver pedido"
                    >
                      <FiEye />
                      <span>Ver</span>
                    </Link>

                    <Link
                      href={`/sistema/pedidos/${pedido.id_pedido}/rastreamento`}
                      className={styles.trackButton}
                      title="Rastreamento"
                    >
                      <FiMapPin />
                      <span>Rastrear</span>
                    </Link>

                    {podeReembolsar(pedido) && (
                      <button
                        type="button"
                        onClick={() => reembolsarPedido(pedido)}
                        className={styles.refundButton}
                        disabled={reembolsando === pedido.id_pedido}
                        title="Reembolso"
                      >
                        {reembolsando === pedido.id_pedido ? (
                          <FiRefreshCw className={styles.spin} />
                        ) : (
                          <FiRotateCcw />
                        )}

                        <span>Reembolso</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <footer className={styles.pagination}>
            <div className={styles.paginationGroup}>
              <span>Mostrar</span>

              <select
                value={itensPorPagina}
                onChange={(e) => mudarItensPorPagina(Number(e.target.value))}
              >
                <option value={3}>3</option>
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
              </select>

              <span>por página</span>
            </div>

            <div className={styles.paginationCenter}>
              <button
                type="button"
                onClick={paginaAnterior}
                disabled={paginaAtual === 1}
              >
                <FiChevronLeft />
              </button>

              <label>
                Página
                <select
                  value={paginaAtual}
                  onChange={(e) => setPaginaAtual(Number(e.target.value))}
                >
                  {Array.from({ length: totalPaginas }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </select>
                de {totalPaginas}
              </label>

              <button
                type="button"
                onClick={proximaPagina}
                disabled={paginaAtual === totalPaginas}
              >
                <FiChevronRight />
              </button>
            </div>

            <strong>
              {pedidosPaginados.length} de {pedidos.length} pedidos
            </strong>
          </footer>
        </>
      )}
    </main>
  );
}