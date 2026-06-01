"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import styles from "./Categorias.module.css";

import {
  FolderOpen,
  Tag,
  Search,
  Plus,
  Boxes,
  RefreshCcw,
  ArrowRight,
  AlertCircle,
  Trash2,
  Pencil,
  X,
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

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState("6");
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<CategoriaForm>(formInicial);

  useEffect(() => {
    carregarCategorias();
  }, []);

  async function carregarCategorias() {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get("/painel/categorias");

      const lista =
        response.data?.dados?.dados ||
        response.data?.dados ||
        response.data ||
        [];

      setCategorias(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error(error);
      setCategorias([]);
      setErro("Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  }

  function abrirModal() {
    setForm(formInicial);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setForm(formInicial);
  }

  function atualizarCampo(
    campo: keyof CategoriaForm,
    valor: string
  ) {
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

  async function salvarCategoria(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome da categoria.");
      return;
    }

    if (!form.slug.trim()) {
      alert("Informe o slug da categoria.");
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
        status_id: form.status_id ? Number(form.status_id) : null,
        site_config_id: form.site_config_id
          ? Number(form.site_config_id)
          : null,
      };

      await api.post("/painel/categorias", payload);

      await carregarCategorias();
      setModalAberto(false);
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
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta categoria?"
    );

    if (!confirmar) return;

    try {
      await api.delete(`/painel/categoria/${id}`);

      setCategorias((prev) =>
        prev.filter((item) => item.id_categoria !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir categoria.");
    }
  }

  const categoriasFiltradas = useMemo(() => {
    const filtro = busca.toLowerCase().trim();

    if (!filtro) return categorias;

    return categorias.filter((categoria) => {
      return (
        (categoria.nome ?? "").toLowerCase().includes(filtro) ||
        (categoria.slug ?? "").toLowerCase().includes(filtro) ||
        (categoria.descricao ?? "").toLowerCase().includes(filtro)
      );
    });
  }, [categorias, busca]);

  const categoriasExibidas =
    limite === "todos"
      ? categoriasFiltradas
      : categoriasFiltradas.slice(0, Number(limite));

  if (loading) {
    return <div className={styles.loading}>Carregando categorias...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div className={styles.badge}>
            <Tag size={15} />
            Gerenciamento
          </div>

          <h1>Sistema de Categorias</h1>
          <p>Controle todas as categorias cadastradas</p>
        </div>

        <div className={styles.headerActions}>
          <button onClick={carregarCategorias} className={styles.refreshButton}>
            <RefreshCcw size={18} />
            Atualizar
          </button>

          <button onClick={abrirModal} className={styles.primaryButton}>
            <Plus size={18} />
            Cadastrar
          </button>

          <div className={styles.stats}>
            <Boxes size={18} />
            {categorias.length} categorias
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />

          <input
            type="text"
            placeholder="Pesquisar categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <select
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
          className={styles.select}
        >
          <option value="6">Mostrar 6</option>
          <option value="9">Mostrar 9</option>
          <option value="12">Mostrar 12</option>
          <option value="todos">Mostrar Todos</option>
        </select>
      </div>

      {erro && (
        <div className={styles.error}>
          <AlertCircle size={42} />
          <h3>Algo deu errado</h3>
          <p>{erro}</p>
        </div>
      )}

      {!erro && categoriasExibidas.length === 0 ? (
        <div className={styles.empty}>
          <FolderOpen size={42} />
          <h3>Nenhuma categoria encontrada</h3>
          <p>Cadastre a primeira categoria.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {categoriasExibidas.map((categoria) => (
            <div key={categoria.id_categoria} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.icon}>
                  <FolderOpen size={20} />
                </div>

                <div className={styles.cardTitle}>
                  <h3>{categoria.nome}</h3>
                  <span>{categoria.slug}</span>
                </div>

                <Link
                  href={`/sistema/categorias/${categoria.id_categoria}`}
                  className={styles.arrow}
                >
                  <ArrowRight size={18} />
                </Link>
              </div>

              <p className={styles.description}>
                {categoria.descricao || "Sem descrição disponível"}
              </p>

              <div className={styles.info}>
                <span>
                  <Tag size={14} />
                  {categoria.slug}
                </span>

                <span>
                  <Boxes size={14} />
                  Ordem: {categoria.ordem ?? "-"}
                </span>
              </div>

              <div className={styles.actions}>
                <Link
                  href={`/sistema/categorias/${categoria.id_categoria}`}
                  className={styles.edit}
                >
                  <Pencil size={16} />
                  Editar
                </Link>

                <button
                  onClick={() => excluirCategoria(categoria.id_categoria)}
                  className={styles.delete}
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={abrirModal}
        className={styles.floating}
        aria-label="Cadastrar categoria"
      >
        <Plus size={28} />
      </button>

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>Nova categoria</h2>
                <p>Preencha os dados para cadastrar a categoria.</p>
              </div>

              <button
                type="button"
                className={styles.modalClose}
                onClick={fecharModal}
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarCategoria} className={styles.form}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Nome *</span>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) =>
                      atualizarCampo("nome", e.target.value)
                    }
                    placeholder="Ex: Moda Feminina"
                  />
                </label>

                <label className={styles.field}>
                  <span>Slug *</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      atualizarCampo("slug", e.target.value)
                    }
                    placeholder="Ex: moda-feminina"
                  />
                </label>

                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span>Descrição</span>
                  <textarea
                    value={form.descricao}
                    onChange={(e) =>
                      atualizarCampo("descricao", e.target.value)
                    }
                    placeholder="Descreva a categoria"
                    rows={4}
                  />
                </label>

                <label className={styles.field}>
                  <span>Ícone</span>
                  <input
                    type="text"
                    value={form.icone}
                    onChange={(e) =>
                      atualizarCampo("icone", e.target.value)
                    }
                    placeholder="Ex: folder-open"
                  />
                </label>

                <label className={styles.field}>
                  <span>Imagem</span>
                  <input
                    type="text"
                    value={form.imagem}
                    onChange={(e) =>
                      atualizarCampo("imagem", e.target.value)
                    }
                    placeholder="URL da imagem"
                  />
                </label>

                <label className={styles.field}>
                  <span>Ordem</span>
                  <input
                    type="number"
                    value={form.ordem}
                    onChange={(e) =>
                      atualizarCampo("ordem", e.target.value)
                    }
                    placeholder="Ex: 1"
                  />
                </label>

                <label className={styles.field}>
                  <span>Status ID</span>
                  <input
                    type="number"
                    value={form.status_id}
                    onChange={(e) =>
                      atualizarCampo("status_id", e.target.value)
                    }
                    placeholder="Ex: 1"
                  />
                </label>

                <label className={styles.field}>
                  <span>Site Config ID</span>
                  <input
                    type="number"
                    value={form.site_config_id}
                    onChange={(e) =>
                      atualizarCampo("site_config_id", e.target.value)
                    }
                    placeholder="Ex: 1"
                  />
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={fecharModal}
                  className={styles.secondaryButton}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}