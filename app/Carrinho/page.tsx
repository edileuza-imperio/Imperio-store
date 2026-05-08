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
} from "react-icons/fi";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InicioApi } from "@/services/api/api";

import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";

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
   BASE URL FIXA
========================= */
const BASE_URL = "https://lightgrey-cattle-160990.hostingersite.com";

/* =========================
   HELPERS
========================= */
function resolverImagem(src?: string | null) {
  if (!src) return "/images/sem-imagem.png";

  const valor = String(src).trim();

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
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

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
  if (Array.isArray(payload?.carrinho?.itens)) return payload.carrinho.itens;
  return [];
}

/* =========================
   HELPERS ITEM
========================= */
function getItemId(item: CarrinhoItem) {
  return item.id_carrinho_item ?? item.id ?? item.id_item ?? item.item_id ?? "";
}

function getItemNome(item: CarrinhoItem) {
  const nome =
    item.produto?.nome ||
    item.produto?.titulo ||
    item.produto_nome ||
    item.nome ||
    item.titulo;

  return nome?.trim() ? nome : "Produto sem nome";
}

function getItemImagem(item: CarrinhoItem) {
  return resolverImagem(
    item.miniatura ||
      item.imagem ||
      item.foto ||
      item.produto?.imagem ||
      item.produto?.foto
  );
}

function getItemQuantidade(item: CarrinhoItem) {
  return Math.max(1, normalizarNumero(item.quantidade) || 1);
}

function getItemSubtotal(item: CarrinhoItem) {
  const subtotal =
    item.subtotal ??
    item.total ??
    (item.preco_unitario != null && item.quantidade != null
      ? normalizarNumero(item.preco_unitario) * normalizarNumero(item.quantidade)
      : item.preco);

  return normalizarNumero(subtotal);
}

/* =========================
   PAGE
========================= */
export default function CarrinhoPage() {
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | number | null>(null);
  const [itens, setItens] = useState<CarrinhoItem[]>([]);

  const carregarCarrinho = useCallback(async () => {
    try {
      setLoading(true);
      const response = await InicioApi.get("/carrinho/itens", {
        withCredentials: true,
      });
      setItens(extrairLista(response.data));
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const removerItem = useCallback(async (itemId: string | number) => {
    try {
      setRemovingId(itemId);

      await InicioApi.delete(`/carrinho/item/${itemId}`, {
        withCredentials: true,
      });

      setItens((prev) =>
        prev.filter((i) => String(getItemId(i)) !== String(itemId))
      );
    } catch (err) {
      console.error("Erro ao remover item:", err);
    } finally {
      setRemovingId(null);
    }
  }, []);

  const alterarQuantidade = useCallback((itemId: string | number, delta: number) => {
    setItens((prev) =>
      prev.map((item) => {
        if (String(getItemId(item)) !== String(itemId)) return item;

        const atual = getItemQuantidade(item);
        const novaQtd = Math.max(1, atual + delta);

        return {
          ...item,
          quantidade: novaQtd,
          subtotal:
            item.preco_unitario != null
              ? normalizarNumero(item.preco_unitario) * novaQtd
              : item.subtotal,
        };
      })
    );
  }, []);

  useEffect(() => {
    carregarCarrinho();
  }, [carregarCarrinho]);

  const total = useMemo(
    () => itens.reduce((acc, item) => acc + getItemSubtotal(item), 0),
    [itens]
  );

  if (!loading && itens.length === 0) {
    return (
      <>
        <Navbar />

        <main className={styles.page}>
          <div className={styles.shell}>
            <div className={`${styles.emptyCard} ${styles.glass}`}>
              <div className={styles.emptyIcon}>
                <FiShoppingCart size={34} />
              </div>

              <h1>Carrinho vazio</h1>
              <p>Adicione produtos para continuar.</p>

              <Link href="/" className={styles.primaryBtn}>
                Ver produtos
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={`${styles.hero} ${styles.glass}`}>
            <div>
              <div className={styles.eyebrow}>
                <FiShoppingCart />
                Carrinho de compras
              </div>

              <h1>Seu carrinho</h1>
              <p>Revise os produtos antes de finalizar a compra.</p>
            </div>

            <div className={styles.badge}>
              {itens.length} {itens.length === 1 ? "item" : "itens"}
            </div>
          </header>

          <div className={styles.layout}>
            <section className={styles.itemsPanel}>
              <div className={styles.sectionTitle}>
                <h2>Itens adicionados</h2>
                <span>{loading ? "Carregando..." : "Atualize quantidades ou remova produtos"}</span>
              </div>

              <div className={styles.itemsList}>
                {itens.map((item) => {
                  const id = getItemId(item);
                  const qtd = getItemQuantidade(item);
                  const subtotal = getItemSubtotal(item);

                  return (
                    <article key={String(id)} className={`${styles.itemCard} ${styles.glass}`}>
                      <div className={styles.itemImageWrap}>
                        <Image
                          src={getItemImagem(item)}
                          alt={getItemNome(item)}
                          width={96}
                          height={96}
                          className={styles.itemImage}
                          unoptimized
                        />
                      </div>

                      <div className={styles.itemContent}>
                        <div className={styles.itemTop}>
                          <h3>{getItemNome(item)}</h3>

                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removerItem(id)}
                            disabled={removingId === id}
                            aria-label="Remover item"
                            title="Remover item"
                          >
                            <FiTrash2 />
                          </button>
                        </div>

                        <div className={styles.itemBottom}>
                          <div className={styles.qtyControl}>
                            <button
                              type="button"
                              onClick={() => alterarQuantidade(id, -1)}
                              aria-label="Diminuir quantidade"
                            >
                              <FiMinus />
                            </button>

                            <span>{qtd}</span>

                            <button
                              type="button"
                              onClick={() => alterarQuantidade(id, 1)}
                              aria-label="Aumentar quantidade"
                            >
                              <FiPlus />
                            </button>
                          </div>

                          <div className={styles.priceBlock}>
                            <span>Subtotal</span>
                            <strong>{formatarMoeda(subtotal)}</strong>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className={styles.summaryPanel}>
              <div className={`${styles.summaryCard} ${styles.glass}`}>
                <div className={styles.summaryHeader}>
                  <h2>Resumo</h2>
                  <p>Confira o total do pedido.</p>
                </div>

                <div className={styles.summaryLines}>
                  <div className={styles.summaryRow}>
                    <span>Itens</span>
                    <strong>{itens.length}</strong>
                  </div>

                  <div className={styles.summaryTotal}>
                    <span>Total</span>
                    <strong>{formatarMoeda(total)}</strong>
                  </div>
                </div>

                <Link href="/Carrinho/checkout" className={styles.checkoutBtn}>
                  Finalizar compra <FiArrowRight />
                </Link>

                <p className={styles.summaryNote}>
                  Frete e descontos podem ser calculados na próxima etapa.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}