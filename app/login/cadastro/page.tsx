"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaUser,
  FaPhoneAlt,
  FaIdCard,
  FaCheckCircle,
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

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7
    )}-${numeros.slice(7)}`;
  }

  function formatarCpf(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 3) return numeros;

    if (numeros.length <= 6) {
      return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    }

    if (numeros.length <= 9) {
      return `${numeros.slice(0, 3)}.${numeros.slice(
        3,
        6
      )}.${numeros.slice(6)}`;
    }

    return `${numeros.slice(0, 3)}.${numeros.slice(
      3,
      6
    )}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
  }

  async function handleCadastro(e: FormEvent<HTMLFormElement>) {
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

      const response = await api.post<CadastroResponse>(
        "/criarusuarios",
        {
          nome: nome.trim(),
          email: email.trim(),
          senha: senha.trim(),
          telefone: telefone.trim() || null,
          cpf: cpf.trim() || null,
          nivel_id: 3,
          status_id: 1,
        }
      );

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
        <div className="overlay" />

        <div className="bg-circle circle-1" />
        <div className="bg-circle circle-2" />
        <div className="bg-circle circle-3" />

        <section className="container">
          <div className="left-side">
            <div className="brand-badge">
              <FaShieldAlt />
              Área de cadastro
            </div>

            <h1>Crie sua conta</h1>

            <p>
              Faça seu cadastro para acompanhar pedidos, salvar produtos e ter
              uma experiência mais rápida e segura em nossa loja.
            </p>

            <div className="features">
              <div className="feature">
                <FaCheckCircle />
                Compra rápida
              </div>

              <div className="feature">
                <FaCheckCircle />
                Ambiente seguro
              </div>

              <div className="feature">
                <FaCheckCircle />
                Atendimento premium
              </div>
            </div>
          </div>

          <div className="right-side">
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

              <span className="badge">Nova conta</span>

              <h2>Cadastro</h2>

              <p className="subtitle">
                Preencha os dados abaixo para continuar.
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
                        onChange={(e) =>
                          setTelefone(formatarTelefone(e.target.value))
                        }
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
                    <label htmlFor="confirmarSenha">
                      Confirmar senha
                    </label>

                    <div className="input-wrapper">
                      <span className="input-icon">
                        <FaLock />
                      </span>

                      <input
                        id="confirmarSenha"
                        type="password"
                        placeholder="Confirme sua senha"
                        value={confirmarSenha}
                        onChange={(e) =>
                          setConfirmarSenha(e.target.value)
                        }
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-cadastro"
                  disabled={loading}
                >
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
          </div>
        </section>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="light"
        />
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
          background: linear-gradient(
            135deg,
            #f8efec 0%,
            #fffaf7 45%,
            #f7ebe8 100%
          );
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(183, 110, 121, 0.08);
          backdrop-filter: blur(4px);
        }

        .bg-circle {
          position: absolute;
          border-radius: 999px;
          filter: blur(12px);
          opacity: 0.18;
          pointer-events: none;
        }

        .circle-1 {
          width: 320px;
          height: 320px;
          background: rgba(183, 110, 121, 0.24);
          top: -90px;
          left: -90px;
        }

        .circle-2 {
          width: 420px;
          height: 420px;
          background: rgba(183, 110, 121, 0.12);
          bottom: -140px;
          right: -120px;
        }

        .circle-3 {
          width: 240px;
          height: 240px;
          background: rgba(255, 255, 255, 0.28);
          top: 18%;
          right: 10%;
        }

        .container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1120px;
          display: grid;
          grid-template-columns: 0.9fr 560px;
          align-items: center;
          gap: 42px;
        }

        .left-side {
          color: #6d4c52;
          max-width: 480px;
        }

        .brand-badge {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(255, 250, 247, 0.76);
          border: 1px solid rgba(183, 110, 121, 0.12);
          backdrop-filter: blur(10px);
          margin-bottom: 28px;
          font-size: 13px;
          font-weight: 700;
          color: #8b4d59;
        }

        .left-side h1 {
          margin: 0 0 18px;
          font-size: 56px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.05em;
          max-width: 420px;
          color: #6d4c52;
        }

        .left-side p {
          max-width: 430px;
          margin: 0;
          color: #8b6b70;
          font-size: 15px;
          line-height: 1.8;
        }

        .features {
          margin-top: 30px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 15px;
          border-radius: 16px;
          background: rgba(255, 250, 247, 0.76);
          border: 1px solid rgba(183, 110, 121, 0.1);
          backdrop-filter: blur(10px);
          font-size: 13px;
          font-weight: 600;
          color: #6d4c52;
        }

        .right-side {
          display: flex;
          justify-content: center;
        }

        .card {
          width: 100%;
          max-width: 560px;
          background: rgba(255, 250, 247, 0.98);
          border-radius: 30px;
          padding: 28px 28px 24px;
          box-shadow: 0 24px 60px rgba(183, 110, 121, 0.14);
          border: 1px solid rgba(183, 110, 121, 0.08);
          backdrop-filter: blur(14px);
        }

        .top-line {
          width: 76px;
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
          transition: 0.2s ease;
        }

        .back-button:hover {
          opacity: 0.8;
        }

        .icon-brand {
          width: 74px;
          height: 74px;
          margin: 0 auto 16px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #fffaf7;
          background: linear-gradient(135deg, #b76e79 0%, #9d5c67 100%);
          box-shadow: 0 18px 38px rgba(183, 110, 121, 0.2);
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

        h2 {
          margin: 0 0 8px;
          text-align: center;
          font-size: 32px;
          font-weight: 800;
          color: #6d4c52;
        }

        .subtitle {
          margin: 0 auto 24px;
          max-width: 400px;
          text-align: center;
          color: #8b6b70;
          font-size: 14px;
          line-height: 1.7;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .grid-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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
          font-size: 14px;
        }

        .input-group input {
          width: 100%;
          height: 52px;
          border-radius: 14px;
          border: 1px solid #ecd7d3;
          background: #fff;
          padding: 0 16px 0 46px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          color: #2f1f22;
        }

        .input-group input:focus {
          border-color: #b76e79;
          box-shadow: 0 0 0 4px rgba(183, 110, 121, 0.12);
        }

        .btn-cadastro,
        .btn-voltar-login {
          height: 52px;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cadastro {
          background: linear-gradient(
            135deg,
            #b76e79 0%,
            #9d5c67 100%
          );
          color: #fffaf7;
          box-shadow: 0 18px 38px rgba(183, 110, 121, 0.18);
        }

        .btn-cadastro:hover {
          transform: translateY(-1px);
          box-shadow: 0 22px 46px rgba(183, 110, 121, 0.24);
        }

        .btn-voltar-login {
          background: #f4e8e4;
          color: #6d4c52;
        }

        .btn-voltar-login:hover {
          background: #ecd9d4;
        }

        .btn-cadastro:disabled,
        .btn-voltar-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .container {
            grid-template-columns: 1fr;
            gap: 34px;
            max-width: 650px;
          }

          .left-side {
            text-align: center;
            max-width: 100%;
          }

          .brand-badge {
            margin-left: auto;
            margin-right: auto;
          }

          .left-side h1 {
            font-size: 46px;
            max-width: 100%;
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

          .card {
            max-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .cadastro-page {
            padding: 18px;
          }

          .left-side h1 {
            font-size: 36px;
          }

          .left-side p {
            font-size: 14px;
            line-height: 1.7;
          }

          .card {
            padding: 26px 20px 22px;
            border-radius: 24px;
          }

          h2 {
            font-size: 28px;
          }

          .grid-two {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .btn-cadastro,
          .btn-voltar-login {
            height: 50px;
          }

          .feature {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .left-side h1 {
            font-size: 30px;
          }

          .card {
            padding: 24px 16px 20px;
          }

          .icon-brand {
            width: 66px;
            height: 66px;
            font-size: 24px;
          }

          .input-group input {
            height: 50px;
            font-size: 14px;
          }
        }

        @supports (padding: max(0px)) {
          .cadastro-page {
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