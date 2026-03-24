"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/Api/conectar";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Categoria = {
  id_categoria: number | string;
  nome: string;
  slug?: string;
  status_id?: number | string;
};

type StatusItem = {
  id_status?: number | string;
  id?: number | string;
  nome: string;
  codigo?: string;
  descricao?: string;
};

type ProdutoForm = {
  nome: string;
  slug: string;
  descricao: string;
  preco: string;
  preco_promocional: string;
  sku: string;
  modelo: string;
  marca: string;
  categoria_id: string;
  status_id: string;
};

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatarPreco(valor: string) {
  return valor.replace(/[^\d.,]/g, "").replace(",", ".");
}

function dataAtualMysql() {
  const agora = new Date();
  const yyyy = agora.getFullYear();
  const mm = String(agora.getMonth() + 1).padStart(2, "0");
  const dd = String(agora.getDate()).padStart(2, "0");
  const hh = String(agora.getHours()).padStart(2, "0");
  const mi = String(agora.getMinutes()).padStart(2, "0");
  const ss = String(agora.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function gerarSkuAutomatico(nome: string, categoriaNome?: string) {
  const baseNome = nome
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((parte) => parte.slice(0, 3))
    .join("");

  const baseCategoria = (categoriaNome || "GERAL")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.slice(0, 3))
    .join("");

  const agora = new Date();
  const data = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, "0")}${String(
    agora.getDate()
  ).padStart(2, "0")}`;
  const hora = `${String(agora.getHours()).padStart(2, "0")}${String(
    agora.getMinutes()
  ).padStart(2, "0")}`;

  return `${baseCategoria || "CAT"}-${baseNome || "PROD"}-${data}${hora}`;
}

function extrairListaCategorias(data: any): Categoria[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.categorias)) return data.categorias;
  if (Array.isArray(data?.dados?.categorias)) return data.dados.categorias;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  return [];
}

function extrairListaStatus(data: any): StatusItem[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.status)) return data.status;
  if (Array.isArray(data?.dados?.status)) return data.dados.status;
  return [];
}

export default function CadastrarProduto() {
  const router = useRouter();
  const inputImagemRef = useRef<HTMLInputElement | null>(null);

  const [etapa, setEtapa] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [carregandoStatus, setCarregandoStatus] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusLista, setStatusLista] = useState<StatusItem[]>([]);
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);

  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");

  const [form, setForm] = useState<ProdutoForm>({
    nome: "",
    slug: "",
    descricao: "",
    preco: "",
    preco_promocional: "",
    sku: "",
    modelo: "",
    marca: "",
    categoria_id: "",
    status_id: "",
  });

  useEffect(() => {
    async function carregarCategorias() {
      try {
        setCarregandoCategorias(true);
        const response = await api.get("/painel/categorias");
        const lista = extrairListaCategorias(response?.data);
        setCategorias(lista);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        toast.error("Não foi possível carregar as categorias.");
      } finally {
        setCarregandoCategorias(false);
      }
    }

    carregarCategorias();
  }, []);

  useEffect(() => {
    async function carregarStatus() {
      try {
        setCarregandoStatus(true);

        const response = await api.get("/painel/status");
        const data = response?.data;
        const lista = extrairListaStatus(data);

        setStatusLista(lista);

        if (Array.isArray(lista) && lista.length > 0) {
          const primeiroStatus = String(lista[0].id_status ?? lista[0].id ?? "");

          setForm((prev) => ({
            ...prev,
            status_id: prev.status_id || primeiroStatus,
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar status:", error);
        toast.error("Não foi possível carregar os status.");
      } finally {
        setCarregandoStatus(false);
      }
    }

    carregarStatus();
  }, []);

  useEffect(() => {
    if (!slugEditadoManualmente) {
      setForm((prev) => ({
        ...prev,
        slug: gerarSlug(prev.nome),
      }));
    }
  }, [form.nome, slugEditadoManualmente]);

  const categoriaSelecionada = useMemo(() => {
    return categorias.find(
      (categoria) => String(categoria.id_categoria) === String(form.categoria_id)
    );
  }, [categorias, form.categoria_id]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      sku: gerarSkuAutomatico(prev.nome, categoriaSelecionada?.nome),
    }));
  }, [form.nome, categoriaSelecionada?.nome]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    if (name === "slug") {
      setSlugEditadoManualmente(true);
    }

    if (name === "sku") {
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "preco" || name === "preco_promocional"
          ? formatarPreco(value)
          : value,
    }));
  }

  function abrirUpload() {
    inputImagemRef.current?.click();
  }

  function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!tiposPermitidos.includes(file.type)) {
      toast.error("Envie uma imagem PNG, JPG, JPEG ou WEBP.");
      return;
    }

    if (previewImagem) {
      URL.revokeObjectURL(previewImagem);
    }

    const preview = URL.createObjectURL(file);

    setArquivoImagem(file);
    setPreviewImagem(preview);

    toast.success("Imagem carregada com sucesso.");
  }

  useEffect(() => {
    return () => {
      if (previewImagem) {
        URL.revokeObjectURL(previewImagem);
      }
    };
  }, [previewImagem]);

  function validarEtapaAtual() {
    if (etapa === 1) {
      if (!form.nome.trim()) {
        toast.error("Preencha o nome do produto.");
        return false;
      }

      if (!form.slug.trim()) {
        toast.error("Preencha o slug do produto.");
        return false;
      }

      if (!form.descricao.trim()) {
        toast.error("Preencha a descrição do produto.");
        return false;
      }
    }

    if (etapa === 2) {
      if (!form.preco.trim()) {
        toast.error("Preencha o preço.");
        return false;
      }

      if (!form.marca.trim()) {
        toast.error("Preencha a marca.");
        return false;
      }

      if (!form.categoria_id.trim()) {
        toast.error("Selecione uma categoria.");
        return false;
      }

      if (!form.status_id.trim()) {
        toast.error("Selecione um status.");
        return false;
      }
    }

    if (etapa === 3) {
      if (!arquivoImagem) {
        toast.error("Envie uma imagem do produto.");
        return false;
      }
    }

    return true;
  }

  function avancarEtapa() {
    if (!validarEtapaAtual()) return;
    setEtapa((prev) => Math.min(prev + 1, 3));
  }

  function voltarEtapa() {
    setEtapa((prev) => Math.max(prev - 1, 1));
  }

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!validarEtapaAtual()) return;

  try {
    setSalvando(true);

    const agora = dataAtualMysql();

    const formData = new FormData();

    formData.append("nome", form.nome.trim());
    formData.append("slug", form.slug.trim());
    formData.append("descricao", form.descricao.trim());
    formData.append("preco", String(form.preco ? Number(form.preco) : 0));
    formData.append(
      "preco_promocional",
      form.preco_promocional ? String(Number(form.preco_promocional)) : ""
    );
    formData.append("sku", form.sku.trim());
    formData.append("modelo", form.modelo.trim());
    formData.append("marca", form.marca.trim());
    formData.append("categoria_id", String(Number(form.categoria_id)));
    formData.append("status_id", String(Number(form.status_id)));
    formData.append("criado_em", agora);
    formData.append("atualizado_em", agora);

    if (arquivoImagem) {
      formData.append("imagem", arquivoImagem);
    }

    /* DEBUG DO FORM */
    console.log("===== DEBUG FORM =====");

    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    console.log("arquivoImagem:", arquivoImagem);

    /* REQUISIÇÃO */
    const response = await api.post("/painel/produto", formData);

    console.log("RESPOSTA API:", response);

    const data = response?.data;

    if (
      response.status === 200 ||
      response.status === 201 ||
      data?.status === 200 ||
      data?.status === 201
    ) {
      toast.success("Produto cadastrado com sucesso!");

      setTimeout(() => {
        router.push("/Admin/produtos");
      }, 1800);

      return;
    }

    toast.error(data?.mensagem || "Não foi possível cadastrar o produto.");
  } catch (error: any) {

    console.log("===== ERRO API =====");
    console.error(error);

    if (error?.response) {
      console.log("STATUS:", error.response.status);
      console.log("DATA:", error.response.data);
      console.log("HEADERS:", error.response.headers);
    }

    toast.error(
      error?.response?.data?.mensagem ||
      "Erro ao conectar com a API ao cadastrar o produto."
    );

  } finally {
    setSalvando(false);
  }
}

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="pagina-produto">
        <div className="header-page">
          <div>
            <span className="badge-topo">Painel Administrativo</span>
            <h1>Cadastrar Produto</h1>
            <p>
              Cadastre um novo produto em 3 passos com categoria dinâmica,
              status puxado da API, SKU automático e upload real de imagem.
            </p>
          </div>

          <button
            type="button"
            className="btn-secundario"
            onClick={() => router.push("/Admin/produtos")}
          >
            Voltar para produtos
          </button>
        </div>

        <div className="wrapper">
          <aside className="painel-lateral">
            <div className="card-etapas">
              <div className={`etapa-item ${etapa >= 1 ? "ativo" : ""}`}>
                <div className="numero">1</div>
                <div>
                  <strong>Informações</strong>
                  <span>Nome, slug e descrição</span>
                </div>
              </div>

              <div className={`etapa-item ${etapa >= 2 ? "ativo" : ""}`}>
                <div className="numero">2</div>
                <div>
                  <strong>Comercial</strong>
                  <span>Preço, marca, SKU, status e categoria</span>
                </div>
              </div>

              <div className={`etapa-item ${etapa >= 3 ? "ativo" : ""}`}>
                <div className="numero">3</div>
                <div>
                  <strong>Imagem e revisão</strong>
                  <span>Upload e envio final</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="conteudo">
            <form onSubmit={handleSubmit} className="form-produto">
              {etapa === 1 && (
                <section className="card-form">
                  <div className="titulo-bloco">
                    <h2>Passo 1 — Informações principais</h2>
                    <p>Preencha os dados básicos do produto.</p>
                  </div>

                  <div className="grid">
                    <div className="campo campo-full">
                      <label>Nome do produto</label>
                      <input
                        type="text"
                        name="nome"
                        placeholder="Ex: Arranjo Luxo Casamento"
                        value={form.nome}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="campo campo-full">
                      <label>Slug</label>
                      <input
                        type="text"
                        name="slug"
                        placeholder="arranjo-luxo-casamento"
                        value={form.slug}
                        onChange={handleChange}
                      />
                      <small>
                        O slug é preenchido automaticamente, mas você pode editar.
                      </small>
                    </div>

                    <div className="campo campo-full">
                      <label>Descrição</label>
                      <textarea
                        name="descricao"
                        placeholder="Descreva o produto com detalhes..."
                        value={form.descricao}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </section>
              )}

              {etapa === 2 && (
                <section className="card-form">
                  <div className="titulo-bloco">
                    <h2>Passo 2 — Dados comerciais</h2>
                    <p>Defina valores, identificação, status e categoria.</p>
                  </div>

                  <div className="grid">
                    <div className="campo">
                      <label>Preço</label>
                      <input
                        type="number"
                        step="0.01"
                        name="preco"
                        placeholder="0.00"
                        value={form.preco}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="campo">
                      <label>Preço promocional</label>
                      <input
                        type="number"
                        step="0.01"
                        name="preco_promocional"
                        placeholder="0.00"
                        value={form.preco_promocional}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="campo">
                      <label>SKU automático</label>
                      <input
                        type="text"
                        name="sku"
                        value={form.sku}
                        readOnly
                        disabled
                      />
                      <small>Gerado automaticamente com base no nome e categoria.</small>
                    </div>

                    <div className="campo">
                      <label>Modelo</label>
                      <input
                        type="text"
                        name="modelo"
                        placeholder="Linha Premium"
                        value={form.modelo}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="campo">
                      <label>Marca</label>
                      <input
                        type="text"
                        name="marca"
                        placeholder="Universo Império"
                        value={form.marca}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="campo">
                      <label>Categoria</label>
                      <select
                        name="categoria_id"
                        value={form.categoria_id}
                        onChange={handleChange}
                        disabled={carregandoCategorias}
                      >
                        <option value="">
                          {carregandoCategorias
                            ? "Carregando categorias..."
                            : "Selecione uma categoria"}
                        </option>

                        {categorias.map((categoria) => (
                          <option
                            key={String(categoria.id_categoria)}
                            value={String(categoria.id_categoria)}
                          >
                            {categoria.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="campo">
                      <label>Status</label>
                      <select
                        name="status_id"
                        value={form.status_id}
                        onChange={handleChange}
                        disabled={carregandoStatus}
                      >
                        <option value="">
                          {carregandoStatus
                            ? "Carregando status..."
                            : statusLista.length === 0
                            ? "Nenhum status encontrado"
                            : "Selecione um status"}
                        </option>

                        {statusLista.map((status) => {
                          const valor = String(status.id_status ?? status.id ?? "");
                          return (
                            <option key={valor} value={valor}>
                              {status.nome}
                            </option>
                          );
                        })}
                      </select>

                      <small>
                        {carregandoStatus
                          ? "Buscando status..."
                          : `${statusLista.length} status carregado(s).`}
                      </small>
                    </div>
                  </div>
                </section>
              )}

              {etapa === 3 && (
                <section className="card-form">
                  <div className="titulo-bloco">
                    <h2>Passo 3 — Imagem e revisão final</h2>
                    <p>Envie a imagem principal e revise antes de salvar.</p>
                  </div>

                  <div className="upload-area">
                    <input
                      ref={inputImagemRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImagem}
                      hidden
                    />

                    <div className="upload-box" onClick={abrirUpload}>
                      {!previewImagem ? (
                        <>
                          <div className="upload-icon">+</div>
                          <h3>Clique para enviar a imagem</h3>
                          <p>PNG, JPG, JPEG ou WEBP</p>
                        </>
                      ) : (
                        <>
                          <img src={previewImagem} alt="Prévia do produto" />
                          <div className="overlay-upload">
                            <span>Trocar imagem</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="revisao">
                    <div className="revisao-item">
                      <span>Produto</span>
                      <strong>{form.nome || "-"}</strong>
                    </div>

                    <div className="revisao-item">
                      <span>Slug</span>
                      <strong>{form.slug || "-"}</strong>
                    </div>

                    <div className="revisao-item">
                      <span>SKU</span>
                      <strong>{form.sku || "-"}</strong>
                    </div>

                    <div className="revisao-item">
                      <span>Preço</span>
                      <strong>R$ {form.preco || "0.00"}</strong>
                    </div>

                    <div className="revisao-item">
                      <span>Promoção</span>
                      <strong>
                        {form.preco_promocional
                          ? `R$ ${form.preco_promocional}`
                          : "Sem promoção"}
                      </strong>
                    </div>

                    <div className="revisao-item">
                      <span>Categoria</span>
                      <strong>{categoriaSelecionada?.nome || "-"}</strong>
                    </div>

                    <div className="revisao-item">
                      <span>Marca</span>
                      <strong>{form.marca || "-"}</strong>
                    </div>

                    <div className="revisao-item">
                      <span>Status</span>
                      <strong>
                        {statusLista.find(
                          (item) =>
                            String(item.id_status ?? item.id ?? "") === String(form.status_id)
                        )?.nome || "-"}
                      </strong>
                    </div>
                  </div>
                </section>
              )}

              <div className="acoes-form">
                {etapa > 1 && (
                  <button
                    type="button"
                    className="btn-secundario"
                    onClick={voltarEtapa}
                  >
                    Voltar
                  </button>
                )}

                {etapa < 3 ? (
                  <button
                    type="button"
                    className="btn-primario"
                    onClick={avancarEtapa}
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-primario"
                    disabled={salvando}
                  >
                    {salvando ? "Salvando produto..." : "Cadastrar produto"}
                  </button>
                )}
              </div>
            </form>
          </main>
        </div>
      </div>

      <style jsx>{`
        .pagina-produto {
          min-height: 100vh;
          padding: 32px;
          background: #f6f7fb;
          color: #1f2937;
        }

        .header-page {
          max-width: 1400px;
          margin: 0 auto 24px auto;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .badge-topo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: #ffffff;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 14px;
          border: 1px solid #e5e7eb;
        }

        .header-page h1 {
          margin: 0 0 10px 0;
          font-size: 2rem;
          font-weight: 800;
          color: #111827;
        }

        .header-page p {
          margin: 0;
          color: #6b7280;
          max-width: 700px;
          line-height: 1.6;
        }

        .wrapper {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
          align-items: start;
        }

        .painel-lateral {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 24px;
        }

        .card-etapas,
        .card-form {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          border-radius: 24px;
        }

        .card-etapas {
          padding: 20px;
        }

        .etapa-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 18px;
          transition: 0.25s ease;
          opacity: 0.75;
          background: #f9fafb;
        }

        .etapa-item + .etapa-item {
          margin-top: 10px;
        }

        .etapa-item.ativo {
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          opacity: 1;
        }

        .numero {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: white;
          font-weight: 700;
          flex-shrink: 0;
        }

        .etapa-item strong {
          display: block;
          font-size: 0.98rem;
          color: #111827;
        }

        .etapa-item span {
          display: block;
          font-size: 0.86rem;
          color: #6b7280;
          margin-top: 2px;
        }

        .conteudo {
          min-width: 0;
        }

        .form-produto {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-form {
          padding: 28px;
        }

        .titulo-bloco {
          margin-bottom: 22px;
        }

        .titulo-bloco h2 {
          margin: 0 0 8px 0;
          color: #111827;
          font-size: 1.5rem;
        }

        .titulo-bloco p {
          margin: 0;
          color: #6b7280;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campo-full {
          grid-column: 1 / -1;
        }

        .campo label {
          font-size: 0.94rem;
          font-weight: 600;
          color: #374151;
        }

        .campo input,
        .campo textarea,
        .campo select {
          width: 100%;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          border-radius: 16px;
          padding: 14px 16px;
          outline: none;
          transition: 0.25s ease;
          font-size: 0.98rem;
        }

        .campo input[disabled] {
          background: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
        }

        .campo input::placeholder,
        .campo textarea::placeholder {
          color: #9ca3af;
        }

        .campo input:focus,
        .campo textarea:focus,
        .campo select:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }

        .campo textarea {
          min-height: 160px;
          resize: vertical;
        }

        .campo small {
          color: #6b7280;
          font-size: 0.82rem;
        }

        .upload-area {
          margin-bottom: 24px;
        }

        .upload-box {
          width: 100%;
          min-height: 320px;
          border-radius: 24px;
          border: 1.5px dashed #cbd5e1;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          cursor: pointer;
          overflow: hidden;
          position: relative;
          transition: 0.25s ease;
          padding: 24px;
        }

        .upload-box:hover {
          transform: translateY(-2px);
          border-color: #818cf8;
        }

        .upload-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: #fff;
          margin-bottom: 14px;
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25);
        }

        .upload-box h3 {
          margin: 0 0 8px 0;
          font-size: 1.2rem;
          color: #111827;
        }

        .upload-box p {
          margin: 0;
          color: #6b7280;
        }

        .upload-box img {
          width: 100%;
          height: 420px;
          object-fit: cover;
          border-radius: 20px;
        }

        .overlay-upload {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.08),
            rgba(17, 24, 39, 0.45)
          );
          display: flex;
          align-items: end;
          justify-content: center;
          padding-bottom: 28px;
          opacity: 0;
          transition: 0.25s ease;
        }

        .upload-box:hover .overlay-upload {
          opacity: 1;
        }

        .overlay-upload span {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e5e7eb;
          color: #111827;
          padding: 10px 16px;
          border-radius: 999px;
          font-weight: 600;
        }

        .revisao {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .revisao-item {
          padding: 16px;
          border-radius: 18px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }

        .revisao-item span {
          display: block;
          color: #6b7280;
          font-size: 0.84rem;
          margin-bottom: 6px;
        }

        .revisao-item strong {
          color: #111827;
          word-break: break-word;
        }

        .acoes-form {
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }

        .btn-primario,
        .btn-secundario {
          border: none;
          outline: none;
          cursor: pointer;
          border-radius: 16px;
          padding: 14px 20px;
          font-weight: 700;
          font-size: 0.96rem;
          transition: 0.25s ease;
        }

        .btn-primario {
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: white;
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.24);
          margin-left: auto;
        }

        .btn-primario:hover {
          transform: translateY(-1px);
          filter: brightness(1.04);
        }

        .btn-primario:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secundario {
          background: #ffffff;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secundario:hover {
          background: #f9fafb;
        }

        @media (max-width: 1100px) {
          .wrapper {
            grid-template-columns: 1fr;
          }

          .painel-lateral {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .pagina-produto {
            padding: 18px;
          }

          .header-page {
            flex-direction: column;
          }

          .grid,
          .revisao {
            grid-template-columns: 1fr;
          }

          .card-form {
            padding: 20px;
          }

          .upload-box {
            min-height: 240px;
          }

          .upload-box img {
            height: 280px;
          }

          .acoes-form {
            flex-direction: column-reverse;
          }

          .btn-primario,
          .btn-secundario {
            width: 100%;
          }

          .btn-primario {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}