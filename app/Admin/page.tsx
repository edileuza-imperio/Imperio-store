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
        
      `}</style>
    </div>
  );
}