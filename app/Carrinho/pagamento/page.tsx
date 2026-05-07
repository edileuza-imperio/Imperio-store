"use client";

import "./pagamento.css";

import { useState } from "react";

import Link from "next/link";

import {
  FiMapPin,
  FiTruck,
  FiCreditCard,
  FiCheckCircle,
  FiCopy,
} from "react-icons/fi";

import { InicioApi } from "@/services/api/api";

export default function PagamentoPage() {
  const [metodo, setMetodo] =
    useState<"pix" | "cartao">("pix");

  const [loading, setLoading] =
    useState(false);

  const [pixData, setPixData] =
    useState<any>(null);

  const [cartao, setCartao] =
    useState({
      nome: "",
      numero: "",
      validade: "",
      cvv: "",
    });

  async function pagarPix() {
    try {
      setLoading(true);

      const response =
        await InicioApi.post(
          "/mercado/pagamento/pix",
          {},
          {
            withCredentials: true,
          }
        );

      setPixData(response.data);
    } catch (error) {
      console.error(
        "Erro ao gerar PIX:",
        error
      );

      alert(
        "Erro ao gerar pagamento PIX"
      );
    } finally {
      setLoading(false);
    }
  }

  async function pagarCartao() {
    try {
      setLoading(true);

      await InicioApi.post(
        "/mercado/pagamento/cartao",
        {
          ...cartao,
        },
        {
          withCredentials: true,
        }
      );

      alert(
        "Pagamento realizado com sucesso!"
      );
    } catch (error) {
      console.error(
        "Erro ao pagar com cartão:",
        error
      );

      alert(
        "Erro ao processar pagamento"
      );
    } finally {
      setLoading(false);
    }
  }

  async function copiarPix() {
    if (!pixData?.qr_code) return;

    await navigator.clipboard.writeText(
      pixData.qr_code
    );

    alert("PIX copiado!");
  }

  return (
    <main className="pagamento-page">
      <div className="pagamento-container">
        {/* HEADER */}

        <div className="pagamento-header">
          <h1>Pagamento</h1>

          <p>
            Escolha como deseja pagar
            seu pedido.
          </p>
        </div>

        {/* STEPS */}

        <div className="checkout-steps">
          <div className="step completed">
            <div className="step-icon">
              <FiCheckCircle />
            </div>

            <div>
              <strong>
                1. Endereço
              </strong>

              <p>
                Endereço confirmado
              </p>
            </div>
          </div>

          <div className="step completed">
            <div className="step-icon">
              <FiTruck />
            </div>

            <div>
              <strong>
                2. Entrega
              </strong>

              <p>
                Frete selecionado
              </p>
            </div>
          </div>

          <div className="step active">
            <div className="step-icon">
              <FiCreditCard />
            </div>

            <div>
              <strong>
                3. Pagamento
              </strong>

              <p>
                Finalizar pedido
              </p>
            </div>
          </div>
        </div>

        <div className="pagamento-content">
          {/* MÉTODOS */}

          <div className="pagamento-metodos">
            <button
              className={`metodo-card ${
                metodo === "pix"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setMetodo("pix")
              }
            >
              <FiCreditCard />

              <div>
                <strong>PIX</strong>

                <p>
                  Aprovação instantânea
                </p>
              </div>
            </button>

            <button
              className={`metodo-card ${
                metodo === "cartao"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setMetodo("cartao")
              }
            >
              <FiCreditCard />

              <div>
                <strong>
                  Cartão de Crédito
                </strong>

                <p>
                  Parcelamento disponível
                </p>
              </div>
            </button>
          </div>

          {/* PIX */}

          {metodo === "pix" && (
            <div className="pagamento-card">
              <h2>
                Pagamento via PIX
              </h2>

              {!pixData && (
                <>
                  <p className="descricao">
                    Gere um QR Code PIX
                    para finalizar sua
                    compra.
                  </p>

                  <button
                    className="btn-finalizar"
                    onClick={pagarPix}
                    disabled={loading}
                  >
                    {loading
                      ? "Gerando PIX..."
                      : "Gerar PIX"}
                  </button>
                </>
              )}

              {pixData && (
                <div className="pix-box">
                  {pixData.qr_code_base64 && (
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="PIX"
                      className="pix-image"
                    />
                  )}

                  <textarea
                    readOnly
                    value={
                      pixData.qr_code
                    }
                  />

                  <button
                    className="btn-copy"
                    onClick={copiarPix}
                  >
                    <FiCopy />
                    Copiar código PIX
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CARTÃO */}

          {metodo === "cartao" && (
            <div className="pagamento-card">
              <h2>
                Cartão de Crédito
              </h2>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Nome no cartão
                  </label>

                  <input
                    type="text"
                    value={cartao.nome}
                    onChange={(e) =>
                      setCartao({
                        ...cartao,
                        nome:
                          e.target
                            .value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Número do cartão
                  </label>

                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cartao.numero}
                    onChange={(e) =>
                      setCartao({
                        ...cartao,
                        numero:
                          e.target
                            .value,
                      })
                    }
                  />
                </div>

                <div className="duplo">
                  <div className="form-group">
                    <label>
                      Validade
                    </label>

                    <input
                      type="text"
                      placeholder="12/30"
                      value={
                        cartao.validade
                      }
                      onChange={(e) =>
                        setCartao({
                          ...cartao,
                          validade:
                            e.target
                              .value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>CVV</label>

                    <input
                      type="text"
                      placeholder="123"
                      value={
                        cartao.cvv
                      }
                      onChange={(e) =>
                        setCartao({
                          ...cartao,
                          cvv:
                            e.target
                              .value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <button
                className="btn-finalizar"
                onClick={
                  pagarCartao
                }
                disabled={loading}
              >
                {loading
                  ? "Processando..."
                  : "Finalizar pagamento"}
              </button>
            </div>
          )}
        </div>

        <div className="voltar-box">
          <Link
            href="/Carrinho/entrega"
            className="btn-voltar"
          >
            Voltar para entrega
          </Link>
        </div>
      </div>
    </main>
  );
}