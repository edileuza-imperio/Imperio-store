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
} from "lucide-react";

type Categoria = {
  id_categoria: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  icone?: string | null;
  imagem?: string | null;
  ordem?: number;
  status_id?: number;
  site_config_id?: number;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState("6");
  const [erro, setErro] = useState<string | null>(null);

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
        categoria.nome?.toLowerCase().includes(filtro) ||
        categoria.slug?.toLowerCase().includes(filtro) ||
        categoria.descricao?.toLowerCase().includes(filtro)
      );
    });
  }, [categorias, busca]);

  const categoriasExibidas =
    limite === "todos"
      ? categoriasFiltradas
      : categoriasFiltradas.slice(0, Number(limite));

  if (loading) {
    return (
      <div className={styles.loading}>
        Carregando categorias...
      </div>
    );
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
          <button
            onClick={carregarCategorias}
            className={styles.refreshButton}
          >
            <RefreshCcw size={18} />
            Atualizar
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
            <div
              key={categoria.id_categoria}
              className={styles.card}
            >
              <div className={styles.cardHeader}>
                <div className={styles.icon}>
                  <FolderOpen size={20} />
                </div>

                <div>
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
                {categoria.descricao ||
                  "Sem descrição disponível"}
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
                  onClick={() =>
                    excluirCategoria(categoria.id_categoria)
                  }
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

      <Link
        href="/sistema/categorias/cadastrar"
        className={styles.floating}
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}