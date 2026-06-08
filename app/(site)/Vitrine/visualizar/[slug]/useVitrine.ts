"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

type RespostaCarrinho = {
  mensagem?: string;
  erro?: string;
  dados?: unknown;
};

function extrairMensagemErro(error: unknown, fallback = "Erro inesperado.") {
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const anyError = error as any;

    return (
      anyError?.response?.data?.erro ||
      anyError?.response?.data?.mensagem ||
      anyError?.message ||
      fallback
    );
  }

  return fallback;
}

export function useVitrine() {
  const router = useRouter();

  const [loadingCarrinho, setLoadingCarrinho] = useState(false);
  const [loadingComprar, setLoadingComprar] = useState(false);

  async function adicionarAoCarrinho(produtoId: number, quantidade = 1) {
    if (!produtoId || Number.isNaN(produtoId)) {
      throw new Error("Produto inválido.");
    }

    try {
      setLoadingCarrinho(true);

      const response = await api.post<RespostaCarrinho>("/carrinho/adicionar", {
        produto_id: produtoId,
        quantidade,
      });

      return response.data;
    } catch (error) {
      throw new Error(
        extrairMensagemErro(error, "Não foi possível adicionar ao carrinho.")
      );
    } finally {
      setLoadingCarrinho(false);
    }
  }

  async function comprarAgora(produtoId: number, quantidade = 1) {
    if (!produtoId || Number.isNaN(produtoId)) {
      throw new Error("Produto inválido.");
    }

    try {
      setLoadingComprar(true);

      const response = await api.post<RespostaCarrinho>("/carrinho/adicionar", {
        produto_id: produtoId,
        quantidade,
      });

      router.push("/Carrinho");

      return response.data;
    } catch (error) {
      throw new Error(
        extrairMensagemErro(error, "Não foi possível comprar agora.")
      );
    } finally {
      setLoadingComprar(false);
    }
  }

  return {
    loadingCarrinho,
    loadingComprar,
    adicionarAoCarrinho,
    comprarAgora,
  };
}