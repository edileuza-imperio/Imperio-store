'use client';

import Navbar from "@/components/site/menu/navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  FaStar, FaTag, FaShoppingCart, FaEye, FaTruck, FaFire, 
  FaHeart, FaInfoCircle, FaChevronLeft, FaChevronRight, FaBox, FaShippingFast 
} from "react-icons/fa";
import useProdutoPage from "@/hooks/produto/useProdutoPage";

export default function CatalogoPage() {
  const {
    produtos,
    loading,
    filtroCategoria,
    setFiltroCategoria,
    categorias,
    produtosFiltrados,
    produtosPaginados,
    produtosFavoritos,
    toggleFavorito,
    paginaAtual,
    totalPaginas,
    paginar,
    paginaAnterior,
    proximaPagina,
    indexPrimeiroProduto,
    indexUltimoProduto,
    adicionarAoCarrinho,
  } = useProdutoPage();

  
  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" />

      <div className="catalogo-page">
        {/* Hero Section */}
        <div className="catalogo-hero">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-12 text-center">
                <h1 className="display-4 fw-bold text-white mb-4">
                  Catálogo <span className="text-gold">Premium</span>
                </h1>
                <p className="lead text-white mb-4">
                  Descubra produtos exclusivos com qualidade superior e design sofisticado.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <div className="badge-hero"><FaTruck /> Frete Grátis</div>
                  <div className="badge-hero"><FaStar /> Qualidade Garantida</div>
                  <div className="badge-hero"><FaTag /> Ofertas Exclusivas</div>
                  <div className="badge-hero"><FaShippingFast /> Entrega Rápida</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-5">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-5">
            <ol className="breadcrumb breadcrumb-elegant">
              <li className="breadcrumb-item">
                <a href="/" className="breadcrumb-link">
                  <span className="breadcrumb-icon">🏠</span> Home
                </a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                <span className="breadcrumb-icon">📋</span> Catálogo
              </li>
            </ol>
          </nav>

          {/* Informações rápidas */}
          <div className="info-rapida mb-4">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="info-item">
                  <FaBox className="info-icon" />
                  <div>
                    <div className="info-number">{produtos.length}</div>
                    <div className="info-label">Total de Produtos</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="info-item">
                  <FaTag className="info-icon" />
                  <div>
                    <div className="info-number">{categorias.length}</div>
                    <div className="info-label">Categorias</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="info-item">
                  <FaStar className="info-icon" />
                  <div>
                    <div className="info-number">{produtos.filter(p => p.destaque).length}</div>
                    <div className="info-label">Produtos em Destaque</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro por categoria */}
          <div className="filtro-section mb-5">
            <div className="row justify-content-center">
              <div className="col-lg-12">
                <div className="filtro-categoria">
                  <h3 className="filtro-titulo mb-4 text-center">
                    <FaTag className="me-2 text-gold" />
                    Filtrar por Categoria
                  </h3>
                  <div className="d-flex flex-wrap justify-content-center gap-2">
                    <button
                      className={`btn-categoria ${filtroCategoria === "" ? "active" : ""}`}
                      onClick={() => setFiltroCategoria("")}
                    >
                      <FaTag className="me-2" />
                      Todos os Produtos ({produtos.length})
                    </button>
                    {categorias.map((categoria) => {
                      const produtosNaCategoria = produtos.filter(p => p.categoria_nome === categoria).length;
                      return (
                        <button
                          key={categoria}
                          className={`btn-categoria ${filtroCategoria === categoria ? "active" : ""}`}
                          onClick={() => setFiltroCategoria(categoria)}
                        >
                          <FaTag className="me-2" />
                          {categoria} ({produtosNaCategoria})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de produtos */}
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <div className="empty-state">
                <div className="empty-icon mb-3">📭</div>
                <h4 className="text-muted mb-3">Nenhum produto encontrado</h4>
                <p className="text-muted mb-4">
                  {filtroCategoria 
                    ? `Não encontramos produtos na categoria "${filtroCategoria}".`
                    : "Não há produtos disponíveis no momento."}
                </p>
                <button className="btn btn-dourado" onClick={() => setFiltroCategoria("")}>
                  Ver Todos os Produtos
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {produtosPaginados.map((produto) => (
                  <div key={produto.id_produto} className="col-sm-6 col-md-4 col-lg-3">
                    <div className="card-produto">
                      {/* Badges */}
                      <div className="card-badges">
                        {produto.destaque && <div className="badge-destaque"><FaStar className="me-1" /> DESTAQUE</div>}
                        {produto.estoque && produto.estoque < 10 && <div className="badge-estoque">⚠️ ÚLTIMAS UNIDADES</div>}
                        {produto.preco && Number(produto.preco) > 500 && <div className="badge-premium"><FaFire className="me-1" /> PREMIUM</div>}
                      </div>

                      {/* Favorito */}
                      <button 
                        className={`btn-favorito ${produtosFavoritos.includes(produto.id_produto) ? 'active' : ''}`}
                        onClick={() => toggleFavorito(produto.id_produto)}
                      >
                        <FaHeart />
                      </button>

                      {/* Imagem */}
                      <div className="card-imagem-container">
                        {produto.imagem ? (
                          <img src={produto.imagem} className="card-imagem" alt={produto.nome} loading="lazy" />
                        ) : (
                          <div className="card-imagem-placeholder">
                            <FaInfoCircle className="fs-1 text-rosa" />
                            <span className="placeholder-text">Sem imagem</span>
                          </div>
                        )}
                        <div className="card-imagem-overlay">
                          <a href={`/produto/${produto.slug}`} className="btn-quick-view"><FaEye /> Ver Rápido</a>
                        </div>
                      </div>

                      {/* Corpo do card */}
                      <div className="card-body-produto">
                        <div className="categoria-produto"><FaTag className="me-1" />{produto.categoria_nome || "Sem categoria"}</div>
                        <h5 className="card-titulo">{produto.nome}</h5>
                        {produto.descricao && (
                          <p className="card-descricao">{produto.descricao.length > 60 ? produto.descricao.substring(0, 60) + '...' : produto.descricao}</p>
                        )}
                        <div className="card-footer-produto">
                          <div className="preco-container">
                            <div className="preco-atual">R$ {Number(produto.preco).toFixed(2).replace('.', ',')}</div>
                            {Number(produto.preco) > 100 && <div className="preco-parcelado">ou 12x de R$ {(Number(produto.preco)/12).toFixed(2).replace('.', ',')}</div>}
                          </div>
                          <div className="card-botoes">
                            <a href={`/produto/${produto.slug}`} className="btn-ver-produto"><FaEye className="me-2" /> Detalhes</a>
                            <button 
                              className="btn-carrinho-card"
                              onClick={() => adicionarAoCarrinho(produto, 1)}
                            >
                              <FaShoppingCart className="me-2" /> Carrinho
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="paginacao-container mt-5">
                  <nav aria-label="Paginação">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${paginaAtual === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={paginaAnterior}><FaChevronLeft /> Anterior</button>
                      </li>
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        let numeroPagina;
                        if (totalPaginas <= 5) numeroPagina = i + 1;
                        else if (paginaAtual <= 3) numeroPagina = i + 1;
                        else if (paginaAtual >= totalPaginas - 2) numeroPagina = totalPaginas - 4 + i;
                        else numeroPagina = paginaAtual - 2 + i;

                        return (
                          <li key={numeroPagina} className={`page-item ${paginaAtual === numeroPagina ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => paginar(numeroPagina)}>{numeroPagina}</button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={proximaPagina}>Próxima <FaChevronRight /></button>
                      </li>
                    </ul>
                  </nav>
                  <div className="paginacao-info text-center mt-3">
                    <p className="text-muted mb-0">
                      Mostrando produtos <strong>{indexPrimeiroProduto + 1}</strong> a <strong>{Math.min(indexUltimoProduto, produtosFiltrados.length)}</strong> de <strong>{produtosFiltrados.length}</strong> produtos
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
