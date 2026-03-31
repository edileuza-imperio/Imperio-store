"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

type Props = {
  slug: string;
  tituloPersonalizado?: string;
  subtituloPersonalizado?: string;
  limite?: number;
  className?: string;
};

type Vitrine = {
  id_vitrine: number;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  tipo?: string;
  slug?: string;
  status?: number;
  ordem?: number;
};

type VitrineItem = {
  id_vitrine_item: number;
  vitrine_id?: number;
  produto_id?: number;
  campanha_id?: number;
  categoria_id?: number;
  banner_id?: number;
  ordem?: number;
  titulo_personalizado?: string;
  subtitulo_personalizado?: string;
  imagem_personalizada?: string;
  link_personalizado?: string;
  status?: number;
};

type EntidadeGenerica = {
  id?: number;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
  descricao_curta?: string;
  imagem?: string;
  banner?: string;
  foto?: string;
  desktop?: string;
  mobile?: string;
  slug?: string;
  link?: string;
  preco?: number | string;
  preco_promocional?: number | string;
};

type ItemResolvido = VitrineItem & {
  entidade: EntidadeGenerica | null;
  titulo_final: string;
  subtitulo_final: string;
  imagem_final: string;
  link_final: string;
  preco_final?: number | string | null;
};

export default function Destaques({
  slug,
  tituloPersonalizado,
  subtituloPersonalizado,
  limite,
  className = "",
}: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string>("");
  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [itens, setItens] = useState<ItemResolvido[]>([]);

  useEffect(() => {
    if (!slug) return;

    const carregarVitrine = async () => {
      try {
        setLoading(true);
        setErro("");

        const vitrineResponse = await api.get(`/vitrine/slug/${slug}`);
        const vitrineData: Vitrine | null =
          vitrineResponse?.data?.dados || vitrineResponse?.data || null;

        if (!vitrineData || !vitrineData.id_vitrine) {
          setErro("Vitrine não encontrada.");
          setVitrine(null);
          setItens([]);
          return;
        }

        setVitrine(vitrineData);

        const itensResponse = await api.get(
          `/vitrine/${vitrineData.id_vitrine}/itens`
        );

        let itensData: VitrineItem[] =
          itensResponse?.data?.dados || itensResponse?.data || [];

        if (!Array.isArray(itensData)) {
          itensData = [];
        }

        itensData = itensData.sort(
          (a: VitrineItem, b: VitrineItem) =>
            Number(a.ordem || 0) - Number(b.ordem || 0)
        );

        if (limite) {
          itensData = itensData.slice(0, limite);
        }

        const itensResolvidos: ItemResolvido[] = await Promise.all(
          itensData.map(async (item: VitrineItem): Promise<ItemResolvido> => {
            const tipo = String(vitrineData.tipo || "").toLowerCase();

            try {
              if (tipo === "produto" && item.produto_id) {
                const res = await api.get(`/produto/${item.produto_id}`);
                const produto: EntidadeGenerica =
                  res?.data?.dados || res?.data || {};

                return {
                  ...item,
                  entidade: produto,
                  titulo_final:
                    item.titulo_personalizado ||
                    produto.nome ||
                    produto.titulo ||
                    `Produto #${item.produto_id}`,
                  subtitulo_final:
                    item.subtitulo_personalizado ||
                    produto.subtitulo ||
                    produto.descricao_curta ||
                    "",
                  imagem_final:
                    item.imagem_personalizada ||
                    produto.imagem ||
                    produto.banner ||
                    produto.foto ||
                    "",
                  link_final:
                    item.link_personalizado ||
                    (produto.slug
                      ? `/produto/${produto.slug}`
                      : `/produto/${item.produto_id}`),
                  preco_final: produto.preco_promocional || produto.preco || null,
                };
              }

              if (tipo === "campanha" && item.campanha_id) {
                const res = await api.get(`/campanha/${item.campanha_id}`);
                const campanha: EntidadeGenerica =
                  res?.data?.dados || res?.data || {};

                return {
                  ...item,
                  entidade: campanha,
                  titulo_final:
                    item.titulo_personalizado ||
                    campanha.nome ||
                    campanha.titulo ||
                    `Campanha #${item.campanha_id}`,
                  subtitulo_final:
                    item.subtitulo_personalizado ||
                    campanha.subtitulo ||
                    campanha.descricao ||
                    "",
                  imagem_final:
                    item.imagem_personalizada ||
                    campanha.imagem ||
                    campanha.banner ||
                    "",
                  link_final:
                    item.link_personalizado ||
                    (campanha.slug
                      ? `/campanha/${campanha.slug}`
                      : `/campanha/${item.campanha_id}`),
                  preco_final: null,
                };
              }

              if (tipo === "categoria" && item.categoria_id) {
                const res = await api.get(`/categoria/${item.categoria_id}`);
                const categoria: EntidadeGenerica =
                  res?.data?.dados || res?.data || {};

                return {
                  ...item,
                  entidade: categoria,
                  titulo_final:
                    item.titulo_personalizado ||
                    categoria.nome ||
                    categoria.titulo ||
                    `Categoria #${item.categoria_id}`,
                  subtitulo_final:
                    item.subtitulo_personalizado || categoria.subtitulo || "",
                  imagem_final:
                    item.imagem_personalizada ||
                    categoria.imagem ||
                    categoria.banner ||
                    "",
                  link_final:
                    item.link_personalizado ||
                    (categoria.slug
                      ? `/categoria/${categoria.slug}`
                      : `/categoria/${item.categoria_id}`),
                  preco_final: null,
                };
              }

              if (tipo === "banner" && item.banner_id) {
                const res = await api.get(`/banner/${item.banner_id}`);
                const banner: EntidadeGenerica =
                  res?.data?.dados || res?.data || {};

                return {
                  ...item,
                  entidade: banner,
                  titulo_final:
                    item.titulo_personalizado ||
                    banner.nome ||
                    banner.titulo ||
                    `Banner #${item.banner_id}`,
                  subtitulo_final:
                    item.subtitulo_personalizado || banner.subtitulo || "",
                  imagem_final:
                    item.imagem_personalizada ||
                    banner.imagem ||
                    banner.desktop ||
                    banner.mobile ||
                    "",
                  link_final: item.link_personalizado || banner.link || "#",
                  preco_final: null,
                };
              }

              return {
                ...item,
                entidade: null,
                titulo_final: item.titulo_personalizado || "Item da vitrine",
                subtitulo_final: item.subtitulo_personalizado || "",
                imagem_final: item.imagem_personalizada || "",
                link_final: item.link_personalizado || "#",
                preco_final: null,
              };
            } catch {
              return {
                ...item,
                entidade: null,
                titulo_final: item.titulo_personalizado || "Item da vitrine",
                subtitulo_final: item.subtitulo_personalizado || "",
                imagem_final: item.imagem_personalizada || "",
                link_final: item.link_personalizado || "#",
                preco_final: null,
              };
            }
          })
        );

        setItens(itensResolvidos);
      } catch (error) {
        console.error("Erro ao carregar vitrine:", error);
        setErro("Não foi possível carregar a vitrine.");
        setVitrine(null);
        setItens([]);
      } finally {
        setLoading(false);
      }
    };

    carregarVitrine();
  }, [slug, limite]);

  if (loading) {
    return (
      <section className={`destaques-section ${className}`}>
        <div className="destaques-container">
          <div className="destaques-header loading-header">
            <span className="destaques-badge">Carregando</span>
            <h2 className="destaques-title">Buscando vitrine...</h2>
            <p className="destaques-description">
              Aguarde enquanto os itens são preparados para exibição.
            </p>
          </div>

          <div className="loading-grid">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="loading-card">
                <div className="loading-image" />
                <div className="loading-content">
                  <div className="loading-line small" />
                  <div className="loading-line" />
                  <div className="loading-line medium" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .destaques-section {
            width: 100%;
            padding: 72px 16px;
            background:
              radial-gradient(circle at top left, rgba(190, 132, 145, 0.12), transparent 28%),
              linear-gradient(180deg, #fffaf7 0%, #fff4ee 100%);
          }

          .destaques-container {
            max-width: 1280px;
            margin: 0 auto;
          }

          .loading-header {
            text-align: center;
            margin-bottom: 34px;
          }

          .destaques-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px;
            border-radius: 999px;
            background: rgba(163, 94, 111, 0.12);
            color: #9a5568;
            border: 1px solid rgba(154, 85, 104, 0.14);
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .destaques-title {
            margin: 16px 0 10px;
            font-size: 34px;
            font-weight: 800;
            line-height: 1.15;
            color: #5c2e3a;
          }

          .destaques-description {
            margin: 0 auto;
            max-width: 640px;
            color: #8c6670;
            font-size: 15px;
            line-height: 1.7;
          }

          .loading-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 22px;
          }

          .loading-card {
            background: rgba(255, 252, 249, 0.88);
            border: 1px solid rgba(170, 120, 133, 0.12);
            border-radius: 26px;
            overflow: hidden;
            box-shadow: 0 14px 35px rgba(147, 88, 104, 0.08);
          }

          .loading-image {
            height: 240px;
            background: linear-gradient(90deg, #f8ece6 25%, #f2ded6 50%, #f8ece6 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s infinite linear;
          }

          .loading-content {
            padding: 18px;
          }

          .loading-line {
            height: 14px;
            border-radius: 999px;
            margin-bottom: 12px;
            background: linear-gradient(90deg, #f8ece6 25%, #f2ded6 50%, #f8ece6 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s infinite linear;
          }

          .loading-line.small {
            width: 32%;
          }

          .loading-line.medium {
            width: 68%;
          }

          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }

          @media (max-width: 1100px) {
            .loading-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 600px) {
            .loading-grid {
              grid-template-columns: 1fr;
            }

            .destaques-title {
              font-size: 28px;
            }
          }
        `}</style>
      </section>
    );
  }

  if (erro || !vitrine) {
    return null;
  }

  return (
    <section className={`destaques-section ${className}`}>
      <div className="destaques-container">
        <div className="destaques-header">
          <div className="header-decoration left" />
          <div className="header-content">
            <span className="destaques-badge">{vitrine?.tipo || "Vitrine"}</span>

            <h2 className="destaques-title">
              {tituloPersonalizado || vitrine?.titulo || vitrine?.nome}
            </h2>

            {(subtituloPersonalizado || vitrine?.subtitulo) && (
              <p className="destaques-description">
                {subtituloPersonalizado || vitrine?.subtitulo}
              </p>
            )}
          </div>
          <div className="header-decoration right" />
        </div>

        <div className="destaques-grid">
          {itens.map((item) => (
            <Link
              key={item.id_vitrine_item}
              href={item.link_final || "#"}
              className="destaque-card"
            >
              <div className="destaque-imagem-wrap">
                {item.imagem_final ? (
                  <img
                    src={item.imagem_final}
                    alt={item.titulo_final}
                    className="destaque-imagem"
                  />
                ) : (
                  <div className="destaque-sem-imagem">
                    <span>Sem imagem</span>
                  </div>
                )}

                <div className="destaque-overlay" />

                <div className="destaque-topo-imagem">
                  <span className="destaque-tag">{vitrine?.tipo}</span>
                </div>
              </div>

              <div className="destaque-conteudo">
                <h3 className="destaque-titulo">{item.titulo_final}</h3>

                {item.subtitulo_final && (
                  <p className="destaque-subtitulo">{item.subtitulo_final}</p>
                )}

                <div className="destaque-footer">
                  {item.preco_final !== null &&
                    item.preco_final !== undefined &&
                    item.preco_final !== "" && (
                      <strong className="destaque-preco">
                        R$ {Number(item.preco_final).toFixed(2).replace(".", ",")}
                      </strong>
                    )}

                  <span className="destaque-link">
                    Ver mais
                    <span className="arrow">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .destaques-section {
          position: relative;
          width: 100%;
          padding: 78px 16px;
          background:
            radial-gradient(circle at top left, rgba(190, 132, 145, 0.16), transparent 24%),
            radial-gradient(circle at bottom right, rgba(214, 179, 157, 0.18), transparent 22%),
            linear-gradient(180deg, #fffaf7 0%, #fff4ee 52%, #fff9f6 100%);
          overflow: hidden;
        }

        .destaques-container {
          position: relative;
          max-width: 1280px;
          margin: 0 auto;
          z-index: 2;
        }

        .destaques-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 20px;
          margin-bottom: 38px;
        }

        .header-content {
          text-align: center;
        }

        .header-decoration {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(161, 95, 110, 0.25) 50%,
            transparent 100%
          );
        }

        .destaques-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(161, 95, 110, 0.12);
          border: 1px solid rgba(161, 95, 110, 0.15);
          color: #9c586a;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .destaques-title {
          margin: 16px 0 12px;
          font-size: 40px;
          line-height: 1.08;
          font-weight: 800;
          color: #5f2f3c;
          letter-spacing: -0.02em;
        }

        .destaques-description {
          max-width: 760px;
          margin: 0 auto;
          font-size: 16px;
          line-height: 1.8;
          color: #8d6972;
        }

        .destaques-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
        }

        .destaque-card {
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 100%;
          background: rgba(255, 252, 249, 0.92);
          border: 1px solid rgba(173, 118, 132, 0.12);
          border-radius: 28px;
          overflow: hidden;
          text-decoration: none;
          transition:
            transform 0.32s ease,
            box-shadow 0.32s ease,
            border-color 0.32s ease;
          box-shadow:
            0 18px 45px rgba(143, 89, 103, 0.08),
            0 2px 10px rgba(116, 69, 80, 0.04);
          backdrop-filter: blur(8px);
        }

        .destaque-card:hover {
          transform: translateY(-8px);
          border-color: rgba(161, 95, 110, 0.28);
          box-shadow:
            0 24px 50px rgba(143, 89, 103, 0.14),
            0 8px 24px rgba(116, 69, 80, 0.08);
        }

        .destaque-imagem-wrap {
          position: relative;
          width: 100%;
          height: 270px;
          background: linear-gradient(135deg, #f6e9e2 0%, #f1ddd4 100%);
          overflow: hidden;
        }

        .destaque-imagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.45s ease;
        }

        .destaque-card:hover .destaque-imagem {
          transform: scale(1.06);
        }

        .destaque-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(66, 32, 41, 0.03) 0%,
            rgba(66, 32, 41, 0.08) 55%,
            rgba(66, 32, 41, 0.18) 100%
          );
          pointer-events: none;
        }

        .destaque-topo-imagem {
          position: absolute;
          top: 14px;
          left: 14px;
          right: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
        }

        .destaque-sem-imagem {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9b7880;
          font-size: 15px;
          font-weight: 700;
          background:
            radial-gradient(circle at top, rgba(191, 138, 150, 0.2), transparent 35%),
            linear-gradient(135deg, #f8eee8 0%, #f0ddd4 100%);
        }

        .destaque-tag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 250, 247, 0.86);
          border: 1px solid rgba(161, 95, 110, 0.12);
          color: #8f5362;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          backdrop-filter: blur(8px);
        }

        .destaque-conteudo {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 22px 20px 20px;
          flex: 1;
          background: linear-gradient(180deg, rgba(255, 252, 249, 0.55) 0%, #fffaf7 100%);
        }

        .destaque-titulo {
          margin: 0;
          font-size: 21px;
          line-height: 1.28;
          font-weight: 800;
          color: #5f2f3c;
          letter-spacing: -0.01em;
        }

        .destaque-subtitulo {
          margin: 0;
          color: #87646d;
          font-size: 14px;
          line-height: 1.72;
        }

        .destaque-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 8px;
        }

        .destaque-preco {
          font-size: 22px;
          color: #9f5d6d;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .destaque-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #8e5361;
          font-weight: 800;
          font-size: 14px;
          transition: gap 0.25s ease, color 0.25s ease;
        }

        .destaque-card:hover .destaque-link {
          gap: 12px;
          color: #7d4453;
        }

        .arrow {
          font-size: 15px;
          line-height: 1;
        }

        @media (max-width: 1200px) {
          .destaques-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .destaques-header {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .header-decoration {
            display: none;
          }

          .destaques-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .destaques-title {
            font-size: 32px;
          }
        }

        @media (max-width: 640px) {
          .destaques-section {
            padding: 58px 14px;
          }

          .destaques-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .destaque-imagem-wrap {
            height: 240px;
          }

          .destaques-title {
            font-size: 27px;
          }

          .destaques-description {
            font-size: 14px;
            line-height: 1.7;
          }

          .destaque-titulo {
            font-size: 20px;
          }
        }
      `}</style>
    </section>
  );
}