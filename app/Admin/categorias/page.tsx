"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

import {
  FiPlus,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiGrid,
  FiFolder,
  FiHash,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiSave,
} from "react-icons/fi";

type Categoria = {
  id_categoria?: number;
  id?: number;
  nome?: string;
  slug?: string;
  descricao?: string | null;
  imagem?: string | null;
  icone?: string | null;
  ordem?: number;
  status_id?: number;
  site_config_id?: number;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

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
  });

  async function carregarCategorias() {
    try {
      setLoading(true);

      const response = await api.get("/painel/categorias");

      const data = response?.data;

      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.dados)
        ? data.dados
        : [];

      setCategorias(lista);
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.response?.data?.mensagem ||
          "Erro ao carregar categorias"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase();

    return categorias.filter((categoria) => {
      const nome = categoria.nome?.toLowerCase() || "";
      const slug = categoria.slug?.toLowerCase() || "";
      const descricao =
        categoria.descricao?.toLowerCase() || "";

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

  function abrirEditar(categoria: Categoria) {
    setCategoriaSelecionada(categoria);

    setForm({
      nome: categoria.nome || "",
      slug: categoria.slug || "",
      descricao: categoria.descricao || "",
      ordem: categoria.ordem || 0,
      status_id: categoria.status_id || 1,
    });

    setModalEditar(true);
  }

  async function salvarEdicao() {
    if (!categoriaSelecionada) return;

    try {
      setSalvando(true);

      await api.put(
        `/painel/categoria/${getId(
          categoriaSelecionada
        )}`,
        form
      );

      await carregarCategorias();

      setModalEditar(false);
    } catch (error: any) {
      alert(
        error?.response?.data?.mensagem ||
          "Erro ao atualizar categoria"
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

      await api.delete(
        `/painel/categoria/${getId(
          categoriaSelecionada
        )}`
      );

      await carregarCategorias();

      setModalExcluir(false);
    } catch (error: any) {
      alert(
        error?.response?.data?.mensagem ||
          "Erro ao excluir categoria"
      );
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="page">
      {/* HERO */}

      <div className="hero">
        <div className="hero-left">
          <div className="hero-icon">
            <FiGrid size={30} />
          </div>

          <div>
            <span className="mini-title">
              PAINEL ADMINISTRATIVO
            </span>

            <h1>Categorias</h1>

            <p>
              Organize, edite e controle todas as categorias
              do sistema.
            </p>
          </div>
        </div>

        <div className="hero-actions">
          <button
            className="btn glass"
            onClick={carregarCategorias}
          >
            <FiRefreshCw />
            Atualizar
          </button>

          <Link
            href="/Admin/categorias/cadastrar"
            className="btn primary"
          >
            <FiPlus />
            Nova categoria
          </Link>
        </div>
      </div>

      {/* BUSCA */}

      <div className="search-wrapper">
        <div className="search-box">
          <FiSearch />

          <input
            type="text"
            placeholder="Pesquisar categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="results-count">
          <strong>{categoriasFiltradas.length}</strong>
          <span>Categorias</span>
        </div>
      </div>

      {/* ESTADOS */}

      {loading ? (
        <div className="state loading">
          <FiRefreshCw className="spin" />
          Carregando categorias...
        </div>
      ) : erro ? (
        <div className="state error">
          <FiAlertCircle />
          {erro}
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="empty">
          <FiFolder size={48} />

          <h2>Nenhuma categoria encontrada</h2>

          <p>
            Tente outro termo ou crie uma nova categoria.
          </p>
        </div>
      ) : (
        <div className="grid-categorias">
          {categoriasFiltradas.map((categoria) => {
            const ativo = categoria.status_id === 1;

            return (
              <div
                key={getId(categoria)}
                className="card"
              >
                <div className="card-top">
                  <div className="badge-id">
                    <FiHash />
                    {getId(categoria)}
                  </div>

                  <div
                    className={`status ${
                      ativo ? "ativo" : "inativo"
                    }`}
                  >
                    {ativo ? (
                      <>
                        <FiCheckCircle />
                        Ativo
                      </>
                    ) : (
                      <>
                        <FiAlertCircle />
                        Inativo
                      </>
                    )}
                  </div>
                </div>

                <div className="card-content">
                  <div className="icon-card">
                    <FiFolder />
                  </div>

                  <h3>{categoria.nome}</h3>

                  <span className="slug">
                    /{categoria.slug}
                  </span>

                  <p>
                    {categoria.descricao ||
                      "Categoria sem descrição cadastrada."}
                  </p>
                </div>

                <div className="meta">
                  <div>
                    <small>Ordem</small>
                    <strong>
                      #{categoria.ordem || 0}
                    </strong>
                  </div>

                  <div>
                    <small>Site</small>
                    <strong>
                      {categoria.site_config_id || 1}
                    </strong>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="action edit"
                    onClick={() =>
                      abrirEditar(categoria)
                    }
                  >
                    <FiEdit2 />
                    Editar
                  </button>

                  <button
                    className="action delete"
                    onClick={() =>
                      abrirExcluir(categoria)
                    }
                  >
                    <FiTrash2 />
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL EDITAR */}

      {modalEditar && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Editar categoria</h2>

              <button
                className="close"
                onClick={() =>
                  setModalEditar(false)
                }
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="field">
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

              <div className="field">
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

              <div className="field">
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

              <div className="grid-form">
                <div className="field">
                  <label>Ordem</label>

                  <input
                    type="number"
                    value={form.ordem}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ordem: Number(
                          e.target.value
                        ),
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>Status</label>

                  <select
                    value={form.status_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status_id: Number(
                          e.target.value
                        ),
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
                className="btn glass"
                onClick={() =>
                  setModalEditar(false)
                }
              >
                Cancelar
              </button>

              <button
                className="btn primary"
                onClick={salvarEdicao}
              >
                <FiSave />

                {salvando
                  ? "Salvando..."
                  : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}

      {modalExcluir && (
        <div className="overlay">
          <div className="modal danger">
            <div className="modal-header">
              <h2>Excluir categoria</h2>

              <button
                className="close"
                onClick={() =>
                  setModalExcluir(false)
                }
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Deseja realmente excluir:
              </p>

              <strong>
                {categoriaSelecionada?.nome}
              </strong>

              <span className="danger-text">
                Essa ação é irreversível.
              </span>
            </div>

            <div className="modal-footer">
              <button
                className="btn glass"
                onClick={() =>
                  setModalExcluir(false)
                }
              >
                Cancelar
              </button>

              <button
                className="btn danger-btn"
                onClick={excluirCategoria}
              >
                <FiTrash2 />

                {excluindo
                  ? "Excluindo..."
                  : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 12px;
        }

        body {
          background: #f5f7fb;
        }

        /* HERO */

        .hero {
          width: 100%;
          border-radius: 34px;
          padding: 34px;
          background: linear-gradient(
            135deg,
            #111827,
            #1f2937,
            #374151
          );
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          overflow: hidden;
          position: relative;
        }

        .hero::before {
          content: "";
          position: absolute;
          width: 400px;
          height: 400px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 50%;
          right: -100px;
          top: -100px;
        }

        .hero-left {
          display: flex;
          align-items: center;
          gap: 18px;
          z-index: 2;
        }

        .hero-icon {
          width: 80px;
          height: 80px;
          border-radius: 28px;
          background: linear-gradient(
            135deg,
            #8b5cf6,
            #6366f1
          );
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4);
        }

        .mini-title {
          font-size: 11px;
          letter-spacing: 0.18em;
          font-weight: 800;
          opacity: 0.7;
        }

        h1 {
          margin: 8px 0;
          font-size: 42px;
          font-weight: 900;
        }

        .hero p {
          color: rgba(255, 255, 255, 0.7);
          max-width: 520px;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          z-index: 2;
          flex-wrap: wrap;
        }

        /* BUTTONS */

        .btn {
          height: 52px;
          border-radius: 18px;
          border: none;
          padding: 0 22px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.25s;
          font-weight: 700;
          text-decoration: none;
          font-size: 14px;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn.primary {
          background: linear-gradient(
            135deg,
            #8b5cf6,
            #6366f1
          );
          color: white;
          box-shadow: 0 14px 30px rgba(99, 102, 241, 0.35);
        }

        .btn.glass {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .danger-btn {
          background: #ef4444;
          color: white;
        }

        /* SEARCH */

        .search-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 280px;
          height: 62px;
          background: white;
          border-radius: 22px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          background: transparent;
        }

        .results-count {
          min-width: 140px;
          height: 62px;
          border-radius: 22px;
          background: white;
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }

        .results-count strong {
          font-size: 22px;
          color: #111827;
        }

        .results-count span {
          color: #6b7280;
          font-size: 13px;
        }

        /* GRID */

        .grid-categorias {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(320px, 1fr)
          );
          gap: 22px;
        }

        .card {
          background: white;
          border-radius: 30px;
          padding: 22px;
          border: 1px solid #eceff4;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.05);
          transition: 0.3s;
          position: relative;
          overflow: hidden;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
        }

        .card::before {
          content: "";
          position: absolute;
          width: 180px;
          height: 180px;
          background: linear-gradient(
            135deg,
            rgba(139, 92, 246, 0.08),
            rgba(99, 102, 241, 0.05)
          );
          border-radius: 50%;
          top: -60px;
          right: -60px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          position: relative;
          z-index: 2;
        }

        .badge-id {
          height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
        }

        .status {
          height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
        }

        .ativo {
          background: rgba(34, 197, 94, 0.12);
          color: #16a34a;
        }

        .inativo {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .card-content {
          position: relative;
          z-index: 2;
        }

        .icon-card {
          width: 68px;
          height: 68px;
          border-radius: 22px;
          background: linear-gradient(
            135deg,
            #8b5cf6,
            #6366f1
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 18px;
          font-size: 24px;
        }

        .card h3 {
          margin: 0;
          font-size: 24px;
          color: #111827;
        }

        .slug {
          display: inline-block;
          margin-top: 8px;
          color: #6366f1;
          font-weight: 700;
          font-size: 13px;
          background: #eef2ff;
          padding: 6px 12px;
          border-radius: 999px;
        }

        .card p {
          margin-top: 18px;
          color: #6b7280;
          line-height: 1.7;
          font-size: 14px;
          min-height: 70px;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #f3f4f6;
        }

        .meta div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .meta small {
          color: #9ca3af;
          font-size: 12px;
        }

        .meta strong {
          color: #111827;
          font-size: 15px;
        }

        .card-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .action {
          flex: 1;
          height: 48px;
          border-radius: 16px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.25s;
        }

        .action:hover {
          transform: translateY(-2px);
        }

        .action.edit {
          background: #eef2ff;
          color: #4f46e5;
        }

        .action.delete {
          background: #fef2f2;
          color: #ef4444;
        }

        /* STATES */

        .state {
          height: 72px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-weight: 700;
        }

        .loading {
          background: #eef2ff;
          color: #4f46e5;
        }

        .error {
          background: #fef2f2;
          color: #ef4444;
        }

        .empty {
          background: white;
          border-radius: 30px;
          padding: 80px 30px;
          text-align: center;
          border: 1px solid #eceff4;
        }

        .empty h2 {
          margin-top: 20px;
          color: #111827;
        }

        .empty p {
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

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }

        .modal {
          width: 100%;
          max-width: 650px;
          background: white;
          border-radius: 34px;
          overflow: hidden;
          animation: modal 0.25s ease;
        }

        @keyframes modal {
          from {
            opacity: 0;
            transform: translateY(20px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0px)
              scale(1);
          }
        }

        .modal-header {
          padding: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f3f4f6;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 28px;
        }

        .close {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          border: none;
          background: #f3f4f6;
          cursor: pointer;
        }

        .modal-body {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          font-weight: 700;
          color: #374151;
        }

        .field input,
        .field textarea,
        .field select {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px;
          outline: none;
          font-size: 14px;
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px
            rgba(99, 102, 241, 0.1);
        }

        .grid-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-footer {
          padding: 28px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .danger {
          max-width: 500px;
        }

        .danger-text {
          margin-top: 14px;
          color: #ef4444;
          font-weight: 700;
        }

        /* RESPONSIVO */

        @media (max-width: 768px) {
          .hero {
            padding: 26px;
          }

          h1 {
            font-size: 32px;
          }

          .hero-actions {
            width: 100%;
          }

          .btn {
            flex: 1;
            justify-content: center;
          }

          .grid-form {
            grid-template-columns: 1fr;
          }

          .card-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}