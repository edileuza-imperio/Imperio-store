"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import ProdutosCards from "@/components/Painel/produtos/ProdutosCards";


export type Produto = {
  id_produto: number;
  nome: string;
  slug?: string;
  descricao?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  estoque?: number;
  ilimitado?: number;
  imagem?: string;
  categoria_id?: number | null;
  categoria_nome?: string | null;
  statusid?: number | null;
  status_nome?: string | null;
  catalogo?: number;
  destaque?: number | null;
  sku?: string;
  modelo?: string;
};

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.produtos != null) return payload.produtos as T;
  return payload as T;
}

export default function ProdutosPainelPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarProdutos() {
    try {
      setLoading(true);

      const response = await api.get("/admin/produtos", {
        withCredentials: true,
      });

      const listaProdutos = resolveApi<Produto[]>(response.data) || [];
      setProdutos(Array.isArray(listaProdutos) ? listaProdutos : []);
    } catch (error) {
      console.error(error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <ProdutosCards produtos={produtos} loading={loading} />
    </div>
  );
}