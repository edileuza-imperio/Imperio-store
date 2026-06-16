"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import "../../../components/styles/sistema/categoria.css";

import {
  FolderOpen,
  Tag,
  Plus,
  Boxes,
  AlertCircle,
  Trash2,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  Settings2,
  Sparkles,
} from "lucide-react";

type Categoria = {
  id_categoria: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  icone?: string | null;
  imagem?: string | null;
  ordem?: number | null;
  status_id?: number | null;
  site_config_id?: number | null;
};

type StatusItem = {
  id_status?: number;
  status_id?: number;
  id?: number;
  nome?: string;
  codigo?: string;
  descricao?: string | null;
};

type CategoriaForm = {
  nome: string;
  slug: string;
  descricao: string;
  icone: string;
  imagem: string;
  ordem: string;
  status_id: string;
  site_config_id: string;
};

const formInicial: CategoriaForm = {
  nome: "",
  slug: "",
  descricao: "",
  icone: "",
  imagem: "",
  ordem: "",
  status_id: "",
  site_config_id: "",
};

const LIMITE_POR_PAGINA = 3;

function slugify(valor: string) {
  return valor
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extrairListaAPI<T = unknown>(response: any): T[] {
  return response?.data?.dados?.dados ?? response?.data?.dados ?? response?.data ?? [];
}

function getStatusId(item: StatusItem) {
  return item.id_status ?? item.status_id ?? item.id ?? 0;
}

function getStatusLabel(item: StatusItem) {
  return item.nome || item.codigo || item.descricao || `Status ${getStatusId(item)}`;
}

export default function CategoriasPage() {
  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState<string | null>(null);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState<number | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [passoModal, setPassoModal] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<CategoriaForm>(formInicial);
  const [mounted, setMounted] = useState(false);

  const totalPaginas = Math.max(1, Math.ceil(categorias.length / LIMITE_POR_PAGINA));

  const categoriasExibidas = useMemo(() => {
    const inicio = (pagina - 1) * LIMITE_POR_PAGINA;
    const fim = inicio + LIMITE_POR_PAGINA;

    return categorias.slice(inicio, fim);
  }, [categorias, pagina]);

  const statusSelecionado =
    statusDisponiveis.find((item) => String(getStatusId(item)) === form.status_id) || null;

  useEffect(() => {
    setMounted(true);
    carregarCategorias();
    carregarStatus();
  }, []);

  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  async function carregarCategorias() {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get("/painel/categorias");
      const lista = extrairListaAPI<Categoria>(response);

      setCategorias(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error(error);
      setCategorias([]);
      setErro("Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarStatus() {
    try {
      setLoadingStatus(true);

      const response = await api.get("/painel/status");
      const lista = extrairListaAPI<StatusItem>(response);

      setStatusDisponiveis(Array.isArray(lista) ? lista : []);

      setForm((prev) => {
        if (prev.status_id) return prev;

        const primeiroStatus = Array.isArray(lista) && lista.length > 0 ? lista[0] : null;

        return {
          ...prev,
          status_id: primeiroStatus ? String(getStatusId(primeiroStatus)) : "",
        };
      });
    } catch (error) {
      console.error(error);
      setStatusDisponiveis([]);
    } finally {
      setLoadingStatus(false);
    }
  }

  function abrirModal() {
    const primeiroStatus = statusDisponiveis[0];

    setForm({
      ...formInicial,
      status_id: primeiroStatus ? String(getStatusId(primeiroStatus)) : "",
    });

    setPassoModal(1);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setPassoModal(1);
    setForm(formInicial);
  }

  function selecionarCategoria(id: number) {
    setCategoriaSelecionada((atual) => (atual === id ? null : id));
  }

  function editarSelecionada() {
    if (!categoriaSelecionada) {
      alert("Selecione uma categoria para editar.");
      return;
    }

    router.push(`/sistema/categorias/${categoriaSelecionada}`);
  }

  async function excluirSelecionada() {
    if (!categoriaSelecionada) {
      alert("Selecione uma categoria para excluir.");
      return;
    }

    await excluirCategoria(categoriaSelecionada);
    setCategoriaSelecionada(null);
  }

  function paginaAnterior() {
    setPagina((atual) => Math.max(1, atual - 1));
  }

  function proximaPagina() {
    setPagina((atual) => Math.min(totalPaginas, atual + 1));
  }

  function ultimaPagina() {
    setPagina(totalPaginas);
  }

  function atualizarCampo(campo: keyof CategoriaForm, valor: string) {
    setForm((prev) => {
      if (campo === "nome") {
        return {
          ...prev,
          nome: valor,
          slug: prev.slug.trim() ? prev.slug : slugify(valor),
        };
      }

      if (campo === "slug") {
        return {
          ...prev,
          slug: slugify(valor),
        };
      }

      return {
        ...prev,
        [campo]: valor,
      };
    });
  }

  function proximoPasso() {
    if (passoModal < 3) {
      setPassoModal((prev) => (prev + 1) as 1 | 2 | 3);
    }
  }

  function passoAnterior() {
    if (passoModal > 1) {
      setPassoModal((prev) => (prev - 1) as 1 | 2 | 3);
    }
  }

  async function salvarCategoria(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.nome.trim()) {
      setPassoModal(1);
      alert("Informe o nome da categoria.");
      return;
    }

    if (!form.slug.trim()) {
      setPassoModal(1);
      alert("Informe o slug da categoria.");
      return;
    }

    if (!form.status_id.trim()) {
      setPassoModal(3);
      alert("Selecione um status.");
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const payload = {
        nome: form.nome.trim(),
        slug: form.slug.trim(),
        descricao: form.descricao.trim() || null,
        icone: form.icone.trim() || null,
        imagem: form.imagem.trim() || null,
        ordem: form.ordem ? Number(form.ordem) : null,
        status_id: Number(form.status_id),
        site_config_id: form.site_config_id ? Number(form.site_config_id) : null,
      };

      await api.post("/painel/categoria", payload);
      await carregarCategorias();

      setPagina(1);
      setModalAberto(false);
      setPassoModal(1);
      setForm(formInicial);

      alert("Categoria cadastrada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar categoria.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirCategoria(id: number) {
    const confirmar = window.confirm("Tem certeza que deseja excluir esta categoria?");

    if (!confirmar) return;

    try {
      await api.delete(`/painel/categoria/${id}`);

      setCategorias((prev) => prev.filter((item) => item.id_categoria !== id));
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir categoria.");
    }
  }

  const modal =
    mounted && modalAberto
      ? createPortal(
          <div className="categorias-modal-overlay" onClick={fecharModal}>
            <div className="categorias-modal" onClick={(e) => e.stopPropagation()}>
              <div className="categorias-modal-header">
                <div>
                  <h2>Nova categoria</h2>
                  <p>Cadastro em 3 etapas para ficar mais organizado.</p>
                </div>

                <button
                  type="button"
                  className="categorias-modal-close"
                  onClick={fecharModal}
                  aria-label="Fechar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="categorias-stepper">
                <div className={`categorias-step-item ${passoModal >= 1 ? "categorias-step-active" : ""}`}>
                  <FileText size={16} />
                  <span>Dados</span>
                </div>

                <div className={`categorias-step-item ${passoModal >= 2 ? "categorias-step-active" : ""}`}>
                  <Sparkles size={16} />
                  <span>Visual</span>
                </div>

                <div className={`categorias-step-item ${passoModal >= 3 ? "categorias-step-active" : ""}`}>
                  <Settings2 size={16} />
                  <span>Status</span>
                </div>
              </div>

              <form onSubmit={salvarCategoria} className="categorias-form">
                {passoModal === 1 && (
                  <div className="categorias-step-content">
                    <div className="categorias-section-title">
                      <h3>Informações principais</h3>
                      <p>Comece com o nome, slug e descrição.</p>
                    </div>

                    <div className="categorias-form-grid">
                      <label className="categorias-field">
                        <span>Nome *</span>
                        <input
                          type="text"
                          value={form.nome}
                          onChange={(e) => atualizarCampo("nome", e.target.value)}
                          placeholder="Ex: Moda Feminina"
                        />
                      </label>

                      <label className="categorias-field">
                        <span>Slug *</span>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => atualizarCampo("slug", e.target.value)}
                          placeholder="Ex: moda-feminina"
                        />
                      </label>

                      <label className="categorias-field categorias-field-full">
                        <span>Descrição</span>
                        <textarea
                          value={form.descricao}
                          onChange={(e) => atualizarCampo("descricao", e.target.value)}
                          placeholder="Descreva a categoria"
                          rows={4}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {passoModal === 2 && (
                  <div className="categorias-step-content">
                    <div className="categorias-section-title">
                      <h3>Visual e organização</h3>
                      <p>Opcional: ícone, imagem e ordem de exibição.</p>
                    </div>

                    <div className="categorias-form-grid">
                      <label className="categorias-field">
                        <span>Ícone</span>
                        <input
                          type="text"
                          value={form.icone}
                          onChange={(e) => atualizarCampo("icone", e.target.value)}
                          placeholder="Ex: folder-open"
                        />
                      </label>

                      <label className="categorias-field">
                        <span>Imagem</span>
                        <input
                          type="text"
                          value={form.imagem}
                          onChange={(e) => atualizarCampo("imagem", e.target.value)}
                          placeholder="URL da imagem"
                        />
                      </label>

                      <label className="categorias-field">
                        <span>Ordem</span>
                        <input
                          type="number"
                          value={form.ordem}
                          onChange={(e) => atualizarCampo("ordem", e.target.value)}
                          placeholder="Ex: 1"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {passoModal === 3 && (
                  <div className="categorias-step-content">
                    <div className="categorias-section-title">
                      <h3>Status e revisão final</h3>
                      <p>Escolha o status correto antes de salvar.</p>
                    </div>

                    <div className="categorias-form-grid">
                      <label className="categorias-field">
                        <span>Status *</span>
                        <select
                          value={form.status_id}
                          onChange={(e) => atualizarCampo("status_id", e.target.value)}
                          disabled={loadingStatus}
                        >
                          <option value="">
                            {loadingStatus ? "Carregando status..." : "Selecione um status"}
                          </option>

                          {statusDisponiveis.map((item) => {
                            const id = getStatusId(item);

                            return (
                              <option key={id} value={String(id)}>
                                {getStatusLabel(item)}
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      <label className="categorias-field">
                        <span>Site Config ID</span>
                        <input
                          type="number"
                          value={form.site_config_id}
                          onChange={(e) => atualizarCampo("site_config_id", e.target.value)}
                          placeholder="Ex: 1"
                        />
                      </label>
                    </div>

                    <div className="categorias-resume-box">
                      <h4>Resumo</h4>
                      <p>
                        <strong>Nome:</strong> {form.nome || "-"}
                      </p>
                      <p>
                        <strong>Slug:</strong> {form.slug || "-"}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {statusSelecionado ? getStatusLabel(statusSelecionado) : "-"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="categorias-modal-actions">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="categorias-secondary-button"
                    disabled={salvando}
                  >
                    Cancelar
                  </button>

                  <div className="categorias-nav-buttons">
                    {passoModal > 1 && (
                      <button
                        type="button"
                        onClick={passoAnterior}
                        className="categorias-back-button"
                        disabled={salvando}
                      >
                        <ChevronLeft size={16} />
                        Voltar
                      </button>
                    )}

                    {passoModal < 3 ? (
                      <button
                        type="button"
                        onClick={proximoPasso}
                        className="categorias-next-button"
                        disabled={salvando}
                      >
                        Próximo
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="categorias-submit-button"
                        disabled={salvando}
                      >
                        <CheckCircle2 size={16} />
                        {salvando ? "Salvando..." : "Salvar categoria"}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null;

  if (loading) {
    return <div className="categorias-loading">Carregando categorias...</div>;
  }

  return (
    <div className="categorias-container">
      <div className="categorias-header">
        <div>
          <div className="categorias-badge">
            <Tag size={15} />
            Gerenciamento
          </div>

          <h1>Sistema de Categorias</h1>
          <p>Selecione uma categoria para editar ou excluir.</p>
        </div>
      </div>

      <div className="categorias-toolbar categorias-pagination">
        <button
          type="button"
          onClick={paginaAnterior}
          disabled={pagina === 1}
          className="categorias-page-button"
        >
          Anterior
        </button>

        <span className="categorias-page-info">
          Página {pagina} de {totalPaginas} · 3 categorias
        </span>

        <button
          type="button"
          onClick={proximaPagina}
          disabled={pagina === totalPaginas}
          className="categorias-page-button"
        >
          Próximo
        </button>

        <button
          type="button"
          onClick={ultimaPagina}
          disabled={pagina === totalPaginas}
          className="categorias-page-button"
        >
          Máximo
        </button>
      </div>

      {categoriaSelecionada && (
        <div className="categorias-selected-alert">
          <CheckCircle2 size={18} />
          Categoria selecionada para ação.
        </div>
      )}

      {erro && (
        <div className="categorias-error">
          <AlertCircle size={42} />
          <h3>Algo deu errado</h3>
          <p>{erro}</p>
        </div>
      )}

      {!erro && categoriasExibidas.length === 0 ? (
        <div className="categorias-empty">
          <FolderOpen size={42} />
          <h3>Nenhuma categoria encontrada</h3>
          <p>Cadastre a primeira categoria.</p>
        </div>
      ) : (
        <div className="categorias-grid">
          {categoriasExibidas.map((categoria) => {
            const selecionada = categoriaSelecionada === categoria.id_categoria;

            return (
              <div
                key={categoria.id_categoria}
                className={`categorias-card ${selecionada ? "categorias-card-selected" : ""}`}
                onClick={() => selecionarCategoria(categoria.id_categoria)}
              >
                <label className="categorias-checkbox" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selecionada}
                    onChange={() => selecionarCategoria(categoria.id_categoria)}
                  />
                  <span></span>
                </label>

                <div className="categorias-card-header">
                  <div className="categorias-icon">
                    <FolderOpen size={20} />
                  </div>

                  <div className="categorias-title">
                    <h3>{categoria.nome}</h3>
                    <span>{categoria.slug}</span>
                  </div>
                </div>

                <p className="categorias-description">
                  {categoria.descricao || "Sem descrição disponível"}
                </p>

                <div className="categorias-info">
                  <span>
                    <Tag size={14} />
                    {categoria.slug}
                  </span>

                  <span>
                    <Boxes size={14} />
                    Ordem: {categoria.ordem ?? "-"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="categorias-floating-group">
        <button
          type="button"
          onClick={editarSelecionada}
          className="categorias-floating categorias-floating-edit"
          aria-label="Editar categoria"
        >
          <Pencil size={22} />
        </button>

        <button
          type="button"
          onClick={excluirSelecionada}
          className="categorias-floating categorias-floating-delete"
          aria-label="Excluir categoria"
        >
          <Trash2 size={22} />
        </button>

        <button
          type="button"
          onClick={abrirModal}
          className="categorias-floating categorias-floating-add"
          aria-label="Cadastrar categoria"
        >
          <Plus size={28} />
        </button>
      </div>

      {modal}
    </div>
  );
}