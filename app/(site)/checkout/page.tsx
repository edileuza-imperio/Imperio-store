"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiShoppingBag,
  FiLock,
  FiSearch,
  FiPackage,
  FiShield,
} from "react-icons/fi";

import { useCheckout } from "./useCheckout";
import "./CheckoutPage.css";

type CheckoutStep = "endereco" | "entrega";

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

  const [etapa, setEtapa] = useState<CheckoutStep>("endereco");
  const [entregaSelecionada, setEntregaSelecionada] = useState("padrao");

  const enderecoAtivo = useMemo(() => {
    return enderecos.find((endereco) => getEnderecoId(endereco) === enderecoSelecionado);
  }, [enderecos, enderecoSelecionado, getEnderecoId]);

  const podeAvancarParaEntrega =
    !processando &&
    !salvandoEndereco &&
    enderecos.length > 0 &&
    !!enderecoSelecionado;

  const podeFinalizar =
    podeAvancarParaEntrega &&
    etapa === "entrega" &&
    !!entregaSelecionada;

  const entregaValorTexto = valorFrete > 0 ? formatarMoeda(valorFrete) : "Grátis";

  const entregaCidade =
    enderecoAtivo?.cidade && enderecoAtivo?.estado
      ? `${enderecoAtivo.cidade} - ${enderecoAtivo.estado}`
      : "Endereço selecionado";

  useEffect(() => {
    if (!enderecoSelecionado) {
      setEtapa("endereco");
    }
  }, [enderecoSelecionado]);

  function irParaEntrega() {
    if (!podeAvancarParaEntrega) return;

    setEtapa("entrega");

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  function voltarParaEndereco() {
    setEtapa("endereco");

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  function classeEtapa(step: "endereco" | "entrega" | "pagamento") {
    const enderecoOk = !!enderecoSelecionado;
    const entregaOk = etapa === "entrega" && !!entregaSelecionada;

    if (step === "endereco") {
      if (etapa === "endereco") return "checkout-step checkout-step-active";
      if (enderecoOk) return "checkout-step checkout-step-complete";
    }

    if (step === "entrega") {
      if (etapa === "entrega") return "checkout-step checkout-step-active";
      if (entregaOk) return "checkout-step checkout-step-complete";
    }

    return "checkout-step";
  }

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
                <p>
                  {etapa === "endereco"
                    ? "Confirme o endereço de entrega para continuar."
                    : "Escolha a forma de entrega antes de ir para o pagamento."}
                </p>
              </div>

              <div className="checkout-hero-badge">
                <FiPackage />
                {itens.length} item(ns)
              </div>
            </header>

            <section className="checkout-steps" aria-label="Etapas do checkout">
              <button
                type="button"
                className={classeEtapa("endereco")}
                onClick={voltarParaEndereco}
                disabled={processando}
              >
                <div className="checkout-step-icon">
                  <FiMapPin />
                </div>

                <div>
                  <strong>Endereço</strong>
                  <span>Local de entrega</span>
                </div>
              </button>

              <button
                type="button"
                className={classeEtapa("entrega")}
                onClick={irParaEntrega}
                disabled={!podeAvancarParaEntrega || processando}
              >
                <div className="checkout-step-icon">
                  <FiTruck />
                </div>

                <div>
                  <strong>Entrega</strong>
                  <span>Frete e prazo</span>
                </div>
              </button>

              <div className={classeEtapa("pagamento")}>
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
              <div className="checkout-loading-card">Carregando checkout...</div>
            ) : (
              <div className="checkout-grid">
                <section className="checkout-main">
                  {etapa === "endereco" && (
                    <div className="checkout-panel">
                      <div className="checkout-panel-header">
                        <span className="checkout-panel-kicker">
                          <FiMapPin />
                          Etapa 1 de 3
                        </span>

                        <h2>Endereço de entrega</h2>
                        <p>Selecione ou cadastre um endereço para continuar.</p>
                      </div>

                      {enderecos.length === 0 ? (
                        <div className="checkout-address-form">
                          <h3>Cadastrar endereço</h3>

                          <div className="checkout-form-grid">
                            <label className="checkout-form-full">
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

                            <label className="checkout-form-large">
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

                            <label className="checkout-form-full">
                              <span>Complemento</span>
                              <input
                                value={formEndereco.complemento}
                                onChange={(e) =>
                                  alterarCampoEndereco(
                                    "complemento",
                                    e.target.value
                                  )
                                }
                                placeholder="Apto, bloco, referência..."
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

                                  {endereco.cep && <span>CEP {endereco.cep}</span>}
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
                          onClick={irParaEntrega}
                          disabled={!podeAvancarParaEntrega}
                        >
                          Continuar para entrega
                          <FiArrowRight />
                        </button>
                      </div>
                    </div>
                  )}

                  {etapa === "entrega" && (
                    <div className="checkout-panel">
                      <div className="checkout-panel-header">
                        <span className="checkout-panel-kicker">
                          <FiTruck />
                          Etapa 2 de 3
                        </span>

                        <h2>Forma de entrega</h2>
                        <p>
                          Confira o local escolhido e selecione a opção de
                          entrega disponível.
                        </p>
                      </div>

                      <div className="checkout-selected-address">
                        <div className="checkout-selected-address-icon">
                          <FiMapPin />
                        </div>

                        <div>
                          <span>Entregar em</span>

                          <strong>
                            {enderecoAtivo?.rua ||
                              enderecoAtivo?.endereco ||
                              "Endereço"}
                            , {enderecoAtivo?.numero || "S/N"}
                          </strong>

                          <p>
                            {enderecoAtivo?.bairro && `${enderecoAtivo.bairro} • `}
                            {entregaCidade}
                            {enderecoAtivo?.cep && ` • CEP ${enderecoAtivo.cep}`}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="checkout-change-address"
                          onClick={voltarParaEndereco}
                        >
                          Alterar
                        </button>
                      </div>

                      <div className="checkout-delivery-list">
                        <button
                          type="button"
                          className={`checkout-delivery-card ${
                            entregaSelecionada === "padrao"
                              ? "checkout-delivery-card-active"
                              : ""
                          }`}
                          onClick={() => setEntregaSelecionada("padrao")}
                        >
                          <div className="checkout-delivery-icon">
                            <FiTruck />
                          </div>

                          <div className="checkout-delivery-info">
                            <strong>Entrega padrão</strong>
                            <span>
                              O prazo pode variar conforme endereço, estoque e
                              confirmação do pedido.
                            </span>

                            <small>
                              Ideal para envio comum ou entrega combinada pela
                              loja.
                            </small>
                          </div>

                          <div className="checkout-delivery-price">
                            <span>{entregaValorTexto}</span>
                            {entregaSelecionada === "padrao" && <FiCheckCircle />}
                          </div>
                        </button>
                      </div>

                      <div className="checkout-delivery-note">
                        <FiShield />
                        <span>
                          Nesta etapa você pode mostrar frete, prazo ou entrega
                          combinada. Para frete automático, o cálculo precisa
                          vir do seu backend/API pelo CEP.
                        </span>
                      </div>

                      <div className="checkout-panel-actions">
                        <button
                          type="button"
                          className="checkout-btn-secondary"
                          onClick={voltarParaEndereco}
                        >
                          <FiArrowLeft />
                          Voltar ao endereço
                        </button>

                        <button
                          type="button"
                          className="checkout-btn-primary"
                          onClick={finalizarCheckout}
                          disabled={!podeFinalizar}
                        >
                          {processando ? "Processando..." : "Ir para pagamento"}
                          <FiArrowRight />
                        </button>
                      </div>
                    </div>
                  )}
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
                        <strong>{entregaValorTexto}</strong>
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

                    {etapa === "endereco" ? (
                      <button
                        type="button"
                        className="checkout-btn-primary checkout-full"
                        onClick={irParaEntrega}
                        disabled={!podeAvancarParaEntrega}
                      >
                        Continuar para entrega
                        <FiArrowRight />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="checkout-btn-primary checkout-full"
                        onClick={finalizarCheckout}
                        disabled={!podeFinalizar}
                      >
                        {processando ? "Processando..." : "Ir para pagamento"}
                        <FiArrowRight />
                      </button>
                    )}

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