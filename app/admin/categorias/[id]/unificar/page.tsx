'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface Produto {
  id_produto: number;
  nome: string;
  categoria_id: number | null;
  preco?: number | null;
  estoque?: number | null;
}

interface Categoria {
  id_categoria: number;
  nome: string;
  total_produtos: number;
}

export default function UnificarProdutosPage() {
  const { id } = useParams();
  const router = useRouter();
  const categoriaId = Number(id);

  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      // Carrega categoria e produtos
      const [cat, prod] = await Promise.all([
        api.get(`/admin/categorias/${categoriaId}`),
        api.get("/admin/produtos")
      ]);

      setCategoria(cat.data.dados);
      setProdutos(prod.data.dados);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: number) => {
    setSelecionados(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const salvar = async () => {
    if (selecionados.length === 0) {
      toast.error("Selecione pelo menos um produto");
      return;
    }

    try {
      await api.post("/admin/produtos/unificar", {
        categoria_id: categoriaId,
        produtos: selecionados
      });

      toast.success("Produtos unificados com sucesso!");
      router.push("/admin/categorias");
    } catch {
      toast.error("Erro ao unificar produtos");
    }
  };

  if (loading) {
    return <p className="p-4">Carregando...</p>;
  }

  return (
    <div className="container py-4">
      <ToastContainer />

      <h2 className="mb-2">
        Unificar produtos em <strong>{categoria?.nome}</strong>
      </h2>

      <p className="text-muted mb-4">
        Produtos já unificados: <strong>{categoria?.total_produtos}</strong>
      </p>

      <div className="row g-3">
        {produtos.map(prod => {
          const bloqueado = prod.categoria_id !== null;

          return (
            <div key={prod.id_produto} className="col-md-3">
              <div
                className={`border rounded p-3 ${
                  bloqueado ? "opacity-50" : "cursor-pointer"
                } ${selecionados.includes(prod.id_produto) ? "border-primary" : ""}`}
                onClick={() => !bloqueado && toggle(prod.id_produto)}
              >
                <strong>{prod.nome}</strong>

                <div className="small text-muted mt-1">
                  Preço: R${Number(prod.preco ?? 0).toFixed(2)}
                </div>
                <div className="small text-muted">
                  Estoque: {Number(prod.estoque ?? 0)}
                </div>

                {bloqueado && (
                  <div className="text-danger small mt-2">
                    Já pertence a uma categoria
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 d-flex gap-2">
        <button className="btn btn-secondary" onClick={() => router.back()}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={salvar}>
          Salvar Unificação
        </button>
      </div>
    </div>
  );
}
