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
  FiShield,
  FiAlertCircle,
  FiUser,
  FiPackage,
} from "react-icons/fi";

type Pedido = {
  id_pedido?: number;
  carrinho_id?: number;
  usuario_id?: number;
  status_id?: number;
  valor_produtos?: number | string;
  valor_desconto?: number | string;
  valor_frete?: number | string;
  valor_total?: number | string;
  status_pagamento?: string;
  payment_id?: string | null;
  external_reference?: string | null;
  status?: string;
  payment_status?: string;
};

type Usuario = {
  id_usuario?: number;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
};

type ApiPedidoResponse = {
  status?: number;
  mensagem?: string;
  dados?: {
    pedido?: Pedido;
    usuario?: Usuario;
  };
  pedido?: Pedido;
  usuario?: Usuario;
};

type ApiPixResponse = {
  status?: number;
  mensagem?: string;
  dados?: {
    pagamento_id?: number | string;
    status?: string;
    pix?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  pagamento_id?: number | string;
  pix?: {
    qr_code?: string;
    qr_code_base64?: string;
    ticket_url?: string;
  };
};

type ApiVerificarPagamentoResponse = {
  status?: string;
  pagamento_id?: number | string;
  pedido_id?: number | string;
  mensagem?: string;
  pedido?: Pedido;
  dados?: {
    status?: string;
    pedido?: Pedido;
  };
};

function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === "string") {
    const limpo = valor.replace(/\./g, "").replace(",", ".");
    const numero = Number(limpo);
    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizarNumero(valor));
}

function getRespostaPedido(data: ApiPedidoResponse): Pedido | null {
  return data?.dados?.pedido ?? data?.pedido ?? null;
}

function getRespostaUsuario(data: ApiPedidoResponse): Usuario | null {
  return data?.dados?.usuario ?? data?.usuario ?? null;
}

function getQrCodePix(data: ApiPixResponse): string {
  return data?.dados?.pix?.qr_code ?? data?.pix?.qr_code ?? "";
}

