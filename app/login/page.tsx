// app/login/page.tsx
'use client';

import { useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUser, FaLock, FaKey, FaUserPlus, FaArrowLeft } from "react-icons/fa";
import { useLoginConfig } from "@/hooks/useLoginConfig";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [pin, setPin] = useState("");

  const {
    config,
    loading,
    step,
    setStep,
    loadingBtn,
    errorMsg,
    handleLogin,
    handleValidarPin,
  } = useLoginConfig();

  const theme = useMemo(() => {
    const base = config?.fundo || "#7b1e3a";
    return { base };
  }, [config?.fundo]);

  if (loading) return <p className="loading">Carregando...</p>;

  const titulo = config?.titulo || "Bem-vindo";
  const mensagem =
    config?.mensagem_personalizada || "Entre com suas credenciais.";
  const logo = config?.logo || "";

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />

      <div className="page" style={{ background: theme.base }}>
        <div className="overlay" />

        <div className="shell">
          {/* ESQUERDA */}
          <div className="left">
            <div className="panel">
              {/* INICIO */}
              {step === "inicio" && (
                <>
                  <h2 className="h2">{titulo}</h2>
                  <p className="p">{mensagem}</p>

                  <button
                    className="btnPrimary"
                    onClick={() => setStep("login")}
                    disabled={loadingBtn}
                  >
                    Entrar
                  </button>

                  <button
                    className="btnSecondary"
                    type="button"
                    onClick={() => router.push("/cadastro")}
                    disabled={loadingBtn}
                  >
                    <FaUserPlus />
                    Criar conta
                  </button>
                </>
              )}

              {/* LOGIN */}
              {step === "login" && (
                <>
                  <h2 className="h2">Login</h2>
                  <p className="p">{mensagem}</p>

                  {errorMsg && <p className="error">{errorMsg}</p>}

                  <div className="inputWrap">
                    <span className="icon">
                      <FaUser />
                    </span>
                    <input
                      type="text"
                      placeholder="Usuário ou Email"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      autoComplete="username"
                    />
                  </div>

                  <div className="inputWrap">
                    <span className="icon">
                      <FaLock />
                    </span>
                    <input
                      type="password"
                      placeholder="Senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    className="btnPrimary"
                    onClick={() => handleLogin(usuario, senha)}
                    disabled={loadingBtn}
                  >
                    {loadingBtn ? <span className="spinner" /> : "Entrar"}
                  </button>

                  <div className="row">
                    <button
                      className="btnLink"
                      type="button"
                      onClick={() => setStep("inicio")}
                    >
                      <FaArrowLeft />
                      Voltar
                    </button>

                    <button
                      className="btnLink"
                      type="button"
                      onClick={() => alert("Recuperação depois 😊")}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </>
              )}

              {/* PIN */}
              {step === "pin" && (
                <>
                  <h2 className="h2">Verificação</h2>
                  <p className="p">Digite o PIN para continuar.</p>

                  {errorMsg && <p className="error">{errorMsg}</p>}

                  <div className="inputWrap">
                    <span className="icon">
                      <FaKey />
                    </span>
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="PIN (4 a 6 dígitos)"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                  </div>

                  <button
                    className="btnPrimary"
                    onClick={() => handleValidarPin(pin)}
                    disabled={pin.length < 4 || loadingBtn}
                  >
                    {loadingBtn ? (
                      <span className="spinner" />
                    ) : (
                      "Validar PIN"
                    )}
                  </button>

                  <button
                    className="btnGhost"
                    onClick={() => setStep("login")}
                    disabled={loadingBtn}
                    type="button"
                  >
                    Voltar para login
                  </button>
                </>
              )}
            </div>
          </div>

          {/* DIREITA */}
          <div className="right">
            <div className="brand">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo" className="logo" />
              ) : (
                <div className="logoFallback">IMPÉRIO</div>
              )}

              <h1 className="title">{titulo}</h1>
              <p className="message">{mensagem}</p>

              <div className="hint">
                <span className="dot" />
                Dica: se você é administrador, pode ser solicitado o PIN.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .loading {
          color: white;
          text-align: center;
          margin-top: 24px;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          display: grid;
          place-items: center;
          padding: 22px;
          position: relative;
          overflow: hidden;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 18% 12%, rgba(255, 190, 205, 0.22), transparent 55%),
            radial-gradient(circle at 85% 85%, rgba(255, 140, 165, 0.18), transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08), transparent 60%);
          filter: blur(2px);
          animation: floatBg 18s linear infinite;
          z-index: 0;
        }

        @keyframes floatBg {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.04); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .shell {
          position: relative;
          z-index: 1;
          width: min(1120px, 100%);
          min-height: 580px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-radius: 26px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.45);
          background: rgba(0, 0, 0, 0.10);
          backdrop-filter: blur(16px);
        }

        .left {
          padding: 38px;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.28);
        }

        .right {
          padding: 38px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
        }

        .panel { width: min(420px, 100%); }

        .h2 {
          margin: 0 0 8px 0;
          font-size: 30px;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .p {
          margin: 0 0 18px 0;
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
          line-height: 1.6;
        }

        .error {
          margin: 0 0 10px 0;
          color: #ffd1d1;
          background: rgba(255, 0, 0, 0.10);
          border: 1px solid rgba(255, 120, 120, 0.22);
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 13px;
        }

        .inputWrap {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          margin-bottom: 12px;
          transition: 0.2s ease;
        }

        .inputWrap:focus-within {
          border-color: rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
        }

        .icon {
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          display: grid;
          place-items: center;
          width: 22px;
        }

        .inputWrap input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #fff;
          font-size: 15px;
        }

        .btnPrimary {
          width: 100%;
          border: 0;
          cursor: pointer;
          padding: 12px 14px;
          border-radius: 14px;
          font-weight: 900;
          font-size: 15px;
          color: #2b0c16;
          background: linear-gradient(90deg, #ffd0db, #ff9fb3);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
          transition: 0.2s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
        }

        .btnPrimary:hover { transform: translateY(-1px); filter: brightness(1.02); }
        .btnPrimary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btnSecondary {
          width: 100%;
          margin-top: 10px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          cursor: pointer;
          padding: 12px 14px;
          border-radius: 14px;
          font-weight: 900;
          font-size: 15px;
          transition: 0.2s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }

        .btnSecondary:hover { transform: translateY(-1px); background: rgba(255, 255, 255, 0.12); }
        .btnSecondary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btnGhost {
          width: 100%;
          margin-top: 10px;
          padding: 11px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(0, 0, 0, 0.12);
          color: #fff;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .btnGhost:hover { background: rgba(0, 0, 0, 0.18); transform: translateY(-1px); }

        .row {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .btnLink {
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.88);
          cursor: pointer;
          font-size: 13px;
          padding: 6px 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btnLink:hover { color: #fff; text-decoration: underline; }

        .spinner {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 3px solid rgba(0, 0, 0, 0.18);
          border-top: 3px solid rgba(0, 0, 0, 0.55);
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .brand {
          width: min(480px, 100%);
          text-align: left;
          color: #fff;
        }

        .logo {
          width: 140px;
          height: auto;
          margin-bottom: 14px;
          filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.35));
        }

        .logoFallback {
          width: 140px;
          height: 70px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-weight: 900;
          letter-spacing: 1px;
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.18);
          margin-bottom: 14px;
        }

        .title {
          margin: 0 0 8px 0;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -0.9px;
          line-height: 1.1;
        }

        .message {
          margin: 0;
          color: rgba(255, 255, 255, 0.88);
          line-height: 1.55;
          max-width: 42ch;
        }

        .hint {
          margin-top: 18px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255, 209, 219, 0.95);
          box-shadow: 0 0 0 4px rgba(255, 209, 219, 0.12);
        }

        @media (max-width: 900px) {
          .shell { grid-template-columns: 1fr; }
          .right { order: -1; }
          .title { font-size: 30px; }
        }
      `}</style>
    </>
  );
}
