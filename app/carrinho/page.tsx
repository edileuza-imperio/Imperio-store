"use client";

import React from "react";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import api from "@/Api/conectar";
import "bootstrap/dist/css/bootstrap.min.css";
import { maskCardNumber, maskExpiry } from "@/hooks/useCarrinhoCheckout";

type CarrinhoItem = {
  id_item: number;
  nome_produto: string;
  imagem?: string;
  quantidade: number;
  preco_unitario: string | number;
};

type Endereco = {
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
};

type Cupom = {
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  descricao?: string;
};

function num(v: any): number {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Seu /me pode vir em formatos diferentes.
 * Aqui tentamos achar o id em vários lugares comuns.
 */
function pickUserId(me: any): number | null {
  const root = me?.dados ?? me?.data ?? me;

  const id =
    root?.usuario?.id ??
    root?.usuario_id ??
    root?.id ??
    root?.dados?.usuario?.id ??
    root?.data?.usuario?.id;

  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Seu CarrinhoController::listar retorna:
 * Mensagemjson("Carrinho carregado", 200, ["itens" => $itens, "endereco" => $endereco])
 * Então o payload costuma estar em resp.dados
 */
function pickCarrinho(resp: any): { itens: CarrinhoItem[]; endereco: Endereco | null } {
  const base = resp?.dados ?? resp?.data ?? resp;

  const itens = Array.isArray(base?.itens) ? base.itens : [];
  const endereco = base?.endereco ?? null;

  return { itens, endereco };
}

function imagemUrl(path?: string) {
  if (!path) return "/placeholder.png";
  try {
    if (path.startsWith("http")) return path;
    // usa sua rota: /upload/{arquivo}
    return `${api.defaults.baseURL}upload/${path}`;
  } catch {
    return path;
  }
}

export default function CarrinhoPage() {
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  const [usuarioId, setUsuarioId] = React.useState<number | null>(null);

  const [itens, setItens] = React.useState<CarrinhoItem[]>([]);
  const [endereco, setEndereco] = React.useState<Endereco>({
    estado: "SP",
  });

  const [etapa, setEtapa] = React.useState<1 | 2 | 3 | 4>(1);

  const [cupomInput, setCupomInput] = React.useState("");
  const [cupomAplicado, setCupomAplicado] = React.useState<Cupom | null>(null);
  const [cupomLoading, setCupomLoading] = React.useState(false);

  const [metodoPagamento, setMetodoPagamento] = React.useState<"pix" | "cartao">("pix");
  const [processing, setProcessing] = React.useState(false);

  // cartão
  const [cardName, setCardName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCVV, setCardCVV] = React.useState("");

  // pix
  const [pixPayload, setPixPayload] = React.useState<{ qrUrl?: string; payload?: string } | null>(null);

  const itensArray = Array.isArray(itens) ? itens : [];

  const subtotal = React.useMemo(() => {
    return itensArray.reduce((acc, i) => acc + num(i.preco_unitario) * (i.quantidade || 1), 0);
  }, [itensArray]);

  const descontoValor = React.useMemo(() => {
    if (!cupomAplicado) return 0;
    if (cupomAplicado.tipo === "percentual") return subtotal * (cupomAplicado.valor / 100);
    return cupomAplicado.valor || 0;
  }, [cupomAplicado, subtotal]);

  const total = Math.max(subtotal - descontoValor, 0);

  /* ===================== LOAD ===================== */
  async function carregarTudo() {
    setLoading(true);
    setErro(null);

    console.log("🚀 [Carrinho] carregarTudo() iniciou");

    try {
      const meRes = await api.get("/me");
      console.log("👤 [Carrinho] /me response:", meRes.data);

      const uid = pickUserId(meRes.data);
      console.log("🆔 [Carrinho] userId detectado:", uid);

      if (!uid) {
        console.warn("⚠️ [Carrinho] usuário não logado (uid inválido)");
        setErro("Você precisa estar logado para ver o carrinho.");
        setUsuarioId(null);
        setItens([]);
        return;
      }

      setUsuarioId(uid);

      const carrinhoRes = await api.get(`/carrinho/${uid}`);
      console.log(`🛒 [Carrinho] /carrinho/${uid} response:`, carrinhoRes.data);

      const parsed = pickCarrinho(carrinhoRes.data);
      console.log("📦 [Carrinho] itens parseados:", parsed.itens);
      console.log("🏠 [Carrinho] endereço parseado:", parsed.endereco);

      setItens(parsed.itens || []);

      if (parsed.endereco) {
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

      console.log("✅ [Carrinho] state final -> itens:", parsed.itens?.length ?? 0);
    } catch (e: any) {
      console.error("❌ [Carrinho] erro ao carregar:", e);
      console.log("❌ [Carrinho] erro response:", e?.response?.data);
      setErro(e?.response?.data?.mensagem || e?.message || "Erro ao carregar carrinho.");
    } finally {
      setLoading(false);
      console.log("🏁 [Carrinho] carregarTudo() finalizou");
    }
  }

  React.useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===================== CART ACTIONS ===================== */
  async function alterarQuantidade(itemId: number, qtd: number) {
    console.log("➕➖ [Carrinho] alterarQuantidade:", { itemId, qtd });

    if (qtd < 1) return;

    try {
      const res = await api.put(`/carrinho/atualizar/${itemId}`, { quantidade: qtd });
      console.log("✅ [Carrinho] atualizar response:", res.data);

      setItens((prev) => prev.map((i) => (i.id_item === itemId ? { ...i, quantidade: qtd } : i)));
    } catch (e: any) {
      console.error("❌ [Carrinho] erro atualizar:", e);
      console.log("❌ [Carrinho] erro response:", e?.response?.data);
      alert("Erro ao atualizar quantidade");
    }
  }

  async function removerItem(itemId: number) {
    console.log("🗑️ [Carrinho] removerItem:", itemId);

    try {
      const res = await api.delete(`/carrinho/remover/${itemId}`);
      console.log("✅ [Carrinho] remover response:", res.data);

      setItens((prev) => prev.filter((i) => i.id_item !== itemId));
    } catch (e: any) {
      console.error("❌ [Carrinho] erro remover:", e);
      console.log("❌ [Carrinho] erro response:", e?.response?.data);
      alert("Erro ao remover item");
    }
  }

  /* ===================== CUPOM ===================== */
  async function aplicarCupom() {
    const code = cupomInput.trim();
    console.log("🎟️ [Carrinho] aplicarCupom:", code);

    if (!code) {
      alert("Digite um cupom");
      return;
    }

    setCupomLoading(true);
    try {
      const resp = await api.get(`/cupom/${encodeURIComponent(code)}`);
      console.log("🎟️ [Carrinho] /cupom response:", resp.data);

      const base = resp.data?.dados ?? resp.data?.data ?? resp.data;
      if (!base || !base.codigo) {
        setCupomAplicado(null);
        alert("Cupom não encontrado");
        return;
      }
      setCupomAplicado(base);
      console.log("✅ [Carrinho] cupomAplicado:", base);
    } catch (e: any) {
      console.error("❌ [Carrinho] erro cupom:", e);
      console.log("❌ [Carrinho] erro response:", e?.response?.data);
      setCupomAplicado(null);
      alert("Erro ao validar cupom");
    } finally {
      setCupomLoading(false);
    }
  }

  /* ===================== ADDRESS ===================== */
  async function salvarEndereco() {
    if (!usuarioId) return false;

    const payload = {
      usuarioId,
      cep: (endereco.cep ?? "").replace(/\D/g, "").slice(0, 8),
      rua: endereco.rua ?? "",
      numero: endereco.numero ?? "",
      complemento: endereco.complemento ?? "",
      bairro: endereco.bairro ?? "",
      cidade: endereco.cidade ?? "",
      estado: endereco.estado ?? "SP",
    };

    console.log("🏠 [Carrinho] salvarEndereco payload:", payload);

    if (!payload.cep || payload.cep.length !== 8) return alert("CEP inválido"), false;
    if (!payload.rua || !payload.numero || !payload.bairro || !payload.cidade) return alert("Preencha o endereço completo"), false;

    try {
      const res = await api.post("/carrinho/endereco", payload);
      console.log("✅ [Carrinho] salvarEndereco response:", res.data);
      return true;
    } catch (e: any) {
      console.error("❌ [Carrinho] erro salvarEndereco:", e);
      console.log("❌ [Carrinho] erro response:", e?.response?.data);
      alert("Erro ao salvar endereço");
      return false;
    }
  }

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

  /* ===================== FINALIZE ===================== */
  async function finalizarPedido() {
    console.log("🧾 [Carrinho] finalizarPedido iniciado");
    console.log("🧾 [Carrinho] usuarioId:", usuarioId);
    console.log("🧾 [Carrinho] itensArray:", itensArray);

    if (!usuarioId) return alert("Usuário não logado");
    if (itensArray.length === 0) return alert("Carrinho vazio");

    const okEnd = await salvarEndereco();
    if (!okEnd) {
      console.warn("⚠️ [Carrinho] endereço inválido");
      setEtapa(2);
      return;
    }

    if (metodoPagamento === "cartao" && !isCardValid()) {
      console.warn("⚠️ [Carrinho] cartão inválido");
      alert("Dados do cartão inválidos");
      return;
    }

    setProcessing(true);

    try {
      const enderecoFinal =
        `${endereco.rua}, ${endereco.numero}` +
        `${endereco.complemento ? ` - ${endereco.complemento}` : ""}` +
        ` | ${endereco.bairro} | ${endereco.cidade} - ${endereco.estado} | CEP: ${endereco.cep}`;

      const payload: any = {
        usuario_id: usuarioId,
        total,
        frete: 0,
        endereco: enderecoFinal,
        metodo_pagamento: metodoPagamento,
        pagamento_info: "",
      };

      if (metodoPagamento === "cartao") {
        payload.pagamento_info = {
          nome: cardName,
          numero: cardNumber.replace(/\s/g, ""),
          validade: cardExpiry,
          cvv: cardCVV,
        };
      }

      console.log("📤 [Carrinho] /pedido/finalizar payload:", payload);

      const resp = await api.post("/pedido/finalizar", payload);
      console.log("✅ [Carrinho] /pedido/finalizar response:", resp.data);

      const base = resp.data?.dados ?? resp.data?.data ?? resp.data;
      console.log("📦 [Carrinho] dados normalizados:", base);

      if (metodoPagamento === "pix") {
        const info = base?.pagamento_info ?? null;
        console.log("💠 [Carrinho] pix pagamento_info:", info);

        setPixPayload({
          qrUrl: info?.qrUrl,
          payload: info?.payload ?? "000201...pix-copia-cola",
        });
      }

      setEtapa(4);
    } catch (e: any) {
      console.error("❌ [Carrinho] erro finalizarPedido:", e);
      console.log("❌ [Carrinho] erro response:", e?.response?.data);
      alert(e?.response?.data?.mensagem || "Erro ao finalizar pedido");
    } finally {
      setProcessing(false);
      console.log("🏁 [Carrinho] finalizarPedido fim");
    }
  }

  /* ===================== UI ===================== */
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

      <style jsx>{`
        :root {
          --cream: #fff3ea;
          --cream-2: #fffaf5;
          --line: #eadfd3;
          --brand: #15373e;
          --gold: #c7a16a;
        }

        body {
          background: linear-gradient(180deg, var(--cream), #ffffff 65%);
        }

        .card-surface {
          background: var(--cream-2);
          border: 1px solid var(--line);
          border-radius: 18px;
          box-shadow: 0 18px 50px rgba(26, 26, 26, 0.08);
        }

        .btn-brand {
          background: linear-gradient(180deg, #1c434b, var(--brand));
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          font-weight: 800;
        }

        .btn-outline-brand {
          background: transparent;
          border: 1px solid rgba(21, 55, 62, 0.35);
          color: var(--brand);
          border-radius: 12px;
          font-weight: 800;
        }

        .product-img {
          width: 84px;
          height: 84px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid var(--line);
          background: #fff;
        }

        .pill {
          border-radius: 12px;
          padding: 10px 12px;
        }

        .badge-soft {
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 800;
          background: rgba(199, 161, 106, 0.14);
          border: 1px solid rgba(199, 161, 106, 0.22);
          color: #6b4b1b;
        }

        .step {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255, 243, 234, 0.55);
          font-weight: 800;
        }
      `}</style>

      <main className="container py-4 py-lg-5">
        {erro ? (
          <div className="alert alert-warning">{erro}</div>
        ) : (
          <div className="row g-4">
            {/* LEFT */}
            <div className="col-lg-8">
              <div className="card-surface p-4 mb-4">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className={`step ${etapa === 1 ? "badge-soft" : ""}`}>1. Carrinho</span>
                  <span className={`step ${etapa === 2 ? "badge-soft" : ""}`}>2. Endereço</span>
                  <span className={`step ${etapa === 3 ? "badge-soft" : ""}`}>3. Pagamento</span>
                  <span className={`step ${etapa === 4 ? "badge-soft" : ""}`}>4. Confirmado</span>
                </div>

                {etapa === 1 && (
                  <>
                    <h4 className="mb-3">Seu Carrinho</h4>

                    {itensArray.length === 0 ? (
                      <div className="alert alert-warning mb-0">Seu carrinho está vazio.</div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {itensArray.map((item) => (
                          <div key={item.id_item} className="d-flex align-items-center gap-3">
                            <img className="product-img" src={imagemUrl(item.imagem)} alt={item.nome_produto} />
                            <div className="flex-grow-1">
                              <div className="fw-bold">{item.nome_produto}</div>
                              <div className="text-muted">{formatBRL(num(item.preco_unitario))}</div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              <button className="btn btn-outline-secondary" onClick={() => alterarQuantidade(item.id_item, item.quantidade - 1)}>
                                -
                              </button>
                              <div style={{ width: 26, textAlign: "center" }}>{item.quantidade}</div>
                              <button className="btn btn-outline-secondary" onClick={() => alterarQuantidade(item.id_item, item.quantidade + 1)}>
                                +
                              </button>
                            </div>

                            <button className="btn btn-outline-danger" onClick={() => removerItem(item.id_item)}>
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="d-flex justify-content-between mt-4">
                      <button className="btn btn-outline-secondary" onClick={() => (window.location.href = "/home")}>
                        Voltar
                      </button>
                      <button className="btn btn-brand" onClick={() => setEtapa(2)} disabled={itensArray.length === 0}>
                        Continuar
                      </button>
                    </div>
                  </>
                )}

                {etapa === 2 && (
                  <>
                    <h4 className="mb-3">Endereço de Entrega</h4>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">CEP</label>
                        <input
                          className="form-control pill"
                          value={endereco.cep ?? ""}
                          onChange={(e) => setEndereco((p) => ({ ...p, cep: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
                          placeholder="00000000"
                        />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label fw-bold">Rua</label>
                        <input className="form-control pill" value={endereco.rua ?? ""} onChange={(e) => setEndereco((p) => ({ ...p, rua: e.target.value }))} />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-bold">Número</label>
                        <input className="form-control pill" value={endereco.numero ?? ""} onChange={(e) => setEndereco((p) => ({ ...p, numero: e.target.value }))} />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-bold">Complemento</label>
                        <input className="form-control pill" value={endereco.complemento ?? ""} onChange={(e) => setEndereco((p) => ({ ...p, complemento: e.target.value }))} />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-bold">Bairro</label>
                        <input className="form-control pill" value={endereco.bairro ?? ""} onChange={(e) => setEndereco((p) => ({ ...p, bairro: e.target.value }))} />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold">Cidade</label>
                        <input className="form-control pill" value={endereco.cidade ?? ""} onChange={(e) => setEndereco((p) => ({ ...p, cidade: e.target.value }))} />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold">Estado</label>
                        <select className="form-select pill" value={endereco.estado ?? "SP"} onChange={(e) => setEndereco((p) => ({ ...p, estado: e.target.value }))}>
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
                      <button className="btn btn-brand" onClick={async () => (await salvarEndereco()) && setEtapa(3)}>
                        Salvar e ir para Pagamento
                      </button>
                    </div>
                  </>
                )}

                {etapa === 3 && (
                  <>
                    <h4 className="mb-3">Pagamento</h4>

                    <div className="d-flex gap-2 mb-3">
                      <button className={metodoPagamento === "pix" ? "btn btn-brand" : "btn btn-outline-brand"} onClick={() => setMetodoPagamento("pix")}>
                        Pix
                      </button>
                      <button className={metodoPagamento === "cartao" ? "btn btn-brand" : "btn btn-outline-brand"} onClick={() => setMetodoPagamento("cartao")}>
                        Cartão
                      </button>
                    </div>

                    {metodoPagamento === "pix" && (
                      <div className="card-surface p-3" style={{ background: "#fff" }}>
                        <div className="text-muted">Ao finalizar, vamos gerar o Pix (se sua API retornar payload).</div>

                        {pixPayload?.qrUrl ? (
                          <div className="mt-3 text-center">
                            <img src={pixPayload.qrUrl} alt="QR Pix" style={{ width: 220 }} />
                          </div>
                        ) : null}

                        {pixPayload?.payload ? (
                          <div className="mt-3">
                            <label className="form-label fw-bold">Pix copia e cola</label>
                            <input className="form-control pill" readOnly value={pixPayload.payload} />
                          </div>
                        ) : null}
                      </div>
                    )}

                    {metodoPagamento === "cartao" && (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-bold">Nome no cartão</label>
                          <input className="form-control pill" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-bold">Número</label>
                          <input className="form-control pill" value={cardNumber} onChange={(e) => setCardNumber(maskCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-bold">Validade</label>
                          <input className="form-control pill" value={cardExpiry} onChange={(e) => setCardExpiry(maskExpiry(e.target.value))} placeholder="MM/YY" />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-bold">CVV</label>
                          <input className="form-control pill" value={cardCVV} onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-bold">Validação</label>
                          <div className="form-control pill bg-light">{isCardValid() ? "✅ Ok" : "❌ inválido"}</div>
                        </div>
                      </div>
                    )}

                    <div className="d-flex justify-content-between mt-4">
                      <button className="btn btn-outline-secondary" onClick={() => setEtapa(2)}>
                        Voltar
                      </button>
                      <button className="btn btn-brand" onClick={finalizarPedido} disabled={processing}>
                        {processing ? "Processando..." : "Finalizar Pedido"}
                      </button>
                    </div>
                  </>
                )}

                {etapa === 4 && (
                  <div className="text-center py-3">
                    <div className="badge-soft mb-3">Pedido confirmado ✅</div>
                    <h4>Obrigado pela compra!</h4>
                    <p className="text-muted mb-4">Você pode acompanhar seus pedidos na página “Meus Pedidos”.</p>
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="btn btn-outline-brand" onClick={() => (window.location.href = "/pedidos")}>
                        Ver meus pedidos
                      </button>
                      <button className="btn btn-brand" onClick={() => (window.location.href = "/home")}>
                        Voltar à loja
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-lg-4">
              <div className="card-surface p-4">
                <h5 className="mb-3">Resumo</h5>

                <div className="d-flex justify-content-between">
                  <span className="text-muted">Itens</span>
                  <strong>{itensArray.length}</strong>
                </div>

                <hr />

                {cupomAplicado ? (
                  <div className="mb-3 p-3" style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="fw-bold">{cupomAplicado.codigo}</div>
                    <div className="text-muted small">
                      {cupomAplicado.descricao ||
                        (cupomAplicado.tipo === "percentual"
                          ? `${cupomAplicado.valor}% off`
                          : `${formatBRL(cupomAplicado.valor)} off`)}
                    </div>
                    <div className="text-success fw-bold mt-1">- {formatBRL(descontoValor)}</div>

                    <button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => setCupomAplicado(null)}>
                      Remover cupom
                    </button>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Cupom</label>
                    <div className="input-group">
                      <input className="form-control pill" value={cupomInput} onChange={(e) => setCupomInput(e.target.value)} placeholder="Digite o cupom" />
                      <button className="btn btn-outline-secondary" onClick={aplicarCupom} disabled={cupomLoading}>
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
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold">{formatBRL(total)}</span>
                </div>

                <button
                  className="btn btn-brand w-100 mt-3"
                  onClick={() => setEtapa((prev) => (prev < 4 ? ((prev + 1) as any) : prev))}
                  disabled={itensArray.length === 0 || processing || etapa === 4}
                >
                  {etapa === 1 ? "Ir para Endereço" : etapa === 2 ? "Ir para Pagamento" : etapa === 3 ? "Finalizar" : "Concluído"}
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
