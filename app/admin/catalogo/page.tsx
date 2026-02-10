"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Produto {
  id_produto: number;
  nome: string;
  preco: number;
  estoque: number;
  catalogo: number;
  categoria_nome?: string;
  slug?: string;
  imagem?: string;
}

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;
  const base = api.defaults.baseURL || "";
  return `${base}${caminho.replace(/^\/+/, "")}`;
};

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 9;

  const fetchProdutos = async () => {
    try {
      const res = await api.get("/admin/produtos/catalogo");
      setProdutos(res.data?.dados || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const toggleCatalogo = async (produto: Produto) => {
    try {
      if (produto.catalogo === 6) {
        await api.put(`/admin/produtos/${produto.id_produto}/catalogo/sim`);
        toast.success("Produto publicado");
      } else {
        await api.put(`/admin/produtos/${produto.id_produto}/catalogo/nao`);
        toast.info("Produto removido");
      }
      fetchProdutos();
    } catch {
      toast.error("Erro ao atualizar catálogo");
    }
  };

  const totalPaginas = Math.ceil(produtos.length / itensPorPagina);
  const produtosPagina = produtos.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  if (loading) return <div className="loading">Carregando catálogo...</div>;

  return (
    <div className="catalogo-wrapper">
      <ToastContainer />

      <h1 className="title">Gestão de Catálogo</h1>
      <p className="subtitle">Publicação de produtos no site</p>

      {produtos.length === 0 ? (
        <p className="empty">Nenhum produto encontrado</p>
      ) : (
        <>
          <div className="grid">
            {produtosPagina.map((produto) => (
              <div key={produto.id_produto} className="card">
                <div className="image-box">
                  {produto.imagem ? (
                    <img src={getImagemUrl(produto.imagem)} alt={produto.nome} />
                  ) : (
                    <span className="no-image">Sem imagem</span>
                  )}

                  <span
                    className={`badge ${
                      produto.catalogo === 5 ? "on" : "off"
                    }`}
                  >
                    {produto.catalogo === 5 ? "Publicado" : "Oculto"}
                  </span>
                </div>

                <div className="content">
                  <h3>{produto.nome}</h3>
                  <small>{produto.categoria_nome || "Sem categoria"}</small>

                  <div className="info">
                    <span>
                      Preço
                      <strong>R$ {Number(produto.preco).toFixed(2)}</strong>
                    </span>
                    <span>
                      Estoque
                      <strong>{produto.estoque}</strong>
                    </span>
                  </div>

                  <div className="actions">
                    <button
                      className={`btn ${
                        produto.catalogo === 6 ? "success" : "danger"
                      }`}
                      onClick={() => toggleCatalogo(produto)}
                    >
                      {produto.catalogo === 6 ? "Publicar" : "Remover"}
                    </button>

                    <button
                      className="btn outline"
                      onClick={() =>
                        produto.slug
                          ? window.open(`/produto/${produto.slug}`, "_blank")
                          : toast.info("Produto sem página")
                      }
                    >
                      Ver Página
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINAÇÃO */}
          {totalPaginas > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPaginas }).map((_, i) => (
                <button
                  key={i}
                  className={paginaAtual === i + 1 ? "active" : ""}
                  onClick={() => setPaginaAtual(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f4f6fb;
          font-family: Inter, system-ui, sans-serif;
        }

        .catalogo-wrapper {
          padding: 24px;
          min-height: 100vh;
        }

        .title {
          font-size: 26px;
          font-weight: 700;
          color: #3a2c2f;
          margin-bottom: 4px;
        }

        .subtitle {
          color: #7a7a7a;
          margin-bottom: 24px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s;
        }

        .card:hover {
          transform: translateY(-6px);
        }

        .image-box {
          position: relative;
          height: 180px;
          background: #eee;
        }

        .image-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
        }

        .badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .badge.on {
          background: #2ecc71;
        }

        .badge.off {
          background: #e74c3c;
        }

        .content {
          padding: 16px;
        }

        .content h3 {
          margin: 0 0 4px;
          font-size: 16px;
        }

        .content small {
          color: #888;
        }

        .info {
          display: flex;
          justify-content: space-between;
          margin: 16px 0;
        }

        .info span {
          font-size: 13px;
          color: #666;
        }

        .info strong {
          display: block;
          color: #000;
          font-size: 15px;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: 0.2s;
        }

        .btn.success {
          background: #2ecc71;
          color: #fff;
        }

        .btn.danger {
          background: #e74c3c;
          color: #fff;
        }

        .btn.outline {
          background: transparent;
          border: 1px solid #ccc;
        }

        .btn:hover {
          opacity: 0.9;
        }

        .pagination {
          margin-top: 30px;
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .pagination button {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #ccc;
          background: #fff;
          cursor: pointer;
        }

        .pagination button.active {
          background: #6b4c4f;
          color: #fff;
          border-color: #6b4c4f;
        }

        .loading,
        .empty {
          text-align: center;
          padding: 40px;
          color: #777;
        }
      `}</style>
    </div>
  );
}
