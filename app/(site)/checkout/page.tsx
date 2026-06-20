"use client";

import Link from "next/link";
import Image from "next/image";
import {
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiCheckCircle,
  FiArrowRight,
  FiShoppingBag,
  FiLock,
  FiSearch,
} from "react-icons/fi";

import { useCheckout } from "./useCheckout";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const {
    loading,
    processando,
    salvandoEndereco,
    buscandoCep,
    erroEndereco,
    sucessoEndereco,
    enderecos,
    enderecoSelecionado,
    setEnderecoSelecionado,
    formEndereco,
    alterarCampoEndereco,
    buscarCep,
    cadastrarEndereco,
    itens,
    subtotalItens,
    valorFrete,
    valorDesconto,
    valorTotal,
    isCarrinhoVazio,
    finalizarCheckout,
    getEnderecoId,
    getItemId,
    getItemNome,
    getItemImagem,
    getItemQuantidade,
    getItemSubtotal,
    formatarMoeda,
  } = useCheckout();

  const podeContinuar =
    !processando &&
    !salvandoEndereco &&
    enderecos.length > 0 &&
    !!enderecoSelecionado;

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        {isCarrinhoVazio ? (
          <section className="checkout-empty-card">
            <div className="checkout-empty-icon">
              <FiShoppingBag />
            </div>

            <h1>Seu carrinho está vazio</h1>
            <p>Adicione produtos antes de continuar para o checkout.</p>

            <Link href="/" className="checkout-btn-primary">
              Explorar produtos
            </Link>
          </section>
        ) : (
          <>
            <header className="checkout-hero">
              <div>
                <div className="checkout-eyebrow">
                  <FiLock />
                  <span>Checkout seguro</span>
                </div>

                <h1>Finalize sua compra</h1>
                <p>Revise o endereço e continue para o pagamento.</p>
              </div>

              <div className="checkout-hero-badge">
                {itens.length} item(ns)
              </div>
            </header>

            <section className="checkout-steps">
              <div className="checkout-step checkout-step-active">
                <div className="checkout-step-icon">
                  <FiMapPin />
                </div>
                <div>
                  <strong>Endereço</strong>
                  <span>Local de entrega</span>
                </div>
              </div>

              <div className="checkout-step">
                <div className="checkout-step-icon">
                  <FiTruck />
                </div>
                <div>
                  <strong>Entrega</strong>
                  <span>Frete e prazo</span>
                </div>
              </div>

              <div className="checkout-step">
                <div className="checkout-step-icon">
                  <FiCreditCard />
                </div>
                <div>
                  <strong>Pagamento</strong>
                  <span>Concluir compra</span>
                </div>
              </div>
            </section>

            {loading ? (
              <div className="checkout-loading-card">
                Carregando checkout...
              </div>
            ) : (
              <div className="checkout-grid">
                <section className="checkout-main">
                  <div className="checkout-panel">
                    <div className="checkout-panel-header">
                      <h2>Endereço de entrega</h2>
                      <p>Selecione ou cadastre um endereço para continuar.</p>
                    </div>

                    {enderecos.length === 0 ? (
                      <div className="checkout-address-form">
                        <h3>Cadastrar endereço</h3>

                        <div className="checkout-form-grid">
                          <label>
                            <span>CEP</span>
                            <div className="checkout-cep-row">
                              <input
                                placeholder="00000-000"
                                value={formEndereco.cep}
                                onChange={(e) =>
                                  alterarCampoEndereco("cep", e.target.value)
                                }
                                onBlur={() => buscarCep()}
                                maxLength={9}
                              />

                              <button
                                type="button"
                                className="checkout-cep-button"
                                onClick={() => buscarCep()}
                                disabled={buscandoCep}
                              >
                                <FiSearch />
                                {buscandoCep ? "Buscando..." : "Buscar"}
                              </button>
                            </div>
                          </label>

                          <label>
                            <span>Rua</span>
                            <input
                              value={formEndereco.rua}
                              onChange={(e) =>
                                alterarCampoEndereco("rua", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            <span>Número</span>
                            <input
                              value={formEndereco.numero}
                              onChange={(e) =>
                                alterarCampoEndereco("numero", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            <span>Complemento</span>
                            <input
                              value={formEndereco.complemento}
                              onChange={(e) =>
                                alterarCampoEndereco(
                                  "complemento",
                                  e.target.value
                                )
                              }
                            />
                          </label>

                          <label>
                            <span>Bairro</span>
                            <input
                              value={formEndereco.bairro}
                              onChange={(e) =>
                                alterarCampoEndereco("bairro", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            <span>Cidade</span>
                            <input
                              value={formEndereco.cidade}
                              onChange={(e) =>
                                alterarCampoEndereco("cidade", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            <span>Estado</span>
                            <input
                              value={formEndereco.estado}
                              onChange={(e) =>
                                alterarCampoEndereco("estado", e.target.value)
                              }
                              maxLength={2}
                            />
                          </label>
                        </div>

                        {erroEndereco && (
                          <p className="checkout-form-error">{erroEndereco}</p>
                        )}

                        {sucessoEndereco && (
                          <p className="checkout-form-success">
                            {sucessoEndereco}
                          </p>
                        )}

                        <button
                          type="button"
                          className="checkout-btn-primary checkout-full"
                          onClick={cadastrarEndereco}
                          disabled={salvandoEndereco || buscandoCep}
                        >
                          {salvandoEndereco
                            ? "Salvando..."
                            : "Salvar endereço"}
                          <FiCheckCircle />
                        </button>
                      </div>
                    ) : (
                      <div className="checkout-address-list">
                        {enderecos.map((endereco) => {
                          const id = getEnderecoId(endereco);
                          const ativo = enderecoSelecionado === id;

                          return (
                            <button
                              key={id}
                              type="button"
                              className={`checkout-address-card ${
                                ativo ? "checkout-address-card-active" : ""
                              }`}
                              onClick={() => setEnderecoSelecionado(id)}
                            >
                              <div className="checkout-address-icon">
                                <FiMapPin />
                              </div>

                              <div className="checkout-address-info">
                                <strong>
                                  {endereco.rua ||
                                    endereco.endereco ||
                                    "Endereço"}
                                  , {endereco.numero || "S/N"}
                                </strong>

                                {endereco.complemento && (
                                  <span>{endereco.complemento}</span>
                                )}

                                <span>{endereco.bairro}</span>
                                <span>
                                  {endereco.cidade} - {endereco.estado}
                                </span>

                                {endereco.cep && (
                                  <span>CEP {endereco.cep}</span>
                                )}
                              </div>

                              {ativo && (
                                <FiCheckCircle className="checkout-address-check" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="checkout-panel-actions">
                      <Link href="/Carrinho" className="checkout-btn-secondary">
                        Voltar ao carrinho
                      </Link>

                      <button
                        type="button"
                        className="checkout-btn-primary"
                        onClick={finalizarCheckout}
                        disabled={!podeContinuar}
                      >
                        {processando ? "Processando..." : "Ir para pagamento"}
                        <FiArrowRight />
                      </button>
                    </div>
                  </div>
                </section>

                <aside className="checkout-aside">
                  <div className="checkout-summary-card">
                    <div className="checkout-summary-header">
                      <h2>Resumo do pedido</h2>
                      <p>{itens.length} produto(s)</p>
                    </div>

                    <div className="checkout-summary-items">
                      {itens.map((item) => {
                        const nome = getItemNome(item);
                        const imagem = getItemImagem(item);

                        return (
                          <div
                            className="checkout-summary-item"
                            key={String(getItemId(item))}
                          >
                            <div className="checkout-summary-image-wrap">
                              <Image
                                src={imagem}
                                alt={nome}
                                width={56}
                                height={56}
                                className="checkout-summary-image"
                              />
                            </div>

                            <div className="checkout-summary-info">
                              <strong>{nome}</strong>
                              <span>Qtd: {getItemQuantidade(item)}</span>
                            </div>

                            <div className="checkout-summary-price">
                              {formatarMoeda(getItemSubtotal(item))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="checkout-summary-box">
                      <div className="checkout-summary-row">
                        <span>Subtotal</span>
                        <strong>{formatarMoeda(subtotalItens)}</strong>
                      </div>

                      <div className="checkout-summary-row">
                        <span>Frete</span>
                        <strong>
                          {valorFrete > 0
                            ? formatarMoeda(valorFrete)
                            : "Grátis"}
                        </strong>
                      </div>

                      <div className="checkout-summary-row">
                        <span>Desconto</span>
                        <strong>- {formatarMoeda(valorDesconto)}</strong>
                      </div>

                      <div className="checkout-summary-total">
                        <span>Total</span>
                        <strong>{formatarMoeda(valorTotal)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="checkout-btn-primary checkout-full"
                      onClick={finalizarCheckout}
                      disabled={!podeContinuar}
                    >
                      {processando ? "Processando..." : "Ir para pagamento"}
                      <FiArrowRight />
                    </button>

                    <p className="checkout-summary-note">
                      🔒 Compra segura com dados protegidos.
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}