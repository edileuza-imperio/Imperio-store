"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { ToastContainer, toast } from "react-toastify";
import { CardPayment } from "@mercadopago/sdk-react";

import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiCreditCard,
  FiPackage,
  FiRefreshCw,
  FiShield,
  FiSmartphone,
  FiTag,
  FiTruck,
  FiUser,
} from "react-icons/fi";

import { formatarMoeda } from "@/components/Bibioteca/carrinho";
import { usePagamento } from "./usePagamento";
import styles from "./pagamento.module.css";

type MetodoPagamento = "pix" | "cartao";

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const [metodo, setMetodo] = useState<MetodoPagamento>("pix");

  const pedidoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const {
    pedido,
    usuario,
    loading,
    pixCode,
    copiado,
    loadingPix,
    loadingCartao,
    statusPagamento,
    gerarPix,
    copiarPix,
    verificarPagamento,
    pagarComCartao,
  } = usePagamento({
    pedidoId: String(pedidoId ?? ""),
  });

  useEffect(() => {
    if (statusPagamento.aprovado && pedidoId) {
      router.push(`/pedido-confirmado/${pedidoId}`);
    }
  }, [statusPagamento.aprovado, pedidoId, router]);

  async function confirmarPagamento() {
    await verificarPagamento();
  }

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <FiClock />
          <h2>Carregando pagamento...</h2>
          <p>Estamos preparando os dados do seu pedido.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.checkout}>
      <ToastContainer />

      <div className={`${styles.bgBlur} ${styles.blur1}`} />
      <div className={`${styles.bgBlur} ${styles.blur2}`} />

      <section className={styles.hero}>
        <div className={styles.heroTag}>
          <FiShield />
          Ambiente seguro e criptografado
        </div>

        <h1>Finalize seu pagamento</h1>

        <p>
          Escolha a melhor forma de pagamento para concluir seu pedido com
          segurança.
        </p>

        <div
          className={`${styles.statusBadge} ${
            statusPagamento.aprovado ? styles.ok : styles.pending
          }`}
        >
          {statusPagamento.label}
        </div>
      </section>

      <section className={styles.layout}>
        <aside className={styles.card}>
          <div className={styles.cardTitle}>
            <FiUser />
            <span>Dados do cliente</span>
          </div>

          <div className={styles.userBox}>
            <div className={styles.avatar}>
              {(usuario?.nome ?? "C").charAt(0).toUpperCase()}
            </div>

            <div className={styles.userData}>
              <strong>{usuario?.nome ?? "Cliente"}</strong>
              <span>{usuario?.email ?? "email@email.com"}</span>
            </div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <div>
                <FiPackage />
                <span>Pedido</span>
              </div>
              <strong>#{pedido?.id_pedido ?? pedidoId}</strong>
            </div>

            <div className={styles.infoItem}>
              <div>
                <FiTruck />
                <span>Status</span>
              </div>
              <strong>{pedido?.status_pagamento ?? "Pendente"}</strong>
            </div>

            <div className={styles.infoItem}>
              <div>
                <FiTag />
                <span>Total</span>
              </div>
              <strong>
                {formatarMoeda(Number(pedido?.valor_total ?? 0))}
              </strong>
            </div>
          </div>

          <div className={styles.totalBox}>
            <span>Total geral</span>
            <strong>{formatarMoeda(Number(pedido?.valor_total ?? 0))}</strong>
          </div>

          <Link href="/carrinho" className={styles.backBtn}>
            <FiArrowLeft />
            Voltar ao carrinho
          </Link>
        </aside>

        <section className={`${styles.card} ${styles.paymentCard}`}>
          <div className={styles.paymentTabs}>
            <button
              type="button"
              onClick={() => setMetodo("pix")}
              className={`${styles.paymentTab} ${
                metodo === "pix" ? styles.activeTab : ""
              }`}
            >
              <FiSmartphone />
              PIX
            </button>

            <button
              type="button"
              onClick={() => setMetodo("cartao")}
              className={`${styles.paymentTab} ${
                metodo === "cartao" ? styles.activeTab : ""
              }`}
            >
              <FiCreditCard />
              Cartão
            </button>
          </div>

          {metodo === "pix" && (
            <div className={styles.paymentPanel}>
              <div className={styles.pixHeader}>
                <div className={styles.pixIcon}>
                  <FiSmartphone />
                </div>

                <h2>PIX Instantâneo</h2>

                <p>Escaneie o QR Code ou copie o código PIX abaixo.</p>
              </div>

              {!pixCode ? (
                <button
                  type="button"
                  onClick={gerarPix}
                  disabled={loadingPix}
                  className={styles.primaryBtn}
                >
                  <FiRefreshCw className={loadingPix ? styles.spin : ""} />
                  {loadingPix ? "Preparando pagamento..." : "Gerar QR Code PIX"}
                </button>
              ) : (
                <div className={styles.pixContent}>
                  <div className={styles.qrWrapper}>
                    <div className={styles.qrCard}>
                      <QRCodeCanvas value={pixCode} size={220} />
                    </div>
                  </div>

                  <textarea
                    className={styles.textarea}
                    value={pixCode}
                    readOnly
                  />

                  <div className={styles.pixActions}>
                    <button
                      type="button"
                      onClick={copiarPix}
                      className={styles.softBtn}
                    >
                      <FiCopy />
                      {copiado ? "Copiado" : "Copiar PIX"}
                    </button>

                    <button
                      type="button"
                      onClick={confirmarPagamento}
                      className={styles.successBtn}
                    >
                      <FiCheckCircle />
                      Já paguei
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {metodo === "cartao" && (
            <div className={styles.paymentPanel}>
              <div className={styles.pixHeader}>
                <div className={styles.pixIcon}>
                  <FiCreditCard />
                </div>

                <h2>Pagamento com cartão</h2>

                <p>
                  Preencha todos os dados do cartão. O CPF e o e-mail são
                  obrigatórios.
                </p>
              </div>

              {loadingCartao ? (
                <button type="button" disabled className={styles.primaryBtn}>
                  <FiRefreshCw className={styles.spin} />
                  Processando cartão...
                </button>
              ) : (
                <CardPayment
                  initialization={{
                    amount: Number(pedido?.valor_total ?? 0),
                    payer: {
                      email: usuario?.email ?? "",
                    },
                  }}
                  customization={{
                    paymentMethods: {
                      maxInstallments: 3,
                    },
                  }}
                  onSubmit={async (formData) => {
                    await pagarComCartao(formData);
                  }}
                  onError={(error) => {
                    console.error(error);

                    toast.error(
                      "Não foi possível processar o pagamento com cartão. Tente outro cartão ou use PIX."
                    );
                  }}
                />
              )}
            </div>
          )}
        </section>

        <aside className={styles.card}>
          <div className={styles.cardTitle}>
            <FiCreditCard />
            <span>Resumo seguro</span>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <div>
                <FiShield />
                <span>Segurança</span>
              </div>
              <strong>100% Seguro</strong>
            </div>

            <div className={styles.infoItem}>
              <div>
                <FiClock />
                <span>Aprovação</span>
              </div>
              <strong>{metodo === "pix" ? "Instantânea" : "Rápida"}</strong>
            </div>

            <div className={styles.infoItem}>
              <div>
                <FiSmartphone />
                <span>Método</span>
              </div>
              <strong>{metodo === "pix" ? "PIX" : "Cartão"}</strong>
            </div>
          </div>

          <div className={styles.statusBox}>
            <span>Status atual</span>
            <strong>{statusPagamento.descricao}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}