'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/Api/conectar";

import Destaques from "@/app/Vitrine/Destaques/page";

export default function VisualizarVitrine() {
  const { slug } = useParams();
  const [vitrine, setVitrine] = useState<any>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const response = await api.get(`/vitrine/slug/${slug}`);
        const vitrineData = response?.data?.dados || response?.data;

        const itensRes = await api.get(`/vitrine/${vitrineData.id_vitrine}/itens`);

        setVitrine({
          ...vitrineData,
          itens: itensRes?.data?.dados || itensRes?.data,
        });
      } catch (error) {
        console.error("Erro ao carregar vitrine:", error);
      }
    }

    if (slug) {
      carregar();
    }
  }, [slug]);

  if (!vitrine) return <div>Carregando...</div>;

  return (
    <div>
      <Destaques vitrine={vitrine} />
    </div>
  );
}