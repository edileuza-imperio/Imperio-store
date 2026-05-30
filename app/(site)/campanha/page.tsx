"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import api from "@/Api/conectar";
import { FiArrowRight } from "react-icons/fi";

import styles from "./Campanhas.module.css";

type Campanha = {
  id_campanha: number | string;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
  desktop?: string;
  mobile?: string;
  imagem?: string;
};

function extrairLista(payload: any): any[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

function resolverImagem(src?: string | null) {
  if (!src) return "";

  const valor = String(src).trim();
  if (!valor) return "";

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("data:image") ||
    valor.startsWith("blob:")
  ) {
    return valor;
  }

  const baseURL = api.defaults.baseURL || "";
  if (!baseURL) return valor;

  const caminho = valor.replace(/^\/+/, "");
  return `${baseURL}/${caminho}`;
}

function obterImagemCampanha(campanha: Campanha) {
  return resolverImagem(
    campanha.banner ||
      campanha.desktop ||
      campanha.mobile ||
      campanha.imagem ||
      ""
  );
}

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarCampanhas() {
      try {
        setLoading(true);

        const response = await api.get("/campanhas", {
          withCredentials: true,
        });

        const lista = extrairLista(response.data);
        setCampanhas(lista);
      } catch (error) {
        console.error("Erro ao carregar campanhas:", error);
        setCampanhas([]);
      } finally {
        setLoading(false);
      }
    }

    carregarCampanhas();
  }, []);

  if (loading) {
    return (
      <section className={styles.loadingSection}>
        <div className={styles.container}>
          <div className={styles.loadingBanner} />
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
        <div className={styles.grid}>
          {campanhas.map((campanha) => {
            const imagem = obterImagemCampanha(campanha);

            return (
              <article
                key={String(campanha.id_campanha)}
                className={styles.card}
              >
                <Link
                  href={`/campanha/${campanha.slug}`}
                  className={styles.link}
                >
                  <div className={styles.banner}>
                    {imagem ? (
                      <Image
                        src={imagem}
                        alt={campanha.titulo}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 96vw, 1440px"
                      />
                    ) : (
                      <div className={styles.noImage}>Sem imagem</div>
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

                      <div className={styles.button}>
                        <span>Ver campanha</span>
                        <FiArrowRight />
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}