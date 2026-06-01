"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import { Plus, FolderOpen, Tag } from "lucide-react";

type Categoria = {
  id_categoria: number | string;
  nome: string;
  slug: string;
  descricao?: string;
  status_id?: number;
};

export default function Page() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCategorias();
  }, []);

  async function carregarCategorias() {
    try {
      setLoading(true);

      const response = await api.get("/painel/categorias", {
        withCredentials: true,
      });

      const lista =
        response.data?.dados?.dados ||
        response.data?.dados ||
        response.data ||
        [];

      setCategorias(lista);
    } catch (error) {
      console.error("Erro ao listar categorias:", error);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }

  const categoriasAtivas = categorias.filter(
    (cat) => cat.status_id === 1
  ).length;

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Categorias</h1>
          <p>Gerencie todas as categorias do sistema</p>
        </div>
      </div>

      <div className="statsGrid">
        <div className="statCard">
          <FolderOpen size={26} />
          <div>
            <span>Total de Categorias</span>
            <strong>{categorias.length}</strong>
          </div>
        </div>

        <div className="statCard">
          <Tag size={26} />
          <div>
            <span>Categorias Ativas</span>
            <strong>{categoriasAtivas}</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando categorias...</p>
        </div>
      ) : categorias.length === 0 ? (
        <div className="empty">
          <FolderOpen size={60} />
          <h3>Nenhuma categoria encontrada</h3>
          <p>Crie sua primeira categoria para começar.</p>
        </div>
      ) : (
        <div className="grid">
          {categorias.map((cat) => (
            <div key={cat.id_categoria} className="card">
              <div className="cardTop">
                <div className="iconBox">
                  <FolderOpen size={20} />
                </div>

                <span className="slug">{cat.slug}</span>
              </div>

              <h3>{cat.nome}</h3>

              {cat.descricao ? (
                <p>{cat.descricao}</p>
              ) : (
                <p className="semDescricao">
                  Nenhuma descrição cadastrada.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Link href="/painel/categoria/nova" className="fab">
        <Plus size={28} />
      </Link>

      <style jsx>{`
        .container {
          padding: 28px;
          min-height: 100vh;
          background: #fafafa;
        }

        .header {
          margin-bottom: 28px;
        }

        .header h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          color: #2f2425;
        }

        .header p {
          margin-top: 6px;
          color: #7f6d70;
          font-size: 0.95rem;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
          margin-bottom: 30px;
        }

        .statCard {
          background: white;
          border-radius: 20px;
          padding: 22px;
          border: 1px solid #ece2e3;

          display: flex;
          align-items: center;
          gap: 16px;

          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
        }

        .statCard svg {
          color: #b26a77;
        }

        .statCard span {
          display: block;
          color: #887376;
          font-size: 0.85rem;
        }

        .statCard strong {
          display: block;
          margin-top: 4px;
          font-size: 1.8rem;
          color: #2f2425;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          gap: 14px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #eee;
          border-top: 4px solid #b26a77;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .empty {
          background: white;
          border-radius: 24px;
          padding: 70px 30px;
          text-align: center;
          border: 1px solid #ece2e3;
        }

        .empty svg {
          color: #b26a77;
        }

        .empty h3 {
          margin-top: 16px;
          color: #342829;
        }

        .empty p {
          color: #7b6a6d;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fill,
            minmax(280px, 1fr)
          );
          gap: 20px;
        }

        .card {
          background: white;
          border-radius: 22px;
          padding: 22px;
          border: 1px solid #ece2e3;

          transition: all 0.25s ease;

          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
        }

        .card:hover {
          transform: translateY(-5px);

          box-shadow: 0 20px 35px rgba(0, 0, 0, 0.08);
        }

        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .iconBox {
          width: 42px;
          height: 42px;
          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #fdf0f2;
          color: #b26a77;
        }

        .slug {
          background: #fdf0f2;
          color: #b26a77;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }

        .card h3 {
          margin: 0;
          color: #2f2425;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .card p {
          margin-top: 12px;
          color: #6f6062;
          line-height: 1.6;
          font-size: 0.92rem;
        }

        .semDescricao {
          color: #999;
          font-style: italic;
        }

        .fab {
          position: fixed;
          right: 28px;
          bottom: 28px;

          width: 65px;
          height: 65px;

          border-radius: 50%;

          background: linear-gradient(
            135deg,
            #c37c88,
            #8c4f5c
          );

          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          text-decoration: none;

          box-shadow: 0 20px 40px rgba(140, 79, 92, 0.35);

          transition: all 0.25s ease;
        }

        .fab:hover {
          transform: translateY(-4px) scale(1.05);
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 20px;
          }

          .header h1 {
            font-size: 1.7rem;
          }

          .fab {
            width: 58px;
            height: 58px;
            right: 20px;
            bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
}