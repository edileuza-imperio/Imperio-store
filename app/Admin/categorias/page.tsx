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
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiX,
  FiSave,
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

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(5);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<Categoria | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    slug: "",
    descricao: "",
    ordem: 0,
    status_id: 1,
    site_config_id: 1,
  });

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
      console.error(error);

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

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, itensPorPagina]);

  const categoriasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    if (!termo) return categorias;

    return categorias.filter((categoria) => {
      const nome = categoria.nome?.toLowerCase() || "";
      const slug = categoria.slug?.toLowerCase() || "";
      const descricao = categoria.descricao?.toLowerCase() || "";

      return (
        nome.includes(termo) ||
        slug.includes(termo) ||
        descricao.includes(termo)
      );
    });
  }, [categorias, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(categoriasFiltradas.length / itensPorPagina)
  );

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;

  const categoriasPaginadas = categoriasFiltradas.slice(inicio, fim);

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
      label: "Inativo",
      className: "inativo",
      icon: <FiAlertCircle size={14} />,
    };
  }

  function abrirEditar(categoria: Categoria) {
    setCategoriaSelecionada(categoria);

    setForm({
      nome: categoria.nome || "",
      slug: categoria.slug || "",
      descricao: categoria.descricao || "",
      ordem: categoria.ordem || 0,
      status_id: categoria.status_id || 1,
      site_config_id: categoria.site_config_id || 1,
    });

    setModalEditar(true);
  }

  async function salvarEdicao() {
    if (!categoriaSelecionada) return;

    try {
      setSalvando(true);

      const id = getId(categoriaSelecionada);

      await api.put(`/painel/categoria/${id}`, form);

      setModalEditar(false);

      await carregarCategorias();
    } catch (error: any) {
      alert(
        error?.response?.data?.mensagem ||
          "Erro ao atualizar categoria."
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirExcluir(categoria: Categoria) {
    setCategoriaSelecionada(categoria);
    setModalExcluir(true);
  }

  async function excluirCategoria() {
    if (!categoriaSelecionada) return;

    try {
      setExcluindo(true);

      const id = getId(categoriaSelecionada);

      await api.delete(`/painel/categoria/${id}`);

      setModalExcluir(false);

      await carregarCategorias();
    } catch (error: any) {
      alert(
        error?.response?.data?.mensagem ||
          "Erro ao excluir categoria."
      );
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="categorias-page">
      {/* HEADER */}

      <div className="topbar">
        <div className="topbar-left">
          <div className="icon-wrap">
            <FiFolder size={28} />
          </div>

          <div>
            <span className="kicker">Painel administrativo</span>

            <h1>Categorias</h1>

            <p>
              Gerencie categorias, visualize dados e organize o conteúdo.
            </p>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-light"
            onClick={carregarCategorias}
          >
            <FiRefreshCw />
            Atualizar
          </button>

          <Link
            href="/Admin/categorias/cadastrar"
            className="btn btn-primary"
          >
            <FiPlus />
            Nova categoria
          </Link>
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="toolbar">
        <div className="search-box">
          <FiSearch />

          <input
            type="text"
            placeholder="Buscar categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="toolbar-right">
          <div className="select-wrap">
            <span>Por página</span>

            <select
              value={itensPorPagina}
              onChange={(e) =>
                setItensPorPagina(Number(e.target.value))
              }
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="counter">
            <strong>{categoriasFiltradas.length}</strong>
            categorias
          </div>
        </div>
      </div>

      {/* STATES */}

      {erro ? (
        <div className="state error">
          <FiAlertCircle />
          <span>{erro}</span>
        </div>
      ) : loading ? (
        <div className="state loading">
          <FiRefreshCw className="spin" />
          <span>Carregando categorias...</span>
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="state empty">
          <FiFolder />
          <span>Nenhuma categoria encontrada.</span>
        </div>
      ) : (
        <>
          {/* TABELA */}

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
                  {categoriasPaginadas.map((categoria) => {
                    const id = getId(categoria);

                    const status = getStatusInfo(
                      categoria.status_id
                    );

                    return (
                      <tr key={id}>
                        <td>
                          <div className="cell">
                            <FiHash />
                            {id}
                          </div>
                        </td>

                        <td>
                          <div className="cell strong">
                            <FiTag />
                            {categoria.nome}
                          </div>
                        </td>

                        <td>
                          <code>{categoria.slug}</code>
                        </td>

                        <td className="descricao">
                          {categoria.descricao || "Sem descrição"}
                        </td>

                        <td>
                          <div className="cell">
                            <FiLayers />
                            {categoria.site_config_id}
                          </div>
                        </td>

                        <td>{categoria.ordem}</td>

                        <td>
                          <span
                            className={`status ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </td>

                        <td>
                          <div className="acoes">
                            <button
                              className="icon-btn edit"
                              onClick={() =>
                                abrirEditar(categoria)
                              }
                            >
                              <FiEdit />
                            </button>

                            <button
                              className="icon-btn delete"
                              onClick={() =>
                                abrirExcluir(categoria)
                              }
                            >
                              <FiTrash2 />
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

          {/* PAGINAÇÃO */}

          <div className="pagination">
            <button
              className="page-btn"
              disabled={paginaAtual === 1}
              onClick={() =>
                setPaginaAtual((prev) => prev - 1)
              }
            >
              <FiChevronLeft />
              Anterior
            </button>

            <div className="page-info">
              Página <strong>{paginaAtual}</strong> de{" "}
              <strong>{totalPaginas}</strong>
            </div>

            <button
              className="page-btn"
              disabled={paginaAtual === totalPaginas}
              onClick={() =>
                setPaginaAtual((prev) => prev + 1)
              }
            >
              Próxima
              <FiChevronRight />
            </button>
          </div>
        </>
      )}

      {/* MODAL EDITAR */}

      {modalEditar && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Editar categoria</h2>

              <button
                className="close-btn"
                onClick={() => setModalEditar(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nome</label>

                <input
                  value={form.nome}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nome: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Slug</label>

                <input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>

                <textarea
                  rows={4}
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      descricao: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid">
                <div className="form-group">
                  <label>Ordem</label>

                  <input
                    type="number"
                    value={form.ordem}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ordem: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>

                  <select
                    value={form.status_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status_id: Number(e.target.value),
                      })
                    }
                  >
                    <option value={1}>Ativo</option>
                    <option value={2}>Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-light"
                onClick={() => setModalEditar(false)}
              >
                Cancelar
              </button>

              <button
                className="btn btn-primary"
                onClick={salvarEdicao}
              >
                <FiSave />
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}

      {modalExcluir && (
        <div className="modal-overlay">
          <div className="modal modal-danger">
            <div className="modal-header">
              <h2>Excluir categoria</h2>

              <button
                className="close-btn"
                onClick={() => setModalExcluir(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Deseja realmente excluir a categoria:
              </p>

              <strong>
                {categoriaSelecionada?.nome}
              </strong>

              <p className="danger-text">
                Essa ação não poderá ser desfeita.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-light"
                onClick={() => setModalExcluir(false)}
              >
                Cancelar
              </button>

              <button
                className="btn btn-danger"
                onClick={excluirCategoria}
              >
                <FiTrash2 />
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .categorias-page {
          display: flex;
          flex-direction: column;
          gap: 22px;
          padding: 10px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 22px;
          background: linear-gradient(
            135deg,
            #ff9966,
            #ff5e62
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 20px 40px rgba(255, 94, 98, 0.3);
        }

        .kicker {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ff5e62;
        }

        h1 {
          margin: 4px 0;
          font-size: 34px;
          color: #1f2937;
        }

        p {
          margin: 0;
          color: #6b7280;
        }

        .topbar-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          height: 48px;
          border: none;
          padding: 0 18px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.25s;
          text-decoration: none;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn-primary {
          background: linear-gradient(
            135deg,
            #ff9966,
            #ff5e62
          );
          color: white;
        }

        .btn-light {
          background: white;
          border: 1px solid #e5e7eb;
          color: #111827;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          background: white;
          border-radius: 24px;
          padding: 18px;
          border: 1px solid #f3f4f6;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }

        .search-box {
          flex: 1;
          min-width: 260px;
          height: 52px;
          border-radius: 16px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 15px;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .select-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f9fafb;
          padding: 0 14px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          height: 50px;
        }

        .select-wrap select {
          border: none;
          background: transparent;
          outline: none;
          font-weight: 700;
        }

        .counter {
          height: 50px;
          padding: 0 18px;
          border-radius: 14px;
          background: linear-gradient(
            135deg,
            rgba(255, 153, 102, 0.15),
            rgba(255, 94, 98, 0.15)
          );
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }

        .table-card {
          background: white;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid #f3f4f6;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.04);
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
        }

        thead {
          background: #f9fafb;
        }

        th {
          padding: 18px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
        }

        td {
          padding: 18px;
          border-top: 1px solid #f3f4f6;
          font-size: 14px;
          color: #374151;
        }

        tr:hover {
          background: #fafafa;
        }

        .cell {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .strong {
          font-weight: 800;
          color: #111827;
        }

        .descricao {
          max-width: 320px;
        }

        code {
          background: #fff3ed;
          color: #ff5e62;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .ativo {
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
        }

        .inativo {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        }

        .acoes {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }

        .icon-btn:hover {
          transform: scale(1.06);
        }

        .icon-btn.edit {
          background: rgba(59, 130, 246, 0.12);
          color: #2563eb;
        }

        .icon-btn.delete {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          background: white;
          border-radius: 24px;
          padding: 16px 18px;
          border: 1px solid #f3f4f6;
        }

        .page-btn {
          height: 46px;
          padding: 0 16px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          background: white;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .page-info {
          font-weight: 600;
          color: #6b7280;
        }

        .state {
          height: 72px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
          font-weight: 700;
        }

        .loading {
          background: #eff6ff;
          color: #2563eb;
        }

        .error {
          background: #fef2f2;
          color: #dc2626;
        }

        .empty {
          background: #f9fafb;
          color: #6b7280;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* MODAL */

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(6px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal {
          width: 100%;
          max-width: 620px;
          background: white;
          border-radius: 30px;
          overflow: hidden;
          animation: modalIn 0.25s ease;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }

        .modal-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f3f4f6;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
        }

        .close-btn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: none;
          background: #f3f4f6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 700;
          color: #374151;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
          outline: none;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          border-color: #ff5e62;
          box-shadow: 0 0 0 4px rgba(255, 94, 98, 0.1);
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-footer {
          padding: 24px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .modal-danger {
          max-width: 500px;
        }

        .danger-text {
          margin-top: 12px;
          color: #dc2626;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .topbar {
            align-items: flex-start;
          }

          .topbar-actions {
            width: 100%;
          }

          .btn {
            flex: 1;
          }

          .pagination {
            flex-direction: column;
          }

          .page-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}