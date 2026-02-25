'use client';

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";
import { rotas } from "@/components/Bibioteca/config/rotas";

interface Status {
  id_status: number;
  nome: string;
  cor?: string;
}

export default function NovaCategoriaModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("");
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [statusSelecionado, setStatusSelecionado] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  // carrega status quando abrir
  useEffect(() => {
    if (!open) return;

    const carregarStatus = async () => {
      try {
        // ✅ usa a rota do seu router PHP: /admin/produtos/status
        const res = await api.get(rotas.admin.api.produtosStatus, { withCredentials: true });
        const lista = res.data?.dados ?? [];
        setStatusList(lista);
        setStatusSelecionado(lista[0] ?? null);
      } catch (err) {
        toast.error("Erro ao carregar status");
        setStatusList([]);
        setStatusSelecionado(null);
      }
    };

    carregarStatus();
  }, [open]);

  // ESC fecha modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleStatus = () => {
    if (!statusSelecionado || statusList.length === 0) return;
    const idx = statusList.findIndex((s) => s.id_status === statusSelecionado.id_status);
    setStatusSelecionado(statusList[(idx + 1) % statusList.length]);
  };

  const getContraste = (cor?: string) => {
    if (!cor) return "#fff";
    const hex = cor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000" : "#fff";
  };

  const resetForm = () => {
    setNome("");
    setIcone("");
    setLoading(false);
  };

  const salvar = async () => {
    if (!nome.trim()) return toast.error("O nome da categoria é obrigatório");
    if (!statusSelecionado) return toast.error("Selecione um status");

    setLoading(true);
    try {
      const payload = {
        nome: nome.trim(),
        icone: icone.trim(),
        // ajuste o nome do campo conforme seu backend espera
        statusid: statusSelecionado.id_status,
      };

      // ✅ rota correta do seu admin.ts: POST /admin/categorias
      await api.post(rotas.admin.api.categoriaCriar, payload, { withCredentials: true });

      toast.success("Categoria criada com sucesso!");
      await onCreated();
      resetForm();
      onClose();
    } catch (err) {
      toast.error("Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="mcat__backdrop" onMouseDown={() => { resetForm(); onClose(); }}>
      <div className="mcat__modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mcat__header">
          <div>
            <div className="mcat__kicker">Admin</div>
            <h2 className="mcat__title">Nova Categoria</h2>
            <p className="mcat__sub">Crie e organize categorias do catálogo</p>
          </div>

          <button
            className="mcat__close"
            type="button"
            onClick={() => { resetForm(); onClose(); }}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Nome */}
        <div className="mcat__field">
          <label className="mcat__label">Nome</label>
          <input
            className="mcat__input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Eletrônicos"
          />
        </div>

        {/* Ícone */}
        <div className="mcat__field">
          <label className="mcat__label">Ícone (Bootstrap / FontAwesome)</label>
          <input
            className="mcat__input"
            value={icone}
            onChange={(e) => setIcone(e.target.value)}
            placeholder="Ex: bi-tags ou fa-solid fa-box"
          />
        </div>

        {/* Status */}
        <div className="mcat__field">
          <label className="mcat__label">Status</label>

          {statusSelecionado ? (
            <>
              <button
                type="button"
                className="mcat__pill"
                onClick={toggleStatus}
                style={{
                  background: statusSelecionado.cor || "#2563eb",
                  color: getContraste(statusSelecionado.cor),
                }}
              >
                {statusSelecionado.nome}
              </button>

              <div className="mcat__hint">Clique para alternar o status</div>
            </>
          ) : (
            <div className="mcat__hint">Carregando status…</div>
          )}
        </div>

        <div className="mcat__footer">
          <button
            type="button"
            className="mcat__btn mcat__btnLight"
            onClick={() => { resetForm(); onClose(); }}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="mcat__btn mcat__btnPrimary"
            onClick={salvar}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Categoria"}
          </button>
        </div>

        <style jsx global>{`
          .mcat__backdrop{
            position: fixed;
            inset: 0;
            background: rgba(17,24,39,.55);
            display:flex;
            align-items:center;
            justify-content:center;
            padding: 18px;
            z-index: 9999;
          }
          .mcat__modal{
            width: 100%;
            max-width: 640px;
            background: #fff;
            border-radius: 18px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 18px 50px rgba(0,0,0,.25);
            padding: 18px;
          }
          .mcat__header{
            display:flex;
            justify-content:space-between;
            gap: 12px;
            align-items:flex-start;
            margin-bottom: 10px;
          }
          .mcat__kicker{
            font-size: 12px;
            color: #6b7280;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
          }
          .mcat__title{
            margin: 4px 0 0;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -.02em;
            color: #111827;
          }
          .mcat__sub{
            margin: 6px 0 0;
            color: #6b7280;
            font-weight: 600;
            font-size: 13px;
          }
          .mcat__close{
            border: 1px solid #e5e7eb;
            background: #fff;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            cursor:pointer;
            font-weight: 900;
          }
          .mcat__field{
            margin-top: 12px;
          }
          .mcat__label{
            display:block;
            font-weight: 800;
            color:#374151;
            font-size: 13px;
            margin-bottom: 6px;
          }
          .mcat__input{
            width: 100%;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 10px 12px;
            outline: none;
            font-weight: 700;
          }
          .mcat__input:focus{
            border-color: #dbeafe;
            box-shadow: 0 0 0 4px rgba(37,99,235,.12);
          }
          .mcat__pill{
            border: none;
            border-radius: 999px;
            padding: 8px 14px;
            font-weight: 900;
            cursor: pointer;
          }
          .mcat__hint{
            margin-top: 6px;
            font-size: 12px;
            color:#6b7280;
            font-weight: 700;
          }
          .mcat__footer{
            display:flex;
            justify-content:flex-end;
            gap: 10px;
            margin-top: 16px;
          }
          .mcat__btn{
            border: none;
            border-radius: 14px;
            padding: 10px 14px;
            font-weight: 900;
            cursor:pointer;
          }
          .mcat__btnLight{
            background:#f3f4f6;
            color:#111827;
          }
          .mcat__btnPrimary{
            background:#2563eb;
            color:#fff;
          }
          .mcat__btn:disabled{
            opacity: .7;
            cursor:not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}