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
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);

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
      previewsImagem.forEach((preview) => URL.revokeObjectURL(preview));
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

    setArquivosImagem((prev) => {
      const listaAtualizada = [...prev, ...arquivosValidos];
      return listaAtualizada;
    });

    setPreviewsImagem((prev) => {
      const listaAtualizada = [...prev, ...novosPreviews];
      return listaAtualizada;
    });

    if (arquivosImagem.length === 0 && novosPreviews.length > 0) {
      setImagemPrincipalIndex(0);
    }

    toast.success("Imagem(ns) carregada(s) com sucesso.");

    e.target.value = "";
  }

  function removerImagem(index: number) {
    setArquivosImagem((prev) => prev.filter((_, i) => i !== index));

    setPreviewsImagem((prev) => {
      const removida = prev[index];
      if (removida) URL.revokeObjectURL(removida);
      return prev.filter((_, i) => i !== index);
    });

    setImagemPrincipalIndex((prev) => {
      if (index < prev) return prev - 1;
      if (index === prev) return 0;
      return prev;
    });
  }

  function validarCampos() {
    if (!limparTexto(form.nome)) {
      toast.error("Preencha o nome do produto.");
      return false;
    }

    if (!limparTexto(form.slug)) {
      toast.error("Preencha o slug do produto.");
      return false;
    }

    if (!limparTexto(form.descricao)) {
      toast.error("Preencha a descrição do produto.");
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
      toast.error("Envie pelo menos uma imagem do produto.");
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

      const payload = {
        nome: limparTexto(form.nome),
        slug: limparTexto(form.slug),
        descricao: limparTexto(form.descricao),
        preco: limparTexto(form.preco),
        preco_promocional: limparTexto(form.preco_promocional),
        sku: limparTexto(form.sku),
        modelo: limparTexto(form.modelo),
        marca: limparTexto(form.marca),
        categoria_id: limparTexto(form.categoria_id),
        status_id: limparTexto(form.status_id),
        criado_em: agora,
        atualizado_em: agora,
      };

      formData.append("nome", payload.nome);
      formData.append("slug", payload.slug);
      formData.append("descricao", payload.descricao);
      formData.append("preco", payload.preco);
      formData.append("sku", payload.sku);
      formData.append("marca", payload.marca);
      formData.append("categoria_id", payload.categoria_id);
      formData.append("status_id", payload.status_id);
      formData.append("criado_em", payload.criado_em);
      formData.append("atualizado_em", payload.atualizado_em);

      if (payload.preco_promocional) {
        formData.append("preco_promocional", payload.preco_promocional);
      }

      if (payload.modelo) {
        formData.append("modelo", payload.modelo);
      }

      arquivosImagem.forEach((arquivo, index) => {
        if (index === imagemPrincipalIndex) {
          formData.append("imagem_principal", arquivo, arquivo.name);
        }
        formData.append("imagens[]", arquivo, arquivo.name);
      });

      const response = await api.post("/painel/produto", formData, {
        withCredentials: true,
        transformRequest: [(data) => data],
      });

      const data = response?.data;

      const sucesso =
        response.status === 200 ||
        response.status === 201 ||
        data?.status === 200 ||
        data?.status === 201 ||
        data?.dados?.status === 200 ||
        data?.dados?.status === 201;

      if (sucesso) {
        toast.success(
          data?.mensagem ||
            data?.dados?.mensagem ||
            "Produto cadastrado com sucesso!"
        );

        setTimeout(() => {
          router.push("/Admin/produtos");
        }, 1500);

        return;
      }

      toast.error(
        data?.mensagem ||
          data?.dados?.mensagem ||
          "Não foi possível cadastrar o produto."
      );
    } catch (error: any) {
      const mensagemErro =
        error?.response?.data?.dados?.mensagem ||
        error?.response?.data?.mensagem ||
        "Erro ao conectar com a API ao cadastrar o produto.";

      toast.error(mensagemErro);
    } finally {
      setSalvando(false);
    }
  }

  const imagemPrincipal = previewsImagem[imagemPrincipalIndex] || "";

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container-produto">
        <form className="form-produto" onSubmit={handleSubmit}>
          {/* ETAPA 1 */}
          <div className="card-etapa">
            <h2>Imagem do Produto</h2>

            <div className="upload-area">
              {imagemPrincipal ? (
                <img
                  src={imagemPrincipal}
                  alt="Preview principal"
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
                        index === imagemPrincipalIndex ? "ativa" : ""
                      }`}
                      onClick={() => setImagemPrincipalIndex(index)}
                      role="button"
                      tabIndex={0}
                    >
                      <img
                        src={preview}
                        alt={`Miniatura ${index + 1}`}
                        className="miniatura"
                      />

                      <button
                        type="button"
                        className="btn-remover"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          removerImagem(index);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="btn-upload"
                onClick={() => inputImagemRef.current?.click()}
              >
                Escolher imagens
              </button>

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

          {/* ETAPA 2 */}
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
                  placeholder="Ex: Arranjo Luxo Casamento"
                />
              </div>

              <div className="campo">
                <label>Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="arranjo-luxo-casamento"
                />
              </div>

              <div className="campo full">
                <label>Descrição</label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  placeholder="Descreva o produto"
                />
              </div>

              <div className="campo">
                <label>Preço</label>
                <input
                  type="text"
                  name="preco"
                  value={form.preco}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="campo">
                <label>Preço promocional</label>
                <input
                  type="text"
                  name="preco_promocional"
                  value={form.preco_promocional}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="campo">
                <label>SKU automático</label>
                <input type="text" value={form.sku} readOnly disabled />
              </div>
            </div>
          </div>

          {/* ETAPA 3 */}
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
                  placeholder="Linha Premium"
                />
              </div>

              <div className="campo">
                <label>Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={form.marca}
                  onChange={handleChange}
                  placeholder="Universo Império"
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
              </div>
            </div>

            <div className="acoes">
              <button
                type="button"
                className="btn-voltar"
                onClick={() => router.push("/Admin/produtos")}
              >
                Voltar
              </button>

              <button
                type="submit"
                className="btn-salvar"
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Cadastrar Produto"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .container-produto {
          width: 100%;
          padding: 30px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .form-produto {
          max-width: 1200px;
          margin: auto;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .card-etapa {
          background: #fff;
          border-radius: 18px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .card-etapa h2 {
          margin-bottom: 20px;
          font-size: 22px;
          color: #222;
        }

        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .preview-principal {
          width: 350px;
          height: 350px;
          object-fit: cover;
          border-radius: 15px;
          border: 2px solid #eee;
        }

        .sem-imagem {
          width: 350px;
          height: 350px;
          border-radius: 15px;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #777;
          text-align: center;
          padding: 20px;
        }

        .miniaturas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }

        .miniatura-wrapper {
          position: relative;
          width: 90px;
          height: 90px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #ddd;
          cursor: pointer;
          transition: 0.2s ease;
          flex-shrink: 0;
        }

        .miniatura-wrapper:hover {
          transform: translateY(-2px);
        }

        .miniatura-wrapper.ativa {
          border-color: #111;
          box-shadow: 0 0 0 2px rgba(17, 17, 17, 0.08);
        }

        .miniatura {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .btn-remover {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          border: none;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.75);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-size: 16px;
        }

        .btn-upload {
          background: #111;
          color: #fff;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          cursor: pointer;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
          font-weight: 600;
          color: #333;
        }

        .campo input,
        .campo textarea,
        .campo select {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 14px;
          font-size: 15px;
          outline: none;
          background: #fff;
        }

        .campo textarea {
          min-height: 130px;
          resize: none;
        }

        .acoes {
          margin-top: 25px;
          display: flex;
          justify-content: flex-end;
          gap: 15px;
        }

        .btn-voltar {
          background: #e5e5e5;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          cursor: pointer;
        }

        .btn-salvar {
          background: #0f172a;
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 10px;
          cursor: pointer;
        }

        .btn-salvar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .container-produto {
            padding: 15px;
          }

          .preview-principal,
          .sem-imagem {
            width: 100%;
            height: 260px;
          }

          .acoes {
            flex-direction: column;
          }

          .btn-voltar,
          .btn-salvar {
            width: 100%;
          }

          .miniatura-wrapper {
            width: 78px;
            height: 78px;
          }
        }
      `}</style>
    </>
  );
}