"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";

import {
  FiBox,
  FiTag,
  FiImage,
  FiUsers,
  FiShoppingCart,
  FiCreditCard,
  FiArrowRight,
  FiTrendingUp,
} from "react-icons/fi";

type Card = {
  titulo: string;
  quantidade: number;
};

export default function PainelPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  function getIcon(titulo: string) {
    const t = titulo.toLowerCase();

    if (t.includes("galer") || (t.includes("imagen") && t.includes("galer")))
      return <FiImage size={22} />;

    if (t.includes("prod")) return <FiBox size={22} />;

    if (t.includes("categ")) return <FiTag size={22} />;

    if (t.includes("banner")) return <FiImage size={22} />;

    if (t.includes("usu")) return <FiUsers size={22} />;

    if (t.includes("carr")) return <FiShoppingCart size={22} />;

    if (t.includes("cupom")) return <FiCreditCard size={22} />;

    if (t.includes("camp")) return <FiTrendingUp size={22} />;

    return <FiBox size={22} />;
  }

  function getLink(titulo: string) {
    const t = titulo.toLowerCase();

    if (t.includes("galer") || (t.includes("imagen") && t.includes("galer")))
      return "/painel/galeria";

    if (t.includes("prod")) return "/painel/produtos";

    if (t.includes("categ")) return "/painel/categorias";

    if (t.includes("banner")) return "/painel/banners";

    if (t.includes("usu")) return "/painel/usuarios";

    if (t.includes("carr")) return "/painel/carrinhos";

    if (t.includes("cupom")) return "/painel/cupons";

    if (t.includes("camp")) return "/painel/campanhas"; // ✅ corrigido

    return "/painel";
  }

  async function carregarCards() {
    try {
      const res = await api.get("/admin/cards");

      const data = res?.data?.dados?.dados ?? [];

      if (Array.isArray(data)) setCards(data);
    } catch (err) {
      console.error("Erro ao carregar cards:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCards();
  }, []);

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Dashboard</h1>
        <p>Visão geral do sistema</p>
      </div>

      {loading && <p>Carregando...</p>}
dsd
      <div className="grid">
        {cards.map((card, i) => (
          <div key={i} className="card">
            <div className="top">
              <div className="icon">{getIcon(card.titulo)}</div>

              <div className="numero">{card.quantidade}</div>
            </div>

            <div className="titulo">{card.titulo}</div>

            <Link href={getLink(card.titulo)} className="btn">
              Ver {card.titulo}
              <FiArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .header h1 {
          font-size: 28px;
          font-weight: 700;
        }

        .header p {
          color: #64748b;
          font-size: 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }

        .card {
          position: relative;
          background: linear-gradient(180deg, #ffffff, #fafafa);
          border-radius: 16px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
          transition: 0.25s;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.12);
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: white;
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
        }

        .numero {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
        }

        .titulo {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px;
          border-radius: 8px;
          font-size: 13px;
          background: #7c3aed;
          color: white;
          text-decoration: none;
          transition: 0.2s;
        }

        .btn:hover {
          background: #6d28d9;
        }
      `}</style>
    </div>
  );
}