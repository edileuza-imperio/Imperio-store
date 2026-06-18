"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";

type Campanha = {
  id_campanha?: number | string;
  idCampanha?: number | string;
  id?: number | string;
  titulo?: string;
  nome?: string;
  slug?: string;
  descricao?: string | null;
  banner?: string | null;
  desktop?: string | null;
  mobile?: string | null;
  imagem?: string | null;
  statusid?: number | string;
  status_id?: number | string;
};

type VitrineItem = {
  id_vitrine_item?: number | string;
  campanha_id?: number | string | null;
  campanha_nome?: string | null;
  campanha_slug?: string | null;
  titulo_personalizado?: string | null;
  subtitulo_personalizado?: string | null;
  imagem_personalizada?: string | null;
  banner?: string | null;
  imagem?: string | null;
  campanha?: Campanha | null;
};

type Vitrine = {
  id_vitrine?: number | string;
  nome?: string;
  titulo?: string | null;
  subtitulo?: string | null;
  tipo?: string | null;
  itens?: VitrineItem[];
};

type Props = {
  vitrine?: Vitrine;
};

function extrairCampanhas(payload: any): Campanha[] {
  const opcoes = [
    payload?.dados?.campanhas,
    payload?.dados?.dados?.campanhas,
    payload?.campanhas,
    payload?.dados,
    payload,
  ];

  for (const lista of opcoes) {
    if (Array.isArray(lista)) return lista;
  }

  return [];
}

function isVitrineItem(item: Campanha | VitrineItem): item is VitrineItem {
  return (
    "campanha_id" in item ||
    "id_vitrine_item" in item ||
    "campanha_nome" in item ||
    "titulo_personalizado" in item
  );
}

function getId(item: Campanha | VitrineItem): number | string {
  if (isVitrineItem(item)) {
    return item.campanha_id || item.id_vitrine_item || "";
  }

  return item.id_campanha || item.idCampanha || item.id || "";
}

function getTitulo(item: Campanha | VitrineItem): string {
  if (isVitrineItem(item)) {
    return (
      item.titulo_personalizado ||
      item.campanha?.titulo ||
      item.campanha?.nome ||
      item.campanha_nome ||
      "Campanha"
    );
  }

  return item.titulo || item.nome || "Campanha";
}

function getDescricao(item: Campanha | VitrineItem): string | null {
  if (isVitrineItem(item)) {
    return item.subtitulo_personalizado || item.campanha?.descricao || null;
  }

  return item.descricao || null;
}

function getSlug(item: Campanha | VitrineItem): string {
  if (isVitrineItem(item)) {
    return item.campanha?.slug || item.campanha_slug || "";
  }

  return item.slug || "";
}

function getImagem(item: Campanha | VitrineItem): string | null {
  if (isVitrineItem(item)) {
    return (
      item.imagem_personalizada ||
      item.campanha?.banner ||
      item.campanha?.desktop ||
      item.campanha?.mobile ||
      item.campanha?.imagem ||
      item.banner ||
      item.imagem ||
      null
    );
  }

  return item.banner || item.desktop || item.mobile || item.imagem || null;
}

function campanhaAtiva(campanha: Campanha) {
  const status = Number(campanha.statusid ?? campanha.status_id ?? 1);
  return status === 1;
}

