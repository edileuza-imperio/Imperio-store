"use client";

import { useMemo } from "react";
import { useMenu } from "@/hooks/menu/useMenu";
import useCategoria from "@/hooks/categoria/useCategoria";
import NavbarDesktop from "./NavbarDesktop";
import NavbarMobile from "./NavbarMobile";

export default function Navbar() {
  const { menus, loading, error } = useMenu(); // ✅ sem "ativos"
  const { categorias, loading: catLoading, erro: catErro } = useCategoria(); // ✅ sem (1)

  // Se quiser, pode renderizar mesmo sem categorias (não bloqueia a navbar inteira)
  if (loading) return null;
  if (error) return <div className="text-danger text-center py-8">{error}</div>;

  // categorias podem falhar sem derrubar navbar
  const safeCategorias = !catLoading && !catErro ? categorias : [];

  const searchItem = useMemo(
    () => (menus?.find((m) => m.pesquisa_placeholder) ?? null),
    [menus]
  );

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