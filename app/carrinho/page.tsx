"use client";

import React from "react";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import api from "@/Api/conectar";
import "bootstrap/dist/css/bootstrap.min.css";
import { maskCardNumber, maskExpiry } from "@/hooks/useCarrinhoCheckout";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EnderecoDB, Endereco, Cupom, PixPayload } from "@/components/Bibioteca/Bibiotecas";
import { formatBRL } from "@/components/Bibioteca/functions";


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

function imagemUrl(path?: string) {
  if (!path) return "/placeholder.png";
  if (/^https?:\/\//i.test(path)) return path;

  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  const clean = String(path).replace(/^\/+/, "");

  if (clean.startsWith("upload/")) return `${base}/${clean}`;
  if (clean.startsWith("/upload/")) return `${base}${clean}`;
  if (clean.includes("/")) return `${base}/${clean}`;

  return `${base}/upload/${clean}`;
}

function enderecoResumo(e: EnderecoDB) {
  const linha1 =
    `${e.rua ?? ""}, ${e.numero ?? ""}` + (e.complemento ? ` - ${e.complemento}` : "");
  const linha2 = `${e.bairro ?? ""} • ${e.cidade ?? ""}/${e.estado ?? ""}`;
  const linha3 = e.cep ? `CEP: ${e.cep}` : "";
  return { linha1: linha1.trim(), linha2: linha2.trim(), linha3 };
}

export default function CarrinhoPage() {
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  const [itens, setItens] = React.useState<CarrinhoItem[]>([]);
  const [endereco, setEndereco] = React.useState<Endereco>({ estado: "SP" });

  const [etapa, setEtapa] = React.useState<1 | 2 | 3 | 4>(1);

  const [cupomInput, setCupomInput] = React.useState("");
  const [cupomAplicado, setCupomAplicado] = React.useState<Cupom | null>(null);
  const [cupomLoading, setCupomLoading] = React.useState(false);

  const [metodoPagamento, setMetodoPagamento] = React.useState<"pix" | "cartao">("pix");
  const [processing, setProcessing] = React.useState(false);

  const [cardName, setCardName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCVV, setCardCVV] = React.useState("");

  const [pixPayload, setPixPayload] = React.useState<PixPayload | null>(null);

  const [enderecos, setEnderecos] = React.useState<EnderecoDB[]>([]);
  const [enderecosLoading, setEnderecosLoading] = React.useState(false);

  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = React.useState<number | null>(null);
  const [mostrarFormularioEndereco, setMostrarFormularioEndereco] = React.useState(false);

  const itensArray = Array.isArray(itens) ? itens : [];

  const subtotal = React.useMemo(() => {
    return itensArray.reduce((acc, i) => acc + num(i.preco_unitario) * (i.quantidade || 1), 0);
  }, [itensArray]);

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
  const descontoValor = React.useMemo(() => {
    if (!cupomAplicado) return 0;
    if (cupomAplicado.tipo === "percentual") return subtotal * (cupomAplicado.valor / 100);
    return cupomAplicado.valor || 0;
  }, [cupomAplicado, subtotal]);

  const total = Math.max(subtotal - descontoValor, 0);

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
        setMostrarFormularioEndereco(false);
        setEnderecoSelecionadoId(list[0].id_endereco);

        setEndereco({
          cep: list[0].cep ?? "",
          rua: list[0].rua ?? "",
          numero: list[0].numero ?? "",
          complemento: list[0].complemento ?? "",
          bairro: list[0].bairro ?? "",
          cidade: list[0].cidade ?? "",
          estado: list[0].estado ?? "SP",
        });
      } else {
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

      if (parsed.endereco && enderecos.length === 0) {
        setEndereco({
          cep: parsed.endereco.cep ?? "",
          rua: parsed.endereco.rua ?? "",
          numero: parsed.endereco.numero ?? "",
          complemento: parsed.endereco.complemento ?? "",
          bairro: parsed.endereco.bairro ?? "",
          cidade: parsed.endereco.cidade ?? "",
          estado: parsed.endereco.estado ?? "SP",
        });
      }
    } catch (e: any) {
      setErro(e?.response?.data?.mensagem || e?.message || "Erro ao carregar carrinho.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    carregarTudo();
  }, []);

  React.useEffect(() => {
    if (!enderecoSelecionadoId) return;

    const chosen = enderecos.find((e) => e.id_endereco === enderecoSelecionadoId);
    if (!chosen) return;

    setEndereco({
      cep: chosen.cep ?? "",
      rua: chosen.rua ?? "",
      numero: chosen.numero ?? "",
      complemento: chosen.complemento ?? "",
      bairro: chosen.bairro ?? "",
      cidade: chosen.cidade ?? "",
      estado: chosen.estado ?? "SP",
    });
  }, [enderecoSelecionadoId, enderecos]);

  async function alterarQuantidade(itemId: number, qtd: number) {
    if (qtd < 1) return;

    try {
      await api.put(`/carrinho/item/${itemId}`, { quantidade: qtd });
      setItens((prev) => prev.map((i) => (i.id_item === itemId ? { ...i, quantidade: qtd } : i)));
    } catch {
      toast.error("Erro ao atualizar quantidade.");
    }
  }

  async function removerItem(itemId: number) {
    try {
      await api.delete(`/carrinho/item/${itemId}`);
      setItens((prev) => prev.filter((i) => i.id_item !== itemId));
      toast.success("Item removido do carrinho.");
    } catch {
      toast.error("Erro ao remover item.");
    }
  }

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
    try {
      const okEnd = await salvarEndereco();

      if (!okEnd) {
        setEtapa(2);
        return;
      }

      setProcessing(true);

      const resp = await api.post("/pedido/finalizar", {
        metodo_pagamento: "pix"
      });

      const dados = resp.data?.dados ?? {};
      const pagamento = dados?.pagamento ?? null;

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

      setMetodoPagamento("pix");

      toast.success("PIX gerado com sucesso!");
    } catch (e: any) {
      console.error(e?.response?.data || e);

      toast.error(
        e?.response?.data?.mensagem || "Erro ao gerar pagamento PIX."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function finalizarPedido() {

    if (itensArray.length === 0) {
      toast.info("Seu carrinho está vazio.");
      return;
    }

    const okEnd = await salvarEndereco();

    if (!okEnd) {
      setEtapa(2);
      return;
    }

    if (metodoPagamento === "pix") {
      await gerarPixCarrinho();
      return;
    }

    if (metodoPagamento === "cartao" && !isCardValid()) {
      toast.error("Dados do cartão inválidos.");
      return;
    }

    setProcessing(true);

    try {

      const resp = await api.post("/pedido/finalizar", {
        metodo_pagamento: metodoPagamento,
        pagamento_info: {
          nome: cardName,
          numero: cardNumber.replace(/\s/g, ""),
          validade: cardExpiry,
          cvv: cardCVV
        }
      });

      setEtapa(4);

      toast.success("Pedido finalizado!");

    } catch (e: any) {

      toast.error(
        e?.response?.data?.mensagem ||
        "Erro ao finalizar pedido."
      );

    } finally {
      setProcessing(false);
    }
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
          --gold: #c7a16a;
        }

        body {
          background: linear-gradient(180deg, var(--cream), #ffffff 65%);
          color: var(--text);
        }

        .cart-hero {
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
          text-shadow: 0 10px 22px rgba(0, 0, 0, 0.25);
        }

        .heroSub {
          color: rgba(255, 255, 255, 0.82);
          max-width: 68ch;
          margin: 0;
        }

        .heroPills {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .heroPill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.16);
          font-weight: 900;
          font-size: 0.86rem;
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

        .stepper {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .step {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255, 243, 234, 0.55);
          font-weight: 900;
          color: rgba(11, 18, 32, 0.78);
        }

        .stepActive {
          background: rgba(199, 161, 106, 0.14);
          border: 1px solid rgba(199, 161, 106, 0.25);
          color: #6b4b1b;
        }

        .itemCard {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 14px;
          display: grid;
          grid-template-columns: 88px 1fr auto;
          gap: 14px;
          align-items: center;
        }

        .productImg {
          width: 88px;
          height: 88px;
          border-radius: 14px;
          object-fit: cover;
          border: 1px solid var(--line);
          background: #fff;
        }

        .qtdBox {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(11, 18, 32, 0.04);
          border: 1px solid rgba(11, 18, 32, 0.08);
        }

        .qtdBtn {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid rgba(11, 18, 32, 0.1);
          background: #fff;
          font-weight: 900;
        }

        .qtdNum {
          width: 26px;
          text-align: center;
          font-weight: 900;
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

        @media (max-width: 767px) {
          .itemCard {
            grid-template-columns: 1fr;
          }

          .productImg {
            width: 100%;
            height: 180px;
          }
        }
      `}</style>

      <header className="cart-hero">
        <div className="container py-5">
          <div className="row g-3 align-items-center">
            <div className="col-lg-8">
              <div className="heroTitle">Carrinho & Checkout</div>
              <p className="heroSub mt-2">
                Revise seus itens, confirme o endereço e finalize o pagamento com segurança.
              </p>

              <div className="heroPills">
                <span className="heroPill">🛡️ Compra segura</span>
                <span className="heroPill">🚚 Entrega organizada</span>
                <span className="heroPill">💳 Pix ou cartão</span>
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
                <div style={{ fontWeight: 900, opacity: 0.9 }}>Total</div>
                <div style={{ fontSize: 28, fontWeight: 1000, letterSpacing: "-0.02em" }}>
                  {formatBRL(total)}
                </div>
                <div style={{ opacity: 0.8, marginTop: 6, fontSize: 14 }}>
                  {itensArray.length} item(ns) no carrinho
                </div>

                <button
                  className="btn btn-brand w-100 mt-3"
                  onClick={() => setEtapa((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev))}
                  disabled={itensArray.length === 0 || processing || etapa === 4}
                >
                  {etapa === 1
                    ? "Ir para Endereço"
                    : etapa === 2
                      ? "Ir para Pagamento"
                      : etapa === 3
                        ? "Finalizar"
                        : "Concluído"}
                </button>

                <button className="btn btn-outline-brand w-100 mt-2" onClick={carregarTudo}>
                  Atualizar carrinho
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container pb-5">
        {erro ? (
          <div className="alert alert-warning">{erro}</div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="surface p-4">
                <div className="stepper mb-3">
                  <span className={`step ${etapa === 1 ? "stepActive" : ""}`}>1. Carrinho</span>
                  <span className={`step ${etapa === 2 ? "stepActive" : ""}`}>2. Endereço</span>
                  <span className={`step ${etapa === 3 ? "stepActive" : ""}`}>3. Pagamento</span>
                  <span className={`step ${etapa === 4 ? "stepActive" : ""}`}>4. Confirmado</span>
                </div>

                {etapa === 1 && (
                  <>
                    <h4 className="mb-3" style={{ fontWeight: 1000 }}>
                      Seu carrinho
                    </h4>

                    {itensArray.length === 0 ? (
                      <div className="alert alert-warning mb-0">Seu carrinho está vazio.</div>
                    ) : (
                      <div className="d-grid gap-3">
                        {itensArray.map((item) => (
                          <div key={item.id_item} className="itemCard">
                            <img
                              className="productImg"
                              src={imagemUrl(item.imagem)}
                              alt={item.nome_produto}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                              }}
                            />

                            <div>
                              <div style={{ fontWeight: 1000 }}>{item.nome_produto}</div>
                              <div className="text-muted" style={{ fontWeight: 800 }}>
                                {formatBRL(num(item.preco_unitario))}
                              </div>
                              <div className="text-muted small">
                                Subtotal:{" "}
                                <strong>
                                  {formatBRL(num(item.preco_unitario) * (item.quantidade || 1))}
                                </strong>
                              </div>
                            </div>

                            <div className="d-grid gap-2" style={{ justifyItems: "end" }}>
                              <div className="qtdBox">
                                <button
                                  className="qtdBtn"
                                  onClick={() => alterarQuantidade(item.id_item, item.quantidade - 1)}
                                  aria-label="Diminuir"
                                >
                                  −
                                </button>
                                <div className="qtdNum">{item.quantidade}</div>
                                <button
                                  className="qtdBtn"
                                  onClick={() => alterarQuantidade(item.id_item, item.quantidade + 1)}
                                  aria-label="Aumentar"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                className="btn btn-outline-danger"
                                onClick={() => removerItem(item.id_item)}
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="d-flex justify-content-between mt-4">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => (window.location.href = "/home")}
                      >
                        Voltar
                      </button>
                      <button
                        className="btn btn-brand"
                        onClick={() => setEtapa(2)}
                        disabled={itensArray.length === 0}
                      >
                        Continuar
                      </button>
                    </div>
                  </>
                )}

                {etapa === 2 && (
                  <>
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

                        <div className="d-flex justify-content-between mt-4 flex-wrap gap-2">
                          <button className="btn btn-outline-secondary" onClick={() => setEtapa(1)}>
                            Voltar
                          </button>

                          <div className="d-flex gap-2 flex-wrap">
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

                            <button
                              className="btn btn-brand"
                              onClick={async () => (await salvarEndereco()) && setEtapa(3)}
                            >
                              Usar este endereço e ir para pagamento
                            </button>
                          </div>
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
                                setEndereco((p) => ({
                                  ...p,
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
                              onChange={(e) => setEndereco((p) => ({ ...p, rua: e.target.value }))}
                            />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label fw-bold">Número</label>
                            <input
                              className="form-control pillInput"
                              value={endereco.numero ?? ""}
                              onChange={(e) =>
                                setEndereco((p) => ({ ...p, numero: e.target.value }))
                              }
                            />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label fw-bold">Complemento</label>
                            <input
                              className="form-control pillInput"
                              value={endereco.complemento ?? ""}
                              onChange={(e) =>
                                setEndereco((p) => ({ ...p, complemento: e.target.value }))
                              }
                            />
                          </div>

                          <div className="col-md-4">
                            <label className="form-label fw-bold">Bairro</label>
                            <input
                              className="form-control pillInput"
                              value={endereco.bairro ?? ""}
                              onChange={(e) =>
                                setEndereco((p) => ({ ...p, bairro: e.target.value }))
                              }
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-bold">Cidade</label>
                            <input
                              className="form-control pillInput"
                              value={endereco.cidade ?? ""}
                              onChange={(e) =>
                                setEndereco((p) => ({ ...p, cidade: e.target.value }))
                              }
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-bold">Estado</label>
                            <select
                              className="form-select pillInput"
                              value={endereco.estado ?? "SP"}
                              onChange={(e) =>
                                setEndereco((p) => ({ ...p, estado: e.target.value }))
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

                        <div className="d-flex justify-content-between mt-4">
                          <button className="btn btn-outline-secondary" onClick={() => setEtapa(1)}>
                            Voltar
                          </button>
                          <button
                            className="btn btn-brand"
                            onClick={async () => (await salvarEndereco()) && setEtapa(3)}
                          >
                            Salvar endereço e ir para pagamento
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {etapa === 3 && (
                  <>
                    <h4 className="mb-3" style={{ fontWeight: 1000 }}>
                      Pagamento
                    </h4>

                    <div className="d-flex gap-2 mb-3">
                      <button
                        className={metodoPagamento === "pix" ? "btn btn-brand" : "btn btn-outline-brand"}
                        onClick={async () => {
                          setMetodoPagamento("pix");
                          await gerarPixCarrinho();
                        }}
                        disabled={processing}
                      >
                        {processing && metodoPagamento === "pix" ? "Gerando PIX..." : "Pix"}
                      </button>

                      <button
                        className={metodoPagamento === "cartao" ? "btn btn-brand" : "btn btn-outline-brand"}
                        onClick={() => setMetodoPagamento("cartao")}
                        disabled={processing}
                      >
                        Cartão
                      </button>
                    </div>

                    {metodoPagamento === "pix" && (
                      <div className="surface p-3" style={{ background: "#fff" }}>
                        <div className="text-muted">
                          Gere o QR Code PIX e pague escaneando ou copiando o código abaixo.
                        </div>

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

                        {!pixPayload?.qrUrl && !processing && (
                          <div className="mt-3">
                            <button className="btn btn-brand" onClick={gerarPixCarrinho}>
                              Gerar QR Code PIX
                            </button>
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

                    <div className="d-flex justify-content-between mt-4">
                      <button className="btn btn-outline-secondary" onClick={() => setEtapa(2)}>
                        Voltar
                      </button>

                      {metodoPagamento === "cartao" ? (
                        <button className="btn btn-brand" onClick={finalizarPedido} disabled={processing}>
                          {processing ? "Processando..." : "Finalizar pedido"}
                        </button>
                      ) : (
                        <button className="btn btn-brand" onClick={gerarPixCarrinho} disabled={processing}>
                          {processing ? "Gerando PIX..." : "Gerar PIX"}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {etapa === 4 && (
                  <div className="text-center py-3">
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
                )}
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
                  className="btn btn-brand w-100 mt-3"
                  onClick={() => setEtapa((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev))}
                  disabled={itensArray.length === 0 || processing || etapa === 4}
                >
                  {etapa === 1
                    ? "Ir para Endereço"
                    : etapa === 2
                      ? "Ir para Pagamento"
                      : etapa === 3
                        ? "Finalizar"
                        : "Concluído"}
                </button>

                <button className="btn btn-outline-brand w-100 mt-2" onClick={carregarTudo}>
                  Atualizar carrinho
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