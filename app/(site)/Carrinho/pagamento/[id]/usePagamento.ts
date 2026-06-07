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

type FormDataCartao = {
  token?: string;
  payment_method_id?: string;
  issuer_id?: string | number;
  installments?: number;
  payer?: {
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
  };
};

function extrairDados<T = any>(payload: any): T {
  return payload?.dados ?? payload;
}

function extrairPedido(payload: any): Pedido | null {
  return (
    payload?.dados?.pedido ??
    payload?.pedido ??
    payload?.dados ??
    null
  );
}

function extrairUsuario(payload: any): Usuario | null {
  return (
    payload?.dados?.usuario ??
    payload?.usuario ??
    payload?.dados ??
    null
  );
}

function limparCpf(cpf?: string | number | null) {
  return String(cpf ?? "").replace(/\D/g, "");
}

function isPagamentoAprovado(status?: string | null) {
  const statusNormalizado = String(status ?? "").toLowerCase();

  return (
    statusNormalizado.includes("approved") ||
    statusNormalizado.includes("aprovado") ||
    statusNormalizado.includes("paid") ||
    statusNormalizado.includes("pago")
  );
}

function traduzirStatusDetail(statusDetail?: string | null) {
  const status = String(statusDetail ?? "");

  const mensagens: Record<string, string> = {
    cc_rejected_high_risk:
      "Pagamento recusado por alto risco. Tente outro cartão ou use PIX.",
    cc_rejected_bad_filled_card_number:
      "Número do cartão inválido.",
    cc_rejected_bad_filled_date:
      "Data de validade inválida.",
    cc_rejected_bad_filled_security_code:
      "Código de segurança inválido.",
    cc_rejected_insufficient_amount:
      "Saldo insuficiente.",
    cc_rejected_call_for_authorize:
      "O banco recusou. Autorize com o banco ou tente outro cartão.",
    cc_rejected_other_reason:
      "Pagamento recusado. Tente outro cartão ou use PIX.",
  };

  return mensagens[status] ?? `Pagamento recusado: ${status}`;
}

export function usePagamento({ pedidoId }: UsePagamentoProps) {
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);

  const [loadingCartao, setLoadingCartao] = useState(false);

  const statusPagamento = useMemo(() => {
    const status = String(
      pedido?.status_pagamento ?? pedido?.status ?? ""
    ).toLowerCase();

    const aprovado = isPagamentoAprovado(status);

    return {
      aprovado,
      status,
      label: aprovado ? "Pagamento aprovado" : "Pagamento pendente",
      descricao: aprovado
        ? "Seu pagamento foi confirmado."
        : "Aguardando confirmação do pagamento.",
    };
  }, [pedido]);

  async function carregarPedido() {
    if (!pedidoId) {
      setLoading(false);
      return;
    }

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

      setPedido(extrairPedido(pedidoRes.data));
      setUsuario(extrairUsuario(meRes.data));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar pedido");
      setPedido(null);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          cpf: limparCpf(usuario.cpf),
        },
        { withCredentials: true }
      );

      const dados = extrairDados<any>(res.data);

      const qr =
        dados?.pix?.qr_code ??
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

      const mensagem =
        err?.response?.data?.mensagem ||
        err?.response?.data?.erro ||
        err?.response?.data?.message ||
        "Erro ao gerar PIX";

      toast.error(mensagem);
    } finally {
      setLoadingPix(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);

    setCopiado(true);
    toast.success("Código copiado");

    window.setTimeout(() => setCopiado(false), 1600);
  }

  async function verificarPagamento() {
    try {
      if (!pedidoId) {
        toast.error("Pedido não encontrado");
        return null;
      }

      const res = await InicioApi.post<ApiVerificarPagamentoResponse>(
        "/mercado/pagamento/verificar",
        { id_pedido: Number(pedidoId) },
        { withCredentials: true }
      );

      const dados = extrairDados<any>(res.data);

      const pedidoAtual =
        dados?.pedido ??
        res.data?.pedido ??
        null;

      if (pedidoAtual) {
        setPedido(pedidoAtual);

        const status = String(
          pedidoAtual?.status_pagamento ?? pedidoAtual?.status ?? ""
        ).toLowerCase();

        if (isPagamentoAprovado(status)) {
          toast.success("Pagamento confirmado!");
          router.push(`/pedido-confirmado/${pedidoId}`);
        } else {
          toast.info("Pagamento ainda pendente");
        }

        return pedidoAtual;
      }

      const status = String(dados?.status ?? "").toLowerCase();

      if (isPagamentoAprovado(status)) {
        toast.success("Pagamento confirmado!");
        await carregarPedido();
        router.push(`/pedido-confirmado/${pedidoId}`);
      } else {
        toast.info("Pagamento ainda pendente");
        await carregarPedido();
      }

      return dados;
    } catch (err) {
      console.error(err);
      toast.error("Erro ao verificar pagamento");
      return null;
    }
  }

  async function pagarComCartao(formData: FormDataCartao) {
    try {
      setLoadingCartao(true);

      if (!pedido?.id_pedido || !usuario?.id_usuario) {
        toast.error("Dados do pedido ou usuário não encontrados.");
        return;
      }

      if (!formData?.token || !formData?.payment_method_id) {
        toast.error(
          "Dados do cartão incompletos. Confira nome, CPF, validade e CVV."
        );
        return;
      }

      const response = await InicioApi.post(
        "/mercado/pagamento/cartao",
        {
          id_pedido: Number(pedido.id_pedido),
          usuario_id: Number(usuario.id_usuario),
          valor: Number(pedido.valor_total ?? 0),

          token: formData.token,
          payment_method_id: formData.payment_method_id,
          issuer_id: formData.issuer_id,
          parcelas: Number(formData.installments ?? 1),

          payer: {
            email: formData.payer?.email ?? usuario.email,
            identification: {
              type: formData.payer?.identification?.type ?? "CPF",
              number: limparCpf(
                formData.payer?.identification?.number ?? usuario.cpf
              ),
            },
          },
        },
        {
          withCredentials: true,
        }
      );

      const dados = extrairDados<any>(response.data);

      const status = String(dados?.status ?? "").toLowerCase();
      const statusDetail = dados?.status_detail;

      if (status === "approved") {
        toast.success("Pagamento aprovado!");
        router.push(`/pedido-confirmado/${pedido.id_pedido}`);
        return;
      }

      if (status === "in_process" || status === "pending") {
        toast.info("Pagamento em análise. Aguarde a confirmação.");
        await carregarPedido();
        return;
      }

      if (status === "rejected") {
        toast.error(traduzirStatusDetail(statusDetail));
        await carregarPedido();
        return;
      }

      toast.info("Pagamento enviado. Verifique o status do pedido.");
      await carregarPedido();
    } catch (error: any) {
      const mpErro =
        error?.response?.data?.mercadopago?.message ||
        error?.response?.data?.mercadopago?.error;

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        mpErro ||
        "Não foi possível processar o pagamento. Tente novamente ou use PIX.";

      toast.error(mensagem);
    } finally {
      setLoadingCartao(false);
    }
  }

  return {
    pedido,
    usuario,
    loading,

    pixCode,
    copiado,
    loadingPix,

    loadingCartao,

    statusPagamento,

    carregarPedido,
    gerarPix,
    copiarPix,
    verificarPagamento,
    pagarComCartao,
  };
}