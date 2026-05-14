"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import {
  FiArrowRight,
  FiLock,
  FiUserPlus,
  FiShield,
} from "react-icons/fi";
import { toast } from "react-toastify";

type ConfigLogin = {
  id: number;
  titulo: string;
  logo: string;
  fundo: string;
  mensagem_personalizada: string;
};

export default function Login() {
  const [config, setConfig] = useState<ConfigLogin | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    async function carregarConfig() {
      try {
        const response = await api.get("/config-login");

        setConfig(response.data.dados);
      } catch (error) {
        console.error("Erro ao carregar configuração:", error);

        toast.error("Erro ao carregar página");
      } finally {
        setLoading(false);
      }
    }

    carregarConfig();
  }, []);

  /* ========================= */
  /* LOADING */
  /* ========================= */

  if (loading) {
    return (
      <>
        <main className="loading-page">
          <div className="loading-card">
            <div className="skeleton-logo shimmer" />

            <div className="skeleton-title shimmer" />

            <div className="skeleton-text shimmer" />

            <div className="skeleton-text small shimmer" />

            <div className="skeleton-button shimmer" />

            <div className="skeleton-button secondary shimmer" />
          </div>
        </main>

        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(
              135deg,
              #f7ebe8 0%,
              #f5efe8 50%,
              #f8f4ef 100%
            );
            padding: 20px;
          }

          .loading-card {
            width: 100%;
            max-width: 460px;
            background: rgba(255, 252, 249, 0.96);
            border-radius: 36px;
            padding: 42px 30px;
            box-shadow: 0 25px 70px rgba(183, 110, 121, 0.12);
            border: 1px solid rgba(183, 110, 121, 0.08);
          }

          .skeleton-logo {
            width: 90px;
            height: 90px;
            border-radius: 28px;
            margin: 0 auto 28px;
          }

          .skeleton-title {
            width: 70%;
            height: 34px;
            border-radius: 12px;
            margin: 0 auto 18px;
          }

          .skeleton-text {
            width: 100%;
            height: 16px;
            border-radius: 999px;
            margin-bottom: 12px;
          }

          .skeleton-text.small {
            width: 78%;
            margin: 0 auto 30px;
          }

          .skeleton-button {
            width: 100%;
            height: 56px;
            border-radius: 18px;
            margin-bottom: 16px;
          }

          .skeleton-button.secondary {
            margin-bottom: 0;
          }

          .shimmer {
            position: relative;
            overflow: hidden;
            background: #ead8d2;
          }

          .shimmer::before {
            content: "";
            position: absolute;
            top: 0;
            left: -150px;
            width: 120px;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.7),
              transparent
            );
            animation: shimmer 1.2s infinite;
          }

          @keyframes shimmer {
            100% {
              left: 120%;
            }
          }

          @media (max-width: 768px) {
            .loading-card {
              padding: 30px 22px;
              border-radius: 28px;
            }

            .skeleton-button {
              height: 52px;
              border-radius: 16px;
            }
          }
        `}</style>
      </>
    );
  }

  /* ========================= */
  /* ERROR */
  /* ========================= */

  if (!config) {
    return (
      <>
        <main className="error-page">
          <div className="error-card">
            <h2>Erro ao carregar</h2>

            <p>Não foi possível carregar a página.</p>

            <button onClick={() => window.location.reload()}>
              Tentar novamente
            </button>
          </div>
        </main>

        <style jsx>{`
          .error-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7ebe8;
            padding: 20px;
          }

          .error-card {
            width: 100%;
            max-width: 420px;
            background: #fffaf7;
            border-radius: 28px;
            padding: 40px 28px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(183, 110, 121, 0.12);
          }

          .error-card h2 {
            margin: 0 0 12px;
            font-size: 28px;
            color: #6d4c52;
          }

          .error-card p {
            margin: 0 0 24px;
            color: #8b6b70;
          }

          .error-card button {
            height: 52px;
            border: none;
            border-radius: 16px;
            padding: 0 22px;
            background: #b76e79;
            color: #ffffff;
            font-weight: 700;
            cursor: pointer;
          }
        `}</style>
      </>
    );
  }

  /* ========================= */
  /* PAGE */
  /* ========================= */

  return (
    <>
      <main
        className="login-page"
        style={{
          backgroundImage: config.fundo
            ? `linear-gradient(
                rgba(109, 76, 82, 0.75),
                rgba(109, 76, 82, 0.82)
              ), url(${config.fundo})`
            : undefined,
        }}
      >
        <div className="overlay" />

        <section className="container">
          {/* LEFT */}

          <div className="left-side">
            <div className="brand-badge">
              <FiShield />
              Loja Oficial
            </div>

            <h1>{config.titulo}</h1>

            <p>{config.mensagem_personalizada}</p>

            <div className="features">
              <div className="feature">
                <span>✔</span>
                Compra segura
              </div>

              <div className="feature">
                <span>✔</span>
                Produtos exclusivos
              </div>

              <div className="feature">
                <span>✔</span>
                Atendimento premium
              </div>
            </div>
          </div>

          {/* RIGHT */}

          <div className="right-side">
            <div className="card">
              {config.logo && (
                <div className="logo-box">
                  <img
                    src={config.logo}
                    alt={config.titulo}
                    className="logo"
                  />
                </div>
              )}

              <h2>Bem-vindo</h2>

              <span className="subtitle">
                Entre ou crie sua conta
              </span>

              <div className="actions">
                <button
                  className="btn-login"
                  onClick={() => {
                    toast.success("Redirecionando...");

                    router.push("/login/entra");
                  }}
                >
                  <FiLock size={18} />

                  Entrar

                  <FiArrowRight size={18} />
                </button>

                <button
                  className="btn-register"
                  onClick={() => {
                    toast.success("Abrindo cadastro...");

                    router.push("/login/cadastro");
                  }}
                >
                  <FiUserPlus size={18} />

                  Criar conta
                </button>
              </div>

              <div className="bottom-text">
                Faça login para acompanhar pedidos e ofertas.
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            #f7ebe8 0%,
            #f5efe8 50%,
            #fffaf7 100%
          );
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .overlay {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(4px);
          background: rgba(183, 110, 121, 0.15);
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
          color: #fffaf7;
        }

        .brand-badge {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(255, 250, 247, 0.14);
          border: 1px solid rgba(255, 250, 247, 0.2);
          margin-bottom: 28px;
          font-size: 13px;
          font-weight: 700;
          backdrop-filter: blur(12px);
        }

        .left-side h1 {
          margin: 0 0 20px;
          font-size: 72px;
          line-height: 0.95;
          font-weight: 900;
          letter-spacing: -0.05em;
          max-width: 700px;
        }

        .left-side p {
          max-width: 560px;
          margin: 0;
          color: rgba(255, 250, 247, 0.88);
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
          background: rgba(255, 250, 247, 0.12);
          border: 1px solid rgba(255, 250, 247, 0.14);
          backdrop-filter: blur(10px);
          font-size: 14px;
          font-weight: 600;
        }

        .feature span {
          color: #ffe4d6;
        }

        .right-side {
          display: flex;
          justify-content: center;
        }

        .card {
          width: 100%;
          background: rgba(255, 250, 247, 0.98);
          border-radius: 36px;
          padding: 42px 34px;
          box-shadow: 0 30px 80px rgba(183, 110, 121, 0.18);
          border: 1px solid rgba(183, 110, 121, 0.08);
        }

        .logo-box {
          width: 96px;
          height: 96px;
          margin: 0 auto 24px;
          border-radius: 28px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #f0d8d5;
        }

        .logo {
          width: 64px;
          height: 64px;
          object-fit: contain;
        }

        .card h2 {
          margin: 0;
          text-align: center;
          font-size: 36px;
          color: #6d4c52;
          font-weight: 800;
        }

        .subtitle {
          display: block;
          margin-top: 10px;
          text-align: center;
          color: #8b6b70;
          font-size: 15px;
        }

        .actions {
          margin-top: 34px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn-login,
        .btn-register {
          width: 100%;
          height: 58px;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.25s ease;
        }

        .btn-login {
          background: linear-gradient(
            135deg,
            #b76e79 0%,
            #9d5c67 100%
          );
          color: #ffffff;
          box-shadow: 0 18px 40px rgba(183, 110, 121, 0.22);
        }

        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 50px rgba(183, 110, 121, 0.28);
        }

        .btn-register {
          background: #fff;
          color: #6d4c52;
          border: 1px solid #ecd7d3;
        }

        .btn-register:hover {
          transform: translateY(-2px);
          background: #fff5f3;
        }

        .bottom-text {
          margin-top: 28px;
          text-align: center;
          color: #8b6b70;
          font-size: 14px;
          line-height: 1.7;
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

          .card h2 {
            font-size: 30px;
          }

          .btn-login,
          .btn-register {
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
        }

        @media (max-width: 480px) {
          .left-side h1 {
            font-size: 32px;
          }

          .card {
            padding: 28px 18px;
          }

          .logo-box {
            width: 82px;
            height: 82px;
          }

          .logo {
            width: 54px;
            height: 54px;
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