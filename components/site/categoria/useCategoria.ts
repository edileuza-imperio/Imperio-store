"use client";

import { useCallback, useEffect, useState } from "react";
import { InicioApi } from "@/services/api/api";

export type Categoria = {
  id_categoria?: number | string;
  id?: number | string;
  nome?: string;
  titulo?: string;
  slug?: string;
  icone?: string | null;
  status_id?: number | string;
};

function extrairCategorias(payload: any): Categoria[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.categorias)) return payload.categorias;
  if (Array.isArray(payload?.dados?.categorias)) return payload.dados.categorias;

  return [];
}

export default function useCategoria() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarCategorias = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const response = await InicioApi.get("/categorias");

      const lista = extrairCategorias(response.data);

      setCategorias(lista);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setErro("Erro ao carregar categorias");
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  return {
    categorias,
    loading,
    erro,
    carregarCategorias,
  };
}