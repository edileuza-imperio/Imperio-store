"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import api from "@/Api/conectar";

import { FiArrowRight } from "react-icons/fi";

type Campanha = {
  id_campanha: number | string;

  titulo: string;
  slug: string;

  descricao?: string;

  banner?: string;
  desktop?: string;
  mobile?: string;
  imagem?: string;
};

function extrairLista(payload: any): any[] {
  if (Array.isArray(payload?.dados?.dados)) {
    return payload.dados.dados;
  }

  if (Array.isArray(payload?.dados)) {
    return payload.dados;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function resolverImagem(src?: string | null) {
  if (!src) return "";

  const valor = String(src).trim();

  if (!valor) return "";

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("data:image") ||
    valor.startsWith("blob:")
  ) {
    return valor;
  }

  const baseURL =
    typeof api === "string"
      ? api
      : (api as any)?.defaults?.baseURL || "";

  if (!baseURL) return valor;

  if (valor.startsWith("/")) {
    return `${baseURL}${valor}`;
  }

  return `${baseURL}/${valor}`;
}

function obterImagemCampanha(campanha: Campanha) {
  return resolverImagem(
    campanha.banner ||
      campanha.desktop ||
      campanha.mobile ||
      campanha.imagem ||
      ""
  );
}

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarCampanhas() {
      try {
        setLoading(true);

        const response = await api.get("/campanhas", {
          withCredentials: true,
        });

        console.log("CAMPANHAS:", response.data);

        const lista = extrairLista(response.data);

        setCampanhas(lista);
      } catch (error) {
        console.error(
          "Erro ao carregar campanhas:",
          error
        );

        setCampanhas([]);
      } finally {
        setLoading(false);
      }
    }

    carregarCampanhas();
  }, []);

  if (loading) {
    return (
      <section className="campanhas-loading">
        <div className="container">
          <div className="loading-banner" />
        </div>

        <style jsx>{`
          .campanhas-loading {
            padding: 30px 0;
          }

          .container {
            max-width: 1440px;
            margin: 0 auto;
            padding: 0 16px;
          }

          .loading-banner {
            width: 100%;
            height: 620px;

            border-radius: 40px;

            background: linear-gradient(
              90deg,
              #f4ece8 25%,
              #ffffff 50%,
              #f4ece8 75%
            );

            background-size: 200% 100%;

            animation: shimmer 1.4s infinite;
          }

          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }

            100% {
              background-position: -200% 0;
            }
          }
        `}</style>
      </section>
    );
  }

  if (!campanhas.length) {
    return null;
  }

  return (
    <section className="campanhas-section">
      <div className="container">
        <div className="campanhas-grid">
          {campanhas.map((campanha) => {
            const imagem =
              obterImagemCampanha(campanha);

            return (
              <article
                key={String(campanha.id_campanha)}
                className="campanha-card"
              >
                <Link
                  href={`/campanha/${campanha.slug}`}
                  className="campanha-link"
                >
                  <div className="campanha-banner">
                    {imagem ? (
                      <img
                        src={imagem}
                        alt={campanha.titulo}
                        className="campanha-imagem"
                      />
                    ) : (
                      <div className="banner-sem-imagem">
                        Sem imagem
                      </div>
                    )}

                    <div className="overlay" />

                    <div className="conteudo">
                      <span className="badge">
                        Campanha Especial
                      </span>

                      <h2>{campanha.titulo}</h2>

                      {campanha.descricao && (
                        <p>{campanha.descricao}</p>
                      )}

                      <div className="botao">
                        <span>
                          Ver campanha
                        </span>

                        <FiArrowRight />
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .campanhas-section {
          padding: 34px 0;
        }

        .container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .campanhas-grid {
          display: flex;
          flex-direction: column;
          gap: 34px;
        }

        .campanha-card {
          width: 100%;
        }

        .campanha-link {
          text-decoration: none;
          display: block;
        }

        .campanha-banner {
          position: relative;

          width: 100%;
          height: 620px;

          border-radius: 40px;

          overflow: hidden;

          background: #f7efeb;

          box-shadow: 0 30px 70px
            rgba(0, 0, 0, 0.12);
        }

        .campanha-imagem {
          width: 100%;
          height: 100%;

          object-fit: cover;

          display: block;

          transition: transform 0.5s ease;
        }

        .campanha-card:hover
          .campanha-imagem {
          transform: scale(1.04);
        }

        .banner-sem-imagem {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: linear-gradient(
            135deg,
            #f5ebe7 0%,
            #fff7f5 100%
          );

          color: #8b6b70;

          font-size: 22px;
          font-weight: 700;
        }

        .overlay {
          position: absolute;
          inset: 0;

          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.8),
            rgba(0, 0, 0, 0.25)
          );
        }

        .conteudo {
          position: absolute;

          top: 0;
          left: 0;

          width: 100%;
          height: 100%;

          z-index: 2;

          display: flex;
          flex-direction: column;
          justify-content: center;

          padding: 70px;

          max-width: 760px;
        }

        .badge {
          width: fit-content;

          padding: 10px 18px;

          border-radius: 999px;

          background: rgba(
            255,
            255,
            255,
            0.14
          );

          backdrop-filter: blur(12px);

          color: white;

          font-size: 12px;
          font-weight: 800;

          text-transform: uppercase;

          letter-spacing: 0.08em;

          margin-bottom: 20px;
        }

        .conteudo h2 {
          margin: 0;

          color: white;

          font-size: 64px;
          line-height: 1.05;

          font-weight: 900;
        }

        .conteudo p {
          margin-top: 24px;

          color: rgba(
            255,
            255,
            255,
            0.92
          );

          font-size: 18px;

          line-height: 1.9;
        }

        .botao {
          margin-top: 32px;

          width: fit-content;

          height: 56px;

          padding: 0 26px;

          border-radius: 18px;

          background: white;

          color: #8f5a64;

          display: inline-flex;
          align-items: center;
          gap: 12px;

          font-size: 15px;
          font-weight: 800;

          transition: 0.25s;
        }

        .campanha-card:hover .botao {
          transform: translateY(-2px);
        }

        @media (max-width: 1024px) {
          .campanha-banner {
            height: 520px;
          }

          .conteudo {
            padding: 50px;
          }

          .conteudo h2 {
            font-size: 48px;
          }
        }

        @media (max-width: 768px) {
          .campanha-banner {
            height: 420px;

            border-radius: 28px;
          }

          .conteudo {
            padding: 30px;
          }

          .conteudo h2 {
            font-size: 34px;
          }

          .conteudo p {
            font-size: 14px;
            line-height: 1.7;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 0 12px;
          }

          .campanha-banner {
            height: 360px;

            border-radius: 24px;
          }

          .conteudo {
            padding: 22px;
          }

          .conteudo h2 {
            font-size: 28px;
          }

          .badge {
            font-size: 10px;
          }

          .botao {
            height: 48px;

            padding: 0 18px;

            font-size: 13px;
          }
        }
      `}</style>
    </section>
  );
}