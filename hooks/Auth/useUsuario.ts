'use client';

import { useEffect, useState } from "react";
import { buscarUsuarioAutenticado } from "@/services/usuarioService";

/**
 * Interface REAL do usuário autenticado
 * (tem que bater com o backend)
 */
export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  nivel_id: number;
  statusid: number;
  criado: string;
  atualizado: string;
}

export default function useUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarUsuario = async () => {
      const user = await buscarUsuarioAutenticado();

      // 👇 garante que só seta se vier algo válido
      if (user) {
        setUsuario(user as Usuario);
      } else {
        setUsuario(null);
      }

      setLoading(false);
    };

    carregarUsuario();
  }, []);

  return {
    usuario,
    loading,
    logado: !!usuario,
  };
}
