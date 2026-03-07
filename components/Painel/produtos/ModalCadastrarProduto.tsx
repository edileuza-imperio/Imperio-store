"use client";

import { FormEvent, useEffect, useState } from "react";
import api from "@/Api/conectar";
import { FiX, FiSave, FiPackage, FiDollarSign, FiBox } from "react-icons/fi";

type Categoria = {
  id_categoria: number;
  nome: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type FormDataType = {
  nome: string;
  descricao: string;
  preco: string;
  preco_promocional: string;
  estoque: string;
  sku: string;
  modelo: string;
  categoria_id: string;
  catalogo: string;
  ilimitado: string;
};

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.categorias != null) return payload.categorias as T;
  return payload as T;
}

const initialForm: FormDataType = {
  nome: "",
  descricao: "",
  preco: "",
  preco_promocional: "",
  estoque: "0",
  sku: "",
  modelo: "",
  categoria_id: "",
  catalogo: "1",
  ilimitado: "0",
};

export default function ModalCadastrarProduto({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormDataType>(initialForm);

  async function carregarCategorias() {
    try {
      setLoadingCategorias(true);

      const response = await api.get("/admin/categorias", {
        withCredentials: true,
      });

      const lista = resolveApi<Categoria[]>(response.data) || [];
      setCategorias(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error(error);
      setCategorias([]);
    } finally {
      setLoadingCategorias(false);
    }
  }

  useEffect(() => {
    if (open) {
      carregarCategorias();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  function updateField<K extends keyof FormDataType>(
    field: K,
    value: FormDataType[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do produto.");
      return;
    }

    if (!form.preco || Number(form.preco) <= 0) {
      alert("Informe um preço válido.");
      return;
    }

    if (!form.categoria_id) {
      alert("Selecione uma categoria.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        preco: Number(form.preco || 0),
        preco_promocional: Number(form.preco_promocional || 0),
        estoque: Number(form.ilimitado) === 1 ? 0 : Number(form.estoque || 0),
        sku: form.sku.trim(),
        modelo: form.modelo.trim(),
        categoria_id: Number(form.categoria_id),
        catalogo: Number(form.catalogo),
        ilimitado: Number(form.ilimitado),
      };

      await api.post("/admin/produto/criar", payload, {
        withCredentials: true,
      });

      alert("Produto cadastrado com sucesso.");
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Erro ao cadastrar produto."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="modalOverlay" onClick={onClose}>
        <div
          className="modalBox"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="modalHeader">
            <div className="modalTitleArea">
              <div className="modalIcon">
                <FiPackage size={22} />
              </div>
              <div>
                <h2 className="modalTitle">Cadastrar produto</h2>
                <p className="modalSubtitle">
                  Preencha os dados para adicionar um novo item ao catálogo
                </p>
              </div>
            </div>

            <button type="button" className="closeBtn" onClick={onClose}>
              <FiX size={20} />
            </button>
          </div>

          <form className="modalForm" onSubmit={handleSubmit}>
            <div className="formGrid">
              <div className="field col2">
                <label>Nome do produto</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => updateField("nome", e.target.value)}
                  placeholder="Digite o nome do produto"
                />
              </div>

              <div className="field">
                <label>SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                  placeholder="Ex: PROD-001"
                />
              </div>

              <div className="field">
                <label>Modelo</label>
                <input
                  type="text"
                  value={form.modelo}
                  onChange={(e) => updateField("modelo", e.target.value)}
                  placeholder="Ex: 2026"
                />
              </div>

              <div className="field col2">
                <label>Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => updateField("descricao", e.target.value)}
                  placeholder="Descreva o produto"
                  rows={4}
                />
              </div>

              <div className="field">
                <label>Preço</label>
                <div className="inputIcon">
                  <FiDollarSign size={16} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.preco}
                    onChange={(e) => updateField("preco", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="field">
                <label>Preço promocional</label>
                <div className="inputIcon">
                  <FiDollarSign size={16} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.preco_promocional}
                    onChange={(e) =>
                      updateField("preco_promocional", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="field">
                <label>Categoria</label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => updateField("categoria_id", e.target.value)}
                  disabled={loadingCategorias}
                >
                  <option value="">
                    {loadingCategorias
                      ? "Carregando categorias..."
                      : "Selecione uma categoria"}
                  </option>
                  {categorias.map((categoria) => (
                    <option
                      key={categoria.id_categoria}
                      value={categoria.id_categoria}
                    >
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Exibir no catálogo</label>
                <select
                  value={form.catalogo}
                  onChange={(e) => updateField("catalogo", e.target.value)}
                >
                  <option value="1">Sim</option>
                  <option value="0">Não</option>
                </select>
              </div>

              <div className="field">
                <label>Estoque ilimitado</label>
                <select
                  value={form.ilimitado}
                  onChange={(e) => updateField("ilimitado", e.target.value)}
                >
                  <option value="0">Não</option>
                  <option value="1">Sim</option>
                </select>
              </div>

              <div className="field">
                <label>Quantidade em estoque</label>
                <div className="inputIcon">
                  <FiBox size={16} />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.estoque}
                    onChange={(e) => updateField("estoque", e.target.value)}
                    placeholder="0"
                    disabled={Number(form.ilimitado) === 1}
                  />
                </div>
              </div>
            </div>

            <div className="modalFooter">
              <button type="button" className="btnSecondary" onClick={onClose}>
                Cancelar
              </button>

              <button type="submit" className="btnPrimary" disabled={saving}>
                <FiSave size={16} />
                {saving ? "Salvando..." : "Cadastrar produto"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .modalOverlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.58);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .modalBox {
          width: 100%;
          max-width: 920px;
          max-height: 92vh;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
          border: 1px solid #ece7f5;
        }

        .modalHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 24px 24px 18px;
          border-bottom: 1px solid #f1edf7;
        }

        .modalTitleArea {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .modalIcon {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3ecff;
          color: #6d28d9;
        }

        .modalTitle {
          margin: 0;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 900;
          color: #111827;
        }

        .modalSubtitle {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .closeBtn {
          border: 0;
          outline: 0;
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: #f8fafc;
          color: #475569;
          transition: 0.2s ease;
        }

        .closeBtn:hover {
          background: #eef2ff;
          color: #1e293b;
        }

        .modalForm {
          padding: 24px;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field.col2 {
          grid-column: span 2;
        }

        .field label {
          font-size: 14px;
          font-weight: 800;
          color: #334155;
        }

        .field input,
        .field textarea,
        .field select {
          width: 100%;
          border: 1px solid #dbe1ea;
          outline: none;
          border-radius: 16px;
          background: #fff;
          color: #111827;
          padding: 14px 16px;
          font-size: 14px;
          transition: 0.2s ease;
        }

        .field textarea {
          resize: vertical;
          min-height: 110px;
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        .field input:disabled,
        .field select:disabled,
        .field textarea:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .inputIcon {
          position: relative;
        }

        .inputIcon svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }

        .inputIcon input {
          padding-left: 40px;
        }

        .modalFooter {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #f1edf7;
        }

        .btnPrimary,
        .btnSecondary {
          border: 0;
          outline: 0;
          min-height: 46px;
          padding: 0 18px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .btnPrimary {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
          box-shadow: 0 12px 26px rgba(124, 58, 237, 0.28);
        }

        .btnPrimary:hover {
          transform: translateY(-1px);
        }

        .btnPrimary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btnSecondary {
          background: #f8fafc;
          color: #334155;
        }

        .btnSecondary:hover {
          background: #eef2ff;
        }

        @media (max-width: 768px) {
          .modalOverlay {
            padding: 12px;
            align-items: flex-end;
          }

          .modalBox {
            max-width: 100%;
            max-height: 96vh;
            border-radius: 22px 22px 0 0;
          }

          .modalHeader {
            padding: 18px 18px 14px;
          }

          .modalForm {
            padding: 18px;
          }

          .formGrid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .field.col2 {
            grid-column: span 1;
          }

          .modalFooter {
            flex-direction: column-reverse;
          }

          .btnPrimary,
          .btnSecondary {
            width: 100%;
          }

          .modalTitle {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}