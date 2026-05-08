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
  nome?: string;
  titulo?: string;
  produto_nome?: string;
  quantidade?: number | string;
  preco?: number | string;
  subtotal?: number | string;
  total?: number | string;
  imagem?: string;
  produto?: { nome?: string; titulo?: string; imagem?: string };
};

type ApiResponse = {
  itens?: CarrinhoItem[];
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === "string") {
    const n = Number(valor.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizarNumero(valor));
}

function getItemId(item: CarrinhoItem) {
  return String(item.id_carrinho_item ?? item.id ?? "");
}

function getItemNome(item: CarrinhoItem) {
  return item.nome || item.titulo || item.produto_nome || "Produto";
}

function getItemImagem(item: CarrinhoItem) {
  return item.imagem || item.produto?.imagem || "/images/sem-imagem.png";
}

export default function CarrinhoPage() {
  const [itens, setItens] = useState<CarrinhoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const carregarCarrinho = useCallback(async () => {
    try {
      setLoading(true);
      const res = await InicioApi.get<ApiResponse>("/carrinho/itens", {
        withCredentials: true,
      });
      setItens(res.data?.itens ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCarrinho();
  }, [carregarCarrinho]);

  const removerItem = async (id: string) => {
    setRemovingId(id);
    setItens((prev) => prev.filter((i) => getItemId(i) !== id));

    try {
      await InicioApi.delete(`/carrinho/item/${id}`, {
        withCredentials: true,
      });
    } finally {
      setRemovingId(null);
    }
  };

  const total = useMemo(() => {
    return itens.reduce((acc, item) => {
      return acc + normalizarNumero(item.subtotal || item.preco);
    }, 0);
  }, [itens]);

  return (
    <>
      <Navbar />

      <main className="cart-page">
        <div className="cart-container">

          <div className="cart-header">
            <div className="cart-title">
              <FiShoppingCart size={28} />
              <h1>Seu Carrinho</h1>
            </div>

            <Link href="/" className="cart-link">
              Continuar comprando
            </Link>
          </div>

          {!loading && itens.length === 0 && (
            <div className="cart-empty">
              <h2>Seu carrinho está vazio</h2>
            </div>
          )}

          {!loading && itens.length > 0 && (
            <div className="cart-grid">

              <div className="cart-items">
                {itens.map((item) => {
                  const id = getItemId(item);

                  return (
                    <div key={id} className="cart-item">

                      <Image
                        src={getItemImagem(item)}
                        alt="produto"
                        width={90}
                        height={90}
                        className="cart-image"
                      />

                      <div className="cart-info">
                        <h3>{getItemNome(item)}</h3>
                        <p>Qtd: {item.quantidade}</p>
                        <strong>{formatarMoeda(item.subtotal || item.preco)}</strong>
                      </div>

                      <button
                        className="cart-remove"
                        onClick={() => removerItem(id)}
                        disabled={removingId === id}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  );
                })}
              </div>

              <aside className="cart-summary">
                <h3>Resumo</h3>

                <div className="cart-total">
                  <span>Total</span>
                  <strong>{formatarMoeda(total)}</strong>
                </div>

                <Link href="/Carrinho/checkout" className="cart-checkout">
                  Finalizar compra <FiArrowRight />
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