"use client";

import api from "@/Api/conectar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
};

export default function ProtegePainel({ children }: Props) {
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    async function verificar() {
      try {
        const response = await api.get("/painel/verificar", {
          withCredentials: true,
        });

        const permitido =
          response.data?.dados?.permitido ??
          response.data?.permitido ??
          false;

        if (!permitido) {
          router.replace("/");
          return;
        }

        setLiberado(true);
      } catch {
        router.replace("/");
      }
    }

    verificar();
  }, [router]);

  if (!liberado) {
    return null;
  }

  return <>{children}</>;
}