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

  const itensPorPagina = 8;

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

    if (paginaAtual <= 3) {
      fim = Math.min(totalPaginas, 5);
    }

    if (paginaAtual >= totalPaginas - 2) {
      inicio = Math.max(1, totalPaginas - 4);
    }

    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }

    return paginas;
  }, [paginaAtual, totalPaginas]);

  return (
    <>
      <div className="produtosPage">
        <section className="hero">
          <div>
            <div className="heroBadge">
              <FiGrid size={15} />
              Catálogo de produtos
            </div>

            <h1 className="heroTitle">Listagem de produtos</h1>
            <p className="heroText">
              Filtre por categoria, pesquise pelo nome e navegue pelas páginas
              do catálogo.
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
                <option
                  key={categoria.id_categoria}
                  value={categoria.id_categoria}
                >
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="summaryRow">
          <div className="summaryCard">
            <span className="summaryLabel">Total de produtos</span>
            <strong className="summaryValue">{produtos.length}</strong>
          </div>

          <div className="summaryCard">
            <span className="summaryLabel">Resultados filtrados</span>
            <strong className="summaryValue">{produtosFiltrados.length}</strong>
          </div>

          <div className="summaryCard">
            <span className="summaryLabel">Página atual</span>
            <strong className="summaryValue">
              {paginaAtual} / {totalPaginas}
            </strong>
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
              <FiPackage size={28} />
            </div>
            <h3>Nenhum produto encontrado</h3>
            <p>Tente alterar a busca ou o filtro de categoria.</p>
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

                return (
                  <article key={produto.id_produto} className="cardProduto">
                    <Link
                      href={
                        produto.slug
                          ? `/produto/${produto.slug}`
                          : `/produto/${produto.id_produto}`
                      }
                      className="imageLink"
                    >
                      {produto.imagem ? (
                        <img
                          src={getImagemUrl(produto.imagem)}
                          alt={produto.nome}
                          className="produtoImagem"
                        />
                      ) : (
                        <div className="produtoSemImagem">
                          <FiPackage size={28} />
                          <span>Sem imagem</span>
                        </div>
                      )}
                    </Link>

                    <div className="cardBody">
                      <span className="categoriaTag">
                        {produto.categoria_nome || "Sem categoria"}
                      </span>

                      <h3 className="produtoNome">{produto.nome}</h3>

                      <p className="produtoDescricao">
                        {produto.descricao
                          ? produto.descricao
                          : "Produto sem descrição cadastrada."}
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

                      <div className="footerCard">
                        <span className="skuText">
                          {produto.sku ? `SKU: ${produto.sku}` : "Sem SKU"}
                        </span>

                        <Link
                          href={
                            produto.slug
                              ? `/produto/${produto.slug}`
                              : `/produto/${produto.id_produto}`
                          }
                          className="verMaisBtn"
                        >
                          Ver produto
                        </Link>
                      </div>
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
                    className={`pageBtn number ${
                      paginaAtual === pagina ? "active" : ""
                    }`}
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

      <style jsx>{`
        .produtosPage {
          display: flex;
          flex-direction: column;
          gap: 22px;
          width: 100%;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 24px;
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(129, 140, 248, 0.16) 0%, transparent 30%),
            linear-gradient(135deg, #111827 0%, #1f2937 100%);
          color: #fff;
          flex-wrap: wrap;
        }

        .heroBadge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .heroTitle {
          margin: 0;
          font-size: 30px;
          font-weight: 900;
          line-height: 1.1;
        }

        .heroText {
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          line-height: 1.7;
          max-width: 640px;
        }

        .refreshBtn {
          border: 0;
          outline: 0;
          min-height: 46px;
          padding: 0 18px;
          border-radius: 16px;
          background: #fff;
          color: #111827;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .refreshBtn:hover {
          transform: translateY(-1px);
        }

        .refreshBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .filtersBox {
          display: grid;
          grid-template-columns: 1.5fr 320px;
          gap: 16px;
        }

        .inputSearch,
        .selectWrap {
          height: 52px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid #e8eaf1;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
        }

        .inputSearch {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
        }

        .inputSearch input {
          flex: 1;
          border: 0;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #111827;
        }

        .selectWrap {
          overflow: hidden;
        }

        .selectWrap select {
          width: 100%;
          height: 100%;
          border: 0;
          outline: none;
          background: transparent;
          padding: 0 16px;
          font-size: 14px;
          color: #111827;
          cursor: pointer;
        }

        .summaryRow {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .summaryCard {
          background: #fff;
          border: 1px solid #ece7f5;
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summaryLabel {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          font-weight: 800;
        }

        .summaryValue {
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          color: #111827;
        }

        .stateBox {
          min-height: 300px;
          background: #fff;
          border: 1px solid #ece7f5;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          text-align: center;
          padding: 24px;
        }

        .stateBox h3 {
          margin: 0;
          font-size: 22px;
          color: #111827;
          font-weight: 900;
        }

        .stateBox p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #ddd6fe;
          border-top-color: #7c3aed;
          border-radius: 999px;
          animation: spin 0.8s linear infinite;
        }

        .emptyIcon {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3ecff;
          color: #6d28d9;
        }

        .gridProdutos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .cardProduto {
          background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
          border: 1px solid #ece7f5;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
          transition: 0.22s ease;
          display: flex;
          flex-direction: column;
        }

        .cardProduto:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 44px rgba(15, 23, 42, 0.1);
        }

        .imageLink {
          display: block;
          width: 100%;
          height: 240px;
          background: #f8fafc;
        }

        .produtoImagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .produtoSemImagem {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
          background: linear-gradient(180deg, #faf7ff 0%, #f3ecff 100%);
          font-weight: 700;
          font-size: 14px;
        }

        .cardBody {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .categoriaTag {
          width: fit-content;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          background: #f3ecff;
          color: #6d28d9;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .produtoNome {
          margin: 0;
          font-size: 18px;
          line-height: 1.35;
          color: #111827;
          font-weight: 900;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 48px;
        }

        .produtoDescricao {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 67px;
        }

        .precoArea {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .precoAntigo {
          font-size: 13px;
          color: #94a3b8;
          text-decoration: line-through;
          font-weight: 700;
        }

        .precoAtual {
          font-size: 26px;
          line-height: 1;
          font-weight: 900;
          color: #111827;
        }

        .precoAtual.promo {
          color: #7c3aed;
        }

        .footerCard {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .skuText {
          font-size: 12px;
          color: #64748b;
          font-weight: 700;
        }

        .verMaisBtn {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 14px;
          background: #111827;
          color: #fff;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .verMaisBtn:hover {
          background: #0f172a;
          transform: translateY(-1px);
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        .pageNumbers {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .pageBtn {
          border: 0;
          outline: 0;
          min-height: 44px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .pageBtn.nav {
          padding: 0 16px;
          background: #ffffff;
          border: 1px solid #e8eaf1;
          color: #111827;
        }

        .pageBtn.number {
          width: 44px;
          background: #ffffff;
          border: 1px solid #e8eaf1;
          color: #111827;
        }

        .pageBtn.number.active {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 12px 22px rgba(124, 58, 237, 0.22);
        }

        .pageBtn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .pageBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1024px) {
          .filtersBox {
            grid-template-columns: 1fr;
          }

          .summaryRow {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .produtosPage {
            gap: 18px;
          }

          .hero {
            padding: 20px;
            border-radius: 22px;
          }

          .heroTitle {
            font-size: 24px;
          }

          .heroText {
            font-size: 14px;
          }

          .gridProdutos {
            grid-template-columns: 1fr;
          }

          .pagination {
            flex-direction: column;
            align-items: stretch;
          }

          .pageNumbers {
            order: 1;
          }

          .pageBtn.nav {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}