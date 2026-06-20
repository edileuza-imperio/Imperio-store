"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPackage, FiPlus, FiShoppingCart, FiTrash2, FiX } from "react-icons/fi";

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
    if (novaQuantidade <= 0) return removerItem(item.id_carrinho_item);

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

  const total = useMemo(() => {
    return itens.reduce((soma, item) => {
      if (Number(item.subtotal) > 0) return soma + Number(item.subtotal);

      return soma + Number(precoFinal(item) ?? 0) * Number(item.quantidade ?? 1);
    }, 0);
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
            <h2>Meu carrinho</h2>
            <span>{itens.length} item(s)</span>
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
              <FiShoppingCart size={36} />
              <strong>Seu carrinho está vazio</strong>
              <span>Adicione produtos para continuar.</span>
            </div>
          ) : (
            itens.map((item) => {
              const imagem = imagemFundo(item.imagem);
              const bloqueado = alterando === item.id_carrinho_item;

              return (
                <div key={item.id_carrinho_item} className="cartMiniItem">
                  <div className="cartMiniImage">
                    {imagem ? (
                      <Image src={imagem} alt={item.produto_nome} fill sizes="76px" />
                    ) : (
                      <FiPackage size={22} />
                    )}
                  </div>

                  <div className="cartMiniInfo">
                    <strong>{item.produto_nome}</strong>

                    <div className="cartMiniPrice">
                      <b>{moeda(precoFinal(item))}</b>
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

                      <button
                        type="button"
                        className="cartRemoveBtn"
                        disabled={bloqueado}
                        onClick={() => removerItem(item.id_carrinho_item)}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cartSidebarFooter">
          <div className="cartTotalBox">
            <span>Total</span>
            <strong>{moeda(total)}</strong>
          </div>

          <Link href={rotas.paginas.carrinho} onClick={aoFechar}>
            Ver carrinho completo
          </Link>
        </div>
      </aside>
    </>
  );
}