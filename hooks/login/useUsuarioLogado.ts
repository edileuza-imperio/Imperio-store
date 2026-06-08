"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import api from "@/Api/conectar";

type UsuarioLogado = {
  id_usuario?: number;
  id?: number;
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  nivel_id?: number;
  status_id?: number;
};

export default function useUsuarioLogado() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    Cookies.remove("imperio_session");
    setUsuario(null);

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const fetchUsuario = useCallback(async () => {
    try {
      setLoading(true);

      const token = Cookies.get("imperio_session");

      if (!token) {
        setUsuario(null);
        return;
      }

      const response = await api.get("/me", {
        withCredentials: true,
      });

      const usuarioAPI =
        response.data?.dados?.usuario ||
        response.data?.usuario ||
        response.data?.dados ||
        null;

      setUsuario(usuarioAPI);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        logout();
        return;
      }

      setUsuario(null);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchUsuario();
  }, [fetchUsuario]);

  return {
    usuario,
    setUsuario,
    fetchUsuario,
    logout,
    loading,
  };
}