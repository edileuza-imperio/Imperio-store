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
import styles from "./CheckoutPage.module.css";

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
    <main className={styles.checkoutPage}>
      <div className={styles.checkoutShell}>
        {isCarrinhoVazio ? (
          <section className={`${styles.emptyCard} ${styles.glass}`}>
            <div className={styles.emptyIcon}>
              <FiShoppingBag size={30} />
            </div>

            <h1>Seu carrinho está vazio</h1>
            <p>Adicione produtos antes de continuar para o checkout.</p>

            <Link href="/" className={styles.btnPrimary}>
              Explorar coleção
            </Link>
          </section>
        ) : (
          <>
            <header className={`${styles.checkoutHero} ${styles.glass}`}>
              <div>
                <div className={styles.eyebrow}>
                  <FiLock />
                  <span>Checkout seguro</span>
                </div>

                <h1>Finalize sua compra</h1>
                <p>Revise endereço, resumo e siga para o pagamento.</p>
              </div>

              <div className={styles.heroBadge}>{itens.length} item(ns)</div>
            </header>

            <section className={styles.steps}>
              <div className={`${styles.step} ${styles.stepActive}`}>
                <FiMapPin />
                <div>
                  <strong>1. Endereço</strong>
                  <span>Escolha onde receber</span>
                </div>
              </div>

              <div className={styles.step}>
                <FiTruck />
                <div>
                  <strong>2. Entrega</strong>
                  <span>Envio e prazo</span>
                </div>
              </div>

              <div className={styles.step}>
                <FiCreditCard />
                <div>
                  <strong>3. Pagamento</strong>
                  <span>Concluir pedido</span>
                </div>
              </div>
            </section>

            {loading && (
              <div className={`${styles.loadingCard} ${styles.glass}`}>
                Carregando informações do checkout...
              </div>
            )}

            {!loading && (
              <div className={styles.checkoutGrid}>
                <section className={styles.checkoutMain}>
                  <div className={`${styles.panel} ${styles.glass}`}>
                    <div className={styles.panelHeader}>
                      <h2>Endereço de entrega</h2>
                      <p>
                        Selecione ou cadastre o local para receber seu pedido.
                      </p>
                    </div>

                    {enderecos.length === 0 ? (
                      <div className={styles.addressForm}>
                        <h3>Cadastrar endereço</h3>
                        <p>
                          Digite o CEP para preencher rua, bairro, cidade e
                          estado automaticamente.
                        </p>

                        <div className={styles.formGrid}>
                          <label>
                            <span>CEP</span>
                            <div className={styles.cepRow}>
                              <input
                                placeholder="Ex: 13000-000"
                                value={formEndereco.cep}
                                onChange={(e) =>
                                  alterarCampoEndereco("cep", e.target.value)
                                }
                                onBlur={() => buscarCep()}
                                maxLength={9}
                              />

                              <button
                                type="button"
                                className={styles.cepButton}
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
                              placeholder="Nome da rua"
                              value={formEndereco.rua}
                              onChange={(e) =>
                                alterarCampoEndereco("rua", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            <span>Número</span>
                            <input
                              placeholder="Ex: 123"
                              value={formEndereco.numero}
                              onChange={(e) =>
                                alterarCampoEndereco("numero", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            <span>Complemento</span>
                            <input
                              placeholder="Apto, bloco, referência..."
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
                              placeholder="Nome do bairro"
                              value={formEndereco.bairro}
                              onChange={(e) =>
                                alterarCampoEndereco("bairro", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            <span>Cidade</span>
                            <input
                              placeholder="Nome da cidade"
                              value={formEndereco.cidade}
                              onChange={(e) =>
                                alterarCampoEndereco("cidade", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            <span>Estado</span>
                            <input
                              placeholder="Ex: SP"
                              value={formEndereco.estado}
                              onChange={(e) =>
                                alterarCampoEndereco("estado", e.target.value)
                              }
                              maxLength={2}
                            />
                          </label>
                        </div>

                        {erroEndereco && (
                          <p className={styles.formError}>{erroEndereco}</p>
                        )}

                        {sucessoEndereco && (
                          <p className={styles.formSuccess}>
                            {sucessoEndereco}
                          </p>
                        )}

                        <button
                          type="button"
                          className={`${styles.btnPrimary} ${styles.full}`}
                          onClick={cadastrarEndereco}
                          disabled={salvandoEndereco || buscandoCep}
                        >
                          {salvandoEndereco
                            ? "Salvando endereço..."
                            : "Salvar endereço"}
                          <FiCheckCircle />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.addressList}>
                        {enderecos.map((endereco) => {
                          const id = getEnderecoId(endereco);
                          const ativo = enderecoSelecionado === id;

                          return (
                            <button
                              key={id}
                              type="button"
                              className={`${styles.addressCard} ${
                                ativo ? styles.addressCardActive : ""
                              }`}
                              onClick={() => setEnderecoSelecionado(id)}
                            >
                              <div className={styles.addressIcon}>
                                <FiMapPin />
                              </div>

                              <div className={styles.addressInfo}>
                                <strong>
                                  {endereco.rua ||
                                    endereco.endereco ||
                                    "Endereço sem nome"}
                                  , {endereco.numero || "S/N"}
                                </strong>

                                {endereco.complemento && (
                                  <span>{endereco.complemento}</span>
                                )}

                                <span>
                                  {endereco.bairro || "Bairro não informado"}
                                </span>

                                <span>
                                  {endereco.cidade || "Cidade"} -{" "}
                                  {endereco.estado || "UF"}
                                </span>

                                {endereco.cep && <span>CEP {endereco.cep}</span>}
                              </div>

                              {ativo && (
                                <FiCheckCircle
                                  className={styles.addressCheck}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className={styles.panelActions}>
                      <Link href="/Carrinho" className={styles.btnSecondary}>
                        Voltar ao carrinho
                      </Link>

                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={finalizarCheckout}
                        disabled={
                          processando ||
                          salvandoEndereco ||
                          !enderecos.length ||
                          !enderecoSelecionado
                        }
                      >
                        {processando ? "Processando..." : "Ir para pagamento"}
                        <FiArrowRight />
                      </button>
                    </div>
                  </div>
                </section>

                <aside className={styles.checkoutAside}>
                  <div className={`${styles.summaryCard} ${styles.glass}`}>
                    <div className={styles.summaryHeader}>
                      <h2>Resumo do pedido</h2>
                      <p>{itens.length} produto(s) no carrinho</p>
                    </div>

                    <div className={styles.summaryItems}>
                      {itens.map((item) => {
                        const nome = getItemNome(item);
                        const imagem = getItemImagem(item);
                        const qtd = getItemQuantidade(item);
                        const subtotal = getItemSubtotal(item);

                        return (
                          <div
                            className={styles.summaryItem}
                            key={String(getItemId(item))}
                          >
                            <div className={styles.summaryImageWrap}>
                              <Image
                                src={imagem}
                                alt={nome}
                                width={52}
                                height={52}
                                className={styles.summaryImage}
                              />
                            </div>

                            <div className={styles.summaryInfo}>
                              <strong>{nome}</strong>
                              <span>Qtd: {qtd}</span>
                            </div>

                            <div className={styles.summaryPrice}>
                              {formatarMoeda(subtotal)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.summaryBox}>
                      <div className={styles.summaryRow}>
                        <span>Subtotal</span>
                        <strong>{formatarMoeda(subtotalItens)}</strong>
                      </div>

                      <div className={styles.summaryRow}>
                        <span>Frete</span>
                        <strong>
                          {valorFrete > 0
                            ? formatarMoeda(valorFrete)
                            : "Grátis"}
                        </strong>
                      </div>

                      <div className={styles.summaryRow}>
                        <span>Desconto</span>
                        <strong>- {formatarMoeda(valorDesconto)}</strong>
                      </div>

                      <div className={styles.summaryTotal}>
                        <span>Total</span>
                        <strong>{formatarMoeda(valorTotal)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`${styles.btnPrimary} ${styles.full}`}
                      onClick={finalizarCheckout}
                      disabled={
                        processando ||
                        salvandoEndereco ||
                        !enderecos.length ||
                        !enderecoSelecionado
                      }
                    >
                      {processando ? "Processando..." : "Ir para pagamento"}
                      <FiArrowRight />
                    </button>

                    <p className={styles.summaryNote}>
                      Pagamento seguro, dados protegidos e experiência premium.
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