export default function Campanhas({ vitrine }: Props) {
  const [campanhasApi, setCampanhasApi] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(!vitrine);
  const [erro, setErro] = useState<string | null>(null);

  const usandoVitrine = Boolean(vitrine);

  useEffect(() => {
    if (usandoVitrine) return;

    async function carregarCampanhas() {
      try {
        setLoading(true);
        setErro(null);

        const response = await api.get("/campanhas", {
          withCredentials: true,
        });

        const lista = extrairCampanhas(response.data);
        setCampanhasApi(lista.filter(campanhaAtiva));
      } catch (error) {
        console.error("Erro ao carregar campanhas:", error);
        setErro("Erro ao carregar campanhas.");
        setCampanhasApi([]);
      } finally {
        setLoading(false);
      }
    }

    carregarCampanhas();
  }, [usandoVitrine]);

  const campanhas = useMemo<Array<Campanha | VitrineItem>>(() => {
    if (usandoVitrine) {
      return vitrine?.itens || [];
    }

    return campanhasApi;
  }, [usandoVitrine, vitrine, campanhasApi]);

  if (erro) return null;

  if (loading) {
    return (
      <section className="campanhas-section">
        <div className="campanhas-container">
          <div className="campanhas-header">
            <span>Campanhas</span>
            <h2>Carregando campanhas especiais...</h2>
          </div>

          <div className="campanhas-grid">
            <div className="campanhas-skeleton" />
            <div className="campanhas-skeleton" />
            <div className="campanhas-skeleton" />
          </div>
        </div>

        <style jsx>{css}</style>
      </section>
    );
  }

  if (!campanhas.length) return null;

  return (
    <section className="campanhas-section">
      <div className="campanhas-container">
        <div className="campanhas-header">
          <span>Campanhas</span>

          <h2>
            {vitrine?.titulo ||
              vitrine?.nome ||
              "Presentes para cada momento especial"}
          </h2>

          <p>
            {vitrine?.subtitulo ||
              "Explore campanhas exclusivas e encontre o presente ideal para cada ocasião."}
          </p>
        </div>

        <div className="campanhas-grid">
          {campanhas.map((campanha, index) => {
            const id = getId(campanha);
            const tituloOriginal = getTitulo(campanha);
            const titulo =
              tituloOriginal === "Campanha"
                ? "Campanha Especial"
                : tituloOriginal;

            const descricao = getDescricao(campanha);
            const slug = getSlug(campanha);
            const imagem = imagemFundo(getImagem(campanha));

            return (
              <Link
                key={`${id}-${index}`}
                href={slug ? `/campanha/${slug}` : "#"}
                className="campanhas-card"
                aria-label={`Ver campanha ${titulo}`}
              >
                <article className="campanhas-banner">
                  {imagem ? (
                    <Image
                      src={imagem}
                      alt={titulo}
                      fill
                      className="campanhas-image"
                      sizes="(max-width: 768px) 100vw, 420px"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="campanhas-fallback" />
                  )}

                  <div className="campanhas-overlay" />

                  <div className="campanhas-content">
                    <span className="campanhas-badge">Campanha Especial</span>

                    <h3>{titulo}</h3>

                    {descricao && <p>{descricao}</p>}

                    <span className="campanhas-button">
                      Ver campanha <b>→</b>
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{css}</style>
    </section>
  );
}

const css = `
  .campanhas-section {
    width: 100%;
    padding: 46px 16px;
    background:
      radial-gradient(circle at top left, rgba(184, 93, 112, 0.12), transparent 34rem),
      linear-gradient(180deg, #fff8f5 0%, #ffffff 48%, #fff8f5 100%);
  }

  .campanhas-container {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .campanhas-header {
    margin-bottom: 26px;
    text-align: center;
  }

  .campanhas-header span {
    color: #b85d70;
    font-weight: 950;
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
  }

  .campanhas-header h2 {
    margin: 8px auto 8px;
    max-width: 820px;
    font-size: clamp(1.7rem, 4vw, 2.6rem);
    color: #241b1f;
    line-height: 1.08;
  }

  .campanhas-header p {
    margin: 0 auto;
    max-width: 640px;
    color: #7b6870;
    font-weight: 650;
    line-height: 1.5;
  }

  .campanhas-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .campanhas-card {
    text-decoration: none;
    color: inherit;
    display: block;
  }

  .campanhas-banner {
    position: relative;
    min-height: 360px;
    border-radius: 28px;
    overflow: hidden;
    background:
      radial-gradient(circle at 80% 20%, rgba(255,255,255,.2), transparent 28%),
      linear-gradient(135deg, #3a171d 0%, #7d3948 52%, #b85d70 100%);
    box-shadow: 0 24px 58px rgba(80, 45, 54, 0.18);
    isolation: isolate;
  }

  .campanhas-banner::after {
    content: "";
    position: absolute;
    inset: 12px;
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,.18);
    pointer-events: none;
    z-index: 4;
  }

  .campanhas-image {
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .campanhas-card:hover .campanhas-image {
    transform: scale(1.06);
  }

  .campanhas-fallback {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 78% 28%, rgba(255,255,255,.2), transparent 25%),
      linear-gradient(135deg, #3a171d 0%, #7d3948 52%, #b85d70 100%);
  }

  .campanhas-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    background:
      linear-gradient(180deg, rgba(30, 18, 22, 0.05), rgba(30, 18, 22, 0.76)),
      linear-gradient(90deg, rgba(30, 18, 22, 0.78), rgba(30, 18, 22, 0.18));
  }

  .campanhas-content {
    position: relative;
    z-index: 3;
    min-height: 360px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .campanhas-badge {
    width: fit-content;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,.18);
    color: #fff;
    font-weight: 950;
    font-size: .72rem;
    backdrop-filter: blur(10px);
  }

  .campanhas-content h3 {
    margin: 14px 0 8px;
    color: #fff;
    font-size: clamp(1.45rem, 3vw, 2.15rem);
    line-height: 1.05;
    max-width: 94%;
  }

  .campanhas-content p {
    margin: 0 0 18px;
    color: rgba(255,255,255,.88);
    line-height: 1.45;
    font-weight: 600;
  }

  .campanhas-button {
    width: fit-content;
    padding: 12px 18px;
    border-radius: 999px;
    background: #fff;
    color: #874954;
    font-weight: 950;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 14px 30px rgba(0,0,0,.12);
  }

  .campanhas-button b {
    font-size: 1.1rem;
  }

  .campanhas-skeleton {
    min-height: 360px;
    border-radius: 28px;
    background: linear-gradient(90deg, #f8e9ed, #fff6f8, #f8e9ed);
    background-size: 200% 100%;
    animation: campanhas-loading 1.2s infinite;
  }

  @keyframes campanhas-loading {
    from {
      background-position: 200% 0;
    }

    to {
      background-position: -200% 0;
    }
  }

  @media (max-width: 980px) {
    .campanhas-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .campanhas-section {
      padding: 32px 12px;
    }

    .campanhas-grid {
      grid-template-columns: 1fr;
    }

    .campanhas-banner,
    .campanhas-content,
    .campanhas-skeleton {
      min-height: 300px;
    }

    .campanhas-content {
      padding: 24px;
    }
  }
`;