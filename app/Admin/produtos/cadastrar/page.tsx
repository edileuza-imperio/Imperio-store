"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
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
  const data = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, "0")}${String(
    agora.getDate()
  ).padStart(2, "0")}`;
  const hora = `${String(agora.getHours()).padStart(2, "0")}${String(agora.getMinutes()).padStart(
    "0"
  )}`;

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
        const lista = extrairListaStatus(response?.data);

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
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

  function handleImagem(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!tiposPermitidos.includes(file.type)) {
      toast.error("Envie uma imagem PNG, JPG, JPEG ou WEBP.");
      e.target.value = "";
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

    if (!arquivoImagem) {
      toast.error("Envie uma imagem do produto.");
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

      if (arquivoImagem) {
        formData.append("imagem", arquivoImagem, arquivoImagem.name);
      }

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
        toast.success(data?.mensagem || data?.dados?.mensagem || "Produto cadastrado com sucesso!");
        setTimeout(() => {
          router.push("/Admin/produtos");
        }, 1500);
        return;
      }

      toast.error(data?.mensagem || data?.dados?.mensagem || "Não foi possível cadastrar o produto.");
    } catch (error: any) {
      console.error(error);

      const mensagemErro =
        error?.response?.data?.dados?.mensagem ||
        error?.response?.data?.mensagem ||
        "Erro ao conectar com a API ao cadastrar o produto.";

      toast.error(mensagemErro);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome do produto</label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Ex: Arranjo Luxo Casamento"
          />
        </div>

        <div>
          <label>Slug</label>
          <input
            type="text"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="arranjo-luxo-casamento"
          />
        </div>

        <div>
          <label>Descrição</label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descreva o produto"
          />
        </div>

        <div>
          <label>Preço</label>
          <input
            type="text"
            name="preco"
            value={form.preco}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>

        <div>
          <label>Preço promocional</label>
          <input
            type="text"
            name="preco_promocional"
            value={form.preco_promocional}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>

        <div>
          <label>SKU automático</label>
          <input type="text" name="sku" value={form.sku} readOnly disabled />
        </div>

        <div>
          <label>Modelo</label>
          <input
            type="text"
            name="modelo"
            value={form.modelo}
            onChange={handleChange}
            placeholder="Linha Premium"
          />
        </div>

        <div>
          <label>Marca</label>
          <input
            type="text"
            name="marca"
            value={form.marca}
            onChange={handleChange}
            placeholder="Universo Império"
          />
        </div>

        <div>
          <label>Categoria</label>
          <select
            name="categoria_id"
            value={form.categoria_id}
            onChange={handleChange}
            disabled={carregandoCategorias}
          >
            <option value="">
              {carregandoCategorias ? "Carregando categorias..." : "Selecione uma categoria"}
            </option>

            {categorias.map((categoria) => (
              <option key={String(categoria.id_categoria)} value={String(categoria.id_categoria)}>
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

        <div>
          <label>Imagem</label>
          <input
            ref={inputImagemRef}
            type="file"
            name="imagem"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleImagem}
          />
        </div>

        {previewImagem && (
          <div>
            <img src={previewImagem} alt="Prévia do produto" width={200} />
          </div>
        )}

        <div>
          <button type="button" onClick={() => router.push("/Admin/produtos")}>
            Voltar
          </button>

          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando produto..." : "Cadastrar produto"}
          </button>
        </div>
      </form>
    </>
  );
}