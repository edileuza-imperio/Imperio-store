"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";

import Banner from "@/components/site/Banner/Banner";
import CategoriasDestaque from "@/components/site/categoria/Categoria";
import Destaques from "@/components/Vitrine/Destaques";

import type { Vitrine } from "@/components/Vitrine/Destaques/useVitrine";

function extrairLista(payload: any): any[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

function normalizarTexto(texto?: string | null) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ehVitrineCampanha(vitrine: Vitrine) {
  const texto = `
    ${normalizarTexto(vitrine.tipo)}
    ${normalizarTexto(vitrine.nome)}
    ${normalizarTexto(vitrine.slug)}
    ${normalizarTexto(vitrine.titulo)}
  `;

  return texto.includes("campanha");
}

function ehVitrineNovidade(vitrine: Vitrine) {
  const texto = `
    ${normalizarTexto(vitrine.nome)}
    ${normalizarTexto(vitrine.slug)}
    ${normalizarTexto(vitrine.titulo)}
  `;

  return (
    texto.includes("novidade") ||
    texto.includes("novidades") ||
    texto.includes("lancamento") ||
    texto.includes("lancamentos")
  );
}

function ordenarPorOrdem(a: Vitrine, b: Vitrine) {
  return Number(a.ordem ?? 0) - Number(b.ordem ?? 0);
}

export default function HomeContent() {
  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarVitrines() {
      try {
        setLoading(true);

        const response = await api.get("/vitrines/com-itens", {
          withCredentials: true,
        });

        const lista = extrairLista(response.data) as Vitrine[];

        setVitrines(lista);
      } catch (error) {
        console.error("Erro ao carregar vitrines:", error);
        setVitrines([]);
      } finally {
        setLoading(false);
      }
    }

    carregarVitrines();
  }, []);

  const vitrinesProdutos = useMemo(() => {
    return vitrines
      .filter((vitrine) => !ehVitrineCampanha(vitrine))
      .filter((vitrine) => !ehVitrineNovidade(vitrine))
      .sort(ordenarPorOrdem);
  }, [vitrines]);

  const vitrinesCampanha = useMemo(() => {
    return vitrines
      .filter(ehVitrineCampanha)
      .sort(ordenarPorOrdem);
  }, [vitrines]);

  const vitrinesNovidades = useMemo(() => {
    return vitrines
      .filter(ehVitrineNovidade)
      .sort(ordenarPorOrdem);
  }, [vitrines]);

  return (
    <>
      {/* Banner Principal */}
      <Banner />

      {/* Produtos */}
      {!loading &&
        vitrinesProdutos.map((vitrine) => (
          <Destaques
            key={`produto-${vitrine.id_vitrine}`}
            vitrine={vitrine}
          />
        ))}

      {/* Campanhas */}
      {!loading &&
        vitrinesCampanha.map((vitrine) => (
          <Destaques
            key={`campanha-${vitrine.id_vitrine}`}
            vitrine={vitrine}
          />
        ))}

      {/* Categorias */}
      <CategoriasDestaque />

      {/* Novidades */}
      {!loading &&
        vitrinesNovidades.map((vitrine) => (
          <Destaques
            key={`novidade-${vitrine.id_vitrine}`}
            vitrine={vitrine}
          />
        ))}
    </>
  );
}