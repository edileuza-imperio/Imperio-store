"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Package,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
  ShieldCheck,
} from "lucide-react";

import api from "@/Api/conectar";
import styles from "./PedidoDetalhe.module.css";

type Pedido = {
  id_pedido?: number;
  valor_produtos?: number | string;
  valor_desconto?: number | string;
  valor_frete?: number | string;
  valor_total?: number | string;
  metodo_pagamento?: string | null;
  status_pagamento?: string | null;
  status_detail?: string | null;
  data_aprovacao?: string | null;
  criado_em?: string;
};

type ItemPedido = {
  id_pedido_item?: number;
  produto_id?: number;
  quantidade?: number | string;
  preco_unitario?: number | string;
  preco_promocional_unitario?: number | string | null;
  subtotal?: number | string;
  produto_nome?: string;
  nome?: string;
  produto_imagem?: string | null;
  imagem?: string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.universoimperio.com.br";

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

  const dt = new Date(data.replace(" ", "T"));

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

function isProblema(status?: string | null): boolean {
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

function statusTexto(status?: string | null): string {
  const valor = normalizarStatus(status);

  if (valor === "approved" || valor === "aprovado") return "Aprovado";
  if (valor === "pending" || valor === "pendente") return "Pendente";
  if (valor === "in_process") return "Em análise";
  if (valor === "rejected" || valor === "recusado") return "Recusado";
  if (valor === "cancelled" || valor === "cancelado") return "Cancelado";
  if (valor === "refunded" || valor === "reembolsado") return "Reembolsado";

  return status || "Pendente";
}

function statusClass(status?: string | null): string {
  const valor = normalizarStatus(status);

  if (valor === "approved" || valor === "aprovado") return styles.aprovado;
  if (valor === "in_process") return styles.analise;
  if (valor === "rejected" || valor === "recusado") return styles.recusado;
  if (valor === "cancelled" || valor === "cancelado") return styles.cancelado;
  if (valor === "refunded" || valor === "reembolsado") return styles.reembolsado;

  return styles.pendente;
}

function metodoTexto(metodo?: string | null): string {
  const valor = String(metodo || "").toLowerCase();

  if (valor === "pix") return "PIX";
  if (valor.includes("credit")) return "Cartão de crédito";
  if (valor.includes("debit")) return "Cartão de débito";

  return metodo || "Cartão/PIX";
}

function resolverImagem(imagem?: string | null): string | null {
  if (!imagem) return null;

  if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
    return imagem;
  }

  if (imagem.startsWith("/")) {
    return `${API_URL}${imagem}`;
  }

  return `${API_URL}/${imagem}`;
}

export default function PedidoDetalhePage() {
  const params = useParams();

  const pedidoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarPedido() {
    try {
      setLoading(true);
      setErro("");

      const response = await api.get(`/pedido/${pedidoId}/com-itens`, {
        withCredentials: true,
      });

      setPedido(response.data?.dados?.pedido ?? response.data?.pedido ?? null);
      setItens(response.data?.dados?.itens ?? response.data?.itens ?? []);
    } catch (error: any) {
      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          error?.message ||
          "Não foi possível carregar o pedido."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pedidoId) {
      carregarPedido();
    }
  }, [pedidoId]);

  const codigoPedido = useMemo(() => {
    return `PED-${String(pedido?.id_pedido ?? pedidoId ?? 0).padStart(
      5,
      "0"
    )}`;
  }, [pedido?.id_pedido, pedidoId]);

  const aprovado = isAprovado(pedido?.status_pagamento);
  const problema = isProblema(pedido?.status_pagamento);

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.estado}>
          <div className={styles.loader} />
          <h2>Carregando pedido...</h2>
          <p>Buscando os detalhes da sua compra.</p>
        </section>
      </main>
    );
  }

  if (erro || !pedido) {
    return (
      <main className={styles.page}>
        <section className={styles.estado}>
          <XCircle size={44} />
          <h2>Pedido não encontrado</h2>
          <p>{erro || "Não encontramos esse pedido."}</p>

          <Link href="/pedidos" className={styles.botaoPrimario}>
            <ArrowLeft size={18} />
            Voltar para pedidos
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Link href="/pedidos" className={styles.voltar}>
          <ArrowLeft size={18} />
          Voltar para pedidos
        </Link>

        <div className={styles.heroContent}>
          <div>
            <span className={styles.tag}>Detalhes do pedido</span>
            <h1>{codigoPedido}</h1>
            <p>
              Acompanhe o pagamento, os produtos comprados e a próxima etapa da
              entrega.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarPedido}
            className={styles.atualizar}
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>
      </section>

      <section className={styles.gridTopo}>
        <article className={styles.cardInfo}>
          <ReceiptText />
          <span>Pedido</span>
          <strong>#{pedido.id_pedido}</strong>
        </article>

        <article className={styles.cardInfo}>
          <CreditCard />
          <span>Pagamento</span>
          <strong>{metodoTexto(pedido.metodo_pagamento)}</strong>
        </article>

        <article className={styles.cardInfo}>
          <CalendarDays />
          <span>Criado em</span>
          <strong>{formatarData(pedido.criado_em)}</strong>
        </article>

        <article className={`${styles.cardInfo} ${styles.cardTotal}`}>
          <ShoppingBag />
          <span>Total</span>
          <strong>{formatarMoeda(toNumber(pedido.valor_total))}</strong>
        </article>
      </section>

      <section className={styles.cardPrincipal}>
        <div className={styles.tituloLinha}>
          <div>
            <span className={styles.miniTag}>Acompanhamento</span>
            <h2>Etapas do pedido</h2>
          </div>

          <span
            className={`${styles.status} ${statusClass(
              pedido.status_pagamento
            )}`}
          >
            {statusTexto(pedido.status_pagamento)}
          </span>
        </div>

        <div className={styles.etapasGrid}>
          <div className={`${styles.etapaCard} ${styles.etapaOk}`}>
            <div className={styles.etapaTopo}>
              <span>
                <ReceiptText size={20} />
              </span>
              <strong>1</strong>
            </div>

            <h3>Pedido feito</h3>
            <p>{formatarData(pedido.criado_em)}</p>
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
              <span>
                {aprovado ? (
                  <CheckCircle2 size={20} />
                ) : problema ? (
                  <XCircle size={20} />
                ) : (
                  <Clock3 size={20} />
                )}
              </span>
              <strong>2</strong>
            </div>

            <h3>{statusTexto(pedido.status_pagamento)}</h3>
            <p>
              {pedido.status_detail || "Aguardando atualização do pagamento"}
            </p>
          </div>

          <div
            className={`${styles.etapaCard} ${
              aprovado ? styles.etapaAtual : styles.etapaPendente
            }`}
          >
            <div className={styles.etapaTopo}>
              <span>
                <Truck size={20} />
              </span>
              <strong>3</strong>
            </div>

            <h3>{aprovado ? "Preparando envio" : "Envio"}</h3>
            <p>
              {aprovado
                ? "Seu pedido será separado para entrega."
                : "Liberado após confirmação do pagamento."}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.conteudoGrid}>
        <article className={styles.cardPrincipal}>
          <div className={styles.tituloLinha}>
            <div>
              <span className={styles.miniTag}>Produtos</span>
              <h2>Itens comprados</h2>
            </div>

            <span className={styles.contador}>{itens.length} item(ns)</span>
          </div>

          <div className={styles.listaItens}>
            {itens.map((item) => {
              const imagem = resolverImagem(item.produto_imagem || item.imagem);
              const nome =
                item.produto_nome || item.nome || `Produto #${item.produto_id}`;
              const quantidade = toNumber(item.quantidade);
              const preco = toNumber(
                item.preco_promocional_unitario ?? item.preco_unitario
              );
              const subtotal = toNumber(item.subtotal);

              return (
                <div key={item.id_pedido_item} className={styles.item}>
                  <div className={styles.imagemBox}>
                    {imagem ? (
                      <img src={imagem} alt={nome} />
                    ) : (
                      <Package size={24} />
                    )}
                  </div>

                  <div className={styles.itemInfo}>
                    <strong>{nome}</strong>
                    <span>Produto #{item.produto_id}</span>
                  </div>

                  <div className={styles.itemQtd}>
                    <span>Qtd</span>
                    <strong>{quantidade}</strong>
                  </div>

                  <div className={styles.itemValor}>
                    <span>Unitário</span>
                    <strong>{formatarMoeda(preco)}</strong>
                  </div>

                  <div className={styles.itemValor}>
                    <span>Subtotal</span>
                    <strong>{formatarMoeda(subtotal)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <aside className={styles.cardResumo}>
          <div className={styles.resumoHeader}>
            <h2>Resumo do Pedido</h2>

            <span className={styles.resumoBadge}>
              {statusTexto(pedido.status_pagamento)}
            </span>
          </div>

          <div className={styles.linhaResumo}>
            <span>Produtos</span>
            <strong>{formatarMoeda(toNumber(pedido.valor_produtos))}</strong>
          </div>

          <div className={styles.linhaResumo}>
            <span>Desconto</span>
            <strong>{formatarMoeda(toNumber(pedido.valor_desconto))}</strong>
          </div>

          <div className={styles.linhaResumo}>
            <span>Frete</span>
            <strong>{formatarMoeda(toNumber(pedido.valor_frete))}</strong>
          </div>

          <div className={styles.linhaResumo}>
            <span>Forma de pagamento</span>
            <strong>{metodoTexto(pedido.metodo_pagamento)}</strong>
          </div>

          {pedido.data_aprovacao && (
            <div className={styles.linhaResumo}>
              <span>Pagamento aprovado em</span>
              <strong>{formatarData(pedido.data_aprovacao)}</strong>
            </div>
          )}

          <div className={styles.totalResumo}>
            <span>Total Pago</span>
            <strong>{formatarMoeda(toNumber(pedido.valor_total))}</strong>
          </div>

          <div className={styles.avisoCompra}>
            <ShieldCheck size={18} />
            <span>Compra processada com segurança pelo Mercado Pago.</span>
          </div>
        </aside>
      </section>
    </main>
  );
}