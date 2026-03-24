"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import useUsuario from "@/hooks/Auth/useUsuario";

type CardAcao = {
  tipo: string;
  icone: string;
  url: string;
};

type DashboardCard = {
  titulo: string;
  valor: number;
  icone?: string;
  acoes?: CardAcao[];
};

export default function AdminPage() {
  const router = useRouter();
  const { usuario } = useUsuario();

  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarCards() {
      try {
        setLoading(true);
        setErro(null);

        const response = await api.get("/painel/dados/cards", {
          withCredentials: true,
        });

        const data = response.data;

        setCards(data?.dados?.dados?.cards || []);
      } catch (error: any) {
        console.error("Erro ao carregar cards:", error?.response?.data || error);

        setErro(
          error?.response?.data?.mensagem ||
            error?.message ||
            "Erro ao carregar cards."
        );
        setCards([]);
      } finally {
        setLoading(false);
      }
    }

    carregarCards();
  }, []);

  function renderIcon(icon?: string) {
    switch (icon) {
      case "settings":
        return "⚙";
      case "plus":
        return "+";
      case "eye":
        return "👁";
      case "box":
        return "📦";
      case "tag":
        return "🏷";
      case "users":
        return "👥";
      default:
        return "■";
    }
  }

  return (
    <div className="dashboard">
      <div className="hero-card">
        <div>
          <span className="hero-badge">Painel administrativo</span>
          <h1>Bem-vindo, {usuario?.nome || "Usuário"}</h1>
          <p>
            Aqui você pode administrar produtos, categorias, usuários e outras
            áreas do sistema.
          </p>
        </div>
      </div>

      {loading && <p className="state-text">Carregando cards...</p>}

      {erro && <p className="error-text">{erro}</p>}

      <div className="cards-grid">
        {cards.map((card, index) => (
          <div className="dashboard-card" key={`${card.titulo}-${index}`}>
            <div className="card-top">
              <div className="card-icon">{renderIcon(card.icone)}</div>

              <div className="card-info">
                <span>{card.titulo}</span>
                <strong>{card.valor}</strong>
              </div>
            </div>

            {!!card.acoes?.length && (
              <div className="card-actions">
                {card.acoes.map((acao, idx) => (
                  <button
                    key={`${acao.tipo}-${idx}`}
                    type="button"
                    className={acao.tipo === "cadastrar" ? "btn-primary" : "btn-secondary"}
                    onClick={() => router.push(acao.url)}
                  >
                    <span>{renderIcon(acao.icone)}</span>
                    <span>
                      {acao.tipo === "cadastrar" ? "Cadastrar" : "Visualizar"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hero-card {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 55%, #4338ca 100%);
          color: #fff;
          border-radius: 28px;
          padding: 30px;
          box-shadow: 0 20px 45px rgba(37, 99, 235, 0.22);
        }

        .hero-badge {
          display: inline-block;
          margin-bottom: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hero-card h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
          line-height: 1.1;
        }

        .hero-card p {
          margin: 0;
          max-width: 700px;
          color: rgba(255, 255, 255, 0.92);
          font-size: 15px;
        }

        .state-text {
          margin: 0;
          color: #475569;
          font-size: 14px;
        }

        .error-text {
          margin: 0;
          color: #b91c1c;
          background: #fee2e2;
          border: 1px solid #fecaca;
          padding: 12px 14px;
          border-radius: 14px;
          font-size: 14px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 22px;
        }

        .dashboard-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .dashboard-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 44px rgba(15, 23, 42, 0.1);
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }

        .card-icon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #1d4ed8;
          font-size: 24px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .card-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .card-info span {
          font-size: 14px;
          color: #64748b;
        }

        .card-info strong {
          font-size: 30px;
          line-height: 1;
          color: #0f172a;
        }

        .card-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .card-actions button {
          border: none;
          border-radius: 14px;
          padding: 11px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #fff;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.22);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
        }

        @media (max-width: 640px) {
          .hero-card {
            padding: 22px;
            border-radius: 22px;
          }

          .hero-card h1 {
            font-size: 26px;
          }

          .dashboard-card {
            padding: 18px;
            border-radius: 20px;
          }

          .card-info strong {
            font-size: 26px;
          }

          .card-actions {
            flex-direction: column;
          }

          .card-actions button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}