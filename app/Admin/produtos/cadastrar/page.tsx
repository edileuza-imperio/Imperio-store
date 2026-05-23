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

  if (Array.isArray(data?.dados)) {
    return data.dados;
  }

  if (Array.isArray(data?.categorias)) {
    return data.categorias;
  }

  if (Array.isArray(data?.dados?.categorias)) {
    return data.dados.categorias;
  }

  if (Array.isArray(data?.dados?.dados)) {
    return data.dados.dados;
  }

  return [];
}

function extrairListaStatus(data: any): StatusItem[] {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.dados?.dados)) {
    return data.dados.dados;
  }

  if (Array.isArray(data?.dados)) {
    return data.dados;
  }

  if (Array.isArray(data?.status)) {
    return data.status;
  }

  if (Array.isArray(data?.dados?.status)) {
    return data.dados.status;
  }

  return [];
}

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
        String(categoria.id_categoria) ===
        String(form.categoria_id)
    );
  }, [categorias, form.categoria_id]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      sku: gerarSkuAutomatico(
        prev.nome,
        categoriaSelecionada?.nome
      ),
    }));
  }, [form.nome, categoriaSelecionada?.nome]);

  function handleChange(
    e: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
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
        name === "preco" ||
        name === "preco_promocional"
          ? formatarPreco(value)
          : value,
    }));
  }

  function handleImagem(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const tiposPermitidos = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(file.type)) {
      toast.error(
        "Envie uma imagem PNG, JPG, JPEG ou WEBP."
      );

      return;
    }

    if (previewImagem) {
      URL.revokeObjectURL(previewImagem);
    }

    const preview = URL.createObjectURL(file);

    setArquivoImagem(file);

    setPreviewImagem(preview);
  }

  function validarCampos() {
    if (!limparTexto(form.nome)) {
      toast.error("Preencha o nome do produto.");
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

    if (!arquivoImagem) {
      toast.error("Envie uma imagem.");
      return false;
    }

    return true;
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!validarCampos()) return;

    try {
      setSalvando(true);

      const agora = dataAtualMysql();

      const formData = new FormData();

      formData.append("nome", form.nome);
      formData.append("slug", form.slug);
      formData.append("descricao", form.descricao);
      formData.append("preco", form.preco);
      formData.append(
        "preco_promocional",
        form.preco_promocional
      );
      formData.append("sku", form.sku);
      formData.append("modelo", form.modelo);
      formData.append("marca", form.marca);
      formData.append(
        "categoria_id",
        form.categoria_id
      );
      formData.append("status_id", form.status_id);
      formData.append("criado_em", agora);
      formData.append("atualizado_em", agora);

      if (arquivoImagem) {
        formData.append(
          "imagem",
          arquivoImagem,
          arquivoImagem.name
        );
      }

      await api.post("/painel/produto", formData, {
        withCredentials: true,
        transformRequest: [(data) => data],
      });

      toast.success("Produto cadastrado com sucesso!");

      setTimeout(() => {
        router.push("/Admin/produtos");
      }, 1500);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.mensagem ||
          "Erro ao cadastrar produto."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container-produto">
        <form
          className="form-produto"
          onSubmit={handleSubmit}
        >
          {/* ETAPA 1 */}
          <div className="card-etapa">
            <h2>Imagem do Produto</h2>

            <div className="upload-area">
              {previewImagem ? (
                <img
                  src={previewImagem}
                  alt="Preview"
                  className="preview-principal"
                />
              ) : (
                <div className="sem-imagem">
                  Nenhuma imagem selecionada
                </div>
              )}

              <div className="miniaturas">
                {previewImagem && (
                  <img
                    src={previewImagem}
                    alt="Miniatura"
                    className="miniatura"
                  />
                )}
              </div>

              <button
                type="button"
                className="btn-upload"
                onClick={() =>
                  inputImagemRef.current?.click()
                }
              >
                Escolher imagem
              </button>

              <input
                ref={inputImagemRef}
                type="file"
                hidden
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
                <label>SKU</label>

                <input
                  type="text"
                  value={form.sku}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* ETAPA 3 */}
          <div className="card-etapa">
            <h2>Categoria e Status</h2>

            <div className="grid">
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
                <label>Modelo</label>

                <input
                  type="text"
                  name="modelo"
                  value={form.modelo}
                  onChange={handleChange}
                />
              </div>

              <div className="campo">
                <label>Categoria</label>

                <select
                  name="categoria_id"
                  value={form.categoria_id}
                  onChange={handleChange}
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
                >
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
        }

        .miniaturas {
          display: flex;
          gap: 10px;
        }

        .miniatura {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 10px;
          border: 2px solid #ddd;
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
        }
      `}</style>
    </>
  );
}