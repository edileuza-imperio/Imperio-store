'use client';

import { useEffect, useState, FormEvent } from "react";
import api from "@/Api/conectar";

interface CupomTipo {
  id_tipo: number;
  nome: string;
  codigo: string;
  descricao: string;
  statusid: number;
}

export default function TiposCuponsPage() {
  const [tipos, setTipos] = useState<CupomTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    carregarTipos();
  }, []);

  const carregarTipos = async () => {
    try {
      const res = await api.get("/admin/cupom/tipos");
      setTipos(res.data.dados || []);
    } finally {
      setLoading(false);
    }
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/admin/cupom/tipos/criar", {
      nome,
      codigo,
      descricao,
      statusid: 1
    });
    setShowPanel(false);
    setNome("");
    setCodigo("");
    setDescricao("");
    carregarTipos();
  };

  if (loading) return <div className="text-center mt-5">Carregando...</div>;

  return (
    <div className="container py-4">

      {/* ================= ESTILO ================= */}
      <style>{`
        body {
          background: #f4f6fb;
        }

        .page-title {
          font-weight: 600;
          letter-spacing: .4px;
        }

        /* ===== CARDS ===== */
        .card-tipo {
          border-radius: 16px;
          border: none;
          background: #fff;
          transition: all .25s ease;
        }
        .card-tipo:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 35px rgba(0,0,0,.08);
        }
        .card-header-custom {
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .codigo {
          font-family: monospace;
          background: #f1f3f9;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: .85rem;
        }
        .status {
          font-size: .75rem;
          padding: 6px 10px;
          border-radius: 20px;
        }

        /* ===== BOTÃO FLUTUANTE ===== */
        .fab {
          position: fixed;
          right: 28px;
          bottom: 28px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
        }

        /* ===== PAINEL LATERAL ===== */
        .drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: 420px;
          height: 100%;
          background: #fff;
          box-shadow: -10px 0 30px rgba(0,0,0,.15);
          transform: translateX(100%);
          transition: transform .3s ease;
          z-index: 1055;
          display: flex;
          flex-direction: column;
        }
        .drawer.show {
          transform: translateX(0);
        }
        .drawer-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          font-weight: 600;
          font-size: 1.2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .drawer-body {
          padding: 20px;
          flex: 1;
          overflow-y: auto;
        }
        .drawer-footer {
          padding: 16px 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.35);
          z-index: 1050;
        }
      `}</style>

      {/* ================= TÍTULO ================= */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">Tipos de Cupom</h2>
      </div>

      {/* ================= CARDS ================= */}
      <div className="row g-4">
        {tipos.map(tipo => (
          <div key={tipo.id_tipo} className="col-md-4">
            <div className="card card-tipo p-4 h-100">
              <div className="card-header-custom d-flex justify-content-between align-items-center">
                <strong>{tipo.nome}</strong>
                <span className={`status ${tipo.statusid === 1 ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                  {tipo.statusid === 1 ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="mb-2">
                <span className="codigo">{tipo.codigo}</span>
              </div>

              <p className="text-muted mb-0">
                {tipo.descricao || "Sem descrição informada"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ================= BOTÃO ================= */}
      <button
        className="btn btn-primary fab"
        onClick={() => setShowPanel(true)}
      >
        +
      </button>

      {/* ================= PAINEL ================= */}
      <div className={`drawer ${showPanel ? 'show' : ''}`}>
        <div className="drawer-header">
          Novo Tipo de Cupom
          <button className="btn-close" onClick={() => setShowPanel(false)} />
        </div>

        <form onSubmit={salvar} className="drawer-body">
          <div className="mb-3">
            <label className="form-label">Nome</label>
            <input
              className="form-control"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Código</label>
            <input
              className="form-control"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Descrição</label>
            <textarea
              className="form-control"
              rows={4}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />
          </div>

          <div className="drawer-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPanel(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </div>

      {showPanel && <div className="backdrop" onClick={() => setShowPanel(false)} />}
    </div>
  );
}
