"use client";

import api from "@/Api/conectar";
import styles from "./ProdutosCampanha.module.css";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  Plus,
  Trash2,
  Search,
  ShoppingBag,
} from "lucide-react";

interface Produto {
  id_produto: number;
  nome: string;
  descricao: string;
  imagem: string;
  preco: number;
}

interface ProdutoCampanha {
  id_produto: number;
}

export default function ProdutosCampanhaPage() {
  const params = useParams();

  const id = params?.id;

  const [loading, setLoading] =
    useState(true);

  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [
    produtosCampanha,
    setProdutosCampanha,
  ] = useState<
    ProdutoCampanha[]
  >([]);

  const [busca, setBusca] =
    useState("");

  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  async function carregarDados() {
    try {
      setLoading(true);

      const [
        produtosResponse,
        campanhaResponse,
      ] = await Promise.all([
        api.get("/produtos"),

        api.get(
          `/painel/campanha/${id}/produto`
        ),
      ]);

      console.log(
        "PRODUTOS:",
        produtosResponse.data
      );

      console.log(
        "CAMPANHA PRODUTOS:",
        campanhaResponse.data
      );

      /*
      ============================
      PRODUTOS
      ============================
      */

      const produtosData =
        produtosResponse.data
          ?.dados?.dados ||
        produtosResponse.data
          ?.dados ||
        [];

      setProdutos(
        Array.isArray(
          produtosData
        )
          ? produtosData
          : []
      );

      /*
      ============================
      CAMPANHA PRODUTOS
      ============================
      */

      const campanhaData =
        campanhaResponse.data
          ?.dados?.dados ||
        campanhaResponse.data
          ?.dados ||
        [];

      setProdutosCampanha(
        Array.isArray(
          campanhaData
        )
          ? campanhaData
          : []
      );
    } catch (error) {
      console.error(
        "ERRO:",
        error
      );

      setProdutos([]);
      setProdutosCampanha([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarProduto(
    produtoId: number
  ) {
    try {
      await api.post(
        `/campanha/${id}/produto`,
        {
          produto_id: produtoId,
        }
      );

      await carregarDados();

      alert(
        "Produto adicionado!"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao adicionar produto."
      );
    }
  }

  async function removerProduto(
    produtoId: number
  ) {
    try {
      await api.delete(
        `/campanha/${id}/produto/${produtoId}`
      );

      await carregarDados();

      alert(
        "Produto removido!"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao remover produto."
      );
    }
  }

  function imagem(
    path: string
  ) {
    if (!path) {
      return "/sem-imagem.png";
    }

    return `${api.defaults.baseURL}/${path}`;
  }

  /*
  ============================
  IDS PRODUTOS CAMPANHA
  ============================
  */

  const idsNaCampanha =
    Array.isArray(
      produtosCampanha
    )
      ? produtosCampanha.map(
          (item) =>
            item.id_produto
        )
      : [];

  /*
  ============================
  FILTRO
  ============================
  */

  const produtosFiltrados =
    produtos.filter((produto) =>
      produto.nome
        ?.toLowerCase()
        .includes(
          busca.toLowerCase()
        )
    );

  return (
    <div className={styles.page}>
      {/* HEADER */}

      <div className={styles.header}>
        <div>
          <h1>
            <ShoppingBag
              size={28}
            />
            Produtos da Campanha
          </h1>

          <p>
            Gerencie os produtos
            desta campanha
          </p>
        </div>

        <div
          className={
            styles.searchBox
          }
        >
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
          />
        </div>
      </div>

      {/* LOADING */}

      {loading && (
        <div className={styles.loading}>
          Carregando produtos...
        </div>
      )}

      {/* GRID */}

      {!loading && (
        <div className={styles.grid}>
          {produtosFiltrados.map(
            (produto) => {
              const existe =
                idsNaCampanha.includes(
                  produto.id_produto
                );

              return (
                <div
                  key={
                    produto.id_produto
                  }
                  className={
                    styles.card
                  }
                >
                  <img
                    src={imagem(
                      produto.imagem
                    )}
                    alt={
                      produto.nome
                    }
                    className={
                      styles.image
                    }
                  />

                  <div
                    className={
                      styles.content
                    }
                  >
                    <h2>
                      {
                        produto.nome
                      }
                    </h2>

                    <p>
                      {
                        produto.descricao
                      }
                    </p>

                    <strong>
                      R$
                      {" "}
                      {Number(
                        produto.preco
                      ).toFixed(2)}
                    </strong>

                    {!existe ? (
                      <button
                        className={
                          styles.addButton
                        }
                        onClick={() =>
                          adicionarProduto(
                            produto.id_produto
                          )
                        }
                      >
                        <Plus
                          size={18}
                        />
                        Adicionar na
                        campanha
                      </button>
                    ) : (
                      <button
                        className={
                          styles.removeButton
                        }
                        onClick={() =>
                          removerProduto(
                            produto.id_produto
                          )
                        }
                      >
                        <Trash2
                          size={18}
                        />
                        Remover da
                        campanha
                      </button>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}