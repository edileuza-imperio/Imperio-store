"use client";

import api from "@/Api/conectar";
import styles from "./ProdutosCampanha.module.css";


import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Search, ShoppingBag, Loader2 } from "lucide-react";
import { imagemFundo } from "@/components/Bibioteca/imagem";

interface Produto {
  id_produto: number;
  nome: string;
  descricao: string;
  imagem: string;
  preco: number;
}

interface ProdutoCampanha {
  id_produto?: number;
  produto_id?: number;
}

export default function ProdutosCampanhaPage() {
  const params = useParams();

  const id = useMemo(() => {
    const raw = params?.id;
    if (Array.isArray(raw)) return raw[0];
    return raw ? String(raw) : "";
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosCampanha, setProdutosCampanha] = useState<ProdutoCampanha[]>([]);
  const [busca, setBusca] = useState("");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      carregarDados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function carregarDados() {
    try {
      setLoading(true);

      const [produtosResponse, campanhaResponse] = await Promise.all([
        api.get("/painel/produtos"),
        api.get(`/painel/campanha/${id}/produtos`),
      ]);

      const produtosData =
        produtosResponse.data?.dados?.dados ||
        produtosResponse.data?.dados ||
        produtosResponse.data ||
        [];

      const campanhaData =
        campanhaResponse.data?.dados?.dados ||
        campanhaResponse.data?.dados ||
        campanhaResponse.data ||
        [];

      setProdutos(Array.isArray(produtosData) ? produtosData : []);
      setProdutosCampanha(Array.isArray(campanhaData) ? campanhaData : []);
    } catch (error) {
      console.error("ERRO AO CARREGAR DADOS:", error);
      setProdutos([]);
      setProdutosCampanha([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarProduto(produtoId: number) {
    try {
      setSalvandoId(produtoId);

      await api.post(`/painel/campanha/${id}/produto`, {
        produto_id: produtoId,
      });

      await carregarDados();
      alert("Produto adicionado!");
    } catch (error) {
      console.error("ERRO AO ADICIONAR PRODUTO:", error);
      alert("Erro ao adicionar produto.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function removerProduto(produtoId: number) {
    try {
      setSalvandoId(produtoId);

      await api.delete(`/painel/campanha/${id}/produto/${produtoId}`);

      await carregarDados();
      alert("Produto removido!");
    } catch (error) {
      console.error("ERRO AO REMOVER PRODUTO:", error);
      alert("Erro ao remover produto.");
    } finally {
      setSalvandoId(null);
    }
  }

  const idsNaCampanha = useMemo(() => {
    if (!Array.isArray(produtosCampanha)) return [];

    return produtosCampanha
      .map((item) => item.id_produto ?? item.produto_id)
      .filter((valor): valor is number => typeof valor === "number");
  }, [produtosCampanha]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    if (!termo) return produtos;

    return produtos.filter((produto) =>
      String(produto.nome || "").toLowerCase().includes(termo)
    );
  }, [busca, produtos]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>
            <ShoppingBag size={28} />
            Produtos da Campanha
          </h1>
          <p>Gerencie os produtos desta campanha</p>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>
          <Loader2 size={18} className={styles.spinner} />
          Carregando produtos...
        </div>
      )}

      {!loading && produtosFiltrados.length === 0 && (
        <div className={styles.empty}>
          Nenhum produto encontrado.
        </div>
      )}

      {!loading && produtosFiltrados.length > 0 && (
        <div className={styles.grid}>
          {produtosFiltrados.map((produto) => {
            const existe = idsNaCampanha.includes(produto.id_produto);
            const isSaving = salvandoId === produto.id_produto;

            return (
              <div key={produto.id_produto} className={styles.card}>
                <img
                  src={imagemFundo(produto.imagem)}
                  alt={produto.nome}
                  className={styles.image}
                />

                <div className={styles.content}>
                  <h2>{produto.nome}</h2>

                  <p>{produto.descricao}</p>

                  <strong>R$ {Number(produto.preco || 0).toFixed(2)}</strong>

                  {!existe ? (
                    <button
                      className={styles.addButton}
                      onClick={() => adicionarProduto(produto.id_produto)}
                      disabled={isSaving}
                    >
                      <Plus size={18} />
                      {isSaving ? "Adicionando..." : "Adicionar na campanha"}
                    </button>
                  ) : (
                    <button
                      className={styles.removeButton}
                      onClick={() => removerProduto(produto.id_produto)}
                      disabled={isSaving}
                    >
                      <Trash2 size={18} />
                      {isSaving ? "Removendo..." : "Remover da campanha"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}