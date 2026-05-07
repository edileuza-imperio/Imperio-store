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
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  principal?: boolean;
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

        const lista =
          response?.data?.dados ||
          response?.data?.data ||
          response?.data ||
          [];

        setEnderecos(lista);

        /*
        |--------------------------------------------------------------------------
        | Seleciona principal automaticamente
        |--------------------------------------------------------------------------
        */

        const principal =
          lista.find(
            (item: Endereco) =>
              item.principal
          );

        if (principal) {
          setEnderecoSelecionado(
            getEnderecoId(principal)
          );
        } else if (lista.length > 0) {
          setEnderecoSelecionado(
            getEnderecoId(lista[0])
          );
        }
      } catch (error) {
        console.error(error);
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
            Finalize sua compra em
            poucos passos.
          </p>
        </div>

        {/* ETAPAS */}

        <div className="checkout-steps">
          <div className="step active">
            <div className="step-icon">
              <FiMapPin />
            </div>

            <span>Endereço</span>
          </div>

          <div className="step">
            <div className="step-icon">
              <FiTruck />
            </div>

            <span>Entrega</span>
          </div>

          <div className="step">
            <div className="step-icon">
              <FiCreditCard />
            </div>

            <span>Pagamento</span>
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="checkout-loading">
            Carregando endereços...
          </div>
        )}

        {/* ENDEREÇOS */}

        {!loading && (
          <div className="checkout-content">
            <div className="checkout-card">
              <h2>
                Selecione o endereço
              </h2>

              {/* SEM ENDEREÇO */}

              {enderecos.length ===
                0 && (
                <div className="empty-address">
                  <FiMapPin size={50} />

                  <h3>
                    Nenhum endereço
                    cadastrado
                  </h3>

                  <p>
                    Você precisa
                    cadastrar um
                    endereço antes de
                    finalizar a
                    compra.
                  </p>

                  <Link
                    href="/endereco"
                    className="address-btn"
                  >
                    Cadastrar endereço
                  </Link>
                </div>
              )}

              {/* COM ENDEREÇOS */}

              {enderecos.length > 0 && (
                <div className="address-list">
                  {enderecos.map(
                    (endereco) => {
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
                          <div>
                            <strong>
                              {
                                endereco.rua
                              }
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
                            <FiCheckCircle />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              )}

              {/* BOTÃO */}

              {enderecos.length > 0 && (
                <div className="checkout-actions">
                  <button className="continue-btn">
                    Continuar para
                    entrega
                  </button>
                </div>
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
          font-size: 36px;
          margin-bottom: 10px;
        }

        .checkout-header p {
          color: #666;
        }

        .checkout-steps {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }

        .step {
          flex: 1;
          background: white;
          border-radius: 14px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 2px solid #e5e5e5;
        }

        .step.active {
          border-color: #111;
        }

        .step-icon {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: #111;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkout-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
        }

        .checkout-card h2 {
          margin-bottom: 25px;
        }

        .address-list {
          display: grid;
          gap: 16px;
        }

        .address-card {
          width: 100%;
          border: 2px solid #e5e5e5;
          border-radius: 16px;
          padding: 20px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: 0.2s;
          text-align: left;
        }

        .address-card:hover {
          border-color: #999;
        }

        .address-card.active {
          border-color: #111;
          background: #fafafa;
        }

        .address-card strong {
          display: block;
          margin-bottom: 6px;
        }

        .address-card p {
          margin: 0;
          color: #666;
        }

        .address-card small {
          color: #999;
        }

        .checkout-actions {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }

        .continue-btn {
          background: #111;
          color: white;
          border: none;
          padding: 16px 26px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
        }

        .continue-btn:hover {
          opacity: 0.9;
        }

        .empty-address {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-address h3 {
          margin-top: 20px;
          margin-bottom: 10px;
        }

        .empty-address p {
          color: #666;
          margin-bottom: 25px;
        }

        .address-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #111;
          color: white;
          text-decoration: none;
          padding: 14px 22px;
          border-radius: 12px;
          font-weight: 600;
        }

        .checkout-loading {
          background: white;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .checkout-steps {
            flex-direction: column;
          }

          .checkout-header h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </main>
  );
}