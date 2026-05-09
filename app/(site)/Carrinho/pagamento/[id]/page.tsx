"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast, ToastContainer } from "react-toastify";

import { InicioApi } from "@/services/api/api";

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

import {
  ApiPedidoResponse,
  ApiPixResponse,
  ApiVerificarPagamentoResponse,
  formatarMoeda,
  Pedido,
  Usuario,
} from "@/components/Bibioteca/carrinho";

import styles from "./Pagamento.module.css";

type StatusPagamento = {
  label: string;
  className: string;
  descricao: string;
};

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const pedidoId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [loading, setLoading] = useState(true);
  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);

  const statusPagamento = useMemo<StatusPagamento>(() => {
    const status = String(
      pedido?.status_pagamento ?? pedido?.status ?? ""
    ).toLowerCase();

    if (
      status.includes("approved") ||
      status.includes("aprovado") ||
      status.includes("paid") ||
      status.includes("pago")
    ) {
      return {
        label: "Pagamento aprovado",
        className: styles.ok,
        descricao: "Seu pagamento foi confirmado.",
      };
    }

    return {
      label: "Pagamento pendente",
      className: styles.pending,
      descricao: "Aguardando confirmação do pagamento.",
    };
  }, [pedido]);

  async function carregarPedido() {
    try {
      setLoading(true);

      const [pedidoRes, meRes] = await Promise.all([
        InicioApi.get<ApiPedidoResponse>(`/pedido/${pedidoId}`, {
          withCredentials: true,
        }),

        InicioApi.get<ApiPedidoResponse>("/me", {
          withCredentials: true,
        }),
      ]);

      const pedidoAtual: Pedido | null =
        pedidoRes.data?.dados?.pedido ??
        pedidoRes.data?.pedido ??
        null;

      const usuarioAtual: Usuario | null =
        meRes.data?.dados?.usuario ??
        meRes.data?.usuario ??
        null;

      setPedido(pedidoAtual);
      setUsuario(usuarioAtual);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pedidoId) carregarPedido();
  }, [pedidoId]);

  async function gerarPix() {
    try {
      if (!pedido || !usuario) {
        toast.warning("Dados ainda carregando");
        return;
      }

      const payload = {
        id_pedido: Number(pedido.id_pedido),
        usuario_id: Number(usuario.id_usuario),
        valor: Number(pedido.valor_total ?? 0),
        email: usuario.email,
        nome: usuario.nome,
        cpf: String(usuario.cpf ?? "").replace(/\D/g, ""),
      };

      setLoadingPix(true);

      const res = await InicioApi.post<ApiPixResponse>(
        "/mercado/pagamento/pix",
        payload,
        { withCredentials: true }
      );

      const qr =
        res.data?.dados?.pix?.qr_code ??
        res.data?.pix?.qr_code ??
        "";

      if (!qr) {
        toast.error("PIX inválido");
        return;
      }

      setPixCode(qr);

      toast.success("PIX gerado com sucesso");
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Erro ao gerar PIX"
      );
    } finally {
      setLoadingPix(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);

    setCopiado(true);

    toast.success("Código copiado");

    setTimeout(() => {
      setCopiado(false);
    }, 1600);
  }

  async function verificarPagamento() {
    try {
      const res =
        await InicioApi.post<ApiVerificarPagamentoResponse>(
          "/mercado/pagamento/verificar",
          {
            id_pedido: Number(pedidoId),
          },
          {
            withCredentials: true,
          }
        );

      const pedidoAtual: Pedido | null =
        res.data?.dados?.pedido ??
        res.data?.pedido ??
        null;

      setPedido(pedidoAtual);

      const status = String(
        pedidoAtual?.status_pagamento ??
          pedidoAtual?.status ??
          ""
      ).toLowerCase();

      if (
        status.includes("approved") ||
        status.includes("aprovado") ||
        status.includes("paid")
      ) {
        toast.success("Pagamento confirmado!");

        router.push("/Pedidos");
      } else {
        toast.info("Pagamento ainda pendente");
      }
    } catch (err) {
      console.error(err);

      toast.error("Erro ao verificar pagamento");
    }
  }

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <FiClock size={42} />

          <h2>Carregando pagamento...</h2>

          <p>
            Estamos preparando os dados do seu pedido.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.checkout}>
      <ToastContainer />

      <div
        className={`${styles.bgBlur} ${styles.blur1}`}
      />

      <div
        className={`${styles.bgBlur} ${styles.blur2}`}
      />

      <section className={styles.topHero}>
        <div className={styles.heroTag}>
          <FiShield />
          Ambiente seguro e criptografado
        </div>

        <h1>Pagamento via PIX</h1>

        <p>
          Finalize seu pedido em segundos usando PIX
          com aprovação rápida e segura.
        </p>
      </section>

      <div
        className={`${styles.statusBadge} ${statusPagamento.className}`}
      >
        {statusPagamento.label}
      </div>

      <section className={styles.layout}>
        <aside className={styles.glass}>
          <div className={styles.cardTitle}>
            <FiUser />
            Dados do cliente
          </div>

          <div className={styles.userBox}>
            <div className={styles.avatar}>
              <img
                src="/img/user.png"
                alt="Usuário"
                width="70"
                height="70"
              />
            </div>

            <div className={styles.userData}>
              <strong>
                {usuario?.nome ?? "Cliente"}
              </strong>

              <span>
                {usuario?.email ??
                  "email@email.com"}
              </span>
            </div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <FiPackage />
                <span>Pedido</span>
              </div>

              <strong>
                #{pedido?.id_pedido ?? pedidoId}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <FiTruck />
                <span>Status</span>
              </div>

              <strong>
                {pedido?.status_pagamento ??
                  "Pendente"}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <FiTag />
                <span>Total</span>
              </div>

              <strong>
                {formatarMoeda(
                  Number(
                    pedido?.valor_total ?? 0
                  )
                )}
              </strong>
            </div>
          </div>

          <div className={styles.totalBox}>
            <span>Total geral</span>

            <strong>
              {formatarMoeda(
                Number(pedido?.valor_total ?? 0)
              )}
            </strong>
          </div>

          <Link
            href="/Carrinho"
            className={styles.backBtn}
          >
            <FiArrowLeft />
            Voltar ao carrinho
          </Link>
        </aside>

        <section
          className={`${styles.glass} ${styles.centerSide}`}
        >
          <div className={styles.pixHeader}>
            <div className={styles.pixIcon}>
              <FiSmartphone />
            </div>

            <h2>PIX Instantâneo</h2>

            <p>
              Escaneie o QR Code ou copie o código
              PIX.
            </p>
          </div>

          {!pixCode ? (
            <button
              onClick={gerarPix}
              disabled={loadingPix}
              className={styles.primaryBtn}
            >
              <FiRefreshCw />
              {loadingPix
                ? "Gerando PIX..."
                : "Gerar PIX"}
            </button>
          ) : (
            <>
              <div className={styles.qrWrapper}>
                <div className={styles.qrCard}>
                  <QRCodeCanvas
                    value={pixCode}
                    size={240}
                  />
                </div>
              </div>

              <textarea
                className={styles.textarea}
                value={pixCode}
                readOnly
              />

              <div className={styles.pixActions}>
                <button
                  onClick={copiarPix}
                  className={styles.softBtn}
                >
                  <FiCopy />
                  {copiado
                    ? "Copiado"
                    : "Copiar PIX"}
                </button>

                <button
                  onClick={verificarPagamento}
                  className={styles.successBtn}
                >
                  <FiCheckCircle />
                  Já paguei
                </button>
              </div>
            </>
          )}
        </section>

        <aside className={styles.glass}>
          <div className={styles.cardTitle}>
            <FiCreditCard />
            Informações
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <FiShield />
                <span>Segurança</span>
              </div>

              <strong>100% Seguro</strong>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <FiClock />
                <span>Aprovação</span>
              </div>

              <strong>Instantânea</strong>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <FiSmartphone />
                <span>Pagamento</span>
              </div>

              <strong>PIX QR Code</strong>
            </div>
          </div>

          <div className={styles.totalBox}>
            <span>Status atual</span>

            <strong
              style={{
                fontSize: 18,
              }}
            >
              {statusPagamento.descricao}
            </strong>
          </div>
        </aside>
      </section>
    </main>
  );
}