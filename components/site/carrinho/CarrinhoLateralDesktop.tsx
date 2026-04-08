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
        .cart-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.42);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.28s ease, visibility 0.28s ease;
          z-index: 9998;
        }

        .cart-drawer-overlay.is-open {
          opacity: 1;
          visibility: visible;
        }

        .cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: min(430px, 92vw);
          height: 100vh;
          background: linear-gradient(180deg, #ffffff 0%, #fffaf7 100%);
          box-shadow: -24px 0 60px rgba(15, 23, 42, 0.18);
          border-left: 1px solid rgba(148, 163, 184, 0.18);
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 9999;
          display: flex;
          flex-direction: column;
        }

        .cart-drawer.is-open {
          transform: translateX(0);
        }

        .cart-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 20px 20px 18px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px);
        }

        .cart-drawer-titleWrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cart-drawer-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #8b5e3c;
          background: linear-gradient(135deg, #f7e5d8 0%, #efd3bf 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .cart-drawer-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #1e293b;
        }

        .cart-drawer-subtitle {
          margin: 3px 0 0;
          font-size: 0.92rem;
          color: #64748b;
        }

        .cart-drawer-close {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: #fff;
          color: #334155;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cart-drawer-close:hover {
          transform: translateY(-1px);
          background: #f8fafc;
        }

        .cart-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .cart-loading,
        .cart-feedback,
        .cart-empty {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px 12px;
        }

        .cart-loading p,
        .cart-feedback p,
        .cart-empty-text {
          margin: 10px 0 0;
          max-width: 290px;
          line-height: 1.6;
          color: #64748b;
          font-size: 0.96rem;
        }

        .cart-loading-spinner {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 4px solid #ead7ca;
          border-top-color: #8b5e3c;
          animation: spin 0.9s linear infinite;
        }

        .cart-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          margin-bottom: 18px;
          color: #8b5e3c;
          background: linear-gradient(135deg, #f6e7db 0%, #f2d6c3 100%);
          box-shadow: 0 12px 30px rgba(139, 94, 60, 0.16);
        }

        .cart-empty-title,
        .cart-feedback h4 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
        }

        .cart-empty-button {
          margin-top: 18px;
          border: 0;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 700;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(135deg, #b77b56 0%, #8b5e3c 100%);
          box-shadow: 0 12px 24px rgba(139, 94, 60, 0.22);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .cart-empty-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 28px rgba(139, 94, 60, 0.28);
        }

        .cart-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 76px 1fr;
          gap: 14px;
          align-items: start;
          padding: 14px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid rgba(148, 163, 184, 0.16);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }

        .cart-item-imageWrap {
          width: 76px;
          height: 76px;
          border-radius: 16px;
          overflow: hidden;
          background: #f8fafc;
        }

        .cart-item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .cart-item-content {
          min-width: 0;
        }

        .cart-item-title {
          margin: 0;
          font-size: 0.98rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.4;
        }

        .cart-item-meta {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px 12px;
          font-size: 0.88rem;
          color: #64748b;
        }

        .cart-item-bottom {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .cart-item-price {
          font-size: 1rem;
          color: #8b5e3c;
        }

        .cart-item-remove {
          border: 0;
          background: transparent;
          color: #b91c1c;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .cart-item-remove:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cart-drawer-footer {
          border-top: 1px solid rgba(148, 163, 184, 0.16);
          padding: 18px 20px 20px;
          background: #fff;
        }

        .cart-summary {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 16px;
          padding: 14px 16px;
          background: #fcfcfd;
        }

        .cart-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #334155;
          font-size: 0.97rem;
        }

        .cart-summary-row strong {
          font-size: 1.05rem;
          color: #0f172a;
        }

        .cart-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 14px;
        }

        .cart-secondary-btn,
        .cart-primary-btn {
          width: 100%;
          border-radius: 14px;
          padding: 13px 16px;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .cart-secondary-btn {
          border: 1px solid rgba(148, 163, 184, 0.22);
          color: #334155;
          background: #fff;
        }

        .cart-secondary-btn:hover {
          background: #f8fafc;
          transform: translateY(-1px);
        }

        .cart-primary-btn {
          border: 0;
          color: #fff;
          background: linear-gradient(135deg, #b77b56 0%, #8b5e3c 100%);
          box-shadow: 0 14px 26px rgba(139, 94, 60, 0.22);
        }

        .cart-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 32px rgba(139, 94, 60, 0.28);
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