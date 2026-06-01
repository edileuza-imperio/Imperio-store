"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import { Plus, FolderOpen, Tag, Sparkles, CircleCheckBig } from "lucide-react";

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

  const categoriasAtivas = categorias.filter((cat) => cat.status_id === 1)
    .length;

  return (
    <div className="page">
      <div className="content">
        <header className="hero">
          <div className="heroText">
            <div className="heroBadge">
              <Sparkles size={16} />
              <span>Administração</span>
            </div>

            <h1>Categorias</h1>
            <p>Gerencie as categorias cadastradas no sistema de forma simples e organizada.</p>
          </div>

          <Link href="/painel/categoria/nova" className="heroButton">
            <Plus size={18} />
            Nova categoria
          </Link>
        </header>

        <section className="statsGrid">
          <article className="statCard">
            <div className="statIcon total">
              <FolderOpen size={20} />
            </div>

            <div className="statInfo">
              <span>Total de categorias</span>
              <strong>{categorias.length}</strong>
            </div>
          </article>

          <article className="statCard">
            <div className="statIcon active">
              <CircleCheckBig size={20} />
            </div>

            <div className="statInfo">
              <span>Categorias ativas</span>
              <strong>{categoriasAtivas}</strong>
            </div>
          </article>
        </section>

        {loading ? (
          <div className="stateBox">
            <div className="spinner" />
            <p>Carregando categorias...</p>
          </div>
        ) : categorias.length === 0 ? (
          <div className="stateBox empty">
            <FolderOpen size={52} />
            <h3>Nenhuma categoria encontrada</h3>
            <p>Cadastre a primeira categoria para começar.</p>
          </div>
        ) : (
          <section className="list">
            {categorias.map((cat) => {
              const ativa = cat.status_id === 1;

              return (
                <article key={cat.id_categoria} className="item">
                  <div className="itemHeader">
                    <div className="badgeIcon">
                      <FolderOpen size={18} />
                    </div>

                    <span className="slug">{cat.slug}</span>
                  </div>

                  <h3>{cat.nome}</h3>

                  <p className={cat.descricao ? "description" : "emptyText"}>
                    {cat.descricao ? cat.descricao : "Sem descrição cadastrada."}
                  </p>

                  <div className="itemFooter">
                    <span className={`status ${ativa ? "on" : "off"}`}>
                      {ativa ? "Ativa" : "Inativa"}
                    </span>

                    <span className="meta">
                      <Tag size={14} />
                      ID {cat.id_categoria}
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      <Link
        href="/painel/categoria/nova"
        className="fab"
        aria-label="Nova categoria"
      >
        <Plus size={28} />
      </Link>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(123, 92, 255, 0.08), transparent 30%),
            radial-gradient(circle at top right, rgba(168, 93, 106, 0.08), transparent 28%),
            #f6f7fb;
        }

        .content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 28px;
          border-radius: 28px;
          background: linear-gradient(135deg, #ffffff, #fdfdfd);
          border: 1px solid #ececf2;
          box-shadow: 0 18px 50px rgba(20, 20, 43, 0.06);
          margin-bottom: 22px;
        }

        .heroText h1 {
          margin: 12px 0 0;
          font-size: 2rem;
          line-height: 1.1;
          color: #23212a;
        }

        .heroText p {
          margin: 10px 0 0;
          max-width: 620px;
          color: #666476;
          line-height: 1.6;
        }

        .heroBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #f1efff;
          color: #6b57ff;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .heroButton {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, #a85d6a, #d88b99);
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 14px 30px rgba(168, 93, 106, 0.25);
          transition: 0.25s ease;
        }

        .heroButton:hover {
          transform: translateY(-2px);
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .statCard {
          background: #fff;
          border: 1px solid #ececf2;
          border-radius: 20px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 10px 30px rgba(20, 20, 43, 0.04);
        }

        .statIcon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .statIcon.total {
          background: #f1efff;
          color: #6b57ff;
        }

        .statIcon.active {
          background: #eefaf1;
          color: #22a65a;
        }

        .statInfo span {
          display: block;
          color: #757285;
          font-size: 0.86rem;
        }

        .statInfo strong {
          display: block;
          margin-top: 4px;
          font-size: 1.5rem;
          color: #1f1d28;
        }

        .stateBox {
          background: #fff;
          border: 1px solid #ececf2;
          border-radius: 22px;
          padding: 56px 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(20, 20, 43, 0.04);
          color: #676479;
        }

        .stateBox.empty svg {
          color: #a85d6a;
        }

        .stateBox h3 {
          margin: 14px 0 8px;
          color: #1f1d28;
        }

        .stateBox p {
          margin: 0;
          color: #6f6d7d;
        }

        .spinner {
          width: 42px;
          height: 42px;
          margin: 0 auto;
          border: 4px solid #ececf2;
          border-top: 4px solid #a85d6a;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        .list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 18px;
          padding-bottom: 96px;
        }

        .item {
          background: #fff;
          border: 1px solid #ececf2;
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 10px 28px rgba(20, 20, 43, 0.05);
          transition: 0.25s ease;
        }

        .item:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(20, 20, 43, 0.09);
        }

        .itemHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .badgeIcon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1efff;
          color: #6b57ff;
          flex-shrink: 0;
        }

        .slug {
          display: inline-flex;
          align-items: center;
          max-width: 160px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f7f4ff;
          color: #6b57ff;
          font-size: 0.78rem;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item h3 {
          margin: 0;
          font-size: 1.05rem;
          color: #21202a;
        }

        .description,
        .emptyText {
          margin: 12px 0 0;
          line-height: 1.6;
          font-size: 0.93rem;
        }

        .description {
          color: #63616f;
        }

        .emptyText {
          color: #9a97a6;
          font-style: italic;
        }

        .itemFooter {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .status {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .status.on {
          background: #eefaf1;
          color: #22a65a;
        }

        .status.off {
          background: #fff3ef;
          color: #de6b4f;
        }

        .meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #7a7888;
          font-size: 0.82rem;
        }

        .fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #fff;
          background: linear-gradient(135deg, #a85d6a, #d88b99);
          box-shadow: 0 15px 40px rgba(168, 93, 106, 0.38);
          z-index: 999;
          transition: 0.25s ease;
        }

        .fab:hover {
          transform: translateY(-3px) scale(1.05);
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

          .hero {
            flex-direction: column;
            align-items: stretch;
            padding: 22px;
          }

          .heroText h1 {
            font-size: 1.7rem;
          }

          .heroButton {
            justify-content: center;
          }

          .fab {
            width: 60px;
            height: 60px;
            right: 18px;
            bottom: 18px;
          }

          .itemFooter {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}