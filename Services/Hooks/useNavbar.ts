"use client";

import { useCallback, useEffect, useState } from "react";

import { buscarNavbar } from "../servicos/NavbarService";
import type { NavbarData, NavbarState } from "../types/Navbar";

// =====================================================
// ESTADO INICIAL
// =====================================================

const estadoInicial: NavbarData = {
  tituloLoja: "Universo Império",
  menus: [],
  categorias: [],
  acoes: [],
};

// =====================================================
// HOOK NAVBAR
// =====================================================

export function useNavbar(): NavbarState {
  const [dados, setDados] = useState<NavbarData>(estadoInicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  // ===================================================
  // CARREGAR DADOS DA NAVBAR
  // ===================================================

  const carregarNavbar = useCallback(async (cancelado: () => boolean) => {
    console.group("[NAVBAR] Carregando navegação");

    try {
      setCarregando(true);
      setErro(false);

      console.log("[NAVBAR] Consultando API...");
      const resultado = await buscarNavbar();

      if (cancelado()) return;

      if (!resultado || typeof resultado !== "object") {
        throw new Error(
          "A API retornou uma resposta inválida para a navegação.",
        );
      }

      const dadosNormalizados: NavbarData = {
        tituloLoja:
          typeof resultado.tituloLoja === "string" &&
          resultado.tituloLoja.trim() !== ""
            ? resultado.tituloLoja.trim()
            : estadoInicial.tituloLoja,
        menus: Array.isArray(resultado.menus) ? resultado.menus : [],
        categorias: Array.isArray(resultado.categorias)
          ? resultado.categorias
          : [],
        acoes: Array.isArray(resultado.acoes) ? resultado.acoes : [],
      };

      setDados(dadosNormalizados);
      console.info("[NAVBAR] Navegação carregada com sucesso!");
      console.table({
        tituloLoja: dadosNormalizados.tituloLoja,
        quantidadeMenus: dadosNormalizados.menus.length,
        quantidadeCategorias: dadosNormalizados.categorias.length,
        quantidadeAcoes: dadosNormalizados.acoes.length,
      });
    } catch (error) {
      if (cancelado()) return;

      console.error("[NAVBAR] Erro ao carregar navegação:", error);
      setDados(estadoInicial);
      setErro(true);
    } finally {
      if (!cancelado()) {
        setCarregando(false);
      }
      console.groupEnd();
    }
  }, []);

  // ===================================================
  // EFEITO DE CARREGAMENTO
  // ===================================================

  useEffect(() => {
    let cancelado = false;

    void carregarNavbar(() => cancelado);

    return () => {
      cancelado = true;
    };
  }, [carregarNavbar]);

  // ===================================================
  // RETORNO DO HOOK
  // ===================================================

  return {
    ...dados,
    carregando,
    erro,
  };
}
