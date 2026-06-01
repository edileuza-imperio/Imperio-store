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

      setCategorias(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error("Erro ao listar categorias:", error);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }

  const totalCategorias = categorias.length;
  const categoriasAtivas = categorias.filter(
    (cat) => cat.status_id === 1
  ).length;

  return (
    <div className="page">
      <div className="container">
        <div className="header">
          <div>
            <h1>Categorias</h1>
            <p>Gerencie to4das as categorias do sistema com mais organização</p>
          </div>
        </div>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statIcon">
              <FolderOpen size={22} />
            </div>
            <div>
              <span>Total de Categorias</span>
              <strong>{totalCategorias}</strong>
            </div>
          </div>

          <div className="statCard">
            <div className="statIcon">
              <Tag size={22} />
            </div>
            <div>
              <span>Categorias Ativas</span>
              <strong>{categoriasAtivas}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <p>Carregando categorias...</p>
          </div>
        ) : categorias.length === 0 ? (
          <div className="empty">
            <div className="emptyIcon">
              <FolderOpen size={44} />
            </div>
            <h3>Nenhuma categoria encontrada</h3>
            <p>Crie a primeira categoria para começar a organizar o sistema.</p>
          </div>
        ) : (
          <div className="grid">
            {categorias.map((cat) => (
              <div key={cat.id_categoria} className="card">
                <div className="cardTop">
                  <div className="cardIcon">
                    <FolderOpen size={18} />
                  </div>

                  <span className="slug">{cat.slug}</span>
                </div>

                <h3>{cat.nome}</h3>

                {cat.descricao ? (
                  <p>{cat.descricao}</p>
                ) : (
                  <p className="muted">Nenhuma descrição cadastrada.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/painel/categoria/nova"
        className="floatingButton"
        aria-label="Nova categoria"
      >
        <Plus size={28} />
      </Link>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, #fff7f8 0%, transparent 28%),
            radial-gradient(circle at bottom right, #f8eef0 0%, transparent 30%),
            #faf7f8;
          padding: 28px;
          position: relative;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: 90px;
        }

        .header {
          margin-bottom: 26px;
        }

        .header h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          color: #2f2425;
          letter-spacing: -0.03em;
        }

        .header p {
          margin: 8px 0 0;
          color: #7f6d70;
          font-size: 0.96rem;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .statCard {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #ece0e2;
          border-radius: 22px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
          backdrop-filter: blur(8px);
        }

        .statIcon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fdecef, #f8dde1);
          color: #a85d6a;
          flex-shrink: 0;
        }

        .statCard span {
          display: block;
          font-size: 0.84rem;
          color: #8a777a;
        }

        .statCard strong {
          display: block;
          margin-top: 4px;
          font-size: 1.7rem;
          color: #2f2425;
          font-weight: 800;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 20px;
          color: #7b6a6d;
        }

        .spinner {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 4px solid #ead9db;
          border-top-color: #b26a77;
          animation: spin 0.9s linear infinite;
        }

        .empty {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #ece0e2;
          border-radius: 28px;
          padding: 72px 24px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
        }

        .emptyIcon {
          width: 78px;
          height: 78px;
          margin: 0 auto 18px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fdecef, #f8dde1);
          color: #b26a77;
        }

        .empty h3 {
          margin: 0;
          font-size: 1.2rem;
          color: #342829;
        }

        .empty p {
          margin: 10px 0 0;
          color: #7b6a6d;
          line-height: 1.6;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 18px;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #ece0e2;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.04);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          backdrop-filter: blur(8px);
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.08);
        }

        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .cardIcon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fdf1f3;
          color: #b26a77;
          flex-shrink: 0;
        }

        .slug {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 11px;
          border-radius: 999px;
          background: #fdf1f3;
          color: #b26a77;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .card h3 {
          margin: 0;
          color: #2f2425;
          font-size: 1.08rem;
          font-weight: 800;
          line-height: 1.3;
        }

        .card p {
          margin: 12px 0 0;
          color: #6f6062;
          line-height: 1.6;
          font-size: 0.94rem;
        }

        .muted {
          font-style: italic;
          color: #9a8b8d !important;
        }

        .floatingButton {
          position: fixed;
          right: 28px;
          bottom: 28px;
          width: 66px;
          height: 66px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #c37c88, #8c4f5c);
          color: #fff;
          text-decoration: none;
          box-shadow: 0 18px 40px rgba(140, 79, 92, 0.35);
          transition: transform 0.25s ease, box-shadow 0.25s ease,
            filter 0.25s ease;
          z-index: 999;
        }

        .floatingButton:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 22px 48px rgba(140, 79, 92, 0.42);
          filter: brightness(1.03);
        }

        .floatingButton:active {
          transform: translateY(-2px) scale(0.98);
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
          .page {
            padding: 18px;
          }

          .header h1 {
            font-size: 1.65rem;
          }

          .floatingButton {
            width: 60px;
            height: 60px;
            right: 18px;
            bottom: 18px;
          }
        }
      `}</style>
    </div>
  );
}