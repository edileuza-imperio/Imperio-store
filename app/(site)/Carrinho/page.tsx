"use client";

import Image from "next/image";
import { FaShoppingBag, FaTrash, FaLock, FaHeart } from "react-icons/fa";
import { useCarrinho } from "./usecarrinho";
import styles from "./CarrinhoPage.module.css";

export default function CarrinhoPage() {
  const {
    itens,
    total,
    loading,
    loadingItem,
    getItemId,
    getItemNome,
    getItemImagem,
    getQuantidade,
    getPreco,
    getSubtotal,
    formatarMoeda,
    removerItem,
    alterarQuantidade,
  } = useCarrinho();

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.loadingBox}>
          <div className={styles.spinner} />
          <p>Carregando seu carrinho...</p>
        </section>
      </main>
    );
  }

  if (!itens.length) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyBox}>
          <div className={styles.emptyIcon}>
            <FaShoppingBag size={34} />
          </div>

          <span className={styles.badge}>Carrinho</span>

          <h1>Seu carrinho está vazio</h1>

          <p>
            Escolha seus produtos favoritos e volte aqui para finalizar sua
            compra com segurança.
          </p>

          <a href="/" className={styles.primaryButton}>
            Continuar comprando
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrapper}>
        <header className={styles.pageHeader}>
          <span className={styles.badge}>Minha compra</span>

          <h1>Carrinho de compras</h1>

          <p>Confira os itens antes de finalizar seu pedido.</p>
        </header>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2>Produtos selecionados</h2>
                <p>{itens.length} produto(s) no carrinho</p>
              </div>

              <a href="/" className={styles.continueLink}>
                Continuar comprando
              </a>
            </div>

            <div className={styles.items}>
              {itens.map((item) => {
                const itemId = getItemId(item);
                const quantidade = getQuantidade(item);
                const carregando = String(loadingItem) === String(itemId);

                return (
                  <article key={String(itemId)} className={styles.item}>
                    <div className={styles.imageBox}>
                      <Image
                        src={getItemImagem(item)}
                        alt={getItemNome(item)}
                        fill
                        sizes="(max-width: 640px) 100vw, 130px"
                        className={styles.image}
                      />
                    </div>

                    <div className={styles.itemContent}>
                      <div className={styles.itemTop}>
                        <div className={styles.itemInfo}>
                          <h3>{getItemNome(item)}</h3>

                          <p>
                            Valor unitário:{" "}
                            <strong>{formatarMoeda(getPreco(item))}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={carregando}
                          onClick={() => removerItem(itemId)}
                          className={styles.removeButton}
                          title="Remover produto"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>

                      <div className={styles.itemBottom}>
                        <label className={styles.selectGroup}>
                          <span>Quantidade</span>

                          <select
                            value={quantidade}
                            disabled={carregando}
                            onChange={(event) =>
                              alterarQuantidade(item, Number(event.target.value))
                            }
                            className={styles.quantitySelect}
                          >
                            {[1, 2, 3, 4, 5].map((numero) => (
                              <option key={numero} value={numero}>
                                {numero}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className={styles.itemTotalBox}>
                          <span>Subtotal</span>
                          <strong>{formatarMoeda(getSubtotal(item))}</strong>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className={styles.summary}>
            <div className={styles.summaryHeader}>
              <div className={styles.summaryIcon}>
                <FaHeart size={18} />
              </div>

              <div>
                <h2>Resumo do pedido</h2>
                <p>Confira os valores da compra</p>
              </div>
            </div>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <strong>{formatarMoeda(total)}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Frete</span>
                <strong>No checkout</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Descontos</span>
                <strong>{formatarMoeda(0)}</strong>
              </div>
            </div>

            <div className={styles.totalBox}>
              <span>Total</span>
              <strong>{formatarMoeda(total)}</strong>
            </div>

            <a href="/checkout" className={styles.checkoutButton}>
              Finalizar compra
            </a>

            <p className={styles.securityText}>
              <FaLock size={12} />
              Pagamento seguro via PIX e Mercado Pago.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}