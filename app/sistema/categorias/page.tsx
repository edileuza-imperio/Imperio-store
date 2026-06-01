"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  Plus,
  FolderOpen,
  Tag,
  Sparkles,
  Layers3,
  ArrowRight,
} from "lucide-react";

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
  const categoriasAtivas = categorias.filter((cat) => cat.status_id === 1).length;
  const categoriasInativas = totalCategorias - categoriasAtivas;

  return (
    <div className="page">
      <div className="bgGlow bgGlow1" />
      <div className="bgGlow bgGlow2" />

      <div className="container">
        <div className="hero">
          <div className="heroText">
            <div className="eyebrow">
              <Sparkles size={16} />
              <span>Gerenciamento inteligente</span>
            </div>

            <h1>Categorias</h1>
            <p>
              Gerencie todas as categorias do sistema com mais organização,
              clareza e rapidez.
            </p>
          </div>

          <div className="heroCard">
            <div className="heroCardIcon">
              <Layers3 size={22} />
            </div>

            <div>
              <span>Organização atual</span>
              <strong>{totalCategorias} categorias cadastradas</strong>
            </div>
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
            <div className="statIcon active">
              <Tag size={22} />
            </div>
            <div>
              <span>Categorias Ativas</span>
              <strong>{categoriasAtivas}</strong>
            </div>
          </div>

          <div className="statCard">
            <div className="statIcon inactive">
              <Layers3 size={22} />
            </div>
            <div>
              <span>Categorias Inativas</span>
              <strong>{categoriasInativas}</strong>
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
            <p>
              Crie a primeira categoria para começar a organizar o sistema.
            </p>

            <Link href="/painel/categoria/nova" className="emptyAction">
              <Plus size={18} />
              Nova categoria
            </Link>
          </div>
        ) : (
          <div className="grid">
            {categorias.map((cat) => {
              const ativa = cat.status_id === 1;

              return (
                <div key={cat.id_categoria} className="card">
                  <div className="cardTop">
                    <div className="cardIcon">
                      <FolderOpen size={18} />
                    </div>

                    <span className={`status ${ativa ? "active" : "inactive"}`}>
                      {ativa ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <h3>{cat.nome}</h3>

                  <div className="slugRow">
                    <Tag size={14} />
                    <span>{cat.slug}</span>
                  </div>

                  {cat.descricao ? (
                    <p>{cat.descricao}</p>
                  ) : (
                    <p className="muted">Nenhuma descrição cadastrada.</p>
                  )}

                  <div className="cardFooter">
                    <span>#{cat.id_categoria}</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/painel/categoria/nova"
        className="floatingButton"
        aria-label="Nova categoria"
      >
        <Plus size={30} />
      </Link>

      <style jsx>{`
        .page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 28px;
          background:
            radial-gradient(circle at top left, rgba(255, 228, 233, 0.95), transparent 30%),
            radial-gradient(circle at bottom right, rgba(245, 224, 231, 0.95), transparent 34%),
            linear-gradient(180deg, #fffdfd 0%, #faf6f7 100%);
        }

        .bgGlow {
          position: absolute;
          border-radius: 999px;
          filter: blur(70px);
          opacity: 0.45;
          pointer-events: none;
        }

        .bgGlow1 {
          width: 260px;
          height: 260px;
          top: -80px;
          left: -90px;
          background: #f5c7d2;
        }

        .bgGlow2 {
          width: 280px;
          height: 280px;
          bottom: -120px;
          right: -100px;
          background: #d9b0bb;
        }

        .container {
          position: relative;
          z-index: 1;
          max-width: 1240px;
          margin: 0 auto;
          padding-bottom: 100px;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 18px;
          align-items: stretch;
          margin-bottom: 22px;
        }

        .heroText,
        .heroCard,
        .statCard,
        .empty,
        .card {
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid rgba(236, 224, 226, 0.95);
          box-shadow: 0 14px 34px rgba(64, 34, 41, 0.06);
        }

        .heroText {
          border-radius: 28px;
          padding: 26px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #fdecef;
          color: #a85d6a;
          font-size: 0.82rem;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .heroText h1 {
          margin: 0;
          font-size: clamp(2rem, 3vw, 3rem);
          line-height: 1.05;
          font-weight: 900;
          color: #2f2425;
          letter-spacing: -0.04em;
        }

        .heroText p {
          margin: 12px 0 0;
          max-width: 60ch;
          color: #7c6a6d;
          font-size: 0.98rem;
          line-height: 1.7;
        }

        .heroCard {
          border-radius: 28px;
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 14px;
          justify-content: flex-start;
        }

        .heroCardIcon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fdecef, #f7d8df);
          color: #9f5b68;
          flex-shrink: 0;
        }

        .heroCard span {
          display: block;
          font-size: 0.82rem;
          color: #8b777a;
          margin-bottom: 4px;
        }

        .heroCard strong {
          display: block;
          font-size: 1.05rem;
          line-height: 1.4;
          color: #2f2425;
          font-weight: 800;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 26px;
        }

        .statCard {
          border-radius: 24px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .statIcon {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fdecef, #f7d8df);
          color: #a85d6a;
          flex-shrink: 0;
        }

        .statIcon.active {
          background: linear-gradient(135deg, #e8f8ef, #d9f0e3);
          color: #2f8b57;
        }

        .statIcon.inactive {
          background: linear-gradient(135deg, #f5f0f3, #ece3e8);
          color: #8a6c76;
        }

        .statCard span {
          display: block;
          font-size: 0.83rem;
          color: #8b777a;
        }

        .statCard strong {
          display: block;
          margin-top: 4px;
          font-size: 1.6rem;
          font-weight: 900;
          color: #2f2425;
          letter-spacing: -0.03em;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 340px;
          color: #7b6a6d;
        }

        .spinner {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 4px solid #ead9db;
          border-top-color: #b26a77;
          animation: spin 0.9s linear infinite;
        }

        .empty {
          border-radius: 28px;
          padding: 78px 24px;
          text-align: center;
        }

        .emptyIcon {
          width: 82px;
          height: 82px;
          margin: 0 auto 18px;
          border-radius: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fdecef, #f7d8df);
          color: #b26a77;
        }

        .empty h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: #342829;
        }

        .empty p {
          margin: 10px 0 0;
          color: #7b6a6d;
          line-height: 1.7;
        }

        .emptyAction {
          margin-top: 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, #c37c88, #8c4f5c);
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          box-shadow: 0 14px 28px rgba(140, 79, 92, 0.25);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 18px;
        }

        .card {
          border-radius: 26px;
          padding: 20px;
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(64, 34, 41, 0.1);
          border-color: #e6d3d7;
        }

        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .cardIcon {
          width: 42px;
          height: 42px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fdf1f3;
          color: #b26a77;
          flex-shrink: 0;
        }

        .status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .status.active {
          background: #e8f8ef;
          color: #2f8b57;
        }

        .status.inactive {
          background: #f3edf1;
          color: #8a6c76;
        }

        .card h3 {
          margin: 0;
          color: #2f2425;
          font-size: 1.1rem;
          font-weight: 900;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }

        .slugRow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 7px 11px;
          border-radius: 999px;
          background: #fdf1f3;
          color: #a85d6a;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .slugRow span {
          word-break: break-word;
        }

        .card p {
          margin: 14px 0 0;
          color: #6f6062;
          line-height: 1.7;
          font-size: 0.94rem;
        }

        .muted {
          font-style: italic;
          color: #9a8b8d !important;
        }

        .cardFooter {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #f0e4e6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #8b777a;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .floatingButton {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #c37c88, #8c4f5c);
          color: #fff;
          text-decoration: none;
          box-shadow: 0 18px 40px rgba(140, 79, 92, 0.35);
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            filter 0.25s ease;
          z-index: 9999;
        }

        .floatingButton:hover {
          transform: translateY(-6px) scale(1.05);
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

        @media (max-width: 980px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .statsGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 16px;
          }

          .heroText,
          .heroCard,
          .statCard,
          .empty,
          .card {
            border-radius: 22px;
          }

          .statsGrid {
            grid-template-columns: 1fr;
          }

          .heroText h1 {
            font-size: 1.8rem;
          }

          .floatingButton {
            width: 60px;
            height: 60px;
            right: 16px;
            bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
}