"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import {
  FiPlus,
  FiEdit,
  FiImage,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
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

function formatMoney(value: number | string | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosPainelPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensPorPagina = 10;

  async function carregarTudo() {
    try {
      setLoading(true);

      const [resProdutos, resCategorias] = await Promise.all([
        api.get("/admin/produtos", { withCredentials: true }),
        api.get("/admin/categorias", { withCredentials: true }),
      ]);

      const listaProdutos = resolveApi<Produto[]>(resProdutos.data) || [];
      const listaCategorias = resolveApi<Categoria[]>(resCategorias.data) || [];

      setProdutos(Array.isArray(listaProdutos) ? listaProdutos : []);
      setCategorias(Array.isArray(listaCategorias) ? listaCategorias : []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, categoriaFiltro]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const termo = busca.trim().toLowerCase();

      const matchBusca =
        !termo ||
        String(produto.nome || "").toLowerCase().includes(termo) ||
        String(produto.slug || "").toLowerCase().includes(termo) ||
        String(produto.categoria_nome || "").toLowerCase().includes(termo) ||
        String(produto.sku || "").toLowerCase().includes(termo);

      const matchCategoria =
        !categoriaFiltro ||
        String(produto.categoria_nome || "") === categoriaFiltro ||
        String(produto.categoria_id || "") === categoriaFiltro;

      return matchBusca && matchCategoria;
    });
  }, [produtos, busca, categoriaFiltro]);

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

  async function excluirProduto(produto: Produto) {
    const ok = window.confirm(`Deseja excluir o produto "${produto.nome}"?`);
    if (!ok) return;

    try {
      await api.delete(`/admin/produto/${produto.id_produto}/remover`, {
        withCredentials: true,
      });

      await carregarTudo();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Erro ao excluir produto."
      );
    }
  }

  return (
    <>
      <div className="produtosPage">
        {/* HEADER SECTION */}
        <div className="pageHeader">
          <div className="pageHeaderContent">
            <div className="pageHeaderLeft">
              <h1 className="pageTitle">Produtos</h1>
              <p className="pageDescription">
                Gerencie seu catálogo com uma interface moderna e intuitiva
              </p>
            </div>
            <button
              type="button"
              className="btnPrimary"
              onClick={() => router.push("/painel/produtos/novo")}
            >
              <FiPlus size={18} />
              Novo Produto
            </button>
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div className="filtersSection">
          <div className="filterGroup">
            <label className="filterLabel">
              <FiSearch size={16} />
              Buscar
            </label>
            <input
              type="text"
              className="filterInput"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, slug, SKU ou categoria..."
            />
          </div>

          <div className="filterGroup">
            <label className="filterLabel">
              <FiFilter size={16} />
              Categoria
            </label>
            <select
              className="filterInput"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id_categoria} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="filterGroup">
            <label className="filterLabel">Página</label>
            <select
              className="filterInput"
              value={paginaAtual}
              onChange={(e) => setPaginaAtual(Number(e.target.value))}
            >
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                (pagina) => (
                  <option key={pagina} value={pagina}>
                    {pagina}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* CONTENT SECTION */}
        {loading ? (
          <div className="loadingState">
            <FiLoader className="loadingIcon" />
            <p>Carregando produtos...</p>
          </div>
        ) : produtosPaginados.length === 0 ? (
          <div className="emptyState">
            <div className="emptyStateIcon">📦</div>
            <h3>Nenhum produto encontrado</h3>
            <p>
              {busca || categoriaFiltro
                ? "Tente ajustar seus filtros"
                : "Comece criando seu primeiro produto"}
            </p>
            {!busca && !categoriaFiltro && (
              <button
                type="button"
                className="btnPrimary"
                onClick={() => router.push("/painel/produtos/novo")}
              >
                <FiPlus size={16} />
                Criar Produto
              </button>
            )}
          </div>
        ) : (
          <>
            {/* TABLE */}
            <div className="tableContainer">
              <table className="productsTable">
                <thead>
                  <tr>
                    <th>Imagem</th>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosPaginados.map((produto) => (
                    <tr key={produto.id_produto} className="tableRow">
                      <td className="cellImage">
                        {produto.imagem ? (
                          <img
                            src={getImagemUrl(produto.imagem)}
                            alt={produto.nome}
                            className="productThumbnail"
                          />
                        ) : (
                          <div className="productThumbnailPlaceholder">
                            📷
                          </div>
                        )}
                      </td>
                      <td className="cellProduct">
                        <div className="productInfo">
                          <div className="productName">{produto.nome}</div>
                          <div className="productMeta">
                            #{produto.id_produto}
                            {produto.sku && ` • SKU: ${produto.sku}`}
                          </div>
                        </div>
                      </td>
                      <td className="cellCategory">
                        <span className="categoryBadge">
                          {produto.categoria_nome || "—"}
                        </span>
                      </td>
                      <td className="cellPrice">
                        <strong>{formatMoney(produto.preco)}</strong>
                      </td>
                      <td className="cellStock">
                        <span
                          className={`stockBadge ${
                            Number(produto.estoque || 0) < 10
                              ? "low"
                              : Number(produto.estoque || 0) === 0
                              ? "out"
                              : "ok"
                          }`}
                        >
                          {Number(produto.ilimitado ?? 0) === 1
                            ? "∞"
                            : Number(produto.estoque ?? 0)}
                        </span>
                      </td>
                      <td className="cellStatus">
                        <span
                          className={`statusBadge ${
                            Number(produto.catalogo ?? 0) === 1
                              ? "visible"
                              : "hidden"
                          }`}
                        >
                          {Number(produto.catalogo ?? 0) === 1
                            ? "Visível"
                            : "Oculto"}
                        </span>
                        {produto.destaque ? (
                          <span className="statusBadge featured">
                            ⭐ Destaque
                          </span>
                        ) : null}
                      </td>
                      <td className="cellActions">
                        <div className="actionButtons">
                          <button
                            type="button"
                            className="actionBtn edit"
                            onClick={() =>
                              router.push(
                                `/painel/produtos/${produto.id_produto}/editar`
                              )
                            }
                            title="Editar"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            type="button"
                            className="actionBtn images"
                            onClick={() =>
                              router.push(
                                `/painel/produtos/${produto.id_produto}/editar?aba=imagens`
                              )
                            }
                            title="Imagens"
                          >
                            <FiImage size={16} />
                          </button>
                          <button
                            type="button"
                            className="actionBtn delete"
                            onClick={() => excluirProduto(produto)}
                            title="Excluir"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPaginas > 1 && (
              <div className="paginationSection">
                <div className="paginationInfo">
                  <p>
                    Mostrando <strong>{produtosPaginados.length}</strong> de{" "}
                    <strong>{produtosFiltrados.length}</strong> produtos
                  </p>
                </div>
                <div className="paginationControls">
                  <button
                    type="button"
                    className="paginationBtn"
                    onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                    disabled={paginaAtual === 1}
                  >
                    <FiChevronLeft size={16} />
                    Anterior
                  </button>
                  <span className="paginationCounter">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button
                    type="button"
                    className="paginationBtn"
                    onClick={() =>
                      setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))
                    }
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      
    </>
  );
}
