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

type PaymentTypeId = "credit_card" | "debit_card" | string;

type FormDataCartao = {
  token?: string;

  payment_method_id?: string;
  paymentMethodId?: string;

  payment_type_id?: PaymentTypeId;
  paymentTypeId?: PaymentTypeId;

  issuer_id?: string | number;
  issuerId?: string | number;

  installments?: number;
  parcelas?: number;

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

function normalizarStatus(status?: string | null) {
  return String(status ?? "").toLowerCase().trim();
}

function isPagamentoAprovado(status?: string | null) {
  const statusNormalizado = normalizarStatus(status);

  return (
    statusNormalizado === "approved" ||
    statusNormalizado === "aprovado" ||
    statusNormalizado === "paid" ||
    statusNormalizado === "pago"
  );
}

function isPagamentoPendente(status?: string | null) {
  const statusNormalizado = normalizarStatus(status);

  return (
    statusNormalizado === "pending" ||
    statusNormalizado === "pendente"
  );
}

function isPagamentoAnalise(status?: string | null) {
  const statusNormalizado = normalizarStatus(status);

  return (
    statusNormalizado === "in_process" ||
    statusNormalizado === "em_analise"
  );
}

function isPagamentoRecusado(status?: string | null) {
  const statusNormalizado = normalizarStatus(status);

  return (
    statusNormalizado === "rejected" ||
    statusNormalizado === "recusado"
  );
}

function traduzirStatusDetail(statusDetail?: string | null) {
  const status = String(statusDetail ?? "");

  const mensagens: Record<string, string> = {
    pending_review_manual:
      "Pagamento em análise manual pelo Mercado Pago.",

    cc_rejected_high_risk:
      "Pagamento recusado por segurança do Mercado Pago. Tente outro cartão ou use PIX.",

    cc_rejected_bad_filled_card_number:
      "Número do cartão inválido.",

    cc_rejected_bad_filled_date:
      "Data de validade inválida.",

    cc_rejected_bad_filled_security_code:
      "Código de segurança inválido.",

    cc_rejected_bad_filled_other:
      "Algum dado do cartão está incorreto.",

    cc_rejected_insufficient_amount:
      "Cartão sem limite ou saldo suficiente.",

    cc_rejected_call_for_authorize:
      "O banco recusou. Autorize com o banco ou tente outro cartão.",

    cc_rejected_card_disabled:
      "Cartão desabilitado. Entre em contato com o banco.",

    cc_rejected_duplicated_payment:
      "Pagamento duplicado detectado.",

    cc_rejected_max_attempts:
      "Limite de tentativas excedido.",

    cc_rejected_other_reason:
      "Pagamento recusado. Tente outro cartão ou use PIX.",
  };

  return mensagens[status] ?? `Pagamento não aprovado: ${status || "motivo não informado"}`;
}

function traduzirTipoPagamento(paymentTypeId?: string | null) {
  const tipo = String(paymentTypeId ?? "").toLowerCase();

  if (tipo === "debit_card") return "Cartão de débito";
  if (tipo === "credit_card") return "Cartão de crédito";

  return "Cartão";
}

function getPaymentMethodId(formData: FormDataCartao) {
  return formData.payment_method_id ?? formData.paymentMethodId ?? "";
}

function getPaymentTypeId(formData: FormDataCartao): PaymentTypeId {
  return (
    formData.payment_type_id ??
    formData.paymentTypeId ??
    "credit_card"
  );
}

function getIssuerId(formData: FormDataCartao) {
  return formData.issuer_id ?? formData.issuerId ?? null;
}

function getInstallments(formData: FormDataCartao) {
  return Number(formData.installments ?? formData.parcelas ?? 1);
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
    const status = normalizarStatus(
      pedido?.status_pagamento ?? pedido?.status ?? ""
    );

    const aprovado = isPagamentoAprovado(status);
    const analise = isPagamentoAnalise(status);
    const recusado = isPagamentoRecusado(status);
    const pendente = isPagamentoPendente(status);

    let label = "Pagamento pendente";
    let descricao = "Aguardando confirmação do pagamento.";

    if (aprovado) {
      label = "Pagamento aprovado";
      descricao = "Seu pagamento foi confirmado.";
    } else if (analise) {
      label = "Pagamento em análise";
      descricao = "O Mercado Pago está analisando o pagamento.";
    } else if (recusado) {
      label = "Pagamento recusado";
      descricao = "O pagamento foi recusado. Tente outro cartão ou use PIX.";
    } else if (pendente) {
      label = "Pagamento pendente";
      descricao = "Aguardando confirmação do pagamento.";
    }

    return {
      aprovado,
      analise,
      recusado,
      pendente,
      status,
      label,
      descricao,
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

        const status = normalizarStatus(
          pedidoAtual?.status_pagamento ?? pedidoAtual?.status ?? ""
        );

        if (isPagamentoAprovado(status)) {
          toast.success("Pagamento confirmado!");
          router.push(`/pedido-confirmado/${pedidoId}`);
        } else if (isPagamentoAnalise(status)) {
          toast.info("Pagamento em análise pelo Mercado Pago.");
        } else if (isPagamentoRecusado(status)) {
          toast.error("Pagamento recusado. Tente outro cartão ou use PIX.");
        } else {
          toast.info("Pagamento ainda pendente");
        }

        return pedidoAtual;
      }

      const status = normalizarStatus(dados?.status);
      const statusDetail = dados?.status_detail;

      if (isPagamentoAprovado(status)) {
        toast.success("Pagamento confirmado!");
        await carregarPedido();
        router.push(`/pedido-confirmado/${pedidoId}`);
      } else if (isPagamentoAnalise(status)) {
        toast.info("Pagamento em análise pelo Mercado Pago.");
        await carregarPedido();
      } else if (isPagamentoRecusado(status)) {
        toast.error(traduzirStatusDetail(statusDetail));
        await carregarPedido();
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

      const paymentMethodId = getPaymentMethodId(formData);
      const paymentTypeId = getPaymentTypeId(formData);
      const issuerId = getIssuerId(formData);

      const installments =
        paymentTypeId === "debit_card"
          ? 1
          : getInstallments(formData);

      console.log("DADOS MERCADO PAGO CARD:", {
        token: !!formData?.token,
        payment_method_id: paymentMethodId,
        payment_type_id: paymentTypeId,
        issuer_id: issuerId,
        installments,
        payer: formData?.payer,
      });

      if (!formData?.token || !paymentMethodId) {
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
          payment_method_id: paymentMethodId,
          payment_type_id: paymentTypeId,
          issuer_id: issuerId,
          parcelas: installments,

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

      const status = normalizarStatus(dados?.status);
      const statusDetail = dados?.status_detail;
      const tipoCartao =
        dados?.tipo_cartao ??
        traduzirTipoPagamento(dados?.payment_type_id ?? paymentTypeId);

      if (isPagamentoAprovado(status)) {
        toast.success(`${tipoCartao} aprovado!`);
        router.push(`/pedido-confirmado/${pedido.id_pedido}`);
        return;
      }

      if (isPagamentoAnalise(status) || isPagamentoPendente(status)) {
        toast.info(`${tipoCartao} em análise. Aguarde a confirmação.`);
        await carregarPedido();
        return;
      }

      if (isPagamentoRecusado(status)) {
        toast.error(
          dados?.motivo ??
            traduzirStatusDetail(statusDetail)
        );
        await carregarPedido();
        return;
      }

      toast.info("Pagamento enviado. Verifique o status do pedido.");
      await carregarPedido();
    } catch (error: any) {
      console.error(error);

      const mpErro =
        error?.response?.data?.mercadopago?.message ||
        error?.response?.data?.mercadopago?.error;

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.motivo ||
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