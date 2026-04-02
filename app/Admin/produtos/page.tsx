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
  FiTag,
  FiHash,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
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

function formatarData(data?: string) {
  if (!data) return "-";

  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return data;

  return d.toLocaleDateString("pt-BR");
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

          <h1>Listagem de produtos</h1>
          <p>
            Visualize os produtos cadastrados com mais detalhes, pesquisa rápida
            e paginação organizada.
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
            <span>
              {filtrados.length === 1 ? "produto" : "produtos"}
            </span>
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
          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Produto</th>
                    <th>SKU</th>
                    <th>Marca / Modelo</th>
                    <th>Preço</th>
                    <th>Promoção</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Criado</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {produtosPaginados.map((p) => {
                    const status = getStatus(p.status_id);

                    return (
                      <tr key={String(getId(p))}>
                        <td>
                          <div className="cell-inline">
                            <FiHash size={14} />
                            <span>{getId(p)}</span>
                          </div>
                        </td>

                        <td>
                          <div className="produto-cell">
                            <div className="produto-icon">
                              <FiBox size={16} />
                            </div>

                            <div className="produto-info">
                              <strong>{p.nome || "-"}</strong>
                              <span>{p.slug || "-"}</span>
                            </div>
                          </div>
                        </td>

                        <td>{p.sku || "-"}</td>

                        <td>
                          <div className="stack">
                            <span>{p.marca || "-"}</span>
                            <small>{p.modelo || "-"}</small>
                          </div>
                        </td>

                        <td>{formatarPreco(Number(p.preco || 0))}</td>

                        <td>
                          {p.preco_promocional &&
                          Number(p.preco_promocional) > 0
                            ? formatarPreco(Number(p.preco_promocional))
                            : "-"}
                        </td>

                        <td>{p.categoria_id || "-"}</td>

                        <td>
                          <span className={`status ${status.className}`}>
                            {status.label}
                          </span>
                        </td>

                        <td>
                          <div className="cell-inline">
                            <FiCalendar size={14} />
                            <span>{formatarData(p.criado_em)}</span>
                          </div>
                        </td>

                        <td>
                          <div className="acoes-tabela">
                            <button
                              className="icon-btn view"
                              onClick={() =>
                                router.push(`/Admin/produtos/${getId(p)}`)
                              }
                              title="Ver produto"
                              type="button"
                            >
                              <FiEye size={16} />
                            </button>

                            <button
                              className="icon-btn edit"
                              onClick={() =>
                                router.push(`/Admin/produtos/${getId(p)}/editar`)
                              }
                              title="Editar produto"
                              type="button"
                            >
                              <FiEdit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

        .table-card {
          max-width: 1450px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(229, 231, 235, 0.9);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1250px;
        }

        th,
        td {
          border-bottom: 1px solid #eef2f7;
          padding: 14px 16px;
          text-align: left;
          vertical-align: middle;
        }

        th {
          background: #f8fafc;
          color: #475569;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        tbody tr:hover {
          background: rgba(99, 102, 241, 0.03);
        }

        .cell-inline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .produto-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 220px;
        }

        .produto-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .produto-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .produto-info strong {
          font-size: 14px;
          color: #111827;
        }

        .produto-info span {
          font-size: 12px;
          color: #6b7280;
        }

        .stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stack span {
          color: #111827;
          font-weight: 600;
        }

        .stack small {
          color: #6b7280;
        }

        .status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .status.ativo {
          background: rgba(34, 197, 94, 0.14);
          color: #166534;
        }

        .status.inativo {
          background: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
        }

        .acoes-tabela {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.22s ease;
        }

        .icon-btn.view {
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
        }

        .icon-btn.edit {
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