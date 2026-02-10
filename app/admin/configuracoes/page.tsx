"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { BiCog } from "react-icons/bi";
import { useRouter } from "next/navigation";

interface CardConfig {
  titulo: string;
  quantidade: number;
  rota: string;
}

export default function ConfiguracoesPage() {
  const [cards, setCards] = useState<CardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function carregarCards() {
    setLoading(true);
    console.log("⚙️ Buscando cards de configuração...");

    try {
      const res = await api.get("/admin/dash/configuracoes", {
        withCredentials: true,
      });

      console.log("✅ Resposta cards config:", res.data);

      setCards(res.data?.dados ?? []);
    } catch (e) {
      console.error("❌ Erro ao carregar cards de configuração:", e);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCards();
  }, []);

  return (
    <div className="config-page">
      <div className="page-header">
        <h1>
          <BiCog size={28} /> Configurações
        </h1>
      </div>

      {loading ? (
        <p className="info">Carregando cards de configuração...</p>
      ) : cards.length === 0 ? (
        <p className="info">Nenhum card de configuração encontrado</p>
      ) : (
        <div className="cards">
          {cards.map((c, idx) => (
            <div
              key={idx}
              className="card-config"
              onClick={() => router.push(c.rota)} // abre a página de gerenciamento correta
            >
              <h3>{c.titulo}</h3>
              <span>{c.quantidade}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .config-page {
          padding: 20px;
          font-family: "Inter", sans-serif;
          background: #f5f7fa;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .page-header h1 {
          font-size: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #111827;
        }
        .info {
          text-align: center;
          color: #6b7280;
          padding: 40px;
          font-size: 16px;
        }
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .card-config {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .card-config:hover {
          transform: translateY(-4px);
        }
        .card-config h3 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .card-config span {
          font-size: 32px;
          font-weight: 700;
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
