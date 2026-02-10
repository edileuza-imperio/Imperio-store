"use client";

import { useMenu } from "@/hooks/menu/useMenu";
import useCategoria from "@/hooks/categoria/useCategoria";
import NavbarDesktop from "./NavbarDesktop";
import NavbarMobile from "./NavbarMobile";

export default function Navbar() {
  const { menus, loading, error } = useMenu("ativos");
  const { categorias } = useCategoria(1);

  if (loading) return null;
  if (error) return <div className="text-danger text-center py-8">{error}</div>;

  const searchItem = menus?.find((m) => m.pesquisa_placeholder) || null;

  return (
    <>
      <NavbarMobile
        menus={menus || []}
        categorias={categorias}
        searchPlaceholder={searchItem?.pesquisa_placeholder || ""}
      />
      <NavbarDesktop
        menus={menus || []}
        searchPlaceholder={searchItem?.pesquisa_placeholder || ""}
      />
    </>
  );
}
