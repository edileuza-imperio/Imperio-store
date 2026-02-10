// src/hooks/useApiTest.ts
'use client'
import { useState, useEffect } from "react";
import api from "@/Api/conectar";

interface ApiData {
  version: string;
  status: string;
}

interface ApiResponse {
  mensagem: string;
  dados: ApiData;
}

export function useApiTest() {
  const [data, setData] = useState<ApiData | null>(null);
  const [mensagem, setMensagem] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<ApiResponse>("/api"); // rota correta
        setData(response.data.dados);
        setMensagem(response.data.mensagem);
      } catch (err: any) {
        setError("Erro ao carregar dados da API");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, mensagem, loading, error };
}
