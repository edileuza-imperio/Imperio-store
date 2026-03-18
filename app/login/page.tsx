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
    return {
      base: config?.fundo || "#050505",
      primary: config?.cor_primaria || "#f4a6b7",
      secondary: config?.cor_secundaria || "#ffffff",
    };
  }, [config]);

  if (loading) {
    return (
      <>
        <div className="loadingPage">
          <div className="loadingBox">
            <span className="spinnerLoad" />
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

          .loadingBox {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
          }

          .spinnerLoad {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid rgba(255,255,255,.18);
            border-top: 3px solid rgba(255,255,255,.8);
            animation: spin .9s linear infinite;
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

  const titulo = config?.titulo || "Bem-vindo";
  const mensagem =
    config?.mensagem_personalizada || "Entre com suas credenciais para acessar.";
  const logo = config?.logo || "";

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />

      <div className="page" style={{ background: theme.base }}>
        <div className="overlay" />

        <main className="container">
          <section className="content">
            {/* LADO ESQUERDO */}
            <div className="infoSide">
              <div className="brandBlock">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="Logo da loja" className="logo" />
                ) : (
                  <div className="logoFallback">LOGO</div>
                )}

                <div className="textBlock">
                  <h1 className="title">{titulo}</h1>
                  <p className="message">{mensagem}</p>

                  <div className="hint">
                    <span className="dot" />
                    <span>
                      Se você for administrador, poderá ser solicitado um PIN de
                      acesso.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DIREITO */}
            <div className="formSide">
              <div className="panel">
                {step === "inicio" && (
                  <>
                    <h2 className="panelTitle">{titulo}</h2>
                    <p className="panelText">{mensagem}</p>

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

                {step === "login" && (
                  <>
                    <h2 className="panelTitle">Entrar</h2>
                    <p className="panelText">{mensagem}</p>

                    {errorMsg && <p className="error">{errorMsg}</p>}

                    <div className="inputWrap">
                      <FaUser className="icon" />
                      <input
                        type="text"
                        placeholder="Usuário ou e-mail"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        autoComplete="username"
                      />
                    </div>

                    <div className="inputWrap">
                      <FaLock className="icon" />
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

                {step === "pin" && (
                  <>
                    <h2 className="panelTitle">Verificação</h2>
                    <p className="panelText">
                      Digite o PIN para continuar no sistema.
                    </p>

                    {errorMsg && <p className="error">{errorMsg}</p>}

                    <div className="inputWrap">
                      <FaKey className="icon" />
                      <input
                        type="password"
                        maxLength={6}
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="PIN"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </div>

                    <button
                      className="btnPrimary"
                      onClick={() => handleValidarPin(pin)}
                      disabled={pin.length < 4 || loadingBtn}
                    >
                      {loadingBtn ? <span className="spinner" /> : "Validar PIN"}
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
          </section>
        </main>
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
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          padding: 24px;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 12% 18%, rgba(255, 170, 195, 0.18), transparent 28%),
            radial-gradient(circle at 88% 82%, rgba(255, 150, 185, 0.16), transparent 26%),
            linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0));
          pointer-events: none;
        }

        .container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1180px;
        }

        .content {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: center;
          min-height: calc(100vh - 48px);
        }

        .infoSide {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        .brandBlock {
          display: flex;
          align-items: center;
          gap: 26px;
          max-width: 620px;
        }

        .logo {
          width: 130px;
          max-width: 100%;
          height: auto;
          object-fit: contain;
          flex-shrink: 0;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,.35));
        }

        .logoFallback {
          width: 130px;
          height: 130px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.10);
          color: white;
          font-weight: 900;
          font-size: 20px;
          flex-shrink: 0;
        }

        .textBlock {
          color: white;
        }

        .title {
          margin: 0 0 12px 0;
          font-size: clamp(34px, 5vw, 64px);
          line-height: 1.02;
          font-weight: 950;
          letter-spacing: -1.8px;
          max-width: 11ch;
        }

        .message {
          margin: 0;
          font-size: 18px;
          line-height: 1.7;
          color: rgba(255,255,255,.82);
          max-width: 34ch;
        }

        .hint {
          margin-top: 22px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.10);
          color: rgba(255,255,255,.90);
          padding: 14px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
          max-width: 360px;
          backdrop-filter: blur(10px);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${theme.primary};
          flex-shrink: 0;
          box-shadow: 0 0 0 6px rgba(255, 180, 200, .12);
        }

        .formSide {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .panel {
          width: 100%;
          max-width: 430px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 28px;
          padding: 32px;
          backdrop-filter: blur(16px);
          box-shadow: 0 25px 60px rgba(0,0,0,.35);
        }

        .panelTitle {
          color: white;
          margin: 0 0 8px 0;
          font-size: 34px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -0.8px;
        }

        .panelText {
          color: rgba(255,255,255,.78);
          margin: 0 0 22px 0;
          line-height: 1.6;
          font-size: 14px;
        }

        .error {
          background: rgba(255, 59, 59, .10);
          border: 1px solid rgba(255, 59, 59, .22);
          padding: 12px 14px;
          border-radius: 12px;
          margin-bottom: 12px;
          color: #ffd5d5;
          font-weight: 600;
          font-size: 13px;
        }

        .inputWrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.11);
          padding: 14px 16px;
          border-radius: 14px;
          margin-bottom: 12px;
          transition: 0.2s ease;
        }

        .inputWrap:focus-within {
          border-color: rgba(255,255,255,.22);
          background: rgba(255,255,255,.09);
          transform: translateY(-1px);
        }

        .icon {
          color: rgba(255,255,255,.85);
          font-size: 14px;
          flex-shrink: 0;
        }

        .inputWrap input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 15px;
        }

        .inputWrap input::placeholder {
          color: rgba(255,255,255,.46);
        }

        .btnPrimary {
          width: 100%;
          border: none;
          outline: none;
          padding: 14px 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          margin-top: 6px;
          background: ${theme.primary};
          color: #1f0c12;
          transition: 0.2s ease;
          box-shadow: 0 10px 24px rgba(0,0,0,.28);
        }

        .btnPrimary:hover {
          transform: translateY(-1px);
          filter: brightness(1.03);
        }

        .btnPrimary:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .btnSecondary {
          width: 100%;
          margin-top: 10px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.13);
          background: rgba(255,255,255,.03);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .btnSecondary:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,.07);
        }

        .btnSecondary:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .btnGhost {
          width: 100%;
          margin-top: 10px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.13);
          background: transparent;
          color: white;
          cursor: pointer;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .btnGhost:hover {
          background: rgba(255,255,255,.05);
        }

        .row {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btnLink {
          background: none;
          border: none;
          color: rgba(255,255,255,.82);
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
        }

        .btnLink:hover {
          color: white;
          text-decoration: underline;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 3px solid rgba(0,0,0,.15);
          border-top: 3px solid rgba(0,0,0,.55);
          animation: spin .8s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 980px) {
          .content {
            grid-template-columns: 1fr;
            gap: 28px;
            min-height: auto;
          }

          .infoSide {
            justify-content: center;
          }

          .brandBlock {
            width: 100%;
            max-width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
          }

          .logo,
          .logoFallback {
            width: 110px;
            height: auto;
          }

          .title {
            max-width: 100%;
            font-size: clamp(30px, 8vw, 46px);
          }

          .message {
            max-width: 100%;
            font-size: 16px;
          }

          .hint {
            max-width: 100%;
          }

          .formSide {
            justify-content: center;
          }

          .panel {
            max-width: 100%;
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 16px;
            align-items: flex-start;
          }

          .content {
            gap: 22px;
            padding-top: 14px;
          }

          .brandBlock {
            align-items: center;
            text-align: center;
          }

          .textBlock {
            width: 100%;
          }

          .title {
            font-size: 34px;
            line-height: 1.08;
            max-width: 100%;
          }

          .message {
            font-size: 15px;
          }

          .hint {
            text-align: left;
            width: 100%;
          }

          .panel {
            padding: 22px 18px;
            border-radius: 22px;
          }

          .panelTitle {
            font-size: 28px;
          }

          .row {
            flex-direction: column;
            align-items: flex-start;
          }

          .btnLink {
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
}