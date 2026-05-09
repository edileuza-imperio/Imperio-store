"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast, ToastContainer } from "react-toastify";

import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import { InicioApi } from "@/services/api/api";

import {
  FiCopy,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiRefreshCw,
  FiCreditCard,
  FiSmartphone,
  FiUser,
  FiPackage,
  FiTruck,
  FiTag,
  FiShield,
} from "react-icons/fi";

import styles from "./pagamento.module.css";

type Pedido = {
  id_pedido?: number;
  valor_total?: number | string;
  valor_produtos?: number | string;
  valor_frete?: number | string;
  valor_desconto?: number | string;
  status_pagamento?: string;
  status?: string;
};

type Usuario = {
  id_usuario?: number;
  nome?: string;
  email?: string;
  cpf?: string;
};

type ApiPedidoResponse = {
  dados?: {
    pedido?: Pedido;
    usuario?: Usuario;
  };
  pedido?: Pedido;
  usuario?: Usuario;
};

type ApiPixResponse = {
  dados?: {
    pix?: {
      qr_code?: string;
    };
  };
  pix?: {
    qr_code?: string;
  };
};

type ApiVerificarPagamentoResponse = {
  dados?: {
    pedido?: Pedido;
  };
  pedido?: Pedido;
};

function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") return valor;

  if (typeof valor === "string") {
    return Number(valor.replace(/\./g, "").replace(",", "."));
  }

  return 0;
}

