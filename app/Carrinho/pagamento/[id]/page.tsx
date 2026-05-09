"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast, ToastContainer } from "react-toastify";
import { initMercadoPago } from "@mercadopago/sdk-react";

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

const CardPayment = dynamic(
  () => import("@mercadopago/sdk-react").then((mod) => mod.CardPayment),
  { ssr: false }
);

const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

if (mpPublicKey) {
  initMercadoPago(mpPublicKey, { locale: "pt-BR" });
}

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

  const valorTotal = useMemo(() => {
    return normalizarNumero(pedido?.valor_total);
  }, [pedido?.valor_total]);

  const statusPagamento = useMemo(() => {
    const status = String(pedido?.status_pagamento ?? pedido?.status ?? "").toLowerCase();

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
        pedidoRes.data?.dados?.pedido ??
        pedidoRes.data?.pedido ??
        null;

      const usuarioData =
        meRes.data?.dados?.usuario ??
        meRes.data?.usuario ??
        null;

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

      const qr =
        res.data?.dados?.pix?.qr_code ??
        res.data?.pix?.qr_code ??
        "";

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

      const pedidoAtualizado =
        res.data?.dados?.pedido ??
        res.data?.pedido ??
        null;

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

  async function pagarCartao(formData: any, additionalData: any) {
    try {
      setLoadingCartao(true);

      const paymentMethodId =
        formData?.payment_method_id ??
        formData?.paymentMethodId ??
        additionalData?.paymentTypeId ??
        null;

      const payload = {
        id_pedido: pedido?.id_pedido,
        usuario_id: usuario?.id_usuario,
        valor: normalizarNumero(pedido?.valor_total),

        token: formData?.token ?? null,
        payment_method_id: paymentMethodId,
        issuer_id: formData?.issuer_id ?? formData?.issuerId ?? null,
        parcelas: Number(formData?.installments ?? 1),
        transaction_amount: Number(
          formData?.transaction_amount ?? formData?.transactionAmount ?? valorTotal
        ),

        payer: {
          email: usuario?.email ?? formData?.payer?.email ?? null,
          identification: formData?.payer?.identification ?? null,
        },
      };

      await InicioApi.post(
        "/mercado/pagamento/cartao",
        payload,
        {
          withCredentials: true,
        }
      );

      toast.success("Pagamento enviado");
      setTimeout(() => {
        router.push("/Pedidos");
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar cartão");
      throw err;
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

        <main className="loadingPage">
          <div className="loadingCard">
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

      <main className="checkout">
        <div className="bgBlur blur1" />
        <div className="bgBlur blur2" />

        <div className="topHero">
          <div className="heroTag">
            <FiShield />
            Ambiente seguro
          </div>

          <h1>Finalizar pagamento</h1>

          <p>
            Experiência premium, rápida e elegante para concluir seu pedido.
          </p>
        </div>

        <div
          className={`statusBadge ${
            statusPagamento === "approved" ? "ok" : "pending"
          }`}
        >
          {statusPagamento === "approved"
            ? "Pagamento aprovado"
            : "Aguardando pagamento"}
        </div>

        <div className="layout">
          <aside className="glass leftSide">
            <div className="cardTitle">
              <FiUser />
              Cliente
            </div>

            <div className="userBox">
              <div className="avatar">
                <Image
                  src="/images/sem-imagem.png"
                  alt="Usuário"
                  width={70}
                  height={70}
                />
              </div>

              <div className="userData">
                <strong>{usuario?.nome}</strong>
                <span>{usuario?.email}</span>
              </div>
            </div>

            <div className="infoList">
              <div className="infoItem">
                <div className="infoLeft">
                  <FiPackage />
                  <span>Pedido</span>
                </div>

                <strong>#{pedido?.id_pedido}</strong>
              </div>

              <div className="infoItem">
                <div className="infoLeft">
                  <FiTruck />
                  <span>Frete</span>
                </div>

                <strong>{formatarMoeda(pedido?.valor_frete)}</strong>
              </div>

              <div className="infoItem">
                <div className="infoLeft">
                  <FiTag />
                  <span>Desconto</span>
                </div>

                <strong>- {formatarMoeda(pedido?.valor_desconto)}</strong>
              </div>
            </div>

            <div className="totalBox">
              <span>Total</span>

              <strong>{formatarMoeda(pedido?.valor_total)}</strong>
            </div>

            <Link href="/Carrinho" className="backBtn">
              <FiArrowLeft />
              Voltar ao carrinho
            </Link>
          </aside>

          <section className="glass centerSide">
            <div className="pixHeader">
              <div className="pixIcon">
                <FiSmartphone />
              </div>

              <div>
                <h2>PIX</h2>
                <p>Escaneie o QR Code ou copie o código.</p>
              </div>
            </div>

            {!pixCode ? (
              <button
                className="primaryBtn"
                onClick={gerarPix}
                disabled={loadingPix}
              >
                {loadingPix ? "Gerando..." : "Gerar PIX"}
                <FiRefreshCw />
              </button>
            ) : (
              <>
                <div className="qrWrapper">
                  <div className="qrCard">
                    <QRCodeCanvas value={pixCode} size={250} />
                  </div>
                </div>

                <textarea value={pixCode} readOnly />

                <div className="pixActions">
                  <button className="softBtn" onClick={copiarPix}>
                    <FiCopy />
                    {copiado ? "Copiado" : "Copiar"}
                  </button>

                  <button className="successBtn" onClick={verificarPagamento}>
                    <FiCheckCircle />
                    Já paguei
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="glass rightSide">
            <div className="cardTitle">
              <FiCreditCard />
              Cartão
            </div>

            <div className="mpSummary">
              <strong>{formatarMoeda(pedido?.valor_total)}</strong>
              <span>Pagamento seguro com campos do Mercado Pago</span>
            </div>

            {valorTotal > 0 ? (
              <div className="mpCardWrap">
                <CardPayment
                  initialization={{
                    amount: valorTotal,
                  }}
                  onSubmit={async (param: any, additionalData: any) => {
                    await pagarCartao(param?.formData ?? param, additionalData);
                  }}
                  onReady={() => {
                    console.log("CardPayment pronto");
                  }}
                  onError={(error: any) => {
                    console.error(error);
                    toast.error("Erro no formulário do cartão");
                  }}
                />
              </div>
            ) : (
              <div className="mpEmpty">
                Não foi possível carregar o valor do pedido.
              </div>
            )}

            {loadingCartao && (
              <div className="mpLoading">Processando pagamento...</div>
            )}
          </aside>
        </div>

        <ToastContainer position="top-right" autoClose={1800} />

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: linear-gradient(135deg, #f7e6e4 0%, #f5efee 50%, #f7e7e8 100%);
            font-family: Inter, sans-serif;
          }

          .checkout {
            position: relative;
            min-height: 100vh;
            padding: 120px 24px 80px;
            overflow: hidden;
          }

          .bgBlur {
            position: absolute;
            border-radius: 999px;
            filter: blur(120px);
            opacity: 0.4;
          }

          .blur1 {
            width: 400px;
            height: 400px;
            background: #d98695;
            top: -120px;
            left: -120px;
          }

          .blur2 {
            width: 400px;
            height: 400px;
            background: #f0b8c1;
            bottom: -120px;
            right: -120px;
          }

          .topHero {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
            z-index: 2;
          }

          .heroTag {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 18px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.55);
            backdrop-filter: blur(12px);
            color: #8b4b56;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 255, 255, 0.4);
          }

          .topHero h1 {
            margin: 0;
            font-size: 64px;
            line-height: 1;
            letter-spacing: -4px;
            color: #4f2630;
          }

          .topHero p {
            margin: 18px auto 0;
            max-width: 720px;
            color: #7b5960;
            font-size: 17px;
          }

          .statusBadge {
            width: fit-content;
            margin: 0 auto 40px;
            padding: 14px 22px;
            border-radius: 999px;
            font-weight: 700;
            backdrop-filter: blur(12px);
          }

          .pending {
            background: rgba(255, 240, 240, 0.75);
            color: #a14f5a;
          }

          .ok {
            background: rgba(236, 253, 243, 0.85);
            color: #027a48;
          }

          .layout {
            position: relative;
            z-index: 2;
            max-width: 1500px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1.15fr 1fr;
            gap: 24px;
            align-items: start;
          }

          .glass {
            background: rgba(255, 255, 255, 0.58);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.45);
            border-radius: 36px;
            padding: 30px;
            box-shadow: 0 25px 80px rgba(108, 42, 55, 0.12);
          }

          .cardTitle {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #6c2a37;
            font-weight: 800;
            font-size: 17px;
            margin-bottom: 24px;
          }

          .userBox {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 18px;
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.55);
            margin-bottom: 24px;
          }

          .avatar {
            width: 70px;
            height: 70px;
            overflow: hidden;
            border-radius: 22px;
          }

          .userData {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .userData strong {
            color: #442128;
            font-size: 18px;
          }

          .userData span {
            color: #7d666b;
            font-size: 14px;
          }

          .infoList {
            display: grid;
            gap: 14px;
          }

          .infoItem {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 18px;
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.55);
          }

          .infoLeft {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #6b4850;
          }

          .infoItem strong {
            color: #4f2630;
          }

          .totalBox {
            margin-top: 26px;
            padding-top: 24px;
            border-top: 1px solid rgba(108, 42, 55, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .totalBox span {
            color: #6f5b5f;
            font-weight: 600;
          }

          .totalBox strong {
            color: #8d4a52;
            font-size: 36px;
            letter-spacing: -2px;
          }

          .backBtn {
            margin-top: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            text-decoration: none;
            height: 58px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.7);
            color: #7c4450;
            font-weight: 700;
          }

          .centerSide {
            text-align: center;
          }

          .pixHeader {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 24px;
          }

          .pixIcon {
            width: 78px;
            height: 78px;
            border-radius: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 16px;
            color: #8b4b56;
            background: linear-gradient(135deg, #fff, #ffe7eb);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8);
          }

          .pixHeader h2 {
            margin: 0;
            font-size: 34px;
            color: #4f2630;
          }

          .pixHeader p {
            margin-top: 8px;
            color: #7b5960;
          }

          .qrWrapper {
            display: flex;
            justify-content: center;
          }

          .qrCard {
            width: fit-content;
            padding: 28px;
            border-radius: 34px;
            background: #fff;
            box-shadow: 0 20px 50px rgba(109, 44, 55, 0.1);
          }

          textarea {
            width: 100%;
            min-height: 140px;
            margin-top: 22px;
            border-radius: 24px;
            border: none;
            padding: 18px;
            resize: none;
            background: rgba(255, 255, 255, 0.75);
            color: #573138;
            outline: none;
          }

          .pixActions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 18px;
          }

          .field {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 18px;
          }

          .field span {
            font-size: 14px;
            font-weight: 700;
            color: #6f4450;
          }

          .field input,
          .field select {
            height: 58px;
            border-radius: 20px;
            border: none;
            padding: 0 18px;
            background: rgba(255, 255, 255, 0.75);
            outline: none;
            color: #4b232a;
            font-size: 15px;
          }

          .triple {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
          }

          .primaryBtn,
          .softBtn,
          .successBtn {
            height: 60px;
            border: none;
            border-radius: 22px;
            cursor: pointer;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: 0.2s ease;
          }

          .primaryBtn:hover,
          .softBtn:hover,
          .successBtn:hover,
          .backBtn:hover {
            transform: translateY(-2px);
          }

          .primaryBtn {
            background: linear-gradient(135deg, #8d4a52, #c77785);
            color: white;
            box-shadow: 0 16px 40px rgba(141, 74, 82, 0.35);
          }

          .softBtn {
            background: rgba(255, 255, 255, 0.7);
            color: #7f4a54;
          }

          .successBtn {
            background: linear-gradient(135deg, #0d7a50, #17a56c);
            color: white;
          }

          .loadingPage {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 120px 20px;
          }

          .loadingCard {
            width: 100%;
            max-width: 420px;
            padding: 42px;
            border-radius: 34px;
            text-align: center;
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(20px);
            color: #6b3944;
          }

          .mpSummary {
            display: grid;
            gap: 6px;
            margin-bottom: 18px;
            padding: 16px 18px;
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.55);
            text-align: left;
          }

          .mpSummary strong {
            font-size: 24px;
            color: #8d4a52;
            letter-spacing: -1px;
          }

          .mpSummary span {
            color: #7b5960;
            font-size: 14px;
          }

          .mpCardWrap {
            text-align: left;
            padding: 14px;
            border-radius: 26px;
            background: rgba(255, 255, 255, 0.45);
          }

          .mpEmpty,
          .mpLoading {
            margin-top: 14px;
            padding: 14px 16px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.65);
            color: #6b3944;
            font-size: 14px;
          }

          @media (max-width: 1200px) {
            .layout {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .checkout {
              padding: 100px 16px 60px;
            }

            .topHero h1 {
              font-size: 42px;
              letter-spacing: -2px;
            }

            .glass {
              padding: 22px;
            }

            .pixActions,
            .triple {
              grid-template-columns: 1fr;
            }

            .totalBox strong {
              font-size: 28px;
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}