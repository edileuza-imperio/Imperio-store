"use client";

import React from "react";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import "bootstrap/dist/css/bootstrap.min.css";

import { maskCardNumber, maskExpiry } from "@/hooks/useCarrinhoCheckout";
import { useCheckoutPage } from "@/hooks/useCheckoutPage";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  enderecoResumo,
  formatBRL,
} from "@/components/Bibioteca/functions";

export default function CheckoutPage() {
  const {
    loading,
    erro,
    itensArray,
    endereco,
    setEndereco,

    cupomInput,
    setCupomInput,
    cupomAplicado,
    setCupomAplicado,
    cupomLoading,

    metodoPagamento,
    processing,

    cardName,
    setCardName,
    cardNumber,
    setCardNumber,
    cardExpiry,
    setCardExpiry,
    cardCVV,
    setCardCVV,

    pixPayload,
    pixGerandoAutomatico,

    enderecos,
    enderecosLoading,
    enderecoSelecionadoId,
    setEnderecoSelecionadoId,
    mostrarFormularioEndereco,
    setMostrarFormularioEndereco,

    pedidoConcluido,

    subtotal,
    descontoValor,
    total,

    isCardValid,
    aplicarCupom,
    finalizarCompra,
    selecionarPix,
    selecionarCartao,
    carregarTudo,
  } = useCheckoutPage();

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