function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizarNumero(valor));
}

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const pedidoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);
  const [loadingCartao, setLoadingCartao] = useState(false);

  const [cartao, setCartao] = useState({
    numero: "",
    nome: "",
    mes: "",
    ano: "",
    cvv: "",
    parcelas: "1",
  });

  const statusPagamento = useMemo(() => {
    const status = String(
      pedido?.status_pagamento ?? pedido?.status ?? ""
    ).toLowerCase();

    if (
      status.includes("approved") ||
      status.includes("aprovado") ||
      status.includes("paid")
    ) {
      return "approved";
    }

    return "pending";
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

      const pedidoData =
        pedidoRes.data?.dados?.pedido ?? pedidoRes.data?.pedido ?? null;

      const usuarioData = meRes.data?.dados?.usuario ?? meRes.data?.usuario ?? null;

      setPedido(pedidoData);
      setUsuario(usuarioData);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }

  async function gerarPix() {
    try {
      setLoadingPix(true);

      const payload = {
        id_pedido: pedido?.id_pedido,
        usuario_id: usuario?.id_usuario,
        valor: normalizarNumero(pedido?.valor_total),
        email: usuario?.email,
        nome: usuario?.nome,
        cpf: usuario?.cpf?.replace(/\D/g, "") ?? "",
      };

      const res = await InicioApi.post<ApiPixResponse>(
        "/mercado/pagamento/pix",
        payload,
        {
          withCredentials: true,
        }
      );

      const qr = res.data?.dados?.pix?.qr_code ?? res.data?.pix?.qr_code ?? "";

      if (!qr) {
        toast.error("Erro ao gerar PIX");
        return;
      }

      setPixCode(qr);
      toast.success("PIX gerado com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PIX");
    } finally {
      setLoadingPix(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);
    setCopiado(true);
    toast.success("Código PIX copiado");

    setTimeout(() => {
      setCopiado(false);
    }, 1500);
  }

  async function verificarPagamento() {
    try {
      const res = await InicioApi.post<ApiVerificarPagamentoResponse>(
        "/mercado/pagamento/verificar",
        {
          id_pedido: Number(pedidoId),
        },
        {
          withCredentials: true,
        }
      );

      const pedidoAtualizado = res.data?.dados?.pedido ?? res.data?.pedido ?? null;

      if (pedidoAtualizado) {
        setPedido(pedidoAtualizado);
      }

      const status = String(
        pedidoAtualizado?.status_pagamento ?? pedidoAtualizado?.status ?? ""
      ).toLowerCase();

      if (status.includes("approved") || status.includes("aprovado")) {
        toast.success("Pagamento aprovado");

        setTimeout(() => {
          router.push("/Pedidos");
        }, 1500);
      } else {
        toast.info("Pagamento ainda pendente");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao verificar pagamento");
    }
  }

  async function pagarCartao() {
    try {
      setLoadingCartao(true);

      await InicioApi.post(
        "/mercado/pagamento/cartao",
        {
          id_pedido: pedido?.id_pedido,
          usuario_id: usuario?.id_usuario,
          valor: normalizarNumero(pedido?.valor_total),
          token: "TOKEN_AQUI",
          parcelas: Number(cartao.parcelas),
        },
        {
          withCredentials: true,
        }
      );

      toast.success("Pagamento enviado");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar cartão");
    } finally {
      setLoadingCartao(false);
    }
  }

  useEffect(() => {
    if (pedidoId) {
      carregarPedido();
    }
  }, [pedidoId]);

  if (loading) {
    return (
      <>
        <Navbar />

        <main className={styles.loadingPage}>
          <div className={styles.loadingCard}>
            <FiClock size={40} />

            <h2>Carregando pagamento</h2>

            <p>Aguarde um instante...</p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className={styles.checkout}>
        <div className={`${styles.bgBlur} ${styles.blur1}`} />
        <div className={`${styles.bgBlur} ${styles.blur2}`} />

        <div className={styles.topHero}>
          <div className={styles.heroTag}>
            <FiShield />
            Ambiente seguro
          </div>

          <h1>Finalizar pagamento</h1>

          <p>
            Experiência premium, rápida e elegante para concluir seu pedido.
          </p>
        </div>

        <div
          className={`${styles.statusBadge} ${
            statusPagamento === "approved" ? styles.ok : styles.pending
          }`}
        >
          {statusPagamento === "approved" ? "Pagamento aprovado" : "Aguardando pagamento"}
        </div>

        <div className={styles.layout}>
          <aside className={`${styles.glass} ${styles.leftSide}`}>
            <div className={styles.cardTitle}>
              <FiUser />
              Cliente
            </div>

            <div className={styles.userBox}>
              <div className={styles.avatar}>
                <Image
                  src="/images/sem-imagem.png"
                  alt="Usuário"
                  width={70}
                  height={70}
                />
              </div>

              <div className={styles.userData}>
                <strong>{usuario?.nome}</strong>
                <span>{usuario?.email}</span>
              </div>
            </div>

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.infoLeft}>
                  <FiPackage />
                  <span>Pedido</span>
                </div>

                <strong>#{pedido?.id_pedido}</strong>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoLeft}>
                  <FiTruck />
                  <span>Frete</span>
                </div>

                <strong>{formatarMoeda(pedido?.valor_frete)}</strong>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoLeft}>
                  <FiTag />
                  <span>Desconto</span>
                </div>

                <strong>- {formatarMoeda(pedido?.valor_desconto)}</strong>
              </div>
            </div>

            <div className={styles.totalBox}>
              <span>Total</span>
              <strong>{formatarMoeda(pedido?.valor_total)}</strong>
            </div>

            <Link href="/Carrinho" className={styles.backBtn}>
              <FiArrowLeft />
              Voltar ao carrinho
            </Link>
          </aside>

          <section className={`${styles.glass} ${styles.centerSide}`}>
            <div className={styles.pixHeader}>
              <div className={styles.pixIcon}>
                <FiSmartphone />
              </div>

              <div>
                <h2>PIX</h2>
                <p>Escaneie o QR Code ou copie o código.</p>
              </div>
            </div>

            {!pixCode ? (
              <button
                className={styles.primaryBtn}
                onClick={gerarPix}
                disabled={loadingPix}
              >
                {loadingPix ? "Gerando..." : "Gerar PIX"}
                <FiRefreshCw />
              </button>
            ) : (
              <>
                <div className={styles.qrWrapper}>
                  <div className={styles.qrCard}>
                    <QRCodeCanvas value={pixCode} size={250} />
                  </div>
                </div>

                <textarea className={styles.textarea} value={pixCode} readOnly />

                <div className={styles.pixActions}>
                  <button className={styles.softBtn} onClick={copiarPix}>
                    <FiCopy />
                    {copiado ? "Copiado" : "Copiar"}
                  </button>

                  <button className={styles.successBtn} onClick={verificarPagamento}>
                    <FiCheckCircle />
                    Já paguei
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className={`${styles.glass} ${styles.rightSide}`}>
            <div className={styles.cardTitle}>
              <FiCreditCard />
              Cartão
            </div>

            <div className={styles.field}>
              <span>Número do cartão</span>

              <input
                placeholder="0000 0000 0000 0000"
                value={cartao.numero}
                onChange={(e) =>
                  setCartao((prev) => ({
                    ...prev,
                    numero: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.field}>
              <span>Nome no cartão</span>

              <input
                placeholder="Nome completo"
                value={cartao.nome}
                onChange={(e) =>
                  setCartao((prev) => ({
                    ...prev,
                    nome: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.triple}>
              <div className={styles.field}>
                <span>Mês</span>

                <input
                  placeholder="MM"
                  value={cartao.mes}
                  onChange={(e) =>
                    setCartao((prev) => ({
                      ...prev,
                      mes: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.field}>
                <span>Ano</span>

                <input
                  placeholder="AA"
                  value={cartao.ano}
                  onChange={(e) =>
                    setCartao((prev) => ({
                      ...prev,
                      ano: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.field}>
                <span>CVV</span>

                <input
                  placeholder="123"
                  value={cartao.cvv}
                  onChange={(e) =>
                    setCartao((prev) => ({
                      ...prev,
                      cvv: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className={styles.field}>
              <span>Parcelas</span>

              <select
                value={cartao.parcelas}
                onChange={(e) =>
                  setCartao((prev) => ({
                    ...prev,
                    parcelas: e.target.value,
                  }))
                }
              >
                <option value="1">1x sem juros</option>
                <option value="2">2x</option>
                <option value="3">3x</option>
                <option value="4">4x</option>
              </select>
            </div>

            <button
              className={styles.primaryBtn}
              onClick={pagarCartao}
              disabled={loadingCartao}
            >
              {loadingCartao ? "Processando..." : "Pagar agora"}
              <FiCreditCard />
            </button>
          </aside>
        </div>

        <ToastContainer position="top-right" autoClose={1800} />
      </main>

      <Footer />
    </>
  );
}