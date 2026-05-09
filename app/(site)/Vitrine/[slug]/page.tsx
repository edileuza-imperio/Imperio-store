"use client";

import { use, useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import { FiShoppingCart, FiEye, FiChevronRight } from "react-icons/fi";
import Navbar from "@/components/site/menu/navbar";


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
  process.env.NEXT_PUBLIC_API_URL ||
  "https://lightgrey-cattle-160990.hostingersite.com";

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
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarTitulo(slug: string) {
  return slug
    .split("-")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

function obterPrecoNumero(produto: Produto) {
  const valor = produto.preco_promocional || produto.preco;
  const numero = Number(valor);
  return Number.isNaN(numero) ? 0 : numero;
}

export default function VitrinePage({ params }: VitrinePageProps) {
  const { slug } = use(params);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [loading, setLoading] = useState(true);

  const [porPagina, setPorPagina] = useState(12);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState("relevancia");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);

        const vitrineRes = await api.get(`/vitrine/slug/${slug}`);
        const vitrineData: Vitrine | null =
          vitrineRes?.data?.dados?.dados ??
          vitrineRes?.data?.dados ??
          vitrineRes?.data ??
          null;

        setVitrine(vitrineData);

        if (!vitrineData?.id_vitrine) {
          setProdutos([]);
          return;
        }

        const itensRes = await api.get(`/vitrine/${vitrineData.id_vitrine}/itens`);
        const itens: Item[] =
          itensRes?.data?.dados?.dados ??
          itensRes?.data?.dados ??
          itensRes?.data ??
          [];

        const lista = await Promise.all(
          itens.map(async (item) => {
            if (!item.produto_id) return null;

            const res = await api.get(`/produto/${item.produto_id}`);
            const produto: Produto | null =
              res?.data?.dados?.dados ??
              res?.data?.dados ??
              res?.data ??
              null;

            if (!produto) return null;

            return {
              ...produto,
              nome: item.titulo_personalizado || produto.nome,
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

        setProdutos(lista.filter(Boolean) as Produto[]);
      } catch (err) {
        console.error("Erro ao carregar vitrine:", err);
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

  const produtosOrdenados = useMemo(() => {
    const lista = [...produtos];

    switch (ordenacao) {
      case "menor-preco":
        return lista.sort((a, b) => obterPrecoNumero(a) - obterPrecoNumero(b));
      case "maior-preco":
        return lista.sort((a, b) => obterPrecoNumero(b) - obterPrecoNumero(a));
      case "nome-az":
        return lista.sort((a, b) => a.nome.localeCompare(b.nome));
      case "nome-za":
        return lista.sort((a, b) => b.nome.localeCompare(a.nome));
      default:
        return lista;
    }
  }, [produtos, ordenacao]);

  const totalProdutos = produtosOrdenados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalProdutos / porPagina));

  const produtosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * porPagina;
    const fim = inicio + porPagina;
    return produtosOrdenados.slice(inicio, fim);
  }, [produtosOrdenados, paginaAtual, porPagina]);

  const inicioResultado = totalProdutos === 0 ? 0 : (paginaAtual - 1) * porPagina + 1;
  const fimResultado = Math.min(paginaAtual * porPagina, totalProdutos);

  return (
    <>
      <Navbar />

      <main className="pagina-vitrine">
        <section className="hero-vitrine">
          <div className="vitrine-container">
            <nav className="migalhas" aria-label="Breadcrumb">
              <Link href="/" className="migalha-link">
                Início
              </Link>
              <FiChevronRight className="migalha-icon" />
              <Link href="/vitrine" className="migalha-link">
                Vitrines
              </Link>
              <FiChevronRight className="migalha-icon" />
              <span className="migalha-atual">
                {vitrine?.titulo || vitrine?.nome || formatarTitulo(slug)}
              </span>
            </nav>

            <div className="hero-conteudo">
              <span className="hero-badge">Vitrine</span>

              <h1 className="vitrine-title">
                {vitrine?.titulo || vitrine?.nome || formatarTitulo(slug)}
              </h1>

              <p className="vitrine-subtitle">
                {vitrine?.subtitulo ||
                  "Explore todos os produtos desta vitrine com um visual moderno e profissional."}
              </p>
            </div>
          </div>
        </section>

        <section className="vitrine-produtos">
          <div className="vitrine-container">
            {loading ? (
              <div className="vitrine-loading">Carregando produtos...</div>
            ) : produtos.length === 0 ? (
              <div className="vitrine-empty">
                Nenhum produto encontrado nesta vitrine.
              </div>
            ) : (
              <>
                <div className="barra-catalogo">
                  <div className="barra-info">
                    <strong>{totalProdutos}</strong> produtos encontrados
                    <span className="barra-intervalo">
                      Mostrando {inicioResultado}–{fimResultado}
                    </span>
                  </div>

                  <div className="barra-controles">
                    <div className="controle">
                      <label htmlFor="ordenacao">Ordenar por</label>
                      <select
                        id="ordenacao"
                        value={ordenacao}
                        onChange={(e) => setOrdenacao(e.target.value)}
                      >
                        <option value="relevancia">Relevância</option>
                        <option value="menor-preco">Menor preço</option>
                        <option value="maior-preco">Maior preço</option>
                        <option value="nome-az">Nome A-Z</option>
                        <option value="nome-za">Nome Z-A</option>
                      </select>
                    </div>

                    <div className="controle">
                      <label htmlFor="porPagina">Por página</label>
                      <select
                        id="porPagina"
                        value={porPagina}
                        onChange={(e) => setPorPagina(Number(e.target.value))}
                      >
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={16}>16</option>
                        <option value={24}>24</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="vitrine-grid">
                  {produtosPaginados.map((produto) => {
                    const precoFinal = formatarPreco(
                      produto.preco_promocional || produto.preco
                    );

                    const precoOriginal =
                      produto.preco_promocional && produto.preco
                        ? formatarPreco(produto.preco)
                        : null;

                    return (
                      <article key={produto.id_produto} className="produto-card">
                        <div className="produto-img-wrap">
                          <Link
                            href={`/produto/${produto.slug || produto.id_produto}`}
                            className="produto-link-img"
                          >
                            {resolverImagem(produto.imagem) ? (
                              <img
                                src={resolverImagem(produto.imagem)}
                                alt={produto.nome}
                                className="produto-img"
                              />
                            ) : (
                              <div className="produto-sem-img">Sem imagem</div>
                            )}
                          </Link>

                          {produto.marca && (
                            <span className="produto-tag">{produto.marca}</span>
                          )}
                        </div>

                        <div className="produto-info">
                          <Link
                            href={`/produto/${produto.slug || produto.id_produto}`}
                            className="produto-link-titulo"
                          >
                            <h3 className="produto-title">{produto.nome}</h3>
                          </Link>

                          {produto.descricao && (
                            <p className="produto-desc">{produto.descricao}</p>
                          )}

                          <div className="produto-precos">
                            {precoOriginal && (
                              <span className="preco-original">{precoOriginal}</span>
                            )}
                            {precoFinal && (
                              <strong className="preco">{precoFinal}</strong>
                            )}
                          </div>

                          <div className="acoes">
                            <button type="button" className="btn-carrinho">
                              <FiShoppingCart />
                              <span>Carrinho</span>
                            </button>

                            <Link
                              href={`/produto/${produto.slug || produto.id_produto}`}
                              className="btn-ver"
                            >
                              <FiEye />
                              <span>Visualizar</span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPaginas > 1 && (
                  <div className="paginacao">
                    <button
                      type="button"
                      className="pagina-btn"
                      onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                    >
                      Anterior
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                      <button
                        key={pagina}
                        type="button"
                        className={`pagina-btn numero ${
                          paginaAtual === pagina ? "ativo" : ""
                        }`}
                        onClick={() => setPaginaAtual(pagina)}
                      >
                        {pagina}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="pagina-btn"
                      onClick={() =>
                        setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                      }
                      disabled={paginaAtual === totalPaginas}
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
    </>
  );
}