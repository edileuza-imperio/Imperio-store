"use client";

import api from "@/Api/conectar";
import styles from "./Produtos.module.css";

import Link from "next/link";

import {
  Package,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Search,
  Boxes,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string;
  imagem?: string;
  preco: string;
  sku: string;
  marca: string;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState("3");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      const response = await api.get("/painel/produtos");

      const lista =
        response.data?.dados || response.data || [];

      setProdutos(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  async function excluirProduto(id: number) {
    const confirmar = window.confirm("Deseja excluir este produto?");
    if (!confirmar) return;

    try {
      await api.delete(`/painel/produto/${id}`);

      setProdutos((prev) =>
        prev.filter((item) => item.id_produto !== id)
      );
    } catch {
      alert("Erro ao excluir produto.");
    }
  }

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const nome = produto.nome?.toLowerCase() || "";
      const marca = produto.marca?.toLowerCase() || "";
      const buscaLower = busca.toLowerCase();

      return nome.includes(buscaLower) || marca.includes(buscaLower);
    });
  }, [produtos, busca]);

  const produtosExibidos =
    limite === "todos"
      ? produtosFiltrados
      : produtosFiltrados.slice(0, Number(limite));

  if (loading) {
    return <div className={styles.loading}>Carregando produtos...</div>;
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Gestão de Produtos</h1>
          <p>Controle todos os produtos cadastrados</p>
        </div>

        <div className={styles.stats}>
          <Boxes size={20} />
          <span>{produtos.length} produtos</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Pesquisar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <select value={limite} onChange={(e) => setLimite(e.target.value)}>
          <option value="3">Mostrar 3</option>
          <option value="6">Mostrar 6</option>
          <option value="9">Mostrar 9</option>
          <option value="12">Mostrar 12</option>
          <option value="todos">Mostrar todos</option>
        </select>
      </div>

      {/* GRID */}
      <div className={styles.grid}>
        {produtosExibidos.map((produto) => {
          const descricao = produto.descricao || "Sem descrição";
          const imagem = produto.imagem
            ? `${api.defaults.baseURL}/${produto.imagem}`
            : "/placeholder.png";

          return (
            <article key={produto.id_produto} className={styles.card}>
              <div className={styles.imageWrap}>
                <img
                  src={imagem}
                  alt={produto.nome}
                  className={styles.image}
                />

                <span className={styles.price}>
                  R$ {Number(produto.preco || 0).toFixed(2)}
                </span>
              </div>

              <div className={styles.content}>
                <h3>{produto.nome}</h3>

                <p>
                  {descricao.length > 200
                    ? `${descricao.substring(0, 200)}...`
                    : descricao}
                </p>

                <div className={styles.info}>
                  <span>
                    <Tag size={14} />
                    {produto.marca || "Sem marca"}
                  </span>

                  <span>
                    <Package size={14} />
                    {produto.sku || "Sem SKU"}
                  </span>
                </div>

                <div className={styles.actions}>
                  <Link
                    href={`/painel/sistema/produtos/editar/${produto.id_produto}`}
                    className={styles.editButton}
                  >
                    <Pencil size={16} />
                    Editar
                  </Link>

                  <button
                    className={styles.deleteButton}
                    onClick={() => excluirProduto(produto.id_produto)}
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* BOTÃO FLUTUANTE REMOVIDO (SE QUISER POSSO TIRAR TBM) */}
      <Link
        href="/painel/sistema/produtos/cadastrar"
        className={styles.floatingButton}
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}