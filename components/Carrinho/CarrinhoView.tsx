"use client";

import Link from "next/link";
import Image from "next/image";

import styles from "./../../app/(site)/Carrinho/carrinho.module.css";

import {
  FiShoppingCart,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiLoader,
  FiShield,
  FiTruck,
  FiCreditCard,
} from "react-icons/fi";

import { CarrinhoItem } from "@/app/(site)/Carrinho/page";

type Props = {
  itens: CarrinhoItem[];
  total: number;
  loading: boolean;

  loadingItem: string | number | null;

  getItemId: (
    item: CarrinhoItem
  ) => string | number;

  getItemNome: (
    item: CarrinhoItem
  ) => string;

  getItemImagem: (
    item: CarrinhoItem
  ) => string;

  getQuantidade: (
    item: CarrinhoItem
  ) => number;

  getPreco: (
    item: CarrinhoItem
  ) => number;

  getSubtotal: (
    item: CarrinhoItem
  ) => number;

  formatarMoeda: (
    valor: unknown
  ) => string;

  removerItem: (
    itemId: string | number
  ) => void;

  alterarQuantidade: (
    item: CarrinhoItem,
    novaQuantidade: number
  ) => void;
};

export default function CarrinhoView({
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
}: Props) {
  /* =========================
     EMPTY
  ========================= */
  if (!loading && itens.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>
            <FiShoppingCart />
          </div>

          <h1>Seu carrinho está vazio</h1>

          <p>
            Adicione produtos incríveis para continuar
            comprando.
          </p>

          <Link
            href="/"
            className={styles.primaryButton}
          >
            Explorar produtos
          </Link>
        </div>
      </main>
    );
  }

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingBox}>
          <FiLoader className={styles.loadingIcon} />

          <span>Carregando carrinho...</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* HERO */}
        <section className={styles.hero}>
          <div>
            <span className={styles.badge}>
              <FiShoppingCart />
              Carrinho de compras
            </span>

            <h1>
              Finalize seu pedido com segurança
            </h1>

            <p>
              Revise seus produtos e conclua sua
              compra em poucos passos.
            </p>
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.heroCard}>
              <FiTruck />

              <div>
                <strong>Entrega rápida</strong>
                <span>Envio para todo Brasil</span>
              </div>
            </div>

            <div className={styles.heroCard}>
              <FiShield />

              <div>
                <strong>Compra segura</strong>
                <span>Pagamento protegido</span>
              </div>
            </div>

            <div className={styles.heroCard}>
              <FiCreditCard />

              <div>
                <strong>Pagamento fácil</strong>
                <span>Pix e cartão</span>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className={styles.content}>
          {/* PRODUTOS */}
          <section className={styles.products}>
            {itens.map((item) => {
              const id = getItemId(item);

              const nome = getItemNome(item);

              const imagem = getItemImagem(item);

              const quantidade =
                getQuantidade(item);

              const preco = getPreco(item);

              const subtotal =
                getSubtotal(item);

              const carregando =
                loadingItem === id;

              return (
                <article
                  key={String(id)}
                  className={styles.productCard}
                >
                  {/* IMAGE */}
                  <div className={styles.imageWrapper}>
                    <div className={styles.imageBox}>
                      <Image
                        src={imagem}
                        alt={nome}
                        width={140}
                        height={140}
                        className={styles.image}
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* INFO */}
                  <div
                    className={styles.productContent}
                  >
                    <div className={styles.top}>
                      <div>
                        <span
                          className={
                            styles.productTag
                          }
                        >
                          Produto Premium
                        </span>

                        <h2>{nome}</h2>

                        <span
                          className={
                            styles.unitPrice
                          }
                        >
                          {formatarMoeda(preco)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={
                          styles.removeButton
                        }
                        onClick={() =>
                          removerItem(id)
                        }
                        disabled={carregando}
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className={styles.bottom}>
                      {/* QUANTITY */}
                      <div
                        className={
                          styles.quantityArea
                        }
                      >
                        <span>
                          Quantidade
                        </span>

                        <div
                          className={
                            styles.quantity
                          }
                        >
                          <button
                            type="button"
                            disabled={carregando}
                            onClick={() =>
                              alterarQuantidade(
                                item,
                                quantidade - 1
                              )
                            }
                          >
                            <FiMinus />
                          </button>

                          <span>
                            {quantidade}
                          </span>

                          <button
                            type="button"
                            disabled={carregando}
                            onClick={() =>
                              alterarQuantidade(
                                item,
                                quantidade + 1
                              )
                            }
                          >
                            <FiPlus />
                          </button>
                        </div>
                      </div>

                      {/* SUBTOTAL */}
                      <div
                        className={
                          styles.subtotal
                        }
                      >
                        <span>Subtotal</span>

                        <strong>
                          {formatarMoeda(
                            subtotal
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* SUMMARY */}
          <aside className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <h3>Resumo do pedido</h3>

                <span>
                  {itens.length}{" "}
                  {itens.length === 1
                    ? "item"
                    : "itens"}
                </span>
              </div>

              <div className={styles.summaryItems}>
                <div className={styles.summaryRow}>
                  <span>Produtos</span>

                  <strong>
                    {formatarMoeda(total)}
                  </strong>
                </div>

                <div className={styles.summaryRow}>
                  <span>Entrega</span>

                  <strong className={styles.free}>
                    Grátis
                  </strong>
                </div>

                <div className={styles.summaryRow}>
                  <span>Desconto</span>

                  <strong>R$ 0,00</strong>
                </div>
              </div>

              <div className={styles.line} />

              <div className={styles.totalRow}>
                <div>
                  <span>Total</span>

                  <small>
                    Em até 12x no cartão
                  </small>
                </div>

                <strong>
                  {formatarMoeda(total)}
                </strong>
              </div>

              <Link
                href="/Carrinho/checkout"
                className={
                  styles.checkoutButton
                }
              >
                Finalizar compra

                <FiArrowRight />
              </Link>

              <Link
                href="/"
                className={
                  styles.continueButton
                }
              >
                Continuar comprando
              </Link>

              {/* INFO */}
              <div className={styles.securityInfo}>
                <div>
                  <FiShield />
                  <span>
                    Ambiente 100% seguro
                  </span>
                </div>

                <div>
                  <FiTruck />
                  <span>
                    Frete rápido para todo Brasil
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}