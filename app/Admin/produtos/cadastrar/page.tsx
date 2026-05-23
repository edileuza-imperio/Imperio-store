"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

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

function limparTexto(valor: string) {
  return String(valor || "").trim();
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

  const data = `${agora.getFullYear()}${String(
    agora.getMonth() + 1
  ).padStart(2, "0")}${String(agora.getDate()).padStart(2, "0")}`;

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

const TIPOS_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

export default function CadastrarProduto() {
  const router = useRouter();

  const inputImagemRef = useRef<HTMLInputElement | null>(null);

  const [salvando, setSalvando] = useState(false);

  const [carregandoCategorias, setCarregandoCategorias] = useState(true);

  const [carregandoStatus, setCarregandoStatus] = useState(true);

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [statusLista, setStatusLista] = useState<StatusItem[]>([]);

  const [slugEditadoManualmente, setSlugEditadoManualmente] =
    useState(false);

  const [arquivosImagem, setArquivosImagem] = useState<File[]>([]);

  const [previewsImagem, setPreviewsImagem] = useState<string[]>([]);

  const [imagemPrincipalIndex, setImagemPrincipalIndex] = useState(0);

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

        const lista = extrairListaStatus(response?.data);

        setStatusLista(lista);

        if (Array.isArray(lista) && lista.length > 0) {
          const primeiroStatus = String(
            lista[0].id_status ?? lista[0].id ?? ""
          );

          setForm((prev) => ({
            ...prev,
            status_id: prev.status_id || primeiroStatus,
          }));
        }
      } catch (error) {
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
      (categoria) =>
        String(categoria.id_categoria) === String(form.categoria_id)
    );
  }, [categorias, form.categoria_id]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      sku: gerarSkuAutomatico(prev.nome, categoriaSelecionada?.nome),
    }));
  }, [form.nome, categoriaSelecionada?.nome]);

  useEffect(() => {
    return () => {
      previewsImagem.forEach((preview) =>
        URL.revokeObjectURL(preview)
      );
    };
  }, [previewsImagem]);

  function handleChange(
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  function handleImagem(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const arquivosValidos = files.filter((file) =>
      TIPOS_PERMITIDOS.includes(file.type)
    );

    if (arquivosValidos.length === 0) {
      toast.error("Envie imagens PNG, JPG, JPEG ou WEBP.");
      e.target.value = "";
      return;
    }

    const novosPreviews = arquivosValidos.map((file) =>
      URL.createObjectURL(file)
    );

    setArquivosImagem((prev) => [...prev, ...arquivosValidos]);

    setPreviewsImagem((prev) => [...prev, ...novosPreviews]);

    toast.success("Imagem(ns) adicionada(s) com sucesso.");

    e.target.value = "";
  }

  function removerImagem(index: number) {
    setArquivosImagem((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setPreviewsImagem((prev) => {
      const removida = prev[index];

      if (removida) {
        URL.revokeObjectURL(removida);
      }

      return prev.filter((_, i) => i !== index);
    });

    setImagemPrincipalIndex((prev) => {
      if (index === prev) return 0;

      if (index < prev) return prev - 1;

      return prev;
    });
  }

  function validarCampos() {
    if (!limparTexto(form.nome)) {
      toast.error("Preencha o nome do produto.");
      return false;
    }

    if (!limparTexto(form.slug)) {
      toast.error("Preencha o slug.");
      return false;
    }

    if (!limparTexto(form.descricao)) {
      toast.error("Preencha a descrição.");
      return false;
    }

    if (!limparTexto(form.preco)) {
      toast.error("Preencha o preço.");
      return false;
    }

    if (!limparTexto(form.marca)) {
      toast.error("Preencha a marca.");
      return false;
    }

    if (!limparTexto(form.categoria_id)) {
      toast.error("Selecione uma categoria.");
      return false;
    }

    if (!limparTexto(form.status_id)) {
      toast.error("Selecione um status.");
      return false;
    }

    if (arquivosImagem.length === 0) {
      toast.error("Adicione pelo menos uma imagem.");
      return false;
    }

    return true;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validarCampos()) return;

    try {
      setSalvando(true);

      const agora = dataAtualMysql();

      const formData = new FormData();

      formData.append("nome", limparTexto(form.nome));

      formData.append("slug", limparTexto(form.slug));

      formData.append(
        "descricao",
        limparTexto(form.descricao)
      );

      formData.append("preco", limparTexto(form.preco));

      formData.append(
        "preco_promocional",
        limparTexto(form.preco_promocional)
      );

      formData.append("sku", limparTexto(form.sku));

      formData.append("modelo", limparTexto(form.modelo));

      formData.append("marca", limparTexto(form.marca));

      formData.append(
        "categoria_id",
        limparTexto(form.categoria_id)
      );

      formData.append(
        "status_id",
        limparTexto(form.status_id)
      );

      formData.append("criado_em", agora);

      formData.append("atualizado_em", agora);

      formData.append(
        "imagem_principal_index",
        String(imagemPrincipalIndex)
      );

      arquivosImagem.forEach((arquivo, index) => {
        formData.append("imagens[]", arquivo);

        if (index === imagemPrincipalIndex) {
          formData.append(
            "imagem_principal",
            arquivo
          );
        }
      });

      const response = await api.post(
        "/painel/produto",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = response?.data;

      const sucesso =
        response.status === 200 ||
        response.status === 201 ||
        data?.status === 200 ||
        data?.status === 201;

      if (sucesso) {
        toast.success(
          data?.mensagem ||
            "Produto cadastrado com sucesso!"
        );

        setTimeout(() => {
          router.push("/Admin/produtos");
        }, 1500);

        return;
      }

      toast.error(
        data?.mensagem ||
          "Não foi possível cadastrar o produto."
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.mensagem ||
          "Erro ao cadastrar produto."
      );
    } finally {
      setSalvando(false);
    }
  }

  const imagemPrincipal =
    previewsImagem[imagemPrincipalIndex] || "";

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
      />

      <div className="container-produto">
        <form
          className="form-produto"
          onSubmit={handleSubmit}
        >
          <div className="card-etapa">
            <div className="topo-imagem">
              <div>
                <h2>Imagens do Produto</h2>

                <p>
                  Escolha várias imagens e defina a
                  principal.
                </p>
              </div>

              <button
                type="button"
                className="btn-upload"
                onClick={() =>
                  inputImagemRef.current?.click()
                }
              >
                Adicionar imagens
              </button>
            </div>

            <div className="upload-area">
              {imagemPrincipal ? (
                <img
                  src={imagemPrincipal}
                  alt="Imagem principal"
                  className="preview-principal"
                />
              ) : (
                <div className="sem-imagem">
                  Nenhuma imagem selecionada
                </div>
              )}

              {previewsImagem.length > 0 && (
                <div className="miniaturas">
                  {previewsImagem.map((preview, index) => (
                    <div
                      key={`${preview}-${index}`}
                      className={`miniatura-wrapper ${
                        imagemPrincipalIndex === index
                          ? "ativa"
                          : ""
                      }`}
                    >
                      <img
                        src={preview}
                        alt={`Imagem ${index + 1}`}
                        className="miniatura"
                        onClick={() =>
                          setImagemPrincipalIndex(index)
                        }
                      />

                      <div className="miniatura-acoes">
                        <button
                          type="button"
                          className={`btn-principal ${
                            imagemPrincipalIndex === index
                              ? "principal-ativa"
                              : ""
                          }`}
                          onClick={() =>
                            setImagemPrincipalIndex(index)
                          }
                        >
                          {imagemPrincipalIndex === index
                            ? "Principal"
                            : "Definir"}
                        </button>

                        <button
                          type="button"
                          className="btn-remover"
                          onClick={() =>
                            removerImagem(index)
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={inputImagemRef}
                type="file"
                hidden
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImagem}
              />
            </div>
          </div>

          <div className="card-etapa">
            <h2>Informações do Produto</h2>

            <div className="grid">
              <div className="campo">
                <label>Nome</label>

                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Nome do produto"
                />
              </div>

              <div className="campo">
                <label>Slug</label>

                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                />
              </div>

              <div className="campo full">
                <label>Descrição</label>

                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                />
              </div>

              <div className="campo">
                <label>Preço</label>

                <input
                  type="text"
                  name="preco"
                  value={form.preco}
                  onChange={handleChange}
                />
              </div>

              <div className="campo">
                <label>Preço promocional</label>

                <input
                  type="text"
                  name="preco_promocional"
                  value={form.preco_promocional}
                  onChange={handleChange}
                />
              </div>

              <div className="campo">
                <label>SKU automático</label>

                <input
                  type="text"
                  value={form.sku}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="card-etapa">
            <h2>Categoria e Status</h2>

            <div className="grid">
              <div className="campo">
                <label>Modelo</label>

                <input
                  type="text"
                  name="modelo"
                  value={form.modelo}
                  onChange={handleChange}
                />
              </div>

              <div className="campo">
                <label>Marca</label>

                <input
                  type="text"
                  name="marca"
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
                    Selecione
                  </option>

                  {categorias.map((categoria) => (
                    <option
                      key={String(
                        categoria.id_categoria
                      )}
                      value={String(
                        categoria.id_categoria
                      )}
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
                    Selecione
                  </option>

                  {statusLista.map((status) => {
                    const valor = String(
                      status.id_status ??
                        status.id ??
                        ""
                    );

                    return (
                      <option
                        key={valor}
                        value={valor}
                      >
                        {status.nome}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="acoes">
              <button
                type="button"
                className="btn-voltar"
                onClick={() =>
                  router.push("/Admin/produtos")
                }
              >
                Voltar
              </button>

              <button
                type="submit"
                className="btn-salvar"
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : "Cadastrar Produto"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .container-produto {
          width: 100%;
          min-height: 100vh;
          background: #f4f4f5;
          padding: 30px;
        }

        .form-produto {
          max-width: 1250px;
          margin: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .card-etapa {
          background: #fff;
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .card-etapa h2 {
          font-size: 24px;
          color: #111827;
          margin-bottom: 6px;
        }

        .card-etapa p {
          color: #6b7280;
          font-size: 14px;
        }

        .topo-imagem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .upload-area {
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
        }

        .preview-principal {
          width: 100%;
          max-width: 500px;
          height: 500px;
          object-fit: cover;
          border-radius: 22px;
          border: 2px solid #e5e7eb;
        }

        .sem-imagem {
          width: 100%;
          max-width: 500px;
          height: 500px;
          background: #f3f4f6;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .miniaturas {
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          justify-content: center;
        }

        .miniatura-wrapper {
          width: 120px;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid #e5e7eb;
          transition: 0.2s;
        }

        .miniatura-wrapper.ativa {
          border-color: #111827;
          transform: translateY(-3px);
        }

        .miniatura {
          width: 100%;
          height: 110px;
          object-fit: cover;
          cursor: pointer;
        }

        .miniatura-acoes {
          padding: 10px;
          display: flex;
          gap: 8px;
        }

        .btn-principal {
          flex: 1;
          border: none;
          background: #f3f4f6;
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .principal-ativa {
          background: #111827;
          color: white;
        }

        .btn-remover {
          width: 34px;
          border: none;
          background: #ef4444;
          color: white;
          border-radius: 10px;
          cursor: pointer;
          font-size: 18px;
        }

        .btn-upload {
          border: none;
          background: #111827;
          color: white;
          padding: 14px 20px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 600;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(260px, 1fr)
          );
          gap: 20px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campo.full {
          grid-column: 1 / -1;
        }

        .campo label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .campo input,
        .campo textarea,
        .campo select {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 14px;
          outline: none;
          font-size: 15px;
          transition: 0.2s;
        }

        .campo input:focus,
        .campo textarea:focus,
        .campo select:focus {
          border-color: #111827;
        }

        .campo textarea {
          min-height: 140px;
          resize: none;
        }

        .acoes {
          display: flex;
          justify-content: flex-end;
          gap: 14px;
          margin-top: 24px;
        }

        .btn-voltar {
          border: none;
          background: #e5e7eb;
          padding: 14px 20px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-salvar {
          border: none;
          background: #111827;
          color: white;
          padding: 14px 24px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-salvar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .container-produto {
            padding: 14px;
          }

          .card-etapa {
            padding: 18px;
            border-radius: 18px;
          }

          .preview-principal,
          .sem-imagem {
            height: 320px;
          }

          .miniatura-wrapper {
            width: 90px;
          }

          .miniatura {
            height: 85px;
          }

          .topo-imagem {
            flex-direction: column;
            align-items: stretch;
          }

          .acoes {
            flex-direction: column;
          }

          .btn-voltar,
          .btn-salvar,
          .btn-upload {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}