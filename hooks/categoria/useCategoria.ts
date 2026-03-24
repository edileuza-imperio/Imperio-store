"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { Categoria } from "@/components/Bibioteca/Bibiotecas";
import { rotas } from "@/components/Bibioteca/config/rotas";

export default function useCategoria() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    const fetchCategorias = async () => {
      setLoading(true);
      setErro(null);

      try {
        const response = await api.get(rotas.categorias.listar);
        const data = response.data;

        if (!ativo) return;

        if (Array.isArray(data)) {
          setCategorias(data);
        } else if (Array.isArray(data?.dados)) {
          setCategorias(data.dados);
        } else {
          setCategorias([]);
          setErro("Formato de resposta inválido ao carregar categorias.");
        }
      } catch (error: any) {
        if (!ativo) return;

        console.error("Erro ao carregar categorias:", error);
        setErro(
          error?.response?.data?.mensagem ||
            error?.message ||
            "Não foi possível carregar as categorias."
        );
        setCategorias([]);
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    };

    fetchCategorias();

    return () => {
      ativo = false;
    };
  }, []);

  return { categorias, loading, erro };
}