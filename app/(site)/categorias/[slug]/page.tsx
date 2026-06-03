"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import styles from "./page.module.css";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { useCategoria } from "./useCategoria";

export default function ViewCategoriaSlugPage() {
  const params = useParams();
  const slugParam = String(params?.slug || "").trim().toLowerCase();

  const { categoria, produtos, loading, erro } = useCategoria(slugParam);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState("recentes");

  const produtosPorPagina = 10;

  useEffect(() => {
    setPaginaAtual(1);
  }, [ordenacao, produtos]);

  const formatarPreco = (valor?: number | string) => {
    if (valor === undefined || valor === null || valor === "") return "Sob consulta";

    const numero = Number(valor);
    if (Number.isNaN(numero)) return "Sob consulta";

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const produtosOrdenados = useMemo(() => {
    const lista = [...produtos];

    switch (ordenacao) {
      case "menor-preco":
        return lista.sort(
          (a, b) =>
            Number(a.preco_promocional || a.preco || 0) -
            Number(b.preco_promocional || b.preco || 0)
        );

      case "maior-preco":
        return lista.sort(
          (a, b) =>
            Number(b.preco_promocional || b.preco || 0) -
            Number(a.preco_promocional || a.preco || 0)
        );

      case "nome":
        return lista.sort((a, b) =>
          String(a.nome || "").localeCompare(String(b.nome || ""))
        );

      default:
        return lista;
    }
  }, [produtos, ordenacao]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosOrdenados.length / produtosPorPagina)
  );

  const produtosPaginados = produtosOrdenados.slice(
    (paginaAtual - 1) * produtosPorPagina,
    paginaAtual * produtosPorPagina
  );

  const categoriaDescricao =
    categoria?.descricao ||
    "Explore os produtos desta categoria com uma experiência visual mais refinada, leve e moderna.";

  const imagemCategoria = imagemFundo(categoria?.imagem);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>
            Início
          </Link>
          <span className={styles.separator}>/</span>
          <Link href="/categorias" className={styles.breadcrumbLink}>
            Categorias
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.breadcrumbCurrent}>
            {categoria?.nome || slugParam}
          </span>
        </nav>

        {loading && (
          <div className={styles.stateBox}>
            <div className={styles.loader} />
            <h2>Carregando produtos</h2>
            <p>Estamos preparando os itens desta categoria para você.</p>
          </div>
        )}

        {!loading && erro && (
          <div className={styles.stateBox}>
            <h2>Não foi possível carregar</h2>
            <p>{erro}</p>
            <Link href="/categorias" className={styles.backLink}>
              Voltar para categorias
            </Link>
          </div>
        )}

        {!loading && !erro && categoria && (
          <>
            <section className={styles.hero}>
              <div className={styles.heroBgOne} />
              <div className={styles.heroBgTwo} />

              <div className={styles.heroGrid}>
                <div className={styles.heroMain}>
                  <span className={styles.badge}>Universo Império</span>
                  <h1>{categoria.nome}</h1>
                  <p>{categoriaDescricao}</p>

                  <div className={styles.heroActions}>
                    <Link href="#produtos" className={styles.heroButtonPrimary}>
                      Ver produtos
                    </Link>
                    <span className={styles.heroHint}>
                      {produtos.length} itens disponíveis nesta categoria
                    </span>
                  </div>
                </div>

                <div className={styles.heroAside}>
                  {imagemCategoria ? (
                    <div className={styles.heroImageWrap}>
                      <Image
                        src={imagemCategoria}
                        alt={categoria.nome || "Categoria"}
                        fill
                        className={styles.heroImage}
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    </div>
                  ) : null}

                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{produtos.length}</span>
                    <span className={styles.statLabel}>produtos encontrados</span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{totalPaginas}</span>
                    <span className={styles.statLabel}>páginas de navegação</span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statValue}>Premium</span>
                    <span className={styles.statLabel}>apresentação visual</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.topBar} id="produtos">
              <div className={styles.topBarText}>
                <h2>Produtos encontrados</h2>
                <p>{produtos.length} itens disponíveis nesta categoria</p>
              </div>

              <div className={styles.controls}>
                <label className={styles.selectLabel}>
                  <span>Ordenar por</span>
                  <select
                    value={ordenacao}
                    onChange={(e) => setOrdenacao(e.target.value)}
                    className={styles.select}
                    aria-label="Ordenar produtos"
                  >
                    <option value="recentes">Mais recentes</option>
                    <option value="menor-preco">Menor preço</option>
                    <option value="maior-preco">Maior preço</option>
                    <option value="nome">Nome A-Z</option>
                  </select>
                </label>
              </div>
            </section>

            <section className={styles.grid}>
              {produtosPaginados.map((produto, index) => {
                const imagemResolvida =
                  produto.imagem_resolvida || imagemFundo(produto.imagem);
                const href = produto.slug ? `/produto/${produto.slug}` : null;

                const cardContent = (
                  <>
                    <div className={styles.imageWrap}>
                      {imagemResolvida ? (
                        <Image
                          src={imagemResolvida}
                          alt={produto.nome || "Produto"}
                          fill
                          className={styles.image}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized
                        />
                      ) : (
                        <Image
                          src="/placeholder.png"
                          alt={produto.nome || "Produto"}
                          fill
                          className={styles.image}
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      )}

                      <div className={styles.cardOverlay} />
                      <div className={styles.priceBadge}>
                        {formatarPreco(produto.preco_promocional || produto.preco)}
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>{produto.nome}</h3>
                        <span className={styles.cardIndex}>
                          {(paginaAtual - 1) * produtosPorPagina + index + 1}
                        </span>
                      </div>

                      <p className={styles.cardText}>
                        {produto.descricao
                          ? `${produto.descricao.slice(0, 120)}${
                              produto.descricao.length > 120 ? "..." : ""
                            }`
                          : "Produto sem descrição."}
                      </p>

                      <div className={styles.cardFooter}>
                        <span className={styles.metaText}>Clique para ver detalhes</span>
                        <span className={styles.cardActionText}>Ver produto →</span>
                      </div>
                    </div>
                  </>
                );

                return href ? (
                  <Link
                    key={produto.id_produto || `${produto.slug}-${index}`}
                    href={href}
                    className={styles.cardLink}
                    aria-label={`Ver produto ${produto.nome || ""}`}
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <article
                    key={produto.id_produto || `${produto.slug}-${index}`}
                    className={`${styles.cardLink} ${styles.cardDisabled}`}
                  >
                    {cardContent}
                  </article>
                );
              })}
            </section>

            {totalPaginas > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                >
                  Anterior
                </button>

                {Array.from({ length: totalPaginas }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPaginaAtual(index + 1)}
                    className={`${styles.pageButton} ${
                      paginaAtual === index + 1 ? styles.pageButtonActive : ""
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próxima
                </button>
              </div>
            )}

            {!produtos.length && (
              <div className={styles.emptyProducts}>
                <i className="bi bi-box-seam" />
                <h3>Nenhum produto encontrado</h3>
                <p>Não existe nenhum produto disponível nesta categoria no momento.</p>
                <Link href="/categorias" className={styles.backLink}>
                  Voltar para categorias
                </Link>
              </div>
            )}
          </>
        )}

        {!loading && !erro && !categoria && (
          <div className={styles.stateBox}>
            <h2>Categoria não encontrada</h2>
            <p>Essa categoria não existe ou foi removida.</p>
            <Link href="/categorias" className={styles.backLink}>
              Voltar para categorias
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}