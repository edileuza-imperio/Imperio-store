"use client";

import useNavbarData from "@/hooks/menu/useNavbarData";
import NavbarDesktop from "./NavbarDesktop";
import NavbarMobile from "./NavbarMobile";


export default function Navbar() {
  const { menus, categorias, searchPlaceholder, loading, error } =
    useNavbarData();

  if (loading) return null;
  if (error) return <div className="text-danger text-center py-8">{error}</div>;

  return (
    <>
      <NavbarMobile
        menus={menus}
        categorias={categorias}
        searchPlaceholder={searchPlaceholder}
      />
      <NavbarDesktop
        menus={menus}
        categorias={categorias}
        searchPlaceholder={searchPlaceholder}
      />
    </>
  );
}