"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast, ToastContainer } from "react-toastify";

import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import { InicioApi } from "@/services/api/api";

import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiCreditCard,
  FiPackage,
  FiRefreshCw,
  FiShield,
  FiSmartphone,
  FiTag,
  FiTruck,
  FiUser,
} from "react-icons/fi";

import {
  ApiPedidoResponse,
  ApiPixResponse,
  ApiVerificarPagamentoResponse,
  formatarMoeda,
  Pedido,
  Usuario,
} from "@/components/Bibioteca/carrinho";

type StatusPagamentoInfo = {
  chave: "approved" | "pending" | "failed" | "unknown";
  label: string;
  badgeClassName: string;
  descricao: string;
};

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const pedidoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);

  const valorTotal = Number(pedido?.valor_total ?? 0);

  const statusPagamento = useMemo<StatusPagamentoInfo>(() => {
    const status = String(
      pedido?.status_pagamento ?? pedido?.status ?? ""
    ).toLowerCase();

    if (
      status.includes("approved") ||
      status.includes("aprovado") ||
      status.includes("paid") ||
      status.includes("pago")
    ) {
      return {
        chave: "approved",
        label: "Pago",
        descricao: "Pagamento confirmado com sucesso.",
        badgeClassName:
          "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20",
      };
    }

    if (
      status.includes("rejected") ||
      status.includes("recusado") ||
      status.includes("canceled") ||
      status.includes("cancelado")
    ) {
      return {
        chave: "failed",
        label: "Recusado",
        descricao: "O pagamento não foi concluído.",
        badgeClassName:
          "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20",
      };
    }

    if (status) {
      return {
        chave: "pending",
        label: "Pendente",
        descricao: "Aguardando confirmação do pagamento.",
        badgeClassName:
          "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/20",
      };
    }

    return {
      chave: "unknown",
      label: "Aguardando",
      descricao: "Ainda não foi possível identificar o status.",
      badgeClassName:
        "bg-slate-500/15 text-slate-700 ring-1 ring-slate-500/20",
    };
  }, [pedido]);

  async function carregarPedido() {
    try {
      if (!pedidoId) {
        toast.error("Pedido inválido");
        router.push("/Carrinho");
        return;
      }

      setLoading(true);

      const [pedidoRes, meRes] = await Promise.all([
        InicioApi.get<ApiPedidoResponse>(`/pedido/${pedidoId}`, {
          withCredentials: true,
        }),
        InicioApi.get<ApiPedidoResponse>("/me", {
          withCredentials: true,
        }),
      ]);

      const pedidoAtual: Pedido | null =
        pedidoRes.data?.dados?.pedido ?? pedidoRes.data?.pedido ?? null;

      const usuarioAtual: Usuario | null =
        meRes.data?.dados?.usuario ?? meRes.data?.usuario ?? null;

      setPedido(pedidoAtual);
      setUsuario(usuarioAtual);
    } catch (err) {
      console.error("Erro ao carregar pedido:", err);
      toast.error("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pedidoId) carregarPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  async function gerarPix() {
    try {
      if (!pedido || !usuario) {
        toast.warning("Dados ainda carregando");
        return;
      }

      const payload = {
        id_pedido: Number(pedido.id_pedido),
        usuario_id: Number(usuario.id_usuario),
        valor: Number(pedido.valor_total ?? 0),
        email: usuario.email,
        nome: usuario.nome,
        cpf: String(usuario.cpf ?? "").replace(/\D/g, ""),
      };

      if (!payload.id_pedido || !payload.usuario_id) {
        toast.error("Pedido inválido");
        return;
      }

      setLoadingPix(true);

      const res = await InicioApi.post<ApiPixResponse>(
        "/mercado/pagamento/pix",
        payload,
        { withCredentials: true }
      );

      const qr =
        res.data?.dados?.pix?.qr_code ?? res.data?.pix?.qr_code ?? "";

      if (!qr) {
        console.error("Resposta PIX vazia:", res.data);
        toast.error("PIX inválido");
        return;
      }

      setPixCode(qr);
      toast.success("PIX gerado com sucesso");
    } catch (err: any) {
      console.error("Erro ao gerar PIX:", err);
      toast.error(err?.response?.data?.message || "Erro ao gerar PIX");
    } finally {
      setLoadingPix(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    try {
      await navigator.clipboard.writeText(pixCode);
      setCopiado(true);
      toast.success("Copiado");

      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  async function verificarPagamento() {
    try {
      if (!pedidoId) {
        toast.error("Pedido inválido");
        return;
      }

      const res = await InicioApi.post<ApiVerificarPagamentoResponse>(
        "/mercado/pagamento/verificar",
        { id_pedido: Number(pedidoId) },
        { withCredentials: true }
      );

      const pedidoAtual: Pedido | null =
        res.data?.dados?.pedido ?? res.data?.pedido ?? null;

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
        toast.info("Ainda pendente");
      }
    } catch (err) {
      console.error("Erro ao verificar pagamento:", err);
      toast.error("Erro ao verificar pagamento");
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-[70vh] bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10">
          <div className="mx-auto flex max-w-6xl items-center justify-center">
            <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
              <div className="flex flex-col items-center gap-4 text-slate-700">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <FiClock size={32} />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">Carregando pagamento</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Estamos buscando os dados do pedido.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-[70vh] bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <ToastContainer position="top-right" autoClose={2500} />

        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              href="/Carrinho"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FiArrowLeft />
              Voltar ao carrinho
            </Link>

            <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm sm:block">
              Pedido #{pedido?.id_pedido ?? pedidoId ?? "-"}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-6 text-white sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm/6 text-slate-300">Finalização segura</p>
                    <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                      Pagamento via PIX
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300">
                      Gere o QR Code, faça o pagamento no seu banco e confirme
                      abaixo.
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${statusPagamento.badgeClassName}`}
                  >
                    {statusPagamento.label}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_1fr]">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                        <FiCreditCard />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Resumo do pedido
                        </h2>
                        <p className="text-sm text-slate-500">
                          Confira os dados antes de pagar.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm">
                      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-slate-700">
                        <span className="font-medium text-slate-500">
                          Valor total
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatarMoeda(valorTotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-slate-700">
                        <span className="font-medium text-slate-500">
                          Status
                        </span>
                        <span className="font-semibold text-slate-900">
                          {statusPagamento.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-slate-700">
                        <span className="font-medium text-slate-500">
                          Pedido
                        </span>
                        <span className="font-semibold text-slate-900">
                          #{pedido?.id_pedido ?? pedidoId ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                          <FiUser />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Cliente
                          </p>
                          <p className="font-medium text-slate-900">
                            {usuario?.nome ?? "Usuário"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                          <FiShield />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Segurança
                          </p>
                          <p className="font-medium text-slate-900">
                            Pagamento protegido
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <FiTruck />
                      Como concluir
                    </h3>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600">
                      <div className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          1
                        </span>
                        <p>Gere o PIX no painel ao lado.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          2
                        </span>
                        <p>Escaneie o QR Code ou copie o código.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          3
                        </span>
                        <p>Após pagar, clique em “Já paguei”.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                          PIX
                        </h2>
                        <p className="text-sm text-slate-500">
                          Gere seu QR Code e faça o pagamento.
                        </p>
                      </div>

                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Segue cobrança
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center">
                      {!pixCode ? (
                        <button
                          type="button"
                          onClick={gerarPix}
                          disabled={loadingPix}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <FiRefreshCw
                            className={loadingPix ? "animate-spin" : ""}
                          />
                          {loadingPix ? "Gerando PIX..." : "Gerar PIX"}
                        </button>
                      ) : (
                        <>
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                            <QRCodeCanvas value={pixCode} size={230} />
                          </div>

                          <div className="mt-5 w-full">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Código PIX
                            </label>
                            <textarea
                              value={pixCode}
                              readOnly
                              rows={5}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                            />
                          </div>

                          <div className="mt-4 grid w-full gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={copiarPix}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                              <FiCopy />
                              {copiado ? "Copiado" : "Copiar código"}
                            </button>

                            <button
                              type="button"
                              onClick={verificarPagamento}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              <FiCheckCircle />
                              Já paguei
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                        <FiSmartphone />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          Pagamento rápido
                        </h3>
                        <p className="text-sm text-slate-300">
                          Use o app do seu banco para escanear o QR.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <FiTag className="shrink-0" />
                        Confirmação automática após aprovação.
                      </div>
                      <div className="flex items-center gap-2">
                        <FiPackage className="shrink-0" />
                        O pedido só segue após o pagamento.
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                        Status atual
                      </p>
                      <p className="mt-2 text-base font-semibold">
                        {statusPagamento.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {statusPagamento.descricao}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}