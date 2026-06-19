"use client";

import api from "@/Api/conectar";
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
} from "lucide-react";

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
        api.get("/painel/categorias"),
        api.get("/painel/status"),
      ]);

      const categoriasDados = Array.isArray(categoriasRes.data?.dados)
        ? categoriasRes.data.dados
        : [];

      const statusDados = Array.isArray(statusRes.data?.dados)
        ? statusRes.data.dados
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
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      console.log("Resposta:", error?.response?.data);
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
    const prefixo = nome
      .trim()
      .substring(0, 3)
      .toUpperCase()
      .replace(/\s/g, "");

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
      const updated = {
        ...old,
        [name]: value,
      };

      if (name === "nome") {
        updated.slug = gerarSlug(value);
        updated.sku = gerarSKU(value);
      }

      return updated;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files || []);

    console.log("ARQUIVOS SELECIONADOS:", arquivos);

    if (arquivos.length === 0) {
      return;
    }

    setImagens((prev) => [...prev, ...arquivos]);

    e.target.value = "";
  }

  function removerImagem(index: number) {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  }

  function proximaEtapa() {
    setEtapa((current) => Math.min(current + 1, 3));
  }

  function etapaAnterior() {
    setEtapa((current) => Math.max(current - 1, 1));
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

    if (!form.slug.trim()) {
      alert("Slug inválido.");
      setEtapa(2);
      return false;
    }

    if (!form.preco || Number(form.preco) <= 0) {
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

      console.group("ENVIANDO PRODUTO");
      for (const item of data.entries()) {
        console.log(item[0], item[1]);
      }
      console.groupEnd();

      const response = await api.post("/painel/produto", data);

      console.log("RESPOSTA API:", response.data);

      alert(
        response.data?.dados?.mensagem ||
          response.data?.mensagem ||
          "Produto cadastrado com sucesso!"
      );

      router.push("/painel/sistema/produtos");
    } catch (error: any) {
      console.error("ERRO COMPLETO:", error);
      console.log("STATUS:", error?.response?.status);
      console.log("RESPOSTA ERRO:", error?.response?.data);

      const resposta = error?.response?.data;

      const mensagem =
        resposta?.dados?.mensagem ||
        resposta?.mensagem ||
        resposta?.dados?.dados?.mensagem ||
        "Erro ao cadastrar produto.";

      alert(mensagem);
    } finally {
      setLoading(false);
    }
  }

  const progresso = useMemo(() => {
    return ((etapa - 1) / 2) * 100;
  }, [etapa]);

  return (
    <div className="cad-produto">
      <div className="cad-produto__header">
        <div className="cad-produto__header-top">
          <button
            className="cad-produto__back-button"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div className="cad-produto__title-block">
            <div className="cad-produto__badge">
              <Sparkles size={16} />
              Cadastro de produto
            </div>

            <h1>
              <Package size={28} />
              Cadastrar Produto
            </h1>

            <p>Cadastro com imagem, dados, estoque e descrição.</p>
          </div>
        </div>

        <div className="cad-produto__stepper">
          <div className="cad-produto__stepper-top">
            <span className={etapa >= 1 ? "cad-produto__step-active" : ""}>
              1
            </span>

            <div className="cad-produto__step-line" />

            <span className={etapa >= 2 ? "cad-produto__step-active" : ""}>
              2
            </span>

            <div className="cad-produto__step-line" />

            <span className={etapa >= 3 ? "cad-produto__step-active" : ""}>
              3
            </span>
          </div>

          <div className="cad-produto__progress-bar">
            <div
              className="cad-produto__progress-fill"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </div>

      <div className="cad-produto__form-card">
        {etapa === 1 && (
          <section className="cad-produto__step-card">
            <div className="cad-produto__step-header">
              <div className="cad-produto__step-icon">
                <ImagePlus size={22} />
              </div>

              <div>
                <h2>Imagens do produto</h2>
                <p>Envie uma ou mais imagens.</p>
              </div>
            </div>

            <div className="cad-produto__upload-area">
              <input
                id="imagens"
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="cad-produto__upload-input"
              />

              <label htmlFor="imagens" className="cad-produto__upload-label">
                <div className="cad-produto__upload-icon-wrap">
                  <ImagePlus size={30} />
                </div>

                <strong>Clique para enviar imagens</strong>
                <span>PNG, JPG, JPEG ou WEBP</span>
              </label>
            </div>

            {previewUrls.length > 0 && (
              <div className="cad-produto__preview-grid">
                {previewUrls.map((url, index) => (
                  <div key={url} className="cad-produto__preview-card">
                    <img src={url} alt={`Imagem ${index + 1}`} />

                    <button
                      type="button"
                      className="cad-produto__remove-image"
                      onClick={() => removerImagem(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="cad-produto__actions">
              <button
                type="button"
                className="cad-produto__primary-button"
                onClick={proximaEtapa}
              >
                Próxima etapa
                <ChevronRight size={18} />
              </button>
            </div>
          </section>
        )}

        {etapa === 2 && (
          <section className="cad-produto__step-card">
            <div className="cad-produto__step-header">
              <div className="cad-produto__step-icon">
                <Truck size={22} />
              </div>

              <div>
                <h2>Dados principais</h2>
                <p>Informações básicas do produto.</p>
              </div>
            </div>

            <div className="cad-produto__grid">
              <div className="cad-produto__field">
                <label>Nome</label>
                <input
                  type="text"
                  name="nome"
                  placeholder="Nome do produto"
                  value={form.nome}
                  onChange={handleChange}
                />
              </div>

              <div className="cad-produto__field">
                <label>Slug</label>
                <input type="text" name="slug" value={form.slug} readOnly />
              </div>

              <div className="cad-produto__field">
                <label>SKU</label>
                <input type="text" name="sku" value={form.sku} readOnly />
              </div>

              <div className="cad-produto__field">
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

              <div className="cad-produto__field">
                <label>Quantidade em estoque</label>
                <input
                  type="number"
                  min="0"
                  name="quantidade"
                  placeholder="0"
                  value={form.quantidade}
                  onChange={handleChange}
                />
              </div>

              <div className="cad-produto__field">
                <label>Marca</label>
                <input
                  type="text"
                  name="marca"
                  placeholder="Marca do produto"
                  value={form.marca}
                  onChange={handleChange}
                />
              </div>

              <div className="cad-produto__field">
                <label>Categoria</label>
                <select
                  name="categoria_id"
                  value={form.categoria_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>

                  {categorias.map((categoria) => (
                    <option
                      key={categoria.id_categoria}
                      value={categoria.id_categoria}
                    >
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cad-produto__field">
                <label>Status</label>
                <select
                  name="status_id"
                  value={form.status_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>

                  {statusList.map((status) => (
                    <option key={status.id_status} value={status.id_status}>
                      {status.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cad-produto__actions">
              <button
                type="button"
                className="cad-produto__secondary-button"
                onClick={etapaAnterior}
              >
                <ChevronLeft size={18} />
                Voltar
              </button>

              <button
                type="button"
                className="cad-produto__primary-button"
                onClick={proximaEtapa}
              >
                Próxima etapa
                <ChevronRight size={18} />
              </button>
            </div>
          </section>
        )}

        {etapa === 3 && (
          <section className="cad-produto__step-card">
            <div className="cad-produto__step-header">
              <div className="cad-produto__step-icon">
                <FileText size={22} />
              </div>

              <div>
                <h2>Descrição</h2>
                <p>Finalize o cadastro do produto.</p>
              </div>
            </div>

            <div className="cad-produto__descricao">
              <label>Descrição</label>

              <textarea
                rows={8}
                name="descricao"
                placeholder="Digite a descrição do produto..."
                value={form.descricao}
                onChange={handleChange}
              />
            </div>

            <div className="cad-produto__actions">
              <button
                type="button"
                className="cad-produto__secondary-button"
                onClick={etapaAnterior}
              >
                <ChevronLeft size={18} />
                Voltar
              </button>

              <button
                className="cad-produto__primary-button"
                onClick={salvar}
                disabled={loading}
                type="button"
              >
                <Save size={18} />
                {loading ? "Salvando..." : "Cadastrar Produto"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}