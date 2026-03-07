"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/Api/conectar";
import Link from "next/link";

import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

type Produto = {
  id_produto: number;
  nome: string;
  preco: string | number;
  preco_promocional?: string | number;
  imagem?: string;
  slug?: string;
  categoria_nome?: string;
  estoque?: number;
  ilimitado?: number;
  descricao?: string;
};

function formatMoney(valor: string | number | undefined) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "/sem-imagem.png";

  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  const clean = String(caminho).replace(/^\/+/, "");

  return `${base}/${clean}`;
}

function resumoDescricao(texto?: string, limite = 88) {
  if (!texto) return "Produto disponível nesta categoria.";
  const limpa = texto.replace(/\s+/g, " ").trim();
  if (limpa.length <= limite) return limpa;
  return `${limpa.slice(0, limite).trim()}...`;
}

export default function CategoriaPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  async function carregarProdutos() {
    try {
      setLoading(true);
      setErro(null);

      const res = await api.get(`/produtos/categoria/${id}`);
      const lista = Array.isArray(res.data?.dados)
        ? res.data.dados
        : Array.isArray(res.data)
        ? res.data
        : [];

      setProdutos(lista);
    } catch (error) {
      console.error("Erro ao carregar produtos da categoria", error);
      setErro("Não foi possível carregar os produtos desta categoria.");
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarAoCarrinho(produtoId: number) {
    try {
      setAddingId(produtoId);

      await api.post("/carrinho/adicionar", {
        produto_id: produtoId,
        quantidade: 1,
      });

      alert("Produto adicionado ao carrinho com sucesso!");
    } catch (error: any) {
      console.error("Erro ao adicionar ao carrinho", error);

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        "Não foi possível adicionar o produto ao carrinho.";

      alert(mensagem);
    } finally {
      setAddingId(null);
    }
  }

  useEffect(() => {
    if (id) {
      carregarProdutos();
    }
  }, [id]);

  const nomeCategoria = useMemo(() => {
    if (!produtos.length) return "Categoria";
    return produtos[0]?.categoria_nome || "Categoria";
  }, [produtos]);

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator">›</span>
            <Link href="/categoria">Categorias</Link>
            <span className="separator">›</span>
            <span className="current">{nomeCategoria}</span>
          </div>

          <section className="hero">
            <div className="heroContent">
              <div className="heroText">
                <span className="badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L15.09 8.26H22L17.82 12.44L20.91 18.7L12 14.52L3.09 18.7L6.18 12.44L2 8.26H8.91L12 2Z" />
                  </svg>
                  Categoria
                </span>
                <h1>{nomeCategoria}</h1>
                <p>
                  Explore nossa seleção de produtos nesta categoria. Encontre exatamente o que você procura com preços competitivos e qualidade garantida.
                </p>
              </div>

              <div className="heroStats">
                <div className="statCard">
                  <div className="statNumber">{produtos.length}</div>
                  <div className="statLabel">{produtos.length === 1 ? "Produto" : "Produtos"}</div>
                </div>
              </div>
            </div>
          </section>

          {loading && (
            <div className="stateContainer">
              <div className="stateBox loading">
                <div className="spinner"></div>
                <h3>Carregando produtos...</h3>
                <p>Aguarde enquanto buscamos os itens desta categoria.</p>
              </div>
            </div>
          )}

          {!loading && erro && (
            <div className="stateContainer">
              <div className="stateBox error">
                <div className="errorIcon">⚠️</div>
                <h3>Oops! Algo deu errado</h3>
                <p>{erro}</p>
                <button type="button" className="retryBtn" onClick={carregarProdutos}>
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {!loading && !erro && produtos.length === 0 && (
            <div className="stateContainer">
              <div className="stateBox empty">
                <div className="emptyIcon">📦</div>
                <h3>Nenhum produto encontrado</h3>
                <p>Essa categoria ainda não possui produtos cadastrados. Volte em breve!</p>
              </div>
            </div>
          )}

          {!loading && !erro && produtos.length > 0 && (
            <section className="productsGrid">
              {produtos.map((produto) => {
                const precoPromocional = Number(produto.preco_promocional || 0);
                const precoNormal = Number(produto.preco || 0);
                const precoFinal =
                  precoPromocional > 0 ? precoPromocional : precoNormal;

                const semEstoque =
                  Number(produto.ilimitado || 0) !== 1 &&
                  Number(produto.estoque || 0) <= 0;

                const percentualDesconto = precoPromocional > 0
                  ? Math.round(((precoNormal - precoPromocional) / precoNormal) * 100)
                  : 0;

                return (
                  <article key={produto.id_produto} className="productCard">
                    <div className="imageContainer">
                      <Link
                        href={`/produto/${produto.slug || produto.id_produto}`}
                        className="imageLink"
                      >
                        <img
                          src={getImagemUrl(produto.imagem)}
                          alt={produto.nome}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/sem-imagem.png";
                          }}
                        />
                      </Link>

                      {precoPromocional > 0 && (
                        <div className="badges">
                          <span className="discountBadge">-{percentualDesconto}%</span>
                        </div>
                      )}

                      {semEstoque && <div className="outOfStockOverlay">Sem estoque</div>}
                    </div>

                    <div className="cardContent">
                      <span className="categoryTag">{produto.categoria_nome || nomeCategoria}</span>

                      <Link
                        href={`/produto/${produto.slug || produto.id_produto}`}
                        className="productTitle"
                      >
                        <h3 title={produto.nome}>{produto.nome}</h3>
                      </Link>

                      <p className="productDesc">{resumoDescricao(produto.descricao)}</p>

                      <div className="priceSection">
                        {precoPromocional > 0 && (
                          <span className="originalPrice">{formatMoney(precoNormal)}</span>
                        )}
                        <span className="finalPrice">{formatMoney(precoFinal)}</span>
                      </div>

                      <div className="stockStatus">
                        {semEstoque ? (
                          <span className="badge-stock out">
                            <span className="dot"></span>
                            Sem estoque
                          </span>
                        ) : (
                          <span className="badge-stock in">
                            <span className="dot"></span>
                            {Number(produto.ilimitado || 0) === 1
                              ? "Disponível"
                              : `Estoque: ${produto.estoque ?? 0}`}
                          </span>
                        )}
                      </div>

                      <div className="actionButtons">
                        <button
                          type="button"
                          className="btnPrimary"
                          onClick={() => adicionarAoCarrinho(produto.id_produto)}
                          disabled={semEstoque || addingId === produto.id_produto}
                          title={semEstoque ? "Produto sem estoque" : "Adicionar ao carrinho"}
                        >
                          {addingId === produto.id_produto ? (
                            <>
                              <span className="spinner-mini"></span>
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                              </svg>
                              Carrinho
                            </>
                          )}
                        </button>

                        <Link
                          href={`/produto/${produto.slug || produto.id_produto}`}
                          className="btnSecondary"
                          title="Ver detalhes do produto"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Detalhes
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <FooterPrincipal />

      
    </>
  );
}