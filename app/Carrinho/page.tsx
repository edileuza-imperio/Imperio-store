"use client";

import Link from "next/link";
import Image from "next/image";

import {
  FiShoppingCart,
  FiArrowRight,
  FiTrash2,
} from "react-icons/fi";

import { useCallback, useEffect, useMemo, useState } from "react";

import { InicioApi } from "@/services/api/api";

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

function normalizarNumero(valor: unknown): number {
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

function getItemNome(item: CarrinhoItem) {
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
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <FiShoppingCart size={28} />

          <div>
            <h1 className="h3 mb-0">
              Seu Carrinho
            </h1>

            <small className="text-muted">
              {itens.length} item(ns)
            </small>
          </div>
        </div>

        <Link
          href="/"
          className="btn btn-outline-dark"
        >
          Continuar comprando
        </Link>
      </div>

      {loading && (
        <div className="text-center py-5">
          Carregando carrinho...
        </div>
      )}

      {!loading &&
        itens.length === 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <FiShoppingCart
                size={40}
                className="mb-3"
              />

              <h3>
                Seu carrinho está vazio
              </h3>

              <p className="text-muted">
                Adicione produtos para
                continuar.
              </p>

              <Link
                href="/"
                className="btn btn-dark"
              >
                Ver produtos
              </Link>
            </div>
          </div>
        )}

      {!loading &&
        itens.length > 0 && (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  {itens.map((item) => (
                    <div
                      key={String(
                        getItemId(item)
                      )}
                      className="d-flex gap-3 border-bottom pb-3 mb-3"
                    >
                      <Image
                        src={getItemImagem(
                          item
                        )}
                        alt={getItemNome(
                          item
                        )}
                        width={90}
                        height={90}
                        className="rounded"
                      />

                      <div className="flex-grow-1">
                        <h5>
                          {getItemNome(
                            item
                          )}
                        </h5>

                        <p className="text-muted mb-2">
                          Quantidade:{" "}
                          {
                            item.quantidade
                          }
                        </p>

                        <strong>
                          {formatarMoeda(
                            item.subtotal
                          )}
                        </strong>
                      </div>

                      <button className="btn btn-light">
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h4 className="mb-4">
                    Resumo
                  </h4>

                  <div className="d-flex justify-content-between mb-3">
                    <span>Total</span>

                    <strong>
                      {formatarMoeda(
                        total
                      )}
                    </strong>
                  </div>

                  <Link
                    href="/checkout"
                    className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    Finalizar Compradsds

                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}