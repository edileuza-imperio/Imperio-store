"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    pedido?.status_pagamento ??
      pedido?.status ??
      pedido?.payment_status ??
      ""
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

  const valorTotal = useMemo(() => {
    return normalizarNumero(pedido?.valor_total ?? 0);
  }, [pedido]);

  const statusPagamento = useMemo(() => {
    return normalizarStatusPagamento(pedido);
  }, [pedido]);

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

  async function redirecionarParaPedidos() {
    setTimeout(() => {
      router.push("/Pedidos");
    }, 1800);
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
        setTimeout(() => {
          router.push("/Pedidos");
        }, 1800);
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
        {
          id_pedido: Number(pedidoId),
        },
        { withCredentials: true }
      );

      const data = res.data;

      const pedidoAtualizado = data?.dados?.pedido ?? data?.pedido ?? null;

      const statusRecebido = normalizarStatusPagamento(
        pedidoAtualizado ??
          (data?.status
            ? ({
                status_pagamento: data.status,
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
        if (!silencioso) {
          toast.error("Pagamento recusado ou cancelado.");
        }
        return;
      }

      setMensagemStatus("Pagamento ainda não confirmado.");
      if (!silencioso) {
        toast.info("Ainda não identificamos o pagamento.");
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
      setMensagemStatus("Não foi possível verificar o pagamento agora.");

      if (!silencioso) {
        toast.error("Não foi possível verificar o pagamento agora.");
      }
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
        alert("Pedido ou usuário não carregado.");
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
        alert("Não foi possível gerar o código PIX.");
        return;
      }

      setPixCode(qr);
      setMetodo("pix");
      setMensagemStatus("PIX gerado. Agora é só pagar e aguardar a confirmação.");
    } catch (error: any) {
      console.error("ERRO PIX:", error?.response?.data);
      alert(error?.response?.data?.dados?.erro || "Erro ao gerar PIX");
    } finally {
      setLoadingPix(false);
    }
  }

  async function pagarCartao() {
    try {
      setLoadingCartao(true);
      setMensagemStatus("");

      if (!pedido || !usuario) {
        alert("Pedido ou usuário não carregado.");
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
      alert("Pagamento com cartão enviado.");
    } catch (error: any) {
      console.error("❌ ERRO CARTÃO:", error?.response?.data);
      alert(error?.response?.data?.dados?.erro || "Erro ao processar cartão");
    } finally {
      setLoadingCartao(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);
    setCopiado(true);

    setTimeout(() => setCopiado(false), 1800);
  }

  useEffect(() => {
    if (pedidoId) carregarPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  useEffect(() => {
    if (!pedidoId) return;
    if (!pixCode) return;
    if (pagamentoConfirmado) return;

    const interval = setInterval(async () => {
      await verificarPagamentoNoServidor(true);
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
            <div className="card centerCard">
              <FiClock size={28} />
              <p>Carregando pagamento...</p>
            </div>
          </div>

          <style jsx global>{`
            .page {
              min-height: 100vh;
              padding: 120px 20px 60px;
              background:
                radial-gradient(circle at top left, rgba(192, 138, 122, 0.18), transparent 24%),
                radial-gradient(circle at top right, rgba(255, 255, 255, 0.55), transparent 22%),
                linear-gradient(180deg, #f7f1e6 0%, #f4eadf 100%);
            }

            .shell {
              max-width: 1280px;
              margin: 0 auto;
            }

            .card {
              background: rgba(255, 255, 255, 0.6);
              border: 1px solid rgba(233, 222, 214, 0.82);
              box-shadow:
                0 18px 50px rgba(59, 40, 32, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
              backdrop-filter: blur(18px);
              -webkit-backdrop-filter: blur(18px);
            }

            .centerCard {
              max-width: 560px;
              margin: 0 auto;
              text-align: center;
              border-radius: 28px;
              padding: 34px 26px;
              display: grid;
              gap: 10px;
              justify-items: center;
              color: #8c5a50;
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
            <div className="card centerCard">
              <h1>Pedido não encontrado</h1>
              <p>Não conseguimos localizar o pedido para pagamento.</p>
              <Link href="/Carrinho" className="secondaryBtn">
                <FiArrowLeft /> Voltar ao carrinho
              </Link>
            </div>
          </div>

          <style jsx global>{`
            .page {
              min-height: 100vh;
              padding: 120px 20px 60px;
              background:
                radial-gradient(circle at top left, rgba(192, 138, 122, 0.18), transparent 24%),
                radial-gradient(circle at top right, rgba(255, 255, 255, 0.55), transparent 22%),
                linear-gradient(180deg, #f7f1e6 0%, #f4eadf 100%);
            }

            .shell {
              max-width: 1280px;
              margin: 0 auto;
            }

            .card {
              background: rgba(255, 255, 255, 0.6);
              border: 1px solid rgba(233, 222, 214, 0.82);
              box-shadow:
                0 18px 50px rgba(59, 40, 32, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
              backdrop-filter: blur(18px);
              -webkit-backdrop-filter: blur(18px);
            }

            .centerCard {
              max-width: 560px;
              margin: 0 auto;
              text-align: center;
              border-radius: 28px;
              padding: 34px 26px;
              display: grid;
              gap: 10px;
              justify-items: center;
              color: #8c5a50;
            }

            .secondaryBtn {
              min-height: 54px;
              border-radius: 16px;
              text-decoration: none;
              border: none;
              font-weight: 700;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              cursor: pointer;
              transition: 0.22s ease;
              background: rgba(255, 255, 255, 0.7);
              color: #8c5a50;
              border: 1px solid rgba(192, 138, 122, 0.2);
              padding: 0 18px;
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
          <header className="hero card">
            <div className="heroLeft">
              <div className="eyebrow">
                <FiLock />
                <span>Pagamento seguro</span>
              </div>

              <h1>Finalize seu pedido</h1>
              <p>Escolha PIX ou cartão e conclua sua compra com segurança.</p>
            </div>

            <div className={`statusChip ${statusClass}`}>
              {statusLabel}
            </div>
          </header>

          {mensagemStatus && (
            <div className={`statusMessage card ${statusClass}`}>
              {mensagemStatus}
            </div>
          )}

          <div className="checkoutLayout">
            <section className="mainCol">
              <div className="card payCard">
                <div className="payHeader">
                  <div>
                    <h2>Checkout</h2>
                    <p>Layout horizontal para leitura rápida e visual mais limpo.</p>
                  </div>

                  {pagamentoConfirmado && (
                    <div className="successBadge">
                      <FiCheckCircle />
                      <span>Confirmado</span>
                    </div>
                  )}
                </div>

                <div className="infoRow">
                  <div className="infoCard clientCard">
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
                        <span>CPF: {(usuario?.cpf || "-").toString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="infoCard totalCard">
                    <div className="infoTitle">
                      <FiPackage />
                      <span>Resumo financeiro</span>
                    </div>

                    <div className="miniRows">
                      <div className="miniRow">
                        <span>Produtos</span>
                        <strong>{formatarMoeda(pedido.valor_produtos)}</strong>
                      </div>

                      <div className="miniRow">
                        <span>Frete</span>
                        <strong>{formatarMoeda(pedido.valor_frete ?? 0)}</strong>
                      </div>

                      <div className="miniRow">
                        <span>Desconto</span>
                        <strong>- {formatarMoeda(pedido.valor_desconto ?? 0)}</strong>
                      </div>
                    </div>

                    <div className="grandTotal">
                      <span>Total</span>
                      <strong>{formatarMoeda(pedido.valor_total)}</strong>
                    </div>
                  </div>
                </div>

                <div className="methodsWrap">
                  <button
                    type="button"
                    className={`methodBtn ${metodo === "pix" ? "active" : ""}`}
                    onClick={() => setMetodo("pix")}
                  >
                    <FiSmartphone />
                    PIX
                  </button>

                  <button
                    type="button"
                    className={`methodBtn ${metodo === "cartao" ? "active" : ""}`}
                    onClick={() => setMetodo("cartao")}
                  >
                    <FiCreditCard />
                    Cartão
                  </button>
                </div>

                <div className="panel">
                  {metodo === "pix" ? (
                    <div className="methodBox pixMethod">
                      <div className="actions">
                        <Link href="/Carrinho" className="secondaryBtn">
                          <FiArrowLeft />
                          Voltar ao carrinho
                        </Link>

                        <button
                          className="primaryBtn"
                          onClick={gerarPix}
                          disabled={loadingPix}
                        >
                          {loadingPix ? "Gerando PIX..." : "Gerar PIX"}
                          <FiRefreshCw />
                        </button>
                      </div>

                      <div className="note">
                        <FiShield />
                        <span>Seu pagamento por PIX é processado com segurança.</span>
                      </div>

                      {pixCode ? (
                        <div className="pixResult">
                          <div className="qrCard">
                            <div className="qrTitle">
                              <FiSmartphone />
                              <strong>Escaneie o QR Code</strong>
                            </div>

                            <div className="qrBox">
                              <QRCodeCanvas value={pixCode} size={220} />
                            </div>
                          </div>

                          <div className="pixCodeCard">
                            <div className="codeHeader">
                              <FiCopy />
                              <span>Código PIX copia e cola</span>
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

                            <p className="hint">
                              Esse botão consulta o backend e atualiza o pedido com o status real.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="placeholder">
                          <FiCheckCircle size={30} />
                          <p>O QR Code vai aparecer aqui após gerar o PIX.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="methodBox">
                      <div className="formGrid">
                        <label className="field">
                          <span>Número do cartão</span>
                          <input
                            value={cartao.numero}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, numero: e.target.value }))
                            }
                            placeholder="0000 0000 0000 0000"
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

                      <p className="warning">
                        O cartão em produção precisa de token gerado no front pelo Mercado Pago.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="sideCol">
              <div className="card sidebarCard">
                <div className="sidebarHeader">
                  <FiClock />
                  <div>
                    <strong>Resumo do pedido</strong>
                    <p>Informações rápidas, sem quebrar o layout horizontal.</p>
                  </div>
                </div>

                <div className="summaryMiniSide">
                  <div className="miniRow">
                    <span>Pedido</span>
                    <strong>#{pedido.id_pedido}</strong>
                  </div>

                  <div className="miniRow">
                    <span>Total</span>
                    <strong>{formatarMoeda(pedido.valor_total)}</strong>
                  </div>

                  <div className="miniRow">
                    <span>Status</span>
                    <strong>{statusLabel}</strong>
                  </div>
                </div>
              </div>

              <div className="card sidebarCard warningCard">
                <FiAlertCircle />
                <div>
                  <strong>Dica importante</strong>
                  <p>
                    O botão “Já paguei” só consulta o backend. Ele não confirma sozinho.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={1800} />

        <style jsx global>{`
          .page {
            min-height: 100vh;
            padding: 120px 20px 60px;
            background:
              radial-gradient(circle at top left, rgba(192, 138, 122, 0.18), transparent 24%),
              radial-gradient(circle at top right, rgba(255, 255, 255, 0.55), transparent 22%),
              linear-gradient(180deg, #f7f1e6 0%, #f4eadf 100%);
          }

          .shell {
            max-width: 1280px;
            margin: 0 auto;
          }

          .card {
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(233, 222, 214, 0.82);
            box-shadow:
              0 18px 50px rgba(59, 40, 32, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }

          .hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 24px 26px;
            border-radius: 26px;
            margin-bottom: 14px;
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(192, 138, 122, 0.12);
            color: #8c5a50;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 14px;
          }

          .hero h1 {
            margin: 0;
            font-size: clamp(28px, 4vw, 44px);
            line-height: 1.05;
            color: #8c5a50;
            letter-spacing: -0.03em;
          }

          .hero p {
            margin: 10px 0 0;
            color: rgba(43, 43, 43, 0.72);
            font-size: 15px;
          }

          .statusChip,
          .statusMessage {
            white-space: nowrap;
            padding: 12px 16px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 13px;
            border: 1px solid transparent;
          }

          .statusMessage {
            margin-bottom: 18px;
            white-space: normal;
            border-radius: 18px;
            font-weight: 600;
          }

          .statusChip.pending,
          .statusMessage.pending {
            background: rgba(255, 235, 205, 0.72);
            color: #8c5a50;
            border-color: rgba(192, 138, 122, 0.18);
          }

          .statusChip.ok,
          .statusMessage.ok {
            background: rgba(46, 204, 113, 0.12);
            color: #1f7a43;
            border-color: rgba(46, 204, 113, 0.2);
          }

          .statusChip.error,
          .statusMessage.error {
            background: rgba(231, 76, 60, 0.12);
            color: #c0392b;
            border-color: rgba(231, 76, 60, 0.2);
          }

          .checkoutLayout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 320px;
            gap: 22px;
            align-items: start;
          }

          .mainCol,
          .sideCol {
            min-width: 0;
          }

          .payCard,
          .sidebarCard {
            border-radius: 26px;
            padding: 22px;
          }

          .payHeader {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }

          .payHeader h2 {
            margin: 0;
            font-size: 24px;
            color: #8c5a50;
            letter-spacing: -0.03em;
          }

          .payHeader p {
            margin: 8px 0 0;
            color: rgba(43, 43, 43, 0.65);
            font-size: 14px;
          }

          .successBadge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border-radius: 999px;
            background: rgba(46, 204, 113, 0.12);
            border: 1px solid rgba(46, 204, 113, 0.18);
            color: #1f7a43;
            font-weight: 700;
            font-size: 13px;
          }

          .infoRow {
            margin-top: 18px;
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
            gap: 14px;
          }

          .infoCard {
            border-radius: 20px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.56);
            border: 1px solid rgba(233, 222, 214, 0.9);
          }

          .totalCard {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .infoTitle {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #8c5a50;
            font-size: 13px;
            font-weight: 700;
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
          }

          .buyerInfo {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .buyerInfo strong {
            font-size: 15px;
            color: #2b2b2b;
          }

          .buyerInfo span {
            font-size: 13px;
            color: rgba(43, 43, 43, 0.65);
          }

          .miniRows,
          .summaryMiniSide {
            display: grid;
            gap: 12px;
          }

          .miniRow {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            color: rgba(43, 43, 43, 0.82);
            font-size: 14px;
          }

          .miniRow strong {
            color: #2b2b2b;
          }

          .grandTotal {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid rgba(233, 222, 214, 0.95);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
          }

          .grandTotal span {
            font-size: 16px;
            font-weight: 700;
          }

          .grandTotal strong {
            font-size: 24px;
            color: #8c5a50;
          }

          .methodsWrap {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .methodBtn {
            border: 1px solid rgba(192, 138, 122, 0.22);
            background: rgba(255, 255, 255, 0.72);
            color: #8c5a50;
            border-radius: 18px;
            min-height: 58px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-weight: 700;
            transition: 0.22s ease;
          }

          .methodBtn:hover {
            transform: translateY(-2px);
            border-color: rgba(192, 138, 122, 0.5);
          }

          .active {
            background: linear-gradient(135deg, #c08a7a 0%, #a96d61 100%);
            color: #fff;
            border-color: transparent;
            box-shadow: 0 14px 24px rgba(160, 107, 95, 0.22);
          }

          .panel {
            margin-top: 18px;
          }

          .methodBox {
            display: grid;
            gap: 16px;
          }

          .pixMethod {
            gap: 16px;
          }

          .actions {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 12px;
          }

          .primaryBtn,
          .secondaryBtn,
          .copyBtn,
          .verifyBtn {
            min-height: 54px;
            border-radius: 16px;
            border: none;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            transition: 0.22s ease;
            text-decoration: none;
          }

          .primaryBtn {
            background: linear-gradient(135deg, #c08a7a 0%, #a96d61 100%);
            color: #fff;
            box-shadow: 0 16px 28px rgba(160, 107, 95, 0.24);
            padding: 0 18px;
          }

          .primaryBtn:hover {
            transform: translateY(-2px);
          }

          .primaryBtn:disabled {
            opacity: 0.7;
            cursor: progress;
            transform: none;
          }

          .secondaryBtn {
            background: rgba(255, 255, 255, 0.7);
            color: #8c5a50;
            border: 1px solid rgba(192, 138, 122, 0.2);
            padding: 0 18px;
          }

          .secondaryBtn:hover {
            transform: translateY(-2px);
            border-color: rgba(192, 138, 122, 0.55);
          }

          .note,
          .warning {
            display: flex;
            gap: 14px;
            align-items: flex-start;
            color: rgba(43, 43, 43, 0.76);
          }

          .note {
            margin: 0;
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(192, 138, 122, 0.1);
            font-size: 13px;
            line-height: 1.45;
          }

          .sidebarCard {
            display: grid;
            gap: 18px;
          }

          .sidebarHeader {
            display: flex;
            gap: 12px;
            align-items: flex-start;
          }

          .sidebarHeader svg,
          .warningCard svg {
            color: #c08a7a;
            flex-shrink: 0;
            margin-top: 2px;
          }

          .sidebarHeader strong,
          .warningCard strong {
            display: block;
            margin-bottom: 4px;
            color: #2b2b2b;
          }

          .sidebarHeader p,
          .warningCard p {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
            color: rgba(43, 43, 43, 0.72);
          }

          .warningCard {
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
            border: 1px dashed rgba(192, 138, 122, 0.35);
            background: rgba(255, 255, 255, 0.45);
            color: rgba(43, 43, 43, 0.65);
            padding: 24px;
          }

          .pixResult {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 14px;
            align-items: stretch;
          }

          .qrCard,
          .pixCodeCard {
            border-radius: 22px;
            border: 1px solid rgba(233, 222, 214, 0.95);
            background: rgba(255, 255, 255, 0.72);
            padding: 16px;
          }

          .qrTitle,
          .codeHeader {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #8c5a50;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 14px;
          }

          .qrBox {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px;
            border-radius: 18px;
            background: #fff;
          }

          .pixTextarea {
            width: 100%;
            min-height: 140px;
            border-radius: 16px;
            border: 1px solid rgba(233, 222, 214, 0.95);
            padding: 14px;
            resize: none;
            outline: none;
            background: rgba(255, 255, 255, 0.86);
            color: #2b2b2b;
            font-size: 13px;
            line-height: 1.5;
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
            padding: 0 18px;
          }

          .copyBtn:hover {
            transform: translateY(-2px);
          }

          .verifyBtn {
            width: 100%;
            background: linear-gradient(135deg, #2f855a 0%, #256d48 100%);
            color: #fff;
            box-shadow: 0 16px 28px rgba(37, 109, 72, 0.18);
            padding: 0 18px;
          }

          .verifyBtn:hover {
            transform: translateY(-2px);
          }

          .verifyBtn:disabled {
            opacity: 0.7;
            cursor: progress;
            transform: none;
          }

          .hint {
            margin: 10px 0 0;
            font-size: 12px;
            color: rgba(43, 43, 43, 0.62);
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
            color: rgba(43, 43, 43, 0.72);
            font-weight: 600;
          }

          .field input,
          .field select {
            width: 100%;
            min-height: 50px;
            padding: 0 14px;
            border-radius: 14px;
            border: 1px solid rgba(233, 222, 214, 0.98);
            background: rgba(255, 255, 255, 0.82);
            color: #2b2b2b;
            outline: none;
            transition: 0.2s;
          }

          .field input:focus,
          .field select:focus {
            border-color: rgba(192, 138, 122, 0.7);
            box-shadow: 0 0 0 4px rgba(192, 138, 122, 0.12);
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
            color: #8c5a50;
          }

          .full {
            width: 100%;
          }

          .warning {
            margin: 0;
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(17, 24, 39, 0.06);
            font-size: 13px;
            line-height: 1.45;
          }

          .sideCol {
            position: sticky;
            top: 110px;
            display: grid;
            gap: 14px;
          }

          @media (max-width: 1100px) {
            .checkoutLayout {
              grid-template-columns: 1fr;
            }

            .sideCol {
              position: relative;
              top: 0;
            }
          }

          @media (max-width: 900px) {
            .infoRow,
            .pixResult,
            .formGrid {
              grid-template-columns: 1fr;
            }

            .actions,
            .pixButtons {
              grid-template-columns: 1fr;
            }

            .hero {
              flex-direction: column;
              align-items: flex-start;
            }
          }

          @media (max-width: 768px) {
            .page {
              padding: 104px 14px 36px;
            }

            .hero,
            .payCard,
            .sidebarCard {
              padding: 18px;
              border-radius: 22px;
            }

            .methodsWrap {
              grid-template-columns: 1fr;
            }

            .formGrid3 {
              grid-template-columns: 1fr;
            }

            .qrBox {
              padding: 14px;
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}