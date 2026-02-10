'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface Status {
  id_status: number;
  nome: string;
  cor?: string;
}

export default function NovaCategoriaPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("");
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [statusSelecionado, setStatusSelecionado] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar status
  useEffect(() => {
    const carregarStatus = async () => {
      try {
        const res = await api.get("/admin/status");
        const lista = res.data.dados || [];
        setStatusList(lista);
        setStatusSelecionado(lista[0] || null);
      } catch {
        toast.error("Erro ao carregar status");
      }
    };
    carregarStatus();
  }, []);

  // Alternar status clicando
  const toggleStatus = () => {
    if (!statusSelecionado || statusList.length === 0) return;
    const idx = statusList.findIndex(s => s.id_status === statusSelecionado.id_status);
    setStatusSelecionado(statusList[(idx + 1) % statusList.length]);
  };

  // Contraste automático
  const getContraste = (cor?: string) => {
    if (!cor) return "#fff";
    const hex = cor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000" : "#fff";
  };

  // Salvar
  const salvar = async () => {
    if (!nome.trim()) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }
    if (!statusSelecionado) {
      toast.error("Selecione um status");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nome", nome);
      formData.append("icone", icone);
      formData.append("statusid", statusSelecionado.id_status.toString());

      await api.post("/admin/cat", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Categoria criada com sucesso!");
      router.push("/admin/categorias");
    } catch {
      toast.error("Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nova-cat-bg container-fluid py-4">
      <ToastContainer position="top-right" />

      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">

          <div className="form-card">
            <h1 className="page-title mb-1">Nova Categoria</h1>
            <p className="page-subtitle mb-4">
              Crie e organize categorias do catálogo
            </p>

            {/* Nome */}
            <div className="mb-3">
              <label className="form-label">Nome</label>
              <input
                className="form-control"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Eletrônicos"
              />
            </div>

            {/* Ícone */}
            <div className="mb-3">
              <label className="form-label">Ícone (Bootstrap / FontAwesome)</label>
              <input
                className="form-control"
                value={icone}
                onChange={(e) => setIcone(e.target.value)}
                placeholder="Ex: bi-tags ou fa-solid fa-box"
              />
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="form-label d-block mb-2">Status</label>
              {statusSelecionado && (
                <span
                  className="status-pill"
                  onClick={toggleStatus}
                  style={{
                    background: statusSelecionado.cor || "#2563eb",
                    color: getContraste(statusSelecionado.cor)
                  }}
                >
                  {statusSelecionado.nome}
                </span>
              )}
              <small className="text-muted d-block mt-1">
                Clique para alternar o status
              </small>
            </div>

            {/* Botões */}
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-light"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                className="btn btn-primary"
                onClick={salvar}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Categoria"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ===== ESTILO GLOBAL ===== */}
      <style jsx global>{`
        .nova-cat-bg {
          background: #f5f6fa;
          min-height: 100vh;
        }

        .form-card {
          background: #fff;
          padding: 28px;
          border-radius: 18px;
          box-shadow: 0 12px 28px rgba(0,0,0,.08);
        }

        .page-title {
          font-weight: 700;
          color: #111827;
        }

        .page-subtitle {
          color: #6b7280;
          font-size: 0.95rem;
        }

        .form-label {
          font-weight: 600;
          color: #374151;
        }

        .form-control {
          border-radius: 10px;
          padding: 10px 14px;
        }

        .status-pill {
          display: inline-block;
          padding: 8px 18px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: transform .2s;
        }

        .status-pill:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
