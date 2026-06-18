"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./Campanhas.module.css";

import { useCampanhas } from "./useCampanhas";
import { imagemFundo } from "@/components/Bibioteca/imagem";

type Campanha = {
  id_campanha?: number;
  idCampanha?: number;
  id?: number;
  titulo?: string;
  nome?: string;
  slug?: string;
  descricao?: string | null;
  banner?: string | null;
  desktop?: string | null;
  mobile?: string | null;
  imagem?: string | null;
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
  itens?: VitrineItem[];
};

type Props = {
  vitrine?: Vitrine;
};

function isVitrineItem(item: Campanha | VitrineItem): item is VitrineItem {
  return (
    "campanha_id" in item ||
    "id_vitrine_item" in item ||
    "campanha_nome" in item ||
    "titulo_personalizado" in item
  );
}

function getCampanhaId(item: Campanha | VitrineItem): number {
  if (isVitrineItem(item)) {
    return Number(item.campanha_id ?? item.id_vitrine_item ?? 0);
  }

  return Number(item.id_campanha ?? item.idCampanha ?? item.id ?? 0);
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

export default function Campanhas({ vitrine }: Props) {
  const campanhasHook = useCampanhas();

  const usandoVitrine = Boolean(vitrine);

  const campanhas: Array<Campanha | VitrineItem> = usandoVitrine
    ? vitrine?.itens || []
    : campanhasHook.campanhas || [];

  const loading = usandoVitrine ? false : campanhasHook.loading;
  const erro = usandoVitrine ? null : campanhasHook.erro;

  if (erro) return null;

  if (loading) {
    return (
      <section className={styles.section} aria-label="Carregando campanhas">
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.cardSkeleton}>
              <div className={styles.banner}>
                <div className={styles.loadingBanner} />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!campanhas.length) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {vitrine && (
          <div className={styles.header}>
            <span className={styles.kicker}>Campanhas</span>

            <h2 className={styles.heading}>
              {vitrine.titulo || vitrine.nome || "Campanhas especiais"}
            </h2>

            {vitrine.subtitulo && (
              <p className={styles.subheading}>{vitrine.subtitulo}</p>
            )}
          </div>
        )}

        <div className={styles.grid}>
          {campanhas.map((campanha, index) => {
            const id = getCampanhaId(campanha);
            const titulo = getTitulo(campanha);
            const descricao = getDescricao(campanha);
            const slug = getSlug(campanha);
            const imagem = imagemFundo(getImagem(campanha));

            return (
              <Link
                key={`${id}-${index}`}
                href={slug ? `/campanha/${slug}` : "#"}
                className={styles.card}
                aria-label={`Ver campanha ${titulo}`}
              >
                <article className={styles.banner}>
                  {imagem ? (
                    <Image
                      src={imagem}
                      alt={titulo}
                      fill
                      className={styles.image}
                      sizes="(max-width: 768px) 100vw, 1200px"
                      priority={index === 0}
                    />
                  ) : (
                    <div className={styles.imageFallback} />
                  )}

                  <div className={styles.overlay} />

                  <div className={styles.content}>
                    <span className={styles.badge}>Campanha Especial</span>

                    <h2 className={styles.title}>{titulo}</h2>

                    {descricao && (
                      <p className={styles.description}>{descricao}</p>
                    )}

                    <span className={styles.button}>
                      Ver campanha
                      <span className={styles.buttonArrow}>→</span>
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}