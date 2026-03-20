"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaUser,
  FaPhoneAlt,
  FaIdCard,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/Api/conectar";

type CadastroResponse = {
  status?: number;
  mensagem?: string;
  dados?: {
    mensagem?: string;
  };
};

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  function formatarCpf(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    if (numeros.length <= 9) {
      return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
    }

    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
  }

  async function handleCadastro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nome.trim()) {
      toast.warning("Informe o nome.");
      return;
    }

    if (!email.trim()) {
      toast.warning("Informe o e-mail.");
      return;
    }

    if (!senha.trim()) {
      toast.warning("Informe a senha.");
      return;
    }

    if (senha.trim().length < 6) {
      toast.warning("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!confirmarSenha.trim()) {
      toast.warning("Confirme a senha.");
      return;
    }

    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post<CadastroResponse>("/criarusuarios", {
        nome: nome.trim(),
        email: email.trim(),
        senha: senha.trim(),
        telefone: telefone.trim() || null,
        cpf: cpf.trim() || null,
        nivel_id: 3,
        status_id: 1,
      });

      const mensagem =
        response?.data?.dados?.mensagem ||
        response?.data?.mensagem ||
        "Usuário cadastrado com sucesso.";

      toast.success(mensagem);

      setTimeout(() => {
        router.push("/login/entra");
      }, 1200);
    } catch (error: any) {
      console.error("ERRO CADASTRO =>", error?.response?.data || error);

      const mensagem =
        error?.response?.data?.dados?.mensagem ||
        error?.response?.data?.mensagem ||
        "Não foi possível realizar o cadastro.";

      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="cadastro-page">
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

          <span className="badge">Criar conta</span>

          <h1>Cadastro</h1>

          <p className="subtitle">
            Preencha os dados abaixo para criar sua conta na plataforma.
          </p>

          <form onSubmit={handleCadastro} className="form">
            <div className="input-group">
              <label htmlFor="nome">Nome completo</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <FaUser />
                </span>
                <input
                  id="nome"
                  type="text"
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="grid-two">
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
                <label htmlFor="telefone">Telefone</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <FaPhoneAlt />
                  </span>
                  <input
                    id="telefone"
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="cpf">CPF</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <FaIdCard />
                </span>
                <input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatarCpf(e.target.value))}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid-two">
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
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmarSenha">Confirmar senha</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <FaLock />
                  </span>
                  <input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Confirme sua senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-cadastro" disabled={loading}>
              {loading ? "Cadastrando..." : "Criar conta"}
            </button>

            <button
              type="button"
              className="btn-voltar-login"
              onClick={() => router.push("/login/entra")}
              disabled={loading}
            >
              Já tenho conta
            </button>
          </form>
        </section>

        <ToastContainer position="top-right" autoClose={3000} theme="light" />
      </main>

      <style jsx>{`
        .cadastro-page {
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
          max-width: 680px;
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

        .icon-brand {
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

        h1 {
          margin: 0 0 10px;
          text-align: center;
          font-size: 38px;
          font-weight: 800;
          color: #111827;
        }

        .subtitle {
          margin: 0 auto 28px;
          max-width: 460px;
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

        .grid-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
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
          transition: all 0.2s ease;
        }

        .input-group input:focus {
          border-color: #b76e79;
          box-shadow: 0 0 0 4px rgba(183, 110, 121, 0.12);
        }

        .btn-cadastro,
        .btn-voltar-login {
          height: 56px;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cadastro {
          background: linear-gradient(135deg, #b76e79 0%, #1f3a5f 100%);
          color: #fff;
        }

        .btn-cadastro:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(31, 58, 95, 0.18);
        }

        .btn-voltar-login {
          background: #f3f4f6;
          color: #111827;
        }

        .btn-voltar-login:hover {
          background: #e5e7eb;
        }

        @media (max-width: 720px) {
          .card {
            max-width: 100%;
            padding: 26px 20px 22px;
            border-radius: 24px;
          }

          h1 {
            font-size: 30px;
          }

          .grid-two {
            grid-template-columns: 1fr;
            gap: 18px;
          }
        }
      `}</style>
    </>
  );
}