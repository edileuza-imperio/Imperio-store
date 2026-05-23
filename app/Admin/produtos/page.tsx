"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Produto = {
  id_produto?: number | string;
  id?: number | string;
  nome?: string;
  slug?: string;
  descricao?: string;
  preco?: number | string;
  preco_promocional?: number | string | null;
  sku?: string;
  modelo?: string;
  marca?: string;
  categoria_id?: number | string;
  status_id?: number | string;
};

type Categoria = {
  id_categoria?: number | string;
  id?: number | string;
  nome?: string;
};

function extrairListaProdutos(data: any): Produto[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  if (Array.isArray(data?.produtos)) return data.produtos;
  if (Array.isArray(data?.dados?.produtos)) return data.dados.produtos;
  return [];
}

function extrairListaCategorias(data: any): Categoria[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  if (Array.isArray(data?.categorias)) return data.categorias;
  if (Array.isArray(data?.dados?.categorias)) return data.dados.categorias;
  return [];
}

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosListaPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [excluindoId, setExcluindoId] = useState<
    string | number | null
  >(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [produtosResponse, categoriasResponse] =
        await Promise.all([
          api.get("/painel/produtos"),
          api.get("/painel/categorias"),
        ]);

      setProdutos(
        extrairListaProdutos(produtosResponse?.data)
      );

      setCategorias(
        extrairListaCategorias(categoriasResponse?.data)
      );
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.response?.data?.mensagem ||
          "Erro ao carregar produtos."
      );
    } finally {
      setCarregando(false);
    }
  }

  function getId(produto: Produto) {
    return produto.id_produto ?? produto.id;
  }

  function getCategoriaNome(
    categoriaId?: string | number
  ) {
    const categoria = categorias.find(
      (c) =>
        String(c.id_categoria ?? c.id) ===
        String(categoriaId)
    );

    return categoria?.nome || "Sem categoria";
  }

  async function excluirProduto(
    id: number | string
  ) {
    const confirmar = window.confirm(
      "Deseja excluir este produto?"
    );

    if (!confirmar) return;

    try {
      setExcluindoId(id);

      await api.delete(`/painel/produto/${id}`);

      setProdutos((prev) =>
        prev.filter(
          (produto) =>
            String(getId(produto)) !== String(id)
        )
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.mensagem ||
          "Erro ao excluir produto."
      );
    } finally {
      setExcluindoId(null);
    }
  }

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    if (!termo) return produtos;

    return produtos.filter((produto) => {
      return (
        (produto.nome || "")
          .toLowerCase()
          .includes(termo) ||
        (produto.sku || "")
          .toLowerCase()
          .includes(termo) ||
        (produto.marca || "")
          .toLowerCase()
          .includes(termo) ||
        (produto.modelo || "")
          .toLowerCase()
          .includes(termo)
      );
    });
  }, [produtos, busca]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Produtos</h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button onClick={carregarDados}>
          Atualizar
        </button>

        <Link href="/Admin/produtos/cadastrar">
          Cadastrar Produto
        </Link>
      </div>

      <input
        type="text"
        placeholder="Buscar produto..."
        value={busca}
        onChange={(e) =>
          setBusca(e.target.value)
        }
        style={{
          width: "100%",
          maxWidth: "400px",
          marginBottom: "20px",
        }}
      />

      {carregando && (
        <p>Carregando produtos...</p>
      )}

      {erro && (
        <p style={{ color: "red" }}>{erro}</p>
      )}

      {!carregando &&
        !erro &&
        produtosFiltrados.length === 0 && (
          <p>Nenhum produto encontrado.</p>
        )}

      {!carregando &&
        !erro &&
        produtosFiltrados.map((produto) => {
          const id = getId(produto);

          return (
            <div
              key={String(id)}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "15px",
              }}
            >
              <h3>{produto.nome}</h3>

              <p>
                <strong>ID:</strong> {id}
              </p>

              <p>
                <strong>SKU:</strong>{" "}
                {produto.sku || "-"}
              </p>

              <p>
                <strong>Marca:</strong>{" "}
                {produto.marca || "-"}
              </p>

              <p>
                <strong>Modelo:</strong>{" "}
                {produto.modelo || "-"}
              </p>

              <p>
                <strong>Categoria:</strong>{" "}
                {getCategoriaNome(
                  produto.categoria_id
                )}
              </p>

              <p>
                <strong>Preço:</strong>{" "}
                {formatarPreco(
                  Number(produto.preco || 0)
                )}
              </p>

              <p>
                <strong>Promoção:</strong>{" "}
                {produto.preco_promocional
                  ? formatarPreco(
                      Number(
                        produto.preco_promocional
                      )
                    )
                  : "-"}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  onClick={() =>
                    router.push(
                      `/Admin/produtos/${id}`
                    )
                  }
                >
                  Ver
                </button>

                <button
                  onClick={() =>
                    router.push(
                      `/Admin/produtos/${id}/editar`
                    )
                  }
                >
                  Editar
                </button>

                <button
                  onClick={() =>
                    excluirProduto(id!)
                  }
                  disabled={
                    excluindoId === id
                  }
                >
                  {excluindoId === id
                    ? "Excluindo..."
                    : "Excluir"}
                </button>
              </div>
            </div>
          );
        })}
    </div>
  );
}