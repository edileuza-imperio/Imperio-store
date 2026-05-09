"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast, ToastContainer } from "react-toastify";

import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import { InicioApi } from "@/services/api/api";

import {
  FiCopy,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiRefreshCw,
  FiCreditCard,
  FiSmartphone,
  FiUser,
  FiPackage,
  FiTruck,
  FiTag,
  FiShield,
} from "react-icons/fi";

import {
  ApiPedidoResponse,
  ApiPixResponse,
  ApiVerificarPagamentoResponse,
  formatarMoeda,
  normalizarNumero,
  Pedido,
  Usuario,
} from "@/components/Bibioteca/carrinho";

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();
  const redirectedRef = useRef(false);

  const pedidoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

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

    if (
      status.includes("approved") ||
      status.includes("aprovado") ||
      status.includes("paid")
    ) {
      return "approved";
    }

    return "pending";
  }, [pedido]);

  async function carregarPedido() {
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
      console.error("Erro carregar pedido:", err);
      toast.error("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pedidoId) carregarPedido();
  }, [pedidoId]);

  async function gerarPix() {
    try {
      console.group("🟣 GERAR PIX DEBUG");

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
        cpf: (usuario.cpf ?? "").replace(/\D/g, ""),
      };

      console.log("📦 Payload PIX:");
      console.table(payload);

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

      console.log("🟢 RESPOSTA PIX:", res.data);

      const qr =
        res.data?.dados?.pix?.qr_code ??
        res.data?.pix?.qr_code ??
        "";

      if (!qr) {
        console.error("PIX vazio:", res.data);
        toast.error("PIX inválido");
        return;
      }

      setPixCode(qr);
      toast.success("PIX gerado com sucesso");

      console.groupEnd();
    } catch (err: any) {
      console.group("🔴 ERRO PIX");
      console.error(err);
      console.log("STATUS:", err?.response?.status);
      console.log("DATA:", err?.response?.data);
      console.groupEnd();

      toast.error(
        err?.response?.data?.message || "Erro ao gerar PIX"
      );
    } finally {
      setLoadingPix(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    await navigator.clipboard.writeText(pixCode);
    setCopiado(true);
    toast.success("Copiado");

    setTimeout(() => setCopiado(false), 1500);
  }

  async function verificarPagamento() {
    try {
      const res =
        await InicioApi.post<ApiVerificarPagamentoResponse>(
          "/mercado/pagamento/verificar",
          { id_pedido: Number(pedidoId) },
          { withCredentials: true }
        );

      const pedidoAtual =
        res.data?.dados?.pedido ?? res.data?.pedido;

      setPedido(pedidoAtual);

      const status = String(
        pedidoAtual?.status_pagamento ?? ""
      ).toLowerCase();

      if (status.includes("approved") || status.includes("aprovado")) {
        toast.success("Pago!");
        router.push("/Pedidos");
      } else {
        toast.info("Ainda pendente");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao verificar pagamento");
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="loadingPage">
          <div className="loadingCard">
            <FiClock size={40} />
            <h2>Carregando...</h2>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="checkout">
        <ToastContainer />

        <div className="layout">
          <aside>
            <h2>PIX</h2>

            {!pixCode ? (
              <button onClick={gerarPix} disabled={loadingPix}>
                {loadingPix ? "Gerando..." : "Gerar PIX"}
                <FiRefreshCw />
              </button>
            ) : (
              <>
                <QRCodeCanvas value={pixCode} size={220} />

                <textarea value={pixCode} readOnly />

                <button onClick={copiarPix}>
                  <FiCopy />
                  {copiado ? "Copiado" : "Copiar"}
                </button>

                <button onClick={verificarPagamento}>
                  <FiCheckCircle />
                  Já paguei
                </button>
              </>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}