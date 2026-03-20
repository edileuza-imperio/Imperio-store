"use client";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { useEffect, useState, useCallback } from "react";

export type Usuario = {
  id_usuario?: number;
  nome?: string;
  email?: string;
  nivel_id?: number;
  status_id?: number;
};

export default function useUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarUsuario = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(rotas.auth.me, {
        withCredentials: true,
      });

      const data = response?.data;

      const user =
        data?.dados?.usuario ??
        data?.dados ??
        data?.usuario ??
        null;

      setUsuario(user);
    } catch (error: any) {
      console.error("Erro ao buscar usuário:", error?.response?.data || error);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuario();
  }, [carregarUsuario]);

  return {
    usuario,
    loading,
    logado: !!usuario,
    recarregarUsuario: carregarUsuario,
    isSistema: usuario?.nivel_id === 1,
    isAdministrador: usuario?.nivel_id === 2,
    isCliente: usuario?.nivel_id === 3,
    isAdmin: usuario?.nivel_id === 1 || usuario?.nivel_id === 2,
  };
}