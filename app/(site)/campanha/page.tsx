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
          <div className="campanhas-grid">
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
        {vitrine && (
          <div className="campanhas-header">
            <span>Campanhas</span>
            <h2>{vitrine.titulo || vitrine.nome || "Campanhas especiais"}</h2>

            {vitrine.subtitulo && <p>{vitrine.subtitulo}</p>}
          </div>
        )}

        <div className="campanhas-grid">
          {campanhas.map((campanha, index) => {
            const id = getId(campanha);
            const titulo = getTitulo(campanha);
            const descricao = getDescricao(campanha);
            const slug = getSlug(campanha);
            const imagem = imagemFundo(getImagem(campanha));

            return (
              <Link
                key={`${id}-${index}`}
                href={slug ? `/campanha/${slug}` : "#"}
                className="campanhas-card"
              >
                <article className="campanhas-banner">
                  {imagem ? (
                    <Image
                      src={imagem}
                      alt={titulo}
                      fill
                      className="campanhas-image"
                      sizes="(max-width: 768px) 100vw, 1200px"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="campanhas-fallback" />
                  )}

                  <div className="campanhas-overlay" />

                  <div className="campanhas-content">
                    <span className="campanhas-badge">Campanha Especial</span>
                    <h2>{titulo}</h2>

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
    padding: 34px 16px;
  }

  .campanhas-container {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .campanhas-header {
    margin-bottom: 18px;
    text-align: center;
  }

  .campanhas-header span {
    color: #b85d70;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
  }

  .campanhas-header h2 {
    margin: 6px 0;
    font-size: clamp(1.5rem, 4vw, 2.3rem);
    color: #35272b;
  }

  .campanhas-header p {
    margin: 0;
    color: #7b6870;
  }

  .campanhas-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .campanhas-card {
    text-decoration: none;
    color: inherit;
  }

  .campanhas-banner {
    position: relative;
    min-height: 280px;
    border-radius: 30px;
    overflow: hidden;
    background: #fff1f4;
    box-shadow: 0 22px 50px rgba(80, 45, 54, 0.16);
  }

  .campanhas-image {
    object-fit: cover;
    transition: transform 0.35s ease;
  }

  .campanhas-card:hover .campanhas-image {
    transform: scale(1.04);
  }

  .campanhas-fallback {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #b85d70, #874954);
  }

  .campanhas-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(30, 18, 22, 0.78), rgba(30, 18, 22, 0.28)),
      linear-gradient(0deg, rgba(0, 0, 0, 0.24), transparent);
  }

  .campanhas-content {
    position: relative;
    z-index: 2;
    min-height: 280px;
    padding: 34px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 620px;
  }

  .campanhas-badge {
    width: fit-content;
    padding: 8px 13px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    color: #fff;
    font-weight: 900;
    font-size: 0.78rem;
    backdrop-filter: blur(8px);
  }

  .campanhas-content h2 {
    margin: 14px 0 8px;
    color: #fff;
    font-size: clamp(1.7rem, 5vw, 3rem);
    line-height: 1.05;
  }

  .campanhas-content p {
    margin: 0 0 18px;
    color: rgba(255, 255, 255, 0.88);
    font-size: 1rem;
    line-height: 1.5;
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
  }

  .campanhas-button b {
    font-size: 1.15rem;
  }

  .campanhas-skeleton {
    min-height: 280px;
    border-radius: 30px;
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

  @media (max-width: 640px) {
    .campanhas-section {
      padding: 24px 12px;
    }

    .campanhas-banner,
    .campanhas-content {
      min-height: 230px;
    }

    .campanhas-content {
      padding: 24px;
    }
  }
`;