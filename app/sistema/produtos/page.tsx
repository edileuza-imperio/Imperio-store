"use client";

import api from "@/Api/conectar";
import styles from "./Produtos.module.css";
import Link from "next/link";
import Image from "next/image";

import {
  Package,
  Tag,
  Pencil,
  Trash2,
  Search,
  Plus,
  Boxes,
  RotateCcw,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string;
  imagem?: string;
  miniatura?: string;
  preco: string;
  sku: string;
  marca: string;
  quantidade?: number;
  reservado?: number;
  disponivel?: number;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [zerando, setZerando] = useState(false);
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState("6");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      setLoading(true);

      const response = await api.get("/painel/produtos");
      const lista = response.data?.dados?.dados || response.data?.dados || [];

      setProdutos(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  async function excluirProduto(id: number) {
    if (!confirm("Deseja excluir este produto?")) return;

    try {
      await api.delete(`/painel/produto/${id}`);

      setProdutos((prev) =>
        prev.filter((item) => item.id_produto !== id)
      );
    } catch {
      alert("Erro ao excluir produto.");
    }
  }

  async function zerarEstoque() {
    const confirmar = confirm(
      "Tem certeza que deseja zerar o estoque de TODOS os produtos?\n\nOs produtos não serão apagados, apenas ficarão com estoque 0."
    );

    if (!confirmar) return;

    try {
      setZerando(true);

      await api.put("/painel/produtos/zerar-estoque");

      alert("Estoque zerado com sucesso.");

      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao zerar estoque:", error);
      alert("Erro ao zerar estoque.");
    } finally {
      setZerando(false);
    }
  }

  const produtosFiltrados = useMemo(() => {
    const filtro = busca.toLowerCase();

    return produtos.filter((p) => {
      return (
        (p.nome || "").toLowerCase().includes(filtro) ||
        (p.marca || "").toLowerCase().includes(filtro) ||
        (p.sku || "").toLowerCase().includes(filtro)
      );
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
      <div className={styles.header}>
        <div>
          <h1>Sistema de Produtos</h1>
          <p>Controle todos os produtos cadastrados</p>
        </div>

        <div className={styles.stats}>
          <Boxes size={20} />
          <span>{produtos.length} produtos</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            placeholder="Pesquisar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <select value={limite} onChange={(e) => setLimite(e.target.value)}>
          <option value="6">Mostrar 6</option>
          <option value="9">Mostrar 9</option>
          <option value="12">Mostrar 12</option>
          <option value="todos">Mostrar todos</option>
        </select>
      </div>

      <div className={styles.grid}>
        {produtosExibidos.map((produto) => {
          const descricao =
            produto.descricao || "Sem descrição disponível";

          const imgPath =
            produto.imagem || produto.miniatura || "";

          const imagem = imgPath
            ? `${api.defaults.baseURL}/${imgPath}`
            : "/placeholder.png";

          const disponivel = Number(
            produto.disponivel ??
              Number(produto.quantidade || 0) -
                Number(produto.reservado || 0)
          );

          const esgotado = disponivel <= 0;

          return (
            <article key={produto.id_produto} className={styles.card}>
              <div className={styles.imageWrap}>
                <Image
                  src={imagem}
                  alt={produto.nome}
                  fill
                  className={styles.image}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />

                <span className={styles.price}>
                  R$ {Number(produto.preco || 0).toFixed(2)}
                </span>

                {esgotado && (
                  <span className={styles.soldOutBadge}>
                    ESGOTADO
                  </span>
                )}
              </div>

              <div className={styles.content}>
                <h3>{produto.nome}</h3>

                <p>
                  {descricao.length > 160
                    ? descricao.substring(0, 160) + "..."
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

                  <span>
                    <Boxes size={14} />
                    Estoque: {Math.max(disponivel, 0)}
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

      <button
        type="button"
        className={styles.floatingZeroButton}
        onClick={zerarEstoque}
        disabled={zerando}
        aria-label="Zerar estoque"
        title="Zerar estoque"
      >
        <RotateCcw size={28} />
      </button>

      <Link
        href="/painel/sistema/produtos/cadastrar"
        className={styles.floatingButton}
        aria-label="Adicionar produto"
        title="Adicionar produto"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}