function normalizarStatusPagamento(
  pedido: Pedido | null
): "approved" | "pending" | "rejected" {
  const status = String(
    pedido?.status_pagamento ?? pedido?.status ?? pedido?.payment_status ?? ""
  )
    .toLowerCase()
    .trim();

  if (
    status.includes("approved") ||
    status.includes("aprovado") ||
    status.includes("paid") ||
    status.includes("pago") ||
    status.includes("confirmed") ||
    status.includes("accredited")
  ) {
    return "approved";
  }

  if (
    status.includes("rejected") ||
    status.includes("cancel") ||
    status.includes("refused") ||
    status.includes("refund")
  ) {
    return "rejected";
  }

  return "pending";
}

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const rawPedidoId = params?.id;
  const pedidoId = Array.isArray(rawPedidoId) ? rawPedidoId[0] : rawPedidoId;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPix, setLoadingPix] = useState(false);
  const [loadingCartao, setLoadingCartao] = useState(false);
  const [verificandoPagamento, setVerificandoPagamento] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string>("");
  const [metodo, setMetodo] = useState<"pix" | "cartao">("pix");

  const [cartao, setCartao] = useState({
    numero: "",
    nome: "",
    mes: "",
    ano: "",
    cvv: "",
    parcelas: "1",
  });

  const valorTotal = useMemo(() => normalizarNumero(pedido?.valor_total ?? 0), [pedido]);
  const statusPagamento = useMemo(() => normalizarStatusPagamento(pedido), [pedido]);
  const pagamentoConfirmado = statusPagamento === "approved";

  const statusLabel =
    statusPagamento === "approved"
      ? "Pagamento aprovado"
      : statusPagamento === "rejected"
        ? "Pagamento recusado"
        : "Aguardando pagamento";

  const statusClass =
    statusPagamento === "approved"
      ? "ok"
      : statusPagamento === "rejected"
        ? "error"
        : "pending";

  function redirecionarParaPedidos() {
    setTimeout(() => {
      router.push("/Pedidos");
    }, 1600);
  }

  async function carregarPedido() {
    try {
      setLoading(true);

      if (!pedidoId) {
        setPedido(null);
        setUsuario(null);
        return;
      }

      const [pedidoRes, meRes] = await Promise.all([
        InicioApi.get(`/pedido/${pedidoId}`, { withCredentials: true }),
        InicioApi.get("/me", { withCredentials: true }),
      ]);

      const pedidoData = getRespostaPedido(pedidoRes.data as ApiPedidoResponse);
      const usuarioData = getRespostaUsuario(meRes.data as ApiPedidoResponse);

      setPedido(pedidoData);
      setUsuario(usuarioData);

      const status = normalizarStatusPagamento(pedidoData);

      if (status === "approved") {
        setMensagemStatus("Pagamento aprovado com sucesso.");
        toast.success("Pagamento aprovado com sucesso!");
        redirecionarParaPedidos();
      } else if (status === "rejected") {
        setMensagemStatus("Pagamento recusado.");
      } else {
        setMensagemStatus("Aguardando confirmação do pagamento.");
      }
    } catch (error) {
      console.error("Erro ao carregar pagamento:", error);
      setMensagemStatus("Não foi possível carregar os dados do pedido.");
      toast.error("Não foi possível carregar os dados do pedido.");
    } finally {
      setLoading(false);
    }
  }

  async function verificarPagamentoNoServidor(silencioso = false) {
    try {
      if (!pedidoId) return;

      setVerificandoPagamento(true);

      const res = await InicioApi.post<ApiVerificarPagamentoResponse>(
        "/mercado/pagamento/verificar",
        { id_pedido: Number(pedidoId) },
        { withCredentials: true }
      );

      const data = res.data;
      const pedidoAtualizado = data?.dados?.pedido ?? data?.pedido ?? null;

      const statusRecebido = normalizarStatusPagamento(
        pedidoAtualizado ??
          (data?.status
            ? ({
                status_pagamento: data.status,
                status: data.status,
              } as Pedido)
            : null)
      );

      if (pedidoAtualizado) {
        setPedido(pedidoAtualizado);
      } else if (data?.status) {
        setPedido((prev) =>
          prev
            ? {
                ...prev,
                status_pagamento: data.status,
                status: data.status,
              }
            : prev
        );
      }

      if (statusRecebido === "approved") {
        setMensagemStatus("Pagamento aprovado com sucesso.");
        setPedido((prev) =>
          prev
            ? {
                ...prev,
                status_pagamento: "approved",
                status: "approved",
              }
            : prev
        );
        toast.success("Pagamento aprovado com sucesso!");
        redirecionarParaPedidos();
        return;
      }

      if (statusRecebido === "rejected") {
        setMensagemStatus("Pagamento recusado ou cancelado.");
        if (!silencioso) toast.error("Pagamento recusado ou cancelado.");
        return;
      }

      setMensagemStatus("Pagamento ainda não confirmado.");
      if (!silencioso) toast.info("Ainda não identificamos o pagamento.");
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
      setMensagemStatus("Não foi possível verificar o pagamento agora.");
      if (!silencioso) toast.error("Não foi possível verificar o pagamento agora.");
    } finally {
      setVerificandoPagamento(false);
    }
  }

  async function gerarPix() {
    try {
      setLoadingPix(true);
      setCopiado(false);
      setMensagemStatus("");

      if (!pedido || !usuario) {
        toast.error("Pedido ou usuário não carregado.");
        return;
      }

      const payload = {
        id_pedido: pedido.id_pedido,
        usuario_id: usuario.id_usuario,
        valor: valorTotal,
        email: usuario.email,
        nome: usuario.nome,
        sobrenome: "Checkout",
        cpf: (usuario.cpf ?? "").replace(/\D/g, ""),
      };

      const res = await InicioApi.post<ApiPixResponse>(
        "/mercado/pagamento/pix",
        payload,
        { withCredentials: true }
      );

      const qr = getQrCodePix(res.data);

      if (!qr) {
        toast.error("Não foi possível gerar o código PIX.");
        return;
      }

      setPixCode(qr);
      setMetodo("pix");
      setMensagemStatus("PIX gerado. Agora é só pagar e aguardar a confirmação.");
    } catch (error: any) {
      console.error("ERRO PIX:", error?.response?.data);
      toast.error(error?.response?.data?.dados?.erro || "Erro ao gerar PIX");
    } finally {
      setLoadingPix(false);
    }
  }

  async function pagarCartao() {
    try {
      setLoadingCartao(true);
      setMensagemStatus("");

      if (!pedido || !usuario) {
        toast.error("Pedido ou usuário não carregado.");
        return;
      }

      const payload = {
        id_pedido: pedido.id_pedido,
        usuario_id: usuario.id_usuario,
        valor: valorTotal,
        payment_method_id: "visa",
        token: "TOKEN_GERADO_PELO_BRICK_AQUI",
        parcelas: Number(cartao.parcelas || 1),
      };

      const res = await InicioApi.post("/mercado/pagamento/cartao", payload, {
        withCredentials: true,
      });

      console.log("✅ CARTÃO RESPONSE:", res.data);
      setMensagemStatus("Pagamento com cartão enviado. Aguarde a confirmação.");
      toast.success("Pagamento com cartão enviado.");
    } catch (error: any) {
      console.error("❌ ERRO CARTÃO:", error?.response?.data);
      toast.error(error?.response?.data?.dados?.erro || "Erro ao processar cartão");
    } finally {
      setLoadingCartao(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);
    setCopiado(true);
    toast.success("Código PIX copiado!");

    setTimeout(() => setCopiado(false), 1600);
  }

  useEffect(() => {
    if (pedidoId) carregarPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  useEffect(() => {
    if (!pedidoId || !pixCode || pagamentoConfirmado) return;

    const interval = setInterval(() => {
      void verificarPagamentoNoServidor(true);
    }, 7000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId, pixCode, pagamentoConfirmado]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page">
          <div className="shell">
            <section className="loadingCard">
              <FiClock size={30} />
              <h2>Carregando pagamento</h2>
              <p>Estamos buscando os dados do seu pedido.</p>
            </section>
          </div>

          <style jsx global>{`
            .page {
              min-height: 100vh;
              padding: 112px 20px 56px;
              background: #f5f6f8;
            }

            .shell {
              max-width: 1220px;
              margin: 0 auto;
            }

            .loadingCard {
              max-width: 520px;
              margin: 0 auto;
              border-radius: 24px;
              background: #fff;
              border: 1px solid #eceff3;
              box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
              padding: 34px 24px;
              display: grid;
              justify-items: center;
              gap: 10px;
              text-align: center;
              color: #334155;
            }

            .loadingCard h2 {
              margin: 0;
              font-size: 22px;
              color: #111827;
            }

            .loadingCard p {
              margin: 0;
              color: #64748b;
            }
          `}</style>
        </main>
        <Footer />
      </>
    );
  }

  if (!pedido) {
    return (
      <>
        <Navbar />
        <main className="page">
          <div className="shell">
            <section className="emptyCard">
              <h1>Pedido não encontrado</h1>
              <p>Não conseguimos localizar o pedido para pagamento.</p>
              <Link href="/Carrinho" className="secondaryBtn">
                <FiArrowLeft /> Voltar ao carrinho
              </Link>
            </section>
          </div>

          <style jsx global>{`
            .page {
              min-height: 100vh;
              padding: 112px 20px 56px;
              background: #f5f6f8;
            }

            .shell {
              max-width: 1220px;
              margin: 0 auto;
            }

            .emptyCard {
              max-width: 560px;
              margin: 0 auto;
              border-radius: 24px;
              background: #fff;
              border: 1px solid #eceff3;
              box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
              padding: 34px 24px;
              display: grid;
              justify-items: center;
              gap: 10px;
              text-align: center;
              color: #334155;
            }

            .emptyCard h1 {
              margin: 0;
              font-size: 22px;
              color: #111827;
            }

            .emptyCard p {
              margin: 0;
              color: #64748b;
            }

            .secondaryBtn {
              height: 52px;
              padding: 0 18px;
              border-radius: 14px;
              border: 1px solid #d9dee7;
              background: #fff;
              color: #111827;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              font-weight: 600;
              text-decoration: none;
              transition: 0.18s ease;
            }

            .secondaryBtn:hover {
              transform: translateY(-1px);
              border-color: #c7ced9;
            }
          `}</style>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="shell">
          <section className="topCard">
            <div>
              <div className="eyebrow">
                <FiLock />
                <span>Pagamento seguro</span>
              </div>
              <h1>Finalizar pagamento</h1>
              <p>Escolha PIX ou cartão e conclua sua compra com uma interface limpa e responsiva.</p>
            </div>

            <div className={`statusBadge ${statusClass}`}>{statusLabel}</div>
          </section>

          {mensagemStatus && <div className={`messageBar ${statusClass}`}>{mensagemStatus}</div>}

          <div className="layout">
            <section className="contentCol">
              <section className="card mainCard">
                <div className="mainHeader">
                  <div>
                    <span className="sectionLabel">Checkout</span>
                    <h2>Pagamento do pedido</h2>
                    <p>Fluxo direto, visual mais limpo e foco total na conversão.</p>
                  </div>

                  {pagamentoConfirmado && (
                    <div className="successBadge">
                      <FiCheckCircle />
                      <span>Confirmado</span>
                    </div>
                  )}
                </div>

                <div className="infoGrid">
                  <article className="infoCard">
                    <div className="infoTitle">
                      <FiUser />
                      <span>Cliente</span>
                    </div>

                    <div className="buyerBox">
                      <div className="avatar">
                        <Image
                          src="/images/sem-imagem.png"
                          alt="Usuário"
                          width={56}
                          height={56}
                        />
                      </div>

                      <div className="buyerInfo">
                        <strong>{usuario?.nome || "Usuário"}</strong>
                        <span>{usuario?.email || "-"}</span>
                        <span>CPF: {usuario?.cpf || "-"}</span>
                      </div>
                    </div>
                  </article>

                  <article className="infoCard">
                    <div className="infoTitle">
                      <FiPackage />
                      <span>Resumo financeiro</span>
                    </div>

                    <div className="summaryRows">
                      <div className="summaryRow">
                        <span>Produtos</span>
                        <strong>{formatarMoeda(pedido.valor_produtos)}</strong>
                      </div>
                      <div className="summaryRow">
                        <span>Frete</span>
                        <strong>{formatarMoeda(pedido.valor_frete ?? 0)}</strong>
                      </div>
                      <div className="summaryRow">
                        <span>Desconto</span>
                        <strong>- {formatarMoeda(pedido.valor_desconto ?? 0)}</strong>
                      </div>
                    </div>

                    <div className="totalLine">
                      <span>Total</span>
                      <strong>{formatarMoeda(pedido.valor_total)}</strong>
                    </div>
                  </article>
                </div>

                <div className="paymentTabs">
                  <button
                    type="button"
                    className={`tabBtn ${metodo === "pix" ? "active" : ""}`}
                    onClick={() => setMetodo("pix")}
                  >
                    <FiSmartphone />
                    PIX
                  </button>

                  <button
                    type="button"
                    className={`tabBtn ${metodo === "cartao" ? "active" : ""}`}
                    onClick={() => setMetodo("cartao")}
                  >
                    <FiCreditCard />
                    Cartão
                  </button>
                </div>

                <div className="panel">
                  {metodo === "pix" ? (
                    <div className="methodBlock">
                      <div className="actionRow">
                        <Link href="/Carrinho" className="secondaryBtn">
                          <FiArrowLeft /> Voltar ao carrinho
                        </Link>

                        <button className="primaryBtn" onClick={gerarPix} disabled={loadingPix}>
                          {loadingPix ? "Gerando PIX..." : "Gerar PIX"}
                          <FiRefreshCw />
                        </button>
                      </div>

                      <div className="hintBox">
                        <FiShield />
                        <span>PIX processado com segurança. Após pagar, use o botão de verificação.</span>
                      </div>

                      {pixCode ? (
                        <div className="pixGrid">
                          <div className="qrCard">
                            <div className="blockTitle">
                              <FiSmartphone />
                              <strong>Escaneie o QR Code</strong>
                            </div>

                            <div className="qrWrap">
                              <QRCodeCanvas value={pixCode} size={220} />
                            </div>
                          </div>

                          <div className="pixCodeCard">
                            <div className="blockTitle">
                              <FiCopy />
                              <strong>Código PIX copia e cola</strong>
                            </div>

                            <textarea className="pixTextarea" value={pixCode} readOnly />

                            <div className="pixButtons">
                              <button className="copyBtn" onClick={copiarPix}>
                                <FiCopy />
                                {copiado ? "Copiado" : "Copiar código"}
                              </button>

                              <button
                                className="verifyBtn"
                                onClick={() => verificarPagamentoNoServidor(false)}
                                disabled={verificandoPagamento}
                              >
                                {verificandoPagamento ? "Verificando..." : "Já paguei"}
                                <FiCheckCircle />
                              </button>
                            </div>

                            <p className="smallText">
                              Esse botão consulta o backend e atualiza o pedido com o status real.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="placeholder">
                          <FiCheckCircle size={30} />
                          <p>O QR Code aparecerá aqui depois que você gerar o PIX.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="methodBlock">
                      <div className="formGrid">
                        <label className="field">
                          <span>Número do cartão</span>
                          <input
                            value={cartao.numero}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, numero: e.target.value }))
                            }
                            placeholder="0000 0000 0000 0000"
                            inputMode="numeric"
                            autoComplete="cc-number"
                          />
                        </label>

                        <label className="field">
                          <span>Nome no cartão</span>
                          <input
                            value={cartao.nome}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, nome: e.target.value }))
                            }
                            placeholder="Como aparece no cartão"
                            autoComplete="cc-name"
                          />
                        </label>
                      </div>

                      <div className="formGrid formGrid3">
                        <label className="field">
                          <span>Mês</span>
                          <input
                            value={cartao.mes}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, mes: e.target.value }))
                            }
                            placeholder="MM"
                            inputMode="numeric"
                            autoComplete="cc-exp-month"
                          />
                        </label>

                        <label className="field">
                          <span>Ano</span>
                          <input
                            value={cartao.ano}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, ano: e.target.value }))
                            }
                            placeholder="AA"
                            inputMode="numeric"
                            autoComplete="cc-exp-year"
                          />
                        </label>

                        <label className="field">
                          <span>CVV</span>
                          <input
                            value={cartao.cvv}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, cvv: e.target.value }))
                            }
                            placeholder="123"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                          />
                        </label>
                      </div>

                      <div className="formGrid">
                        <label className="field">
                          <span>Parcelas</span>
                          <select
                            value={cartao.parcelas}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, parcelas: e.target.value }))
                            }
                          >
                            <option value="1">1x sem juros</option>
                            <option value="2">2x sem juros</option>
                            <option value="3">3x sem juros</option>
                          </select>
                        </label>

                        <div className="field staticField">
                          <span>Total</span>
                          <strong>{formatarMoeda(pedido.valor_total)}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="primaryBtn full"
                        onClick={pagarCartao}
                        disabled={loadingCartao}
                      >
                        {loadingCartao ? "Processando cartão..." : "Pagar com cartão"}
                        <FiCreditCard />
                      </button>

                      <p className="warningText">
                        Em produção, o cartão precisa do token gerado no front pelo Mercado Pago.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </section>

            <aside className="sideCol">
              <section className="card sideCard">
                <div className="sideHeader">
                  <FiClock />
                  <div>
                    <strong>Resumo do pedido</strong>
                    <p>Informações rápidas e organizadas.</p>
                  </div>
                </div>

                <div className="sideSummary">
                  <div className="summaryRow">
                    <span>Pedido</span>
                    <strong>#{pedido.id_pedido}</strong>
                  </div>
                  <div className="summaryRow">
                    <span>Total</span>
                    <strong>{formatarMoeda(pedido.valor_total)}</strong>
                  </div>
                  <div className="summaryRow">
                    <span>Status</span>
                    <strong>{statusLabel}</strong>
                  </div>
                </div>
              </section>

              <section className="card sideCard alertCard">
                <FiAlertCircle />
                <div>
                  <strong>Dica importante</strong>
                  <p>
                    O botão “Já paguei” apenas consulta o backend. A confirmação real depende da resposta do servidor.
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={1800} />

        <style jsx global>{`
          .page {
            min-height: 100vh;
            padding: 112px 20px 56px;
            background: #f5f6f8;
          }

          .shell {
            max-width: 1220px;
            margin: 0 auto;
          }

          .card {
            background: #fff;
            border: 1px solid #e9edf3;
            border-radius: 24px;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
          }

          .topCard {
            border-radius: 24px;
            padding: 24px;
            margin-bottom: 16px;
            background: #fff;
            border: 1px solid #e9edf3;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: #f3f4f6;
            color: #374151;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 14px;
          }

          .topCard h1 {
            margin: 0;
            font-size: clamp(28px, 4vw, 42px);
            line-height: 1.05;
            color: #111827;
            letter-spacing: -0.03em;
          }

          .topCard p {
            margin: 10px 0 0;
            color: #667085;
            font-size: 15px;
            max-width: 680px;
          }

          .statusBadge,
          .messageBar {
            padding: 12px 16px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 13px;
            border: 1px solid transparent;
            white-space: nowrap;
          }

          .messageBar {
            margin-bottom: 16px;
            white-space: normal;
            border-radius: 16px;
            font-weight: 600;
          }

          .pending {
            background: #fff7ed;
            color: #9a3412;
            border-color: #fed7aa;
          }

          .ok {
            background: #ecfdf3;
            color: #027a48;
            border-color: #abefc6;
          }

          .error {
            background: #fef2f2;
            color: #b42318;
            border-color: #fecaca;
          }

          .layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 320px;
            gap: 22px;
            align-items: start;
          }

          .contentCol,
          .sideCol {
            min-width: 0;
          }

          .mainCard,
          .sideCard {
            padding: 22px;
          }

          .mainHeader {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }

          .sectionLabel {
            display: inline-block;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 6px;
          }

          .mainHeader h2 {
            margin: 0;
            font-size: 24px;
            letter-spacing: -0.03em;
            color: #111827;
          }

          .mainHeader p {
            margin: 8px 0 0;
            color: #667085;
            font-size: 14px;
          }

          .successBadge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border-radius: 999px;
            background: #ecfdf3;
            border: 1px solid #abefc6;
            color: #027a48;
            font-weight: 700;
            font-size: 13px;
            flex-shrink: 0;
          }

          .infoGrid {
            margin-top: 18px;
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
            gap: 14px;
          }

          .infoCard {
            border-radius: 20px;
            padding: 16px;
            background: #fafbfc;
            border: 1px solid #eef2f7;
          }

          .infoTitle {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #4b5563;
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 14px;
          }

          .buyerBox {
            display: flex;
            gap: 14px;
            align-items: center;
          }

          .avatar {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            overflow: hidden;
            flex-shrink: 0;
            background: #fff;
            border: 1px solid #eef2f7;
          }

          .buyerInfo {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .buyerInfo strong {
            font-size: 15px;
            color: #111827;
          }

          .buyerInfo span {
            font-size: 13px;
            color: #667085;
          }

          .summaryRows,
          .sideSummary {
            display: grid;
            gap: 12px;
          }

          .summaryRow {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            color: #475467;
            font-size: 14px;
          }

          .summaryRow strong {
            color: #111827;
            font-weight: 700;
          }

          .totalLine {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid #eef2f7;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
          }

          .totalLine span {
            font-size: 16px;
            font-weight: 800;
            color: #111827;
          }

          .totalLine strong {
            font-size: 24px;
            color: #111827;
            letter-spacing: -0.03em;
          }

          .paymentTabs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .tabBtn {
            border: 1px solid #d9dee7;
            background: #fff;
            color: #111827;
            border-radius: 16px;
            min-height: 56px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-weight: 700;
            transition: 0.18s ease;
          }

          .tabBtn:hover {
            transform: translateY(-1px);
            border-color: #c7ced9;
          }

          .active {
            background: #111827;
            color: #fff;
            border-color: #111827;
            box-shadow: 0 10px 20px rgba(17, 24, 39, 0.12);
          }

          .panel {
            margin-top: 18px;
          }

          .methodBlock {
            display: grid;
            gap: 16px;
          }

          .actionRow {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .primaryBtn,
          .secondaryBtn,
          .copyBtn,
          .verifyBtn {
            min-height: 52px;
            border-radius: 14px;
            border: none;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            transition: 0.18s ease;
            text-decoration: none;
            padding: 0 18px;
          }

          .primaryBtn {
            background: #111827;
            color: #fff;
          }

          .primaryBtn:hover {
            transform: translateY(-1px);
            opacity: 0.95;
          }

          .primaryBtn:disabled,
          .verifyBtn:disabled {
            opacity: 0.72;
            cursor: progress;
            transform: none;
          }

          .secondaryBtn {
            background: #fff;
            color: #111827;
            border: 1px solid #d9dee7;
          }

          .secondaryBtn:hover {
            transform: translateY(-1px);
            border-color: #c7ced9;
          }

          .hintBox,
          .warningText {
            display: flex;
            gap: 12px;
            align-items: flex-start;
            color: #475467;
          }

          .hintBox {
            padding: 12px 14px;
            border-radius: 14px;
            background: #f8fafc;
            border: 1px solid #eef2f7;
            font-size: 13px;
            line-height: 1.45;
          }

          .pixGrid {
            display: grid;
            grid-template-columns: 280px minmax(0, 1fr);
            gap: 14px;
            align-items: stretch;
          }

          .qrCard,
          .pixCodeCard {
            border-radius: 22px;
            border: 1px solid #eef2f7;
            background: #fafbfc;
            padding: 16px;
          }

          .blockTitle {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #111827;
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 14px;
          }

          .qrWrap {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 12px;
            border-radius: 18px;
            background: #fff;
            border: 1px solid #eef2f7;
          }

          .pixTextarea {
            width: 100%;
            min-height: 140px;
            border-radius: 14px;
            border: 1px solid #d9dee7;
            padding: 14px;
            resize: none;
            outline: none;
            background: #fff;
            color: #111827;
            font-size: 13px;
            line-height: 1.5;
          }

          .pixTextarea:focus {
            border-color: #111827;
            box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
          }

          .pixButtons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 12px;
          }

          .copyBtn {
            width: 100%;
            background: #111827;
            color: #fff;
          }

          .verifyBtn {
            width: 100%;
            background: #027a48;
            color: #fff;
          }

          .smallText {
            margin: 10px 0 0;
            font-size: 12px;
            color: #667085;
            text-align: center;
            line-height: 1.45;
          }

          .formGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .formGrid3 {
            grid-template-columns: 1fr 1fr 1fr;
          }

          .field {
            display: grid;
            gap: 8px;
          }

          .field span {
            font-size: 13px;
            color: #475467;
            font-weight: 600;
          }

          .field input,
          .field select {
            width: 100%;
            min-height: 50px;
            padding: 0 14px;
            border-radius: 14px;
            border: 1px solid #d9dee7;
            background: #fff;
            color: #111827;
            outline: none;
            transition: 0.18s ease;
          }

          .field input:focus,
          .field select:focus {
            border-color: #111827;
            box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
          }

          .staticField {
            min-height: 50px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 0 2px;
          }

          .staticField strong {
            font-size: 18px;
            color: #111827;
          }

          .full {
            width: 100%;
          }

          .warningText {
            margin: 0;
            padding: 12px 14px;
            border-radius: 14px;
            background: #fff7ed;
            border: 1px solid #fed7aa;
            font-size: 13px;
            line-height: 1.45;
            color: #9a3412;
          }

          .sideCol {
            position: sticky;
            top: 110px;
            display: grid;
            gap: 14px;
          }

          .sideHeader {
            display: flex;
            gap: 12px;
            align-items: flex-start;
          }

          .sideHeader svg,
          .alertCard svg {
            color: #6b7280;
            flex-shrink: 0;
            margin-top: 2px;
          }

          .sideHeader strong,
          .alertCard strong {
            display: block;
            margin-bottom: 4px;
            color: #111827;
          }

          .sideHeader p,
          .alertCard p {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
            color: #667085;
          }

          .alertCard {
            display: flex;
            gap: 14px;
            align-items: flex-start;
          }

          .placeholder {
            min-height: 240px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            text-align: center;
            border-radius: 22px;
            border: 1px dashed #d9dee7;
            background: #fff;
            color: #667085;
            padding: 24px;
          }

          @media (max-width: 1100px) {
            .layout {
              grid-template-columns: 1fr;
            }

            .sideCol {
              position: relative;
              top: 0;
            }
          }

          @media (max-width: 900px) {
            .topCard {
              flex-direction: column;
            }

            .infoGrid,
            .pixGrid,
            .formGrid,
            .actionRow {
              grid-template-columns: 1fr;
            }

            .pixButtons {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .page {
              padding: 100px 14px 36px;
            }

            .topCard,
            .mainCard,
            .sideCard {
              padding: 18px;
              border-radius: 20px;
            }

            .paymentTabs {
              grid-template-columns: 1fr;
            }

            .formGrid3 {
              grid-template-columns: 1fr;
            }

            .qrWrap {
              padding: 14px;
            }

            .totalLine strong {
              font-size: 20px;
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}
