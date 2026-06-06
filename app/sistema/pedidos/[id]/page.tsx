"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiPackage,
  FiRefreshCw,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import styles from "./PedidoDetalhe.module.css";

type Pedido = {
  id_pedido: number;
  carrinho_id: number;
  usuario_id: number;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  status_id: number;
  valor_total: number;
  payment_id?: string | null;
  external_reference?: string | null;
  metodo_pagamento?: string | null;
  status_pagamento?: string | null;
  status_detail?: string | null;
  data_aprovacao?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

type Item = {
  id_pedido_item: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

type Rastreamento = {
  id_rastreamento: number;
  pedido_id: number;
  status_id: number;
  descricao?: string | null;
  codigo_rastreio?: string | null;
  localizacao?: string | null;
  criado_em?: string | null;
};

export default function PedidoDetalhePage() {
  const params = useParams();
  const pedidoId = String(params?.id ?? "");

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [rastreamento, setRastreamento] = useState<Rastreamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [passoAtual, setPassoAtual] = useState(1);

  async function carregarPedido() {
    try {
      setLoading(true);

      const [pedidoRes, rastreioRes] = await Promise.all([
        api.get(`/pedido/${pedidoId}/com-itens`),
        api.get(`/pedido/${pedidoId}/rastreamento`).catch(() => null),
      ]);

      const pedidoData = pedidoRes.data;
      const rastreioData = rastreioRes?.data;

      const pedidoEncontrado =
        pedidoData?.dados?.pedido ??
        pedidoData?.pedido ??
        null;

      const listaItens = Array.isArray(pedidoData?.dados?.itens)
        ? pedidoData.dados.itens
        : Array.isArray(pedidoData?.itens)
          ? pedidoData.itens
          : [];

      const listaRastreamento = Array.isArray(rastreioData?.dados?.rastreamentos)
        ? rastreioData.dados.rastreamentos
        : Array.isArray(rastreioData?.dados?.rastreamento)
          ? rastreioData.dados.rastreamento
          : Array.isArray(rastreioData?.dados)
            ? rastreioData.dados
            : Array.isArray(rastreioData?.rastreamentos)
              ? rastreioData.rastreamentos
              : Array.isArray(rastreioData?.rastreamento)
                ? rastreioData.rastreamento
                : Array.isArray(rastreioData)
                  ? rastreioData
                  : [];

      setPedido(pedidoEncontrado);
      setItens(listaItens);
      setRastreamento(listaRastreamento);
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
      setPedido(null);
      setItens([]);
      setRastreamento([]);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarEntrega(
    statusId: number,
    descricao: string,
    codigoRastreio?: string
  ) {
    try {
      setSalvando(true);

      await api.post(`/pedido/${pedidoId}/rastreamento`, {
        status_id: statusId,
        descricao,
        codigo_rastreio: codigoRastreio || null,
        localizacao: "São Paulo/SP",
      });

      await carregarPedido();
      setPassoAtual(3);
    } catch (error) {
      console.error("Erro ao atualizar entrega:", error);
      alert("Erro ao atualizar entrega.");
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    if (pedidoId) carregarPedido();
  }, [pedidoId]);

  function proximoPasso() {
    setPassoAtual((passo) => Math.min(passo + 1, 3));
  }

  function voltarPasso() {
    setPassoAtual((passo) => Math.max(passo - 1, 1));
  }

  function moeda(valor?: number | null) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor ?? 0));
  }

  function data(valor?: string | null) {
    if (!valor) return "—";

    const d = new Date(valor.replace(" ", "T"));

    return Number.isNaN(d.getTime()) ? valor : d.toLocaleString("pt-BR");
  }

  function nomeStatus(statusId: number) {
    if (statusId === 6) return "Pedido criado";
    if (statusId === 7) return "Pedido pendente";
    if (statusId === 8) return "Pedido pago";
    if (statusId === 12) return "Pedido cancelado";
    if (statusId === 14) return "Pagamento aprovado";
    if (statusId === 15) return "Pagamento recusado";
    if (statusId === 16) return "Pedido enviado";
    if (statusId === 17) return "Pedido entregue";

    return `Status #${statusId}`;
  }

  function statusTexto(p?: Pedido | null) {
    if (!p) return "—";
    if (p.status_id === 16) return "Enviado";
    if (p.status_id === 17) return "Entregue";
    if (p.status_pagamento === "approved") return "Pago";
    if (p.status_pagamento === "refunded") return "Reembolsado";
    if (p.status_pagamento === "rejected") return "Recusado";

    return "Pendente";
  }

  function statusIcone(p?: Pedido | null) {
    if (!p) return <FiClock />;
    if (p.status_id === 16) return <FiTruck />;
    if (p.status_id === 17) return <FiCheckCircle />;
    if (p.status_pagamento === "approved") return <FiCheckCircle />;
    if (p.status_pagamento === "rejected") return <FiXCircle />;

    return <FiClock />;
  }

  function statusClasse(p?: Pedido | null) {
    if (!p) return styles.pendente;
    if (p.status_id === 16) return styles.enviado;
    if (p.status_id === 17) return styles.entregue;
    if (p.status_pagamento === "approved") return styles.pago;
    if (p.status_pagamento === "refunded") return styles.reembolsado;
    if (p.status_pagamento === "rejected") return styles.recusado;

    return styles.pendente;
  }

  if (loading) {
    return <main className={styles.container}>Carregando pedido...</main>;
  }

  if (!pedido) {
    return (
      <main className={styles.container}>
        <Link href="/sistema/pedidos" className={styles.voltar}>
          <FiArrowLeft /> Voltar
        </Link>

        <p className={styles.info}>Pedido não encontrado.</p>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <Link href="/sistema/pedidos" className={styles.voltar}>
        <FiArrowLeft /> Voltar para pedidos
      </Link>

      <header className={styles.header}>
        <div>
          <h1>
            <FiPackage />
            Pedido #{pedido.id_pedido}
          </h1>

          <p>Detalhes completos do pedido.</p>
        </div>

        <button onClick={carregarPedido} className={styles.btnClaro}>
          <FiRefreshCw />
          Atualizar
        </button>
      </header>

      <section className={styles.passos}>
        <button
          type="button"
          onClick={() => setPassoAtual(1)}
          className={`${styles.passo} ${
            passoAtual === 1 ? styles.passoAtivo : ""
          }`}
        >
          <span>1</span>
          <strong>Resumo</strong>
        </button>

        <button
          type="button"
          onClick={() => setPassoAtual(2)}
          className={`${styles.passo} ${
            passoAtual === 2 ? styles.passoAtivo : ""
          }`}
        >
          <span>2</span>
          <strong>Pagamento e Itens</strong>
        </button>

        <button
          type="button"
          onClick={() => setPassoAtual(3)}
          className={`${styles.passo} ${
            passoAtual === 3 ? styles.passoAtivo : ""
          }`}
        >
          <span>3</span>
          <strong>Entrega</strong>
        </button>
      </section>

      {passoAtual === 1 && (
        <section className={styles.card}>
          <h2>1. Resumo</h2>

          <div className={styles.resumoGrid}>
            <div>
              <small>Status</small>

              <span className={`${styles.badge} ${statusClasse(pedido)}`}>
                {statusIcone(pedido)}
                {statusTexto(pedido)}
              </span>
            </div>

            <div>
              <small>Total</small>
              <strong className={styles.valor}>{moeda(pedido.valor_total)}</strong>
            </div>

            <div>
              <small>Cliente</small>
              <strong>
                {pedido.usuario_nome ?? `Usuário #${pedido.usuario_id}`}
              </strong>
              <p>{pedido.usuario_email ?? "Sem e-mail"}</p>
            </div>

            <div>
              <small>Carrinho</small>
              <strong>#{pedido.carrinho_id}</strong>
            </div>

            <div>
              <small>Criado em</small>
              <strong>{data(pedido.criado_em)}</strong>
            </div>

            <div>
              <small>Atualizado em</small>
              <strong>{data(pedido.atualizado_em)}</strong>
            </div>
          </div>
        </section>
      )}

      {passoAtual === 2 && (
        <section className={styles.card}>
          <h2>
            <FiCreditCard />
            2. Pagamento e Itens
          </h2>

          <div className={styles.infoGrid}>
            <p>
              <b>Método:</b> {pedido.metodo_pagamento ?? "—"}
            </p>
            <p>
              <b>Status:</b> {pedido.status_pagamento ?? "—"}
            </p>
            <p>
              <b>Payment ID:</b> {pedido.payment_id ?? "—"}
            </p>
            <p>
              <b>Referência:</b> {pedido.external_reference ?? "—"}
            </p>
            <p>
              <b>Detalhe:</b> {pedido.status_detail ?? "—"}
            </p>
            <p>
              <b>Aprovado em:</b> {data(pedido.data_aprovacao)}
            </p>
          </div>

          <div className={styles.tabelaBox}>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Preço</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {itens.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Nenhum item encontrado.</td>
                  </tr>
                ) : (
                  itens.map((item) => (
                    <tr key={item.id_pedido_item}>
                      <td>Produto #{item.produto_id}</td>
                      <td>{item.quantidade}</td>
                      <td>{moeda(item.preco_unitario)}</td>
                      <td>{moeda(item.subtotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {passoAtual === 3 && (
        <section className={styles.card}>
          <h2>
            <FiTruck />
            3. Entrega e Histórico
          </h2>

          <div className={styles.actions}>
            <button
              disabled={salvando}
              onClick={() =>
                atualizarEntrega(16, "Pedido enviado para entrega")
              }
              className={styles.btnAzul}
            >
              <FiTruck />
              Marcar como enviado
            </button>

            <button
              disabled={salvando}
              onClick={() =>
                atualizarEntrega(17, "Pedido entregue ao cliente")
              }
              className={styles.btnVerde}
            >
              <FiCheckCircle />
              Marcar como entregue
            </button>
          </div>

          <div className={styles.timeline}>
            {rastreamento.length === 0 ? (
              <p>Nenhum rastreamento cadastrado.</p>
            ) : (
              rastreamento.map((r) => (
                <div key={r.id_rastreamento} className={styles.timelineItem}>
                  <strong>{nomeStatus(r.status_id)}</strong>

                  <p>{r.descricao ?? "—"}</p>

                  <small>
                    {r.codigo_rastreio
                      ? `Rastreio: ${r.codigo_rastreio} • `
                      : ""}
                    {r.localizacao ?? "—"} • {data(r.criado_em)}
                  </small>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <div className={styles.navegacaoPassos}>
        <button
          type="button"
          onClick={voltarPasso}
          disabled={passoAtual === 1}
          className={styles.btnClaro}
        >
          Voltar
        </button>

        <span>Passo {passoAtual} de 3</span>

        {passoAtual < 3 ? (
          <button
            type="button"
            onClick={proximoPasso}
            className={styles.btnAzul}
          >
            Próximo passo
          </button>
        ) : (
          <Link href="/sistema/pedidos" className={styles.btnVerdeLink}>
            Finalizar
          </Link>
        )}
      </div>
    </main>
  );
}