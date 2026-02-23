'use client';


import { useCallback, useEffect, useState } from "react";
import { ApiIndexData, ApiIndexResponse } from "../Bibioteca/Bibiotecas";
import api from "@/Api/conectar";



interface UseApiReturn {
  data: ApiIndexData | null;
  mensagem: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export default function useApi(): UseApiReturn {
  const [data, setData] = useState<ApiIndexData | null>(null);
  const [mensagem, setMensagem] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get<ApiIndexResponse>("/");
      const payload = res.data;

      if (payload?.status !== 200) {
        throw new Error(payload?.mensagem || "API offline");
      }

      setMensagem(payload.mensagem || "");
      setData(payload.dados || null);
    } catch (err: any) {
      setError(err?.message || "Erro ao conectar na API");
      setData(null);
      setMensagem("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, mensagem, loading, error, refetch };
}