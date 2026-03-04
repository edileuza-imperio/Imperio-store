'use client';

import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

export default function LoginModal({
  open,
  onClose,
  title = "Entrar",
  children,
}: LoginModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // trava scroll do body
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="lm-overlay"
        role="presentation"
        onMouseDown={(e) => {
          // fecha se clicar fora do card
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="lm-card"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          ref={dialogRef}
        >
          <div className="lm-header">
            <div className="lm-title">{title}</div>

            <button className="lm-close" type="button" onClick={onClose} aria-label="Fechar">
              <FiX size={18} />
            </button>
          </div>

          <div className="lm-body">
            {children ? (
              children
            ) : (
              <>
                <p className="lm-sub">
                  Faça login para acessar seu perfil, pedidos e painel (se tiver permissão).
                </p>

                {/* 🔧 Placeholder: troque pelo seu form real */}
                <div className="lm-form">
                  <label className="lm-label">E-mail</label>
                  <input className="lm-input" placeholder="seuemail@exemplo.com" />

                  <label className="lm-label">Senha</label>
                  <input className="lm-input" type="password" placeholder="••••••••" />

                  <button className="lm-primary" type="button">
                    Entrar
                  </button>

                  <button className="lm-secondary" type="button" onClick={onClose}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .lm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
          backdrop-filter: blur(6px);
        }

        .lm-card {
          width: 100%;
          max-width: 460px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 22px 60px rgba(0,0,0,0.20);
          overflow: hidden;
        }

        .lm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          background: linear-gradient(180deg, rgba(214,162,74,0.12), transparent);
        }

        .lm-title {
          font-weight: 900;
          font-size: 16px;
          color: #2b2b2b;
          letter-spacing: -0.2px;
        }

        .lm-close {
          border: 1px solid rgba(0,0,0,0.10);
          background: #fff;
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform .12s ease, background .12s ease;
        }
        .lm-close:hover {
          background: rgba(0,0,0,0.04);
          transform: translateY(-1px);
        }

        .lm-body {
          padding: 16px;
        }

        .lm-sub {
          margin: 0 0 12px 0;
          color: #6c757d;
          font-weight: 600;
          font-size: 13px;
          line-height: 1.3;
        }

        .lm-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lm-label {
          font-size: 13px;
          font-weight: 800;
          color: #2b2b2b;
          margin-top: 6px;
        }

        .lm-input {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.12);
          padding: 0 12px;
          outline: none;
          font-weight: 700;
        }
        .lm-input:focus {
          border-color: rgba(214,162,74,0.55);
          box-shadow: 0 0 0 4px rgba(214,162,74,0.16);
        }

        .lm-primary {
          margin-top: 10px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(214,162,74,0.35);
          background: #fff8ef;
          color: #2b2b2b;
          font-weight: 900;
          cursor: pointer;
          transition: transform .12s ease;
        }
        .lm-primary:hover { transform: translateY(-1px); }

        .lm-secondary {
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.10);
          background: #fff;
          color: #2b2b2b;
          font-weight: 900;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}