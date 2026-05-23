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

import {
  FiUploadCloud,
  FiArrowLeft,
  FiPackage,
  FiTag,
  FiImage,
} from "react-icons/fi";

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
        const [categoriasResponse, statusResponse] = await Promise.all([
          api.get("/painel/categorias"),
          api.get("/painel/status"),
        ]);

        setCategorias(
          categoriasResponse?.data?.dados ||
            categoriasResponse?.data ||
            []
        );

        const listaStatus =
          statusResponse?.data?.dados ||
          statusResponse?.data ||
          [];

        setStatusLista(listaStatus);

        if (listaStatus.length > 0) {
          setForm((prev) => ({
            ...prev,
            status_id: String(
              listaStatus[0].id_status ??
                listaStatus[0].id ??
                ""
            ),
          }));
        }
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

    const preview = URL.createObjectURL(file);

    setArquivoImagem(file);
    setPreviewImagem(preview);

    toast.success("Imagem adicionada.");
  }

  function validarCampos() {
    if (!form.nome) {
      toast.error("Digite o nome do produto.");
      return false;
    }

    if (!form.preco) {
      toast.error("Digite o preço.");
      return false;
    }

    if (!arquivoImagem) {
      toast.error("Selecione uma imagem.");
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
        formData.append(
          "imagem",
          arquivoImagem,
          arquivoImagem.name
        );
      }

      const response = await api.post(
        "/painel/produto",
        formData,
        {
          withCredentials: true,
        }
      );

      if (
        response.status === 200 ||
        response.status === 201
      ) {
        toast.success("Produto cadastrado com sucesso!");

        setTimeout(() => {
          router.push("/Admin/produtos");
        }, 1500);
      }
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
      <ToastContainer position="top-right" />

      <div className="min-h-screen bg-[#f5f5f7] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() =>
                router.push("/Admin/produtos")
              }
              className="flex items-center gap-2 text-gray-600 hover:text-black transition"
            >
              <FiArrowLeft />
              Voltar
            </button>

            <h1 className="text-4xl font-bold mt-4 text-gray-800">
              Cadastrar Produto
            </h1>

            <p className="text-gray-500 mt-2">
              Adicione um novo produto ao sistema.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid lg:grid-cols-[420px_1fr] gap-8"
          >
            <div className="bg-white rounded-3xl shadow-lg p-6 h-fit">
              <div className="flex items-center gap-3 mb-6">
                <FiImage size={22} />
                <h2 className="text-2xl font-semibold">
                  Imagem do Produto
                </h2>
              </div>

              <div
                onClick={() =>
                  inputImagemRef.current?.click()
                }
                className="border-2 border-dashed border-gray-300 rounded-3xl h-[420px] cursor-pointer hover:border-black transition overflow-hidden flex items-center justify-center bg-gray-50"
              >
                {previewImagem ? (
                  <img
                    src={previewImagem}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center px-6">
                    <FiUploadCloud
                      size={70}
                      className="mx-auto text-gray-400 mb-4"
                    />

                    <h3 className="text-xl font-semibold text-gray-700">
                      Clique para enviar imagem
                    </h3>

                    <p className="text-gray-400 mt-2">
                      PNG, JPG ou WEBP
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={inputImagemRef}
                type="file"
                hidden
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImagem}
              />
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-8">
                <FiPackage size={24} />

                <h2 className="text-3xl font-bold text-gray-800">
                  Informações do Produto
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Nome do produto
                  </label>

                  <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Digite o nome do produto"
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Preço
                  </label>

                  <input
                    type="text"
                    name="preco"
                    value={form.preco}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Promoção
                  </label>

                  <input
                    type="text"
                    name="preco_promocional"
                    value={form.preco_promocional}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Marca
                  </label>

                  <input
                    type="text"
                    name="marca"
                    value={form.marca}
                    onChange={handleChange}
                    placeholder="Marca"
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Modelo
                  </label>

                  <input
                    type="text"
                    name="modelo"
                    value={form.modelo}
                    onChange={handleChange}
                    placeholder="Modelo"
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Categoria
                  </label>

                  <select
                    name="categoria_id"
                    value={form.categoria_id}
                    onChange={handleChange}
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none focus:border-black"
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
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Status
                  </label>

                  <select
                    name="status_id"
                    value={form.status_id}
                    onChange={handleChange}
                    className="w-full h-14 px-5 rounded-2xl border border-gray-300 outline-none focus:border-black"
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

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    SKU
                  </label>

                  <div className="relative">
                    <FiTag
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="text"
                      value={form.sku}
                      disabled
                      className="w-full h-14 pl-12 pr-5 rounded-2xl border border-gray-300 bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Descrição
                  </label>

                  <textarea
                    name="descricao"
                    value={form.descricao}
                    onChange={handleChange}
                    placeholder="Descrição do produto..."
                    className="w-full min-h-[160px] p-5 rounded-2xl border border-gray-300 outline-none focus:border-black resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-10">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/Admin/produtos")
                  }
                  className="h-14 px-8 rounded-2xl border border-gray-300 font-semibold hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="h-14 px-8 rounded-2xl bg-black text-white font-semibold hover:opacity-90 transition"
                >
                  {salvando
                    ? "Salvando..."
                    : "Cadastrar Produto"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}