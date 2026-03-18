'use client';

import { useEffect, useState } from "react";
import { useLoginConfig } from "@/hooks/useLoginConfig";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaBackspace, FaLock } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PinPage() {
  const router = useRouter();

  const {
    config,
    loading,
    handleValidarPin,
    loadingBtn,
    errorMsg
  } = useLoginConfig();

  const [pin, setPin] = useState("");

  useEffect(() => {
    if (errorMsg) {
      toast.error(errorMsg);
    }
  }, [errorMsg]);

  const adicionarNumero = (numero: string) => {
    setPin((prev) => {
      if (prev.length >= 6) return prev;
      return prev + numero;
    });
  };

  const apagarUltimo = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const limparPin = () => {
    setPin("");
  };

  const validar = () => {
    if (pin.length < 4) {
      toast.warning("Digite um PIN válido");
      return;
    }

    handleValidarPin(pin);
  };

  if (loading) {
    return (
      <>
        <div className="loadingPage">
          <div className="loadingContent">
            <span className="loadingSpinner" />
            <p>Carregando...</p>
          </div>
        </div>

        <style jsx>{`
          .loadingPage {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #050505;
            color: white;
            font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          }

          .loadingContent {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
          }

          .loadingSpinner {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid rgba(255,255,255,.16);
            border-top: 3px solid rgba(255,255,255,.8);
            animation: spin .8s linear infinite;
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

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        theme="dark"
        pauseOnHover
        closeOnClick
      />

      <div
        className="page"
        style={{ background: config?.fundo || "#050505" }}
      >
        <div className="overlay" />

        <div className="pinBox">
          {config?.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logo} className="logo" alt="Logo" />
          )}

          <div className="header">
            <h1 className="title">Verificação</h1>
            <p className="subtitle">Digite o PIN para continuar</p>
          </div>

          <div className="pinDisplayWrap">
            <FaLock className="lockIcon" />

            <input
              className="pinDisplay"
              type="password"
              value={pin}
              readOnly
              inputMode="none"
              autoComplete="one-time-code"
              placeholder="••••••"
              onKeyDown={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onFocus={(e) => e.currentTarget.blur()}
            />
          </div>

          <div className="dots">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <span
                key={item}
                className={`dot ${pin.length > item ? "filled" : ""}`}
              />
            ))}
          </div>

          <div className="keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((numero) => (
              <button
                key={numero}
                type="button"
                className="key"
                onClick={() => adicionarNumero(numero)}
                disabled={loadingBtn}
              >
                {numero}
              </button>
            ))}

            <button
              type="button"
              className="key keyAlt"
              onClick={limparPin}
              disabled={loadingBtn || pin.length === 0}
            >
              Limpar
            </button>

            <button
              type="button"
              className="key"
              onClick={() => adicionarNumero("0")}
              disabled={loadingBtn}
            >
              0
            </button>

            <button
              type="button"
              className="key keyAlt"
              onClick={apagarUltimo}
              disabled={loadingBtn || pin.length === 0}
            >
              <FaBackspace />
            </button>
          </div>

          <button
            className="btnConfirm"
            onClick={validar}
            disabled={loadingBtn || pin.length < 4}
            type="button"
          >
            {loadingBtn ? (
              <span className="btnLoading">
                <span className="miniSpinner" />
                Validando...
              </span>
            ) : (
              "Validar PIN"
            )}
          </button>

          <button
            className="btnBack"
            onClick={() => router.push("/login/entrar")}
            type="button"
          >
            <FaArrowLeft />
            Voltar
          </button>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 15% 20%, rgba(255, 170, 195, 0.16), transparent 28%),
            radial-gradient(circle at 85% 82%, rgba(255, 145, 180, 0.12), transparent 26%),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04), transparent 40%);
          pointer-events: none;
        }

        .pinBox {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 390px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .logo {
          width: 100px;
          height: auto;
          object-fit: contain;
          display: block;
          margin: 0 auto 6px auto;
          filter: drop-shadow(0 10px 22px rgba(0,0,0,.28));
        }

        .header {
          text-align: center;
        }

        .title {
          margin: 0;
          font-size: 31px;
          line-height: 1.08;
          font-weight: 900;
          color: white;
          letter-spacing: -0.8px;
        }

        .subtitle {
          margin: 10px 0 0 0;
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255,255,255,.76);
        }

        .pinDisplayWrap {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
        }

        .lockIcon {
          color: rgba(255,255,255,.82);
          font-size: 12px;
          flex-shrink: 0;
        }

        .pinDisplay {
          border: none;
          background: transparent;
          outline: none;
          color: white;
          width: 100%;
          font-size: 18px;
          letter-spacing: 8px;
          text-align: center;
          caret-color: transparent;
          user-select: none;
        }

        .pinDisplay::placeholder {
          color: rgba(255,255,255,.35);
          letter-spacing: 8px;
        }

        .dots {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: -2px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,.18);
          border: 1px solid rgba(255,255,255,.12);
          transition: .2s ease;
        }

        .dot.filled {
          background: #ffd0db;
          border-color: #ffd0db;
          box-shadow: 0 0 12px rgba(255, 208, 219, .3);
        }

        .keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 4px;
        }

        .key {
          height: 58px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 16px;
          background: rgba(255,255,255,.08);
          color: white;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: transform .18s ease, background .18s ease, border-color .18s ease;
        }

        .key:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,.12);
          border-color: rgba(255,255,255,.22);
        }

        .key:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none;
        }

        .keyAlt {
          font-size: 13px;
        }

        .btnConfirm {
          width: 100%;
          margin-top: 4px;
          padding: 14px 16px;
          border-radius: 14px;
          border: none;
          font-weight: 900;
          font-size: 15px;
          cursor: pointer;
          background: linear-gradient(90deg, #ffd0db, #ff9fb3);
          color: #2b0c16;
          transition: transform .2s ease, filter .2s ease, opacity .2s ease;
          box-shadow: 0 12px 28px rgba(0,0,0,.24);
        }

        .btnConfirm:hover {
          transform: translateY(-1px);
          filter: brightness(1.03);
        }

        .btnConfirm:disabled {
          opacity: .7;
          cursor: not-allowed;
          transform: none;
        }

        .btnBack {
          background: none;
          border: none;
          color: rgba(255,255,255,.82);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          margin-top: 2px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: color .2s ease;
        }

        .btnBack:hover {
          color: white;
        }

        .btnLoading {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .miniSpinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,.18);
          border-top: 2px solid rgba(0,0,0,.55);
          animation: spin .7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 18px;
          }

          .pinBox {
            max-width: 100%;
          }

          .logo {
            width: 88px;
          }

          .title {
            font-size: 27px;
          }

          .subtitle {
            font-size: 13px;
          }

          .key {
            height: 54px;
            font-size: 17px;
          }

          .pinDisplay {
            font-size: 17px;
          }
        }
      `}</style>
    </>
  );
}