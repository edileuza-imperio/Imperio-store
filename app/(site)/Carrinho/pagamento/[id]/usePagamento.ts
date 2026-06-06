"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { InicioApi } from "@/services/api/api";

import {
  ApiPedidoResponse,
  ApiPixResponse,
  ApiVerificarPagamentoResponse,
  Pedido,
  Usuario,
} from "@/components/Bibioteca/carrinho";

type UsePagamentoProps = {
  pedidoId?: string;
};

export function usePagamento({ pedidoId }: UsePagamentoProps) {
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);

  const statusPagamento = useMemo(() => {
    const status = String(
      pedido?.status_pagamento ?? pedido?.status ?? ""
    ).toLowerCase();

    const aprovado =
      status.includes("approved") ||
      status.includes("aprovado") ||
      status.includes("paid") ||
      status.includes("pago");

    return {
      aprovado,
      label: aprovado ? "Pagamento aprovado" : "Pagamento pendente",
      descricao: aprovado
        ? "Seu pagamento foi confirmado."
        : "Aguardando confirmação do pagamento.",
    };
  }, [pedido]);

  async function carregarPedido() {
    if (!pedidoId) return;

    try {
      setLoading(true);

      const [pedidoRes, meRes] = await Promise.all([
        InicioApi.get<ApiPedidoResponse>(`/pedido/${pedidoId}`, {
          withCredentials: true,
        }),
        InicioApi.get<ApiPedidoResponse>("/me", {
          withCredentials: true,
        }),
      ]);

      setPedido(
        pedidoRes.data?.dados?.pedido ??
          pedidoRes.data?.pedido ??
          null
      );

      setUsuario(
        meRes.data?.dados?.usuario ??
          meRes.data?.usuario ??
          null
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPedido();
  }, [pedidoId]);

  async function gerarPix() {
    try {
      if (!pedido || !usuario) {
        toast.warning("Dados ainda carregando");
        return;
      }

      setLoadingPix(true);

      const res = await InicioApi.post<ApiPixResponse>(
        "/mercado/pagamento/pix",
        {
          id_pedido: Number(pedido.id_pedido),
          usuario_id: Number(usuario.id_usuario),
          valor: Number(pedido.valor_total ?? 0),
          email: usuario.email,
          nome: usuario.nome,
          cpf: String(usuario.cpf ?? "").replace(/\D/g, ""),
        },
        { withCredentials: true }
      );

      const qr =
        res.data?.dados?.pix?.qr_code ??
        res.data?.pix?.qr_code ??
        "";

      if (!qr) {
        toast.error("PIX inválido");
        return;
      }

      setPixCode(qr);
      toast.success("PIX gerado com sucesso");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Erro ao gerar PIX");
    } finally {
      setLoadingPix(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);

    setCopiado(true);
    toast.success("Código copiado");

    setTimeout(() => setCopiado(false), 1600);
  }

  async function verificarPagamento() {
    try {
      const res = await InicioApi.post<ApiVerificarPagamentoResponse>(
        "/mercado/pagamento/verificar",
        { id_pedido: Number(pedidoId) },
        { withCredentials: true }
      );

      const pedidoAtual =
        res.data?.dados?.pedido ??
        res.data?.pedido ??
        null;

      setPedido(pedidoAtual);

      const status = String(
        pedidoAtual?.status_pagamento ?? pedidoAtual?.status ?? ""
      ).toLowerCase();

      if (
        status.includes("approved") ||
        status.includes("aprovado") ||
        status.includes("paid") ||
        status.includes("pago")
      ) {
        toast.success("Pagamento confirmado!");
        router.push("/Pedidos");
      } else {
        toast.info("Pagamento ainda pendente");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao verificar pagamento");
    }
  }

  return {
    pedido,
    usuario,
    loading,
    pixCode,
    copiado,
    loadingPix,
    statusPagamento,
    gerarPix,
    copiarPix,
    verificarPagamento,
  };
}