"use client";

import Link from "next/link";

import {
  FiCheckCircle,
  FiMapPin,
  FiCreditCard,
  FiTruck,
} from "react-icons/fi";

import {
  useEffect,
  useState,
} from "react";

import { InicioApi } from "@/services/api/api";

type Endereco = {
  id?: number;
  id_endereco?: number;

  cep?: string;

  rua?: string;
  endereco?: string;

  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  principal?: boolean | number;
};

function getEnderecoId(
  endereco: Endereco
) {
  return (
    endereco.id ??
    endereco.id_endereco ??
    0
  );
}

export default function CheckoutPage() {
  const [loading, setLoading] =
    useState(true);

  const [enderecos, setEnderecos] =
    useState<Endereco[]>([]);

  const [
    enderecoSelecionado,
    setEnderecoSelecionado,
  ] = useState<
    number | string | null
  >(null);

  /*
  |--------------------------------------------------------------------------
  | CARREGAR ENDEREÇOS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);

        const response =
          await InicioApi.get(
            "/usuario/endereco",
            {
              withCredentials: true,
            }
          );

        /*
        |--------------------------------------------------------------------------
        | TYPESCRIPT FIX
        |--------------------------------------------------------------------------
        */

        const responseData: any =
          response?.data;

        const lista: Endereco[] =
          Array.isArray(
            responseData
          )
            ? responseData
            : Array.isArray(
                responseData?.dados
              )
            ? responseData.dados
            : Array.isArray(
                responseData?.data
              )
            ? responseData.data
            : [];

        setEnderecos(lista);

        /*
        |--------------------------------------------------------------------------
        | SELECIONA PRINCIPAL
        |--------------------------------------------------------------------------
        */

        const principal =
          lista.find(
            (item) =>
              item.principal ===
                true ||
              item.principal === 1
          );

        if (principal) {
          setEnderecoSelecionado(
            getEnderecoId(principal)
          );
        } else if (
          lista.length > 0
        ) {
          setEnderecoSelecionado(
            getEnderecoId(
              lista[0]
            )
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar endereços:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        {/* HEADER */}

        <div className="checkout-header">
          <h1>Checkout</h1>

          <p>
            Finalize sua compra
            em poucos passos.
          </p>
        </div>

        {/* ETAPAS */}

        <div className="checkout-steps">
          <div className="step active">
            <div className="step-icon">
              <FiMapPin />
            </div>

            <div>
              <strong>
                1. Endereço
              </strong>

              <p>
                Escolha onde
                receber
              </p>
            </div>
          </div>

          <div className="step">
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

        {/* LOADING */}

        {loading && (
          <div className="checkout-loading">
            Carregando
            endereços...
          </div>
        )}

        {/* CONTEÚDO */}

        {!loading && (
          <div className="checkout-content">
            <div className="checkout-card">
              <div className="card-header">
                <h2>
                  Selecione o
                  endereço de
                  entrega
                </h2>

                {enderecos.length >
                  0 && (
                  <Link
                    href="/endereco"
                    className="new-address-btn"
                  >
                    Novo endereço
                  </Link>
                )}
              </div>

              {/* SEM ENDEREÇO */}

              {enderecos.length ===
                0 && (
                <div className="empty-address">
                  <div className="empty-icon">
                    <FiMapPin />
                  </div>

                  <h3>
                    Nenhum endereço
                    cadastrado
                  </h3>

                  <p>
                    Você precisa
                    cadastrar um
                    endereço antes
                    de continuar o
                    checkout.
                  </p>

                  <Link
                    href="/endereco"
                    className="address-btn"
                  >
                    Cadastrar
                    endereço
                  </Link>
                </div>
              )}

              {/* COM ENDEREÇOS */}

              {enderecos.length >
                0 && (
                <>
                  <div className="address-list">
                    {enderecos.map(
                      (
                        endereco
                      ) => {
                        const id =
                          getEnderecoId(
                            endereco
                          );

                        const ativo =
                          String(
                            enderecoSelecionado
                          ) ===
                          String(id);

                        return (
                          <button
                            key={String(
                              id
                            )}
                            type="button"
                            className={`address-card ${
                              ativo
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setEnderecoSelecionado(
                                id
                              )
                            }
                          >
                            <div className="address-content">
                              <strong>
                                {endereco.rua ||
                                  endereco.endereco}
                                ,{" "}
                                {
                                  endereco.numero
                                }
                              </strong>

                              <p>
                                {
                                  endereco.bairro
                                }
                              </p>

                              <p>
                                {
                                  endereco.cidade
                                }{" "}
                                -{" "}
                                {
                                  endereco.estado
                                }
                              </p>

                              <small>
                                CEP:{" "}
                                {
                                  endereco.cep
                                }
                              </small>
                            </div>

                            {ativo && (
                              <div className="check-icon">
                                <FiCheckCircle />
                              </div>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="checkout-actions">
                    <button className="continue-btn">
                      Continuar para
                      entrega
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .checkout-page {
          min-height: 100vh;
          background: #f5f5f5;
          padding: 40px 20px;
        }

        .checkout-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .checkout-header {
          margin-bottom: 30px;
        }

        .checkout-header h1 {
          font-size: 38px;
          font-weight: 700;
          color: #111;
          margin-bottom: 10px;
        }

        .checkout-header p {
          color: #666;
          font-size: 15px;
        }

        .checkout-steps {
          display: grid;
          grid-template-columns: repeat(
            3,
            1fr
          );
          gap: 18px;
          margin-bottom: 30px;
        }

        .step {
          background: white;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 2px solid #e5e5e5;
        }

        .step.active {
          border-color: #111;
        }

        .step strong {
          display: block;
          font-size: 15px;
          color: #111;
        }

        .step p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #777;
        }

        .step-icon {
          width: 50px;
          height: 50px;
          border-radius: 999px;
          background: #111;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .checkout-card {
          background: white;
          border-radius: 24px;
          padding: 30px;
          box-shadow: 0 10px 30px
            rgba(0, 0, 0, 0.05);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 25px;
        }

        .card-header h2 {
          font-size: 24px;
          color: #111;
        }

        .new-address-btn {
          background: #111;
          color: white;
          text-decoration: none;
          padding: 12px 18px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }

        .address-list {
          display: grid;
          gap: 16px;
        }

        .address-card {
          width: 100%;
          border: 2px solid #e5e5e5;
          border-radius: 18px;
          padding: 22px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .address-card:hover {
          border-color: #999;
          transform: translateY(
            -2px
          );
        }

        .address-card.active {
          border-color: #111;
          background: #fafafa;
        }

        .address-content strong {
          display: block;
          margin-bottom: 8px;
          font-size: 16px;
          color: #111;
        }

        .address-content p {
          margin: 0 0 5px;
          color: #666;
          font-size: 14px;
        }

        .address-content small {
          color: #999;
          font-size: 13px;
        }

        .check-icon {
          font-size: 28px;
          color: #111;
          flex-shrink: 0;
        }

        .checkout-actions {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }

        .continue-btn {
          border: none;
          background: #111;
          color: white;
          padding: 16px 28px;
          border-radius: 14px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 700;
          transition: 0.2s;
        }

        .continue-btn:hover {
          opacity: 0.92;
        }

        .empty-address {
          text-align: center;
          padding: 70px 20px;
        }

        .empty-icon {
          width: 90px;
          height: 90px;
          border-radius: 999px;
          background: #f1f1f1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 25px;
          font-size: 38px;
          color: #111;
        }

        .empty-address h3 {
          font-size: 26px;
          margin-bottom: 12px;
          color: #111;
        }

        .empty-address p {
          color: #666;
          margin-bottom: 28px;
          max-width: 420px;
          margin-inline: auto;
          line-height: 1.6;
        }

        .address-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #111;
          color: white;
          text-decoration: none;
          padding: 15px 24px;
          border-radius: 14px;
          font-weight: 700;
        }

        .checkout-loading {
          background: white;
          border-radius: 20px;
          padding: 50px;
          text-align: center;
          font-size: 16px;
        }

        @media (max-width: 900px) {
          .checkout-steps {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .checkout-page {
            padding: 20px 14px;
          }

          .checkout-card {
            padding: 22px;
          }

          .checkout-header h1 {
            font-size: 30px;
          }

          .card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .checkout-actions {
            justify-content: stretch;
          }

          .continue-btn {
            width: 100%;
          }

          .address-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
          }
        }
      `}</style>
    </main>
  );
}