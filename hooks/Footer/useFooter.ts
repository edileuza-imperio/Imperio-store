import api from "@/Api/conectar";
import { useState, useEffect, useCallback } from "react";

export interface Footer {
  id_footer: number;
  logo?: string;
  titulo: string;
  descricao?: string;
  endereco?: string;   // ✅ corrigido
  icone?: string;      // ✅ corrigido
  statusid: number;
  criado: string;
  atualizado?: string;
}

interface UseFooterReturn {
  footers: Footer[];
  loading: boolean;
  error: string | null;
  fetchFooters: () => Promise<void>;
  getFooterById: (id: number) => Promise<Footer | null>;
  createFooter: (data: Partial<Footer>) => Promise<Footer | null>;
  updateFooter: (id: number, data: Partial<Footer>) => Promise<boolean>;
  deleteFooter: (id: number) => Promise<boolean>;
}

export function useFooter(): UseFooterReturn {
  const [footers, setFooters] = useState<Footer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFooters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/footer");
      setFooters(res.data.dados || []);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar footers");
    } finally {
      setLoading(false);
    }
  }, []);

  const getFooterById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/footer/${id}`);
      return res.data.dados?.[0] || null;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar footer");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createFooter = useCallback(async (data: Partial<Footer>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/footer", data);
      await fetchFooters();
      return res.data.dados || null;
    } catch (err: any) {
      setError(err.message || "Erro ao criar footer");
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFooters]);

  const updateFooter = useCallback(async (id: number, data: Partial<Footer>) => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/footer/${id}`, data);
      await fetchFooters();
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar footer");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchFooters]);

  const deleteFooter = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/footer/${id}`);
      await fetchFooters();
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao deletar footer");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchFooters]);

  useEffect(() => {
    fetchFooters();
  }, [fetchFooters]);

  return {
    footers,
    loading,
    error,
    fetchFooters,
    getFooterById,
    createFooter,
    updateFooter,
    deleteFooter,
  };
}
