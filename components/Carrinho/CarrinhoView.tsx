"use client";

import Link from "next/link";
import Image from "next/image";

import styles from "../carrinho.module.css";

import {
  FiShoppingCart,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiLoader,
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
        {/* HEADER */}
        <header className={styles.header}>
          <div>
            <span className={styles.badge}>
              <FiShoppingCart />
              Meu carrinho
            </span>

            <h1>Finalize seu pedido</h1>

            <p>
              Confira seus produtos antes de
              finalizar a compra.
            </p>
          </div>

          <div className={styles.counter}>
            {itens.length}{" "}
            {itens.length === 1
              ? "item"
              : "itens"}
          </div>
        </header>

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
                  <div className={styles.imageBox}>
                    <Image
                      src={imagem}
                      alt={nome}
                      width={130}
                      height={130}
                      className={styles.image}
                      unoptimized
                    />
                  </div>

                  <div
                    className={styles.productContent}
                  >
                    <div className={styles.top}>
                      <div>
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

          {/* RESUMO */}
          <aside className={styles.summary}>
            <div className={styles.summaryCard}>
              <h3>Resumo do pedido</h3>

              <div className={styles.summaryRow}>
                <span>Produtos</span>

                <strong>
                  {itens.length}
                </strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Entrega</span>

                <strong>Grátis</strong>
              </div>

              <div className={styles.line} />

              <div className={styles.totalRow}>
                <span>Total</span>

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
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}