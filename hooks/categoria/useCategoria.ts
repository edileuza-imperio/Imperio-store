// src/hooks/categoria/useCategoria.ts
"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { Categoria } from "@/components/Bibioteca/Bibiotecas";



export default function useCategoria() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(true);
      setErro(null);

      try {
        const response = await api.get(rotas.categorias.listar);

        const data = response.data;

        if (data?.status !== 200) {
          setErro(data?.mensagem || "Erro ao carregar categorias.");
          setCategorias([]);
          return;
        }

        setCategorias(data?.dados ?? []);
      } catch (error: any) {
        console.error("Erro ao carregar categorias:", error);
        setErro(error?.message || "Não foi possível carregar as categorias.");
        setCategorias([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  return { categorias, loading, erro };
}