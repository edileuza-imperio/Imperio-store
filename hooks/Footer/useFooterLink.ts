import api from "@/Api/conectar";
import { useState, useCallback } from "react";

export interface FooterLink {
  id_link: number;
  footer_id: number;
  titulo: string;
  url: string;
  icone?: string;
  ordem?: number;
  statusid: number;
  criado: string;
  atualizado?: string;
}

interface UseFooterLinkReturn {
  links: FooterLink[];
  loading: boolean;
  error: string | null;
  fetchLinks: (footerId: number) => Promise<void>;
  createLink: (data: Partial<FooterLink>) => Promise<FooterLink | null>;
  updateLink: (id: number, data: Partial<FooterLink>) => Promise<boolean>;
  deleteLink: (id: number) => Promise<boolean>;
}

export function useFooterLink(): UseFooterLinkReturn {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async (footerId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/footer/${footerId}/links`);
      setLinks(res.data.dados || []);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar links do footer");
    } finally {
      setLoading(false);
    }
  }, []);

  const createLink = useCallback(async (data: Partial<FooterLink>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/footer/links", data);
      if (data.footer_id) await fetchLinks(data.footer_id);
      return res.data.dados || null;
    } catch (err: any) {
      setError(err.message || "Erro ao criar link");
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLinks]);

  const updateLink = useCallback(async (id: number, data: Partial<FooterLink>) => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/footer/links/${id}`, data);
      if (data.footer_id) await fetchLinks(data.footer_id);
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar link");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLinks]);

  const deleteLink = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/footer/links/${id}`);
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao deletar link");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    links,
    loading,
    error,
    fetchLinks,
    createLink,
    updateLink,
    deleteLink,
  };
}
