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
  CheckCircle,
  XCircle,
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
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);
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
      setProdutos((prev) => prev.filter((item) => item.id_produto !== id));
    } catch {
      alert("Erro ao excluir produto.");
    }
  }

  async function atualizarEstoqueProduto(
    produto: Produto,
    quantidade: number
  ) {
    try {
      setAtualizandoId(produto.id_produto);

      await api.put(`/painel/produto/${produto.id_produto}/estoque`, {
        quantidade,
        reservado: 0,
      });

      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      alert("Erro ao atualizar estoque.");
    } finally {
      setAtualizandoId(null);
    }
  }

  async function colocarComoEsgotado(produto: Produto) {
    if (!confirm(`Deseja deixar "${produto.nome}" como ESGOTADO?`)) return;

    await atualizarEstoqueProduto(produto, 0);
  }

  async function retirarDoEsgotado(produto: Produto) {
    const valor = prompt(
      `Informe a quantidade em estoque para "${produto.nome}":`,
      "1"
    );

    if (valor === null) return;

    const quantidade = Number(valor);

    if (!Number.isFinite(quantidade) || quantidade < 1) {
      alert("Informe uma quantidade válida maior que zero.");
      return;
    }

    await atualizarEstoqueProduto(produto, quantidade);
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
          <p>Escolha quais produtos têm estoque ou ficam esgotados</p>
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
          const descricao = produto.descricao || "Sem descrição disponível";

          const imgPath = produto.imagem || produto.miniatura || "";

          const imagem = imgPath
            ? `${api.defaults.baseURL}/${imgPath}`
            : "/placeholder.png";

          const quantidadeAtual = Number(produto.quantidade || 0);
          const reservadoAtual = Number(produto.reservado || 0);

          const disponivel = Number(
            produto.disponivel ?? quantidadeAtual - reservadoAtual
          );

          const esgotado = disponivel <= 0;
          const atualizando = atualizandoId === produto.id_produto;

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

                {esgotado ? (
                  <span className={styles.soldOutBadge}>ESGOTADO</span>
                ) : (
                  <span className={styles.stockBadge}>COM ESTOQUE</span>
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

                <div className={styles.stockActions}>
                  {esgotado ? (
                    <button
                      type="button"
                      className={styles.restoreButton}
                      onClick={() => retirarDoEsgotado(produto)}
                      disabled={atualizando}
                    >
                      <CheckCircle size={16} />
                      Tirar do esgotado
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.soldOutButton}
                      onClick={() => colocarComoEsgotado(produto)}
                      disabled={atualizando}
                    >
                      <XCircle size={16} />
                      Marcar esgotado
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.changeStockButton}
                    onClick={() => retirarDoEsgotado(produto)}
                    disabled={atualizando}
                  >
                    <RotateCcw size={16} />
                    Alterar estoque
                  </button>
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