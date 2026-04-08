"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FiShoppingCart, FiX, FiArrowRight } from "react-icons/fi";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CarrinhoLateralDesktop({
  open,
  onClose,
}: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
                Veja seus itens antes de finalizar
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

          {/*
            Depois você pode substituir essa parte
            pelos itens reais do carrinho.
          */}
        </div>

        <div className="cart-drawer-footer">
          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>R$ 0,00</strong>
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
          width: min(420px, 92vw);
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

        .cart-empty {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px 12px;
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

        .cart-empty-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
        }

        .cart-empty-text {
          margin: 10px 0 0;
          max-width: 280px;
          line-height: 1.6;
          color: #64748b;
          font-size: 0.96rem;
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
      `}</style>
    </>
  );
}