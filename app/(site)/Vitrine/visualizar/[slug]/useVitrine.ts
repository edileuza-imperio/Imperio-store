"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

type ApiResposta<T = unknown> = {
  status?: number;
  mensagem?: string;
  dados?: T;
};

type CarrinhoPayload = {
  mensagem?: string;
  erro?: string;
  carrinho?: unknown;
  item?: unknown;
  produto_id?: number;
  quantidade?: number;
};

type RespostaCarrinho = {
  status?: number;
  mensagem?: string;
  dados?: CarrinhoPayload;
};

function normalizarRespostaCarrinho(
  payload: ApiResposta<CarrinhoPayload>
): RespostaCarrinho {
  const dados = payload?.dados || {};

  return {
    status: payload?.status,
    mensagem:
      dados?.mensagem ||
      dados?.erro ||
      payload?.mensagem ||
      "Operação realizada com sucesso.",
    dados,
  };
}

function extrairMensagemErro(error: unknown, fallback = "Erro inesperado.") {
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const anyError = error as any;
    const status = anyError?.response?.status;
    const data = anyError?.response?.data;

    if (status === 401) {
      return "Você precisa fazer login para continuar.";
    }

    return (
      data?.dados?.erro ||
      data?.dados?.mensagem ||
      data?.erro ||
      data?.mensagem ||
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

      const response = await api.post<ApiResposta<CarrinhoPayload>>(
        "/carrinho/adicionar",
        {
          produto_id: produtoId,
          quantidade,
        },
        {
          withCredentials: true,
        }
      );

      return normalizarRespostaCarrinho(response.data);
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

      const response = await api.post<ApiResposta<CarrinhoPayload>>(
        "/carrinho/adicionar",
        {
          produto_id: produtoId,
          quantidade,
        },
        {
          withCredentials: true,
        }
      );

      return normalizarRespostaCarrinho(response.data);
    } catch (error) {
      throw new Error(
        extrairMensagemErro(error, "Não foi possível comprar agora.")
      );
    } finally {
      setLoadingComprar(false);
    }
  }

  function irParaLogin() {
    router.push("/login");
  }

  function irParaCarrinho() {
    router.push("/Carrinho");
  }

  return {
    loadingCarrinho,
    loadingComprar,
    adicionarAoCarrinho,
    comprarAgora,
    irParaLogin,
    irParaCarrinho,
  };
}