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
};

type StatusItem = {
  id_status?: number | string;
  id?: number | string;
  nome: string;
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

export default function CadastrarProduto() {
  const router = useRouter();

  const inputImagemRef = useRef<HTMLInputElement | null>(null);

  const [salvando, setSalvando] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [statusLista, setStatusLista] = useState<StatusItem[]>([]);

  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);

  const [previewImagem, setPreviewImagem] = useState("");

  const [slugEditadoManualmente, setSlugEditadoManualmente] =
    useState(false);

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
    async function carregarDados() {
      try {
        const categoriasResponse = await api.get("/painel/categorias");

        const statusResponse = await api.get("/painel/status");

        setCategorias(categoriasResponse?.data?.dados || []);

        setStatusLista(statusResponse?.data?.dados || []);
      } catch (error) {
        toast.error("Erro ao carregar dados.");
      }
    }

    carregarDados();
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

    if (name === "sku") return;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "preco" ||
        name === "preco_promocional"
          ? formatarPreco(value)
          : value,
    }));
  }

  function abrirUpload() {
    inputImagemRef.current?.click();
  }

  function handleImagem(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const preview = URL.createObjectURL(file);

    setArquivoImagem(file);

    setPreviewImagem(preview);
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

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

      if (arquivoImagem) {
        formData.append("imagem", arquivoImagem);
      }

      await api.post("/painel/produto", formData, {
        withCredentials: true,
      });

      toast.success("Produto cadastrado com sucesso!");

      setTimeout(() => {
        router.push("/Admin/produtos");
      }, 1500);
    } catch (error) {
      toast.error("Erro ao cadastrar produto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
      />

      <div className="container">
        <div className="header">
          <h1>Cadastrar Produto</h1>

          <p>
            Adicione um novo produto ao sistema
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="formulario"
        >
          <div className="uploadCard">
            <h2>Imagem do Produto</h2>

            <input
              ref={inputImagemRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImagem}
              className="inputFile"
            />

            <div className="previewBox">
              {previewImagem ? (
                <img
                  src={previewImagem}
                  alt="Preview"
                  className="previewImagem"
                />
              ) : (
                <div className="semImagem">
                  <span>+</span>

                  <p>
                    Nenhuma imagem selecionada
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={abrirUpload}
              className="botaoUpload"
            >
              Selecionar imagem
            </button>
          </div>

          <div className="cardFormulario">
            <div className="grid">
              <div className="campoGrande">
                <label>Nome do produto</label>

                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                />
              </div>

              <div className="campoGrande">
                <label>Slug</label>

                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                />
              </div>

              <div className="campoGrande">
                <label>Descrição</label>

                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Preço</label>

                <input
                  type="text"
                  name="preco"
                  value={form.preco}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>
                  Preço promocional
                </label>

                <input
                  type="text"
                  name="preco_promocional"
                  value={form.preco_promocional}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>SKU</label>

                <input
                  type="text"
                  value={form.sku}
                  disabled
                />
              </div>

              <div>
                <label>Modelo</label>

                <input
                  type="text"
                  name="modelo"
                  value={form.modelo}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Marca</label>

                <input
                  type="text"
                  name="marca"
                  value={form.marca}
                  onChange={handleChange}
                />
              </div>

              <div>
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

              <div>
                <label>Status</label>

                <select
                  name="status_id"
                  value={form.status_id}
                  onChange={handleChange}
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

            <div className="botoes">
              <button
                type="button"
                className="botaoVoltar"
                onClick={() =>
                  router.push("/Admin/produtos")
                }
              >
                Voltar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="botaoSalvar"
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
        .container {
          min-height: 100vh;
          background: #f4f7fb;
          padding: 40px;
        }

        .header {
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 34px;
          color: #111827;
          margin-bottom: 8px;
        }

        .header p {
          color: #6b7280;
          font-size: 15px;
        }

        .formulario {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 25px;
        }

        .uploadCard,
        .cardFormulario {
          background: #ffffff;
          border-radius: 24px;
          padding: 25px;
          box-shadow: 0 10px 30px
            rgba(0, 0, 0, 0.05);
        }

        .uploadCard h2 {
          margin-bottom: 20px;
          color: #111827;
        }

        .inputFile {
          display: none;
        }

        .previewBox {
          width: 100%;
          height: 340px;
          border-radius: 18px;
          overflow: hidden;
          border: 2px dashed #d1d5db;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .previewImagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .semImagem {
          text-align: center;
          color: #6b7280;
        }

        .semImagem span {
          font-size: 60px;
          display: block;
          margin-bottom: 10px;
        }

        .botaoUpload {
          width: 100%;
          height: 54px;
          border: none;
          border-radius: 14px;
          background: #111827;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
        }

        .botaoUpload:hover {
          background: #1f2937;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .campoGrande {
          grid-column: span 2;
        }

        .grid label {
          display: block;
          margin-bottom: 8px;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }

        .grid input,
        .grid textarea,
        .grid select {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 14px;
          font-size: 14px;
          outline: none;
          transition: 0.3s;
          background: #ffffff;
        }

        .grid textarea {
          min-height: 140px;
          resize: vertical;
        }

        .grid input:focus,
        .grid textarea:focus,
        .grid select:focus {
          border-color: #111827;
          box-shadow: 0 0 0 4px
            rgba(17, 24, 39, 0.1);
        }

        .botoes {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 30px;
        }

        .botaoVoltar,
        .botaoSalvar {
          height: 52px;
          padding: 0 28px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
        }

        .botaoVoltar {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .botaoVoltar:hover {
          background: #f3f4f6;
        }

        .botaoSalvar {
          background: #111827;
          border: none;
          color: white;
        }

        .botaoSalvar:hover {
          background: #1f2937;
        }

        @media (max-width: 980px) {
          .formulario {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .container {
            padding: 20px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .campoGrande {
            grid-column: span 1;
          }

          .botoes {
            flex-direction: column;
          }

          .botaoVoltar,
          .botaoSalvar {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}