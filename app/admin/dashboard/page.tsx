"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import { rotas } from "@/components/Bibioteca/config/rotas";

interface Card {
  titulo: string;
  quantidade: number;
  icone?: string;
  cor?: string;
}

type ApiResponse<T> = {
  status?: number;
  mensagem?: string;
  message?: string;
  dados?: any;
  data?: any;
};

// resolve: pega dados do seu Mensagemjson (às vezes vem em dados ou data)
function resolveApi<T>(payload: ApiResponse<T>): T {
  const root: any = payload?.dados ?? payload?.data ?? payload;
  // seu backend manda: { dados: { dados: [...] } } OU { dados: [...] }
  return (root?.dados ?? root) as T;
}

export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchCards = async () => {
      setLoading(true);

      try {
        // ✅ usa rota centralizada
        const res = await api.get<ApiResponse<Card[]>>(rotas.admin.cards);

        const lista = resolveApi<Card[]>(res.data);

        if (!Array.isArray(lista)) {
          console.error("Formato inválido da API:", res.data);
          if (alive) setCards([]);
          return;
        }

        const dadosComEstilo: Card[] = lista.map((card) => {
          const t = (card.titulo || "").toLowerCase();

          let cor = "#d4af37";
          let icone = "bi-grid";

          if (t.includes("categoria")) {
            cor = "#6f42c1";
            icone = "bi-tags";
          } else if (t.includes("banner")) {
            cor = "#0d6efd";
            icone = "bi-image";
          } else if (t.includes("usu")) {
            cor = "#198754";
            icone = "bi-people";
          } else if (t.includes("produto")) {
            cor = "#fd7e14";
            icone = "bi-bag";
          } else if (t.includes("cupom")) {
            cor = "#dc3545";
            icone = "bi-ticket-perforated";
          } else if (t.includes("carrinho")) {
            cor = "#0aa2c0";
            icone = "bi-cart3";
          }

          return { ...card, cor, icone };
        });

        if (alive) setCards(dadosComEstilo);
      } catch (err) {
        console.error("Erro ao buscar cards da dashboard:", err);
        if (alive) setCards([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchCards();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div className="p-4">Carregando dashboard...</div>;

  return (
    <div className="dashboard-wrapper">
      <div className="mb-4">
        <h1 className="fw-bold mb-1 title">Dashboard</h1>
        <p className="subtitle">Visão geral do painel administrativo</p>
      </div>

      <div className="row g-4 dashboard-grid">
        {cards.map((card, idx) => {
          // ✅ rota do link baseada no título (mais seguro)
          const slug = (card.titulo || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-");

          // você pode ajustar mapeamento aqui se quiser:
          const href =
            card.titulo.toLowerCase().includes("cupom")
              ? "/admin/cupons"
              : card.titulo.toLowerCase().includes("carrinho")
              ? "/admin/pedidos"
              : `/admin/${slug}`;

          return (
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

                <Link href={href} className="card-link">
                  Gerenciar → 
                </Link>
              </div>
            </div>
          );
        })}
      </div>

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