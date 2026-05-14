"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./carrinho.module.css";

import {
  FiShoppingCart,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiLoader,
} from "react-icons/fi";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InicioApi } from "@/services/api/api";
import { toast } from "react-toastify";

/* =========================
   TIPAGEM
========================= */
type CarrinhoItem = {
  id?: number | string;
  id_carrinho_item?: number | string;
  id_item?: number | string;
  item_id?: number | string;

  nome?: string;
  titulo?: string;
  produto_nome?: string;

  produto?: {
    nome?: string;
    titulo?: string;
    imagem?: string;
    miniatura?: string;
    foto?: string;
  };

  imagem?: string;
  miniatura?: string;
  foto?: string;

  quantidade?: number | string;

  preco?: number | string;
  preco_unitario?: number | string;
  subtotal?: number | string;
  total?: number | string;
};

/* =========================
   BASE URL
========================= */
const BASE_URL = "https://lightgrey-cattle-160990.hostingersite.com";

/* =========================
   HELPERS
========================= */
function resolverImagem(src?: string | null) {
  if (!src) return "/images/sem-imagem.png";

  const valor = String(src).trim();

  if (!valor) {
    return "/images/sem-imagem.png";
  }

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("data:image") ||
    valor.startsWith("blob:")
  ) {
    return valor;
  }

  return `${BASE_URL}/${valor.replace(/^\/+/, "")}`;
}

function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === "string") {
    const limpo = valor.replace(/\./g, "").replace(",", ".");
    const numero = Number(limpo);

    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizarNumero(valor));
}

function extrairLista<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.itens)) return payload.itens;
  if (Array.isArray(payload?.dados?.itens)) return payload.dados.itens;
  if (Array.isArray(payload?.carrinho?.itens)) return payload.carrinho.itens;

  return [];
}

/* =========================
   HELPERS ITEM
========================= */
function getItemId(item: CarrinhoItem) {
  return (
    item.id_carrinho_item ??
    item.id ??
    item.id_item ??
    item.item_id ??
    ""
  );
}

function getItemNome(item: CarrinhoItem) {
  return (
    item.produto?.nome ||
    item.produto?.titulo ||
    item.produto_nome ||
    item.nome ||
    item.titulo ||
    "Produto"
  );
}

function getItemImagem(item: CarrinhoItem) {
  return resolverImagem(
    item.imagem ||
      item.miniatura ||
      item.foto ||
      item.produto?.imagem ||
      item.produto?.miniatura ||
      item.produto?.foto
  );
}

function getQuantidade(item: CarrinhoItem) {
  return Math.max(1, normalizarNumero(item.quantidade) || 1);
}

function getPrecoUnitario(item: CarrinhoItem) {
  return normalizarNumero(
    item.preco_unitario ?? item.preco ?? 0
  );
}

function getSubtotal(item: CarrinhoItem) {
  if (item.subtotal != null) {
    return normalizarNumero(item.subtotal);
  }

  return getPrecoUnitario(item) * getQuantidade(item);
}

/* =========================
   PAGE
========================= */
export default function CarrinhoPage() {
  const [loading, setLoading] = useState(true);

  const [itens, setItens] = useState<CarrinhoItem[]>([]);

  const [loadingItem, setLoadingItem] = useState<
    string | number | null
  >(null);

  /* =========================
     CARREGAR
  ========================= */
  const carregarCarrinho = useCallback(async () => {
    try {
      setLoading(true);

      const response = await InicioApi.get("/carrinho/itens", {
        withCredentials: true,
      });

      const lista = extrairLista<CarrinhoItem>(response.data);

      setItens(lista);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar o carrinho.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCarrinho();
  }, [carregarCarrinho]);

  /* =========================
     REMOVER
  ========================= */
  async function removerItem(itemId: string | number) {
    try {
      setLoadingItem(itemId);

      await InicioApi.delete(`/carrinho/item/${itemId}`, {
        withCredentials: true,
      });

      setItens((prev) =>
        prev.filter(
          (item) => String(getItemId(item)) !== String(itemId)
        )
      );

      toast.success("Produto removido.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover produto.");
    } finally {
      setLoadingItem(null);
    }
  }

  /* =========================
     QUANTIDADE
  ========================= */
  async function alterarQuantidade(
    item: CarrinhoItem,
    novaQuantidade: number
  ) {
    const itemId = getItemId(item);

    if (novaQuantidade < 1) return;

    try {
      setLoadingItem(itemId);

      setItens((prev) =>
        prev.map((produto) => {
          if (
            String(getItemId(produto)) !== String(itemId)
          ) {
            return produto;
          }

          return {
            ...produto,
            quantidade: novaQuantidade,
          };
        })
      );

      await InicioApi.put(
        `/carrinho/item/${itemId}`,
        {
          quantidade: novaQuantidade,
        },
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar quantidade.");

      carregarCarrinho();
    } finally {
      setLoadingItem(null);
    }
  }

  /* =========================
     TOTAL
  ========================= */
  const total = useMemo(() => {
    return itens.reduce((acc, item) => {
      return acc + getSubtotal(item);
    }, 0);
  }, [itens]);

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

          <Link href="/" className={styles.primaryButton}>
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
              Carrinho
            </span>

            <h1>Seu carrinho</h1>

            <p>
              Revise seus produtos antes de finalizar a
              compra.
            </p>
          </div>

          <div className={styles.counter}>
            {itens.length}{" "}
            {itens.length === 1 ? "item" : "itens"}
          </div>
        </header>

        {/* CONTENT */}
        <div className={styles.content}>
          {/* LISTA */}
          <section className={styles.products}>
            {itens.map((item) => {
              const id = getItemId(item);

              const nome = getItemNome(item);

              const imagem = getItemImagem(item);

              const quantidade = getQuantidade(item);

              const preco = getPrecoUnitario(item);

              const subtotal = getSubtotal(item);

              const carregando = loadingItem === id;

              return (
                <article
                  key={String(id)}
                  className={styles.productCard}
                >
                  <div className={styles.imageBox}>
                    <Image
                      src={imagem}
                      alt={nome}
                      width={120}
                      height={120}
                      className={styles.image}
                      unoptimized
                    />
                  </div>

                  <div className={styles.productContent}>
                    <div className={styles.top}>
                      <div>
                        <h2>{nome}</h2>

                        <span className={styles.unitPrice}>
                          {formatarMoeda(preco)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removerItem(id)}
                        disabled={carregando}
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className={styles.bottom}>
                      <div className={styles.quantity}>
                        <button
                          type="button"
                          onClick={() =>
                            alterarQuantidade(
                              item,
                              quantidade - 1
                            )
                          }
                          disabled={carregando}
                        >
                          <FiMinus />
                        </button>

                        <span>{quantidade}</span>

                        <button
                          type="button"
                          onClick={() =>
                            alterarQuantidade(
                              item,
                              quantidade + 1
                            )
                          }
                          disabled={carregando}
                        >
                          <FiPlus />
                        </button>
                      </div>

                      <div className={styles.subtotal}>
                        <span>Subtotal</span>

                        <strong>
                          {formatarMoeda(subtotal)}
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
                <strong>{itens.length}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Entrega</span>
                <strong>Grátis</strong>
              </div>

              <div className={styles.line} />

              <div className={styles.totalRow}>
                <span>Total</span>

                <strong>{formatarMoeda(total)}</strong>
              </div>

              <Link
                href="/Carrinho/checkout"
                className={styles.checkoutButton}
              >
                Finalizar compra
                <FiArrowRight />
              </Link>

              <Link href="/" className={styles.continueButton}>
                Continuar comprando
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}