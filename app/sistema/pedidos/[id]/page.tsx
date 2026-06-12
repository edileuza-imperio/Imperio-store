"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiPackage,
  FiRefreshCw,
  FiTruck,
  FiXCircle,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiMapPin,
  FiMail,
  FiEdit3,
  FiHash,
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
  produto_nome?: string | null;
  nome?: string | null;
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

  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [localizacao, setLocalizacao] = useState("São Paulo/SP");
  const [descricaoEntrega, setDescricaoEntrega] = useState("");
  const [enviarEmail, setEnviarEmail] = useState(true);

  const [modalEntrega, setModalEntrega] = useState(false);
  const [statusSelecionado, setStatusSelecionado] = useState<16 | 17>(16);

  async function carregarPedido() {
    try {
      setLoading(true);

      console.log("Carregando pedido ID:", pedidoId);

      const [pedidoRes, rastreioRes, todosRastreiosRes] = await Promise.all([
        api.get(`/pedido/${pedidoId}/com-itens`),
        api.get(`/pedido/${pedidoId}/rastreamento`).catch((error) => {
          console.error("Erro ao buscar rastreamento por pedido:", error);
          return null;
        }),
        api.get(`/pedido-rastreamentos`).catch((error) => {
          console.error("Erro ao buscar todos rastreamentos:", error);
          return null;
        }),
      ]);

      console.log("Resposta pedido:", pedidoRes.data);
      console.log("Resposta rastreio:", rastreioRes?.data);
      console.log("Resposta todos rastreios:", todosRastreiosRes?.data);

      const pedidoData = pedidoRes.data;
      const rastreioData = rastreioRes?.data;
      const todosRastreiosData = todosRastreiosRes?.data;

      const pedidoEncontrado =
        pedidoData?.dados?.pedido ?? pedidoData?.pedido ?? null;

      const listaItens = Array.isArray(pedidoData?.dados?.itens)
        ? pedidoData.dados.itens
        : Array.isArray(pedidoData?.itens)
        ? pedidoData.itens
        : [];

      let listaRastreamento: Rastreamento[] = Array.isArray(
        rastreioData?.dados?.rastreamentos
      )
        ? rastreioData.dados.rastreamentos
        : Array.isArray(rastreioData?.dados)
        ? rastreioData.dados
        : Array.isArray(rastreioData?.rastreamentos)
        ? rastreioData.rastreamentos
        : [];

      if (listaRastreamento.length === 0) {
        const todos: Rastreamento[] = Array.isArray(
          todosRastreiosData?.dados?.rastreamentos
        )
          ? todosRastreiosData.dados.rastreamentos
          : Array.isArray(todosRastreiosData?.dados)
          ? todosRastreiosData.dados
          : [];

        listaRastreamento = todos.filter(
          (r) => Number(r.pedido_id) === Number(pedidoId)
        );
      }

      listaRastreamento = listaRastreamento.sort((a, b) => {
        const dataA = new Date((a.criado_em ?? "").replace(" ", "T")).getTime();
        const dataB = new Date((b.criado_em ?? "").replace(" ", "T")).getTime();
        return dataB - dataA;
      });

      console.log("Pedido encontrado:", pedidoEncontrado);
      console.log("Itens encontrados:", listaItens);
      console.log("Rastreamentos encontrados:", listaRastreamento);

      setPedido(pedidoEncontrado);
      setItens(listaItens);
      setRastreamento(listaRastreamento);
    } catch (error: any) {
      console.error("Erro geral ao carregar pedido:", error);
      console.error("Response error:", error?.response?.data);
      console.error("Status error:", error?.response?.status);

      setPedido(null);
      setItens([]);
      setRastreamento([]);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarEntrega(statusId: 16 | 17) {
    try {
      setSalvando(true);

      const descricaoPadrao =
        statusId === 16
          ? "Pedido enviado para entrega"
          : "Pedido entregue ao cliente";

      const payload = {
        pedido_id: Number(pedidoId),
        status_id: statusId,
        descricao: descricaoEntrega || descricaoPadrao,
        codigo_rastreio: codigoRastreio.trim() || null,
        localizacao: localizacao.trim() || "São Paulo/SP",
        enviar_email: enviarEmail,
      };

      console.log("Enviando atualização de entrega:", payload);

      const response = await api.post(`/pedido/${pedidoId}/rastreamento`, payload);

      console.log("Resposta atualização entrega:", response.data);

      setDescricaoEntrega("");
      setCodigoRastreio("");
      setModalEntrega(false);

      await carregarPedido();

      const emailEnviado = response.data?.email_enviado;

      alert(
        enviarEmail
          ? emailEnviado
            ? "Histórico salvo e e-mail enviado ao cliente."
            : "Histórico salvo, mas o e-mail pode não ter sido enviado. Veja o console/log do backend."
          : "Histórico salvo com sucesso."
      );
    } catch (error: any) {
      console.error("Erro ao atualizar entrega:", error);
      console.error("Erro response data:", error?.response?.data);
      console.error("Erro status:", error?.response?.status);
      console.error("Erro headers:", error?.response?.headers);

      alert(
        error?.response?.data?.mensagem ??
          error?.response?.data?.erro ??
          "Erro ao atualizar entrega. Veja o console."
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirModalEntrega(statusId: 16 | 17) {
    setStatusSelecionado(statusId);

    if (statusId === 16) {
      setDescricaoEntrega("Seu pedido foi enviado para entrega.");
    }

    if (statusId === 17) {
      setDescricaoEntrega("Seu pedido foi entregue ao cliente.");
    }

    setModalEntrega(true);
  }

  useEffect(() => {
    if (pedidoId) carregarPedido();
  }, [pedidoId]);

  const totalItens = useMemo(() => {
    return itens.reduce((total, item) => total + Number(item.quantidade ?? 0), 0);
  }, [itens]);

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

  function normalizarStatus(p?: Pedido | null) {
    return String(p?.status_pagamento ?? "").toLowerCase();
  }

  function statusPago(p?: Pedido | null) {
    const status = normalizarStatus(p);

    return (
      status === "approved" ||
      status === "aprovado" ||
      status === "vendido" ||
      status === "pago" ||
      p?.status_id === 8 ||
      p?.status_id === 9 ||
      p?.status_id === 14
    );
  }

  function statusTexto(p?: Pedido | null) {
    if (!p) return "—";
    if (p.status_id === 16) return "Enviado";
    if (p.status_id === 17) return "Entregue";
    if (normalizarStatus(p) === "refunded") return "Reembolsado";
    if (normalizarStatus(p) === "rejected") return "Recusado";
    if (statusPago(p)) return "Vendido";
    return "Pendente";
  }

  function statusIcone(p?: Pedido | null) {
    if (!p) return <FiClock />;
    if (p.status_id === 16) return <FiTruck />;
    if (p.status_id === 17) return <FiCheckCircle />;
    if (statusPago(p)) return <FiCheckCircle />;
    if (normalizarStatus(p) === "rejected") return <FiXCircle />;
    return <FiClock />;
  }

  function statusClasse(p?: Pedido | null) {
    if (!p) return styles.pendente;
    if (p.status_id === 16) return styles.enviado;
    if (p.status_id === 17) return styles.entregue;
    if (normalizarStatus(p) === "refunded") return styles.reembolsado;
    if (normalizarStatus(p) === "rejected") return styles.recusado;
    if (statusPago(p)) return styles.pago;
    return styles.pendente;
  }

  function nomeStatus(statusId: number) {
    const status: Record<number, string> = {
      6: "Pedido criado",
      7: "Pedido pendente",
      8: "Pedido pago",
      12: "Pedido cancelado",
      14: "Pagamento aprovado",
      15: "Pagamento recusado",
      16: "Pedido enviado",
      17: "Pedido entregue",
    };

    return status[statusId] ?? `Status #${statusId}`;
  }

  function metodoPagamento(p?: Pedido | null) {
    const metodo = String(p?.metodo_pagamento ?? "").toLowerCase();

    if (metodo === "pix") return "PIX";
    if (metodo.includes("credit")) return "Cartão de crédito";
    if (metodo.includes("debit")) return "Cartão de débito";

    return p?.metodo_pagamento || "—";
  }

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.loadingBox}>
          <FiRefreshCw className={styles.spin} />
          <strong>Carregando pedido...</strong>
          <span>Buscando detalhes, itens e histórico.</span>
        </div>
      </main>
    );
  }

  if (!pedido) {
    return (
      <main className={styles.container}>
        <Link href="/sistema/pedidos" className={styles.voltar}>
          <FiArrowLeft /> Voltar
        </Link>

        <div className={styles.emptyBox}>
          <FiXCircle />
          <strong>Pedido não encontrado.</strong>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <Link href="/sistema/pedidos" className={styles.voltar}>
          <FiArrowLeft /> Voltar para pedidos
        </Link>

        <div className={styles.heroContent}>
          <div>
            <span className={styles.tag}>Painel Administrativo</span>
            <h1>Pedido #{pedido.id_pedido}</h1>
            <p>Resumo da venda, pagamento, produtos e entrega.</p>
          </div>

          <button onClick={carregarPedido} className={styles.btnClaro}>
            <FiRefreshCw />
            Atualizar
          </button>
        </div>
      </section>

      <section className={styles.metricas}>
        <article className={styles.metricaCard}>
          <FiDollarSign />
          <span>Total do pedido</span>
          <strong>{moeda(pedido.valor_total)}</strong>
        </article>

        <article className={styles.metricaCard}>
          <FiUser />
          <span>Cliente</span>
          <strong>{pedido.usuario_nome ?? `Usuário #${pedido.usuario_id}`}</strong>
          <small>{pedido.usuario_email ?? "Sem e-mail"}</small>
        </article>

        <article className={styles.metricaCard}>
          <FiCreditCard />
          <span>Pagamento</span>
          <strong>{metodoPagamento(pedido)}</strong>
          <small>{pedido.status_detail ?? "Sem detalhe"}</small>
        </article>

        <article className={styles.metricaCard}>
          <FiPackage />
          <span>Itens</span>
          <strong>{totalItens}</strong>
          <small>{itens.length} produto(s)</small>
        </article>
      </section>

      <section className={styles.statusPanel}>
        <div className={styles.statusHeader}>
          <div>
            <span className={styles.miniTag}>Status do pedido</span>
            <h2>Acompanhamento</h2>
          </div>

          <span className={`${styles.badge} ${statusClasse(pedido)}`}>
            {statusIcone(pedido)}
            {statusTexto(pedido)}
          </span>
        </div>

        <div className={styles.etapas}>
          <article className={`${styles.etapa} ${styles.etapaOk}`}>
            <span>1</span>
            <FiPackage />
            <strong>Pedido recebido</strong>
            <small>{data(pedido.criado_em)}</small>
          </article>

          <article
            className={`${styles.etapa} ${
              statusPago(pedido) ? styles.etapaOk : styles.etapaAtual
            }`}
          >
            <span>2</span>
            <FiCreditCard />
            <strong>
              {statusPago(pedido) ? "Pagamento aprovado" : "Aguardando pagamento"}
            </strong>
            <small>
              {pedido.data_aprovacao
                ? data(pedido.data_aprovacao)
                : pedido.status_detail ?? "—"}
            </small>
          </article>

          <article
            className={`${styles.etapa} ${
              pedido.status_id === 17
                ? styles.etapaOk
                : pedido.status_id === 16
                ? styles.etapaAtual
                : styles.etapaPendente
            }`}
          >
            <span>3</span>
            <FiTruck />
            <strong>
              {pedido.status_id === 17
                ? "Entregue"
                : pedido.status_id === 16
                ? "Enviado"
                : "Preparando envio"}
            </strong>
            <small>Atualizado em {data(pedido.atualizado_em)}</small>
          </article>
        </div>
      </section>

      <section className={styles.gridPrincipal}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.miniTag}>Produtos</span>
              <h2>Itens comprados</h2>
            </div>
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
                      <td>
                        <strong>
                          {item.produto_nome ??
                            item.nome ??
                            `Produto #${item.produto_id}`}
                        </strong>
                        <small>#{item.produto_id}</small>
                      </td>
                      <td>{item.quantidade}</td>
                      <td>{moeda(item.preco_unitario)}</td>
                      <td>
                        <strong>{moeda(item.subtotal)}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <aside className={styles.cardLateral}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.miniTag}>Entrega</span>
              <h2>Atualizar entrega</h2>
            </div>
          </div>

          <p className={styles.info}>
            Clique em uma ação para abrir o modal, adicionar o código de rastreio
            e enviar o e-mail ao cliente.
          </p>

          <div className={styles.actions}>
            <button
              disabled={salvando}
              onClick={() => abrirModalEntrega(16)}
              className={styles.btnAzul}
            >
              <FiTruck />
              Marcar como enviado
            </button>

            <button
              disabled={salvando}
              onClick={() => abrirModalEntrega(17)}
              className={styles.btnVerde}
            >
              <FiCheckCircle />
              Marcar como entregue
            </button>
          </div>
        </aside>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.miniTag}>Histórico</span>
            <h2>Linha do tempo</h2>
          </div>
        </div>

        <div className={styles.timeline}>
          {rastreamento.length === 0 ? (
            <p className={styles.info}>Nenhum rastreamento cadastrado.</p>
          ) : (
            rastreamento.map((r) => (
              <div key={r.id_rastreamento} className={styles.timelineItem}>
                <div className={styles.timelineIcon}>
                  <FiCalendar />
                </div>

                <div>
                  <strong>{nomeStatus(Number(r.status_id))}</strong>
                  <p>{r.descricao ?? "—"}</p>
                  <small>
                    {r.codigo_rastreio
                      ? `Rastreio: ${r.codigo_rastreio} • `
                      : ""}
                    {r.localizacao ?? "—"} • {data(r.criado_em)}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {modalEntrega && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setModalEntrega(false)}
            >
              ×
            </button>

            <span className={styles.miniTag}>
              {statusSelecionado === 16 ? "Enviar pedido" : "Entregar pedido"}
            </span>

            <h2>
              {statusSelecionado === 16
                ? "Adicionar código de rastreio"
                : "Confirmar entrega"}
            </h2>

            <p>
              Preencha as informações abaixo. Se a opção estiver marcada, o
              cliente receberá um e-mail automaticamente.
            </p>

            <div className={styles.formEntrega}>
              <label>
                <span>
                  <FiHash />
                  Código de rastreio
                </span>
                <input
                  type="text"
                  value={codigoRastreio}
                  onChange={(e) => setCodigoRastreio(e.target.value)}
                  placeholder="Ex: AB123456789BR"
                />
              </label>

              <label>
                <span>
                  <FiMapPin />
                  Localização
                </span>
                <input
                  type="text"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                  placeholder="Ex: São Paulo/SP"
                />
              </label>

              <label>
                <span>
                  <FiEdit3 />
                  Mensagem para o cliente
                </span>
                <textarea
                  value={descricaoEntrega}
                  onChange={(e) => setDescricaoEntrega(e.target.value)}
                  rows={4}
                />
              </label>

              <label className={styles.checkEmail}>
                <input
                  type="checkbox"
                  checked={enviarEmail}
                  onChange={(e) => setEnviarEmail(e.target.checked)}
                />
                <span>
                  <FiMail />
                  Enviar e-mail para o cliente
                </span>
              </label>
            </div>

            <button
              disabled={salvando}
              className={
                statusSelecionado === 16 ? styles.btnAzul : styles.btnVerde
              }
              onClick={() => atualizarEntrega(statusSelecionado)}
            >
              {statusSelecionado === 16 ? <FiTruck /> : <FiCheckCircle />}
              {salvando ? "Salvando..." : "Confirmar atualização"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}