'use client';

import { useState } from "react";
import { useLoginConfig } from "@/hooks/useLoginConfig";
import { useRouter } from "next/navigation";

export default function LoginEntrar() {
  const router = useRouter();

  const {
    config,
    loading,
    handleLogin,
    loadingBtn,
    errorMsg
  } = useLoginConfig();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

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
      <div
        className="page"
        style={{ background: config?.fundo || "#050505" }}
      >
        <div className="overlay" />

        <div className="loginBox">
          {config?.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logo} className="logo" alt="Logo" />
          )}

          <div className="header">
            <h2 className="title">{config?.titulo || "Entrar"}</h2>
            <p className="subtitle">Digite seus dados para acessar sua conta</p>
          </div>

          {errorMsg && (
            <p className="error">{errorMsg}</p>
          )}

          <div className="fieldGroup">
            <label className="label">Usuário ou e-mail</label>
            <input
              className="input"
              placeholder="Digite seu usuário ou e-mail"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="fieldGroup">
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            className="btnLogin"
            onClick={() => handleLogin(usuario, senha)}
            disabled={loadingBtn}
          >
            {loadingBtn ? (
              <span className="btnLoading">
                <span className="miniSpinner" />
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </button>

          <button
            className="btnBack"
            onClick={() => router.push("/login")}
            type="button"
          >
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

        .loginBox {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 390px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .logo {
          width: 110px;
          height: auto;
          object-fit: contain;
          display: block;
          margin: 0 auto 6px auto;
          filter: drop-shadow(0 10px 22px rgba(0,0,0,.28));
        }

        .header {
          text-align: center;
          margin-bottom: 4px;
        }

        .title {
          margin: 0;
          font-size: 32px;
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

        .fieldGroup {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label {
          color: rgba(255,255,255,.92);
          font-size: 13px;
          font-weight: 700;
          padding-left: 2px;
        }

        .input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color .2s ease, background .2s ease, transform .2s ease, box-shadow .2s ease;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
        }

        .input::placeholder {
          color: rgba(255,255,255,.52);
        }

        .input:focus {
          border-color: rgba(255,255,255,.28);
          background: rgba(255,255,255,.12);
          transform: translateY(-1px);
          box-shadow:
            0 0 0 4px rgba(255,255,255,.05),
            inset 0 1px 0 rgba(255,255,255,.06);
        }

        .btnLogin {
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

        .btnLogin:hover {
          transform: translateY(-1px);
          filter: brightness(1.03);
        }

        .btnLogin:disabled {
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
          transition: color .2s ease, opacity .2s ease;
        }

        .btnBack:hover {
          color: white;
        }

        .error {
          background: rgba(255, 59, 59, .14);
          border: 1px solid rgba(255, 59, 59, .24);
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          color: #ffd7d7;
          line-height: 1.5;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
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

          .loginBox {
            max-width: 100%;
          }

          .logo {
            width: 92px;
          }

          .title {
            font-size: 27px;
          }

          .subtitle {
            font-size: 13px;
          }

          .input,
          .btnLogin {
            padding: 13px 14px;
          }
        }
      `}</style>
    </>
  );
}