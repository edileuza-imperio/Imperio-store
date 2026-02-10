"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";

interface Card {
  titulo: string;
  quantidade: number;
  icone?: string;
  cor?: string;
}

interface ApiResponse {
  status: number;
  mensagem: string;
  dados: {
    dados: Card[];
  };
}

export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);

      try {
        const res = await api.get<ApiResponse>("/admin/dash");

        // 🔒 Validação defensiva
        const lista = res.data?.dados?.dados;

        if (!Array.isArray(lista)) {
          console.error("Formato inválido da API:", res.data);
          setCards([]);
          return;
        }

        // 🎨 Aplica estilo aos cards
        const dadosComEstilo: Card[] = lista.map((card) => {
          let cor = "#d4af37";
          let icone = "bi-box-seam";

          switch (card.titulo.toLowerCase()) {
            case "categorias":
              cor = "#6f42c1";
              icone = "bi-tags";
              break;

            case "banners":
              cor = "#0d6efd";
              icone = "bi-image";
              break;

            case "usuarios":
              cor = "#198754";
              icone = "bi-people";
              break;

            case "produtos":
              cor = "#fd7e14";
              icone = "bi-bag";
              break;
          }

          return { ...card, cor, icone };
        });

        setCards(dadosComEstilo);
      } catch (err) {
        console.error("Erro ao buscar cards da dashboard:", err);
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  // ⏳ Loading
  if (loading) {
    return <div className="p-4">Carregando dashboard...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      {/* TÍTULO */}
      <div className="mb-4">
        <h1 className="fw-bold mb-1 title">Dashboard</h1>
        <p className="subtitle">Visão geral do painel administrativo</p>
      </div>

      {/* CARDS */}
      <div className="row g-4 dashboard-grid">
        {cards.map((card, idx) => (
          <div key={idx} className="col-12 col-md-6 col-xl-3">
            <div className="dashboard-card h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="card-label">{card.titulo}</span>
                  <h2 className="card-value">{card.quantidade}</h2>
                </div>

                <div
                  className="card-icon"
                  style={{
                    background: `${card.cor}22`,
                    color: card.cor,
                  }}
                >
                  <i className={`bi ${card.icone}`} />
                </div>
              </div>

              <Link
                href={`/admin/${card.titulo.toLowerCase()}`}
                className="card-link"
              >
                Gerenciar {card.titulo.toLowerCase()} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ESTILO GLOBAL */}
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
        }

        .dashboard-wrapper {
          padding: 24px;
          background: #f4f6fb;
          min-height: calc(100vh - 70px);
        }

        .title {
          color: #6b4c4f;
        }

        .subtitle {
          color: #8d8d8d;
        }

        .dashboard-grid {
          margin: 0;
        }

        .dashboard-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .dashboard-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
        }

        .card-label {
          font-size: 13px;
          color: #9aa0ac;
          font-weight: 500;
        }

        .card-value {
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          color: #2b2b2b;
        }

        .card-icon {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .card-link {
          margin-top: 14px;
          font-size: 13px;
          font-weight: 600;
          color: #c97a7e;
          text-decoration: none;
          transition: color 0.2s;
        }

        .card-link:hover {
          color: #6b4c4f;
        }

        @media (max-width: 768px) {
          .dashboard-wrapper {
            padding: 16px;
          }

          .card-value {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}
