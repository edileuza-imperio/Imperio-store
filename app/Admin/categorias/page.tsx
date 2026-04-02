"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  FiPlus,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiTag,
  FiHash,
  FiLayers,
  FiCheckCircle,
  FiAlertCircle,
  FiFolder,
} from "react-icons/fi";

type Categoria = {
  id_categoria?: number;
  id?: number;
  site_config_id?: number;
  nome?: string;
  slug?: string;
  descricao?: string | null;
  icone?: string | null;
  imagem?: string | null;
  ordem?: number;
  status_id?: number;
  criado?: string;
  atualizado?: string;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  async function carregarCategorias() {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get("/painel/categorias");
      const data = response?.data;

      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.dados)
        ? data.dados
        : Array.isArray(data?.categorias)
        ? data.categorias
        : [];

      setCategorias(lista);
    } catch (error: any) {
      console.error("Erro ao carregar categorias:", error?.response?.data || error);

      setCategorias([]);
      setErro(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao carregar categorias."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return categorias;

    return categorias.filter((categoria) => {
      const nome = (categoria?.nome || "").toLowerCase();
      const slug = (categoria?.slug || "").toLowerCase();
      const descricao = (categoria?.descricao || "").toLowerCase();

      return (
        nome.includes(termo) ||
        slug.includes(termo) ||
        descricao.includes(termo)
      );
    });
  }, [categorias, busca]);

  function getId(categoria: Categoria) {
    return categoria.id_categoria ?? categoria.id ?? 0;
  }

  function getStatusInfo(statusId?: number) {
    if (statusId === 1) {
      return {
        label: "Ativo",
        className: "ativo",
        icon: <FiCheckCircle size={14} />,
      };
    }

    return {
      label: `Status ${statusId ?? "-"}`,
      className: "inativo",
      icon: <FiAlertCircle size={14} />,
    };
  }

  return (
    <div className="categorias-page">
      <div className="page-header">
        <div className="header-left">
          <div className="header-icon">
            <FiFolder size={24} />
          </div>

          <div>
            <span className="page-kicker">Painel administrativo</span>
            <h1>Categorias</h1>
            <p>Visualize, pesquise e gerencie as categorias cadastradas.</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-light"
            onClick={carregarCategorias}
            disabled={loading}
          >
            <FiRefreshCw size={16} />
            <span>{loading ? "Carregando..." : "Atualizar"}</span>
          </button>

          <Link href="/Admin/categorias/cadastrar" className="btn btn-primary">
            <FiPlus size={16} />
            <span>Nova categoria</span>
          </Link>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por nome, slug ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="toolbar-info">
          <strong>{categoriasFiltradas.length}</strong>
          <span>
            {categoriasFiltradas.length === 1 ? "categoria encontrada" : "categorias encontradas"}
          </span>
        </div>
      </div>

      {erro ? (
        <div className="state-box error">
          <FiAlertCircle size={18} />
          <div>
            <strong>Erro ao carregar categorias</strong>
            <p>{erro}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="state-box loading">
          <FiRefreshCw size={18} className="spin" />
          <div>
            <strong>Carregando categorias</strong>
            <p>Aguarde enquanto buscamos os dados.</p>
          </div>
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="state-box empty">
          <FiFolder size={18} />
          <div>
            <strong>Nenhuma categoria encontrada</strong>
            <p>
              {busca
                ? "Tente pesquisar com outro termo."
                : "Ainda não existem categorias cadastradas."}
            </p>
          </div>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th>Descrição</th>
                  <th>Site</th>
                  <th>Ordem</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {categoriasFiltradas.map((categoria) => {
                  const id = getId(categoria);
                  const status = getStatusInfo(categoria.status_id);

                  return (
                    <tr key={id}>
                      <td>
                        <div className="cell-inline">
                          <FiHash size={14} />
                          <span>{id}</span>
                        </div>
                      </td>

                      <td>
                        <div className="cell-strong">
                          <FiTag size={14} />
                          <span>{categoria.nome || "-"}</span>
                        </div>
                      </td>

                      <td>
                        <code>{categoria.slug || "-"}</code>
                      </td>

                      <td className="descricao-cell">
                        {categoria.descricao?.trim() || "Sem descrição"}
                      </td>

                      <td>
                        <div className="cell-inline">
                          <FiLayers size={14} />
                          <span>{categoria.site_config_id ?? "-"}</span>
                        </div>
                      </td>

                      <td>{categoria.ordem ?? "-"}</td>

                      <td>
                        <span className={`status-badge ${status.className}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>

                      <td>
                        <div className="actions">
                          <Link
                            href={`/Admin/categorias/${id}/editar`}
                            className="icon-btn edit"
                            title="Editar categoria"
                          >
                            <FiEdit size={16} />
                          </Link>

                          <button
                            type="button"
                            className="icon-btn delete"
                            title="Excluir categoria"
                            onClick={() => {
                              alert(`Depois eu posso te montar a exclusão da categoria ID ${id}.`);
                            }}
                          >
                            <FiTrash2 size={16} />
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
      )}

      <style jsx>{`
        .categorias-page {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .header-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #d18b72 0%, #b55f53 100%);
          color: #fff;
          box-shadow: 0 16px 28px rgba(181, 95, 83, 0.18);
          flex-shrink: 0;
        }

        .page-kicker {
          display: inline-block;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #b55f53;
          margin-bottom: 6px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.1;
          color: #352720;
          font-weight: 900;
        }

        .page-header p {
          margin: 6px 0 0;
          color: #7d6358;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn {
          min-height: 46px;
          padding: 0 16px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 800;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: 0.22s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-light {
          background: #fff;
          color: #4a352e;
          border: 1px solid #ead7cb;
          box-shadow: 0 10px 22px rgba(83, 59, 51, 0.05);
        }

        .btn-primary {
          background: linear-gradient(135deg, #d18b72 0%, #b55f53 100%);
          color: #fff;
          box-shadow: 0 14px 24px rgba(181, 95, 83, 0.2);
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(232, 214, 204, 0.92);
          border-radius: 20px;
          padding: 14px;
        }

        .search-box {
          flex: 1;
          min-width: 260px;
        }

        .search-box input {
          width: 100%;
          height: 48px;
          border-radius: 14px;
          border: 1px solid #ead7cb;
          background: #fff;
          padding: 0 14px;
          outline: none;
          color: #352720;
          font-size: 14px;
        }

        .search-box input:focus {
          border-color: #d18b72;
          box-shadow: 0 0 0 4px rgba(209, 139, 114, 0.12);
        }

        .toolbar-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6f554b;
          font-size: 14px;
          white-space: nowrap;
        }

        .toolbar-info strong {
          color: #352720;
          font-size: 18px;
        }

        .state-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(232, 214, 204, 0.92);
          background: rgba(255, 255, 255, 0.82);
        }

        .state-box strong {
          display: block;
          color: #352720;
          font-size: 15px;
        }

        .state-box p {
          margin: 6px 0 0;
          color: #7d6358;
          font-size: 13px;
        }

        .state-box.error {
          border-color: rgba(239, 68, 68, 0.18);
          background: rgba(254, 242, 242, 0.95);
          color: #b91c1c;
        }

        .table-card {
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(232, 214, 204, 0.92);
          box-shadow: 0 18px 35px rgba(83, 59, 51, 0.06);
          overflow: hidden;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 980px;
        }

        thead th {
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #8a6e63;
          background: #fff7f2;
          padding: 16px 18px;
          border-bottom: 1px solid #f0dfd6;
        }

        tbody td {
          padding: 16px 18px;
          border-bottom: 1px solid #f6ebe4;
          color: #4b3831;
          font-size: 14px;
          vertical-align: middle;
        }

        tbody tr:hover {
          background: rgba(255, 250, 246, 0.8);
        }

        .cell-inline,
        .cell-strong {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .cell-strong {
          font-weight: 800;
          color: #352720;
        }

        .descricao-cell {
          max-width: 280px;
          white-space: normal;
        }

        code {
          background: #fff3ea;
          color: #8b4d3e;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 32px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
        }

        .status-badge.ativo {
          background: rgba(34, 197, 94, 0.12);
          color: #166534;
          border-color: rgba(34, 197, 94, 0.18);
        }

        .status-badge.inativo {
          background: rgba(239, 68, 68, 0.1);
          color: #b91c1c;
          border-color: rgba(239, 68, 68, 0.14);
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          text-decoration: none;
          cursor: pointer;
          transition: 0.22s ease;
        }

        .icon-btn:hover {
          transform: translateY(-1px);
        }

        .icon-btn.edit {
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
        }

        .icon-btn.delete {
          background: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 860px) {
          .page-header {
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
          }

          .btn {
            flex: 1;
          }

          .toolbar {
            align-items: stretch;
          }

          .toolbar-info {
            width: 100%;
            justify-content: flex-start;
          }

          .search-box {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}