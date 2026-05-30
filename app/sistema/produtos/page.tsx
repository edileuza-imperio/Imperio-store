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

import {
  useEffect,
  useMemo,
  useState,
} from "react";

interface Produto {
  id_produto: number;
  nome: string;
  descricao: string;
  imagem: string;
  preco: string;
  sku: string;
  marca: string;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busca, setBusca] =
    useState("");

  const [limite, setLimite] =
    useState("3");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      const response =
        await api.get("/painel/produtos");

      setProdutos(
        response.data?.dados?.dados || []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function excluirProduto(
    id: number
  ) {
    const confirmar =
      window.confirm(
        "Deseja excluir este produto?"
      );

    if (!confirmar) return;

    try {
      await api.delete(
        `/painel/produto/${id}`
      );

      setProdutos((prev) =>
        prev.filter(
          (item) =>
            item.id_produto !== id
        )
      );
    } catch {
      alert(
        "Erro ao excluir produto."
      );
    }
  }

  const produtosFiltrados =
    useMemo(() => {
      return produtos.filter(
        (produto) =>
          produto.nome
            .toLowerCase()
            .includes(
              busca.toLowerCase()
            ) ||
          produto.marca
            .toLowerCase()
            .includes(
              busca.toLowerCase()
            )
      );
    }, [produtos, busca]);

  const produtosExibidos =
    limite === "todos"
      ? produtosFiltrados
      : produtosFiltrados.slice(
          0,
          Number(limite)
        );

  if (loading) {
    return (
      <div className={styles.loading}>
        Carregando produtos...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>
            Gestão de Produtos
          </h1>

          <p>
            Controle todos os
            produtos cadastrados
          </p>
        </div>

        <div className={styles.stats}>
          <Boxes size={20} />
          <span>
            {
              produtos.length
            }{" "}
            produtos
          </span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div
          className={
            styles.searchBox
          }
        >
          <Search size={18} />

          <input
            type="text"
            placeholder="Pesquisar produto..."
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
          />
        </div>

        <select
          value={limite}
          onChange={(e) =>
            setLimite(
              e.target.value
            )
          }
        >
          <option value="3">
            Mostrar 3
          </option>

          <option value="6">
            Mostrar 6
          </option>

          <option value="9">
            Mostrar 9
          </option>

          <option value="12">
            Mostrar 12
          </option>

          <option value="todos">
            Mostrar todos
          </option>
        </select>
      </div>

      <div className={styles.grid}>
        {produtosExibidos.map(
          (produto) => (
            <article
              key={
                produto.id_produto
              }
              className={
                styles.card
              }
            >
              <div
                className={
                  styles.imageWrap
                }
              >
                <img
                  src={`${api.defaults.baseURL}/${produto.imagem}`}
                  alt={
                    produto.nome
                  }
                  className={
                    styles.image
                  }
                />

                <span
                  className={
                    styles.price
                  }
                >
                  R${" "}
                  {Number(
                    produto.preco
                  ).toFixed(2)}
                </span>
              </div>

              <div
                className={
                  styles.content
                }
              >
                <h3>
                  {produto.nome}
                </h3>

                <p>
                  {produto.descricao.length >
                  200
                    ? `${produto.descricao.substring(
                        0,
                        200
                      )}...`
                    : produto.descricao}
                </p>

                <div
                  className={
                    styles.info
                  }
                >
                  <span>
                    <Tag
                      size={14}
                    />

                    {
                      produto.marca
                    }
                  </span>

                  <span>
                    <Package
                      size={14}
                    />

                    {
                      produto.sku
                    }
                  </span>
                </div>

                <div
                  className={
                    styles.actions
                  }
                >
                  <Link
                    href={`/painel/sistema/produtos/editar/${produto.id_produto}`}
                    className={
                      styles.editButton
                    }
                  >
                    <Pencil
                      size={16}
                    />
                    Editar
                  </Link>

                  <button
                    className={
                      styles.deleteButton
                    }
                    onClick={() =>
                      excluirProduto(
                        produto.id_produto
                      )
                    }
                  >
                    <Trash2
                      size={16}
                    />
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          )
        )}
      </div>

      <Link
        href="/painel/sistema/produtos/cadastrar"
        className={
          styles.floatingButton
        }
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}