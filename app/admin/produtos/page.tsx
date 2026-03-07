"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiGrid,
  FiRefreshCw,
} from "react-icons/fi";

type Produto = {
  id_produto: number;
  nome: string;
  slug?: string;
  descricao?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  estoque?: number;
  ilimitado?: number;
  imagem?: string;
  categoria_id?: number | null;
  categoria_nome?: string | null;
  statusid?: number | null;
  status_nome?: string | null;
  catalogo?: number;
  destaque?: number | null;
  sku?: string;
  modelo?: string;
};

type Categoria = {
  id_categoria: number;
  nome: string;
};

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.produtos != null) return payload.produtos as T;
  if (payload?.categorias != null) return payload.categorias as T;
  return payload as T;
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";
  const base = api.defaults.baseURL || "";

  if (caminho.startsWith("http")) return caminho;

  return `${base.replace(/\/$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
}

function formatMoney(valor?: number | string) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensPorPagina = 3;

  async function carregarTudo() {
    try {
      setLoading(true);

      const [resProdutos, resCategorias] = await Promise.all([
        api.get("/produtos"),
        api.get("/categorias"),
      ]);

      const listaProdutos = resolveApi<Produto[]>(resProdutos.data) || [];
      const listaCategorias = resolveApi<Categoria[]>(resCategorias.data) || [];

      setProdutos(Array.isArray(listaProdutos) ? listaProdutos : []);
      setCategorias(Array.isArray(listaCategorias) ? listaCategorias : []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([]);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, categoriaSelecionada]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const matchBusca =
        !termo ||
        String(produto.nome || "").toLowerCase().includes(termo) ||
        String(produto.descricao || "").toLowerCase().includes(termo) ||
        String(produto.sku || "").toLowerCase().includes(termo) ||
        String(produto.categoria_nome || "").toLowerCase().includes(termo);

      const matchCategoria =
        !categoriaSelecionada ||
        String(produto.categoria_id || "") === categoriaSelecionada ||
        String(produto.categoria_nome || "") === categoriaSelecionada;

      return matchBusca && matchCategoria;
    });
  }, [produtos, busca, categoriaSelecionada]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosFiltrados.length / itensPorPagina)
  );

  const produtosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return produtosFiltrados.slice(inicio, fim);
  }, [produtosFiltrados, paginaAtual]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  function irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > totalPaginas) return;
    setPaginaAtual(pagina);
  }

  const paginasVisiveis = useMemo(() => {
    const paginas: number[] = [];

    let inicio = Math.max(1, paginaAtual - 2);
    let fim = Math.min(totalPaginas, paginaAtual + 2);

    if (paginaAtual <= 3) fim = Math.min(totalPaginas, 5);
    if (paginaAtual >= totalPaginas - 2) inicio = Math.max(1, totalPaginas - 4);

    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }

    return paginas;
  }, [paginaAtual, totalPaginas]);

  return (
    <>
      <div className="produtosPage">
        <section className="hero">
          <div className="heroLeft">
            <div className="heroBadge">
              <FiGrid size={15} />
              Catálogo inteligente
            </div>

            <h1 className="heroTitle">Produtos</h1>

            <p className="heroText">
              Filtre por categoria, pesquise rapidamente e navegue em lotes de 3 produtos por página.
            </p>
          </div>

          <button
            type="button"
            className="refreshBtn"
            onClick={carregarTudo}
            disabled={loading}
          >
            <FiRefreshCw size={16} />
            Atualizar
          </button>
        </section>

        <section className="filtersBox">
          <div className="inputSearch">
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, descrição, SKU ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="selectWrap">
            <select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((categoria) => (
                <option key={categoria.id_categoria} value={categoria.id_categoria}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="infoBar">
          <div className="infoCard">
            <span className="infoLabel">Resultados encontrados</span>
            <strong className="infoValue">{produtosFiltrados.length}</strong>
            <small className="infoMeta">
              Página {paginaAtual} de {totalPaginas}
            </small>
          </div>
        </section>

        {loading ? (
          <div className="stateBox">
            <div className="spinner" />
            <p>Carregando produtos...</p>
          </div>
        ) : produtosPaginados.length === 0 ? (
          <div className="stateBox empty">
            <div className="emptyIcon">
              <FiPackage size={26} />
            </div>
            <h3>Nenhum produto encontrado</h3>
            <p>Tente mudar a busca ou selecionar outra categoria.</p>
          </div>
        ) : (
          <>
            <section className="gridProdutos">
              {produtosPaginados.map((produto) => {
                const precoPromocional = Number(produto.preco_promocional || 0);
                const precoNormal = Number(produto.preco || 0);
                const temPromocao =
                  precoPromocional > 0 && precoPromocional < precoNormal;

                const precoFinal = temPromocao ? precoPromocional : precoNormal;

                const href = produto.slug
                  ? `/produto/${produto.slug}`
                  : `/produto/${produto.id_produto}`;

                return (
                  <article key={produto.id_produto} className="cardProduto">
                    <Link href={href} className="imageLink">
                      {produto.imagem ? (
                        <img
                          src={getImagemUrl(produto.imagem)}
                          alt={produto.nome}
                          className="produtoImagem"
                        />
                      ) : (
                        <div className="produtoSemImagem">
                          <FiPackage size={22} />
                          <span>Sem imagem</span>
                        </div>
                      )}
                    </Link>

                    <div className="cardBody">
                      <div className="topInfo">
                        <span className="categoriaTag">
                          {produto.categoria_nome || "Sem categoria"}
                        </span>

                        {produto.destaque ? (
                          <span className="destaqueTag">Destaque</span>
                        ) : null}
                      </div>

                      <h3 className="produtoNome">{produto.nome}</h3>

                      <p className="produtoDescricao">
                        {produto.descricao || "Produto sem descrição cadastrada."}
                      </p>

                      <div className="precoArea">
                        {temPromocao ? (
                          <>
                            <span className="precoAntigo">
                              {formatMoney(precoNormal)}
                            </span>
                            <strong className="precoAtual promo">
                              {formatMoney(precoFinal)}
                            </strong>
                          </>
                        ) : (
                          <strong className="precoAtual">
                            {formatMoney(precoFinal)}
                          </strong>
                        )}
                      </div>

                      <div className="infoRow">
                        <span className="skuText">
                          {produto.sku ? `SKU: ${produto.sku}` : "Sem SKU"}
                        </span>

                        <span className="estoqueText">
                          {Number(produto.ilimitado ?? 0) === 1
                            ? "Estoque ∞"
                            : `Estoque: ${Number(produto.estoque ?? 0)}`}
                        </span>
                      </div>

                      <Link href={href} className="verMaisBtn">
                        Ver produto
                      </Link>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="pagination">
              <button
                type="button"
                className="pageBtn nav"
                onClick={() => irParaPagina(paginaAtual - 1)}
                disabled={paginaAtual === 1}
              >
                <FiChevronLeft size={16} />
                Anterior
              </button>

              <div className="pageNumbers">
                {paginasVisiveis.map((pagina) => (
                  <button
                    key={pagina}
                    type="button"
                    className={`pageBtn number ${paginaAtual === pagina ? "active" : ""}`}
                    onClick={() => irParaPagina(pagina)}
                  >
                    {pagina}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="pageBtn nav"
                onClick={() => irParaPagina(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
                <FiChevronRight size={16} />
              </button>
            </section>
          </>
        )}
      </div>

    </>
  );
}