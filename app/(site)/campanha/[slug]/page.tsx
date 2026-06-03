"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";

import styles from "./Campanha.module.css";

import {
  ShoppingBag,
  Calendar,
  Package,
  ArrowRight,
} from "lucide-react";

import {
  useCampanha,
  resolverImagem,
} from "./use";

export default function CampanhaSlugPage() {
  const params = useParams();

  const slug =
    typeof params?.slug === "string"
      ? params.slug
      : params?.slug?.[0];

  const {
    campanha,
    produtos,
    loading,
    bannerImg,
    periodo,
  } = useCampanha(slug);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Carregando campanha...</p>
      </div>
    );
  }

  if (!campanha) {
    return (
      <div className={styles.emptyPage}>
        <div className={styles.emptyCard}>
          <span className={styles.badge}>
            Campanha
          </span>

          <h1>
            Campanha não encontrada
          </h1>

          <p>
            Verifique se o link da campanha está correto.
          </p>

          <Link
            href="/"
            className={styles.homeButton}
          >
            Voltar para home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        {bannerImg ? (
          <Image
            src={bannerImg}
            alt={campanha.titulo}
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
        ) : (
          <div
            className={styles.heroPlaceholder}
          />
        )}

        <div className={styles.overlay} />

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <ShoppingBag size={15} />
            Campanha Especial
          </div>

          <h1>{campanha.titulo}</h1>

          {campanha.descricao && (
            <p>{campanha.descricao}</p>
          )}

          <div className={styles.periodo}>
            <Calendar size={16} />
            <span>{periodo}</span>
          </div>
        </div>
      </section>

      <section className={styles.produtosSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.badge}>
                Produtos
              </span>

              <h2>
                Produtos da campanha
              </h2>
            </div>

            <div className={styles.total}>
              <Package size={18} />
              {produtos.length} produtos
            </div>
          </div>

          {produtos.length === 0 ? (
            <div className={styles.emptyProducts}>
              <Package size={60} />
              <h3>Nenhum produto</h3>
              <p>
                Ainda não existem produtos nessa campanha.
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {produtos.map((produto) => (
                <Link
                  key={produto.id_produto}
                  href={`/produto/${produto.slug}`}
                  className={styles.card}
                >
                  <div className={styles.imageBox}>
                    <Image
                      src={
                        resolverImagem(produto.imagem) ||
                        "/sem-imagem.png"
                      }
                      alt={produto.nome}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={styles.cardImage}
                    />
                  </div>

                  <div className={styles.cardContent}>
                    <h3>{produto.nome}</h3>

                    <p>
                      {produto.descricao ||
                        "Sem descrição disponível."}
                    </p>

                    <div className={styles.cardFooter}>
                      <strong>
                        {Number(
                          produto.preco || 0
                        ).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </strong>

                      <span className={styles.button}>
                        Ver produto
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}