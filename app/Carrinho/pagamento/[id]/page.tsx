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
  FiLock,
  FiCopy,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiRefreshCw,
  FiCreditCard,
  FiSmartphone,
} from "react-icons/fi";

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
    return Number(
      valor.replace(/\./g, "").replace(",", ".")
    );
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

  const pedidoId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [pedido, setPedido] =
    useState<Pedido | null>(null);

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [metodo, setMetodo] =
    useState<"pix" | "cartao">("pix");

  const [pixCode, setPixCode] =
    useState("");

  const [copiado, setCopiado] =
    useState(false);

  const [loadingPix, setLoadingPix] =
    useState(false);

  const [loadingCartao, setLoadingCartao] =
    useState(false);

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
      pedido?.status_pagamento ??
        pedido?.status ??
        ""
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

      const [pedidoRes, meRes] =
        await Promise.all([
          InicioApi.get<ApiPedidoResponse>(
            `/pedido/${pedidoId}`,
            {
              withCredentials: true,
            }
          ),

          InicioApi.get<ApiPedidoResponse>(
            "/me",
            {
              withCredentials: true,
            }
          ),
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

      toast.error(
        "Erro ao carregar pedido"
      );
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

        valor: normalizarNumero(
          pedido?.valor_total
        ),

        email: usuario?.email,

        nome: usuario?.nome,

        cpf:
          usuario?.cpf?.replace(
            /\D/g,
            ""
          ) ?? "",
      };

      const res =
        await InicioApi.post<ApiPixResponse>(
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
        toast.error(
          "Erro ao gerar PIX"
        );

        return;
      }

      setPixCode(qr);

      toast.success("PIX gerado");
    } catch (err) {
      console.error(err);

      toast.error(
        "Erro ao gerar PIX"
      );
    } finally {
      setLoadingPix(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(
      pixCode
    );

    setCopiado(true);

    toast.success(
      "Código PIX copiado"
    );

    setTimeout(() => {
      setCopiado(false);
    }, 1500);
  }

  async function verificarPagamento() {
    try {
      const res =
        await InicioApi.post<ApiVerificarPagamentoResponse>(
          "/mercado/pagamento/verificar",
          {
            id_pedido: Number(
              pedidoId
            ),
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
        pedidoAtualizado?.status_pagamento ??
          pedidoAtualizado?.status ??
          ""
      ).toLowerCase();

      if (
        status.includes(
          "approved"
        ) ||
        status.includes(
          "aprovado"
        )
      ) {
        toast.success(
          "Pagamento aprovado"
        );

        setTimeout(() => {
          router.push("/Pedidos");
        }, 1500);
      } else {
        toast.info(
          "Pagamento ainda pendente"
        );
      }
    } catch (err) {
      console.error(err);

      toast.error(
        "Erro ao verificar pagamento"
      );
    }
  }

  async function pagarCartao() {
    try {
      setLoadingCartao(true);

      await InicioApi.post(
        "/mercado/pagamento/cartao",
        {
          id_pedido:
            pedido?.id_pedido,

          usuario_id:
            usuario?.id_usuario,

          valor:
            normalizarNumero(
              pedido?.valor_total
            ),

          token: "TOKEN_AQUI",

          parcelas: Number(
            cartao.parcelas
          ),
        },
        {
          withCredentials: true,
        }
      );

      toast.success(
        "Pagamento enviado"
      );
    } catch (err) {
      console.error(err);

      toast.error(
        "Erro ao processar cartão"
      );
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
            <FiClock size={38} />

            <h2>
              Carregando pagamento
            </h2>

            <p>
              Aguarde um instante...
            </p>
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
        <div className="checkoutBox">
          <div className="hero">
            <div className="heroTag">
              <FiLock />
              Pagamento seguro
            </div>

            <h1>
              Finalizar pagamento
            </h1>

            <p>
              Complete seu pedido
              com segurança e
              rapidez.
            </p>
          </div>

          <div
            className={`status ${
              statusPagamento ===
              "approved"
                ? "ok"
                : "pending"
            }`}
          >
            {statusPagamento ===
            "approved"
              ? "Pagamento aprovado"
              : "Aguardando pagamento"}
          </div>

          <div className="resume">
            <div className="resumeUser">
              <div className="avatar">
                <Image
                  src="/images/sem-imagem.png"
                  alt="Usuário"
                  width={60}
                  height={60}
                />
              </div>

              <div>
                <strong>
                  {usuario?.nome}
                </strong>

                <span>
                  {usuario?.email}
                </span>
              </div>
            </div>

            <div className="resumeRows">
              <div>
                <span>Pedido</span>

                <strong>
                  #
                  {
                    pedido?.id_pedido
                  }
                </strong>
              </div>

              <div>
                <span>
                  Produtos
                </span>

                <strong>
                  {formatarMoeda(
                    pedido?.valor_produtos
                  )}
                </strong>
              </div>

              <div>
                <span>Frete</span>

                <strong>
                  {formatarMoeda(
                    pedido?.valor_frete
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Desconto
                </span>

                <strong>
                  -
                  {" "}
                  {formatarMoeda(
                    pedido?.valor_desconto
                  )}
                </strong>
              </div>
            </div>

            <div className="total">
              <span>Total</span>

              <strong>
                {formatarMoeda(
                  pedido?.valor_total
                )}
              </strong>
            </div>
          </div>

          <div className="tabs">
            <button
              className={
                metodo === "pix"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setMetodo("pix")
              }
            >
              <FiSmartphone />
              PIX
            </button>

            <button
              className={
                metodo ===
                "cartao"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setMetodo(
                  "cartao"
                )
              }
            >
              <FiCreditCard />
              Cartão
            </button>
          </div>

          {metodo === "pix" ? (
            <div className="pixArea">
              {!pixCode ? (
                <button
                  className="generateBtn"
                  onClick={
                    gerarPix
                  }
                  disabled={
                    loadingPix
                  }
                >
                  {loadingPix
                    ? "Gerando..."
                    : "Gerar PIX"}

                  <FiRefreshCw />
                </button>
              ) : (
                <>
                  <div className="qrCard">
                    <QRCodeCanvas
                      value={pixCode}
                      size={240}
                    />
                  </div>

                  <textarea
                    value={
                      pixCode
                    }
                    readOnly
                  />

                  <div className="pixActions">
                    <button
                      onClick={
                        copiarPix
                      }
                    >
                      <FiCopy />

                      {copiado
                        ? "Copiado"
                        : "Copiar código"}
                    </button>

                    <button
                      className="successBtn"
                      onClick={
                        verificarPagamento
                      }
                    >
                      <FiCheckCircle />
                      Já paguei
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="cardArea">
              <div className="field">
                <span>
                  Número do cartão
                </span>

                <input
                  placeholder="0000 0000 0000 0000"
                  value={
                    cartao.numero
                  }
                  onChange={(
                    e
                  ) =>
                    setCartao(
                      (
                        prev
                      ) => ({
                        ...prev,
                        numero:
                          e
                            .target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div className="field">
                <span>
                  Nome no cartão
                </span>

                <input
                  placeholder="Nome completo"
                  value={
                    cartao.nome
                  }
                  onChange={(
                    e
                  ) =>
                    setCartao(
                      (
                        prev
                      ) => ({
                        ...prev,
                        nome:
                          e
                            .target
                            .value,
                      })
                    )
                  }
                />
              </div>

              <div className="triple">
                <div className="field">
                  <span>
                    Mês
                  </span>

                  <input
                    placeholder="MM"
                    value={
                      cartao.mes
                    }
                    onChange={(
                      e
                    ) =>
                      setCartao(
                        (
                          prev
                        ) => ({
                          ...prev,
                          mes: e
                            .target
                            .value,
                        })
                      )
                    }
                  />
                </div>

                <div className="field">
                  <span>
                    Ano
                  </span>

                  <input
                    placeholder="AA"
                    value={
                      cartao.ano
                    }
                    onChange={(
                      e
                    ) =>
                      setCartao(
                        (
                          prev
                        ) => ({
                          ...prev,
                          ano: e
                            .target
                            .value,
                        })
                      )
                    }
                  />
                </div>

                <div className="field">
                  <span>
                    CVV
                  </span>

                  <input
                    placeholder="123"
                    value={
                      cartao.cvv
                    }
                    onChange={(
                      e
                    ) =>
                      setCartao(
                        (
                          prev
                        ) => ({
                          ...prev,
                          cvv: e
                            .target
                            .value,
                        })
                      )
                    }
                  />
                </div>
              </div>

              <button
                className="generateBtn"
                onClick={
                  pagarCartao
                }
                disabled={
                  loadingCartao
                }
              >
                {loadingCartao
                  ? "Processando..."
                  : "Pagar agora"}

                <FiCreditCard />
              </button>
            </div>
          )}

          <Link
            href="/Carrinho"
            className="backBtn"
          >
            <FiArrowLeft />
            Voltar ao carrinho
          </Link>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={1800}
        />

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            background: #f5f7fb;
          }

          .checkout {
            min-height: 100vh;
            padding: 120px 16px 70px;
          }

          .checkoutBox {
            width: 100%;
            max-width: 760px;
            margin: 0 auto;
            background: #fff;
            border-radius: 34px;
            padding: 34px;
            border: 1px solid #ececec;
            box-shadow:
              0 10px 50px
              rgba(0, 0, 0, 0.05);
          }

          .hero {
            text-align: center;
            margin-bottom: 30px;
          }

          .heroTag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 999px;
            background: #f3f4f6;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 20px;
          }

          .hero h1 {
            margin: 0;
            font-size: 52px;
            line-height: 1;
            letter-spacing: -3px;
            color: #111827;
          }

          .hero p {
            margin-top: 14px;
            color: #6b7280;
            font-size: 16px;
          }

          .status {
            width: fit-content;
            margin: 0 auto 30px;
            padding: 12px 20px;
            border-radius: 999px;
            font-weight: 700;
          }

          .pending {
            background: #fff7ed;
            color: #c2410c;
          }

          .ok {
            background: #ecfdf3;
            color: #027a48;
          }

          .resume {
            border: 1px solid #ececec;
            border-radius: 28px;
            padding: 24px;
            margin-bottom: 28px;
            background: #fafafa;
          }

          .resumeUser {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 22px;
          }

          .avatar {
            width: 60px;
            height: 60px;
            overflow: hidden;
            border-radius: 18px;
          }

          .resumeRows {
            display: grid;
            gap: 14px;
          }

          .resumeRows div,
          .total {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .total {
            margin-top: 24px;
            padding-top: 22px;
            border-top: 1px solid #e5e7eb;
          }

          .total strong {
            font-size: 34px;
          }

          .tabs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 26px;
          }

          .tabs button {
            height: 58px;
            border-radius: 18px;
            border: 1px solid #e5e7eb;
            background: #fff;
            cursor: pointer;
            font-weight: 700;
          }

          .tabs button.active {
            background: #111827;
            color: #fff;
          }

          .pixArea,
          .cardArea {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .generateBtn,
          .pixActions button {
            height: 58px;
            border: none;
            border-radius: 18px;
            background: #111827;
            color: #fff;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }

          .successBtn {
            background: #027a48 !important;
          }

          .qrCard {
            display: flex;
            justify-content: center;
            padding: 32px;
            border-radius: 28px;
            border: 1px solid #ececec;
            background: #fafafa;
          }

          textarea {
            width: 100%;
            min-height: 140px;
            border-radius: 20px;
            border: 1px solid #e5e7eb;
            padding: 18px;
            resize: none;
          }

          .pixActions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .field input {
            height: 56px;
            border-radius: 18px;
            border: 1px solid #e5e7eb;
            padding: 0 16px;
          }

          .triple {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
          }

          .backBtn {
            margin-top: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            text-decoration: none;
            color: #6b7280;
            font-weight: 600;
          }

          .loadingPage {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .loadingCard {
            background: #fff;
            padding: 40px;
            border-radius: 28px;
            text-align: center;
          }

          @media (max-width: 768px) {
            .checkoutBox {
              padding: 24px;
            }

            .hero h1 {
              font-size: 38px;
            }

            .tabs,
            .pixActions,
            .triple {
              grid-template-columns: 1fr;
            }

            .total strong {
              font-size: 28px;
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}