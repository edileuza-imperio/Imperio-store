"use client";

import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUser, FaLock, FaKey, FaEnvelope, FaPhone } from "react-icons/fa";
import { useLoginConfig } from "@/hooks/useLoginConfig";
import api from "@/Api/conectar";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [pin, setPin] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");

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

  const handleCadastro = async () => {
    try {
      const res = await api.post("/usuarios", {
        nome,
        email,
        senha,
        telefone,
        cpf,
      });

      if (res.status === 201 || res.status === 200) {
        alert("Usuário criado com sucesso!");
        setStep("login");
      } else {
        alert(res.data.mensagem || "Erro ao criar usuário.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.mensagem || "Erro de conexão.");
    }
  };

  if (loading)
    return <p className="text-white text-center mt-5">Carregando...</p>;

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />

      <div className="login-bg">
        {/* PASSO INICIAL */}
        {step === "inicio" && (
          <div className="login-container">
            <img src={config?.logo} alt="Logo" className="logo-login" />
            <h1>{config?.titulo}</h1>
            {config?.mensagem_personalizada && (
              <p className="message">{config.mensagem_personalizada}</p>
            )}
            <button
              className="btn-primary"
              onClick={() => setStep("login")}
              disabled={loadingBtn}
            >
              Entrar
            </button>
            <button className="voltar" onClick={() => setStep("cadastro")}>
              Criar conta
            </button>
          </div>
        )}

        {/* LOGIN */}
        {step === "login" && (
          <div className="login-container">
            <img src={config?.logo} alt="Logo" className="logo-login" />
            <h1>Login</h1>
            {errorMsg && <p className="error-msg">{errorMsg}</p>}

            <div className="input-wrapper">
              <div className="input-icon">
                <FaUser />
              </div>
              <input
                type="text"
                placeholder="Usuário ou Email"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>

            <div className="input-wrapper">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <button
              className="btn-primary"
              onClick={() => handleLogin(usuario, senha)}
              disabled={loadingBtn}
            >
              {loadingBtn ? <div className="spinner"></div> : "Entrar"}
            </button>

            <div className="links">
              <a href="#">Esqueci minha senha</a>
              <button className="voltar" onClick={() => setStep("cadastro")}>
                Criar conta
              </button>
            </div>
          </div>
        )}

        {/* PIN */}
        {step === "pin" && (
          <div className="login-container">
            <img src={config?.logo} alt="Logo" className="logo-login" />
            <h1>Digite o PIN</h1>
            {errorMsg && <p className="error-msg">{errorMsg}</p>}

            <div className="input-wrapper">
              <div className="input-icon">
                <FaKey />
              </div>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
              />
            </div>

            <button
              className="btn-primary"
              onClick={() => handleValidarPin(pin)}
              disabled={pin.length < 4 || loadingBtn}
            >
              {loadingBtn ? <div className="spinner"></div> : "Validar PIN"}
            </button>

            <button className="voltar" onClick={() => setStep("login")}>
              Voltar
            </button>
          </div>
        )}

        {/* CADASTRO */}
        {step === "cadastro" && (
          <div className="login-container">
            <img src={config?.logo} alt="Logo" className="logo-login" />
            <h1>Criar Conta</h1>
            {errorMsg && <p className="error-msg">{errorMsg}</p>}

            <div className="input-wrapper">
              <div className="input-icon">
                <FaUser />
              </div>
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="input-wrapper">
              <div className="input-icon">
                <FaEnvelope />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-wrapper">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className="input-wrapper">
              <div className="input-icon">
                <FaPhone />
              </div>
              <input
                type="text"
                placeholder="Telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div className="input-wrapper">
              <div className="input-icon">
                <FaKey />
              </div>
              <input
                type="text"
                placeholder="CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>

            <button
              className="btn-primary"
              onClick={handleCadastro}
              disabled={loadingBtn}
            >
              {loadingBtn ? <div className="spinner"></div> : "Criar Conta"}
            </button>

            <button className="voltar" onClick={() => setStep("login")}>
              Voltar
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ====== MESMO CSS QUE VOCÊ JÁ TINHA ====== */
        html,
        body,
        .login-bg {
          margin: 0;
          padding: 0;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          font-family: "Segoe UI", sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: ${config?.fundo || "#000"};
          position: relative;
        }

        .login-bg::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(
              circle at 25% 25%,
              rgba(255, 90, 95, 0.06),
              transparent 70%
            ),
            radial-gradient(
              circle at 75% 75%,
              rgba(255, 190, 0, 0.04),
              transparent 70%
            );
          animation: animateBackground 25s linear infinite;
          z-index: 0;
        }

        @keyframes animateBackground {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.05);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }

        .login-container {
          position: relative;
          z-index: 1;
          max-width: 400px;
          width: 90%;
          padding: 50px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #fff;
          backdrop-filter: blur(22px);
          border-radius: 22px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
          background: rgba(0, 0, 0, 0.35);
          animation: fadeIn 0.8s ease-in-out;
        }

        .logo-login {
          width: 140px;
          margin-bottom: 25px;
          animation: fadeInDown 1s ease-out;
        }

        h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 15px;
          background: linear-gradient(90deg, #d36f92, #2f3c95);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .input-wrapper {
          width: 100%;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #333;
          border-radius: 12px;
          padding: 0 12px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }

        .input-wrapper:focus-within {
          border-color: #6c63ff;
          background: rgba(255, 255, 255, 0.12);
        }

        .input-icon {
          color: #aaa;
          font-size: 1.2rem;
          margin-right: 10px;
          display: flex;
          align-items: center;
        }

        .input-wrapper input {
          flex: 1;
          padding: 12px 0;
          border: none;
          outline: none;
          background: transparent;
          color: #fff;
          font-size: 1rem;
        }

        .input-wrapper input::placeholder {
          color: #aaa;
        }

        .btn-primary {
          width: 100%;
          padding: 14px;
          font-size: 1.1rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          background: linear-gradient(90deg, #d36f92, #2f3c95);
          color: #fff;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.6);
        }

        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #fff;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        .links {
          margin-top: 15px;
          display: flex;
          justify-content: space-between;
          width: 100%;
        }

        .links a,
        .voltar {
          color: #aaa;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.2s ease;
          background: none;
          border: none;
        }

        .links a:hover,
        .voltar:hover {
          color: #fff;
        }

        .error-msg {
          color: #ff6b6b;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .voltar {
          margin-top: 10px;
          border: 1px solid #fff;
          color: #fff;
          border-radius: 8px;
          padding: 10px 0;
          cursor: pointer;
          width: 100%;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .login-container {
            padding: 40px 25px;
          }
          h1 {
            font-size: 1.8rem;
          }
        }
        @media (max-width: 480px) {
          .login-container {
            padding: 35px 20px;
          }
          h1 {
            font-size: 1.6rem;
          }
          .links {
            flex-direction: column;
            gap: 10px;
            align-items: center;
          }
        }
      `}</style>
    </>
  );
}
