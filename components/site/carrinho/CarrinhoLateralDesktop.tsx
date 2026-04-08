"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiShoppingCart, FiX, FiArrowRight, FiTrash2 } from "react-icons/fi";
import { InicioApi } from "@/services/api/api";
 // ajuste o caminho se necessário

type Props = {
  open: boolean;
  onClose: () => void;
};

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

type CarrinhoResumo = {
  id?: number | string;
  subtotal?: number | string;
  total?: number | string;
  valor_total?: number | string;
  quantidade_itens?: number | string;
};

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
  if (Array.isArray(payload?.dados?.itens)) return payload.dados.itens;
  if (Array.isArray(payload?.carrinho?.itens)) return payload.carrinho.itens;
  return [];
}

function extrairObjeto<T = unknown>(payload: any): T | null {
  if (!payload) return null;
  if (payload?.dados && !Array.isArray(payload.dados)) return payload.dados as T;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data as T;
  if (payload?.carrinho && !Array.isArray(payload.carrinho)) return payload.carrinho as T;
  if (!Array.isArray(payload) && typeof payload === "object") return payload as T;
  return null;
}

function getItemId(item: CarrinhoItem) {
  return item.id ?? item.id_item ?? item.item_id ?? item.produto_id ?? "";
}

function getItemNome(item: CarrinhoItem) {
  return item.nome || item.titulo || item.produto_nome || "Produto";
}

function getItemImagem(item: CarrinhoItem) {
  return item.miniatura || item.imagem || item.foto || "/images/sem-imagem.png";
}

function getItemQuantidade(item: CarrinhoItem) {
  return normalizarNumero(item.quantidade || 0);
}

function getItemPreco(item: CarrinhoItem) {
  return normalizarNumero(item.preco_unitario ?? item.preco ?? 0);
}

function getItemSubtotal(item: CarrinhoItem) {
  const subtotal = normalizarNumero(item.subtotal ?? item.total ?? 0);
  if (subtotal > 0) return subtotal;
  return getItemPreco(item) * getItemQuantidade(item);
}

export default function CarrinhoLateralDesktop({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | number | null>(null);
  const [itens, setItens] = useState<CarrinhoItem[]>([]);
  const [resumo, setResumo] = useState<CarrinhoResumo | null>(null);
  const [erro, setErro] = useState("");

  const carregarCarrinho = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const [resCarrinho, resItens] = await Promise.all([
        InicioApi.get("/carrinho", { withCredentials: true }),
        InicioApi.get("/carrinho/itens", { withCredentials: true }),
      ]);

      const resumoData = extrairObjeto<CarrinhoResumo>(resCarrinho?.data);
      const itensData = extrairLista<CarrinhoItem>(resItens?.data);

      setResumo(resumoData);
      setItens(itensData);
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
      setErro("Não foi possível carregar o carrinho.");
      setResumo(null);
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const removerItem = useCallback(
    async (itemId: string | number) => {
      if (!itemId) return;

      try {
        setRemovingId(itemId);

        await InicioApi.delete(`/carrinho/item/${itemId}`, {
          withCredentials: true,
        });

        try {
          await InicioApi.put(
            "/carrinho/recalcular",
            {},
            { withCredentials: true }
          );
        } catch (e) {
          console.warn("Não foi possível recalcular o carrinho automaticamente.", e);
        }

        await carregarCarrinho();
      } catch (error) {
        console.error("Erro ao remover item do carrinho:", error);
      } finally {
        setRemovingId(null);
      }
    },
    [carregarCarrinho]
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      carregarCarrinho();
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, carregarCarrinho]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const subtotal = useMemo(() => {
    const valorResumo =
      resumo?.subtotal ?? resumo?.total ?? resumo?.valor_total ?? 0;

    const numeroResumo = normalizarNumero(valorResumo);
    if (numeroResumo > 0) return numeroResumo;

    return itens.reduce((acc, item) => acc + getItemSubtotal(item), 0);
  }, [resumo, itens]);

  const quantidadeItens = useMemo(() => {
    const qResumo = normalizarNumero(resumo?.quantidade_itens ?? 0);
    if (qResumo > 0) return qResumo;

    return itens.reduce((acc, item) => acc + getItemQuantidade(item), 0);
  }, [resumo, itens]);

  return (
    <>
      <div
        className={`cart-drawer-overlay ${open ? "is-open" : ""}`}
        onClick={onClose}
      />

      <aside className={`cart-drawer ${open ? "is-open" : ""}`}>
        <div className="cart-drawer-header">
          <div className="cart-drawer-titleWrap">
            <div className="cart-drawer-icon">
              <FiShoppingCart size={20} />
            </div>

            <div>
              <h3 className="cart-drawer-title">Seu carrinho</h3>
              <p className="cart-drawer-subtitle">
                {quantidadeItens > 0
                  ? `${quantidadeItens} item(ns) no carrinho`
                  : "Veja seus itens antes de finalizar"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cart-drawer-close"
            aria-label="Fechar carrinho"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {loading && (
            <div className="cart-loading">
              <div className="cart-loading-spinner" />
              <p>Carregando carrinho...</p>
            </div>
          )}

          {!loading && erro && (
            <div className="cart-feedback">
              <h4>Ops!</h4>
              <p>{erro}</p>

              <button type="button" className="cart-empty-button" onClick={carregarCarrinho}>
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !erro && itens.length === 0 && (
            <div className="cart-empty">
              <div className="cart-empty-icon">
                <FiShoppingCart size={28} />
              </div>

              <h4 className="cart-empty-title">Seu carrinho está vazio</h4>

              <p className="cart-empty-text">
                Adicione produtos para visualizar o resumo da compra aqui.
              </p>

              <button
                type="button"
                className="cart-empty-button"
                onClick={onClose}
              >
                Continuar comprando
              </button>
            </div>
          )}

          {!loading && !erro && itens.length > 0 && (
            <div className="cart-list">
              {itens.map((item) => {
                const itemId = getItemId(item);
                const nome = getItemNome(item);
                const imagem = getItemImagem(item);
                const quantidade = getItemQuantidade(item);
                const preco = getItemPreco(item);
                const subtotalItem = getItemSubtotal(item);

                return (
                  <div
                    key={String(itemId || nome)}
                    className="cart-item"
                  >
                    <div className="cart-item-imageWrap">
                      <Image
                        src={imagem}
                        alt={nome}
                        width={76}
                        height={76}
                        className="cart-item-image"
                      />
                    </div>

                    <div className="cart-item-content">
                      <h4 className="cart-item-title">{nome}</h4>

                      <div className="cart-item-meta">
                        <span>Qtd: {quantidade}</span>
                        <span>Unit.: {formatarMoeda(preco)}</span>
                      </div>

                      <div className="cart-item-bottom">
                        <strong className="cart-item-price">
                          {formatarMoeda(subtotalItem)}
                        </strong>

                        <button
                          type="button"
                          className="cart-item-remove"
                          onClick={() => removerItem(itemId)}
                          disabled={removingId === itemId}
                        >
                          <FiTrash2 size={16} />
                          {removingId === itemId ? "Removendo..." : "Remover"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="cart-drawer-footer">
          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{formatarMoeda(subtotal)}</strong>
            </div>
          </div>

          <div className="cart-actions">
            <Link href="/carrinho" className="cart-secondary-btn" onClick={onClose}>
              Ver carrinho completo
            </Link>

            <Link href="/checkout" className="cart-primary-btn" onClick={onClose}>
              Finalizar compra
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </aside>

      <style jsx>{`
        
      `}</style>
    </>
  );
}