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
  FiSave,
  FiX,
} from "react-icons/fi";

type Categoria = {
  id_categoria?: number;
  id?: number;
  nome?: string;
  slug?: string;
  descricao?: string | null;
  ordem?: number;
  status_id?: number;
  site_config_id?: number;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(
    null
  );

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

  function iniciarEdicao(categoria: Categoria) {
    setEditandoId(getId(categoria));

    setForm({
      nome: categoria.nome || "",
      slug: categoria.slug || "",
      descricao: categoria.descricao || "",
      ordem: categoria.ordem || 0,
      status_id: categoria.status_id || 1,
    });
  }

  async function salvarEdicao(id: number) {
    try {
      await api.put(`/painel/categoria/${id}`, form);

      setEditandoId(null);

      carregarCategorias();
    } catch (error: any) {
      alert(
        error?.response?.data?.mensagem ||
          "Erro ao atualizar categoria"
      );
    }
  }

  async function excluirCategoria(id: number) {
    const confirmar = confirm(
      "Deseja realmente excluir esta categoria?"
    );

    if (!confirmar) return;

    try {
      await api.delete(`/painel/categoria/${id}`);

      carregarCategorias();
    } catch (error: any) {
      alert(
        error?.response?.data?.mensagem ||
          "Erro ao excluir categoria"
      );
    }
  }

  return (
    <div className="page">
      {/* HERO */}

      <div className="hero">
        <div className="hero-left">
          <div className="hero-icon">
            <FiGrid size={26} />
          </div>

          <div>
            <span className="mini-title">
              PAINEL ADMINISTRATIVO
            </span>

            <h1>Categorias</h1>

            <p>
              Gerencie categorias modernas do sistema.
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

      {/* SEARCH */}

      <div className="search-box">
        <FiSearch />

        <input
          type="text"
          placeholder="Buscar categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className="count">
          {categoriasFiltradas.length}
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
          <FiFolder size={50} />

          <h2>Nenhuma categoria encontrada</h2>
        </div>
      ) : (
        <div className="cards">
          {categoriasFiltradas.map((categoria) => {
            const id = getId(categoria);

            const ativo = categoria.status_id === 1;

            const editando = editandoId === id;

            return (
              <div className="card" key={id}>
                {/* TOP */}

                <div className="top">
                  <div className="id">
                    <FiHash />
                    {id}
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

                {/* EDITANDO */}

                {editando ? (
                  <div className="edit-area">
                    <input
                      value={form.nome}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nome: e.target.value,
                        })
                      }
                      placeholder="Nome"
                    />

                    <input
                      value={form.slug}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          slug: e.target.value,
                        })
                      }
                      placeholder="Slug"
                    />

                    <textarea
                      rows={4}
                      value={form.descricao}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          descricao: e.target.value,
                        })
                      }
                      placeholder="Descrição"
                    />

                    <div className="grid-form">
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
                        placeholder="Ordem"
                      />

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
                        <option value={1}>
                          Ativo
                        </option>

                        <option value={2}>
                          Inativo
                        </option>
                      </select>
                    </div>

                    <div className="actions">
                      <button
                        className="btn save"
                        onClick={() =>
                          salvarEdicao(id)
                        }
                      >
                        <FiSave />
                        Salvar
                      </button>

                      <button
                        className="btn cancel"
                        onClick={() =>
                          setEditandoId(null)
                        }
                      >
                        <FiX />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* CONTENT */}

                    <div className="content">
                      <div className="icon-card">
                        <FiFolder />
                      </div>

                      <h3>{categoria.nome}</h3>

                      <span className="slug">
                        /{categoria.slug}
                      </span>

                      <p>
                        {categoria.descricao ||
                          "Sem descrição cadastrada"}
                      </p>
                    </div>

                    {/* FOOTER */}

                    <div className="footer">
                      <div className="meta">
                        <small>Ordem</small>
                        <strong>
                          #{categoria.ordem || 0}
                        </strong>
                      </div>

                      <div className="buttons">
                        <button
                          className="icon-btn edit"
                          onClick={() =>
                            iniciarEdicao(categoria)
                          }
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          className="icon-btn delete"
                          onClick={() =>
                            excluirCategoria(id)
                          }
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
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

        /* HERO */

        .hero {
          border-radius: 30px;
          padding: 30px;
          background: linear-gradient(
            135deg,
            #0f172a,
            #1e293b
          );
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .hero-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .hero-icon {
          width: 78px;
          height: 78px;
          border-radius: 24px;
          background: linear-gradient(
            135deg,
            #8b5cf6,
            #6366f1
          );
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mini-title {
          font-size: 11px;
          letter-spacing: 0.16em;
          opacity: 0.7;
          font-weight: 800;
        }

        h1 {
          margin: 8px 0;
          font-size: 40px;
        }

        .hero p {
          color: rgba(255, 255, 255, 0.7);
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* BUTTONS */

        .btn {
          height: 48px;
          padding: 0 20px;
          border-radius: 16px;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 700;
          transition: 0.25s;
          text-decoration: none;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .primary {
          background: linear-gradient(
            135deg,
            #8b5cf6,
            #6366f1
          );
          color: white;
        }

        .glass {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid
            rgba(255, 255, 255, 0.1);
        }

        /* SEARCH */

        .search-box {
          height: 64px;
          background: white;
          border-radius: 24px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid #e5e7eb;
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 15px;
        }

        .count {
          min-width: 42px;
          height: 42px;
          border-radius: 14px;
          background: #eef2ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        /* CARDS */

        .cards {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          align-items: flex-start;
        }

        .card {
          width: calc(33.333% - 14px);
          min-width: 320px;
          background: white;
          border-radius: 28px;
          padding: 22px;
          border: 1px solid #eceff4;
          transition: 0.25s;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px
            rgba(0, 0, 0, 0.06);
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .id {
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

        /* CONTENT */

        .icon-card {
          width: 70px;
          height: 70px;
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

        h3 {
          margin: 0;
          font-size: 24px;
          color: #111827;
        }

        .slug {
          display: inline-block;
          margin-top: 10px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 12px;
          font-weight: 700;
        }

        .content p {
          margin-top: 18px;
          color: #6b7280;
          line-height: 1.7;
          min-height: 70px;
        }

        /* FOOTER */

        .footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .meta small {
          color: #9ca3af;
        }

        .meta strong {
          color: #111827;
        }

        .buttons {
          display: flex;
          gap: 10px;
        }

        .icon-btn {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .icon-btn:hover {
          transform: scale(1.05);
        }

        .icon-btn.edit {
          background: #eef2ff;
          color: #4f46e5;
        }

        .icon-btn.delete {
          background: #fef2f2;
          color: #ef4444;
        }

        /* EDIT */

        .edit-area {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .edit-area input,
        .edit-area textarea,
        .edit-area select {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
          outline: none;
          font-size: 14px;
        }

        .edit-area input:focus,
        .edit-area textarea:focus,
        .edit-area select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px
            rgba(99, 102, 241, 0.1);
        }

        .grid-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 6px;
        }

        .save {
          background: linear-gradient(
            135deg,
            #8b5cf6,
            #6366f1
          );
          color: white;
          flex: 1;
        }

        .cancel {
          background: #f3f4f6;
          color: #111827;
          flex: 1;
        }

        /* STATES */

        .state {
          height: 72px;
          border-radius: 22px;
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
          border-radius: 28px;
          padding: 80px 30px;
          text-align: center;
          border: 1px solid #eceff4;
        }

        .empty h2 {
          margin-top: 18px;
          color: #111827;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* RESPONSIVO */

        @media (max-width: 1200px) {
          .card {
            width: calc(50% - 10px);
          }
        }

        @media (max-width: 768px) {
          .card {
            width: 100%;
            min-width: 100%;
          }

          .hero {
            padding: 24px;
          }

          h1 {
            font-size: 30px;
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

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}