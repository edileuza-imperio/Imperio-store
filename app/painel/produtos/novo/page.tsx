"use client";

import { useEffect, useMemo, useState, FormEvent, ChangeEvent } from "react";
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

function formatMoneyPreview(value: string) {
  const normalized = Number(String(value || "0").replace(",", "."));
  return normalized.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function TabButton({
  active,
  number,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  number: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`step-card ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="step-index">{number}</span>

      <div className="step-texts">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
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

  const categoriaSelecionada = useMemo(() => {
    return categorias.find((item) => String(item.id_categoria) === form.categoria_id);
  }, [categorias, form.categoria_id]);

  const statusSelecionado = useMemo(() => {
    return statusList.find((item, index) => {
      const value = String(item.id_status ?? item.id ?? index + 1);
      return value === form.statusid;
    });
  }, [statusList, form.statusid]);

  function irParaProximaAba() {
    if (abaAtual === "geral") setAbaAtual("precos");
    else if (abaAtual === "precos") setAbaAtual("estoque");
    else if (abaAtual === "estoque") setAbaAtual("midia");
  }

  function irParaAbaAnterior() {
    if (abaAtual === "precos") setAbaAtual("geral");
    else if (abaAtual === "estoque") setAbaAtual("precos");
    else if (abaAtual === "midia") setAbaAtual("estoque");
  }

  return (
    <>
      <div className="page-wrap">
        <section className="hero">
          <div className="hero-left">
            <span className="hero-badge">Painel de catálogo</span>
            <h1>Novo produto</h1>
            <p>
              Cadastre um novo produto com uma experiência mais elegante,
              organizada e profissional.
            </p>
          </div>

          <div className="hero-right">
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
              {salvando ? "Salvando..." : "Salvar produto"}
            </button>
          </div>
        </section>

        <div className="layout">
          <aside className="left-column">
            <div className="panel-card sticky-panel">
              <div className="panel-card-header">
                <span className="panel-mini-badge">Etapas</span>
                <h3>Configuração</h3>
                <p>Preencha cada parte do cadastro com calma.</p>
              </div>

              <div className="steps-list">
                <TabButton
                  active={abaAtual === "geral"}
                  number="01"
                  title="Geral"
                  subtitle="Dados principais"
                  onClick={() => setAbaAtual("geral")}
                />
                <TabButton
                  active={abaAtual === "precos"}
                  number="02"
                  title="Preços"
                  subtitle="Valores e oferta"
                  onClick={() => setAbaAtual("precos")}
                />
                <TabButton
                  active={abaAtual === "estoque"}
                  number="03"
                  title="Estoque"
                  subtitle="Disponibilidade"
                  onClick={() => setAbaAtual("estoque")}
                />
                <TabButton
                  active={abaAtual === "midia"}
                  number="04"
                  title="Mídia"
                  subtitle="Imagem principal"
                  onClick={() => setAbaAtual("midia")}
                />
              </div>
            </div>

            <div className="panel-card summary-card">
              <div className="panel-card-header">
                <span className="panel-mini-badge">Resumo</span>
                <h3>Pré-visualização</h3>
                <p>Veja rapidamente como o produto está ficando.</p>
              </div>

              <div className="summary-preview">
                <div className="summary-image-box">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Prévia do produto"
                      className="summary-image"
                    />
                  ) : (
                    <div className="summary-image-empty">
                      <span>Sem imagem</span>
                    </div>
                  )}
                </div>

                <div className="summary-content">
                  <span className="summary-category">
                    {categoriaSelecionada?.nome || "Sem categoria"}
                  </span>

                  <h4>{form.nome || "Nome do produto"}</h4>

                  <p>{form.descricao || "A descrição do produto aparecerá aqui."}</p>

                  <div className="summary-prices">
                    <strong>{formatMoneyPreview(form.preco)}</strong>
                    {form.preco_promocional ? (
                      <span>{formatMoneyPreview(form.preco_promocional)}</span>
                    ) : null}
                  </div>

                  <div className="summary-meta">
                    <div>
                      <small>SKU</small>
                      <strong>{form.sku || "—"}</strong>
                    </div>

                    <div>
                      <small>Status</small>
                      <strong>
                        {statusSelecionado?.nome ||
                          statusSelecionado?.titulo ||
                          statusSelecionado?.codigo ||
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <small>Estoque</small>
                      <strong>{form.ilimitado ? "Ilimitado" : form.estoque || "0"}</strong>
                    </div>

                    <div>
                      <small>Catálogo</small>
                      <strong>{form.catalogo ? "Visível" : "Oculto"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="main-column">
            <form id="form-produto" className="form-card" onSubmit={salvarProduto}>
              <div className="content-head">
                <div>
                  <span className="content-badge">
                    {abaAtual === "geral" && "Informações principais"}
                    {abaAtual === "precos" && "Valores do produto"}
                    {abaAtual === "estoque" && "Controle de disponibilidade"}
                    {abaAtual === "midia" && "Imagem e apresentação"}
                  </span>

                  <h2>
                    {abaAtual === "geral" && "Dados gerais"}
                    {abaAtual === "precos" && "Preços e promoção"}
                    {abaAtual === "estoque" && "Estoque e catálogo"}
                    {abaAtual === "midia" && "Imagem principal"}
                  </h2>

                  <p>
                    {abaAtual === "geral" &&
                      "Defina o nome, categoria, slug, status e a descrição do produto."}
                    {abaAtual === "precos" &&
                      "Configure o preço normal e o valor promocional do produto."}
                    {abaAtual === "estoque" &&
                      "Ajuste a quantidade disponível e a visibilidade no catálogo."}
                    {abaAtual === "midia" &&
                      "Escolha uma boa imagem para apresentar o produto no catálogo."}
                  </p>
                </div>
              </div>

              <div className="content-body">
                {abaAtual === "geral" && (
                  <div className="section-grid">
                    <div className="field full">
                      <label>Nome do produto</label>
                      <input
                        className="input-ui"
                        value={form.nome}
                        onChange={handleNome}
                        placeholder="Ex: Cesta premium com flores"
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
                        placeholder="Ex: Linha Luxo"
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
                        placeholder="Descreva os detalhes, diferenciais e informações importantes do produto..."
                      />
                    </div>
                  </div>
                )}

                {abaAtual === "precos" && (
                  <div className="section-grid">
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

                    <div className="info-box full">
                      <div className="info-box-icon">%</div>
                      <div>
                        <strong>Boas práticas</strong>
                        <p>
                          Use o preço promocional apenas quando houver uma oferta real.
                          Isso deixa o catálogo mais confiável e profissional.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {abaAtual === "estoque" && (
                  <div className="section-grid">
                    <div className="field">
                      <label>Estoque</label>
                      <input
                        className="input-ui"
                        type="number"
                        min="0"
                        value={form.estoque}
                        onChange={(e) => handleChange("estoque", e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="toggles-box">
                      <label className="toggle-row">
                        <input
                          type="checkbox"
                          checked={form.catalogo}
                          onChange={(e) =>
                            handleChange("catalogo", e.target.checked)
                          }
                        />
                        <div>
                          <strong>Visível no catálogo</strong>
                          <span>Permite que o produto apareça para o cliente.</span>
                        </div>
                      </label>

                      <label className="toggle-row">
                        <input
                          type="checkbox"
                          checked={form.ilimitado}
                          onChange={(e) =>
                            handleChange("ilimitado", e.target.checked)
                          }
                        />
                        <div>
                          <strong>Estoque ilimitado</strong>
                          <span>Use para produtos sem controle de quantidade.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {abaAtual === "midia" && (
                  <div className="media-grid">
                    <div className="upload-card">
                      <label>Selecionar imagem</label>
                      <input
                        className="input-ui file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleChange("imagem", e.target.files?.[0] || null)
                        }
                      />

                      <div className="upload-tip">
                        Escolha uma imagem de boa qualidade para deixar o catálogo
                        mais bonito e profissional.
                      </div>
                    </div>

                    <div className="preview-panel">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Prévia do produto"
                          className="preview-image"
                        />
                      ) : (
                        <div className="preview-empty">
                          <strong>Prévia da imagem</strong>
                          <span>Nenhuma imagem selecionada</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="content-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => router.push("/admin/produtos")}
                >
                  Cancelar
                </button>

                <div className="footer-actions">
                  {abaAtual !== "geral" && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={irParaAbaAnterior}
                    >
                      Aba anterior
                    </button>
                  )}

                  {abaAtual !== "midia" ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={irParaProximaAba}
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
          </main>
        </div>
      </div>

      <style jsx>{`
        .page-wrap {
          min-height: 100vh;
          padding: 28px;
          background:
            radial-gradient(circle at top left, rgba(225, 29, 116, 0.07), transparent 24%),
            radial-gradient(circle at bottom right, rgba(190, 24, 93, 0.05), transparent 22%),
            linear-gradient(180deg, #fff9fb 0%, #fffdfd 100%);
          color: #2a2230;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 30px;
          border-radius: 32px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 248, 250, 0.98) 100%);
          border: 1px solid #f1dbe3;
          box-shadow:
            0 10px 30px rgba(77, 35, 54, 0.04),
            0 24px 60px rgba(77, 35, 54, 0.06);
        }

        .hero-left {
          max-width: 760px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: #fff1f6;
          color: #d61f69;
          border: 1px solid #f7d2df;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .hero h1 {
          margin: 14px 0 8px;
          font-size: 42px;
          line-height: 1.02;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: #2a2230;
        }

        .hero p {
          margin: 0;
          max-width: 720px;
          color: #7e6472;
          font-size: 14px;
          line-height: 1.75;
          font-weight: 500;
        }

        .hero-right {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .layout {
          display: grid;
          grid-template-columns: 340px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .left-column,
        .main-column {
          min-width: 0;
        }

        .sticky-panel {
          position: sticky;
          top: 20px;
        }

        .panel-card {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #f1dbe3;
          border-radius: 28px;
          box-shadow:
            0 10px 30px rgba(77, 35, 54, 0.04),
            0 20px 42px rgba(77, 35, 54, 0.05);
          padding: 20px;
        }

        .panel-card + .panel-card {
          margin-top: 18px;
        }

        .panel-card-header {
          margin-bottom: 16px;
        }

        .panel-mini-badge {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: #fff4f7;
          color: #c81e64;
          border: 1px solid #f4d2de;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .panel-card-header h3 {
          margin: 10px 0 6px;
          font-size: 24px;
          line-height: 1.1;
          font-weight: 900;
          color: #2a2230;
        }

        .panel-card-header p {
          margin: 0;
          color: #866977;
          font-size: 13px;
          line-height: 1.65;
          font-weight: 500;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .step-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          padding: 14px;
          border-radius: 20px;
          border: 1px solid #efdce3;
          background: linear-gradient(180deg, #fffefe 0%, #fff9fb 100%);
          cursor: pointer;
          transition: 0.2s ease;
        }

        .step-card:hover {
          transform: translateY(-2px);
          border-color: #ebb7ca;
          box-shadow: 0 14px 24px rgba(95, 36, 61, 0.06);
        }

        .step-card.active {
          background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
          border-color: transparent;
          box-shadow: 0 18px 30px rgba(190, 24, 93, 0.22);
        }

        .step-index {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #fff7fa;
          color: #be185d;
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .step-card.active .step-index {
          background: rgba(255, 255, 255, 0.16);
          color: #fff;
        }

        .step-texts {
          min-width: 0;
        }

        .step-texts strong {
          display: block;
          font-size: 14px;
          font-weight: 900;
          color: #372934;
        }

        .step-texts span {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          line-height: 1.5;
          color: #836878;
          font-weight: 600;
        }

        .step-card.active .step-texts strong,
        .step-card.active .step-texts span {
          color: #fff;
        }

        .summary-preview {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-image-box {
          width: 100%;
          height: 220px;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid #f0d9e2;
          background: linear-gradient(180deg, #fffafc 0%, #fff5f8 100%);
        }

        .summary-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .summary-image-empty {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #95717f;
          font-size: 14px;
          font-weight: 800;
        }

        .summary-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .summary-category {
          display: inline-flex;
          width: fit-content;
          padding: 7px 12px;
          border-radius: 999px;
          background: #fff1f5;
          border: 1px solid #f4d2de;
          color: #c81e64;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .summary-content h4 {
          margin: 0;
          font-size: 22px;
          line-height: 1.15;
          font-weight: 900;
          color: #2a2230;
        }

        .summary-content p {
          margin: 0;
          color: #806674;
          font-size: 13px;
          line-height: 1.7;
        }

        .summary-prices {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-prices strong {
          font-size: 22px;
          font-weight: 900;
          color: #be185d;
        }

        .summary-prices span {
          font-size: 14px;
          font-weight: 700;
          color: #8a6e7b;
        }

        .summary-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .summary-meta div {
          padding: 12px;
          border-radius: 16px;
          background: linear-gradient(180deg, #fffefe 0%, #fff8fb 100%);
          border: 1px solid #f2dfe6;
        }

        .summary-meta small {
          display: block;
          margin-bottom: 5px;
          color: #9b7787;
          font-size: 11px;
          font-weight: 700;
        }

        .summary-meta strong {
          display: block;
          color: #392c36;
          font-size: 13px;
          font-weight: 900;
          word-break: break-word;
        }

        .form-card {
          overflow: hidden;
          border-radius: 30px;
          border: 1px solid #f1dbe3;
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 10px 30px rgba(77, 35, 54, 0.04),
            0 24px 60px rgba(77, 35, 54, 0.06);
        }

        .content-head {
          padding: 28px 28px 20px;
          border-bottom: 1px solid #f2dfe6;
          background:
            linear-gradient(180deg, rgba(255, 247, 250, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%);
        }

        .content-badge {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: #fff1f6;
          border: 1px solid #f4d0dc;
          color: #c81e64;
          font-size: 12px;
          font-weight: 800;
        }

        .content-head h2 {
          margin: 12px 0 8px;
          font-size: 32px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #2a2230;
        }

        .content-head p {
          margin: 0;
          color: #826676;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 500;
        }

        .content-body {
          padding: 26px 28px;
        }

        .section-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .full {
          grid-column: 1 / -1;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          font-size: 13px;
          font-weight: 800;
          color: #6f4f5e;
        }

        .input-ui,
        .textarea-ui {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #ebd5de;
          background: #fff;
          color: #2f2430;
          border-radius: 18px;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: 0.2s ease;
        }

        .input-ui {
          height: 54px;
          padding: 0 16px;
        }

        .textarea-ui {
          min-height: 170px;
          padding: 16px;
          resize: vertical;
        }

        .input-ui::placeholder,
        .textarea-ui::placeholder {
          color: #b08b99;
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
          padding-right: 44px;
          background-image:
            linear-gradient(45deg, transparent 50%, #725261 50%),
            linear-gradient(135deg, #725261 50%, transparent 50%);
          background-position:
            calc(100% - 18px) calc(50% - 3px),
            calc(100% - 12px) calc(50% - 3px);
          background-size: 6px 6px, 6px 6px;
          background-repeat: no-repeat;
        }

        .info-box {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px;
          border-radius: 22px;
          background: linear-gradient(180deg, #fff6fa 0%, #fffefe 100%);
          border: 1px solid #f4d7e2;
        }

        .info-box-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #fff1f6;
          color: #c81e64;
          font-size: 16px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .info-box strong {
          display: block;
          margin-bottom: 5px;
          color: #be185d;
          font-size: 14px;
          font-weight: 900;
        }

        .info-box p {
          margin: 0;
          color: #806675;
          font-size: 13px;
          line-height: 1.65;
        }

        .toggles-box {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid #f1dce4;
          background: linear-gradient(180deg, #fffefe 0%, #fff8fb 100%);
        }

        .toggle-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #5f4754;
        }

        .toggle-row input {
          margin-top: 3px;
        }

        .toggle-row strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 900;
          color: #392b36;
        }

        .toggle-row span {
          display: block;
          font-size: 13px;
          line-height: 1.55;
          color: #846877;
          font-weight: 500;
        }

        .media-grid {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .upload-card,
        .preview-panel {
          padding: 18px;
          border-radius: 24px;
          border: 1px solid #f0dbe3;
          background: linear-gradient(180deg, #fffefe 0%, #fff8fb 100%);
        }

        .upload-card label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 800;
          color: #6f4f5e;
        }

        .file-input {
          padding-top: 14px;
          padding-bottom: 14px;
          height: auto;
        }

        .upload-tip {
          margin-top: 12px;
          color: #856878;
          font-size: 13px;
          line-height: 1.6;
        }

        .preview-panel {
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .preview-image {
          width: 100%;
          height: 320px;
          border-radius: 18px;
          object-fit: cover;
          display: block;
        }

        .preview-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
          color: #8f6f7f;
          padding: 24px;
        }

        .preview-empty strong {
          font-size: 18px;
          font-weight: 900;
          color: #4b3744;
        }

        .preview-empty span {
          font-size: 13px;
          font-weight: 600;
        }

        .content-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding: 20px 28px 28px;
          border-top: 1px solid #f2dfe6;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, #fffafb 100%);
        }

        .footer-actions {
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
          border: 1px solid #ead3dc;
          background: #fff8fb;
          color: #6c4a5c;
        }

        .btn-ghost {
          border: 1px solid #ead8df;
          background: #fff;
          color: #7b5d6d;
        }

        @media (max-width: 1180px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .sticky-panel {
            position: static;
          }
        }

        @media (max-width: 900px) {
          .section-grid,
          .media-grid {
            grid-template-columns: 1fr;
          }

          .hero h1 {
            font-size: 34px;
          }
        }

        @media (max-width: 768px) {
          .page-wrap {
            padding: 16px;
          }

          .hero,
          .panel-card,
          .form-card {
            border-radius: 22px;
          }

          .hero {
            padding: 20px;
          }

          .content-head,
          .content-body,
          .content-footer {
            padding-left: 18px;
            padding-right: 18px;
          }

          .content-head h2 {
            font-size: 26px;
          }

          .content-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .footer-actions {
            width: 100%;
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary,
          .btn-ghost {
            width: 100%;
          }

          .summary-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}