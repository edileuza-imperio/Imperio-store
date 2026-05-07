"use client";

import Link from "next/link";
import "./checkout.css";

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

import { useRouter } from "next/navigation";

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
  const router = useRouter();

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

  /*
  |--------------------------------------------------------------------------
  | IR PARA ENTREGA
  |--------------------------------------------------------------------------
  */

  function continuarEntrega() {
    if (!enderecoSelecionado) {
      alert(
        "Selecione um endereço."
      );
      return;
    }

    localStorage.setItem(
      "checkout_endereco_id",
      String(
        enderecoSelecionado
      )
    );

    router.push(
      "/Carrinho/entrega"
    );
  }

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
          {/* ENDEREÇO */}
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

          {/* ENTREGA */}
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
                    <button
                      className="continue-btn"
                      onClick={
                        continuarEntrega
                      }
                    >
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
    </main>
  );
}