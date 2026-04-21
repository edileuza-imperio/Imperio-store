"use client";

import { useMemo } from "react";
import { useMenu } from "@/hooks/menu/useMenu";
import useCategoria from "@/hooks/categoria/useCategoria";

export default function useNavbarData() {
  const { menus, loading, error } = useMenu();
  const { categorias, loading: catLoading, erro: catErro } = useCategoria();

  const searchPlaceholder = useMemo(() => {
    return menus?.find((m) => m.pesquisa_placeholder)?.pesquisa_placeholder || "";
  }, [menus]);

  const safeCategorias = useMemo(() => {
    if (catLoading || catErro) return [];
    return categorias ?? [];
  }, [catLoading, catErro, categorias]);

  return {
    menus: menus || [],
    categorias: safeCategorias,
    searchPlaceholder,
    loading,
    error,
  };
}