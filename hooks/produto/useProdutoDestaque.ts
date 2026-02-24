// src/hooks/produto/useProdutoDestaque.ts
"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";


type DestaqueItem = any; // se quiser, tipamos depois com seu DTO real

function extractArray(resData: any): any[] {
  const d = resData?.data ?? resData?.dados ?? resData;
  if (Array.isArray(d)) return d;

  // alguns backends retornam { data: { data: [] } } ou { data: { itens: [] } }
  const deep =
    d?.data ??
    d?.itens ??
    d?.items ??
    d?.result ??
    d?.results ??
    d?.registros ??
    d?.lista;

  return Array.isArray(deep) ? deep : [];
}

export function useProdutoDestaque() {
  const [destaques, setDestaques] = useState<DestaqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // Preferi "ativos", mas se seu backend usa "listar", troque aqui
        const res = await api.get(rotas.produtos.destaques.ativos, {
          withCredentials: true,
        });

        const lista = extractArray(res?.data);
        if (alive) setDestaques(lista);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { destaques, loading, error };
}