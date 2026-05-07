"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiShoppingCart, FiArrowRight, FiTrash2 } from "react-icons/fi";
import { InicioApi } from "@/services/api/api";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import "./carrinho.css";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type CarrinhoItem = {
  id?: number | string;
  id_carrinho_item?: number | string;
  id_item?: number | string;
  item_id?: number | string;
  nome?: string;
  titulo?: string;
  produto_nome?: string;
  quantidade?: number | string;
  preco?: number | string;
  subtotal?: number | string;
  total?: number | string;
  imagem?: string;
  miniatura?: string;
  foto?: string;
  produto?: {
    nome?: string;
    titulo?: string;
    imagem?: string;
    foto?: string;
  };
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  if (typeof valor === "string") {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));
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

function getItemId(item: CarrinhoItem): string {
  return String(
    item.id_carrinho_item ??
      item.id ??
      item.id_item ??
      item.item_id ??
      ""
  );
}

function getItemNome(item: CarrinhoItem) {
  return (
    item.nome ||
    item.titulo ||
    item.produto_nome ||
    item.produto?.nome ||
    item.produto?.titulo ||
    "Produto"
  );
}

function getItemImagem(item: CarrinhoItem) {
  return (
    item.miniatura ||
    item.imagem ||
    item.foto ||
    item.produto?.imagem ||
    item.produto?.foto ||
    "/images/sem-imagem.png"
  );
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

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function CarrinhoPage() {
  const [itens, setItens] = useState<CarrinhoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const carregarCarrinho = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await InicioApi.get("/carrinho/itens", {
        withCredentials: true,
      });

      const lista = extrairLista<CarrinhoItem>(response?.data);
      setItens(lista);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar carrinho");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCarrinho();
  }, [carregarCarrinho]);

  const removerItem = useCallback(async (itemId: string) => {
    try {
      setRemovingId(itemId);

      // optimistic update
      setItens((prev) => prev.filter((i) => getItemId(i) !== itemId));

      await InicioApi.delete(`/carrinho/item/${itemId}`, {
        withCredentials: true,
      });
    } catch (err) {
      console.error(err);
      setError("Erro ao remover item");
      carregarCarrinho(); // fallback sync
    } finally {
      setRemovingId(null);
    }
  }, [carregarCarrinho]);

  const total = useMemo(() => {
    return itens.reduce((acc, item) => {
      const valor =
        normalizarNumero(item.subtotal) ||
        normalizarNumero(item.total) ||
        normalizarNumero(item.preco) * normalizarNumero(item.quantidade);

      return acc + valor;
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
              <FiShoppingCart size={28} />
              <div>
                <h1>Seu Carrinho</h1>
                <p>{itens.length} item(ns)</p>
              </div>
            </div>

            <Link href="/">Continuar comprando</Link>
          </div>

          {/* ERROR */}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* LOADING */}
          {loading && <p>Carregando...</p>}

          {/* EMPTY */}
          {!loading && itens.length === 0 && (
            <div className="empty-cart">
              <FiShoppingCart size={60} />
              <h2>Carrinho vazio</h2>
              <Link href="/">Ir às compras</Link>
            </div>
          )}

          {/* LIST */}
          {!loading && itens.length > 0 && (
            <div className="cart-grid">

              <div className="cart-items">
                {itens.map((item) => {
                  const id = getItemId(item);

                  return (
                    <div key={id} className="cart-item">
                      <Image
                        src={getItemImagem(item)}
                        alt={getItemNome(item)}
                        width={100}
                        height={100}
                      />

                      <div>
                        <h3>{getItemNome(item)}</h3>
                        <p>Qtd: {item.quantidade}</p>
                        <strong>{formatarMoeda(item.subtotal || item.preco)}</strong>
                      </div>

                      <button
                        onClick={() => removerItem(id)}
                        disabled={removingId === id}
                      >
                        {removingId === id ? "..." : <FiTrash2 />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* SUMMARY */}
              <aside className="cart-summary">
                <h3>Resumo</h3>

                <div>
                  <span>Total</span>
                  <strong>{formatarMoeda(total)}</strong>
                </div>

                <Link href="/Carrinho/checkout">
                  Finalizar <FiArrowRight />
                </Link>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
