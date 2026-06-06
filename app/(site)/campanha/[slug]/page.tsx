"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import styles from "./Campanha.module.css";
import { ShoppingBag, Calendar, Package, ArrowRight } from "lucide-react";
import { imagemFundo, useCampanha } from "./useCampanha";

export default function CampanhaSlugPage() {
  const params = useParams();

  const slug =
    typeof (params as any)?.slug === "string"
      ? ((params as any).slug as string)
      : ((params as any)?.slug?.[0] as string | undefined);

  const { campanha, produtos, loading, bannerImg, periodo } =
    useCampanha(slug);

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
          <span className={styles.badge}>Campanha</span>
          <h1>Campanha não encontrada</h1>
          <p>Verifique se o link da campanha está correto.</p>
          <Link href="/" className={styles.homeButton}>
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
            alt={campanha.titulo || "Banner da campanha"}
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
        ) : (
          <div className={styles.heroPlaceholder} />
        )}

        <div className={styles.overlay} />

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <ShoppingBag size={15} />
            Campanha Especial
          </div>

          <h1>{campanha.titulo}</h1>

          {campanha.descricao && <p>{campanha.descricao}</p>}

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
              <span className={styles.badge}>Produtos</span>
              <h2>Produtos da campanha</h2>
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
              <p>Ainda não existem produtos nessa campanha.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {produtos.map((produto) => {
                const produtoImg =
                  imagemFundo(produto.imagem) || "/sem-imagem.png";

                return (
                  <Link
                    key={produto.id_produto}
                    href={`/produto/${produto.slug || produto.id_produto}`}
                    className={styles.card}
                  >
                    <div className={styles.imageBox}>
                      <Image
                        src={produtoImg}
                        alt={produto.nome || "Produto"}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={styles.productImage}
                      />
                    </div>

                    <div className={styles.cardContent}>
                      <h3>{produto.nome}</h3>
                      <p>{produto.descricao || "Sem descrição disponível."}</p>

                      <div className={styles.cardFooter}>
                        <strong>
                          R${" "}
                          {Number(produto.preco || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </strong>

                        <span className={styles.button}>
                          Ver produto
                          <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}