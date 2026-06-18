"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";

import Banner from "@/components/site/Banner/Banner";
import CategoriasDestaque from "@/components/site/categoria/Categoria";
import Destaques from "@/components/Vitrine/Destaques";
import Campanhas from "../campanha/page";

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

        const lista = extrairLista(response?.data) as Vitrine[];
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

  const vitrinesCampanha = useMemo(() => {
    return vitrines.filter(ehVitrineCampanha);
  }, [vitrines]);

  const vitrinesNormais = useMemo(() => {
    return vitrines.filter((vitrine) => !ehVitrineCampanha(vitrine));
  }, [vitrines]);

  return (
    <>
      <Banner />
      <CategoriasDestaque />

      {!loading &&
        vitrinesCampanha.map((vitrine) => (
          <Campanhas
            key={String(vitrine.id_vitrine)}
            vitrine={vitrine}
          />
        ))}

      {!loading &&
        vitrinesNormais.map((vitrine) => (
          <Destaques
            key={String(vitrine.id_vitrine)}
            vitrine={vitrine}
          />
        ))}
    </>
  );
}