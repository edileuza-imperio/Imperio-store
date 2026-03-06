"use client";

import React from "react";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import api from "@/Api/conectar";
import "bootstrap/dist/css/bootstrap.min.css";

import { maskCardNumber, maskExpiry } from "@/hooks/useCarrinhoCheckout";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  EnderecoDB,
  Endereco,
  Cupom,
  PixPayload,
} from "@/components/Bibioteca/Bibiotecas";
import { formatBRL } from "@/components/Bibioteca/functions";

type CarrinhoItem = {
  id_item: number;
  nome_produto: string;
  preco_unitario: number | string;
  quantidade: number;
  imagem?: string;
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

function pickCarrinho(resp: any): { itens: CarrinhoItem[]; endereco: any | null } {
  const base = resp?.dados ?? resp?.data ?? resp;
  const itens = Array.isArray(base?.itens) ? base.itens : [];
  const endereco = base?.endereco ?? null;

  return { itens, endereco };
}

function enderecoResumo(e: EnderecoDB) {
  const linha1 =
    `${e.rua ?? ""}, ${e.numero ?? ""}` +
    (e.complemento ? ` - ${e.complemento}` : "");

  const linha2 = `${e.bairro ?? ""} • ${e.cidade ?? ""}/${e.estado ?? ""}`;
  const linha3 = e.cep ? `CEP: ${e.cep}` : "";

  return {
    linha1: linha1.trim(),
    linha2: linha2.trim(),
    linha3,
  };
}

export default function CheckoutPage() {
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  const [itens, setItens] = React.useState<CarrinhoItem[]>([]);
  const [endereco, setEndereco] = React.useState<Endereco>({ estado: "SP" });

  const [cupomInput, setCupomInput] = React.useState("");
  const [cupomAplicado, setCupomAplicado] = React.useState<Cupom | null>(null);
  const [cupomLoading, setCupomLoading] = React.useState(false);

  const [metodoPagamento, setMetodoPagamento] = React.useState<"pix" | "cartao">("cartao");
  const [processing, setProcessing] = React.useState(false);

  const [cardName, setCardName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCVV, setCardCVV] = React.useState("");

  const [pixPayload, setPixPayload] = React.useState<PixPayload | null>(null);
  const [pixSolicitado, setPixSolicitado] = React.useState(false);
  const [pixGerandoAutomatico, setPixGerandoAutomatico] = React.useState(false);

  const [enderecos, setEnderecos] = React.useState<EnderecoDB[]>([]);
  const [enderecosLoading, setEnderecosLoading] = React.useState(false);

  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = React.useState<number | null>(null);
  const [mostrarFormularioEndereco, setMostrarFormularioEndereco] = React.useState(false);

  const [pedidoConcluido, setPedidoConcluido] = React.useState(false);

  const itensArray = Array.isArray(itens) ? itens : [];

  const subtotal = React.useMemo(() => {
    return itensArray.reduce((acc, item) => {
      return acc + num(item.preco_unitario) * (item.quantidade || 1);
    }, 0);
  }, [itensArray]);

  const descontoValor = React.useMemo(() => {
    if (!cupomAplicado) return 0;

    if (cupomAplicado.tipo === "percentual") {
      return subtotal * (cupomAplicado.valor / 100);
    }

    return cupomAplicado.valor || 0;
  }, [cupomAplicado, subtotal]);

  const total = Math.max(subtotal - descontoValor, 0);

  function isCardValid(): boolean {
    const digits = cardNumber.replace(/\D/g, "");

    if (digits.length < 13) return false;
    if (!cardName.trim()) return false;
    if (!/^\d{3,4}$/.test(cardCVV)) return false;

    const [mm, yy] = cardExpiry.split("/");
    const m = Number(mm);
    const y = Number(`20${yy}`);

    if (!m || m < 1 || m > 12) return false;
    if (!y || String(yy || "").length !== 2) return false;

    const now = new Date();
    const exp = new Date(y, m - 1, 1);

    if (exp < new Date(now.getFullYear(), now.getMonth(), 1)) return false;

    return true;
  }

  async function carregarEnderecosSalvos() {
    setEnderecosLoading(true);

    try {
      const resp = await api.get("/carrinho/enderecos");
      const base = resp.data?.dados ?? resp.data?.data ?? resp.data;

      const list: EnderecoDB[] = Array.isArray(base)
        ? base
        : Array.isArray(base?.enderecos)
          ? base.enderecos
          : [];

      setEnderecos(list);

      if (list.length > 0) {
        const primeiro = list[0];

        setMostrarFormularioEndereco(false);
        setEnderecoSelecionadoId(primeiro.id_endereco);

        setEndereco({
          cep: primeiro.cep ?? "",
          rua: primeiro.rua ?? "",
          numero: primeiro.numero ?? "",
          complemento: primeiro.complemento ?? "",
          bairro: primeiro.bairro ?? "",
          cidade: primeiro.cidade ?? "",
          estado: primeiro.estado ?? "SP",
        });
      } else {
        setEnderecos([]);
        setEnderecoSelecionadoId(null);
        setMostrarFormularioEndereco(true);
        setEndereco({ estado: "SP" });
      }
    } catch {
      setEnderecos([]);
      setEnderecoSelecionadoId(null);
      setMostrarFormularioEndereco(true);
      setEndereco({ estado: "SP" });
    } finally {
      setEnderecosLoading(false);
    }
  }

  async function carregarTudo() {
    setLoading(true);
    setErro(null);

    try {
      await api.get("/me");
      await carregarEnderecosSalvos();

      const carrinhoRes = await api.get("/carrinho");
      const parsed = pickCarrinho(carrinhoRes.data);

      setItens(parsed.itens || []);

      if (parsed.endereco) {
        setEndereco((prev) => ({
          cep: prev.cep || parsed.endereco.cep || "",
          rua: prev.rua || parsed.endereco.rua || "",
          numero: prev.numero || parsed.endereco.numero || "",
          complemento: prev.complemento || parsed.endereco.complemento || "",
          bairro: prev.bairro || parsed.endereco.bairro || "",
          cidade: prev.cidade || parsed.endereco.cidade || "",
          estado: prev.estado || parsed.endereco.estado || "SP",
        }));
      }
    } catch (e: any) {
      setErro(e?.response?.data?.mensagem || e?.message || "Erro ao carregar checkout.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    carregarTudo();
  }, []);

  React.useEffect(() => {
    if (!enderecoSelecionadoId) return;

    const escolhido = enderecos.find((e) => e.id_endereco === enderecoSelecionadoId);
    if (!escolhido) return;

    setEndereco({
      cep: escolhido.cep ?? "",
      rua: escolhido.rua ?? "",
      numero: escolhido.numero ?? "",
      complemento: escolhido.complemento ?? "",
      bairro: escolhido.bairro ?? "",
      cidade: escolhido.cidade ?? "",
      estado: escolhido.estado ?? "SP",
    });
  }, [enderecoSelecionadoId, enderecos]);

  React.useEffect(() => {
    async function autoGerarPix() {
      if (loading) return;
      if (metodoPagamento !== "pix") return;
      if (!pixSolicitado) return;
      if (processing) return;
      if (pixGerandoAutomatico) return;
      if (pixPayload?.payload || pixPayload?.qrUrl) return;
      if (itensArray.length === 0) return;

      setPixGerandoAutomatico(true);

      try {
        await gerarPixCarrinho();
      } finally {
        setPixGerandoAutomatico(false);
      }
    }

    autoGerarPix();
  }, [
    metodoPagamento,
    pixSolicitado,
    loading,
    processing,
    pixGerandoAutomatico,
    pixPayload,
    itensArray.length,
  ]);

  async function aplicarCupom() {
    const code = cupomInput.trim();

    if (!code) {
      toast.info("Digite um cupom.");
      return;
    }

    setCupomLoading(true);

    try {
      const resp = await api.get(`/cupom/${encodeURIComponent(code)}`);
      const base = resp.data?.dados ?? resp.data?.data ?? resp.data;

      if (!base || !base.codigo) {
        setCupomAplicado(null);
        toast.error("Cupom não encontrado.");
        return;
      }

      setCupomAplicado(base);
      toast.success("Cupom aplicado!");
    } catch {
      setCupomAplicado(null);
      toast.error("Erro ao validar cupom.");
    } finally {
      setCupomLoading(false);
    }
  }

  async function salvarEndereco(): Promise<boolean> {
    if (!mostrarFormularioEndereco && enderecoSelecionadoId) {
      const escolhido = enderecos.find((e) => e.id_endereco === enderecoSelecionadoId);

      if (!escolhido) {
        toast.error("Endereço selecionado não encontrado.");
        return false;
      }

      try {
        await api.put("/carrinho/endereco", {
          cep: (escolhido.cep ?? "").replace(/\D/g, "").slice(0, 8),
          rua: escolhido.rua ?? "",
          numero: escolhido.numero ?? "",
          complemento: escolhido.complemento ?? "",
          bairro: escolhido.bairro ?? "",
          cidade: escolhido.cidade ?? "",
          estado: escolhido.estado ?? "SP",
        });

        toast.success("Endereço selecionado!");
        return true;
      } catch {
        toast.error("Erro ao aplicar endereço selecionado.");
        return false;
      }
    }

    const payload = {
      cep: (endereco.cep ?? "").replace(/\D/g, "").slice(0, 8),
      rua: endereco.rua ?? "",
      numero: endereco.numero ?? "",
      complemento: endereco.complemento ?? "",
      bairro: endereco.bairro ?? "",
      cidade: endereco.cidade ?? "",
      estado: endereco.estado ?? "SP",
    };

    if (!payload.cep || payload.cep.length !== 8) {
      toast.error("CEP inválido.");
      return false;
    }

    if (!payload.rua || !payload.numero || !payload.bairro || !payload.cidade) {
      toast.error("Preencha o endereço completo.");
      return false;
    }

    try {
      if (enderecos.length > 0) {
        await api.put("/carrinho/endereco", payload);
      } else {
        await api.post("/carrinho/endereco", payload);
      }

      toast.success("Endereço salvo!");
      await carregarEnderecosSalvos();
      return true;
    } catch {
      toast.error("Erro ao salvar endereço.");
      return false;
    }
  }

  async function gerarPixCarrinho() {
    if (processing) return;

    try {
      const okEnd = await salvarEndereco();
      if (!okEnd) return;

      setProcessing(true);

      const resp = await api.post("/pedido/finalizar", {
        metodo_pagamento: "pix",
      });

      const dados = resp.data?.dados ?? resp.data ?? {};
      const pagamento = dados?.pagamento ?? dados?.dados?.pagamento ?? null;

      if (!pagamento) {
        toast.error("Não foi possível gerar o PIX.");
        return;
      }

      setPixPayload({
        qrUrl: pagamento.qr_code_base64
          ? `data:image/png;base64,${pagamento.qr_code_base64}`
          : undefined,
        payload: pagamento.qr_code ?? "",
        ticketUrl: pagamento.ticket_url ?? "",
      });

      toast.success("PIX gerado com sucesso!");
    } catch (e: any) {
      console.error("Erro PIX:", e?.response?.data || e);
      toast.error(e?.response?.data?.mensagem || "Erro ao gerar pagamento PIX.");
    } finally {
      setProcessing(false);
    }
  }

  async function finalizarPedidoCartao() {
    if (itensArray.length === 0) {
      toast.info("Seu carrinho está vazio.");
      return;
    }

    const okEnd = await salvarEndereco();
    if (!okEnd) return;

    if (!isCardValid()) {
      toast.error("Dados do cartão inválidos.");
      return;
    }

    setProcessing(true);

    try {
      await api.post("/pedido/finalizar", {
        metodo_pagamento: "cartao",
        pagamento_info: {
          nome: cardName,
          numero: cardNumber.replace(/\s/g, ""),
          validade: cardExpiry,
          cvv: cardCVV,
        },
      });

      setPedidoConcluido(true);
      toast.success("Pedido finalizado!");
    } catch (e: any) {
      toast.error(e?.response?.data?.mensagem || "Erro ao finalizar pedido.");
    } finally {
      setProcessing(false);
    }
  }

  async function finalizarCompra() {
    if (metodoPagamento === "cartao") {
      await finalizarPedidoCartao();
      return;
    }

    if (!pixPayload?.payload && !pixPayload?.qrUrl) {
      setPixSolicitado(true);
      await gerarPixCarrinho();
      return;
    }

    toast.success("PIX já gerado. Faça o pagamento pelo QR Code ou copia e cola.");
  }

  function selecionarPix() {
    setMetodoPagamento("pix");
    setPixSolicitado(true);
    setPixPayload(null);
  }

  function selecionarCartao() {
    setMetodoPagamento("cartao");
    setPixSolicitado(false);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="spinner-border text-warning" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" autoClose={2400} theme="dark" />

      <style jsx global>{`
        :root {
          --cream: #fff3ea;
          --cream-2: #fffaf5;
          --line: #eadfd3;
          --text: #2a2a2a;
          --brand: #15373e;
          --brand-2: #0e2328;
        }

        body {
          background: linear-gradient(180deg, var(--cream), #ffffff 65%);
          color: var(--text);
        }

        .checkout-hero {
          background: radial-gradient(
              900px 480px at 15% 20%,
              rgba(199, 161, 106, 0.22),
              transparent 55%
            ),
            radial-gradient(
              800px 420px at 85% 10%,
              rgba(255, 255, 255, 0.12),
              transparent 55%
            ),
            linear-gradient(135deg, var(--brand), var(--brand-2));
          color: #fff;
          border-bottom-left-radius: 28px;
          border-bottom-right-radius: 28px;
          margin-bottom: 18px;
        }

        .heroTitle {
          font-size: clamp(1.7rem, 3vw, 2.4rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.02em;
        }

        .heroSub {
          color: rgba(255, 255, 255, 0.82);
          max-width: 68ch;
          margin: 0;
        }

        .surface {
          background: var(--cream-2);
          border: 1px solid var(--line);
          border-radius: 18px;
          box-shadow: 0 18px 50px rgba(26, 26, 26, 0.08);
        }

        .btn-brand {
          background: linear-gradient(180deg, #1c434b, var(--brand));
          color: #fff !important;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          font-weight: 900;
          padding: 12px 14px;
        }

        .btn-outline-brand {
          background: transparent;
          border: 1px solid rgba(21, 55, 62, 0.35);
          color: var(--brand);
          border-radius: 14px;
          font-weight: 900;
          padding: 12px 14px;
        }

        .pillInput {
          border-radius: 14px !important;
          padding: 12px 12px !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          background: #fff !important;
        }

        .summarySticky {
          position: sticky;
          top: 92px;
        }

        .addrCard {
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: transform 0.08s ease, box-shadow 0.12s ease, border 0.12s ease;
        }

        .addrCard:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.08);
        }

        .addrCardSelected {
          border: 2px solid rgba(199, 161, 106, 0.95);
          box-shadow: 0 16px 34px rgba(199, 161, 106, 0.16);
        }

        .addrBadge {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-weight: 1000;
          border: 1px solid rgba(0, 0, 0, 0.12);
          color: rgba(0, 0, 0, 0.45);
          background: #fff;
        }

        .addrBadgeSelected {
          border: 2px solid rgba(199, 161, 106, 0.95);
          background: rgba(199, 161, 106, 0.14);
          color: #6b4b1b;
        }

        .stepPill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.16);
          font-weight: 900;
          font-size: 0.86rem;
          margin-right: 8px;
          margin-bottom: 8px;
        }
      `}</style>

      <header className="checkout-hero">
        <div className="container py-5">
          <div className="row g-3 align-items-center">
            <div className="col-lg-8">
              <div className="heroTitle">Checkout</div>
              <p className="heroSub mt-2">
                Confirme seu endereço, escolha a forma de pagamento e finalize seu pedido.
              </p>

              <div className="mt-3">
                <span className="stepPill">📍 Endereço</span>
                <span className="stepPill">💳 Pagamento</span>
                <span className="stepPill">✅ Confirmação</span>
              </div>
            </div>

            <div className="col-lg-4">
              <div
                className="surface p-4"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  borderColor: "rgba(255,255,255,0.16)",
                }}
              >
                <div style={{ fontWeight: 900, opacity: 0.9 }}>Total do pedido</div>
                <div style={{ fontSize: 28, fontWeight: 1000, letterSpacing: "-0.02em" }}>
                  {formatBRL(total)}
                </div>
                <div style={{ opacity: 0.8, marginTop: 6, fontSize: 14 }}>
                  {itensArray.length} item(ns)
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container pb-5">
        {erro ? (
          <div className="alert alert-warning">{erro}</div>
        ) : pedidoConcluido ? (
          <div className="surface p-5 text-center">
            <div
              style={{
                display: "inline-flex",
                padding: "10px 14px",
                borderRadius: 999,
                fontWeight: 1000,
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.20)",
                color: "#166534",
              }}
              className="mb-3"
            >
              Pedido confirmado ✅
            </div>

            <h4 style={{ fontWeight: 1000 }}>Obrigado pela compra!</h4>
            <p className="text-muted mb-4">
              Você pode acompanhar seus pedidos na página “Meus Pedidos”.
            </p>

            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button
                className="btn btn-outline-brand"
                onClick={() => (window.location.href = "/pedidos")}
              >
                Ver meus pedidos
              </button>

              <button
                className="btn btn-brand"
                onClick={() => (window.location.href = "/home")}
              >
                Voltar à loja
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="surface p-4 mb-4">
                <h4 className="mb-3" style={{ fontWeight: 1000 }}>
                  Endereço de entrega
                </h4>

                {enderecosLoading ? (
                  <div className="text-muted">Carregando endereços...</div>
                ) : enderecos.length > 0 && !mostrarFormularioEndereco ? (
                  <>
                    <div className="row g-3">
                      {enderecos.map((e) => {
                        const sel = enderecoSelecionadoId === e.id_endereco;
                        const info = enderecoResumo(e);

                        return (
                          <div className="col-12" key={e.id_endereco}>
                            <div
                              className={`addrCard ${sel ? "addrCardSelected" : ""}`}
                              onClick={() => setEnderecoSelecionadoId(e.id_endereco)}
                              role="button"
                              aria-label="Selecionar endereço"
                            >
                              <div className="d-flex justify-content-between align-items-start gap-2">
                                <div>
                                  <div style={{ fontWeight: 1000, fontSize: 15 }}>
                                    {e.nome ? e.nome : `Endereço #${e.id_endereco}`}
                                  </div>

                                  <div style={{ fontWeight: 900, marginTop: 8 }}>
                                    {info.linha1}
                                  </div>

                                  <div
                                    className="text-muted"
                                    style={{ fontWeight: 800, marginTop: 4 }}
                                  >
                                    {info.linha2}
                                  </div>

                                  {info.linha3 ? (
                                    <div className="text-muted small" style={{ marginTop: 6 }}>
                                      {info.linha3}
                                    </div>
                                  ) : null}
                                </div>

                                <div className={`addrBadge ${sel ? "addrBadgeSelected" : ""}`}>
                                  {sel ? "✓" : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="d-flex justify-content-end mt-4 flex-wrap gap-2">
                      <button
                        className="btn btn-outline-brand"
                        onClick={() => {
                          setMostrarFormularioEndereco(true);
                          setEnderecoSelecionadoId(null);
                          setEndereco({ estado: "SP" });
                        }}
                      >
                        Cadastrar novo endereço
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {enderecos.length === 0 ? (
                      <div className="alert alert-warning">
                        Você ainda não tem endereço cadastrado. Preencha abaixo para cadastrar.
                      </div>
                    ) : (
                      <div className="mb-3 d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-outline-brand"
                          onClick={() => {
                            setMostrarFormularioEndereco(false);
                            setEnderecoSelecionadoId(enderecos[0]?.id_endereco ?? null);
                          }}
                        >
                          Voltar para endereços salvos
                        </button>
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">CEP</label>
                        <input
                          className="form-control pillInput"
                          value={endereco.cep ?? ""}
                          onChange={(e) =>
                            setEndereco((prev) => ({
                              ...prev,
                              cep: e.target.value.replace(/\D/g, "").slice(0, 8),
                            }))
                          }
                          placeholder="00000000"
                        />
                      </div>

                      <div className="col-md-8">
                        <label className="form-label fw-bold">Rua</label>
                        <input
                          className="form-control pillInput"
                          value={endereco.rua ?? ""}
                          onChange={(e) =>
                            setEndereco((prev) => ({ ...prev, rua: e.target.value }))
                          }
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-bold">Número</label>
                        <input
                          className="form-control pillInput"
                          value={endereco.numero ?? ""}
                          onChange={(e) =>
                            setEndereco((prev) => ({ ...prev, numero: e.target.value }))
                          }
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-bold">Complemento</label>
                        <input
                          className="form-control pillInput"
                          value={endereco.complemento ?? ""}
                          onChange={(e) =>
                            setEndereco((prev) => ({ ...prev, complemento: e.target.value }))
                          }
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-bold">Bairro</label>
                        <input
                          className="form-control pillInput"
                          value={endereco.bairro ?? ""}
                          onChange={(e) =>
                            setEndereco((prev) => ({ ...prev, bairro: e.target.value }))
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold">Cidade</label>
                        <input
                          className="form-control pillInput"
                          value={endereco.cidade ?? ""}
                          onChange={(e) =>
                            setEndereco((prev) => ({ ...prev, cidade: e.target.value }))
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold">Estado</label>
                        <select
                          className="form-select pillInput"
                          value={endereco.estado ?? "SP"}
                          onChange={(e) =>
                            setEndereco((prev) => ({ ...prev, estado: e.target.value }))
                          }
                        >
                          <option value="SP">SP</option>
                          <option value="RJ">RJ</option>
                          <option value="MG">MG</option>
                          <option value="BA">BA</option>
                          <option value="PR">PR</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="surface p-4">
                <h4 className="mb-3" style={{ fontWeight: 1000 }}>
                  Pagamento
                </h4>

                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <button
                    className={metodoPagamento === "pix" ? "btn btn-brand" : "btn btn-outline-brand"}
                    onClick={selecionarPix}
                    disabled={processing}
                  >
                    {processing && metodoPagamento === "pix" ? "Gerando PIX..." : "Pix"}
                  </button>

                  <button
                    className={metodoPagamento === "cartao" ? "btn btn-brand" : "btn btn-outline-brand"}
                    onClick={selecionarCartao}
                    disabled={processing}
                  >
                    Cartão
                  </button>
                </div>

                {metodoPagamento === "pix" && (
                  <div className="surface p-3" style={{ background: "#fff" }}>
                    <div className="text-muted">
                      Ao escolher Pix, o sistema gera automaticamente o QR Code.
                    </div>

                    {(processing || pixGerandoAutomatico) && !pixPayload?.qrUrl && (
                      <div className="mt-3 text-muted">Gerando PIX...</div>
                    )}

                    {pixPayload?.qrUrl && (
                      <div className="mt-3 text-center">
                        <img
                          src={pixPayload.qrUrl}
                          alt="QR Code PIX"
                          style={{
                            width: 240,
                            background: "#fff",
                            padding: 12,
                            borderRadius: 12,
                          }}
                        />
                      </div>
                    )}

                    {pixPayload?.payload && (
                      <div className="mt-3">
                        <label className="form-label fw-bold">Pix copia e cola</label>
                        <textarea
                          className="form-control pillInput"
                          readOnly
                          rows={4}
                          value={pixPayload.payload}
                        />
                      </div>
                    )}

                    {pixPayload?.ticketUrl && (
                      <div className="mt-3">
                        <a
                          href={pixPayload.ticketUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-brand"
                        >
                          Abrir comprovante PIX
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {metodoPagamento === "cartao" && (
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-bold">Nome no cartão</label>
                      <input
                        className="form-control pillInput"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">Número</label>
                      <input
                        className="form-control pillInput"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Validade</label>
                      <input
                        className="form-control pillInput"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(maskExpiry(e.target.value))}
                        placeholder="MM/YY"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">CVV</label>
                      <input
                        className="form-control pillInput"
                        value={cardCVV}
                        onChange={(e) =>
                          setCardCVV(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        placeholder="123"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Validação</label>
                      <div className="form-control pillInput bg-light">
                        {isCardValid() ? "✅ Ok" : "❌ inválido"}
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-4 flex-wrap gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => (window.location.href = "/carrinho")}
                  >
                    Voltar ao carrinho
                  </button>

                  <button
                    className="btn btn-brand"
                    onClick={finalizarCompra}
                    disabled={processing || itensArray.length === 0}
                  >
                    {processing
                      ? metodoPagamento === "pix"
                        ? "Gerando PIX..."
                        : "Processando..."
                      : "Finalizar compra"}
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="surface p-4 summarySticky">
                <h5 className="mb-3" style={{ fontWeight: 1000 }}>
                  Resumo
                </h5>

                <div className="d-flex justify-content-between">
                  <span className="text-muted">Itens</span>
                  <strong>{itensArray.length}</strong>
                </div>

                <hr />

                {cupomAplicado ? (
                  <div
                    className="mb-3 p-3"
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="fw-bold">{cupomAplicado.codigo}</div>

                    <div className="text-muted small">
                      {cupomAplicado.descricao ||
                        (cupomAplicado.tipo === "percentual"
                          ? `${cupomAplicado.valor}% off`
                          : `${formatBRL(cupomAplicado.valor)} off`)}
                    </div>

                    <div className="text-success fw-bold mt-1">
                      - {formatBRL(descontoValor)}
                    </div>

                    <button
                      className="btn btn-outline-secondary btn-sm mt-2"
                      onClick={() => {
                        setCupomAplicado(null);
                        toast.info("Cupom removido.");
                      }}
                    >
                      Remover cupom
                    </button>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Cupom</label>
                    <div className="input-group">
                      <input
                        className="form-control pillInput"
                        value={cupomInput}
                        onChange={(e) => setCupomInput(e.target.value)}
                        placeholder="Digite o cupom"
                      />
                      <button
                        className="btn btn-outline-secondary"
                        onClick={aplicarCupom}
                        disabled={cupomLoading}
                      >
                        {cupomLoading ? "..." : "Aplicar"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between">
                  <span className="text-muted">Subtotal</span>
                  <strong>{formatBRL(subtotal)}</strong>
                </div>

                {descontoValor > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <span className="text-muted">Desconto</span>
                    <strong>- {formatBRL(descontoValor)}</strong>
                  </div>
                )}

                <hr />

                <div className="d-flex justify-content-between">
                  <span style={{ fontWeight: 1000 }}>Total</span>
                  <span style={{ fontWeight: 1000 }}>{formatBRL(total)}</span>
                </div>

                <button
                  className="btn btn-outline-brand w-100 mt-3"
                  onClick={carregarTudo}
                  disabled={processing}
                >
                  Atualizar checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}