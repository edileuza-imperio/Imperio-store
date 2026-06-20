"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiMinus,
  FiPackage,
  FiPlus,
  FiShoppingCart,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { rotas } from "@/components/Bibioteca/config/rotas";

import "../../../components/styles/navbar/CarrinhoSidebar.css";

type CarrinhoItem = {
  id_carrinho_item: number;
  carrinho_id: number;
  produto_id: number;
  produto_nome: string;
  produto_slug?: string | null;
  imagem?: string | null;
  quantidade: number;
  preco_unitario: number;
  preco_promocional_unitario?: number | null;
  subtotal: number;
};

type Props = {
  aberto: boolean;
  aoFechar: () => void;
};

function pegarDados<T>(res: any): T {
  return (
    res?.data?.dados?.dados ??
    res?.data?.dados?.lista ??
    res?.data?.dados?.itens ??
    res?.data?.dados ??
    res?.data ??
    []
  ) as T;
}

function moeda(valor?: number | string | null) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function precoFinal(item: CarrinhoItem) {
  return item.preco_promocional_unitario && item.preco_promocional_unitario > 0
    ? item.preco_promocional_unitario
    : item.preco_unitario;
}

export default function CarrinhoSidebar({ aberto, aoFechar }: Props) {
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState<CarrinhoItem[]>([]);
  const [alterando, setAlterando] = useState<number | null>(null);

  async function carregar() {
    try {
      setLoading(true);

      const res = await api.get(rotas.carrinho.itens);
      const dados = pegarDados<CarrinhoItem[]>(res);

      setItens(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
      setItens([]);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarQuantidade(item: CarrinhoItem, novaQuantidade: number) {
    if (novaQuantidade <= 0) {
      await removerItem(item.id_carrinho_item);
      return;
    }

    try {
      setAlterando(item.id_carrinho_item);

      await api.put(rotas.carrinho.atualizarItem(item.id_carrinho_item), {
        quantidade: novaQuantidade,
      });

      await carregar();
      window.dispatchEvent(new CustomEvent("carrinhoAtualizado"));
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    } finally {
      setAlterando(null);
    }
  }

  async function removerItem(itemId: number) {
    try {
      setAlterando(itemId);

      await api.delete(rotas.carrinho.removerItem(itemId));

      await carregar();
      window.dispatchEvent(new CustomEvent("carrinhoAtualizado"));
    } catch (error) {
      console.error("Erro ao remover item:", error);
    } finally {
      setAlterando(null);
    }
  }

  useEffect(() => {
    if (aberto) carregar();
  }, [aberto]);

  useEffect(() => {
    const atualizar = () => {
      if (aberto) carregar();
    };

    window.addEventListener("carrinhoAtualizado", atualizar);

    return () => {
      window.removeEventListener("carrinhoAtualizado", atualizar);
    };
  }, [aberto]);

  const resumo = useMemo(() => {
    const quantidade = itens.reduce(
      (soma, item) => soma + Number(item.quantidade ?? 0),
      0
    );

    const subtotal = itens.reduce((soma, item) => {
      if (Number(item.subtotal) > 0) return soma + Number(item.subtotal);

      return soma + Number(precoFinal(item) ?? 0) * Number(item.quantidade ?? 1);
    }, 0);

    return {
      quantidade,
      subtotal,
      total: subtotal,
    };
  }, [itens]);

  return (
    <>
      <div
        className={`cartOverlay ${aberto ? "cartOverlayShow" : ""}`}
        onClick={aoFechar}
        aria-hidden="true"
      />

      <aside
        className={`cartSidebar ${aberto ? "cartSidebarOpen" : ""}`}
        aria-label="Carrinho lateral"
        aria-hidden={!aberto}
      >
        <div className="cartSidebarHeader">
          <div>
            <span className="cartHeaderLabel">Seu pedido</span>
            <h2>Meu carrinho</h2>
            <p>{resumo.quantidade} item(ns) selecionado(s)</p>
          </div>

          <button type="button" onClick={aoFechar} aria-label="Fechar carrinho">
            <FiX size={22} />
          </button>
        </div>

        <div className="cartSidebarContent">
          {loading ? (
            <div className="cartEmpty">
              <div className="cartLoader" />
              <strong>Carregando carrinho...</strong>
            </div>
          ) : itens.length === 0 ? (
            <div className="cartEmpty">
              <FiShoppingCart size={42} />
              <strong>Seu carrinho está vazio</strong>
              <span>Adicione produtos para continuar.</span>
            </div>
          ) : (
            itens.map((item) => {
              const imagem = imagemFundo(item.imagem);
              const bloqueado = alterando === item.id_carrinho_item;
              const preco = precoFinal(item);
              const totalItem =
                Number(item.subtotal) > 0
                  ? Number(item.subtotal)
                  : Number(preco) * Number(item.quantidade ?? 1);

              return (
                <div key={item.id_carrinho_item} className="cartMiniItem">
                  <div className="cartMiniImage">
                    {imagem ? (
                      <Image src={imagem} alt={item.produto_nome} fill sizes="86px" />
                    ) : (
                      <FiPackage size={24} />
                    )}
                  </div>

                  <div className="cartMiniInfo">
                    <div className="cartItemTop">
                      <strong>{item.produto_nome}</strong>

                      <button
                        type="button"
                        className="cartRemoveBtn"
                        disabled={bloqueado}
                        onClick={() => removerItem(item.id_carrinho_item)}
                        title="Remover item"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>

                    <div className="cartMiniPrice">
                      <span>Unitário</span>
                      <b>{moeda(preco)}</b>
                    </div>

                    <div className="cartQtyRow">
                      <button
                        type="button"
                        disabled={bloqueado}
                        onClick={() => atualizarQuantidade(item, item.quantidade - 1)}
                      >
                        <FiMinus size={14} />
                      </button>

                      <span>{item.quantidade}</span>

                      <button
                        type="button"
                        disabled={bloqueado}
                        onClick={() => atualizarQuantidade(item, item.quantidade + 1)}
                      >
                        <FiPlus size={14} />
                      </button>

                      <strong className="cartItemSubtotal">{moeda(totalItem)}</strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cartSidebarFooter">
          <div className="cartResumoPedido">
            <h3>🛍️ Resumo do pedido</h3>

            <div>
              <span>Itens</span>
              <strong>{resumo.quantidade}</strong>
            </div>

            <div>
              <span>Subtotal</span>
              <strong>{moeda(resumo.subtotal)}</strong>
            </div>

            <div className="cartResumoTotal">
              <span>Total</span>
              <strong>{moeda(resumo.total)}</strong>
            </div>

            <p className="cartResumoInfo">
              Confira os produtos e finalize sua compra com segurança.
            </p>
          </div>

          <Link
            href={rotas.paginas.carrinho}
            onClick={aoFechar}
            className="cartCheckoutButton"
          >
            Revisar pedido e finalizar →
          </Link>
        </div>
      </aside>
    </>
  );
}