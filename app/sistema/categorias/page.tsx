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

  const categoriasAtivas = categorias.filter((cat) => cat.status_id === 1)
    .length;

  return (
    <div className="page">
      <div className="content">
        <div className="top">
          <div>
            <h1>Categorias</h1>
            <p>Gerencie as categorias cadastradas no sistema</p>
          </div>

          <Link href="/painel/categoria/nova" className="addButtonInline">
            <Plus size={18} />
            Nova categoria
          </Link>
        </div>

        <div className="stats">
          <div className="stat">
            <FolderOpen size={20} />
            <div>
              <span>Total de categorias</span>
              <strong>{categorias.length}</strong>
            </div>
          </div>

          <div className="stat">
            <Tag size={20} />
            <div>
              <span>Categorias ativas</span>
              <strong>{categoriasAtivas}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="stateBox">
            <div className="spinner" />
            <p>Carregando categorias...</p>
          </div>
        ) : categorias.length === 0 ? (
          <div className="stateBox">
            <FolderOpen size={48} />
            <h3>Nenhuma categoria encontrada</h3>
            <p>Cadastre a primeira categoria para começar.</p>
          </div>
        ) : (
          <div className="list">
            {categorias.map((cat) => (
              <div key={cat.id_categoria} className="item">
                <div className="itemHeader">
                  <div className="badgeIcon">
                    <FolderOpen size={18} />
                  </div>

                  <span className="slug">{cat.slug}</span>
                </div>

                <h3>{cat.nome}</h3>

                {cat.descricao ? (
                  <p>{cat.descricao}</p>
                ) : (
                  <p className="emptyText">Sem descrição cadastrada.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/painel/categoria/nova" className="fab" aria-label="Nova categoria">
        <Plus size={26} />
      </Link>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f7f7f8;
          padding: 24px;
        }

        .content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: #2b2b2b;
        }

        .top p {
          margin: 6px 0 0;
          color: #6f6f6f;
          font-size: 0.95rem;
        }

        .addButtonInline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          background: #222;
          color: #fff;
          text-decoration: none;
          font-weight: 600;
          transition: 0.2s ease;
          white-space: nowrap;
        }

        .addButtonInline:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        .stat {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat svg {
          color: #7b5cff;
          flex-shrink: 0;
        }

        .stat span {
          display: block;
          font-size: 0.85rem;
          color: #707070;
        }

        .stat strong {
          display: block;
          margin-top: 4px;
          font-size: 1.4rem;
          color: #1f1f1f;
        }

        .stateBox {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 18px;
          padding: 48px 20px;
          text-align: center;
          color: #666;
        }

        .stateBox h3 {
          margin: 14px 0 6px;
          color: #2a2a2a;
        }

        .stateBox p {
          margin: 0;
          color: #7a7a7a;
        }

        .spinner {
          width: 38px;
          height: 38px;
          margin: 0 auto;
          border: 4px solid #ececec;
          border-top: 4px solid #7b5cff;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        .list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
          padding-bottom: 90px;
        }

        .item {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 16px;
          padding: 18px;
          transition: 0.2s ease;
        }

        .item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }

        .itemHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .badgeIcon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #f1efff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7b5cff;
          flex-shrink: 0;
        }

        .slug {
          font-size: 0.78rem;
          font-weight: 700;
          color: #7b5cff;
          background: #f1efff;
          padding: 6px 10px;
          border-radius: 999px;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item h3 {
          margin: 0;
          font-size: 1.05rem;
          color: #232323;
        }

        .item p {
          margin: 10px 0 0;
          color: #666;
          line-height: 1.5;
          font-size: 0.93rem;
        }

        .emptyText {
          font-style: italic;
          color: #9a9a9a;
        }

        .fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #7b5cff;
          color: #fff;
          text-decoration: none;
          box-shadow: 0 14px 30px rgba(123, 92, 255, 0.35);
          transition: 0.2s ease;
          z-index: 50;
        }

        .fab:hover {
          transform: translateY(-3px) scale(1.03);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .page {
            padding: 18px;
          }

          .top {
            flex-direction: column;
            align-items: stretch;
          }

          .addButtonInline {
            justify-content: center;
          }

          .fab {
            right: 18px;
            bottom: 18px;
            width: 56px;
            height: 56px;
          }
        }
      `}</style>
    </div>
  );
}