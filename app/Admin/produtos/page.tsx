"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiEdit,
  FiEye,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiTag,
  FiBox,
} from "react-icons/fi";

type Produto = {
  id_produto?: number | string;
  id?: number | string;
  nome?: string;
  slug?: string;
  descricao?: string;
  imagem?: string;
  miniatura?: string;
  preco?: number | string;
  preco_promocional?: number | string | null;
  sku?: string;
  modelo?: string;
  marca?: string;
  categoria_id?: number | string;
  status_id?: number | string;
  criado_em?: string;
  atualizado_em?: string;
};

function extrairListaProdutos(data: any): Produto[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  if (Array.isArray(data?.produtos)) return data.produtos;
  if (Array.isArray(data?.dados?.produtos)) return data.dados.produtos;
  return [];
}

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizarImagem(produto: Produto) {
  const imagem = produto.imagem || produto.miniatura || "";
  if (!imagem) return "";

  if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
    return imagem;
  }

  if (imagem.startsWith("/")) {
    return imagem;
  }

  return `/${imagem}`;
}

export default function ProdutosListaPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(5);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErro("");

      const response = await api.get("/produtos");
      const lista = extrairListaProdutos(response?.data);
      setProdutos(lista);
    } catch (error: any) {
      console.error(error);
      setErro(
        error?.response?.data?.mensagem || "Erro ao carregar produtos"
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, itensPorPagina]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return produtos.filter((p) => {
      const nome = (p.nome || "").toLowerCase();
      const slug = (p.slug || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const marca = (p.marca || "").toLowerCase();
      const modelo = (p.modelo || "").toLowerCase();
      const descricao = (p.descricao || "").toLowerCase();

      return (
        nome.includes(termo) ||
        slug.includes(termo) ||
        sku.includes(termo) ||
        marca.includes(termo) ||
        modelo.includes(termo) ||
        descricao.includes(termo)
      );
    });
  }, [produtos, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / itensPorPagina)
  );

  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaSegura - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const produtosPaginados = filtrados.slice(inicio, fim);

  function getId(p: Produto) {
    return p.id_produto ?? p.id;
  }

  function getStatus(status?: any) {
    return String(status) === "1"
      ? { label: "Ativo", className: "ativo" }
      : { label: "Inativo", className: "inativo" };
  }

  function irPaginaAnterior() {
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  }

  function irProximaPagina() {
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
  }

  return (
    <div className="pagina-produtos">
      <div className="hero">
        <div className="hero-left">
          <div className="hero-badge">
            <FiPackage size={16} />
            <span>Gestão de Produtos</span>
          </div>

          <h1>Produtos em cards</h1>
          <p>
            Visualize os produtos em um layout mais moderno, com imagem,
            detalhes principais e paginação por cards.
          </p>
        </div>

        <div className="hero-right">
          <button className="btn btn-light" onClick={carregarProdutos}>
            <FiRefreshCw size={16} />
            <span>Atualizar</span>
          </button>

          <Link href="/Admin/produtos/cadastrar" className="btn btn-primary">
            <FiPlus size={16} />
            <span>Cadastrar</span>
          </Link>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch size={18} />
          <input
            placeholder="Buscar por nome, slug, sku, marca, modelo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="toolbar-right">
          <div className="select-box">
            <label htmlFor="itensPorPagina">Por página</label>
            <select
              id="itensPorPagina"
              value={itensPorPagina}
              onChange={(e) => setItensPorPagina(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="contador">
            <strong>{filtrados.length}</strong>
            <span>{filtrados.length === 1 ? "produto" : "produtos"}</span>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="estado">Carregando produtos...</div>
      ) : erro ? (
        <div className="estado erro">{erro}</div>
      ) : produtosPaginados.length === 0 ? (
        <div className="estado">Nenhum produto encontrado.</div>
      ) : (
        <>
          <div className="grid-cards">
            {produtosPaginados.map((p) => {
              const status = getStatus(p.status_id);
              const imagem = normalizarImagem(p);

              return (
                <div className="produto-card" key={String(getId(p))}>
                  <div className="produto-imagem-box">
                    {imagem ? (
                      <img
                        src={imagem}
                        alt={p.nome || "Produto"}
                        className="produto-imagem"
                      />
                    ) : (
                      <div className="imagem-vazia">
                        <FiBox size={28} />
                        <span>Sem imagem</span>
                      </div>
                    )}

                    <span className={`status-badge ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="produto-conteudo">
                    <div className="produto-topo">
                      <span className="produto-id">ID #{getId(p)}</span>
                      <span className="produto-sku">{p.sku || "Sem SKU"}</span>
                    </div>

                    <h3>{p.nome || "-"}</h3>
                    <p className="produto-slug">{p.slug || "-"}</p>

                    <div className="produto-meta">
                      <div className="meta-item">
                        <span className="meta-label">Marca</span>
                        <strong>{p.marca || "-"}</strong>
                      </div>

                      <div className="meta-item">
                        <span className="meta-label">Modelo</span>
                        <strong>{p.modelo || "-"}</strong>
                      </div>

                      <div className="meta-item">
                        <span className="meta-label">Categoria</span>
                        <strong>{p.categoria_id || "-"}</strong>
                      </div>
                    </div>

                    <div className="produto-descricao">
                      {p.descricao?.trim() || "Sem descrição cadastrada."}
                    </div>

                    <div className="precos">
                      <div className="preco-box">
                        <span>Preço</span>
                        <strong>{formatarPreco(Number(p.preco || 0))}</strong>
                      </div>

                      <div className="preco-box promocional">
                        <span>Promoção</span>
                        <strong>
                          {p.preco_promocional &&
                          Number(p.preco_promocional) > 0
                            ? formatarPreco(Number(p.preco_promocional))
                            : "-"}
                        </strong>
                      </div>
                    </div>

                    <div className="acoes-card">
                      <button
                        className="action-btn view"
                        onClick={() =>
                          router.push(`/Admin/produtos/${getId(p)}`)
                        }
                        type="button"
                      >
                        <FiEye size={16} />
                        <span>Ver</span>
                      </button>

                      <button
                        className="action-btn edit"
                        onClick={() =>
                          router.push(`/Admin/produtos/${getId(p)}/editar`)
                        }
                        type="button"
                      >
                        <FiEdit size={16} />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pagination-card">
            <div className="pagination-info">
              Mostrando <strong>{produtosPaginados.length}</strong> de{" "}
              <strong>{filtrados.length}</strong> produtos
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="page-btn"
                onClick={irPaginaAnterior}
                disabled={paginaSegura === 1}
              >
                <FiChevronLeft size={16} />
                <span>Anterior</span>
              </button>

              <div className="page-indicator">
                Página <strong>{paginaSegura}</strong> de{" "}
                <strong>{totalPaginas}</strong>
              </div>

              <button
                type="button"
                className="page-btn"
                onClick={irProximaPagina}
                disabled={paginaSegura === totalPaginas}
              >
                <span>Próxima</span>
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .pagina-produtos {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 28%),
            radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.1), transparent 30%),
            #f6f7fb;
          color: #111827;
        }

        .hero {
          max-width: 1450px;
          margin: 0 auto 20px auto;
          background: linear-gradient(135deg, #111827, #1f2937, #312e81);
          border-radius: 30px;
          padding: 28px;
          color: #fff;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
          flex-wrap: wrap;
        }

        .hero-left {
          max-width: 760px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.16);
          margin-bottom: 14px;
          font-size: 13px;
          font-weight: 700;
        }

        .hero h1 {
          margin: 0 0 10px 0;
          font-size: 2.2rem;
          line-height: 1.1;
        }

        .hero p {
          margin: 0;
          color: rgba(255, 255, 255, 0.82);
          line-height: 1.7;
          font-size: 1rem;
        }

        .hero-right {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          border: none;
          text-decoration: none;
          cursor: pointer;
          border-radius: 16px;
          padding: 14px 18px;
          font-weight: 700;
          transition: 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff;
          box-shadow: 0 12px 30px rgba(99, 102, 241, 0.3);
        }

        .btn-light {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .toolbar {
          max-width: 1450px;
          margin: 0 auto 18px auto;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(229, 231, 235, 0.9);
          border-radius: 22px;
          padding: 16px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
        }

        .search-box {
          flex: 1;
          min-width: 280px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 0 14px;
          height: 48px;
        }

        .search-box input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
          background: transparent;
          color: #111827;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .select-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 8px 12px;
        }

        .select-box label {
          font-size: 13px;
          font-weight: 700;
          color: #4b5563;
        }

        .select-box select {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        .contador {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 6px;
          color: #4b5563;
        }

        .contador strong {
          color: #111827;
          font-size: 18px;
        }

        .estado {
          max-width: 1450px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 28px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
        }

        .estado.erro {
          color: #b91c1c;
          border-color: #fecaca;
        }

        .grid-cards {
          max-width: 1450px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        .produto-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(229, 231, 235, 0.9);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          min-height: 100%;
        }

        .produto-imagem-box {
          position: relative;
          width: 100%;
          height: 230px;
          background: linear-gradient(135deg, #eef2ff, #f5f3ff);
          overflow: hidden;
        }

        .produto-imagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .imagem-vazia {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #6b7280;
        }

        .status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          min-height: 30px;
          padding: 0 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(8px);
        }

        .status-badge.ativo {
          background: rgba(34, 197, 94, 0.9);
          color: #fff;
        }

        .status-badge.inativo {
          background: rgba(239, 68, 68, 0.9);
          color: #fff;
        }

        .produto-conteudo {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
        }

        .produto-topo {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .produto-id {
          font-size: 12px;
          font-weight: 700;
          color: #4f46e5;
          background: #eef2ff;
          padding: 6px 10px;
          border-radius: 999px;
        }

        .produto-sku {
          font-size: 12px;
          color: #6b7280;
          background: #f8fafc;
          padding: 6px 10px;
          border-radius: 999px;
        }

        .produto-conteudo h3 {
          margin: 0;
          font-size: 18px;
          color: #111827;
          line-height: 1.3;
        }

        .produto-slug {
          margin: -6px 0 0;
          font-size: 13px;
          color: #6b7280;
          word-break: break-word;
        }

        .produto-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .meta-item {
          background: #f8fafc;
          border-radius: 14px;
          padding: 10px;
        }

        .meta-label {
          display: block;
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .meta-item strong {
          font-size: 13px;
          color: #111827;
          word-break: break-word;
        }

        .produto-descricao {
          color: #4b5563;
          font-size: 13px;
          line-height: 1.6;
          min-height: 42px;
        }

        .precos {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .preco-box {
          background: #f8fafc;
          border-radius: 16px;
          padding: 12px;
        }

        .preco-box span {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .preco-box strong {
          font-size: 16px;
          color: #111827;
        }

        .preco-box.promocional {
          background: linear-gradient(135deg, #fdf2f8, #f5f3ff);
        }

        .acoes-card {
          margin-top: auto;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .action-btn {
          min-height: 44px;
          border-radius: 14px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.22s ease;
        }

        .action-btn.view {
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
        }

        .action-btn.edit {
          background: rgba(139, 92, 246, 0.12);
          color: #7c3aed;
        }

        .pagination-card {
          max-width: 1450px;
          margin: 18px auto 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(229, 231, 235, 0.9);
          border-radius: 20px;
          padding: 14px 16px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
        }

        .pagination-info {
          color: #4b5563;
          font-size: 14px;
        }

        .pagination-info strong {
          color: #111827;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .page-btn {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #111827;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-indicator {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          display: inline-flex;
          align-items: center;
          color: #4b5563;
          font-size: 14px;
        }

        .page-indicator strong {
          color: #111827;
          margin: 0 4px;
        }

        @media (max-width: 992px) {
          .hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-right {
            width: 100%;
          }

          .toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .toolbar-right {
            justify-content: space-between;
          }

          .produto-meta,
          .precos {
            grid-template-columns: 1fr;
          }

          .pagination-card {
            flex-direction: column;
            align-items: stretch;
          }

          .pagination-controls {
            justify-content: space-between;
          }
        }

        @media (max-width: 768px) {
          .pagina-produtos {
            padding: 16px;
          }

          .hero {
            padding: 22px;
            border-radius: 24px;
          }

          .hero h1 {
            font-size: 1.8rem;
          }

          .hero-right .btn {
            width: 100%;
          }

          .toolbar-right {
            flex-direction: column;
            align-items: stretch;
          }

          .select-box {
            justify-content: space-between;
          }

          .acoes-card {
            grid-template-columns: 1fr;
          }

          .pagination-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .page-btn,
          .page-indicator {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}