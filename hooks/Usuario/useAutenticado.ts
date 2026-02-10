'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  nivel_id: number;
}

export default function useAutenticado(niveisPermitidos: number[] = []) {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verificar() {
      try {
        const res = await api.get("/me", {
          withCredentials: true,
        });

        const user: Usuario = res.data.dados.usuario;

        // 🔐 BLOQUEIO POR NÍVEL
        if (
          niveisPermitidos.length > 0 &&
          !niveisPermitidos.includes(user.nivel_id)
        ) {
          router.replace("/login");
          return;
        }

        setUsuario(user);
      } catch (error) {
        // 🚫 NÃO LOGADO → LOGIN
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    verificar();
  }, [router, niveisPermitidos]);

  return { usuario, loading };
}
