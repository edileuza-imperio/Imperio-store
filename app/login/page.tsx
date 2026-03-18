'use client';

import { useLoginConfig } from "@/hooks/useLoginConfig";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { config, loading } = useLoginConfig();
  const router = useRouter();

  if (loading) {
    return <p style={{ color: "#fff", textAlign: "center" }}>Carregando...</p>;
  }

  const titulo = config?.titulo || "Bem-vindo";
  const mensagem = config?.mensagem_personalizada || "";
  const logo = config?.logo || "";

  return (
    <>
      <div className="page" style={{ background: config?.fundo }}>
        <main className="container">

          {logo && (
            <img src={logo} className="logo" alt="logo"/>
          )}

          <h1 className="title">{titulo}</h1>

          <p className="message">{mensagem}</p>

          <button
            className="btn"
            onClick={() => router.push("/login/entrar")}
          >
            Entrar
          </button>

          <button
            className="btnGhost"
            onClick={() => router.push("/cadastro")}
          >
            Criar conta
          </button>

        </main>
      </div>

      <style jsx>{`

        .page{
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
        }

        .container{
          text-align:center;
          max-width:500px;
        }

        .logo{
          width:120px;
          margin-bottom:20px;
        }

        .title{
          font-size:42px;
          font-weight:900;
        }

        .message{
          margin-top:10px;
          opacity:.8;
        }

        .btn{
          margin-top:30px;
          width:100%;
          padding:14px;
          border-radius:12px;
          border:none;
          font-weight:bold;
          cursor:pointer;
          background:#ffd0db;
        }

        .btnGhost{
          margin-top:10px;
          width:100%;
          padding:14px;
          border-radius:12px;
          border:1px solid white;
          background:transparent;
          color:white;
        }

      `}</style>
    </>
  );
}