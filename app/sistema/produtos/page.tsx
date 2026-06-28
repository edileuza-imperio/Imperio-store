"use client";

import api from "@/Api/conectar";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  Package,
  Tag,
  Pencil,
  Trash2,
  Plus,
  Boxes,
  RotateCcw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "../../../components/styles/sistema/produtos.css";
import { imagemFundo } from "@/components/Bibioteca/imagem";

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

const LIMITE_POR_PAGINA = 3;

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [produtoSelecionado, setProdutoSelecionado] = useState<number | null>(null);

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

  const totalPaginas = Math.max(1, Math.ceil(produtos.length / LIMITE_POR_PAGINA));

  const produtosExibidos = useMemo(() => {
    const inicio = (paginaAtual - 1) * LIMITE_POR_PAGINA;
    const fim = inicio + LIMITE_POR_PAGINA;

    return produtos.slice(inicio, fim);
  }, [produtos, paginaAtual]);

  function selecionarProduto(id: number) {
    setProdutoSelecionado((atual) => (atual === id ? null : id));
  }

  function editarSelecionado() {
    if (!produtoSelecionado) {
      alert("Selecione um produto para editar.");
      return;
    }

    window.location.href = `/painel/sistema/produtos/editar/${produtoSelecionado}`;
  }

  async function excluirSelecionado() {
    if (!produtoSelecionado) {
      alert("Selecione um produto para excluir.");
      return;
    }

    await excluirProduto(produtoSelecionado);
    setProdutoSelecionado(null);
  }

  async function excluirProduto(id: number) {
    if (!confirm("Deseja excluir este produto?")) return;

    try {
      await api.delete(`/painel/produto/${id}`);
      setProdutos((prev) => prev.filter((item) => item.id_produto !== id));
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto.");
    }
  }

  async function atualizarEstoqueProduto(produto: Produto, quantidade: number) {
    try {
      setAtualizandoId(produto.id_produto);

      await api.put(`/painel/produto/${produto.id_produto}/estoque`, {
        quantidade,
        reservado: 0,
      });

      setProdutos((prev) =>
        prev.map((item) =>
          item.id_produto === produto.id_produto
            ? {
                ...item,
                quantidade,
                reservado: 0,
                disponivel: quantidade,
              }
            : item
        )
      );

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

  function voltarPagina() {
    setPaginaAtual((pagina) => Math.max(1, pagina - 1));
  }

  function avancarPagina() {
    setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1));
  }

  if (loading) {
    return <div className="produtos-loading">Carregando produtos...</div>;
  }

  return (
    <div className="produtos-container">
      <div className="produtos-header">
        <div>
          <h1>Sistema de Produtos</h1>
          <p>Selecione um produto para editar ou excluir</p>
        </div>

        <div className="produtos-stats">
          <Boxes size={20} />
          <span>{produtos.length} produtos</span>
        </div>
      </div>

      {produtoSelecionado && (
        <div className="produtos-selected-alert">
          <CheckCircle size={18} />
          Produto selecionado para ação.
        </div>
      )}

      <div className="produtos-grid">
        {produtosExibidos.map((produto) => {
          const descricao = produto.descricao || "Sem descrição disponível";
          const imgPath = produto.imagem || produto.miniatura || "";
          const imagem = imgPath ? imagemFundo(imgPath) : "/placeholder.png";

          const quantidadeAtual = Number(produto.quantidade || 0);
          const reservadoAtual = Number(produto.reservado || 0);

          const disponivel = Number(
            produto.disponivel ?? quantidadeAtual - reservadoAtual
          );

          const esgotado = disponivel <= 0;
          const atualizando = atualizandoId === produto.id_produto;
          const selecionado = produtoSelecionado === produto.id_produto;

          return (
            <article
              key={produto.id_produto}
              className={`produtos-card ${
                selecionado ? "produtos-card-selected" : ""
              }`}
              onClick={() => selecionarProduto(produto.id_produto)}
            >
              <label
                className="produtos-checkbox"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selecionado}
                  onChange={() => selecionarProduto(produto.id_produto)}
                />
                <span />
              </label>

              <div className="produtos-image-wrap">
                <Image
                  src={imagem}
                  alt={produto.nome}
                  fill
                  className="produtos-image"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />

                <span className="produtos-price">
                  R$ {Number(produto.preco || 0).toFixed(2)}
                </span>

                {esgotado ? (
                  <span className="produtos-sold-out-badge">ESGOTADO</span>
                ) : (
                  <span className="produtos-stock-badge">COM ESTOQUE</span>
                )}
              </div>

              <div className="produtos-content">
                <h3>{produto.nome}</h3>

                <p>
                  {descricao.length > 80
                    ? `${descricao.substring(0, 80)}...`
                    : descricao}
                </p>

                <div className="produtos-info">
                  <span>
                    <Tag size={13} />
                    {produto.marca || "Sem marca"}
                  </span>

                  <span>
                    <Package size={13} />
                    {produto.sku || "Sem SKU"}
                  </span>

                  <span>
                    <Boxes size={13} />
                    Estoque: {Math.max(disponivel, 0)}
                  </span>
                </div>

                <div className="produtos-stock-actions">
                  {esgotado ? (
                    <button
                      type="button"
                      className="produtos-restore-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        retirarDoEsgotado(produto);
                      }}
                      disabled={atualizando}
                    >
                      <CheckCircle size={15} />
                      {atualizando ? "Atualizando..." : "Ativar"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="produtos-sold-out-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        colocarComoEsgotado(produto);
                      }}
                      disabled={atualizando}
                    >
                      <XCircle size={15} />
                      {atualizando ? "Atualizando..." : "Esgotar"}
                    </button>
                  )}

                  <button
                    type="button"
                    className="produtos-change-stock-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      retirarDoEsgotado(produto);
                    }}
                    disabled={atualizando}
                  >
                    <RotateCcw size={15} />
                    Estoque
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="produtos-pagination">
        <button
          type="button"
          onClick={voltarPagina}
          disabled={paginaAtual === 1}
        >
          <ChevronLeft size={18} />
          Voltar
        </button>

        <span>
          Página {paginaAtual} de {totalPaginas}
        </span>

        <button
          type="button"
          onClick={avancarPagina}
          disabled={paginaAtual === totalPaginas}
        >
          Próxima
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="produtos-floating-group">
        <button
          type="button"
          onClick={editarSelecionado}
          className="produtos-floating produtos-floating-edit"
          aria-label="Editar produto"
        >
          <Pencil size={22} />
        </button>

        <button
          type="button"
          onClick={excluirSelecionado}
          className="produtos-floating produtos-floating-delete"
          aria-label="Excluir produto"
        >
          <Trash2 size={22} />
        </button>

        <Link
          href="/sistema/produtos/cadastrar"
          className="produtos-floating produtos-floating-add"
          aria-label="Adicionar produto"
        >
          <Plus size={28} />
        </Link>
      </div>
    </div>
  );
}