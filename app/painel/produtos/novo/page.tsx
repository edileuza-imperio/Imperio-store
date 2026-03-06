"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

type Categoria = {
  id_categoria: number;
  nome: string;
};

type Status = {
  id_status?: number;
  id?: number;
  nome?: string;
  titulo?: string;
  codigo?: string;
};

type ProdutoForm = {
  nome: string;
  slug: string;
  descricao: string;
  preco: string;
  preco_promocional: string;
  estoque: string;
  ilimitado: boolean;
  categoria_id: string;
  statusid: string;
  catalogo: boolean;
  sku: string;
  modelo: string;
  imagem: File | null;
};

type AbaFormulario = "geral" | "precos" | "estoque" | "midia";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.categorias != null) return payload.categorias as T;
  if (payload?.status != null) return payload.status as T;
  return payload as T;
}

function TabButton({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`tab-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="tab-title">{title}</span>
      <span className="tab-subtitle">{subtitle}</span>
    </button>
  );
}

export default function NovoProdutoPage() {
  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [preview, setPreview] = useState("");
  const [abaAtual, setAbaAtual] = useState<AbaFormulario>("geral");

  const [form, setForm] = useState<ProdutoForm>({
    nome: "",
    slug: "",
    descricao: "",
    preco: "",
    preco_promocional: "",
    estoque: "0",
    ilimitado: false,
    categoria_id: "",
    statusid: "",
    catalogo: true,
    sku: "",
    modelo: "",
    imagem: null,
  });

  async function carregarDados() {
    try {
      const [resCategorias, resStatus] = await Promise.all([
        api.get("/admin/categorias", { withCredentials: true }),
        api.get("/admin/produtos/status", { withCredentials: true }),
      ]);

      const listaCategorias = resolveApi<Categoria[]>(resCategorias.data) || [];
      const listaStatus = resolveApi<Status[]>(resStatus.data) || [];

      setCategorias(Array.isArray(listaCategorias) ? listaCategorias : []);
      setStatusList(Array.isArray(listaStatus) ? listaStatus : []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar categorias e status.");
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (!form.imagem) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(form.imagem);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [form.imagem]);

  function handleChange<K extends keyof ProdutoForm>(
    campo: K,
    valor: ProdutoForm[K]
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleNome(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      nome: value,
      slug: prev.slug ? prev.slug : slugify(value),
    }));
  }

  async function salvarProduto(e: FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do produto.");
      setAbaAtual("geral");
      return;
    }

    if (!form.preco.trim()) {
      alert("Informe o preço do produto.");
      setAbaAtual("precos");
      return;
    }

    try {
      setSalvando(true);

      const body = new FormData();

      body.append("nome", form.nome.trim());
      body.append("slug", form.slug.trim() || slugify(form.nome));
      body.append("descricao", form.descricao.trim());
      body.append("preco", String(form.preco).replace(",", "."));
      body.append(
        "preco_promocional",
        String(form.preco_promocional || "").replace(",", ".")
      );
      body.append("estoque", form.estoque || "0");
      body.append("ilimitado", form.ilimitado ? "1" : "0");
      body.append("catalogo", form.catalogo ? "1" : "0");
      body.append("sku", form.sku.trim());
      body.append("modelo", form.modelo.trim());

      if (form.categoria_id) body.append("categoria_id", form.categoria_id);
      if (form.statusid) body.append("statusid", form.statusid);
      if (form.imagem) body.append("imagem", form.imagem);

      await api.post("/admin/produto/criar", body, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Produto cadastrado com sucesso.");
      router.push("/admin/produtos");
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Erro ao cadastrar produto."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="page">
        <section className="hero-card">
          <div className="hero-content">
            <span className="hero-badge">Cadastro de produto</span>
            <h1>Novo produto</h1>
            <p>
              Preencha as informações do produto em uma interface mais moderna,
              organizada e agradável de usar.
            </p>
          </div>

          <div className="hero-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => router.push("/admin/produtos")}
            >
              Voltar
            </button>

            <button
              type="submit"
              form="form-produto"
              className="btn-primary"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Cadastrar produto"}
            </button>
          </div>
        </section>

        <section className="form-shell">
          <div className="tabs-wrap">
            <TabButton
              active={abaAtual === "geral"}
              title="Geral"
              subtitle="Dados principais"
              onClick={() => setAbaAtual("geral")}
            />
            <TabButton
              active={abaAtual === "precos"}
              title="Preços"
              subtitle="Valores do produto"
              onClick={() => setAbaAtual("precos")}
            />
            <TabButton
              active={abaAtual === "estoque"}
              title="Estoque"
              subtitle="Controle e catálogo"
              onClick={() => setAbaAtual("estoque")}
            />
            <TabButton
              active={abaAtual === "midia"}
              title="Mídia"
              subtitle="Imagem principal"
              onClick={() => setAbaAtual("midia")}
            />
          </div>

          <form id="form-produto" className="form-card" onSubmit={salvarProduto}>
            {abaAtual === "geral" && (
              <div className="section-content">
                <div className="section-header">
                  <h2>Informações gerais</h2>
                  <p>Defina os dados principais do produto.</p>
                </div>

                <div className="grid">
                  <div className="field full">
                    <label>Nome do produto</label>
                    <input
                      className="input-ui"
                      value={form.nome}
                      onChange={handleNome}
                      placeholder="Ex: Cesta de chocolate premium"
                    />
                  </div>

                  <div className="field">
                    <label>Slug</label>
                    <input
                      className="input-ui"
                      value={form.slug}
                      onChange={(e) =>
                        handleChange("slug", slugify(e.target.value))
                      }
                      placeholder="slug-do-produto"
                    />
                  </div>

                  <div className="field">
                    <label>SKU</label>
                    <input
                      className="input-ui"
                      value={form.sku}
                      onChange={(e) => handleChange("sku", e.target.value)}
                      placeholder="Ex: SKU-001"
                    />
                  </div>

                  <div className="field">
                    <label>Modelo</label>
                    <input
                      className="input-ui"
                      value={form.modelo}
                      onChange={(e) => handleChange("modelo", e.target.value)}
                      placeholder="Ex: Modelo Luxo"
                    />
                  </div>

                  <div className="field">
                    <label>Categoria</label>
                    <select
                      className="input-ui"
                      value={form.categoria_id}
                      onChange={(e) =>
                        handleChange("categoria_id", e.target.value)
                      }
                    >
                      <option value="">Selecione</option>
                      {categorias.map((cat) => (
                        <option key={cat.id_categoria} value={cat.id_categoria}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Status</label>
                    <select
                      className="input-ui"
                      value={form.statusid}
                      onChange={(e) => handleChange("statusid", e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {statusList.map((status, i) => {
                        const id = status.id_status ?? status.id ?? i + 1;
                        const nome =
                          status.nome ||
                          status.titulo ||
                          status.codigo ||
                          `Status ${id}`;

                        return (
                          <option key={id} value={id}>
                            {nome}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="field full">
                    <label>Descrição</label>
                    <textarea
                      className="textarea-ui"
                      value={form.descricao}
                      onChange={(e) =>
                        handleChange("descricao", e.target.value)
                      }
                      placeholder="Descreva o produto com mais detalhes..."
                    />
                  </div>
                </div>
              </div>
            )}

            {abaAtual === "precos" && (
              <div className="section-content">
                <div className="section-header">
                  <h2>Preços</h2>
                  <p>Informe o valor normal e o valor promocional.</p>
                </div>

                <div className="grid">
                  <div className="field">
                    <label>Preço</label>
                    <input
                      className="input-ui"
                      value={form.preco}
                      onChange={(e) => handleChange("preco", e.target.value)}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="field">
                    <label>Preço promocional</label>
                    <input
                      className="input-ui"
                      value={form.preco_promocional}
                      onChange={(e) =>
                        handleChange("preco_promocional", e.target.value)
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="info-card full">
                    <strong>Dica</strong>
                    <span>
                      Use preço promocional somente quando realmente houver oferta.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {abaAtual === "estoque" && (
              <div className="section-content">
                <div className="section-header">
                  <h2>Estoque e catálogo</h2>
                  <p>Controle a disponibilidade e a visibilidade do produto.</p>
                </div>

                <div className="grid">
                  <div className="field">
                    <label>Estoque</label>
                    <input
                      className="input-ui"
                      type="number"
                      min="0"
                      value={form.estoque}
                      onChange={(e) => handleChange("estoque", e.target.value)}
                    />
                  </div>

                  <div className="checks-card">
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={form.catalogo}
                        onChange={(e) =>
                          handleChange("catalogo", e.target.checked)
                        }
                      />
                      <span>Produto visível no catálogo</span>
                    </label>

                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={form.ilimitado}
                        onChange={(e) =>
                          handleChange("ilimitado", e.target.checked)
                        }
                      />
                      <span>Estoque ilimitado</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {abaAtual === "midia" && (
              <div className="section-content">
                <div className="section-header">
                  <h2>Mídia</h2>
                  <p>Adicione a imagem principal do produto.</p>
                </div>

                <div className="media-layout">
                  <div className="field">
                    <label>Imagem principal</label>
                    <input
                      className="input-ui file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleChange("imagem", e.target.files?.[0] || null)
                      }
                    />
                  </div>

                  <div className="preview-card">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Prévia do produto"
                        className="preview-image"
                      />
                    ) : (
                      <div className="preview-empty">
                        <span>Prévia da imagem</span>
                        <small>Nenhuma imagem selecionada</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="form-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => router.push("/admin/produtos")}
              >
                Cancelar
              </button>

              <div className="footer-right">
                {abaAtual !== "geral" && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      if (abaAtual === "precos") setAbaAtual("geral");
                      if (abaAtual === "estoque") setAbaAtual("precos");
                      if (abaAtual === "midia") setAbaAtual("estoque");
                    }}
                  >
                    Aba anterior
                  </button>
                )}

                {abaAtual !== "midia" ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (abaAtual === "geral") setAbaAtual("precos");
                      if (abaAtual === "precos") setAbaAtual("estoque");
                      if (abaAtual === "estoque") setAbaAtual("midia");
                    }}
                  >
                    Próxima aba
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={salvando}
                  >
                    {salvando ? "Salvando..." : "Cadastrar produto"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px;
          background:
            radial-gradient(circle at top left, rgba(225, 29, 116, 0.08), transparent 28%),
            linear-gradient(180deg, #fff9fb 0%, #fffdfd 100%);
          color: #2b2230;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 22px;
          padding: 28px;
          border-radius: 30px;
          background: linear-gradient(135deg, #fff7fa 0%, #ffffff 100%);
          border: 1px solid #f2d7e0;
          box-shadow: 0 18px 44px rgba(91, 33, 52, 0.06);
        }

        .hero-content {
          max-width: 760px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: #fff1f6;
          color: #d61f69;
          border: 1px solid #f7cbda;
          font-size: 12px;
          font-weight: 800;
        }

        .hero-card h1 {
          margin: 12px 0 8px;
          font-size: 38px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #2d2230;
        }

        .hero-card p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: #806372;
          font-weight: 500;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .form-shell {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 22px;
          align-items: start;
        }

        .tabs-wrap {
          position: sticky;
          top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tab-button {
          width: 100%;
          text-align: left;
          border: 1px solid #efd7e0;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 22px;
          padding: 16px;
          cursor: pointer;
          transition: 0.2s ease;
          box-shadow: 0 8px 24px rgba(91, 33, 52, 0.04);
        }

        .tab-button:hover {
          transform: translateY(-2px);
          border-color: #ebb3c9;
        }

        .tab-button.active {
          background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
          border-color: transparent;
          box-shadow: 0 18px 34px rgba(190, 24, 93, 0.24);
        }

        .tab-title {
          display: block;
          font-size: 15px;
          font-weight: 900;
          color: #3a2a35;
        }

        .tab-subtitle {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #866777;
          font-weight: 600;
        }

        .tab-button.active .tab-title,
        .tab-button.active .tab-subtitle {
          color: #fff;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #f2d7e0;
          border-radius: 30px;
          box-shadow: 0 18px 44px rgba(91, 33, 52, 0.06);
          overflow: hidden;
        }

        .section-content {
          padding: 28px;
        }

        .section-header {
          margin-bottom: 22px;
        }

        .section-header h2 {
          margin: 0 0 6px;
          font-size: 28px;
          line-height: 1.1;
          font-weight: 900;
          color: #2d2230;
        }

        .section-header p {
          margin: 0;
          color: #826575;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 500;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full {
          grid-column: 1 / -1;
        }

        .field label {
          font-size: 13px;
          font-weight: 800;
          color: #714a5d;
        }

        .input-ui,
        .textarea-ui {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #efcfd8;
          background: #fff;
          color: #2f2430;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: 0.2s ease;
        }

        .input-ui {
          height: 52px;
          padding: 0 14px;
        }

        .textarea-ui {
          min-height: 150px;
          padding: 14px;
          resize: vertical;
        }

        .input-ui:focus,
        .textarea-ui:focus {
          border-color: #d61f69;
          box-shadow: 0 0 0 4px rgba(214, 31, 105, 0.11);
        }

        select.input-ui {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 42px;
          background-image:
            linear-gradient(45deg, transparent 50%, #6d4a59 50%),
            linear-gradient(135deg, #6d4a59 50%, transparent 50%);
          background-position:
            calc(100% - 18px) calc(50% - 3px),
            calc(100% - 12px) calc(50% - 3px);
          background-size: 6px 6px, 6px 6px;
          background-repeat: no-repeat;
        }

        .info-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 16px 18px;
          border-radius: 18px;
          background: linear-gradient(180deg, #fff6fa 0%, #fffefe 100%);
          border: 1px solid #f4d7e2;
        }

        .info-card strong {
          color: #be185d;
          font-size: 14px;
          font-weight: 900;
        }

        .info-card span {
          color: #7f6372;
          font-size: 13px;
          line-height: 1.6;
          font-weight: 500;
        }

        .checks-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid #f0d9e2;
          background: linear-gradient(180deg, #fffefe 0%, #fff7fa 100%);
        }

        .check-row {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 700;
          color: #6a4356;
        }

        .media-layout {
          display: grid;
          grid-template-columns: 340px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .file-input {
          padding-top: 12px;
          padding-bottom: 12px;
          height: auto;
        }

        .preview-card {
          min-height: 280px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px dashed #e8bfd0;
          background: linear-gradient(180deg, #fffdfd 0%, #fff7fa 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-image {
          width: 100%;
          height: 280px;
          object-fit: cover;
          display: block;
        }

        .preview-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #8d6a7c;
          text-align: center;
          padding: 20px;
        }

        .preview-empty span {
          font-size: 16px;
          font-weight: 800;
        }

        .preview-empty small {
          font-size: 13px;
          font-weight: 600;
        }

        .form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding: 20px 28px 28px;
          border-top: 1px solid #f1dce4;
          background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, #fffafb 100%);
        }

        .footer-right {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-primary,
        .btn-secondary,
        .btn-ghost {
          appearance: none;
          border-radius: 16px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .btn-primary:hover,
        .btn-secondary:hover,
        .btn-ghost:hover {
          transform: translateY(-1px);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled,
        .btn-ghost:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-primary {
          border: none;
          color: #fff;
          background: linear-gradient(135deg, #e11d74 0%, #c2185b 100%);
          box-shadow: 0 12px 24px rgba(194, 24, 91, 0.2);
        }

        .btn-secondary {
          border: 1px solid #edd5dd;
          background: #fff8fb;
          color: #6a4356;
        }

        .btn-ghost {
          border: 1px solid #efd7e0;
          background: #ffffff;
          color: #7a5c68;
        }

        @media (max-width: 1100px) {
          .form-shell {
            grid-template-columns: 1fr;
          }

          .tabs-wrap {
            position: static;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 820px) {
          .grid,
          .media-layout {
            grid-template-columns: 1fr;
          }

          .hero-card h1 {
            font-size: 30px;
          }
        }

        @media (max-width: 768px) {
          .page {
            padding: 16px;
          }

          .hero-card,
          .form-card {
            border-radius: 22px;
          }

          .hero-card {
            padding: 20px;
          }

          .section-content {
            padding: 18px;
          }

          .form-footer {
            padding: 18px;
            flex-direction: column;
            align-items: stretch;
          }

          .footer-right {
            width: 100%;
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary,
          .btn-ghost {
            width: 100%;
          }

          .tabs-wrap {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}