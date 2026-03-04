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
    const base = config?.fundo || "#000000";
    return { base };
  }, [config?.fundo]);

  if (loading) return <p className="loading">Carregando...</p>;

  const titulo = config?.titulo || "Bem-vindo";
  const mensagem = config?.mensagem_personalizada || "Entre com suas credenciais.";
  const logo = config?.logo || "";

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />

      <div className="page" style={{ background: theme.base }}>
        <div className="overlay" />

        <main className="layout">
          {/* ✅ ESQUERDA: INFORMAÇÕES */}
          <section className="leftInfo">
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
                Se você for administrador poderá ser solicitado um PIN.
              </div>
            </div>
          </section>

          {/* ✅ DIREITA: FORMULÁRIO */}
          <section className="rightForm">
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
                    <FaUser className="icon" />
                    <input
                      type="text"
                      placeholder="Usuário ou Email"
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

              {/* PIN */}
              {step === "pin" && (
                <>
                  <h2 className="h2">Verificação</h2>
                  <p className="p">Digite o PIN para continuar.</p>

                  {errorMsg && <p className="error">{errorMsg}</p>}

                  <div className="inputWrap">
                    <FaKey className="icon" />
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
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
          </section>
        </main>
      </div>

      <style jsx>{`
        .loading {
          color: white;
          text-align: center;
          margin-top: 40px;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 15% 20%, rgba(255, 160, 190, .25), transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 140, 170, .18), transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, .08), transparent 60%);
          animation: bgmove 18s linear infinite;
          filter: blur(2px);
        }

        @keyframes bgmove {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.04); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .layout {
          position: relative;
          z-index: 2;
          width: min(1100px, 100%);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 44px;
          padding: 22px;
        }

        /* ✅ Info fundida */
        .leftInfo {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 10px 8px;
        }

        /* ✅ Form também fundido, sem card */
        .rightForm {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 10px 8px;
        }

        .panel {
          width: 100%;
          max-width: 420px;
        }

        .brand {
          color: white;
          max-width: 460px;
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
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 14px;
          margin-bottom: 14px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .title {
          font-size: 40px;
          font-weight: 950;
          margin: 0 0 8px 0;
          letter-spacing: -1px;
          line-height: 1.1;
        }

        .message {
          color: rgba(255,255,255,.85);
          margin: 0;
          line-height: 1.6;
          max-width: 46ch;
        }

        .hint {
          margin-top: 18px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          background: rgba(0,0,0,.18);
          border: 1px solid rgba(255,255,255,.12);
          padding: 10px 12px;
          border-radius: 12px;
          backdrop-filter: blur(8px);
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #ffd0db;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(255, 208, 219, 0.14);
        }

        /* FORM TEXT */
        .h2 {
          color: white;
          font-size: 32px;
          font-weight: 950;
          margin: 0 0 8px 0;
          letter-spacing: -0.6px;
        }

        .p {
          color: rgba(255,255,255,.8);
          margin: 0 0 18px 0;
          line-height: 1.6;
          font-size: 14px;
        }

        .error {
          background: rgba(255,0,0,.10);
          border: 1px solid rgba(255,0,0,.22);
          padding: 10px 12px;
          border-radius: 10px;
          margin-bottom: 10px;
          color: #ffd1d1;
          font-weight: 700;
          font-size: 13px;
        }

        .inputWrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 10px;
          transition: transform .12s ease, background .12s ease, border-color .12s ease;
          backdrop-filter: blur(8px);
        }

        .inputWrap:focus-within {
          background: rgba(255,255,255,.12);
          border-color: rgba(255,255,255,.22);
          transform: translateY(-1px);
        }

        .icon {
          color: rgba(255,255,255,.9);
          font-size: 14px;
        }

        .inputWrap input {
          border: none;
          background: none;
          outline: none;
          color: white;
          width: 100%;
          font-size: 15px;
        }

        .btnPrimary {
          width: 100%;
          padding: 10px 12px;
          border: none;
          border-radius: 12px;
          font-weight: 900;
          cursor: pointer;
          background: linear-gradient(90deg, #ffd0db, #ff9fb3);
          color: #2b0c16;
          margin-top: 6px;
          box-shadow: 0 10px 22px rgba(0,0,0,.24);
          transition: transform .12s ease, filter .12s ease;
        }

        .btnPrimary:hover { transform: translateY(-1px); filter: brightness(1.02); }
        .btnPrimary:disabled { opacity: .6; cursor: not-allowed; }

        .btnSecondary {
          width: 100%;
          margin-top: 8px;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.06);
          color: white;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform .12s ease, background .12s ease;
          backdrop-filter: blur(8px);
        }

        .btnSecondary:hover { transform: translateY(-1px); background: rgba(255,255,255,.12); }
        .btnSecondary:disabled { opacity: .6; cursor: not-allowed; }

        .btnGhost {
          width: 100%;
          margin-top: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(0,0,0,.16);
          color: white;
          cursor: pointer;
          transition: transform .12s ease, background .12s ease;
          backdrop-filter: blur(8px);
        }

        .btnGhost:hover { transform: translateY(-1px); background: rgba(0,0,0,.22); }

        .row {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          gap: 12px;
        }

        .btnLink {
          background: none;
          border: none;
          color: rgba(255,255,255,.9);
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 0;
        }

        .btnLink:hover { color: #fff; text-decoration: underline; }

        .spinner {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 3px solid rgba(0,0,0,.20);
          border-top: 3px solid rgba(0,0,0,.60);
          animation: spin .9s linear infinite;
          display: inline-block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
            gap: 50px;
            padding: 18px;
          }

          .rightForm {
            justify-content: flex-start;
          }

          .title {
            font-size: 32px;
          }
        }
      `}</style>
    </>
  );
}