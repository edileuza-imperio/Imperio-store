"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/Api/conectar";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import { ToastContainer, toast } from "react-toastify";
import {
  FiCreditCard,
  FiShoppingBag,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiRefreshCw,
  FiPackage,
  FiZap,
  FiCopy,
  FiExternalLink,
  FiCalendar,
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
  preference_id?: string | null;
  payment_id?: string | null;
  external_reference?: string | null;
  metodo_pagamento?: string | null;
  status_pagamento?: string | null;
  status_detail?: string | null;
  data_aprovacao?: string | null;
  criado_em?: string;
  atualizado_em?: string;
  init_point?: string | null;
  sandbox_init_point?: string | null;
  url_pagamento?: string | null;
  payment_url?: string | null;
};

function num(v: any): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const raw = String(v ?? "").trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d,.-]/g, "");
  let normalized = cleaned;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string | null) {
  if (!data) return "-";

  const dt = new Date(String(data).replace(" ", "T"));
  if (Number.isNaN(dt.getTime())) return String(data);

  return dt.toLocaleString("pt-BR");
}

function getStatusPagamentoTexto(status?: string | null) {
  if (!status) return "Pendente";

  const s = status.toLowerCase();

  if (s === "approved" || s === "aprovado") return "Aprovado";
  if (s === "pending" || s === "pendente") return "Pendente";
  if (s === "rejected" || s === "recusado") return "Recusado";
  if (s === "cancelled" || s === "cancelado") return "Cancelado";
  if (s === "in_process") return "Em análise";

  return status;
}

function getStatusClass(status?: string | null) {
  const s = (status || "").toLowerCase();

  if (s === "approved" || s === "aprovado") return "aprovado";
  if (s === "rejected" || s === "recusado") return "recusado";
  if (s === "cancelled" || s === "cancelado") return "cancelado";
  if (s === "in_process") return "analise";

  return "pendente";
}

function getStatusIcon(status?: string | null) {
  const s = (status || "").toLowerCase();

  if (s === "approved" || s === "aprovado") return <FiCheckCircle size={18} />;
  if (s === "rejected" || s === "recusado") return <FiXCircle size={18} />;
  if (s === "cancelled" || s === "cancelado") return <FiXCircle size={18} />;

  return <FiClock size={18} />;
}

function extrairPedido(data: any): Pedido | null {
  if (!data) return null;

  const base = data?.dados ?? data;

  if (base?.pedido) return base.pedido;
  if (base?.dados?.pedido) return base.dados.pedido;
  if (base?.dados && !Array.isArray(base.dados) && base.dados.id_pedido) return base.dados;
  if (base?.id_pedido) return base;

  return null;
}

function extrairUrlPagamento(data: any): string | null {
  const base = data?.dados ?? data ?? {};

  return (
    base?.redirect ||
    base?.url ||
    base?.init_point ||
    base?.sandbox_init_point ||
    base?.url_pagamento ||
    base?.payment_url ||
    base?.pedido?.init_point ||
    base?.pedido?.sandbox_init_point ||
    base?.pedido?.url_pagamento ||
    base?.pedido?.payment_url ||
    null
  );
}

