"use client";

import { use, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import api from "@/Api/conectar";

import {
  FiShoppingCart,
  FiEye,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";

import styles from "./Vitrine.module.css";

type Produto = {
  id_produto: number;
  nome: string;
  slug?: string;
  descricao?: string;
  descricao_curta?: string;
  imagem?: string;
  miniatura?: string;
  banner?: string;
  foto?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  marca?: string;
};

type Item = {
  produto_id?: number;
  imagem_personalizada?: string;
  titulo_personalizado?: string;
  subtitulo_personalizado?: string;
};

type Vitrine = {
  id_vitrine: number;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  slug?: string;
};

type VitrinePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ;

function resolverImagem(src?: string) {
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

  if (valor.startsWith("/")) {
    return `${API_BASE}${valor}`;
  }

  return `${API_BASE}/${valor}`;
}

function formatarPreco(valor?: number | string) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return null;
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarTitulo(slug: string) {
  return slug
    .split("-")
    .map(
      (palavra) =>
        palavra.charAt(0).toUpperCase() +
        palavra.slice(1)
    )
    .join(" ");
}

function obterPrecoNumero(produto: Produto) {
  const valor =
    produto.preco_promocional ||
    produto.preco;

  const numero = Number(valor);

  return Number.isNaN(numero)
    ? 0
    : numero;
}

export default function VitrinePage({
  params,
}: VitrinePageProps) {
  const { slug } = use(params);

  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [vitrine, setVitrine] =
    useState<Vitrine | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [porPagina, setPorPagina] =
    useState(12);

  const [paginaAtual, setPaginaAtual] =
    useState(1);

  const [ordenacao, setOrdenacao] =
    useState("relevancia");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);

        const vitrineRes =
          await api.get(
            `/vitrine/slug/${slug}`
          );

        const vitrineData: Vitrine | null =
          vitrineRes?.data?.dados
            ?.dados ??
          vitrineRes?.data?.dados ??
          vitrineRes?.data ??
          null;

        setVitrine(vitrineData);

        if (
          !vitrineData?.id_vitrine
        ) {
          setProdutos([]);
          return;
        }

        const itensRes =
          await api.get(
            `/vitrine/${vitrineData.id_vitrine}/itens`
          );

        const itens: Item[] =
          itensRes?.data?.dados
            ?.dados ??
          itensRes?.data?.dados ??
          itensRes?.data ??
          [];

        const lista =
          await Promise.all(
            itens.map(async (item) => {
              if (
                !item.produto_id
              ) {
                return null;
              }

              const res =
                await api.get(
                  `/produto/${item.produto_id}`
                );

              const produto: Produto | null =
                res?.data?.dados
                  ?.dados ??
                res?.data?.dados ??
                res?.data ??
                null;

              if (!produto) {
                return null;
              }

              return {
                ...produto,

                nome:
                  item.titulo_personalizado ||
                  produto.nome,

                descricao:
                  item.subtitulo_personalizado ||
                  produto.descricao_curta ||
                  produto.descricao ||
                  "",

                imagem:
                  item.imagem_personalizada ||
                  produto.imagem ||
                  produto.miniatura ||
                  produto.banner ||
                  produto.foto ||
                  "",
              };
            })
          );

        setProdutos(
          lista.filter(
            Boolean
          ) as Produto[]
        );
      } catch (error) {
        console.error(
          "Erro ao carregar vitrine:",
          error
        );

        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [slug]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [porPagina, ordenacao]);

  const produtosOrdenados =
    useMemo(() => {
      const lista = [...produtos];

      switch (ordenacao) {
        case "menor-preco":
          return lista.sort(
            (a, b) =>
              obterPrecoNumero(a) -
              obterPrecoNumero(b)
          );

        case "maior-preco":
          return lista.sort(
            (a, b) =>
              obterPrecoNumero(b) -
              obterPrecoNumero(a)
          );

        case "nome-az":
          return lista.sort(
            (a, b) =>
              a.nome.localeCompare(
                b.nome
              )
          );

        case "nome-za":
          return lista.sort(
            (a, b) =>
              b.nome.localeCompare(
                a.nome
              )
          );

        default:
          return lista;
      }
    }, [produtos, ordenacao]);

  const totalProdutos =
    produtosOrdenados.length;

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      totalProdutos / porPagina
    )
  );

  const produtosPaginados =
    useMemo(() => {
      const inicio =
        (paginaAtual - 1) *
        porPagina;

      const fim =
        inicio + porPagina;

      return produtosOrdenados.slice(
        inicio,
        fim
      );
    }, [
      produtosOrdenados,
      paginaAtual,
      porPagina,
    ]);

  const inicioResultado =
    totalProdutos === 0
      ? 0
      : (paginaAtual - 1) *
          porPagina +
        1;

  const fimResultado = Math.min(
    paginaAtual * porPagina,
    totalProdutos
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.container}>
          <nav
            className={styles.breadcrumb}
          >
            <Link href="/">
              Início
            </Link>

            <FiChevronRight />

            <Link href="/vitrine">
              Vitrines
            </Link>

            <FiChevronRight />

            <span>
              {vitrine?.titulo ||
                vitrine?.nome ||
                formatarTitulo(
                  slug
                )}
            </span>
          </nav>

          <div
            className={
              styles.heroContent
            }
          >
            <span
              className={
                styles.badge
              }
            >
              Coleção Especial
            </span>

            <h1>
              {vitrine?.titulo ||
                vitrine?.nome ||
                formatarTitulo(
                  slug
                )}
            </h1>

            <p>
              {vitrine?.subtitulo ||
                "Produtos selecionados com um visual moderno, elegante e profissional."}
            </p>
          </div>
        </div>
      </section>

      <section
        className={styles.catalogo}
      >
        <div
          className={styles.container}
        >
          {loading ? (
            <div
              className={
                styles.loading
              }
            >
              <div
                className={
                  styles.spinner
                }
              />

              <span>
                Carregando
                produtos...
              </span>
            </div>
          ) : produtos.length ===
            0 ? (
            <div
              className={
                styles.empty
              }
            >
              <h2>
                Nenhum produto
              </h2>

              <p>
                Essa vitrine
                ainda não possui
                produtos.
              </p>
            </div>
          ) : (
            <>
              <div
                className={
                  styles.topbar
                }
              >
                <div
                  className={
                    styles.results
                  }
                >
                  <strong>
                    {
                      totalProdutos
                    }
                  </strong>

                  <span>
                    produtos
                    encontrados
                  </span>

                  <small>
                    Mostrando{" "}
                    {
                      inicioResultado
                    }{" "}
                    -{" "}
                    {
                      fimResultado
                    }
                  </small>
                </div>

                <div
                  className={
                    styles.controls
                  }
                >
                  <div
                    className={
                      styles.selectBox
                    }
                  >
                    <FiFilter />

                    <select
                      value={
                        ordenacao
                      }
                      onChange={(
                        e
                      ) =>
                        setOrdenacao(
                          e.target
                            .value
                        )
                      }
                    >
                      <option value="relevancia">
                        Relevância
                      </option>

                      <option value="menor-preco">
                        Menor preço
                      </option>

                      <option value="maior-preco">
                        Maior preço
                      </option>

                      <option value="nome-az">
                        Nome A-Z
                      </option>

                      <option value="nome-za">
                        Nome Z-A
                      </option>
                    </select>
                  </div>

                  <div
                    className={
                      styles.selectBox
                    }
                  >
                    <select
                      value={
                        porPagina
                      }
                      onChange={(
                        e
                      ) =>
                        setPorPagina(
                          Number(
                            e.target
                              .value
                          )
                        )
                      }
                    >
                      <option value={8}>
                        8
                      </option>

                      <option value={12}>
                        12
                      </option>

                      <option value={16}>
                        16
                      </option>

                      <option value={24}>
                        24
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div
                className={
                  styles.grid
                }
              >
                {produtosPaginados.map(
                  (produto) => {
                    const precoFinal =
                      formatarPreco(
                        produto.preco_promocional ||
                          produto.preco
                      );

                    const precoOriginal =
                      produto.preco_promocional &&
                      produto.preco
                        ? formatarPreco(
                            produto.preco
                          )
                        : null;

                    return (
                      <article
                        key={
                          produto.id_produto
                        }
                        className={
                          styles.card
                        }
                      >
                        <Link
                          href={`/produto/${
                            produto.slug ||
                            produto.id_produto
                          }`}
                          className={
                            styles.imageWrapper
                          }
                        >
                          {resolverImagem(
                            produto.imagem
                          ) ? (
                            <img
                              src={resolverImagem(
                                produto.imagem
                              )}
                              alt={
                                produto.nome
                              }
                              className={
                                styles.image
                              }
                            />
                          ) : (
                            <div
                              className={
                                styles.noImage
                              }
                            >
                              Sem
                              imagem
                            </div>
                          )}

                          {produto.marca && (
                            <span
                              className={
                                styles.tag
                              }
                            >
                              {
                                produto.marca
                              }
                            </span>
                          )}
                        </Link>

                        <div
                          className={
                            styles.info
                          }
                        >
                          <Link
                            href={`/produto/${
                              produto.slug ||
                              produto.id_produto
                            }`}
                            className={
                              styles.titleLink
                            }
                          >
                            <h3
                              className={
                                styles.title
                              }
                            >
                              {
                                produto.nome
                              }
                            </h3>
                          </Link>

                          <p
                            className={
                              styles.description
                            }
                          >
                            {produto.descricao ||
                              "Produto premium disponível nesta vitrine."}
                          </p>

                          <div
                            className={
                              styles.priceArea
                            }
                          >
                            {precoOriginal && (
                              <span
                                className={
                                  styles.oldPrice
                                }
                              >
                                {
                                  precoOriginal
                                }
                              </span>
                            )}

                            {precoFinal && (
                              <strong
                                className={
                                  styles.price
                                }
                              >
                                {
                                  precoFinal
                                }
                              </strong>
                            )}
                          </div>

                          <div
                            className={
                              styles.actions
                            }
                          >
                            <button
                              type="button"
                              className={
                                styles.cartButton
                              }
                            >
                              <FiShoppingCart />
                              Carrinho
                            </button>

                            <Link
                              href={`/produto/${
                                produto.slug ||
                                produto.id_produto
                              }`}
                              className={
                                styles.viewButton
                              }
                            >
                              <FiEye />
                              Ver
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>

              {totalPaginas >
                1 && (
                <div
                  className={
                    styles.pagination
                  }
                >
                  <button
                    onClick={() =>
                      setPaginaAtual(
                        (prev) =>
                          Math.max(
                            1,
                            prev - 1
                          )
                      )
                    }
                    disabled={
                      paginaAtual ===
                      1
                    }
                    className={
                      styles.pageButton
                    }
                  >
                    Anterior
                  </button>

                  {Array.from(
                    {
                      length:
                        totalPaginas,
                    },
                    (_, i) =>
                      i + 1
                  ).map((pagina) => (
                    <button
                      key={pagina}
                      onClick={() =>
                        setPaginaAtual(
                          pagina
                        )
                      }
                      className={`${styles.pageButton} ${
                        paginaAtual ===
                        pagina
                          ? styles.activePage
                          : ""
                      }`}
                    >
                      {pagina}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setPaginaAtual(
                        (prev) =>
                          Math.min(
                            totalPaginas,
                            prev + 1
                          )
                      )
                    }
                    disabled={
                      paginaAtual ===
                      totalPaginas
                    }
                    className={
                      styles.pageButton
                    }
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}