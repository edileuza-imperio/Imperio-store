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
        <section className="hero-card">
          <div className="hero-left">
            <span className="hero-badge">Painel administrativo</span>
            <h1>Produtos</h1>
            <p>
              Gerencie seu catálogo com uma interface mais limpa, moderna e fácil
              de manter.
            </p>
          </div>

          <div className="hero-actions">
            <button
              type="button"
              className="btn-primary-ui"
              onClick={() => router.push("/admin/produtos/novo")}
            >
              + Novo produto
            </button>
          </div>
        </section>

        <section className="filtros-card">
          <div className="field field-busca">
            <label>Buscar produto</label>
            <input
              className="input-ui"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite nome, slug, SKU ou categoria..."
            />
          </div>

          <div className="field">
            <label>Categoria</label>
            <select
              className="input-ui"
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

          <div className="field">
            <label>Página</label>
            <select
              className="input-ui"
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
        </section>

        {loading ? (
          <div className="empty-box">Carregando produtos...</div>
        ) : produtosPaginados.length === 0 ? (
          <div className="empty-box">Nenhum produto encontrado.</div>
        ) : (
          <section className="produto-grid">
            {produtosPaginados.map((produto) => (
              <article key={produto.id_produto} className="produto-card">
                <div className="produto-card-image-area">
                  {produto.imagem ? (
                    <img
                      src={getImagemUrl(produto.imagem)}
                      alt={produto.nome}
                      className="produto-card-image"
                    />
                  ) : (
                    <div className="produto-card-no-image">Sem imagem</div>
                  )}

                  <div className="produto-badges">
                    {produto.destaque ? (
                      <span className="badge badge-gold">Destaque</span>
                    ) : null}

                    {Number(produto.catalogo ?? 0) === 1 ? (
                      <span className="badge badge-green">No catálogo</span>
                    ) : (
                      <span className="badge badge-gray">Oculto</span>
                    )}
                  </div>
                </div>

                <div className="produto-card-content">
                  <div className="produto-top-line">
                    <span className="produto-categoria">
                      {produto.categoria_nome || "Sem categoria"}
                    </span>
                    <span className="produto-id">#{produto.id_produto}</span>
                  </div>

                  <h3>{produto.nome}</h3>

                  <p>
                    {produto.descricao?.trim()
                      ? produto.descricao.length > 110
                        ? `${produto.descricao.slice(0, 110)}...`
                        : produto.descricao
                      : "Sem descrição cadastrada."}
                  </p>

                  <div className="produto-meta-grid">
                    <div className="produto-meta-box">
                      <span>Preço</span>
                      <strong>{formatMoney(produto.preco)}</strong>
                    </div>

                    <div className="produto-meta-box">
                      <span>Estoque</span>
                      <strong>
                        {Number(produto.ilimitado ?? 0) === 1
                          ? "Ilimitado"
                          : Number(produto.estoque ?? 0)}
                      </strong>
                    </div>

                    <div className="produto-meta-box full">
                      <span>Slug</span>
                      <strong>{produto.slug || "—"}</strong>
                    </div>
                  </div>

                  <div className="produto-actions">
                    <button
                      type="button"
                      className="btn-secondary-ui"
                      onClick={() =>
                        router.push(`/admin/produtos/${produto.id_produto}/editar`)
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="btn-secondary-ui"
                      onClick={() =>
                        router.push(`/admin/produtos/${produto.id_produto}/editar?aba=imagens`)
                      }
                    >
                      Imagens
                    </button>

                    <button
                      type="button"
                      className="btn-danger-ui"
                      onClick={() => excluirProduto(produto)}
                    >
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
        .painel-page {
          min-height: 100vh;
          padding: 28px;
          background:
            radial-gradient(circle at top left, rgba(190, 24, 93, 0.06), transparent 30%),
            linear-gradient(180deg, #fff9fb 0%, #fffdfd 100%);
          color: #2f2430;
          font-family: Inter, system-ui, sans-serif;
        }

        .hero-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          padding: 28px;
          margin-bottom: 22px;
          border-radius: 30px;
          background: linear-gradient(135deg, #fff8fa 0%, #ffffff 100%);
          border: 1px solid #f2d7e0;
          box-shadow: 0 18px 42px rgba(91, 33, 52, 0.06);
        }

        .hero-badge {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: #fff1f6;
          color: #d61f69;
          border: 1px solid #f8cada;
          font-size: 12px;
          font-weight: 800;
        }

        .hero-card h1 {
          margin: 12px 0 8px;
          font-size: 38px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .hero-card p {
          margin: 0;
          max-width: 720px;
          color: #7f6472;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 500;
        }

        .filtros-card {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(220px, 1fr) 180px;
          gap: 16px;
          align-items: end;
          margin-bottom: 24px;
          padding: 18px;
          background: #ffffff;
          border: 1px solid #f2d7e0;
          border-radius: 24px;
          box-shadow: 0 10px 26px rgba(91, 33, 52, 0.04);
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .field label {
          font-size: 13px;
          font-weight: 800;
          color: #714a5d;
        }

        .input-ui {
          width: 100%;
          box-sizing: border-box;
          height: 52px;
          border: 1px solid #efcfd8;
          background: #fff;
          color: #2f2430;
          border-radius: 16px;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: 0.2s ease;
        }

        .input-ui:focus {
          border-color: #d61f69;
          box-shadow: 0 0 0 4px rgba(214, 31, 105, 0.11);
        }

        select.input-ui {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 42px;
          background-image: linear-gradient(45deg, transparent 50%, #6d4a59 50%),
            linear-gradient(135deg, #6d4a59 50%, transparent 50%);
          background-position: calc(100% - 18px) calc(50% - 3px),
            calc(100% - 12px) calc(50% - 3px);
          background-size: 6px 6px, 6px 6px;
          background-repeat: no-repeat;
        }

        .produto-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 20px;
        }

        .produto-card {
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid #f0d9e2;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 16px 36px rgba(62, 28, 43, 0.06);
          transition: 0.2s ease;
        }

        .produto-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 42px rgba(62, 28, 43, 0.08);
          border-color: #ebb3c9;
        }

        .produto-card-image-area {
          position: relative;
          height: 250px;
          background: linear-gradient(180deg, #fff3f8 0%, #fffaf4 100%);
        }

        .produto-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .produto-card-no-image {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #946b7d;
          font-weight: 800;
        }

        .produto-badges {
          position: absolute;
          top: 14px;
          left: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
        }

        .badge-gold {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
        }

        .badge-green {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .badge-gray {
          background: rgba(255, 255, 255, 0.94);
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .produto-card-content {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .produto-top-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .produto-categoria {
          display: inline-flex;
          width: fit-content;
          padding: 7px 12px;
          border-radius: 999px;
          background: #fff1f5;
          color: #c51d64;
          border: 1px solid #f7cade;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .produto-id {
          font-size: 12px;
          font-weight: 800;
          color: #9a6b80;
        }

        .produto-card-content h3 {
          margin: 0;
          font-size: 20px;
          line-height: 1.25;
          font-weight: 900;
        }

        .produto-card-content p {
          margin: 0;
          color: #7c6170;
          font-size: 14px;
          line-height: 1.7;
          min-height: 48px;
        }

        .produto-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .produto-meta-box {
          padding: 12px 14px;
          border-radius: 18px;
          background: linear-gradient(180deg, #fffefe 0%, #fff7fa 100%);
          border: 1px solid #f3dce4;
        }

        .produto-meta-box.full {
          grid-column: 1 / -1;
        }

        .produto-meta-box span {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #9a6b80;
          margin-bottom: 6px;
        }

        .produto-meta-box strong {
          display: block;
          color: #2f2430;
          font-size: 14px;
          font-weight: 900;
          word-break: break-word;
        }

        .produto-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 4px;
        }

        .btn-primary-ui,
        .btn-secondary-ui,
        .btn-danger-ui {
          appearance: none;
          border-radius: 16px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .btn-primary-ui:hover,
        .btn-secondary-ui:hover,
        .btn-danger-ui:hover {
          transform: translateY(-1px);
        }

        .btn-primary-ui {
          border: none;
          color: #fff;
          background: linear-gradient(135deg, #e11d74 0%, #c2185b 100%);
          box-shadow: 0 12px 24px rgba(194, 24, 91, 0.2);
        }

        .btn-secondary-ui {
          border: 1px solid #edd5dd;
          background: #fff8fb;
          color: #6a4356;
        }

        .btn-danger-ui {
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #be123c;
        }

        .empty-box {
          padding: 30px;
          text-align: center;
          border-radius: 22px;
          border: 1px solid #f0d9e2;
          background: rgba(255, 255, 255, 0.98);
          color: #8a6475;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(62, 28, 43, 0.04);
        }

        @media (max-width: 1024px) {
          .filtros-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .painel-page {
            padding: 16px;
          }

          .hero-card {
            padding: 20px;
            border-radius: 22px;
          }

          .hero-card h1 {
            font-size: 30px;
          }

          .produto-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}