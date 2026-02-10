'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEdit, FaPlus, FaTrash, FaLayerGroup, FaBox } from "react-icons/fa";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface Categoria {
  id_categoria: number;
  nome: string;
  icone?: string;
  total_produtos: number;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      const res = await api.get("/admin/categorias");
      setCategorias(res.data.dados || []);
    } catch {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const excluirCategoria = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;

    try {
      await api.delete(`/admin/categorias/${id}`);
      setCategorias(prev => prev.filter(c => c.id_categoria !== id));
      toast.success("Categoria excluída com sucesso!");
    } catch {
      toast.error("Não foi possível excluir a categoria");
    }
  };

  return (
    <div className="categorias-bg container-fluid py-4">
      <ToastContainer position="top-right" />

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title">Categorias</h1>
          <p className="page-subtitle">Gerencie as categorias e seus produtos</p>
        </div>

        <Link href="/admin/categorias/nova" className="btn btn-primary btn-add">
          <FaPlus /> Nova Categoria
        </Link>
      </div>

      {/* CONTEÚDO */}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : categorias.length === 0 ? (
        <p className="text-muted">Nenhuma categoria cadastrada.</p>
      ) : (
        <div className="row g-4">
          {categorias.map(cat => (
            <div key={cat.id_categoria} className="col-12 col-sm-6 col-md-4 col-xl-3">
              <div className="categoria-card">

                {/* TOPO */}
                <div className="card-top">
                  <div className="icon">
                    {cat.icone ? (
                      <i className={`bi ${cat.icone}`} />
                    ) : (
                      <FaBox />
                    )}
                  </div>

                  <div className="produtos">
                    <span>{cat.total_produtos}</span>
                    <small>produtos</small>
                  </div>
                </div>

                {/* CONTEÚDO */}
                <h5 className="categoria-nome">{cat.nome}</h5>

                {/* AÇÕES */}
                <div className="acoes">
                  <Link
                    href={`/admin/categorias/${cat.id_categoria}`}
                    title="Editar"
                    className="action edit"
                  >
                    <FaEdit />
                  </Link>

                  <button
                    onClick={() => excluirCategoria(cat.id_categoria)}
                    title="Excluir"
                    className="action delete"
                  >
                    <FaTrash />
                  </button>

                  <Link
                    href={`/admin/categorias/${cat.id_categoria}/unificar`}
                    className="btn-unificar"
                  >
                    <FaLayerGroup />
                    Unificar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== ESTILO GLOBAL ===== */}
      <style jsx global>{`
        .categorias-bg {
          background: #f5f6fa;
          min-height: 100vh;
        }

        .page-title {
          font-weight: 700;
          color: #2c2f33;
          margin-bottom: 0;
        }

        .page-subtitle {
          color: #8a8f98;
          margin-top: 4px;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          border-radius: 10px;
          padding: 10px 16px;
        }

        .categoria-card {
          background: #fff;
          border-radius: 18px;
          padding: 18px;
          height: 100%;
          box-shadow: 0 10px 26px rgba(0,0,0,.08);
          display: flex;
          flex-direction: column;
          transition: transform .25s;
        }

        .categoria-card:hover {
          transform: translateY(-6px);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #eef0f4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #4b5563;
        }

        .produtos {
          text-align: right;
        }

        .produtos span {
          font-size: 1.4rem;
          font-weight: 700;
          color: #111827;
          display: block;
        }

        .produtos small {
          font-size: 0.7rem;
          color: #6b7280;
        }

        .categoria-nome {
          font-weight: 700;
          color: #2c2f33;
          margin-bottom: 16px;
        }

        .acoes {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .action {
          font-size: 1.1rem;
          cursor: pointer;
          transition: transform .2s;
        }

        .action:hover {
          transform: scale(1.15);
        }

        .edit {
          color: #2563eb;
        }

        .delete {
          color: #ef4444;
          background: none;
          border: none;
        }

        .btn-unificar {
          margin-left: auto;
          background: transparent;
          border: 2px solid #d1d5db;
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #374151;
          transition: all .2s;
        }

        .btn-unificar:hover {
          background: #eef0f4;
        }
      `}</style>
    </div>
  );
}
