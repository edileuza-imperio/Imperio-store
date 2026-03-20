"use client";

import { useState } from "react";
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

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
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

      console.log("RESPOSTA LOGIN =>", response.data);

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
          toast.error("Não foi possível identificar o usuário para validar o PIN.");
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

      console.log("RESPOSTA LOGIN2 =>", response.data);

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
        <div className="bg-circle circle-1" />
        <div className="bg-circle circle-2" />
        <div className="bg-circle circle-3" />

        <section className="card">
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

          <span className="badge">Acesso seguro</span>

          <h1>Login</h1>

          <p className="subtitle">
            Informe seu e-mail e senha para acessar a plataforma.
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
        </section>

        {mostrarModalPin && (
          <div className="modal-overlay">
            <div className="modal-pin">
              <div className="modal-icon">
                <FaKey />
              </div>

              <h2>PIN de acesso</h2>
              <p className="modal-text">Digite o PIN para concluir o login.</p>

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
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((numero) => (
                  <button
                    key={numero}
                    type="button"
                    className="key"
                    onClick={() => adicionarNumero(numero)}
                    disabled={loadingPin}
                  >
                    {numero}
                  </button>
                ))}

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
          background: linear-gradient(135deg, #b76e79 0%, #1f3a5f 100%);
        }

        .bg-circle {
          position: absolute;
          border-radius: 999px;
          filter: blur(10px);
          opacity: 0.22;
          pointer-events: none;
        }

        .circle-1 {
          width: 320px;
          height: 320px;
          background: rgba(255, 255, 255, 0.35);
          top: -90px;
          left: -80px;
        }

        .circle-2 {
          width: 420px;
          height: 420px;
          background: rgba(255, 255, 255, 0.18);
          bottom: -140px;
          right: -120px;
        }

        .circle-3 {
          width: 220px;
          height: 220px;
          background: rgba(255, 255, 255, 0.18);
          top: 18%;
          right: 12%;
        }

        .card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(14px);
          border-radius: 32px;
          padding: 34px 34px 30px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .top-line {
          width: 82px;
          height: 6px;
          border-radius: 999px;
          margin: 0 auto 22px;
          background: linear-gradient(135deg, #b76e79, #1f3a5f);
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: transparent;
          color: #4b5563;
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
          color: #fff;
          background: linear-gradient(135deg, #b76e79 0%, #1f3a5f 100%);
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
          color: #111827;
        }

        .subtitle,
        .modal-text {
          margin: 0 auto 28px;
          max-width: 390px;
          text-align: center;
          color: #4b5563;
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
          color: #1f2937;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #8b4d59;
        }

        .input-group input {
          width: 100%;
          height: 56px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 0 16px 0 46px;
          font-size: 15px;
          outline: none;
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
        }

        .btn-login,
        .btn-confirmar {
          background: linear-gradient(135deg, #b76e79 0%, #1f3a5f 100%);
          color: #fff;
        }

        .btn-cancelar {
          background: #f3f4f6;
          color: #111827;
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
          background: #fff;
          border-radius: 28px;
          padding: 28px 24px 24px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
          text-align: center;
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
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          color: #111827;
        }

        .dot.active {
          border-color: #b76e79;
          background: #fff7f8;
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
          background: #f3f4f6;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }
      `}</style>
    </>
  );
}