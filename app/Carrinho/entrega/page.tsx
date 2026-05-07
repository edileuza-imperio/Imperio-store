"use client";

import "./entrega.css";

import Link from "next/link";

import {
  FiMapPin,
  FiTruck,
  FiCreditCard,
  FiCheckCircle,
} from "react-icons/fi";

import {
  useEffect,
  useState,
} from "react";

export default function EntregaPage() {
  const [
    enderecoId,
    setEnderecoId,
  ] = useState<string | null>(
    null
  );

  const [
    entregaSelecionada,
    setEntregaSelecionada,
  ] = useState("padrao");

  useEffect(() => {
    const endereco =
      localStorage.getItem(
        "checkout_endereco_id"
      );

    setEnderecoId(endereco);
  }, []);

  function continuarPagamento() {
    localStorage.setItem(
      "checkout_entrega",
      entregaSelecionada
    );

    window.location.href =
      "/Carrinho/pagamento";
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        {/* HEADER */}

        <div className="checkout-header">
          <h1>Entrega</h1>

          <p>
            Escolha o método de
            envio do seu pedido.
          </p>
        </div>

        {/* STEPS */}

        <div className="checkout-steps">
          {/* ENDEREÇO */}
          <div className="step completed">
            <div className="step-icon">
              <FiCheckCircle />
            </div>

            <div>
              <strong>
                1. Endereço
              </strong>

              <p>
                Endereço
                selecionado
              </p>
            </div>
          </div>

          {/* ENTREGA */}
          <div className="step active">
            <div className="step-icon">
              <FiTruck />
            </div>

            <div>
              <strong>
                2. Entrega
              </strong>

              <p>
                Método de envio
              </p>
            </div>
          </div>

          {/* PAGAMENTO */}
          <div className="step">
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

        {/* CONTEÚDO */}

        <div className="checkout-content">
          <div className="checkout-card">
            <div className="card-header">
              <h2>
                Método de entrega
              </h2>

              <Link
                href="/Carrinho/checkout"
                className="change-address"
              >
                Alterar endereço
              </Link>
            </div>

            {!enderecoId && (
              <div className="empty-address">
                <FiMapPin />

                <h3>
                  Nenhum endereço
                  selecionado
                </h3>

                <Link
                  href="/Carrinho/checkout"
                  className="address-btn"
                >
                  Voltar
                </Link>
              </div>
            )}

            {enderecoId && (
              <>
                <div className="delivery-options">
                  {/* PADRÃO */}
                  <button
                    type="button"
                    className={`delivery-card ${
                      entregaSelecionada ===
                      "padrao"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setEntregaSelecionada(
                        "padrao"
                      )
                    }
                  >
                    <div>
                      <strong>
                        Entrega padrão
                      </strong>

                      <p>
                        Receba em até
                        7 dias úteis
                      </p>
                    </div>

                    <span>
                      R$ 19,90
                    </span>
                  </button>

                  {/* EXPRESSA */}
                  <button
                    type="button"
                    className={`delivery-card ${
                      entregaSelecionada ===
                      "expressa"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setEntregaSelecionada(
                        "expressa"
                      )
                    }
                  >
                    <div>
                      <strong>
                        Entrega expressa
                      </strong>

                      <p>
                        Receba em até
                        2 dias úteis
                      </p>
                    </div>

                    <span>
                      R$ 39,90
                    </span>
                  </button>
                </div>

                <div className="checkout-actions">
                  <button
                    className="continue-btn"
                    onClick={
                      continuarPagamento
                    }
                  >
                    Continuar para
                    pagamento
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}