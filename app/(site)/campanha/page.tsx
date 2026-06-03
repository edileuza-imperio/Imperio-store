"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./Campanhas.module.css";

import { useCampanhas } from "./useCampanhas";
import { imagemFundo } from "@/components/Bibioteca/imagem";

export default function Campanhas() {
  const { campanhas, loading, erro } = useCampanhas();

  if (loading) {
    return (
      <section className={styles.loadingSection}>
        <div className={styles.loadingBanner} />
      </section>
    );
  }

  if (erro || !campanhas.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {campanhas.map((campanha) => {
            const imagem = imagemFundo(
              campanha.banner ||
                campanha.desktop ||
                campanha.mobile ||
                campanha.imagem
            );

            return (
              <Link
                key={campanha.id_campanha}
                href={`/campanha/${campanha.slug}`}
                className={styles.card}
                aria-label={`Ver campanha ${campanha.titulo}`}
              >
                <article className={styles.banner}>
                  {imagem ? (
                    <Image
                      src={imagem}
                      alt={campanha.titulo}
                      fill
                      className={styles.image}
                      sizes="(max-width: 768px) 100vw, 1200px"
                      priority={false}
                    />
                  ) : (
                    <div className={styles.imageFallback} />
                  )}

                  <div className={styles.overlay} />

                  <div className={styles.content}>
                    <span className={styles.badge}>Campanha Especial</span>

                    <h2 className={styles.title}>{campanha.titulo}</h2>

                    {campanha.descricao && (
                      <p className={styles.description}>
                        {campanha.descricao}
                      </p>
                    )}

                    <span className={styles.button}>
                      Ver campanha <span className={styles.buttonArrow}>→</span>
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