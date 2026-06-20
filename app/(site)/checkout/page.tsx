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
import "../../../components/styles/Chekout.css";

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

  return (
    <main className="checkoutPage">
      <div className="checkoutShell">
        {isCarrinhoVazio ? (
          <section className="emptyCard glass">
            <div className="emptyIcon">
              <FiShoppingBag size={30} />
            </div>

            <h1>Seu carrinho está vazio</h1>
            <p>Adicione produtos antes de continuar para o checkout.</p>

            <Link href="/" className="btnPrimary">
              Explorar produtos
            </Link>
          </section>
        ) : (
          <>
            <header className="checkoutHero glass">
              <div>
                <div className="eyebrow">
                  <FiLock />
                  <span>Checkout seguro</span>
                </div>

                <h1>Finalize sua compra</h1>
                <p>Revise seu endereço e confirme o pedido com segurança.</p>
              </div>

              <div className="heroBadge">{itens.length} item(ns)</div>
            </header>

            <section className="steps">
              <div className="step stepActive">
                <FiMapPin />
                <div>
                  <strong>1. Endereço</strong>
                  <span>Local de entrega</span>
                </div>
              </div>

              <div className="step">
                <FiTruck />
                <div>
                  <strong>2. Entrega</strong>
                  <span>Frete e prazo</span>
                </div>
              </div>

              <div className="step">
                <FiCreditCard />
                <div>
                  <strong>3. Pagamento</strong>
                  <span>Concluir compra</span>
                </div>
              </div>
            </section>

            {loading ? (
              <div className="loadingCard glass">
                Carregando checkout...
              </div>
            ) : (
              <div className="checkoutGrid">
                <section className="checkoutMain">
                  <div className="panel glass">
                    <div className="panelHeader">
                      <h2>Endereço de entrega</h2>
                      <p>Selecione ou cadastre um endereço para continuar.</p>
                    </div>

                    {enderecos.length === 0 ? (
                      <div className="addressForm">
                        <h3>Cadastrar endereço</h3>

                        <div className="formGrid">
                          <label>
                            <span>CEP</span>
                            <div className="cepRow">
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
                                className="cepButton"
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
                                alterarCampoEndereco("complemento", e.target.value)
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

                        {erroEndereco && <p className="formError">{erroEndereco}</p>}
                        {sucessoEndereco && <p className="formSuccess">{sucessoEndereco}</p>}

                        <button
                          type="button"
                          className="btnPrimary full"
                          onClick={cadastrarEndereco}
                          disabled={salvandoEndereco || buscandoCep}
                        >
                          {salvandoEndereco ? "Salvando..." : "Salvar endereço"}
                          <FiCheckCircle />
                        </button>
                      </div>
                    ) : (
                      <div className="addressList">
                        {enderecos.map((endereco) => {
                          const id = getEnderecoId(endereco);
                          const ativo = enderecoSelecionado === id;

                          return (
                            <button
                              key={id}
                              type="button"
                              className={`addressCard ${ativo ? "addressCardActive" : ""}`}
                              onClick={() => setEnderecoSelecionado(id)}
                            >
                              <div className="addressIcon">
                                <FiMapPin />
                              </div>

                              <div className="addressInfo">
                                <strong>
                                  {endereco.rua || endereco.endereco || "Endereço"}, {endereco.numero || "S/N"}
                                </strong>
                                {endereco.complemento && <span>{endereco.complemento}</span>}
                                <span>{endereco.bairro}</span>
                                <span>{endereco.cidade} - {endereco.estado}</span>
                                {endereco.cep && <span>CEP {endereco.cep}</span>}
                              </div>

                              {ativo && <FiCheckCircle className="addressCheck" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="panelActions">
                      <Link href="/Carrinho" className="btnSecondary">
                        Voltar ao carrinho
                      </Link>

                      <button
                        type="button"
                        className="btnPrimary"
                        onClick={finalizarCheckout}
                        disabled={processando || salvandoEndereco || !enderecos.length || !enderecoSelecionado}
                      >
                        {processando ? "Processando..." : "Ir para pagamento"}
                        <FiArrowRight />
                      </button>
                    </div>
                  </div>
                </section>

                <aside className="checkoutAside">
                  <div className="summaryCard glass">
                    <div className="summaryHeader">
                      <h2>Resumo do pedido</h2>
                      <p>{itens.length} produto(s)</p>
                    </div>

                    <div className="summaryItems">
                      {itens.map((item) => {
                        const nome = getItemNome(item);
                        const imagem = getItemImagem(item);

                        return (
                          <div className="summaryItem" key={String(getItemId(item))}>
                            <div className="summaryImageWrap">
                              <Image
                                src={imagem}
                                alt={nome}
                                width={52}
                                height={52}
                                className="summaryImage"
                              />
                            </div>

                            <div className="summaryInfo">
                              <strong>{nome}</strong>
                              <span>Qtd: {getItemQuantidade(item)}</span>
                            </div>

                            <div className="summaryPrice">
                              {formatarMoeda(getItemSubtotal(item))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="summaryBox">
                      <div className="summaryRow">
                        <span>Subtotal</span>
                        <strong>{formatarMoeda(subtotalItens)}</strong>
                      </div>

                      <div className="summaryRow">
                        <span>Frete</span>
                        <strong>{valorFrete > 0 ? formatarMoeda(valorFrete) : "Grátis"}</strong>
                      </div>

                      <div className="summaryRow">
                        <span>Desconto</span>
                        <strong>- {formatarMoeda(valorDesconto)}</strong>
                      </div>

                      <div className="summaryTotal">
                        <span>Total</span>
                        <strong>{formatarMoeda(valorTotal)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btnPrimary full"
                      onClick={finalizarCheckout}
                      disabled={processando || salvandoEndereco || !enderecos.length || !enderecoSelecionado}
                    >
                      {processando ? "Processando..." : "Ir para pagamento"}
                      <FiArrowRight />
                    </button>

                    <p className="summaryNote">
                      Compra segura com dados protegidos.
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