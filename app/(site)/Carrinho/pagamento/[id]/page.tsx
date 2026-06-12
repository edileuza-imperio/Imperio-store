"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
type TipoCartao = "debito" | "credito";

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const [metodo, setMetodo] = useState<MetodoPagamento>("pix");
  const [tipoCartao, setTipoCartao] = useState<TipoCartao>("debito");
  const [redirecionando, setRedirecionando] = useState(false);

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

  const valorPedido = useMemo(() => {
    return Number(pedido?.valor_total ?? 0);
  }, [pedido]);

  const cardPaymentKey = useMemo(() => {
    return `${tipoCartao}-${pedido?.id_pedido ?? pedidoId ?? "pedido"}`;
  }, [tipoCartao, pedido?.id_pedido, pedidoId]);

  useEffect(() => {
    if (!statusPagamento.aprovado || !pedidoId || redirecionando) {
      return;
    }

    setRedirecionando(true);

    toast.dismiss();

    toast.success("Pagamento aprovado! Finalizando pedido...", {
      autoClose: 1500,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
    });

    router.refresh();

    const timer = setTimeout(() => {
      toast.dismiss();
      router.replace(`/pedido-confirmado/${pedidoId}`);
    }, 1500);

    return () => clearTimeout(timer);
  }, [statusPagamento.aprovado, pedidoId, router, redirecionando]);

  async function confirmarPagamento() {
    try {
      toast.dismiss();

      toast.info("Verificando pagamento...", {
        autoClose: 1200,
        closeOnClick: true,
        pauseOnHover: false,
      });

      await verificarPagamento();

      router.refresh();
    } catch (error) {
      console.error("ERRO AO VERIFICAR PAGAMENTO:", error);

      toast.dismiss();

      toast.error("Não foi possível verificar o pagamento agora.", {
        autoClose: 2500,
        closeOnClick: true,
        pauseOnHover: false,
      });
    }
  }

  function montarDadosCartao(formData: any) {
    const paymentTypeId =
      tipoCartao === "debito" ? "debit_card" : "credit_card";

    const installments =
      tipoCartao === "debito"
        ? 1
        : Number(formData?.installments ?? formData?.parcelas ?? 1);

    return {
      ...formData,
      payment_type_id: paymentTypeId,
      paymentTypeId,
      installments,
      parcelas: installments,
    };
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
      <ToastContainer
        autoClose={1500}
        closeOnClick
        pauseOnHover={false}
        newestOnTop
        limit={1}
      />

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
          {redirecionando ? "Pagamento aprovado" : statusPagamento.label}
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
              <strong>
                {statusPagamento.aprovado
                  ? "aprovado"
                  : pedido?.status_pagamento ?? "Pendente"}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <div>
                <FiTag />
                <span>Total</span>
              </div>
              <strong>{formatarMoeda(valorPedido)}</strong>
            </div>
          </div>

          <div className={styles.totalBox}>
            <span>Total geral</span>
            <strong>{formatarMoeda(valorPedido)}</strong>
          </div>

          {!statusPagamento.aprovado && !redirecionando && (
            <Link href="/carrinho" className={styles.backBtn}>
              <FiArrowLeft />
              Voltar ao carrinho
            </Link>
          )}
        </aside>

        <section className={`${styles.card} ${styles.paymentCard}`}>
          {redirecionando ? (
            <div className={styles.paymentPanel}>
              <div className={styles.pixHeader}>
                <div className={styles.pixIcon}>
                  <FiCheckCircle />
                </div>

                <h2>Pagamento aprovado!</h2>

                <p>
                  Estamos finalizando seu pedido, limpando o carrinho e
                  carregando a página de confirmação.
                </p>
              </div>

              <button type="button" disabled className={styles.successBtn}>
                <FiRefreshCw className={styles.spin} />
                Finalizando pedido...
              </button>
            </div>
          ) : (
            <>
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
                      <FiRefreshCw
                        className={loadingPix ? styles.spin : ""}
                      />
                      {loadingPix
                        ? "Preparando pagamento..."
                        : "Gerar QR Code PIX"}
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
                      Escolha crédito ou débito. No débito, o pagamento será
                      enviado em 1x.
                    </p>
                  </div>

                  <div className={styles.paymentTabs}>
                    <button
                      type="button"
                      onClick={() => setTipoCartao("debito")}
                      className={`${styles.paymentTab} ${
                        tipoCartao === "debito" ? styles.activeTab : ""
                      }`}
                    >
                      <FiCreditCard />
                      Débito
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoCartao("credito")}
                      className={`${styles.paymentTab} ${
                        tipoCartao === "credito" ? styles.activeTab : ""
                      }`}
                    >
                      <FiCreditCard />
                      Crédito
                    </button>
                  </div>

                  <div className={styles.statusBox}>
                    <span>
                      {tipoCartao === "debito"
                        ? "Cartão de débito"
                        : "Cartão de crédito"}
                    </span>

                    <strong>
                      {tipoCartao === "debito"
                        ? "Débito será enviado sem parcelamento."
                        : "Crédito pode parcelar conforme liberação do Mercado Pago."}
                    </strong>
                  </div>

                  {loadingCartao ? (
                    <button
                      type="button"
                      disabled
                      className={styles.primaryBtn}
                    >
                      <FiRefreshCw className={styles.spin} />
                      Processando cartão...
                    </button>
                  ) : (
                    <div className={styles.mpWrapper}>
                      <CardPayment
                        key={cardPaymentKey}
                        initialization={{
                          amount: valorPedido,
                          payer: {
                            email: usuario?.email ?? "",
                          },
                        }}
                        customization={{
                          paymentMethods: {
                            minInstallments: 1,
                            maxInstallments:
                              tipoCartao === "debito" ? 1 : 3,
                          },
                        }}
                        onSubmit={async (formData) => {
                          try {
                            toast.dismiss();

                            toast.info("Processando pagamento...", {
                              autoClose: 1500,
                              closeOnClick: true,
                              pauseOnHover: false,
                            });

                            const dadosCartao = montarDadosCartao(formData);

                            console.log(
                              "FORM MERCADO PAGO ORIGINAL:",
                              formData
                            );

                            console.log(
                              "FORM MERCADO PAGO ENVIADO:",
                              dadosCartao
                            );

                            await pagarComCartao(dadosCartao);

                            router.refresh();
                          } catch (error) {
                            console.error(
                              "ERRO AO PAGAR COM CARTAO:",
                              error
                            );

                            toast.dismiss();

                            toast.error(
                              "Não foi possível concluir o pagamento com cartão.",
                              {
                                autoClose: 2500,
                                closeOnClick: true,
                                pauseOnHover: false,
                              }
                            );
                          }
                        }}
                        onError={(error) => {
                          console.error("ERRO MERCADO PAGO CARD:", error);

                          toast.dismiss();

                          toast.error(
                            "Não foi possível obter os dados do cartão. Confira os dados ou tente PIX.",
                            {
                              autoClose: 2500,
                              closeOnClick: true,
                              pauseOnHover: false,
                            }
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
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

              <strong>
                {metodo === "pix"
                  ? "PIX"
                  : tipoCartao === "debito"
                  ? "Cartão de débito"
                  : "Cartão de crédito"}
              </strong>
            </div>
          </div>

          <div className={styles.statusBox}>
            <span>Status atual</span>

            <strong>
              {redirecionando
                ? "Pagamento aprovado. Finalizando pedido..."
                : statusPagamento.descricao}
            </strong>
          </div>
        </aside>
      </section>
    </main>
  );
}