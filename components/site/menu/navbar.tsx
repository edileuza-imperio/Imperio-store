"use client";

import { useMemo } from "react";
import { useMenu } from "@/hooks/menu/useMenu";

import NavbarDesktop from "./NavbarDesktop";
import NavbarMobile from "./NavbarMobile";
import useCategoria from "@/Hooks/Categoria/useCategoria";

export default function Navbar() {
  const { menus, loading, error } = useMenu();
  const { categorias, loading: catLoading, erro: catErro } = useCategoria();

  // ✅ Hooks SEMPRE antes de qualquer return condicional
  const searchItem = useMemo(
    () => menus?.find((m) => m.pesquisa_placeholder) ?? null,
    [menus]
  );

  // ✅ categorias podem falhar sem quebrar a navbar
  const safeCategorias = useMemo(() => {
    if (catLoading || catErro) return [];
    return categorias ?? [];
  }, [catLoading, catErro, categorias]);

  // ✅ Agora pode retornar condicionalmente sem quebrar a ordem dos hooks
  if (loading) return null;
  if (error) return <div className="text-danger text-center py-8">{error}</div>;

  return (
    <>
      <NavbarMobile
        menus={menus || []}
        categorias={safeCategorias}
        searchPlaceholder={searchItem?.pesquisa_placeholder || ""}
      />
      <NavbarDesktop
        menus={menus || []}
        categorias={safeCategorias}
        searchPlaceholder={searchItem?.pesquisa_placeholder || ""}
      />
    </>
  );
}