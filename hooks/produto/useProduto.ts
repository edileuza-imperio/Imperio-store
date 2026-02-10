import api from "@/Api/conectar";
import { useEffect, useState } from "react";


export interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string;
  preco: number;
  slug: string;
  imagem?: string;
  estoque: number;
  ilimitado: number;
  statusid: number;
}

export function useProduto() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/produtos")
      .then(res => {
        setProdutos(res.data.dados || []);
      })
      .catch(() => {
        setError("Erro ao carregar produtos");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { produtos, loading, error };
}
