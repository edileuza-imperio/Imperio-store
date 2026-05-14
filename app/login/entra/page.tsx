"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaKey,
  FaBackspace,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/Api/conectar";

type ApiPayload = {
  mensagem?: string;
  etapa2?: boolean;
  usuario_id?: number;
  id_usuario?: number;
  acao?: string;
  usuario?: unknown;
};

type LoginResponse = {
  status?: number;
  mensagem?: string;
  dados?: ApiPayload;
  etapa2?: boolean;
  usuario_id?: number;
  id_usuario?: number;
  acao?: string;
  usuario?: unknown;
};

export default function EntrarPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [pin, setPin] = useState("");
  const [usuarioIdPin, setUsuarioIdPin] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const [mostrarModalPin, setMostrarModalPin] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      toast.warning("Informe o e-mail.");
      return;
    }

    if (!senha.trim()) {
      toast.warning("Informe a senha.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post<LoginResponse>("/login", {
        email: email.trim(),
        senha: senha.trim(),
      });

      const body = response.data;
      const dados = body?.dados;

      const etapa2 =
        body?.etapa2 === true ||
        dados?.etapa2 === true ||
        body?.acao === "pedir_pin" ||
        dados?.acao === "pedir_pin";

      const usuarioId =
        body?.usuario_id ??
        dados?.usuario_id ??
        body?.id_usuario ??
        dados?.id_usuario ??
        null;

      const mensagem =
        dados?.mensagem ||
        body?.mensagem ||
        "Operação realizada com sucesso.";

      if (etapa2) {
        if (!usuarioId) {
          toast.error(
            "Não foi possível identificar o usuário para validar o PIN."
          );
          return;
        }

        setUsuarioIdPin(Number(usuarioId));
        setPin("");
        setMostrarModalPin(true);
        toast.info(mensagem);
        return;
      }

      toast.success(mensagem);
      router.push("/");
    } catch (error: any) {
      console.error("ERRO LOGIN =>", error?.response?.data || error);

      const mensagem =
        error?.response?.data?.dados?.mensagem ||
        error?.response?.data?.mensagem ||
        "Não foi possível realizar o login.";

      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  }

  async function confirmarPin() {
    if (!usuarioIdPin) {
      toast.error("Usuário da etapa 2 não encontrado.");
      return;
    }

    if (!pin.trim()) {
      toast.warning("Informe o PIN.");
      return;
    }

    try {
      setLoadingPin(true);

      const response = await api.post<LoginResponse>("/login2", {
        usuario_id: usuarioIdPin,
        pin: pin.trim(),
      });

      const body = response.data;
      const dados = body?.dados;

      const mensagem =
        dados?.mensagem ||
        body?.mensagem ||
        "Login realizado com sucesso.";

      toast.success(mensagem);
      setMostrarModalPin(false);
      setPin("");
      setUsuarioIdPin(null);

      router.push("/");
    } catch (error: any) {
      console.error("ERRO LOGIN2 =>", error?.response?.data || error);

      const mensagem =
        error?.response?.data?.dados?.mensagem ||
        error?.response?.data?.mensagem ||
        "Não foi possível validar o PIN.";

      toast.error(mensagem);
    } finally {
      setLoadingPin(false);
    }
  }

  function adicionarNumero(valor: string) {
    if (pin.length >= 6) return;
    setPin((prev) => prev + valor);
  }

  function apagarNumero() {
    setPin((prev) => prev.slice(0, -1));
  }

  function limparPin() {
    setPin("");
  }

  return (
    <>
      <main className="login-page">
        <div className="overlay" />
        <div className="bg-circle circle-1" />
        <div className="bg-circle circle-2" />
        <div className="bg-circle circle-3" />

        <section className="container">
          <div className="left-side">
            <div className="brand-badge">
              <FaShieldAlt />
              Acesso seguro
            </div>

            <h1>Login</h1>

            <p>
              Entre com seu e-mail e senha para acessar sua conta e continuar
              sua experiência de compra.
            </p>

            <div className="features">
              <div className="feature">Compra segura</div>
              <div className="feature">Acesso rápido</div>
              <div className="feature">Atendimento premium</div>
            </div>
          </div>

          <div className="right-side">
            <div className="card">
              <div className="top-line" />

              <button
                type="button"
                className="back-button"
                onClick={() => router.push("/login")}
              >
                <FaArrowLeft />
                <span>Voltar</span>
              </button>

              <div className="icon-brand">
                <FaShieldAlt />
              </div>

              <span className="badge">Bem-vindo de volta</span>

              <p className="subtitle">
                Informe seus dados para entrar na sua conta.
              </p>

              <form onSubmit={handleLogin} className="form">
                <div className="input-group">
                  <label htmlFor="email">E-mail</label>

                  <div className="input-wrapper">
                    <span className="input-icon">
                      <FaEnvelope />
                    </span>

                    <input
                      id="email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="senha">Senha</label>

                  <div className="input-wrapper">
                    <span className="input-icon">
                      <FaLock />
                    </span>

                    <input
                      id="senha"
                      type="password"
                      placeholder="Digite sua senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? "Validando..." : "Continuar"}
                </button>
              </form>
            </div>
          </div>
        </section>

        {mostrarModalPin && (
          <div className="modal-overlay">
            <div className="modal-pin">
              <div className="modal-icon">
                <FaKey />
              </div>

              <h2>PIN de acesso</h2>
              <p className="modal-text">
                Digite o PIN para concluir o login.
              </p>

              <div className="pin-display">
                {Array.from({ length: 6 }).map((_, index) => (
                  <span
                    key={index}
                    className={pin[index] ? "dot active" : "dot"}
                  >
                    {pin[index] ? "•" : ""}
                  </span>
                ))}
              </div>

              <div className="keypad">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                  (numero) => (
                    <button
                      key={numero}
                      type="button"
                      className="key"
                      onClick={() => adicionarNumero(numero)}
                      disabled={loadingPin}
                    >
                      {numero}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="key key-action"
                  onClick={limparPin}
                  disabled={loadingPin}
                >
                  C
                </button>

                <button
                  type="button"
                  className="key"
                  onClick={() => adicionarNumero("0")}
                  disabled={loadingPin}
                >
                  0
                </button>

                <button
                  type="button"
                  className="key key-action"
                  onClick={apagarNumero}
                  disabled={loadingPin}
                >
                  <FaBackspace />
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => {
                    setMostrarModalPin(false);
                    setPin("");
                    setUsuarioIdPin(null);
                  }}
                  disabled={loadingPin}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn-confirmar"
                  onClick={confirmarPin}
                  disabled={loadingPin}
                >
                  {loadingPin ? "Validando..." : "Confirmar PIN"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={3000} theme="light" />
      </main>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
          background: linear-gradient(
            135deg,
            #f7ebe8 0%,
            #f5efe8 50%,
            #fffaf7 100%
          );
        }

        .overlay {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(4px);
          background: rgba(183, 110, 121, 0.14);
        }

        .bg-circle {
          position: absolute;
          border-radius: 999px;
          filter: blur(10px);
          opacity: 0.18;
          pointer-events: none;
        }

        .circle-1 {
          width: 320px;
          height: 320px;
          background: rgba(183, 110, 121, 0.24);
          top: -90px;
          left: -80px;
        }

        .circle-2 {
          width: 420px;
          height: 420px;
          background: rgba(109, 76, 82, 0.12);
          bottom: -140px;
          right: -120px;
        }

        .circle-3 {
          width: 220px;
          height: 220px;
          background: rgba(255, 255, 255, 0.24);
          top: 18%;
          right: 12%;
        }

        .container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1280px;
          display: grid;
          grid-template-columns: 1.1fr 460px;
          align-items: center;
          gap: 60px;
        }

        .left-side {
          color: #6d4c52;
        }

        .brand-badge {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(255, 250, 247, 0.74);
          border: 1px solid rgba(183, 110, 121, 0.14);
          margin-bottom: 28px;
          font-size: 13px;
          font-weight: 700;
          backdrop-filter: blur(12px);
          color: #8b4d59;
        }

        .left-side h1 {
          margin: 0 0 20px;
          font-size: 72px;
          line-height: 0.95;
          font-weight: 900;
          letter-spacing: -0.05em;
          max-width: 700px;
          color: #6d4c52;
        }

        .left-side p {
          max-width: 560px;
          margin: 0;
          color: #8b6b70;
          font-size: 18px;
          line-height: 1.8;
        }

        .features {
          margin-top: 40px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: 18px;
          background: rgba(255, 250, 247, 0.76);
          border: 1px solid rgba(183, 110, 121, 0.1);
          backdrop-filter: blur(10px);
          font-size: 14px;
          font-weight: 600;
          color: #6d4c52;
        }

        .right-side {
          display: flex;
          justify-content: center;
        }

        .card {
          width: 100%;
          background: rgba(255, 250, 247, 0.98);
          border-radius: 36px;
          padding: 34px 34px 30px;
          box-shadow: 0 30px 80px rgba(183, 110, 121, 0.18);
          border: 1px solid rgba(183, 110, 121, 0.08);
          backdrop-filter: blur(14px);
        }

        .top-line {
          width: 82px;
          height: 6px;
          border-radius: 999px;
          margin: 0 auto 22px;
          background: linear-gradient(135deg, #b76e79, #d6b7a6);
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: transparent;
          color: #8b6b70;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 18px;
          padding: 0;
        }

        .icon-brand,
        .modal-icon {
          width: 76px;
          height: 76px;
          margin: 0 auto 16px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          color: #fffaf7;
          background: linear-gradient(135deg, #b76e79 0%, #9d5c67 100%);
          box-shadow: 0 16px 30px rgba(183, 110, 121, 0.24);
        }

        .badge {
          display: table;
          margin: 0 auto 14px;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(183, 110, 121, 0.12);
          color: #8b4d59;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        h1,
        .modal-pin h2 {
          margin: 0 0 10px;
          text-align: center;
          font-size: 38px;
          font-weight: 800;
          color: #6d4c52;
        }

        .subtitle,
        .modal-text {
          margin: 0 auto 28px;
          max-width: 390px;
          text-align: center;
          color: #8b6b70;
          font-size: 15px;
          line-height: 1.75;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 14px;
          font-weight: 700;
          color: #6d4c52;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #b76e79;
        }

        .input-group input {
          width: 100%;
          height: 56px;
          border-radius: 16px;
          border: 1px solid #ecd7d3;
          background: #fff;
          padding: 0 16px 0 46px;
          font-size: 15px;
          outline: none;
          color: #2f1f22;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input-group input:focus {
          border-color: #b76e79;
          box-shadow: 0 0 0 4px rgba(183, 110, 121, 0.12);
        }

        .btn-login,
        .btn-confirmar,
        .btn-cancelar {
          height: 56px;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .btn-login,
        .btn-confirmar {
          background: linear-gradient(135deg, #b76e79 0%, #9d5c67 100%);
          color: #fffaf7;
          box-shadow: 0 18px 40px rgba(183, 110, 121, 0.22);
        }

        .btn-login:hover,
        .btn-confirmar:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 48px rgba(183, 110, 121, 0.28);
        }

        .btn-login:disabled,
        .btn-confirmar:disabled,
        .btn-cancelar:disabled,
        .key:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-cancelar {
          background: #f3e9e6;
          color: #6d4c52;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.48);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 50;
        }

        .modal-pin {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 250, 247, 0.98);
          border-radius: 28px;
          padding: 28px 24px 24px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
          text-align: center;
          border: 1px solid rgba(183, 110, 121, 0.08);
        }

        .pin-display {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 22px;
        }

        .dot {
          width: 42px;
          height: 50px;
          border-radius: 14px;
          border: 1px solid #ecd7d3;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          color: #6d4c52;
        }

        .dot.active {
          border-color: #b76e79;
          background: #fff4f2;
        }

        .keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .key {
          height: 58px;
          border: none;
          border-radius: 16px;
          background: #f3e9e6;
          color: #6d4c52;
          font-size: 20px;
          font-weight: 800;
          cursor: pointer;
        }

        .key-action {
          background: #ecd7d3;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        @media (max-width: 1100px) {
          .container {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .left-side {
            text-align: center;
          }

          .brand-badge {
            margin-left: auto;
            margin-right: auto;
          }

          .left-side h1 {
            font-size: 54px;
            margin-left: auto;
            margin-right: auto;
          }

          .left-side p {
            margin-left: auto;
            margin-right: auto;
          }

          .features {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .login-page {
            padding: 18px;
          }

          .container {
            gap: 28px;
          }

          .left-side h1 {
            font-size: 40px;
          }

          .left-side p {
            font-size: 15px;
            line-height: 1.7;
          }

          .card {
            padding: 32px 22px;
            border-radius: 28px;
          }

          .icon-brand,
          .modal-icon {
            width: 68px;
            height: 68px;
            font-size: 26px;
          }

          .card h2,
          .modal-pin h2 {
            font-size: 30px;
          }

          .btn-login,
          .btn-register,
          .btn-confirmar,
          .btn-cancelar {
            height: 54px;
            border-radius: 16px;
          }

          .features {
            gap: 12px;
          }

          .feature {
            width: 100%;
            justify-content: center;
          }

          .modal-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .left-side h1 {
            font-size: 32px;
          }

          .card {
            padding: 28px 18px;
          }

          .dot {
            width: 38px;
            height: 46px;
          }

          .key {
            height: 54px;
            border-radius: 14px;
          }
        }

        @supports (padding: max(0px)) {
          .login-page {
            padding-left: max(18px, env(safe-area-inset-left));
            padding-right: max(18px, env(safe-area-inset-right));
            padding-top: max(18px, env(safe-area-inset-top));
            padding-bottom: max(18px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
}