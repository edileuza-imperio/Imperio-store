"use client";

import Link from "next/link";
import Image from "next/image";

import {
  FiShoppingCart,
  FiArrowRight,
  FiTrash2,
} from "react-icons/fi";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { InicioApi } from "@/services/api/api";

import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";

type CarrinhoItem = {
  id?: number | string;
  id_item?: number | string;
  item_id?: number | string;
  produto_id?: number | string;

  nome?: string;
  titulo?: string;
  produto_nome?: string;

  slug?: string;

  imagem?: string;
  miniatura?: string;
  foto?: string;

  quantidade?: number | string;

  preco?: number | string;
  preco_unitario?: number | string;

  subtotal?: number | string;
  total?: number | string;
};

function normalizarNumero(
  valor: unknown
): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? valor
      : 0;
  }

  if (typeof valor === "string") {
    const limpo = valor
      .replace(/\./g, "")
      .replace(",", ".");

    const numero = Number(limpo);

    return Number.isFinite(numero)
      ? numero
      : 0;
  }

  return 0;
}

function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(normalizarNumero(valor));
}

function extrairLista<T = unknown>(
  payload: any
): T[] {
  if (Array.isArray(payload))
    return payload;

  if (Array.isArray(payload?.dados))
    return payload.dados;

  if (Array.isArray(payload?.data))
    return payload.data;

  if (Array.isArray(payload?.itens))
    return payload.itens;

  if (
    Array.isArray(payload?.dados?.itens)
  )
    return payload.dados.itens;

  if (
    Array.isArray(
      payload?.carrinho?.itens
    )
  )
    return payload.carrinho.itens;

  return [];
}

function getItemId(item: CarrinhoItem) {
  return (
    item.id ??
    item.id_item ??
    item.item_id ??
    item.produto_id ??
    ""
  );
}

function getItemNome(
  item: CarrinhoItem
) {
  return (
    item.nome ||
    item.titulo ||
    item.produto_nome ||
    "Produto"
  );
}

function getItemImagem(
  item: CarrinhoItem
) {
  return (
    item.miniatura ||
    item.imagem ||
    item.foto ||
    "/images/sem-imagem.png"
  );
}

