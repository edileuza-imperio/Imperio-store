"use client";

import Link from "next/link";
import Image from "next/image";

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

import { useCallback, useEffect, useMemo, useState } from "react";
import { InicioApi } from "@/services/api/api";
import { toast } from "react-toastify";

/* =========================================================
   TIPAGEM
========================================================= */
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

/* =========================================================
   BASE URL
========================================================= */
const BASE_URL =
  "https://lightgrey-cattle-160990.hostingersite.com";

/* =========================================================
   HELPERS
========================================================= */
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
  if (Array.isArray(payload?.carrinho?.itens))
    return payload.carrinho.itens;

  return [];
}

/* =========================================================
   HELPERS ITEM
========================================================= */
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

/* =========================================================
   PAGE
========================================================= */
export default function CarrinhoPage() {
  const [loading, setLoading] = useState(true);

  const [itens, setItens] = useState<CarrinhoItem[]>([]);

  const [loadingItem, setLoadingItem] = useState<
    string | number | null
  >(null);

  /* =========================================================
     CARREGAR
  ========================================================= */
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

  /* =========================================================
     REMOVER
  ========================================================= */
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

  /* =========================================================
     QUANTIDADE
  ========================================================= */
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

  /* =========================================================
     TOTAL
  ========================================================= */
  const total = useMemo(() => {
    return itens.reduce((acc, item) => {
      return acc + getSubtotal(item);
    }, 0);
  }, [itens]);

  /* =========================================================
     EMPTY
  ========================================================= */
  if (!loading && itens.length === 0) {
    return (
      <>
        <main className="cart-page">
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <FiShoppingCart />
            </div>

            <h1>Seu carrinho está vazio</h1>

            <p>
              Adicione produtos incríveis para continuar
              comprando.
            </p>

            <Link href="/" className="cart-primary-button">
              Explorar produtos
            </Link>
          </div>
        </main>

        <style jsx>{`
          .cart-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            background: linear-gradient(
              180deg,
              #f7f3ee 0%,
              #f3ebe2 100%
            );
          }

          .cart-empty {
            width: 100%;
            max-width: 520px;
            background: rgba(255, 255, 255, 0.82);
            backdrop-filter: blur(18px);
            border: 1px solid rgba(255, 255, 255, 0.7);
            border-radius: 34px;
            padding: 50px 30px;
            text-align: center;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.08);
          }

          .cart-empty-icon {
            width: 88px;
            height: 88px;
            margin: 0 auto 22px;
            border-radius: 28px;
            background: linear-gradient(
              135deg,
              #c08a7a,
              #a86e61
            );
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 34px;
          }

          .cart-empty h1 {
            margin: 0;
            font-size: 34px;
            color: #2b2b2b;
          }

          .cart-empty p {
            margin-top: 14px;
            color: #666;
            line-height: 1.7;
          }

          .cart-primary-button {
            margin-top: 28px;
            height: 56px;
            padding: 0 26px;
            border-radius: 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-weight: 700;
            color: #fff;
            background: linear-gradient(
              135deg,
              #c08a7a,
              #a86e61
            );
            box-shadow: 0 18px 35px rgba(192, 138, 122, 0.35);
          }
        `}</style>
      </>
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */
  if (loading) {
    return (
      <>
        <main className="cart-page">
          <div className="loading-box">
            <FiLoader className="loading-icon" />
            <span>Carregando carrinho...</span>
          </div>
        </main>

        <style jsx>{`
          .cart-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7f3ee;
          }

          .loading-box {
            width: 240px;
            height: 160px;
            border-radius: 28px;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 18px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          }

          .loading-icon {
            font-size: 34px;
            color: #c08a7a;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <main className="cart-page">
        <div className="cart-container">
          {/* HEADER */}
          <header className="cart-header">
            <div>
              <span className="cart-badge">
                <FiShoppingCart />
                Carrinho de compras
              </span>

              <h1>Seu carrinho</h1>

              <p>
                Revise seus produtos antes de finalizar a
                compra.
              </p>
            </div>

            <div className="cart-counter">
              {itens.length}{" "}
              {itens.length === 1 ? "item" : "itens"}
            </div>
          </header>

          {/* CONTENT */}
          <div className="cart-content">
            {/* PRODUTOS */}
            <section className="cart-products">
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
                    className="cart-product-card"
                  >
                    <div className="cart-image-box">
                      <Image
                        src={imagem}
                        alt={nome}
                        width={140}
                        height={140}
                        className="cart-image"
                        unoptimized
                      />
                    </div>

                    <div className="cart-product-content">
                      <div className="cart-product-top">
                        <div className="cart-product-info">
                          <h2>{nome}</h2>

                          <span className="cart-unit-price">
                            {formatarMoeda(preco)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="cart-remove-button"
                          onClick={() => removerItem(id)}
                          disabled={carregando}
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      <div className="cart-product-bottom">
                        <div className="cart-quantity">
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

                        <div className="cart-subtotal">
                          <small>Subtotal</small>

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
            <aside className="cart-summary">
              <div className="cart-summary-card">
                <h3>Resumo do pedido</h3>

                <div className="cart-summary-row">
                  <span>Produtos</span>
                  <strong>{itens.length}</strong>
                </div>

                <div className="cart-summary-row">
                  <span>Entrega</span>
                  <strong>Grátis</strong>
                </div>

                <div className="cart-line" />

                <div className="cart-total-row">
                  <span>Total</span>

                  <strong>{formatarMoeda(total)}</strong>
                </div>

                <Link
                  href="/Carrinho/checkout"
                  className="cart-checkout-button"
                >
                  Finalizar compra
                  <FiArrowRight />
                </Link>

                <Link
                  href="/"
                  className="cart-continue-button"
                >
                  Continuar comprando
                </Link>

                <div className="cart-benefits">
                  <div className="cart-benefit">
                    <FiShield />
                    Compra segura
                  </div>

                  <div className="cart-benefit">
                    <FiTruck />
                    Frete rápido
                  </div>

                  <div className="cart-benefit">
                    <FiCreditCard />
                    Pagamento facilitado
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <style jsx>{`
        .cart-page {
          min-height: 100vh;
          padding: 120px 20px 60px;
          background:
            radial-gradient(
              circle at top left,
              rgba(192, 138, 122, 0.16),
              transparent 28%
            ),
            linear-gradient(
              180deg,
              #f8f4ef 0%,
              #f1e7dc 100%
            );
        }

        .cart-container {
          max-width: 1380px;
          margin: 0 auto;
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
          padding: 34px;
          border-radius: 34px;
          background: rgba(255, 255, 255, 0.74);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.08);
        }

        .cart-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(192, 138, 122, 0.12);
          color: #9b6658;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .cart-header h1 {
          margin: 0;
          font-size: clamp(32px, 4vw, 54px);
          color: #2b2b2b;
          line-height: 1;
        }

        .cart-header p {
          margin-top: 14px;
          color: #666;
          font-size: 15px;
        }

        .cart-counter {
          min-width: 110px;
          height: 110px;
          border-radius: 28px;
          background: linear-gradient(
            135deg,
            #c08a7a,
            #a86e61
          );
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 18px;
          font-weight: 800;
          padding: 20px;
          box-shadow: 0 22px 40px rgba(192, 138, 122, 0.3);
        }

        .cart-content {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 390px;
          gap: 26px;
          align-items: start;
        }

        .cart-products {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cart-product-card {
          display: flex;
          gap: 22px;
          padding: 22px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.76);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          transition: 0.25s ease;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.06);
        }

        .cart-product-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.09);
        }

        .cart-image-box {
          width: 140px;
          height: 140px;
          flex-shrink: 0;
          border-radius: 24px;
          overflow: hidden;
          background: #fff;
        }

        .cart-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-product-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .cart-product-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .cart-product-info h2 {
          margin: 0;
          font-size: 22px;
          color: #2b2b2b;
          line-height: 1.4;
        }

        .cart-unit-price {
          display: inline-block;
          margin-top: 10px;
          color: #9b6658;
          font-size: 18px;
          font-weight: 700;
        }

        .cart-remove-button {
          width: 48px;
          height: 48px;
          border: none;
          border-radius: 16px;
          background: rgba(255, 0, 0, 0.08);
          color: #d11a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s ease;
          font-size: 18px;
        }

        .cart-remove-button:hover {
          transform: scale(1.05);
          background: rgba(255, 0, 0, 0.14);
        }

        .cart-product-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-top: 20px;
        }

        .cart-quantity {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 18px;
          background: #f8f4ef;
        }

        .cart-quantity button {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: none;
          background: #fff;
          color: #9b6658;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: 0.2s ease;
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.05);
        }

        .cart-quantity button:hover {
          background: #c08a7a;
          color: #fff;
        }

        .cart-quantity span {
          min-width: 34px;
          text-align: center;
          font-size: 18px;
          font-weight: 800;
        }

        .cart-subtotal {
          text-align: right;
        }

        .cart-subtotal small {
          display: block;
          color: #777;
          margin-bottom: 6px;
        }

        .cart-subtotal strong {
          font-size: 28px;
          color: #2b2b2b;
        }

        .cart-summary {
          position: sticky;
          top: 110px;
        }

        .cart-summary-card {
          padding: 30px;
          border-radius: 32px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.08);
        }

        .cart-summary-card h3 {
          margin: 0 0 24px;
          font-size: 28px;
          color: #2b2b2b;
        }

        .cart-summary-row,
        .cart-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cart-summary-row {
          margin-bottom: 18px;
          color: #666;
        }

        .cart-line {
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
          margin: 24px 0;
        }

        .cart-total-row span {
          font-size: 18px;
          font-weight: 700;
        }

        .cart-total-row strong {
          font-size: 34px;
          color: #9b6658;
        }

        .cart-checkout-button {
          width: 100%;
          height: 62px;
          margin-top: 26px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-decoration: none;
          color: #fff;
          font-size: 17px;
          font-weight: 800;
          background: linear-gradient(
            135deg,
            #c08a7a,
            #a86e61
          );
          box-shadow: 0 22px 40px rgba(192, 138, 122, 0.35);
          transition: 0.25s ease;
        }

        .cart-checkout-button:hover {
          transform: translateY(-2px);
        }

        .cart-continue-button {
          width: 100%;
          height: 58px;
          margin-top: 14px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-weight: 700;
          color: #2b2b2b;
          background: #f7f3ee;
        }

        .cart-benefits {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 28px;
        }

        .cart-benefit {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 18px;
          background: #f8f4ef;
          color: #555;
          font-weight: 600;
        }

        @media (max-width: 1100px) {
          .cart-content {
            grid-template-columns: 1fr;
          }

          .cart-summary {
            position: relative;
            top: 0;
          }
        }

        @media (max-width: 768px) {
          .cart-page {
            padding: 100px 14px 40px;
          }

          .cart-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 24px;
          }

          .cart-counter {
            width: 100%;
            height: 70px;
            border-radius: 22px;
          }

          .cart-product-card {
            flex-direction: column;
          }

          .cart-image-box {
            width: 100%;
            height: 260px;
          }

          .cart-product-bottom {
            flex-direction: column;
            align-items: flex-start;
          }

          .cart-subtotal {
            text-align: left;
          }

          .cart-summary-card {
            padding: 22px;
          }
        }

        @media (max-width: 520px) {
          .cart-header h1 {
            font-size: 38px;
          }

          .cart-product-info h2 {
            font-size: 18px;
          }

          .cart-subtotal strong {
            font-size: 24px;
          }

          .cart-total-row strong {
            font-size: 28px;
          }

          .cart-checkout-button,
          .cart-continue-button {
            height: 56px;
          }
        }
      `}</style>
    </>
  );
}