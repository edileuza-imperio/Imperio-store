"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";

export interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string;
  preco: number | string | null;
  slug: string;
  imagem?: string;
  categoria_nome?: string;
  estoque?: number;
  destaque?: number;
}

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;
  const base = api.defaults.baseURL ?? "";
  return caminho.startsWith("http")
    ? caminho
    : `${base.replace(/\/$/, "")}/${caminho.replace(/^\/+/, "")}`;
};

export default function useProdutoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [produtosPorPagina] = useState(12);
  const [produtosFavoritos, setProdutosFavoritos] = useState<number[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  // 🔹 CATÁLOGO
  useEffect(() => {
    console.log("📦 Buscando catálogo...");
    api
      .get("/catalogo")
      .then((res) => {
        console.log("✅ Catálogo recebido:", res.data);
        const list: Produto[] =
          res.data?.dados?.produtos?.map((p: Produto) => ({
            ...p,
            imagem: getImagemUrl(p.imagem),
            preco: Number(p.preco) || 0,
          })) || [];

        setProdutos(list);

        // Tipagem corrigida
        const cats: string[] = Array.from(
          new Set(
            list
              .map((p: Produto) => p.categoria_nome)
              .filter((nome): nome is string => Boolean(nome))
          )
        );

        setCategorias(cats);
      })
      .catch((err) => {
        console.error("❌ Erro catálogo:", err);
        toast.error("Erro ao carregar catálogo");
      })
      .finally(() => setLoading(false));
  }, []);

  // 🔹 USUÁRIO LOGADO
  useEffect(() => {
    console.log("👤 Verificando usuário logado...");

    api
      .get("/me")
      .then((res) => {
        console.log("✅ Resposta /me:", res.data);
        const id: number | undefined = res.data?.dados?.usuario?.id;

        if (id) {
          console.log("🆔 Usuário autenticado ID:", id);
          setUsuarioId(id);
        } else {
          console.warn("⚠️ ID não encontrado em /me");
          setUsuarioId(null);
        }
      })
      .catch((err) => {
        console.error("❌ Erro ao verificar /me:", err);
        setUsuarioId(null);
      });
  }, []);

  // 🔹 FAVORITOS
  useEffect(() => {
    const favs = localStorage.getItem("favoritos");
    if (favs) setProdutosFavoritos(JSON.parse(favs));
  }, []);

  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(produtosFavoritos));
  }, [produtosFavoritos]);

  // 🔹 ADICIONAR AO CARRINHO
  const adicionarAoCarrinho = async (produto: Produto, quantidade = 1) => {
    console.group("🛒 ADICIONAR AO CARRINHO");
    console.log("Produto:", produto);
    console.log("Quantidade:", quantidade);
    console.log("Usuário ID:", usuarioId);

    if (!usuarioId) {
      console.error("❌ Usuário NÃO logado");
      toast.error("Você precisa estar logado para adicionar ao carrinho.");
      console.groupEnd();
      return;
    }

    try {
      const payload = {
        usuarioId,
        produtoId: produto.id_produto,
        quantidade,
        precoUnitario: Number(produto.preco),
      };

      console.log("📤 Payload enviado:", payload);
      const res = await api.post("/carrinho/adicionar", payload);
      console.log("✅ Resposta carrinho:", res.data);
      toast.success(`${produto.nome} adicionado ao carrinho!`);
    } catch (err: any) {
      console.error("❌ Erro ao adicionar ao carrinho:", err.response?.data || err);
      toast.error("Erro ao adicionar ao carrinho.");
    } finally {
      console.groupEnd();
    }
  };

  // 🔹 FILTRO
  const produtosFiltrados = filtroCategoria
    ? produtos.filter((p) => p.categoria_nome === filtroCategoria)
    : produtos;

  // 🔹 PAGINAÇÃO
  const indexUltimoProduto = paginaAtual * produtosPorPagina;
  const indexPrimeiroProduto = indexUltimoProduto - produtosPorPagina;
  const produtosPaginados = produtosFiltrados.slice(
    indexPrimeiroProduto,
    indexUltimoProduto
  );
  const totalPaginas = Math.ceil(produtosFiltrados.length / produtosPorPagina);

  return {
    produtos,
    loading,
    filtroCategoria,
    setFiltroCategoria,
    categorias,
    produtosFiltrados,
    produtosPaginados,
    produtosFavoritos,
    toggleFavorito: (id: number) =>
      setProdutosFavoritos((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      ),
    paginaAtual,
    totalPaginas,
    paginar: setPaginaAtual,
    paginaAnterior: () => paginaAtual > 1 && setPaginaAtual(paginaAtual - 1),
    proximaPagina: () =>
      paginaAtual < totalPaginas && setPaginaAtual(paginaAtual + 1),
    indexPrimeiroProduto,
    indexUltimoProduto,
    adicionarAoCarrinho,
    usuarioId,
  };
}
