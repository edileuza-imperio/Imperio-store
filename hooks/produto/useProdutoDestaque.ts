// src/hooks/produto/useProdutoDestaque.ts
"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

type DestaqueItem = any;

function extractArray(resData: any): any[] {
  const d = resData?.data ?? resData?.dados ?? resData;
  if (Array.isArray(d)) return d;

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
        // ✅ seu backend tem /produtos/destaques
        const res = await api.get(rotas.produtos.destaques.listar, {
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