function extrairPix(data: any) {
  const base = data?.dados ?? data ?? {};
  const pix = base?.pix ?? {};

  return {
    qrCode: pix?.qr_code ?? null,
    qrCodeBase64: pix?.qr_code_base64 ?? null,
    ticketUrl: pix?.ticket_url ?? null,
  };
}

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const [loading, setLoading] = React.useState(true);
  const [carregandoPagamento, setCarregandoPagamento] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [pedido, setPedido] = React.useState<Pedido | null>(null);
  const [paymentUrl, setPaymentUrl] = React.useState<string | null>(null);
  const [metodoPagamento, setMetodoPagamento] = React.useState<"pix" | "cartao" | null>(null);

  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = React.useState<string | null>(null);
  const [ticketUrl, setTicketUrl] = React.useState<string | null>(null);

  async function carregarPedido() {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get(`/pedido/${id}`);
      const pedidoExtraido = extrairPedido(response.data);
      const url = extrairUrlPagamento(response.data);

      setPedido(pedidoExtraido);
      setPaymentUrl(url);

      if (pedidoExtraido?.metodo_pagamento) {
        const metodo = String(pedidoExtraido.metodo_pagamento).toLowerCase();
        if (metodo.includes("pix")) setMetodoPagamento("pix");
        if (metodo.includes("cart")) setMetodoPagamento("cartao");
      }

      if (!pedidoExtraido) {
        setErro("Pedido não encontrado.");
      }
    } catch (error: any) {
      setErro(
        error?.response?.data?.mensagem || "Não foi possível carregar o pedido."
      );
      setPedido(null);
      setPaymentUrl(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (id) {
      carregarPedido();
    }
  }, [id]);

  function limparPix() {
    setQrCode(null);
    setQrCodeBase64(null);
    setTicketUrl(null);
  }

  async function gerarPix() {
    try {
      setCarregandoPagamento(true);
      limparPix();

      const total = num(pedido?.valor_total);

      if (total <= 0) {
        toast.error("Valor do pedido inválido para gerar PIX.");
        return;
      }

      const response = await api.post("/mercado/pagamento/pix", {
        valor: total,
        descricao: `Pedido #${id}`,
        email: "cliente@teste.com",
        nome: "Cliente",
        sobrenome: "Checkout",
        cpf: "19119119100",
      });

      const pix = extrairPix(response.data);

      setQrCode(pix.qrCode);
      setQrCodeBase64(pix.qrCodeBase64);
      setTicketUrl(pix.ticketUrl);

      if (!pix.qrCodeBase64 && !pix.qrCode) {
        toast.warning("O QR Code PIX não foi retornado pela API.");
        return;
      }

      toast.success("QR Code PIX gerado com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.dados?.erro ||
          error?.response?.data?.erro ||
          "Não foi possível gerar o PIX."
      );
    } finally {
      setCarregandoPagamento(false);
    }
  }

  async function handleIrParaPagamento() {
    if (!metodoPagamento) {
      toast.warning("Selecione um método de pagamento.");
      return;
    }

    if (metodoPagamento === "pix") {
      await gerarPix();
      return;
    }

    try {
      setCarregandoPagamento(true);

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      const response = await api.post(`/pedido/${id}/pagamento`, {
        metodo: metodoPagamento,
      });

      const url = extrairUrlPagamento(response.data);

      if (url) {
        window.location.href = url;
        return;
      }

      toast.warning("A API não retornou a URL de pagamento.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.mensagem ||
          "Não foi possível iniciar o pagamento."
      );
    } finally {
      setCarregandoPagamento(false);
    }
  }

  async function copiarPix() {
    if (!qrCode) {
      toast.warning("Nenhum código PIX disponível para copiar.");
      return;
    }

    try {
      await navigator.clipboard.writeText(qrCode);
      toast.success("Código PIX copiado!");
    } catch {
      toast.error("Não foi possível copiar o código PIX.");
    }
  }

  function handleFinalizarPedido() {
    toast.success("Pedido finalizado!");
    router.push("/pagamento/sucesso");
  }

  const subtotal = num(pedido?.valor_produtos);
  const desconto = num(pedido?.valor_desconto);
  const frete = num(pedido?.valor_frete);
  const total = num(pedido?.valor_total);

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" autoClose={2500} theme="dark" />

      <style jsx global>{`
        body {
          background:
            radial-gradient(circle at top left, rgba(181, 95, 83, 0.08), transparent 24%),
            linear-gradient(180deg, #fffaf7 0%, #fff5ef 55%, #ffefe8 100%);
        }

        .pagamento-page {
          padding: 34px 0 72px;
        }

        .container-pagamento {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 18px;
        }

        .surface {
          background: rgba(255, 255, 255, 0.97);
          border-radius: 24px;
          border: 1px solid rgba(229, 213, 203, 0.95);
          box-shadow: 0 18px 40px rgba(115, 82, 62, 0.08);
        }

        .hero {
          padding: 24px 28px;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          background: linear-gradient(135deg, rgba(181, 95, 83, 0.98), rgba(143, 67, 58, 0.98));
          color: #fff;
        }

        .hero-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hero-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
        }

        .hero h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .hero p {
          margin: 6px 0 0;
          color: rgba(255, 255, 255, 0.92);
          font-size: 14px;
        }

        .hero-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          font-weight: 800;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(380px, 0.85fr);
          gap: 22px;
          align-items: start;
        }

        .box {
          padding: 24px;
        }

        .sticky-col {
          position: sticky;
          top: 18px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          font-size: 21px;
          color: #3f2d26;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .section-title svg {
          color: #b55f53;
        }

        .status-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 18px;
        }

        .status-box.pendente {
          background: #fff2e8;
          color: #c26528;
        }

        .status-box.aprovado {
          background: #eafaf1;
          color: #1f7a49;
        }

        .status-box.recusado {
          background: #fff1f2;
          color: #c13552;
        }

        .status-box.cancelado {
          background: #f3f4f6;
          color: #556070;
        }

        .status-box.analise {
          background: #eef4ff;
          color: #315fd3;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .meta-card {
          background: #fffaf7;
          border: 1px solid #f0e4dc;
          border-radius: 18px;
          padding: 16px;
          min-height: 96px;
        }

        .meta-card span {
          display: block;
          font-size: 12px;
          color: #8b6b5d;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .meta-card strong {
          color: #3f2d26;
          font-size: 15px;
          word-break: break-word;
          line-height: 1.4;
        }

        .highlight {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          margin-bottom: 18px;
          border-radius: 16px;
          background: linear-gradient(135deg, #fff4ee, #fffaf7);
          border: 1px solid #f0ddd2;
          color: #6c564c;
          font-weight: 700;
          font-size: 14px;
        }

        .highlight svg {
          color: #b55f53;
          flex-shrink: 0;
        }

        .metodos h3 {
          font-size: 15px;
          font-weight: 900;
          margin-bottom: 12px;
          color: #5c2e2e;
        }

        .metodos-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .metodo {
          border: 2px solid #f1d6cf;
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s ease;
          font-weight: 800;
          color: #4b372f;
          min-height: 92px;
        }

        .metodo:hover {
          border-color: #b55f53;
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(185, 101, 88, 0.08);
        }

        .metodo.ativo {
          border-color: #b55f53;
          background: #fff3ef;
          box-shadow: 0 0 0 3px rgba(181, 95, 83, 0.12);
        }

        .metodo-topo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          font-size: 15px;
          font-weight: 900;
        }

        .metodo span {
          display: block;
          font-size: 12px;
          color: #8a6a60;
          margin-top: 4px;
          line-height: 1.45;
        }

        .pix-box {
          margin-top: 18px;
          padding: 18px;
          border-radius: 20px;
          background: linear-gradient(180deg, #fffaf7 0%, #fff 100%);
          border: 1px solid #f0ddd2;
        }

        .pix-box h4 {
          margin: 0 0 14px;
          font-size: 18px;
          color: #4b372f;
          font-weight: 900;
          text-align: center;
        }

        .pix-qr-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .pix-qr {
          width: 260px;
          height: 260px;
          object-fit: contain;
          background: #fff;
          padding: 12px;
          border-radius: 22px;
          border: 1px solid #ead9cf;
          box-shadow: 0 12px 26px rgba(115, 82, 62, 0.08);
        }

        .pix-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          background: #fff2e8;
          color: #c26528;
          font-size: 12px;
          font-weight: 800;
        }

        .pix-copy-area {
          margin-top: 12px;
        }

        .pix-copy-area label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 800;
          color: #5f4a42;
        }

        .pix-copy-area textarea {
          width: 100%;
          min-height: 108px;
          resize: vertical;
          border-radius: 14px;
          border: 1px solid #e2d2c9;
          padding: 14px;
          font-size: 12px;
          line-height: 1.5;
          color: #3f2d26;
          background: #fff;
          outline: none;
        }

        .pix-acoes {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 14px;
        }

        .summary-card {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #ead9cf;
        }

        .summary-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          color: #6c564c;
          margin-bottom: 12px;
        }

        .summary-line strong {
          color: #3f2d26;
        }

        .summary-total {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #ead9cf;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .summary-total span {
          font-size: 15px;
          color: #5f4a42;
          font-weight: 800;
        }

        .summary-total strong {
          font-size: 28px;
          color: #a84f45;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .btn-brand {
          background: linear-gradient(135deg, #b55f53 0%, #8f433a 100%);
          color: white;
          border: none;
          border-radius: 16px;
          min-height: 52px;
          font-weight: 900;
          box-shadow: 0 14px 24px rgba(143, 67, 58, 0.18);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
        }

        .btn-brand:hover {
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 18px 30px rgba(143, 67, 58, 0.26);
        }

        .btn-outline-brand {
          border: 1px solid #caa998;
          color: #8b5a49;
          background: #fff;
          border-radius: 16px;
          min-height: 50px;
          font-weight: 900;
          width: 100%;
        }

        .btn-outline-brand:hover {
          background: #fff7f3;
          color: #8b5a49;
        }

        .state-box {
          padding: 30px;
          border-radius: 22px;
          background: #fffaf7;
          border: 1px dashed #e7cfc1;
          color: #7e665b;
          text-align: center;
        }

        @media (max-width: 1100px) {
          .layout-grid {
            grid-template-columns: 1fr;
          }

          .sticky-col {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .pagamento-page {
            padding: 22px 0 54px;
          }

          .container-pagamento {
            padding: 0 14px;
          }

          .hero {
            padding: 22px 18px;
          }

          .hero h1 {
            font-size: 24px;
          }

          .box {
            padding: 18px;
          }

          .meta-grid,
          .metodos-grid {
            grid-template-columns: 1fr;
          }

          .pix-qr {
            width: 220px;
            height: 220px;
          }

          .summary-total strong {
            font-size: 24px;
          }
        }
      `}</style>

      <main className="pagamento-page">
        <div className="container-pagamento">
          <div className="surface hero">
            <div className="hero-left">
              <div className="hero-icon">
                <FiCreditCard size={26} />
              </div>
              <div>
                <h1>Pagamento do pedido</h1>
                <p>Selecione o método de pagamento e conclua sua compra com segurança.</p>
              </div>
            </div>

            <div className="hero-chip">Pedido #{id}</div>
          </div>

          {erro ? (
            <div className="surface box">
              <div className="state-box">{erro}</div>
            </div>
          ) : !pedido ? (
            <div className="surface box">
              <div className="state-box">Carregando informações do pedido...</div>
            </div>
          ) : (
            <div className="layout-grid">
              <div>
                <div className="surface box">
                  <h2 className="section-title">
                    <FiShoppingBag size={20} />
                    <span>Informações do pedido</span>
                  </h2>

                  <div className={`status-box ${getStatusClass(pedido.status_pagamento)}`}>
                    {getStatusIcon(pedido.status_pagamento)}
                    {getStatusPagamentoTexto(pedido.status_pagamento)}
                  </div>

                  <div className="meta-grid">
                    <div className="meta-card">
                      <span>Código do pedido</span>
                      <strong>Pedido #{pedido.id_pedido ?? id}</strong>
                    </div>

                    <div className="meta-card">
                      <span>Método atual</span>
                      <strong>{pedido.metodo_pagamento || "Ainda não selecionado"}</strong>
                    </div>

                    <div className="meta-card">
                      <span>
                        <FiCalendar style={{ marginRight: 6 }} />
                        Criado em
                      </span>
                      <strong>{formatarData(pedido.criado_em)}</strong>
                    </div>

                    <div className="meta-card">
                      <span>
                        <FiCalendar style={{ marginRight: 6 }} />
                        Atualizado em
                      </span>
                      <strong>{formatarData(pedido.atualizado_em)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky-col">
                <div className="surface box">
                  <h2 className="section-title">
                    <FiCreditCard size={20} />
                    <span>Pagamento</span>
                  </h2>

                  <div className="highlight">
                    <FiPackage size={18} />
                    <span>Escolha o método para continuar.</span>
                  </div>

                  <div className="metodos">
                    <h3>Selecione o método</h3>

                    <div className="metodos-grid">
                      <button
                        type="button"
                        className={`metodo ${metodoPagamento === "pix" ? "ativo" : ""}`}
                        onClick={() => setMetodoPagamento("pix")}
                      >
                        <div className="metodo-topo">
                          <FiZap size={18} />
                          <span style={{ margin: 0, fontSize: 15, color: "inherit" }}>
                            PIX
                          </span>
                        </div>
                        <span>Gera QR Code para escanear e código copia e cola</span>
                      </button>

                      <button
                        type="button"
                        className={`metodo ${metodoPagamento === "cartao" ? "ativo" : ""}`}
                        onClick={() => {
                          limparPix();
                          setMetodoPagamento("cartao");
                        }}
                      >
                        <div className="metodo-topo">
                          <FiCreditCard size={18} />
                          <span style={{ margin: 0, fontSize: 15, color: "inherit" }}>
                            Cartão
                          </span>
                        </div>
                        <span>Segue o fluxo online da sua integração</span>
                      </button>
                    </div>
                  </div>

                  {metodoPagamento === "pix" && qrCodeBase64 && (
                    <div className="pix-box">
                      <h4>Escaneie o QR Code PIX</h4>

                      <div className="pix-qr-wrap">
                        <img
                          src={`data:image/jpeg;base64,${qrCodeBase64}`}
                          alt="QR Code PIX"
                          className="pix-qr"
                        />

                        <div className="pix-status">
                          <FiCheckCircle size={16} />
                          QR Code gerado com sucesso
                        </div>
                      </div>

                      <div className="pix-copy-area">
                        <label>Código PIX copia e cola</label>
                        <textarea readOnly value={qrCode || ""} />
                      </div>

                      <div className="pix-acoes">
                        <button
                          type="button"
                          className="btn btn-brand"
                          onClick={copiarPix}
                        >
                          <FiCopy style={{ marginRight: 8 }} />
                          Copiar código PIX
                        </button>

                        {ticketUrl && (
                          <a
                            href={ticketUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-brand"
                            style={{
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 18px"
                            }}
                          >
                            <FiExternalLink style={{ marginRight: 8 }} />
                            Abrir página do pagamento
                          </a>
                        )}

                        <button
                          type="button"
                          className="btn btn-brand"
                          onClick={handleFinalizarPedido}
                        >
                          <FiCheckCircle style={{ marginRight: 8 }} />
                          Finalizar pedido
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="summary-card">
                    <div className="summary-line">
                      <span>Produtos</span>
                      <strong>{formatBRL(subtotal)}</strong>
                    </div>

                    <div className="summary-line">
                      <span>Desconto</span>
                      <strong>{desconto > 0 ? `- ${formatBRL(desconto)}` : formatBRL(0)}</strong>
                    </div>

                    <div className="summary-line">
                      <span>Frete</span>
                      <strong>{frete > 0 ? formatBRL(frete) : "Grátis"}</strong>
                    </div>

                    <div className="summary-total">
                      <span>Total</span>
                      <strong>{formatBRL(total)}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-brand"
                    style={{ marginTop: 18 }}
                    onClick={handleIrParaPagamento}
                    disabled={!metodoPagamento || carregandoPagamento}
                  >
                    {!metodoPagamento
                      ? "Selecione um método"
                      : metodoPagamento === "pix"
                      ? carregandoPagamento
                        ? "Gerando QR Code PIX..."
                        : "Gerar QR Code PIX"
                      : carregandoPagamento
                      ? "Iniciando pagamento..."
                      : "Pagar com Cartão"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-brand"
                    style={{ marginTop: 10 }}
                    onClick={carregarPedido}
                  >
                    <FiRefreshCw style={{ marginRight: 8 }} />
                    Atualizar pedido
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}