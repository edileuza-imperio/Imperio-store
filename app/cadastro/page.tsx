"use client";

import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhoneAlt,
  FaIdCard,
  FaArrowLeft,
} from "react-icons/fa";
import api from "@/Api/conectar";
import { useRouter } from "next/navigation";
import { rotas } from "@/components/Bibioteca/config/rotas"; // ✅ rotas centralizadas

type LoginConfig = {
  fundo?: string;
  logo?: string;
  titulo?: string;
  mensagem_personalizada?: string;
};

export default function CadastroPage() {
  const router = useRouter();

  const [config, setConfig] = useState<LoginConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");

  const [loadingBtn, setLoadingBtn] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // ✅ CORRIGIDO: configLogin está na raiz do rotas.ts
        const res = await api.get(rotas.configLogin, {
          withCredentials: true,
        });

        /**
         * /configuracoes/login (LoginController@loginAtiva)
         * retorna 1 objeto (não um array).
         */
        setConfig(res.data?.dados ?? null);
      } catch {
        setConfig({
          fundo: "#7b1e3a",
          titulo: "Império Loja",
          mensagem_personalizada: "Crie sua conta para continuar.",
          logo: "",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const theme = useMemo(() => {
    const base = config?.fundo || "#7b1e3a";
    return { base };
  }, [config?.fundo]);

  const titulo = config?.titulo || "Criar conta";
  const mensagem =
    config?.mensagem_personalizada || "Preencha os dados para criar seu acesso.";
  const logo = config?.logo || "";

  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  const formatCPF = (v: string) => {
    const d = onlyDigits(v).slice(0, 11);
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    const p4 = d.slice(9, 11);
    if (d.length <= 3) return p1;
    if (d.length <= 6) return `${p1}.${p2}`;
    if (d.length <= 9) return `${p1}.${p2}.${p3}`;
    return `${p1}.${p2}.${p3}-${p4}`;
  };

  const formatTelefone = (v: string) => {
    const d = onlyDigits(v).slice(0, 11);
    const ddd = d.slice(0, 2);
    const n1 = d.slice(2, 7);
    const n2 = d.slice(7, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${ddd}`;
    if (d.length <= 7) return `(${ddd}) ${n1}`;
    return `(${ddd}) ${n1}-${n2}`;
  };

  const isValidEmail = (v: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  };

  const handleCadastro = async () => {
    const nomeTrim = nome.trim();
    const emailTrim = email.trim().toLowerCase();

    if (!nomeTrim || !emailTrim || !senha || !senha2) {
      toast.error("Preencha nome, email e senha.");
      return;
    }

    if (!isValidEmail(emailTrim)) {
      toast.error("E-mail inválido.");
      return;
    }

    if (senha.length < 6) {
      toast.error("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }

    if (senha !== senha2) {
      toast.error("As senhas não conferem.");
      return;
    }

    const cpfDigits = onlyDigits(cpf);
    const telDigits = onlyDigits(telefone);

    if (cpfDigits && cpfDigits.length !== 11) {
      toast.error("CPF inválido (precisa ter 11 dígitos).");
      return;
    }

    if (telDigits && (telDigits.length < 10 || telDigits.length > 11)) {
      toast.error("Telefone inválido (DDD + número).");
      return;
    }

    setLoadingBtn(true);
    try {
      // ✅ mantém como está (usuário sistema)
      await api.post(
        rotas.usuariosSistema.criar,
        {
          nome: nomeTrim,
          email: emailTrim,
          senha,
          telefone: telDigits || null,
          cpf: cpfDigits || null,
          nivelid: 3,
        },
        { withCredentials: true }
      );

      toast.success("Cadastro realizado! Agora faça login.");
      router.push(rotas.paginas.login);
    } catch (err: any) {
      toast.error(err?.response?.data?.mensagem || "Erro ao cadastrar.");
    } finally {
      setLoadingBtn(false);
    }
  };

  if (loading) return <p className="loading">Carregando...</p>;

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />

      <div className="page" style={{ background: theme.base }}>
        <div className="overlay" />

        <div className="shell">
          {/* ESQUERDA */}
          <div className="left">
            <div className="panel">
              <h2 className="h2">Cadastro</h2>
              <p className="p">Crie sua conta para continuar.</p>

              <div className="inputWrap">
                <span className="icon">
                  <FaUser />
                </span>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="inputWrap">
                <span className="icon">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="inputWrap">
                <span className="icon">
                  <FaPhoneAlt />
                </span>
                <input
                  type="tel"
                  placeholder="Telefone (DDD + número)"
                  value={telefone}
                  onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              <div className="inputWrap">
                <span className="icon">
                  <FaIdCard />
                </span>
                <input
                  type="text"
                  placeholder="CPF"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  inputMode="numeric"
                  autoComplete="off"
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
                  autoComplete="new-password"
                />
              </div>

              <div className="inputWrap">
                <span className="icon">
                  <FaLock />
                </span>
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={senha2}
                  onChange={(e) => setSenha2(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button
                className="btnPrimary"
                onClick={handleCadastro}
                disabled={loadingBtn}
                type="button"
              >
                {loadingBtn ? <span className="spinner" /> : "Cadastrar"}
              </button>

              <button
                className="btnGhost"
                type="button"
                onClick={() => router.push(rotas.paginas.login)}
                disabled={loadingBtn}
              >
                <FaArrowLeft />
                Voltar para login
              </button>

              <div className="hint">
                <span>Nível do cadastro:</span> <b>3</b>
              </div>
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
          background: radial-gradient(
              circle at 18% 12%,
              rgba(255, 190, 205, 0.22),
              transparent 55%
            ),
            radial-gradient(
              circle at 85% 85%,
              rgba(255, 140, 165, 0.18),
              transparent 50%
            ),
            radial-gradient(
              circle at 50% 50%,
              rgba(255, 255, 255, 0.08),
              transparent 60%
            );
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
          background: rgba(0, 0, 0, 0.1);
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
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.12),
            rgba(255, 255, 255, 0.04)
          );
        }

        .panel {
          width: min(420px, 100%);
        }

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
          margin-top: 6px;
        }

        .btnPrimary:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
        }
        .btnPrimary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

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
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
        }

        .btnGhost:hover {
          background: rgba(0, 0, 0, 0.18);
          transform: translateY(-1px);
        }

        .spinner {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 3px solid rgba(0, 0, 0, 0.18);
          border-top: 3px solid rgba(0, 0, 0, 0.55);
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

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
          margin-top: 14px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.75);
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
        }
        .hint b {
          color: rgba(255, 255, 255, 0.95);
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