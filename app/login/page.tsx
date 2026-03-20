"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

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
      } finally {
        setLoading(false);
      }
    }

    carregarConfig();
  }, []);

  if (loading) {
    return (
      <>
        <main className="loading-page">
          <div className="loading-card">
            <div className="spinner" />
            <p>Carregando...</p>
          </div>
        </main>

        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #b76e79 0%, #1f3a5f 100%);
            padding: 24px;
          }

          .loading-card {
            width: 100%;
            max-width: 320px;
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(10px);
            border-radius: 28px;
            padding: 36px 28px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
          }

          .spinner {
            width: 42px;
            height: 42px;
            border: 4px solid #e5e7eb;
            border-top: 4px solid #1f3a5f;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .loading-card p {
            margin: 0;
            color: #374151;
            font-size: 15px;
            font-weight: 600;
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

  if (!config) {
    return (
      <>
        <main className="error-page">
          <div className="error-card">
            <h2>Não foi possível carregar a página</h2>
            <p>Verifique a API e tente novamente.</p>
          </div>
        </main>

        <style jsx>{`
          .error-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #b76e79 0%, #1f3a5f 100%);
            padding: 24px;
          }

          .error-card {
            width: 100%;
            max-width: 420px;
            background: #ffffff;
            border-radius: 28px;
            padding: 38px 30px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
          }

          .error-card h2 {
            margin: 0 0 10px;
            font-size: 26px;
            color: #111827;
          }

          .error-card p {
            margin: 0;
            color: #6b7280;
            line-height: 1.6;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <main className="login-page">
        <div className="bg-circle circle-1" />
        <div className="bg-circle circle-2" />

        <section className="card">
          <div className="top-line" />

          {config.logo && (
            <div className="logo-box">
              <img src={config.logo} alt={config.titulo} className="logo" />
            </div>
          )}

          <span className="badge">Bem-vindo</span>

          <h1>{config.titulo}</h1>

          <p>{config.mensagem_personalizada}</p>

          <div className="actions">
            <button
              className="btn-login"
              onClick={() => router.push("/login/entra")}
            >
              Entrar
            </button>

            <button
              className="btn-cadastro"
              onClick={() => router.push("/login/cadastro")}
            >
              Cadastro
            </button>
          </div>
        </section>
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
          filter: blur(8px);
          opacity: 0.24;
        }

        .circle-1 {
          width: 340px;
          height: 340px;
          background: rgba(255, 255, 255, 0.35);
          top: -90px;
          left: -90px;
        }

        .circle-2 {
          width: 420px;
          height: 420px;
          background: rgba(255, 255, 255, 0.18);
          bottom: -120px;
          right: -120px;
        }

        .card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(12px);
          border-radius: 32px;
          padding: 46px 36px 38px;
          text-align: center;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.65);
        }

        .top-line {
          width: 72px;
          height: 6px;
          border-radius: 999px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #b76e79, #1f3a5f);
        }

        .logo-box {
          width: 108px;
          height: 108px;
          margin: 0 auto 20px;
          border-radius: 28px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 14px 32px rgba(17, 24, 39, 0.08);
          border: 1px solid #f1f5f9;
        }

        .logo {
          width: 72px;
          height: 72px;
          object-fit: contain;
        }

        .badge {
          display: inline-block;
          margin-bottom: 16px;
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
          margin: 0 0 14px;
          font-size: 40px;
          line-height: 1.1;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.03em;
        }

        p {
          margin: 0 auto;
          max-width: 390px;
          color: #4b5563;
          font-size: 16px;
          line-height: 1.8;
        }

        .actions {
          margin-top: 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .btn-login,
        .btn-cadastro {
          width: 100%;
          height: 56px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .btn-login {
          border: none;
          background: linear-gradient(135deg, #b76e79 0%, #1f3a5f 100%);
          color: #ffffff;
          box-shadow: 0 16px 30px rgba(31, 58, 95, 0.22);
        }

        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 34px rgba(31, 58, 95, 0.28);
        }

        .btn-login:active {
          transform: translateY(0);
        }

        .btn-cadastro {
          border: 1.5px solid #d8dee8;
          background: #ffffff;
          color: #1f3a5f;
          box-shadow: 0 10px 24px rgba(17, 24, 39, 0.06);
        }

        .btn-cadastro:hover {
          transform: translateY(-2px);
          border-color: #b76e79;
          color: #8b4d59;
          box-shadow: 0 16px 28px rgba(183, 110, 121, 0.14);
        }

        .btn-cadastro:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .card {
            padding: 34px 22px 28px;
            border-radius: 24px;
          }

          .logo-box {
            width: 92px;
            height: 92px;
            border-radius: 24px;
          }

          .logo {
            width: 62px;
            height: 62px;
          }

          h1 {
            font-size: 30px;
          }

          p {
            font-size: 15px;
            line-height: 1.7;
          }

          .actions {
            grid-template-columns: 1fr;
          }

          .btn-login,
          .btn-cadastro {
            height: 52px;
            border-radius: 14px;
          }
        }
      `}</style>
    </>
  );
}