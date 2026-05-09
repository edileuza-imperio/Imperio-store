"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast, ToastContainer } from "react-toastify";

import { InicioApi } from "@/services/api/api";

import {
  FiCopy,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiCreditCard,
  FiSmartphone,
  FiUser,
  FiPackage,
  FiTruck,
  FiShield,
  FiArrowLeft,
} from "react-icons/fi";

import {
  ApiPedidoResponse,
  ApiPixResponse,
  ApiVerificarPagamentoResponse,
  formatarMoeda,
  Pedido,
  Usuario,
} from "@/components/Bibioteca/carrinho";

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const pedidoId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingPix, setLoadingPix] = useState(false);

  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);

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
        pedidoRes.data?.dados?.pedido ??
        pedidoRes.data?.pedido ??
        null;

      const usuarioData =
        meRes.data?.dados?.usuario ??
        meRes.data?.usuario ??
        null;

      setPedido(pedidoData);
      setUsuario(usuarioData);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pedidoId) {
      carregarPedido();
    }
  }, [pedidoId]);

  async function gerarPix() {
    try {
      if (!pedido || !usuario) {
        toast.warning("Dados não carregados");
        return;
      }

      const payload = {
        id_pedido: Number(pedido.id_pedido),
        usuario_id: Number(usuario.id_usuario),
        valor: Number(pedido.valor_total ?? 0),
        email: usuario.email,
        nome: usuario.nome,
        cpf: (usuario.cpf ?? "").replace(/\D/g, ""),
      };

      if (!payload.id_pedido || !payload.usuario_id) {
        toast.error("Pedido inválido");
        return;
      }

      setLoadingPix(true);

      const res = await InicioApi.post<ApiPixResponse>(
        "/mercado/pagamento/pix",
        payload,
        {
          withCredentials: true,
        }
      );

      const qrCode =
        res.data?.dados?.pix?.qr_code ??
        res.data?.pix?.qr_code ??
        "";

      if (!qrCode) {
        toast.error("QR Code inválido");
        return;
      }

      setPixCode(qrCode);

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

    try {
      await navigator.clipboard.writeText(pixCode);

      setCopiado(true);

      toast.success("Código PIX copiado");

      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
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

      const pedidoAtual =
        res.data?.dados?.pedido ??
        res.data?.pedido ??
        null;

      // CORREÇÃO DO ERRO TYPESCRIPT
      setPedido(pedidoAtual);

      const status = String(
        pedidoAtual?.status_pagamento ?? ""
      ).toLowerCase();

      if (
        status.includes("approved") ||
        status.includes("aprovado")
      ) {
        toast.success("Pagamento aprovado!");

        setTimeout(() => {
          router.push("/Pedidos");
        }, 1200);
      } else {
        toast.info("Pagamento ainda pendente");
      }
    } catch (error) {
      console.error(error);

      toast.error("Erro ao verificar pagamento");
    }
  }

  if (loading) {
    return (
      <>
        <ToastContainer />

        <main className="pagamentoLoading">
          <div className="loadingCard">
            <FiClock size={42} />

            <h2>Carregando pedido...</h2>

            <p>Aguarde alguns segundos</p>
          </div>
        </main>

        <style jsx>{`
          .pagamentoLoading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f7fb;
            padding: 20px;
          }

          .loadingCard {
            width: 100%;
            max-width: 400px;
            background: #fff;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          }

          .loadingCard h2 {
            margin-top: 20px;
            font-size: 24px;
            color: #111827;
          }

          .loadingCard p {
            margin-top: 10px;
            color: #6b7280;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <ToastContainer />

      <main className="checkoutPage">
        <div className="containerCheckout">
          <button
            className="btnVoltar"
            onClick={() => router.back()}
          >
            <FiArrowLeft />
            Voltar
          </button>

          <div className="topo">
            <div>
              <span className="badge">
                <FiShield />
                Ambiente Seguro
              </span>

              <h1>Pagamento via PIX</h1>

              <p>
                Finalize seu pedido realizando o pagamento
                via PIX.
              </p>
            </div>

            <div
              className={`statusPagamento ${
                statusPagamento === "approved"
                  ? "approved"
                  : ""
              }`}
            >
              {statusPagamento === "approved" ? (
                <>
                  <FiCheckCircle />
                  Pago
                </>
              ) : (
                <>
                  <FiClock />
                  Pendente
                </>
              )}
            </div>
          </div>

          <div className="gridCheckout">
            <section className="cardPix">
              <div className="cardHeader">
                <FiSmartphone />

                <div>
                  <h2>Pagamento PIX</h2>
                  <p>
                    Escaneie o QR Code ou copie o código
                  </p>
                </div>
              </div>

              {!pixCode ? (
                <button
                  className="btnPix"
                  onClick={gerarPix}
                  disabled={loadingPix}
                >
                  <FiCreditCard />

                  {loadingPix
                    ? "Gerando PIX..."
                    : "Gerar PIX"}
                </button>
              ) : (
                <>
                  <div className="qrContainer">
                    <QRCodeCanvas
                      value={pixCode}
                      size={240}
                    />
                  </div>

                  <textarea
                    className="pixArea"
                    value={pixCode}
                    readOnly
                  />

                  <div className="acoes">
                    <button
                      className="btnCopiar"
                      onClick={copiarPix}
                    >
                      <FiCopy />

                      {copiado
                        ? "Copiado!"
                        : "Copiar código"}
                    </button>

                    <button
                      className="btnVerificar"
                      onClick={verificarPagamento}
                    >
                      <FiCheckCircle />
                      Já paguei
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="cardResumo">
              <div className="cardHeader">
                <FiPackage />

                <div>
                  <h2>Resumo do Pedido</h2>
                  <p>Informações da compra</p>
                </div>
              </div>

              <div className="info">
                <span>
                  <FiUser />
                  Cliente
                </span>

                <strong>
                  {usuario?.nome ?? "Não informado"}
                </strong>
              </div>

              <div className="info">
                <span>
                  <FiTruck />
                  Pedido
                </span>

                <strong>
                  #{pedido?.id_pedido ?? "--"}
                </strong>
              </div>

              <div className="linha" />

              <div className="total">
                <span>Total</span>

                <h3>
                  {formatarMoeda(
                    Number(pedido?.valor_total ?? 0)
                  )}
                </h3>
              </div>
            </section>
          </div>
        </div>
      </main>

      <style jsx>{`
        .checkoutPage {
          min-height: 100vh;
          background: linear-gradient(
            180deg,
            #f8fafc,
            #eef2ff
          );
          padding: 40px 20px;
        }

        .containerCheckout {
          max-width: 1200px;
          margin: 0 auto;
        }

        .btnVoltar {
          border: none;
          background: white;
          height: 52px;
          padding: 0 20px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 600;
          margin-bottom: 25px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
          transition: 0.2s;
        }

        .btnVoltar:hover {
          transform: translateY(-2px);
        }

        .topo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ede9fe;
          color: #6d28d9;
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .topo h1 {
          font-size: 42px;
          color: #111827;
          margin-bottom: 10px;
        }

        .topo p {
          color: #6b7280;
          font-size: 16px;
        }

        .statusPagamento {
          background: #fef3c7;
          color: #92400e;
          padding: 16px 22px;
          border-radius: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
        }

        .statusPagamento.approved {
          background: #dcfce7;
          color: #166534;
        }

        .gridCheckout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 25px;
        }

        .cardPix,
        .cardResumo {
          background: white;
          border-radius: 28px;
          padding: 30px;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.06);
        }

        .cardHeader {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 30px;
        }

        .cardHeader svg {
          width: 55px;
          height: 55px;
          padding: 14px;
          border-radius: 16px;
          background: #eef2ff;
          color: #4338ca;
        }

        .cardHeader h2 {
          font-size: 24px;
          color: #111827;
        }

        .cardHeader p {
          color: #6b7280;
          margin-top: 4px;
        }

        .btnPix {
          width: 100%;
          height: 60px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            #4f46e5,
            #7c3aed
          );
          color: white;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: 0.2s;
        }

        .btnPix:hover {
          transform: translateY(-2px);
        }

        .btnPix:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .qrContainer {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 30px;
          background: #f9fafb;
          border-radius: 24px;
          margin-bottom: 20px;
        }

        .pixArea {
          width: 100%;
          height: 130px;
          resize: none;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 16px;
          font-size: 14px;
          outline: none;
          margin-bottom: 20px;
        }

        .acoes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .btnCopiar,
        .btnVerificar {
          height: 58px;
          border: none;
          border-radius: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: 0.2s;
        }

        .btnCopiar {
          background: #111827;
          color: white;
        }

        .btnVerificar {
          background: #22c55e;
          color: white;
        }

        .btnCopiar:hover,
        .btnVerificar:hover {
          transform: translateY(-2px);
        }

        .info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 0;
          gap: 20px;
        }

        .info span {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #6b7280;
          font-weight: 600;
        }

        .info strong {
          color: #111827;
        }

        .linha {
          width: 100%;
          height: 1px;
          background: #e5e7eb;
          margin: 10px 0;
        }

        .total {
          padding-top: 10px;
        }

        .total span {
          color: #6b7280;
          font-size: 15px;
        }

        .total h3 {
          font-size: 38px;
          color: #111827;
          margin-top: 8px;
        }

        @media (max-width: 900px) {
          .gridCheckout {
            grid-template-columns: 1fr;
          }

          .topo h1 {
            font-size: 32px;
          }
        }

        @media (max-width: 600px) {
          .checkoutPage {
            padding: 20px 14px;
          }

          .cardPix,
          .cardResumo {
            padding: 22px;
            border-radius: 22px;
          }

          .acoes {
            grid-template-columns: 1fr;
          }

          .topo h1 {
            font-size: 26px;
          }

          .total h3 {
            font-size: 30px;
          }
        }
      `}</style>
    </>
  );
}