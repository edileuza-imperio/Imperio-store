import api from "@/Api/conectar";
import { useEffect, useState } from "react";


export interface ProdutoDestaque {
  id_destaque: number;
  ordem: number;
  produto_id: number;

  produto_nome: string;
  produto_slug: string;
  produto_imagem?: string;
  produto_preco: number;
  produto_descricao?: string;
}

export function useProdutoDestaque() {
  const [destaques, setDestaques] = useState<ProdutoDestaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/produtos/destaques/status")
      .then(res => {
        setDestaques(res.data.dados || []);
      })
      .catch(() => {
        setError("Erro ao carregar produtos em destaque");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { destaques, loading, error };
}
