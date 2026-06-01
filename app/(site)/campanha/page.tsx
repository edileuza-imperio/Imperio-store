"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import api from "@/Api/conectar";
import { FiArrowRight } from "react-icons/fi";
import styles from "./Campanhas.module.css";
import { imagemFundo } from "@/components/Bibioteca/imagem";

type Campanha = {
  id_campanha: number | string;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
  desktop?: string;
  mobile?: string;
  imagem?: string;
  statusid?: number;
};

function extrairLista(payload: any): Campanha[] {
  return payload?.dados?.dados || payload?.dados || payload || [];
}

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarCampanhas() {
      try {
        setLoading(true);

        const response = await api.get("/bootstrap/home", {
          withCredentials: true,
        });

        const lista = response.data?.dados?.dados?.campanhas || [];
        const validas = Array.isArray(lista)
          ? lista.filter((c: Campanha) => c?.statusid === 1)
          : [];

        setCampanhas(validas);
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
        <div className={styles.loadingBanner} />
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
            const imagem = imagemFundo(
              campanha.banner ||
                campanha.desktop ||
                campanha.mobile ||
                campanha.imagem ||
                ""
            );

            return (
              <Link
                key={campanha.id_campanha}
                href={`/campanha/${campanha.slug}`}
                className={styles.card}
              >
                <div
                  className={styles.banner}
                  style={
                    imagem
                      ? { backgroundImage: `url(${imagem})` }
                      : undefined
                  }
                >
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
                      Ver campanha <FiArrowRight />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}