"use client";

import { useMemo } from "react";
import Link from "next/link";

import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";
import useCategoria from "@/hooks/categoria/useCategoria";


type Categoria = {
  id_categoria?: number | string;
  nome?: string;
  slug?: string;
  icone?: string;
  descricao?: string;
  imagem?: string;
};

export default function ViewCategoriaPage() {
  const { categorias, loading, erro } = useCategoria();

  const lista = useMemo(() => {
    return Array.isArray(categorias) ? (categorias as Categoria[]) : [];
  }, [categorias]);

  return (
    <>
      <Navbar />

      <main className="viecategoria-page">
        <div className="viecategoria-container">
          <section className="hero">
            <div className="hero-content">
              <span className="hero-badge">Categorias</span>
              <h1 className="hero-title">Explore todas as categorias</h1>
              <p className="hero-subtitle">
                Navegue pelas categorias disponíveis e encontre os produtos do
                seu interesse com mais facilidade.
              </p>
            </div>
          </section>

          {loading && (
            <div className="state-box">
              <p>Carregando categorias...</p>
            </div>
          )}

          {!loading && erro && (
            <div className="state-box error">
              <p>Erro ao carregar categorias.</p>
            </div>
          )}

          {!loading && !erro && !lista.length && (
            <div className="state-box">
              <p>Nenhuma categoria encontrada.</p>
            </div>
          )}

          {!loading && !erro && !!lista.length && (
            <section className="section-grid">
              <div className="section-head">
                <h2 className="section-title">Categorias em destaque</h2>
                <p className="section-text">
                  Selecione uma categoria para visualizar mais detalhes.
                </p>
              </div>

              <div className="grid">
                {lista.map((categoria, index) => {
                  const nome = String(categoria?.nome || "Categoria");
                  const slug = String(categoria?.slug || "").trim();
                  const descricao =
                    String(categoria?.descricao || "").trim() ||
                    "Categoria disponível para navegação.";

                  const href = slug
                    ? `viecategoria/${encodeURIComponent(slug)}`
                    : "viecategoria";

                  return (
                    <Link
                      key={String(categoria?.id_categoria || categoria?.slug || index)}
                      href={href}
                      className={`card ${slug ? "" : "disabled"}`}
                    >
                      <div className="card-top">
                        <div className="icon-wrap">
                          <i
                            className={`bi ${categoria?.icone || "bi-grid"} icon`}
                          />
                        </div>

                        <span className="arrow">→</span>
                      </div>

                      <div className="card-body">
                        <h3 className="card-title">{nome}</h3>
                        <p className="card-description">{descricao}</p>
                        <span className="card-slug">
                          {slug || "Slug não informado"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <style jsx>{`
          .viecategoria-page {
            min-height: 100vh;
            background: linear-gradient(180deg, #fff7f3 0%, #fffaf7 45%, #ffffff 100%);
            padding: 28px 16px 60px;
          }

          .viecategoria-container {
            max-width: 1280px;
            margin: 0 auto;
          }

          .hero {
            position: relative;
            overflow: hidden;
            border-radius: 30px;
            padding: 48px 28px;
            margin-bottom: 28px;
            background: linear-gradient(135deg, #b76e79 0%, #cf9198 45%, #f4e6db 100%);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
          }

          .hero::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 30%),
              radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.16), transparent 35%);
            pointer-events: none;
          }

          .hero-content {
            position: relative;
            z-index: 2;
            max-width: 720px;
          }

          .hero-badge {
            display: inline-flex;
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(255, 248, 242, 0.72);
            color: #8e5560;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 16px;
          }

          .hero-title {
            margin: 0 0 14px;
            font-size: clamp(30px, 5vw, 52px);
            line-height: 1.08;
            color: #fffaf6;
            font-weight: 800;
          }

          .hero-subtitle {
            margin: 0;
            font-size: 16px;
            line-height: 1.75;
            color: #fff3ee;
            max-width: 620px;
          }

          .section-grid {
            margin-top: 8px;
          }

          .section-head {
            margin-bottom: 22px;
          }

          .section-title {
            margin: 0 0 8px;
            font-size: 30px;
            font-weight: 800;
            color: #2f2020;
          }

          .section-text {
            margin: 0;
            color: #7d6b6b;
            font-size: 15px;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 18px;
          }

          .card {
            display: flex;
            flex-direction: column;
            gap: 18px;
            min-height: 210px;
            padding: 22px;
            border-radius: 24px;
            text-decoration: none;
            background: #ffffff;
            border: 1px solid #f1dfda;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.05);
            transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          }

          .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.08);
            border-color: #e7c9c1;
          }

          .card.disabled {
            opacity: 0.7;
            pointer-events: none;
          }

          .card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .icon-wrap {
            width: 64px;
            height: 64px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #b76e79 0%, #f0ded4 100%);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);
          }

          .icon {
            font-size: 26px;
            color: #ffffff;
          }

          .arrow {
            font-size: 24px;
            font-weight: 700;
            color: #ba7480;
          }

          .card-body {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .card-title {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            color: #2f2020;
          }

          .card-description {
            margin: 0;
            color: #6d5c5c;
            line-height: 1.65;
            font-size: 14px;
          }

          .card-slug {
            margin-top: auto;
            display: inline-flex;
            width: fit-content;
            padding: 7px 12px;
            border-radius: 999px;
            background: #f9efea;
            color: #9d6570;
            font-size: 12px;
            font-weight: 700;
          }

          .state-box {
            padding: 26px;
            border-radius: 22px;
            background: #ffffff;
            border: 1px solid #f1dfda;
            text-align: center;
            color: #746363;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.04);
          }

          .state-box.error {
            color: #a74d5d;
          }

          @media (max-width: 768px) {
            .viecategoria-page {
              padding: 18px 12px 44px;
            }

            .hero {
              padding: 34px 18px;
              border-radius: 24px;
            }

            .section-title {
              font-size: 25px;
            }

            .grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>

      <FooterPrincipal />
    </>
  );
}