export default function CarrinhoPage() {
  const [loading, setLoading] =
    useState(false);

  const [itens, setItens] = useState<
    CarrinhoItem[]
  >([]);

  const carregarCarrinho =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await InicioApi.get(
            "/carrinho/itens",
            {
              withCredentials: true,
            }
          );

        const itensData =
          extrairLista<CarrinhoItem>(
            response?.data
          );

        setItens(itensData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    carregarCarrinho();
  }, [carregarCarrinho]);

  const total = useMemo(() => {
    return itens.reduce((acc, item) => {
      const subtotal =
        normalizarNumero(
          item.subtotal ??
            item.total ??
            0
        );

      return acc + subtotal;
    }, 0);
  }, [itens]);

  return (
    <>
      <Navbar />

      <main className="cart-page">
        <div className="cart-container">
          {/* HEADER */}
          <div className="cart-header">
            <div className="cart-titleWrap">
              <div className="cart-icon">
                <FiShoppingCart size={28} />
              </div>

              <div>
                <h1 className="cart-title">
                  Seu Carrinho
                </h1>

                <p className="cart-subtitle">
                  {itens.length} item(ns)
                  adicionados
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="continue-btn"
            >
              Continuar comprando
            </Link>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="cart-loading">
              <div className="loader" />

              <p>
                Carregando carrinho...
              </p>
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            itens.length === 0 && (
              <div className="empty-cart">
                <FiShoppingCart
                  size={60}
                />

                <h2>
                  Seu carrinho está
                  vazio
                </h2>

                <p>
                  Adicione produtos
                  para continuar sua
                  compra.
                </p>

                <Link
                  href="/"
                  className="shop-btn"
                >
                  Ver produtos
                </Link>
              </div>
            )}

          {/* CART */}
          {!loading &&
            itens.length > 0 && (
              <div className="cart-grid">
                {/* LISTA */}
                <div className="cart-items">
                  {itens.map((item) => (
                    <div
                      key={String(
                        getItemId(item)
                      )}
                      className="cart-item"
                    >
                      <div className="cart-imageWrap">
                        <Image
                          src={getItemImagem(
                            item
                          )}
                          alt={getItemNome(
                            item
                          )}
                          width={120}
                          height={120}
                          className="cart-image"
                        />
                      </div>

                      <div className="cart-content">
                        <h3 className="cart-itemTitle">
                          {getItemNome(
                            item
                          )}
                        </h3>

                        <div className="cart-meta">
                          <span>
                            Quantidade:{" "}
                            {
                              item.quantidade
                            }
                          </span>
                        </div>

                        <strong className="cart-price">
                          {formatarMoeda(
                            item.subtotal
                          )}
                        </strong>
                      </div>

                      <button className="remove-btn">
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>

                {/* RESUMO */}
                <div className="cart-summary">
                  <div className="summary-card">
                    <h3>
                      Resumo da compra
                    </h3>

                    <div className="summary-row">
                      <span>Subtotal</span>

                      <strong>
                        {formatarMoeda(
                          total
                        )}
                      </strong>
                    </div>

                    <div className="summary-row">
                      <span>Entrega</span>

                      <strong>
                        Calculado no
                        checkout
                      </strong>
                    </div>

                    <div className="summary-total">
                      <span>Total</span>

                      <strong>
                        {formatarMoeda(
                          total
                        )}
                      </strong>
                    </div>

                    <Link
                      href="/checkout"
                      className="checkout-btn"
                    >
                      Finalizar compra

                      <FiArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .cart-page {
          min-height: 100vh;
          background: #f4f7fb;
          padding: 140px 20px 80px;
        }

        .cart-container {
          max-width: 1300px;
          margin: 0 auto;
        }

        .cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .cart-titleWrap {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .cart-icon {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          background: linear-gradient(
            135deg,
            #111827,
            #374151
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 15px 35px
            rgba(0, 0, 0, 0.15);
        }

        .cart-title {
          margin: 0;
          font-size: 36px;
          font-weight: 800;
          color: #111827;
        }

        .cart-subtitle {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 15px;
        }

        .continue-btn {
          padding: 14px 24px;
          border-radius: 14px;
          background: white;
          border: 1px solid #e5e7eb;
          color: #111827;
          font-weight: 700;
          text-decoration: none;
          transition: 0.3s;
        }

        .continue-btn:hover {
          background: #111827;
          color: white;
          transform: translateY(-2px);
        }

        .cart-loading {
          background: white;
          border-radius: 30px;
          padding: 80px 20px;
          text-align: center;
          box-shadow: 0 10px 40px
            rgba(0, 0, 0, 0.06);
        }

        .loader {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #111827;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        }

        .empty-cart {
          background: white;
          border-radius: 30px;
          padding: 90px 20px;
          text-align: center;
          box-shadow: 0 10px 40px
            rgba(0, 0, 0, 0.06);
        }

        .empty-cart svg {
          color: #9ca3af;
          margin-bottom: 20px;
        }

        .empty-cart h2 {
          font-size: 32px;
          margin-bottom: 12px;
          color: #111827;
        }

        .empty-cart p {
          color: #6b7280;
          margin-bottom: 30px;
        }

        .shop-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 28px;
          border-radius: 14px;
          background: #111827;
          color: white;
          font-weight: 700;
          text-decoration: none;
          transition: 0.3s;
        }

        .shop-btn:hover {
          transform: translateY(-2px);
          background: #000;
        }

        .cart-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 30px;
        }

        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cart-item {
          background: white;
          border-radius: 26px;
          padding: 24px;
          display: flex;
          gap: 22px;
          align-items: center;
          box-shadow: 0 10px 40px
            rgba(0, 0, 0, 0.05);
          transition: 0.3s;
        }

        .cart-item:hover {
          transform: translateY(-3px);
        }

        .cart-imageWrap {
          min-width: 120px;
        }

        .cart-image {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 18px;
        }

        .cart-content {
          flex: 1;
        }

        .cart-itemTitle {
          font-size: 22px;
          margin-bottom: 10px;
          color: #111827;
        }

        .cart-meta {
          color: #6b7280;
          margin-bottom: 12px;
        }

        .cart-price {
          font-size: 22px;
          color: #111827;
        }

        .remove-btn {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: none;
          background: #fef2f2;
          color: #dc2626;
          cursor: pointer;
          transition: 0.3s;
        }

        .remove-btn:hover {
          background: #dc2626;
          color: white;
        }

        .summary-card {
          position: sticky;
          top: 130px;
          background: white;
          border-radius: 28px;
          padding: 30px;
          box-shadow: 0 10px 40px
            rgba(0, 0, 0, 0.06);
        }

        .summary-card h3 {
          font-size: 26px;
          margin-bottom: 30px;
          color: #111827;
        }

        .summary-row,
        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          color: #374151;
        }

        .summary-total {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          margin-top: 20px;
          font-size: 22px;
          font-weight: 800;
          color: #111827;
        }

        .checkout-btn {
          width: 100%;
          margin-top: 30px;
          height: 60px;
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            #111827,
            #374151
          );
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          transition: 0.3s;
        }

        .checkout-btn:hover {
          transform: translateY(-2px);
          background: #000;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 992px) {
          .cart-grid {
            grid-template-columns: 1fr;
          }

          .summary-card {
            position: relative;
            top: 0;
          }
        }

        @media (max-width: 768px) {
          .cart-page {
            padding: 120px 16px 60px;
          }

          .cart-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .cart-title {
            font-size: 28px;
          }

          .cart-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .remove-btn {
            width: 100%;
          }

          .cart-image {
            width: 100%;
            height: auto;
          }

          .cart-imageWrap {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}