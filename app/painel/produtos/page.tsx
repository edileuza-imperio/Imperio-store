"use client";

import { useEffect, useMemo, useState } from "react";
import { FiX, FiImage, FiSave } from "react-icons/fi";
import api from "@/Api/conectar";
import { toast } from "react-toastify";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
};

type FormState = {
  nome: string;
  slug: string;
  preco: string;   // string pra input
  estoque: string; // string pra input
  statusid: string;
  imagem?: File | null;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NovoProdutoModal({ open, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    nome: "",
    slug: "",
    preco: "",
    estoque: "",
    statusid: "1",
    imagem: null,
  });

  const [preview, setPreview] = useState<string | null>(null);

  // fecha com ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // trava scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // preview imagem
  useEffect(() => {
    if (!form.imagem) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(form.imagem);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.imagem]);

  const canSave = useMemo(() => {
    return (
      form.nome.trim().length >= 2 &&
      form.slug.trim().length >= 2 &&
      Number(form.preco.replace(",", ".")) >= 0 &&
      Number(form.estoque) >= 0 &&
      Number(form.statusid) > 0
    );
  }, [form]);

  function reset() {
    setForm({
      nome: "",
      slug: "",
      preco: "",
      estoque: "",
      statusid: "1",
      imagem: null,
    });
    setPreview(null);
  }

  function close() {
    if (saving) return;
    reset();
    onClose();
  }

  async function handleCreate() {
    if (!canSave) {
      toast.info("Preencha nome, slug, preço e estoque.");
      return;
    }

    try {
      setSaving(true);

      // ✅ seu backend cria produto com multipart? você já usa $_POST + $_FILES no PHP
      // então vamos mandar FormData
      const fd = new FormData();
      fd.append("nome", form.nome.trim());
      fd.append("slug", form.slug.trim());
      fd.append("preco", String(form.preco).replace(",", "."));
      fd.append("estoque", String(form.estoque));
      fd.append("statusid", String(form.statusid));

      if (form.imagem) {
        fd.append("imagem", form.imagem);
      }

      await api.post("/admin/produto/criar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      toast.success("Produto criado com sucesso!");
      reset();
      onClose();
      await onCreated?.();
    } catch (err: any) {
      console.error("❌ Erro ao criar produto:", err?.response?.data || err?.message || err);
      toast.error("Erro ao criar produto, veja o console");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className={`overlay ${open ? "show" : ""}`} onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="header">
          <div className="title">
            <div className="t1">Novo Produto</div>
            <div className="t2">Cadastre rapidamente um produto no catálogo</div>
          </div>

          <button className="x" onClick={close} aria-label="Fechar" type="button">
            <FiX size={18} />
          </button>
        </div>

        <div className="body">
          <div className="grid">
            <label className="field">
              <span>Nome</span>
              <input
                value={form.nome}
                onChange={(e) => {
                  const nome = e.target.value;
                  setForm((p) => ({
                    ...p,
                    nome,
                    slug: p.slug ? p.slug : slugify(nome),
                  }));
                }}
                placeholder="Ex: Cesta Luxo"
              />
            </label>

            <label className="field">
              <span>Slug</span>
              <input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                placeholder="ex: cesta-luxo"
              />
            </label>

            <label className="field">
              <span>Preço</span>
              <input
                inputMode="decimal"
                value={form.preco}
                onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))}
                placeholder="Ex: 99.90"
              />
            </label>

            <label className="field">
              <span>Estoque</span>
              <input
                inputMode="numeric"
                value={form.estoque}
                onChange={(e) => setForm((p) => ({ ...p, estoque: e.target.value }))}
                placeholder="Ex: 10"
              />
            </label>

            <label className="field">
              <span>Status</span>
              <select
                value={form.statusid}
                onChange={(e) => setForm((p) => ({ ...p, statusid: e.target.value }))}
              >
                <option value="1">Ativo</option>
                <option value="2">Inativo</option>
              </select>
            </label>

            <label className="field file">
              <span>Imagem</span>
              <div className="fileRow">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm((p) => ({ ...p, imagem: e.target.files?.[0] ?? null }))}
                />
                <div className="fileHint">
                  <FiImage /> JPG/PNG
                </div>
              </div>
            </label>
          </div>

          <div className="preview">
            <div className="ph">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" />
              ) : (
                <div className="empty">
                  <FiImage size={18} />
                  <span>Prévia da imagem</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer">
          <button className="btn ghost" type="button" onClick={close} disabled={saving}>
            Cancelar
          </button>

          <button className="btn primary" type="button" onClick={handleCreate} disabled={!canSave || saving}>
            <FiSave size={16} />
            {saving ? "Salvando..." : "Criar Produto"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.55);
          backdrop-filter: blur(3px);
          z-index: 999999;
          display: grid;
          place-items: center;
          padding: 14px;
        }

        .modal {
          width: min(420px, 95vw); /* ✅ menor */
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(17, 24, 39, 0.08);
          overflow: hidden;
          transform: translateY(0);
        }

        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 14px 10px;
          border-bottom: 1px solid rgba(17, 24, 39, 0.08);
          background: linear-gradient(180deg, rgba(124, 58, 237, 0.06), rgba(255, 255, 255, 0));
        }

        .title {
          min-width: 0;
        }

        .t1 {
          font-size: 14px;
          font-weight: 950;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .t2 {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
          font-weight: 700;
          line-height: 1.2;
        }

        .x {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(17, 24, 39, 0.02);
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .body {
          padding: 12px 14px 10px;
          display: grid;
          gap: 10px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr; /* ✅ compacto */
          gap: 10px;
        }

        .field {
          display: grid;
          gap: 6px;
        }

        .field span {
          font-size: 11px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.7);
        }

        input,
        select {
          width: 100%;
          padding: 10px 10px;
          border-radius: 12px;
          border: 1px solid rgba(17, 24, 39, 0.12);
          outline: none;
          font-size: 13px;
          background: #fff;
          transition: 0.2s;
        }

        input:focus,
        select:focus {
          border-color: rgba(124, 58, 237, 0.55);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
        }

        .file {
          grid-column: 1 / -1;
        }

        .fileRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .fileHint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 10px;
          border-radius: 12px;
          border: 1px solid rgba(17, 24, 39, 0.1);
          background: rgba(17, 24, 39, 0.02);
          font-size: 12px;
          font-weight: 800;
          color: #6b7280;
          white-space: nowrap;
        }

        .preview {
          grid-column: 1 / -1;
        }

        .ph {
          height: 140px;
          border-radius: 14px;
          border: 1px dashed rgba(17, 24, 39, 0.22);
          background: rgba(17, 24, 39, 0.02);
          overflow: hidden;
          display: grid;
          place-items: center;
        }

        .ph img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .empty {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-weight: 800;
          font-size: 12px;
        }

        .footer {
          padding: 12px 14px 14px;
          border-top: 1px solid rgba(17, 24, 39, 0.08);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          background: rgba(17, 24, 39, 0.01);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 950;
          cursor: pointer;
          border: 1px solid transparent;
          transition: 0.2s;
          font-size: 13px;
        }

        .ghost {
          background: rgba(17, 24, 39, 0.05);
          border-color: rgba(17, 24, 39, 0.12);
          color: #111827;
        }

        .ghost:hover {
          background: rgba(17, 24, 39, 0.08);
        }

        .primary {
          background: #d4af37;
          color: #fff;
          border-color: rgba(212, 175, 55, 0.35);
          box-shadow: 0 16px 30px rgba(212, 175, 55, 0.22);
        }

        .primary:hover {
          filter: brightness(0.98);
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 520px) {
          .grid {
            grid-template-columns: 1fr; /* ✅ mobile */
          }
          .fileRow {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}