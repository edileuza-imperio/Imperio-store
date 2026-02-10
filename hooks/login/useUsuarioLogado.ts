"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import api from "@/Api/conectar";

export default function useUsuarioLogado() {
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsuario = async () => {
    setLoading(true);
    const token = Cookies.get("imperio_session");
    console.log(Cookies.get("imperio_session")); // verifica se o token existe
    
    if (!token) {
      setUsuario(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/me", { withCredentials: true });
      setUsuario(res.data.dados?.usuario ?? null);
    } catch (err: any) {
      console.warn(
        "[useUsuarioLogado] Erro ao buscar usuário:",
        err?.response?.status
      );
      if (err?.response?.status === 401) logout();
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuario();
  }, []);

  const logout = () => {
    Cookies.remove("imperio_session");
    setUsuario(null);
    // Redireciona para login
    window.location.href = "/login";
  };

  return { usuario, setUsuario, fetchUsuario, logout, loading };
}
