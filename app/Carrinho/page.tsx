"use client";

import Link from "next/link";
import Image from "next/image";
import "./carrinho.css";

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

  id_carrinho_item?:
    | number
    | string;

  id_item?: number | string;

  item_id?: number | string;

  produto_id?:
    | number
    | string;

  nome?: string;

  titulo?: string;

  produto_nome?: string;

  produto?: {
    nome?: string;
    titulo?: string;
    imagem?: string;
    foto?: string;
  };

  slug?: string;

  imagem?: string;

  miniatura?: string;

  foto?: string;

  quantidade?: number | string;

  preco?: number | string;

  preco_unitario?:
    | number
    | string;

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

function formatarMoeda(
  valor: unknown
) {
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

/*
|--------------------------------------------------------------------------
| ID ITEM CARRINHO
|--------------------------------------------------------------------------
*/

function getItemId(
  item: CarrinhoItem
) {
  return (
    item.id_carrinho_item ??
    item.id ??
    item.id_item ??
    item.item_id ??
    ""
  );
}

/*
|--------------------------------------------------------------------------
| NOME PRODUTO
|--------------------------------------------------------------------------
*/

function getItemNome(
  item: CarrinhoItem
) {
  return (
    item.nome ||
    item.titulo ||
    item.produto_nome ||
    item.produto?.nome ||
    item.produto?.titulo ||
    "Produto sem nome"
  );
}

/*
|--------------------------------------------------------------------------
| IMAGEM PRODUTO
|--------------------------------------------------------------------------
*/

function getItemImagem(
  item: CarrinhoItem
) {
  return (
    item.miniatura ||
    item.imagem ||
    item.foto ||
    item.produto?.imagem ||
    item.produto?.foto ||
    "/images/sem-imagem.png"
  );
}

export default function CarrinhoPage() {
  const [loading, setLoading] =
    useState(false);

  const [removingId, setRemovingId] =
    useState<
      number | string | null
    >(null);

  const [itens, setItens] = useState<
    CarrinhoItem[]
  >([]);

  /*
  |--------------------------------------------------------------------------
  | CARREGAR CARRINHO
  |--------------------------------------------------------------------------
  */

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

        console.log(
          "CARRINHO:",
          response.data
        );

        const itensData =
          extrairLista<CarrinhoItem>(
            response?.data
          );

        setItens(itensData);
      } catch (error) {
        console.error(
          "Erro ao carregar carrinho:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | REMOVER ITEM
  |--------------------------------------------------------------------------
  */

  const removerItem = useCallback(
    async (
      itemId: number | string
    ) => {
      try {
        setRemovingId(itemId);

        await InicioApi.delete(
          `/carrinho/item/${itemId}`,
          {
            withCredentials: true,
          }
        );

        /*
        |--------------------------------------------------------------------------
        | REMOVE DO STATE
        |--------------------------------------------------------------------------
        */

        setItens((prev) =>
          prev.filter(
            (item) =>
              String(
                getItemId(item)
              ) !== String(itemId)
          )
        );

        /*
        |--------------------------------------------------------------------------
        | RECARREGA BACKEND
        |--------------------------------------------------------------------------
        */

        await carregarCarrinho();
      } catch (error) {
        console.error(
          "Erro ao remover item:",
          error
        );
      } finally {
        setRemovingId(null);
      }
    },
    [carregarCarrinho]
  );

  /*
  |--------------------------------------------------------------------------
  | INIT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    carregarCarrinho();
  }, [carregarCarrinho]);

  /*
  |--------------------------------------------------------------------------
  | TOTAL
  |--------------------------------------------------------------------------
  */

  const total = useMemo(() => {
    return itens.reduce((acc, item) => {
      const subtotal =
        normalizarNumero(
          item.subtotal ??
            item.total ??
            item.preco ??
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
                Carregando
                carrinho...
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
                  para visualizar o
                  resumo da compra.
                </p>

                <Link
                  href="/"
                  className="shop-btn"
                >
                  Continuar comprando
                </Link>
              </div>
            )}

          {/* CARRINHO */}

          {!loading &&
            itens.length > 0 && (
              <div className="cart-grid">
                {/* LISTA */}

                <div className="cart-items">
                  {itens.map((item) => {
                    const itemId =
                      getItemId(item);

                    return (
                      <div
                        key={String(
                          itemId
                        )}
                        className="cart-item"
                      >
                        {/* IMAGEM */}

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

                        {/* CONTEUDO */}

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
                              item.subtotal ??
                                item.total ??
                                item.preco
                            )}
                          </strong>
                        </div>

                        {/* REMOVER */}

                        <button
                          className="remove-btn"
                          onClick={() =>
                            removerItem(
                              itemId
                            )
                          }
                          disabled={
                            removingId ===
                            itemId
                          }
                        >
                          {removingId ===
                          itemId ? (
                            "..."
                          ) : (
                            <FiTrash2 />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* RESUMO */}

                <div className="cart-summary">
                  <div className="summary-card">
                    <h3>
                      Resumo da compra
                    </h3>

                    <div className="summary-row">
                      <span>
                        Subtotal
                      </span>

                      <strong>
                        {formatarMoeda(
                          total
                        )}
                      </strong>
                    </div>

                    <div className="summary-row">
                      <span>
                        Entrega
                      </span>

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
                      href="/Carrinho/checkout"
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
    </>
  );
}