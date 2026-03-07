"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import {
  FiArrowLeft,
  FiBox,
  FiDollarSign,
  FiImage,
  FiPackage,
  FiSave,
  FiTag,
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
  sku: string;
  modelo: string;
  descricao: string;
  preco: string;
  preco_promocional: string;
  estoque: string;
  ilimitado: string;
  categoria_id: string;
  statusid: string;
  catalogo: string;
  destaque: string;
};

const initialForm: FormState = {
  nome: "",
  sku: "",
  modelo: "",
  descricao: "",
  preco: "",
  preco_promocional: "",
  estoque: "0",
  ilimitado: "0",
  categoria_id: "",
  statusid: "",
  catalogo: "1",
  destaque: "0",
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
      console.error(error);
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

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImagemChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImagem(file);

    if (preview) URL.revokeObjectURL(preview);

    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview("");
    }
  }

  const estoqueDesabilitado = useMemo(
    () => Number(form.ilimitado) === 1,
    [form.ilimitado]
  );

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
      body.append("sku", form.sku.trim());
      body.append("modelo", form.modelo.trim());
      body.append("descricao", form.descricao.trim());
      body.append("preco", form.preco || "0");
      body.append("preco_promocional", form.preco_promocional || "0");
      body.append("estoque", estoqueDesabilitado ? "0" : form.estoque || "0");
      body.append("ilimitado", form.ilimitado);
      body.append("categoria_id", form.categoria_id);
      body.append("statusid", form.statusid);
      body.append("catalogo", form.catalogo);
      body.append("destaque", form.destaque);

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
      console.error(error);
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
            <h1>Cadastrar produto</h1>
            <p>Preencha as 3 abas para cadastrar o produto.</p>
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
                    <label>Nome do produto</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => updateField("nome", e.target.value)}
                      placeholder="Digite o nome"
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
                      <option value="1">Visível</option>
                      <option value="0">Oculto</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Destaque</label>
                    <select
                      value={form.destaque}
                      onChange={(e) => updateField("destaque", e.target.value)}
                    >
                      <option value="0">Não</option>
                      <option value="1">Sim</option>
                    </select>
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
                    <label>Quantidade em estoque</label>
                    <input
                      type="number"
                      min="0"
                      disabled={estoqueDesabilitado}
                      value={form.estoque}
                      onChange={(e) => updateField("estoque", e.target.value)}
                      placeholder="0"
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

    </>
  );
}