"use client";

import "../../../../components/styles/sistema/cadastrar-produto.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Package,
  ImagePlus,
  Truck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  ClipboardCheck,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.universoimperio.com.br/api/v1";

interface Categoria {
  id_categoria: number;
  nome: string;
}

interface StatusItem {
  id_status: number;
  nome: string;
  codigo: string;
}

export default function CadastrarProdutoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState(1);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [imagens, setImagens] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [form, setForm] = useState({
    nome: "",
    slug: "",
    descricao: "",
    preco: "",
    quantidade: "",
    sku: "",
    marca: "",
    categoria_id: "",
    status_id: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const urls = imagens.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagens]);

  async function carregarDados() {
    try {
      const [categoriasRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/painel/categorias`, { credentials: "include" }),
        fetch(`${API_URL}/painel/status`, { credentials: "include" }),
      ]);

      const categoriasJson = await categoriasRes.json();
      const statusJson = await statusRes.json();

      const categoriasDados = Array.isArray(categoriasJson?.dados)
        ? categoriasJson.dados
        : [];

      const statusDados = Array.isArray(statusJson?.dados)
        ? statusJson.dados
        : [];

      setCategorias(categoriasDados);
      setStatusList(statusDados);

      const statusAtivo = statusDados.find(
        (item: StatusItem) => item.codigo === "ATIVO"
      );

      if (statusAtivo) {
        setForm((old) => ({
          ...old,
          status_id: String(statusAtivo.id_status),
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar categorias e status.");
    }
  }

  function gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function gerarSKU(nome: string) {
    const prefixo = nome.trim().substring(0, 3).toUpperCase().replace(/\s/g, "");
    const numero = Math.floor(100000 + Math.random() * 900000);

    return `${prefixo || "PRO"}-${numero}`;
  }

  function handleChange(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((old) => {
      const updated = { ...old, [name]: value };

      if (name === "nome") {
        updated.slug = gerarSlug(value);
        updated.sku = gerarSKU(value);
      }

      return updated;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files || []);

    if (!arquivos.length) return;

    setImagens((prev) => [...prev, ...arquivos]);
    e.target.value = "";
  }

  function removerImagem(index: number) {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  }

  function validarEtapaAtual() {
    if (etapa === 1 && imagens.length < 1) {
      alert("Envie pelo menos uma imagem.");
      return false;
    }

    if (etapa === 2) {
      if (!form.nome.trim()) {
        alert("Preencha o nome.");
        return false;
      }

      if (!form.preco || Number(String(form.preco).replace(",", ".")) <= 0) {
        alert("Preencha um preço válido.");
        return false;
      }

      if (!form.marca.trim()) {
        alert("Preencha a marca.");
        return false;
      }

      if (!form.categoria_id) {
        alert("Selecione uma categoria.");
        return false;
      }

      if (!form.status_id) {
        alert("Selecione um status.");
        return false;
      }
    }

    if (etapa === 3 && !form.descricao.trim()) {
      alert("Preencha a descrição.");
      return false;
    }

    return true;
  }

  function validarFormulario() {
    if (imagens.length < 1) {
      alert("Envie pelo menos uma imagem.");
      setEtapa(1);
      return false;
    }

    if (!form.nome.trim()) {
      alert("Preencha o nome.");
      setEtapa(2);
      return false;
    }

    if (!form.preco || Number(String(form.preco).replace(",", ".")) <= 0) {
      alert("Preencha um preço válido.");
      setEtapa(2);
      return false;
    }

    if (!form.marca.trim()) {
      alert("Preencha a marca.");
      setEtapa(2);
      return false;
    }

    if (!form.categoria_id) {
      alert("Selecione uma categoria.");
      setEtapa(2);
      return false;
    }

    if (!form.status_id) {
      alert("Selecione um status.");
      setEtapa(2);
      return false;
    }

    if (!form.descricao.trim()) {
      alert("Preencha a descrição.");
      setEtapa(3);
      return false;
    }

    return true;
  }

  async function salvar() {
    try {
      if (!validarFormulario()) return;

      setLoading(true);

      const data = new FormData();

      data.append("nome", form.nome.trim());
      data.append("slug", form.slug.trim());
      data.append("descricao", form.descricao.trim());
      data.append("preco", String(form.preco).replace(",", "."));
      data.append("quantidade", form.quantidade || "0");
      data.append("sku", form.sku.trim());
      data.append("marca", form.marca.trim());
      data.append("categoria_id", form.categoria_id);
      data.append("status_id", form.status_id);

      imagens.forEach((arquivo) => {
        data.append("imagens[]", arquivo);
      });

      const response = await fetch(`${API_URL}/painel/produto`, {
        method: "POST",
        body: data,
        credentials: "include",
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw resultado;
      }

      alert(
        resultado?.dados?.mensagem ||
          resultado?.mensagem ||
          "Produto cadastrado com sucesso!"
      );

      router.push("/sistema/produtos");
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);

      alert(
        error?.dados?.mensagem ||
          error?.mensagem ||
          "Erro ao cadastrar produto."
      );
    } finally {
      setLoading(false);
    }
  }

  function proximaEtapa() {
    if (!validarEtapaAtual()) return;

    if (etapa < 4) {
      setEtapa((atual) => atual + 1);
    }
  }

  function etapaAnterior() {
    if (etapa > 1) {
      setEtapa((atual) => atual - 1);
    }
  }

  const progresso = useMemo(() => ((etapa - 1) / 3) * 100, [etapa]);

  const tituloEtapa = useMemo(() => {
    if (etapa === 1) return "Imagens do produto";
    if (etapa === 2) return "Informações principais";
    if (etapa === 3) return "Descrição do produto";
    return "Revisão final";
  }, [etapa]);

  return (
    <main className="cad-produto">
      <header className="cad-produto-hero">
        <button
          type="button"
          className="cad-produto-voltar"
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="cad-produto-hero-texto">
          <span>
            <Sparkles size={14} />
            Novo produto
          </span>

          <h1>Cadastrar produto</h1>

          <p>Cadastre produtos com imagens, estoque, descrição e revisão.</p>
        </div>
      </header>

      <section className="cad-produto-card">
        <div className="cad-produto-topo-card">
          <div className="cad-produto-progress-area">
            <div className="cad-produto-progress-info">
              <span>Etapa {etapa} de 4</span>
              <strong>{tituloEtapa}</strong>
            </div>

            <div className="cad-produto-progress-bar">
              <div style={{ width: `${progresso}%` }} />
            </div>
          </div>

          <div className="cad-produto-actions-top">
            <button
              type="button"
              className="cad-produto-btn-secundario"
              onClick={etapaAnterior}
              disabled={etapa === 1 || loading}
            >
              <ChevronLeft size={15} />
              Anterior
            </button>

            {etapa < 4 ? (
              <button
                type="button"
                className="cad-produto-btn-primario"
                onClick={proximaEtapa}
                disabled={loading}
              >
                Próxima
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                className="cad-produto-btn-salvar"
                onClick={salvar}
                disabled={loading}
              >
                <Save size={15} />
                {loading ? "Salvando..." : "Salvar"}
              </button>
            )}
          </div>
        </div>

        <div className="cad-produto-steps">
          <button
            type="button"
            className={etapa === 1 ? "ativo" : ""}
            onClick={() => setEtapa(1)}
          >
            <ImagePlus size={15} />
            Imagens
          </button>

          <button
            type="button"
            className={etapa === 2 ? "ativo" : ""}
            onClick={() => setEtapa(2)}
          >
            <Package size={15} />
            Produto
          </button>

          <button
            type="button"
            className={etapa === 3 ? "ativo" : ""}
            onClick={() => setEtapa(3)}
          >
            <FileText size={15} />
            Descrição
          </button>

          <button
            type="button"
            className={etapa === 4 ? "ativo" : ""}
            onClick={() => setEtapa(4)}
          >
            <ClipboardCheck size={15} />
            Revisão
          </button>
        </div>

        {etapa === 1 && (
          <section className="cad-produto-etapa">
            <div className="cad-produto-etapa-header">
              <ImagePlus size={20} />
              <div>
                <h2>Imagens do produto</h2>
                <p>Envie uma ou mais imagens para exibir no catálogo.</p>
              </div>
            </div>

            <label className="cad-produto-upload">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />

              <ImagePlus size={28} />

              <strong>Clique para enviar imagens</strong>

              <span>PNG, JPG ou WEBP</span>
            </label>

            {previewUrls.length > 0 && (
              <div className="cad-produto-preview-grid">
                {previewUrls.map((url, index) => (
                  <div className="cad-produto-preview" key={url}>
                    <img src={url} alt={`Imagem ${index + 1}`} />

                    <button
                      type="button"
                      onClick={() => removerImagem(index)}
                      aria-label="Remover imagem"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {etapa === 2 && (
          <section className="cad-produto-etapa">
            <div className="cad-produto-etapa-header">
              <Package size={20} />
              <div>
                <h2>Informações principais</h2>
                <p>Preencha os dados básicos, preço, estoque e categoria.</p>
              </div>
            </div>

            <div className="cad-produto-form-grid">
              <label>
                <span>Nome do produto</span>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Ex: Camisa do Brasil Infantil"
                />
              </label>

              <label>
                <span>Slug</span>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="camisa-do-brasil-infantil"
                />
              </label>

              <label>
                <span>Preço</span>
                <input
                  type="number"
                  name="preco"
                  value={form.preco}
                  onChange={handleChange}
                  placeholder="29.90"
                  step="0.01"
                  min="0"
                />
              </label>

              <label>
                <span>Quantidade</span>
                <input
                  type="number"
                  name="quantidade"
                  value={form.quantidade}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </label>

              <label>
                <span>SKU</span>
                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="PRO-123456"
                />
              </label>

              <label>
                <span>Marca</span>
                <input
                  type="text"
                  name="marca"
                  value={form.marca}
                  onChange={handleChange}
                  placeholder="Ex: Universo Império"
                />
              </label>

              <label>
                <span>Categoria</span>
                <select
                  name="categoria_id"
                  value={form.categoria_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione uma categoria</option>

                  {categorias.map((categoria) => (
                    <option
                      key={categoria.id_categoria}
                      value={categoria.id_categoria}
                    >
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Status</span>
                <select
                  name="status_id"
                  value={form.status_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione um status</option>

                  {statusList.map((status) => (
                    <option key={status.id_status} value={status.id_status}>
                      {status.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        {etapa === 3 && (
          <section className="cad-produto-etapa">
            <div className="cad-produto-etapa-header">
              <FileText size={20} />
              <div>
                <h2>Descrição do produto</h2>
                <p>Explique detalhes, medidas, material e informações úteis.</p>
              </div>
            </div>

            <label className="cad-produto-descricao">
              <span>Descrição</span>

              <textarea
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Descreva os detalhes, características e informações importantes do produto."
                rows={7}
              />
            </label>
          </section>
        )}

        {etapa === 4 && (
          <section className="cad-produto-etapa">
            <div className="cad-produto-etapa-header">
              <ClipboardCheck size={20} />
              <div>
                <h2>Revisão final</h2>
                <p>Confira as informações antes de salvar o produto.</p>
              </div>
            </div>

            <div className="cad-produto-review">
              <div>
                <Truck size={18} />
                <span>Resumo do produto</span>
              </div>

              <ul>
                <li>
                  <strong>Produto:</strong> {form.nome || "Não informado"}
                </li>
                <li>
                  <strong>Preço:</strong>{" "}
                  {form.preco ? `R$ ${form.preco}` : "Não informado"}
                </li>
                <li>
                  <strong>Quantidade:</strong>{" "}
                  {form.quantidade || "Não informado"}
                </li>
                <li>
                  <strong>Marca:</strong> {form.marca || "Não informado"}
                </li>
                <li>
                  <strong>SKU:</strong> {form.sku || "Não informado"}
                </li>
                <li>
                  <strong>Imagens:</strong> {imagens.length}
                </li>
              </ul>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}