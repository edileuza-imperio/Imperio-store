"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import api from "@/Api/conectar";
import { BootstrapNavbar, Categoria, Menu, SiteConfig, Usuario } from "./menu";
import NavbarHeader from "@/components/site/menu/navbar/header";

export default function Navbar() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [site, setSite] = useState<SiteConfig | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [openMenu, setOpenMenu] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [sidebarPesquisa, setSidebarPesquisa] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [quantidadeCarrinho, setQuantidadeCarrinho] = useState(0);

  useEffect(() => {
    carregarBootstrap();

    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    const atualizarNavbar = () => {
      carregarBootstrap();
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("carrinhoAtualizado", atualizarNavbar);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("carrinhoAtualizado", atualizarNavbar);
    };
  }, []);

  async function carregarBootstrap() {
    try {
      const res = await api.get("/bootstrap/navbar");

      const bootstrap: BootstrapNavbar =
        res.data?.dados?.dados ?? res.data?.dados ?? {};

      const menusDados = Array.isArray(bootstrap.menus) ? bootstrap.menus : [];
      setMenus(menusDados);

      const siteDados = bootstrap.site;
      if (Array.isArray(siteDados)) {
        setSite((siteDados[0] as SiteConfig) || null);
      } else {
        setSite((siteDados as SiteConfig) || null);
      }

      const categoriasDados = Array.isArray(bootstrap.categorias)
        ? bootstrap.categorias
        : [];
      setCategorias(categoriasDados);

      setUsuario(bootstrap.usuario || null);
      setQuantidadeCarrinho(Number(bootstrap.carrinho_total || 0));
    } catch {
      setMenus([]);
      setSite(null);
      setCategorias([]);
      setUsuario(null);
      setQuantidadeCarrinho(0);
    }
  }

  async function logout() {
    try {
      await api.post("/logout");
      setDropdown(false);
      setUsuario(null);
      window.location.href = "/";
    } catch {
      setDropdown(false);
    }
  }

  const carrinho = useMemo(() => {
    return (
      menus.find((m) => m.nome?.toLowerCase()?.trim() === "carrinho") || null
    );
  }, [menus]);

  const login = useMemo(() => {
    return menus.find((m) => m.nome?.toLowerCase()?.trim() === "login") || null;
  }, [menus]);



  const titulo = site?.titulo || "Universo Império";
  const subtitulo = site?.subtitulo || "DECORAÇÕES & EVENTOS";
  const tituloSplit = titulo.split(" ");
  const titulo1 = tituloSplit[0] || "Universo";
  const titulo2 = tituloSplit[1] || "Império";

  const categoriasFiltradas = categorias.filter((categoria) => {
    const nome = (categoria.nome || "").toLowerCase();
    const slug = (categoria.slug || "").toLowerCase();
    const filtro = sidebarPesquisa.toLowerCase().trim();

    if (!filtro) return true;

    return nome.includes(filtro) || slug.includes(filtro);
  });

  

  return (
    <>
      <NavbarHeader
        scrolled={scrolled}
        titulo1={titulo1}
        titulo2={titulo2}
        subtitulo={subtitulo}
        pesquisa={pesquisa}
        setPesquisa={setPesquisa}
        usuario={usuario}
        dropdown={dropdown}
        setDropdown={setDropdown}
        login={login}
        carrinho={carrinho}
        quantidadeCarrinho={quantidadeCarrinho}
        logout={logout}
      />

      
    </>
  );
}