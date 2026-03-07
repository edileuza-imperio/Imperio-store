"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import {
  FiArrowLeft,
  FiTag,
  FiDollarSign,
  FiImage,
  FiSave,
  FiPackage,
} from "react-icons/fi";

type Categoria = {
  id_categoria: number;
  nome: string;
};

type Status = {
  id_status?: number;
  id?: number;
  nome?: string;
  titulo?: string;
  descricao?: string;
};

type Aba = "basico" | "preco" | "imagem";

type FormState = {
  nome: string;
  descricao: string;
  preco: string;
  preco_promocional: string;
  slug: string;
  estoque: string;
  ilimitado: string;
  statusid: string;
  catalogo: string;
  categoria_id: string;
  destaque: string;
  sku: string;
  modelo: string;
  parcelamento: string;
};

const initialForm: FormState = {
  nome: "",
  descricao: "",
  preco: "",
  preco_promocional: "",
  slug: "",
  estoque: "0",
  ilimitado: "0",
  statusid: "",
  catalogo: "0",
  categoria_id: "",
  destaque: "",
  sku: "",
  modelo: "",
  parcelamento: "",
};

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.categorias != null) return payload.categorias as T;
  if (payload?.status != null) return payload.status as T;
  return payload as T;
}

export default function AdicionarProdutoPage() {
  const router = useRouter();

  const [abaAtiva, setAbaAtiva] = useState<Aba>("basico");
  const [form, setForm] = useState<FormState>(initialForm);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function carregarDependencias() {
    try {
      setLoading(true);

      const [resCategorias, resStatus] = await Promise.all([
        api.get("/admin/categorias", { withCredentials: true }),
        api.get("/admin/produtos/status", { withCredentials: true }),
      ]);

      const listaCategorias = resolveApi<Categoria[]>(resCategorias.data) || [];
      const listaStatus = resolveApi<Status[]>(resStatus.data) || [];

      setCategorias(Array.isArray(listaCategorias) ? listaCategorias : []);
      setStatusList(Array.isArray(listaStatus) ? listaStatus : []);

      if (Array.isArray(listaStatus) && listaStatus.length > 0) {
        const primeiroId = String(
          listaStatus[0]?.id_status ?? listaStatus[0]?.id ?? ""
        );

        setForm((prev) => ({
          ...prev,
          statusid: prev.statusid || primeiroId,
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar dependências:", error);
      alert("Erro ao carregar categorias e status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDependencias();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const estoqueDesabilitado = useMemo(
    () => Number(form.ilimitado) === 1,
    [form.ilimitado]
  );

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImagemChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImagem(file);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do produto.");
      setAbaAtiva("basico");
      return;
    }

    if (!form.categoria_id) {
      alert("Selecione uma categoria.");
      setAbaAtiva("basico");
      return;
    }

    if (!form.statusid) {
      alert("Selecione um status.");
      setAbaAtiva("basico");
      return;
    }

    if (!form.preco || Number(form.preco) <= 0) {
      alert("Informe um preço válido.");
      setAbaAtiva("preco");
      return;
    }

    try {
      setSaving(true);

      const body = new FormData();

      body.append("nome", form.nome.trim());
      body.append("descricao", form.descricao.trim());
      body.append("preco", form.preco || "0");
      body.append("preco_promocional", form.preco_promocional || "0");
      body.append("estoque", estoqueDesabilitado ? "0" : form.estoque || "0");
      body.append("ilimitado", form.ilimitado);
      body.append("statusid", form.statusid);
      body.append("catalogo", form.catalogo);
      body.append("categoria_id", form.categoria_id);

      if (form.slug.trim()) body.append("slug", form.slug.trim());
      if (form.destaque.trim()) body.append("destaque", form.destaque.trim());
      if (form.sku.trim()) body.append("sku", form.sku.trim());
      if (form.modelo.trim()) body.append("modelo", form.modelo.trim());
      if (form.parcelamento.trim()) {
        body.append("parcelamento", form.parcelamento.trim());
      }

      if (imagem) {
        body.append("imagem", imagem);
      }

      await api.post("/admin/produto/criar", body, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Produto cadastrado com sucesso.");
      router.push("/painel/produtos");
    } catch (error: any) {
      console.error("Erro ao cadastrar produto:", error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Erro ao cadastrar produto."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="pageWrap">
        <div className="topBar">
          <button
            type="button"
            className="backBtn"
            onClick={() => router.push("/painel/produtos")}
          >
            <FiArrowLeft size={16} />
            Voltar
          </button>
        </div>

        <section className="hero">
          <div className="heroIcon">
            <FiPackage size={20} />
          </div>

          <div className="heroText">
            <span className="heroMini">Novo produto</span>
            <h1>Adicionar produto</h1>
            <p>Cadastro rápido em 3 abas.</p>
          </div>
        </section>

        {loading ? (
          <div className="loadingBox">
            <div className="spinner" />
            <p>Carregando formulário...</p>
          </div>
        ) : (
          <form className="formCard" onSubmit={handleSubmit}>
            <div className="tabs">
              <button
                type="button"
                className={`tab ${abaAtiva === "basico" ? "active" : ""}`}
                onClick={() => setAbaAtiva("basico")}
              >
                <FiTag size={14} />
                Básico
              </button>

              <button
                type="button"
                className={`tab ${abaAtiva === "preco" ? "active" : ""}`}
                onClick={() => setAbaAtiva("preco")}
              >
                <FiDollarSign size={14} />
                Preço
              </button>

              <button
                type="button"
                className={`tab ${abaAtiva === "imagem" ? "active" : ""}`}
                onClick={() => setAbaAtiva("imagem")}
              >
                <FiImage size={14} />
                Imagem
              </button>
            </div>

            <div className="tabPanel">
              {abaAtiva === "basico" && (
                <div className="formGrid">
                  <div className="field col2">
                    <label>Nome</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => updateField("nome", e.target.value)}
                      placeholder="Nome do produto"
                    />
                  </div>

                  <div className="field">
                    <label>SKU</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => updateField("sku", e.target.value)}
                      placeholder="SKU"
                    />
                  </div>

                  <div className="field">
                    <label>Modelo</label>
                    <input
                      type="text"
                      value={form.modelo}
                      onChange={(e) => updateField("modelo", e.target.value)}
                      placeholder="Modelo"
                    />
                  </div>

                  <div className="field col2">
                    <label>Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => updateField("slug", e.target.value)}
                      placeholder="Deixe vazio para gerar automático"
                    />
                  </div>

                  <div className="field col2">
                    <label>Descrição</label>
                    <textarea
                      rows={4}
                      value={form.descricao}
                      onChange={(e) => updateField("descricao", e.target.value)}
                      placeholder="Descrição do produto"
                    />
                  </div>

                  <div className="field">
                    <label>Categoria</label>
                    <select
                      value={form.categoria_id}
                      onChange={(e) => updateField("categoria_id", e.target.value)}
                    >
                      <option value="">Selecione</option>
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
                    <label>Status / Nível</label>
                    <select
                      value={form.statusid}
                      onChange={(e) => updateField("statusid", e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {statusList.map((status, index) => {
                        const id = status.id_status ?? status.id ?? index;
                        const nome =
                          status.nome ||
                          status.titulo ||
                          status.descricao ||
                          `Status ${id}`;

                        return (
                          <option key={String(id)} value={String(id)}>
                            {nome}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="field">
                    <label>Catálogo</label>
                    <select
                      value={form.catalogo}
                      onChange={(e) => updateField("catalogo", e.target.value)}
                    >
                      <option value="0">Não</option>
                      <option value="1">Sim</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Destaque</label>
                    <input
                      type="number"
                      value={form.destaque}
                      onChange={(e) => updateField("destaque", e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              )}

              {abaAtiva === "preco" && (
                <div className="formGrid">
                  <div className="field">
                    <label>Preço</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.preco}
                      onChange={(e) => updateField("preco", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="field">
                    <label>Preço promocional</label>
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
                    <label>Estoque</label>
                    <input
                      type="number"
                      min="0"
                      disabled={estoqueDesabilitado}
                      value={form.estoque}
                      onChange={(e) => updateField("estoque", e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="field">
                    <label>Parcelamento</label>
                    <input
                      type="text"
                      value={form.parcelamento}
                      onChange={(e) => updateField("parcelamento", e.target.value)}
                      placeholder="Ex: 3x sem juros"
                    />
                  </div>
                </div>
              )}

              {abaAtiva === "imagem" && (
                <div className="formGrid single">
                  <div className="field">
                    <label>Imagem principal</label>
                    <input type="file" accept="image/*" onChange={handleImagemChange} />
                  </div>

                  <div className="field">
                    <label>Preview</label>
                    <div className="previewBox">
                      {preview ? (
                        <img src={preview} alt="Preview" className="previewImg" />
                      ) : (
                        <div className="previewEmpty">
                          <FiImage size={20} />
                          <span>Nenhuma imagem selecionada</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="actions">
              <button
                type="button"
                className="btn light"
                onClick={() => router.push("/painel/produtos")}
              >
                Cancelar
              </button>

              <button type="submit" className="btn primary" disabled={saving}>
                <FiSave size={16} />
                {saving ? "Salvando..." : "Cadastrar produto"}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .pageWrap {
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .topBar {
          display: flex;
          align-items: center;
        }

        .backBtn {
          min-height: 40px;
          padding: 0 14px;
          border: 0;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #e8eaf1;
          color: #111827;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          border-radius: 20px;
          background:
            radial-gradient(circle at top right, rgba(129, 140, 248, 0.16) 0%, transparent 30%),
            linear-gradient(135deg, #111827 0%, #1f2937 100%);
          color: #fff;
        }

        .heroIcon {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .heroMini {
          display: inline-flex;
          margin-bottom: 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.78);
        }

        .heroText h1 {
          margin: 0;
          font-size: 24px;
          line-height: 1.1;
          font-weight: 900;
        }

        .heroText p {
          margin: 6px 0 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 13px;
          line-height: 1.5;
        }

        .loadingBox,
        .formCard {
          background: #ffffff;
          border: 1px solid #ece7f5;
          border-radius: 20px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }

        .loadingBox {
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
        }

        .loadingBox p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #ddd6fe;
          border-top-color: #7c3aed;
          border-radius: 999px;
          animation: spin 0.8s linear infinite;
        }

        .formCard {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tab {
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #e8eaf1;
          border-radius: 12px;
          background: #fff;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .tab.active {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
          border-color: transparent;
        }

        .tabPanel {
          padding-top: 4px;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .formGrid.single {
          grid-template-columns: 1fr;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field.col2 {
          grid-column: span 2;
        }

        .field label {
          font-size: 12px;
          font-weight: 800;
          color: #334155;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          border: 1px solid #dbe1ea;
          outline: none;
          border-radius: 12px;
          background: #fff;
          color: #111827;
          padding: 12px 13px;
          font-size: 14px;
          transition: 0.2s ease;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        .field textarea {
          resize: vertical;
          min-height: 100px;
        }

        .previewBox {
          min-height: 210px;
          border: 1px dashed #d7dcea;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafcff;
        }

        .previewImg {
          width: 100%;
          height: 210px;
          object-fit: cover;
          display: block;
        }

        .previewEmpty {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          padding: 16px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          padding-top: 4px;
        }

        .btn {
          min-height: 42px;
          padding: 0 16px;
          border: 0;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: 0.2s ease;
        }

        .btn.light {
          background: #f8fafc;
          color: #334155;
        }

        .btn.primary {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
          box-shadow: 0 12px 24px rgba(124, 58, 237, 0.2);
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .pageWrap {
            max-width: 100%;
          }

          .hero {
            padding: 16px;
            align-items: flex-start;
          }

          .heroText h1 {
            font-size: 21px;
          }

          .formCard {
            padding: 14px;
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .field.col2 {
            grid-column: span 1;
          }

          .actions {
            flex-direction: column-reverse;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}