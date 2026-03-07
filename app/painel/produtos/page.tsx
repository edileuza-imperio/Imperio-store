"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

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

  const itensPorPagina = 8;

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
      <div className="painel-page">
        {/* Header Section */}
        <section className="header-section">
          <div className="header-content">
            <div className="header-text">
              <span className="header-label">Gerenciamento</span>
              <h1 className="header-title">Produtos</h1>
              <p className="header-description">
                Gerencie seu catálogo de produtos com uma interface intuitiva e moderna
              </p>
            </div>
            <button
              type="button"
              className="btn-novo-produto"
              onClick={() => router.push("/painel/produtos/novo")}
            >
              <span className="btn-icon">+</span>
              Novo Produto
            </button>
          </div>
        </section>

        {/* Filters Section */}
        <section className="filters-section">
          <div className="filter-group">
            <label htmlFor="busca-input" className="filter-label">Buscar Produto</label>
            <div className="search-wrapper">
              <input
                id="busca-input"
                type="text"
                className="filter-input search-input"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, slug, SKU ou categoria..."
              />
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="categoria-select" className="filter-label">Categoria</label>
            <select
              id="categoria-select"
              className="filter-input"
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

          <div className="filter-group">
            <label htmlFor="pagina-select" className="filter-label">Página</label>
            <select
              id="pagina-select"
              className="filter-input"
              value={paginaAtual}
              onChange={(e) => setPaginaAtual(Number(e.target.value))}
            >
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                <option key={pagina} value={pagina}>
                  {pagina}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-info">
            <span className="info-text">
              {produtosFiltrados.length > 0
                ? `${produtosPaginados.length} de ${produtosFiltrados.length} produtos`
                : "Nenhum produto encontrado"}
            </span>
          </div>
        </section>

        {/* Products Grid or Empty State */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando produtos...</p>
          </div>
        ) : produtosPaginados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>Nenhum produto encontrado</h3>
            <p>Tente ajustar seus filtros ou criar um novo produto</p>
          </div>
        ) : (
          <section className="products-grid">
            {produtosPaginados.map((produto) => (
              <article key={produto.id_produto} className="product-card">
                {/* Product Image */}
                <div className="product-image-container">
                  {produto.imagem ? (
                    <img
                      src={getImagemUrl(produto.imagem)}
                      alt={produto.nome}
                      className="product-image"
                    />
                  ) : (
                    <div className="product-no-image">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <path d="m21 15-5-5L5 21"></path>
                      </svg>
                      <span>Sem imagem</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="product-badges">
                    {produto.destaque ? (
                      <span className="badge badge-highlight">⭐ Destaque</span>
                    ) : null}
                    {Number(produto.catalogo ?? 0) === 1 ? (
                      <span className="badge badge-active">✓ Ativo</span>
                    ) : (
                      <span className="badge badge-inactive">○ Oculto</span>
                    )}
                  </div>
                </div>

                {/* Product Content */}
                <div className="product-content">
                  {/* Header Info */}
                  <div className="product-header">
                    <span className="product-category">
                      {produto.categoria_nome || "Sem categoria"}
                    </span>
                    <span className="product-id">#{produto.id_produto}</span>
                  </div>

                  {/* Title */}
                  <h3 className="product-title">{produto.nome}</h3>

                  {/* Description */}
                  <p className="product-description">
                    {produto.descricao?.trim()
                      ? produto.descricao.length > 100
                        ? `${produto.descricao.slice(0, 100)}...`
                        : produto.descricao
                      : "Sem descrição cadastrada"}
                  </p>

                  {/* Meta Information */}
                  <div className="product-meta">
                    <div className="meta-item">
                      <span className="meta-label">Preço</span>
                      <strong className="meta-value">{formatMoney(produto.preco)}</strong>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Estoque</span>
                      <strong className="meta-value">
                        {Number(produto.ilimitado ?? 0) === 1
                          ? "Ilimitado"
                          : Number(produto.estoque ?? 0)}
                      </strong>
                    </div>
                    <div className="meta-item full-width">
                      <span className="meta-label">Slug</span>
                      <strong className="meta-value">{produto.slug || "—"}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="product-actions">
                    <button
                      type="button"
                      className="btn-action btn-edit"
                      onClick={() =>
                        router.push(`/painel/produtos/${produto.id_produto}/editar`)
                      }
                      title="Editar produto"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Editar
                    </button>

                    <button
                      type="button"
                      className="btn-action btn-images"
                      onClick={() =>
                        router.push(`/painel/produtos/${produto.id_produto}/editar?aba=imagens`)
                      }
                      title="Gerenciar imagens"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <path d="m21 15-5-5L5 21"></path>
                      </svg>
                      Imagens
                    </button>

                    <button
                      type="button"
                      className="btn-action btn-delete"
                      onClick={() => excluirProduto(produto)}
                      title="Excluir produto"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .painel-page {
          min-height: 100vh;
          padding: 32px 24px;
          background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
          color: #1a202c;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
        }

        /* Header Section */
        .header-section {
          margin-bottom: 32px;
        }

        .header-content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .header-text {
          flex: 1;
          min-width: 0;
        }

        .header-label {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(99, 102, 241, 0.1);
          color: #4f46e5;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .header-title {
          margin: 0 0 8px 0;
          font-size: 42px;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #0f172a;
        }

        .header-description {
          margin: 0;
          font-size: 16px;
          color: #64748b;
          line-height: 1.6;
          max-width: 600px;
        }

        .btn-novo-produto {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
          white-space: nowrap;
        }

        .btn-novo-produto:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
        }

        .btn-novo-produto:active {
          transform: translateY(0);
        }

        .btn-icon {
          font-size: 18px;
          font-weight: 900;
        }

        /* Filters Section */
        .filters-section {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 16px;
          align-items: flex-end;
          margin-bottom: 32px;
          padding: 20px 24px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-label {
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .filter-input {
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          color: #1a202c;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
          min-width: 0;
        }

        .filter-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          padding-right: 38px;
        }

        .search-icon {
          position: absolute;
          right: 12px;
          width: 18px;
          height: 18px;
          color: #94a3b8;
          pointer-events: none;
        }

        select.filter-input {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 36px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          cursor: pointer;
        }

        .filter-info {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 10px 0;
        }

        .info-text {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 24px;
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-state p {
          margin: 0;
          color: #64748b;
          font-weight: 600;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 80px 24px;
          background: white;
          border-radius: 16px;
          border: 2px dashed #cbd5e1;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .empty-icon {
          font-size: 48px;
          opacity: 0.6;
        }

        .empty-state h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
        }

        .empty-state p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        /* Products Grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        /* Product Card */
        .product-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 16px;
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
          border-color: #cbd5e1;
        }

        /* Product Image */
        .product-image-container {
          position: relative;
          width: 100%;
          height: 240px;
          background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
          overflow: hidden;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .product-no-image {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #94a3b8;
        }

        .product-no-image svg {
          width: 48px;
          height: 48px;
          opacity: 0.5;
        }

        .product-no-image span {
          font-size: 13px;
          font-weight: 600;
        }

        /* Badges */
        .product-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .badge-highlight {
          background: rgba(251, 191, 36, 0.9);
          color: white;
        }

        .badge-active {
          background: rgba(34, 197, 94, 0.9);
          color: white;
        }

        .badge-inactive {
          background: rgba(255, 255, 255, 0.95);
          color: #64748b;
          border: 1px solid #cbd5e1;
        }

        /* Product Content */
        .product-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 18px;
          flex: 1;
        }

        .product-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .product-category {
          display: inline-flex;
          padding: 5px 10px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.1);
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .product-id {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
        }

        .product-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.3;
          color: #0f172a;
        }

        .product-description {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
          min-height: 39px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Product Meta */
        .product-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          padding: 12px 0;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-item.full-width {
          grid-column: 1 / -1;
        }

        .meta-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .meta-value {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          word-break: break-word;
        }

        /* Product Actions */
        .product-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 4px;
        }

        .btn-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-action svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .btn-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .btn-edit {
          border-color: #cbd5e1;
          color: #4f46e5;
        }

        .btn-edit:hover {
          background: rgba(79, 70, 229, 0.05);
          border-color: #4f46e5;
        }

        .btn-images {
          border-color: #cbd5e1;
          color: #0891b2;
        }

        .btn-images:hover {
          background: rgba(6, 182, 212, 0.05);
          border-color: #0891b2;
        }

        .btn-delete {
          border-color: #fecaca;
          color: #dc2626;
        }

        .btn-delete:hover {
          background: rgba(220, 38, 38, 0.05);
          border-color: #dc2626;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .painel-page {
            padding: 20px 16px;
          }

          .header-content {
            flex-direction: column;
            align-items: stretch;
          }

          .header-title {
            font-size: 32px;
          }

          .btn-novo-produto {
            width: 100%;
            justify-content: center;
          }

          .filters-section {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .filter-info {
            justify-content: flex-start;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }

          .product-actions {
            grid-template-columns: 1fr;
          }

          .btn-action {
            justify-content: flex-start;
            padding: 12px 14px;
          }
        }

        @media (max-width: 480px) {
          .painel-page {
            padding: 16px 12px;
          }

          .header-title {
            font-size: 28px;
          }

          .header-description {
            font-size: 14px;
          }

          .filters-section {
            padding: 16px;
          }

          .product-card {
            border-radius: 12px;
          }

          .product-image-container {
            height: 200px;
          }

          .product-content {
            padding: 14px;
            gap: 10px;
          }

          .product-title {
            font-size: 16px;
          }

          .product-description {
            font-size: 12px;
            min-height: 36px;
          }
        }
      `}</style>
    </>
  );
}
