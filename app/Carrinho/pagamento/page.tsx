"use client";

import "./pagamento.css";

import { useEffect, useState } from "react";
import Link from "next/link";

import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";

import {
  FiTruck,
  FiCreditCard,
  FiCheckCircle,
  FiCopy,
} from "react-icons/fi";

import { InicioApi } from "@/services/api/api";

/* =========================
   TIPOS
========================= */

type Usuario = {
  id_usuario?: number;
  nome?: string;
  sobrenome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
};

type PixResponse = {
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
};

type ApiResponse = {
  usuario?: Usuario;

  pix?: PixResponse;

  dados?: {
    usuario?: Usuario;
    pix?: PixResponse;
  };

  [key: string]: any;
};

export default function PagamentoPage() {
  const [metodo, setMetodo] = useState<"pix" | "cartao">("pix");
  const [loading, setLoading] = useState(false);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pixData, setPixData] = useState<PixResponse | null>(null);

  const [cartao, setCartao] = useState({
    nome: "",
    numero: "",
    validade: "",
    cvv: "",
  });

  /* =========================
     USUÁRIO LOGADO
  ========================= */

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const response = await InicioApi.get<ApiResponse>("/me", {
          withCredentials: true,
        });

        console.log("📦 /me RAW:", response.data);

        const dados =
          response.data?.usuario ||
          response.data?.dados?.usuario ||
          response.data;

        console.log("👤 USUÁRIO EXTRAÍDO:", dados);

        if (!dados || typeof dados !== "object") return;

        const usuarioFormatado: Usuario = {
          id_usuario: dados.id_usuario,
          nome: dados.nome,
          sobrenome: dados.sobrenome,
          email: dados.email,
          cpf: dados.cpf,
          telefone: dados.telefone,
        };

        setUsuario(usuarioFormatado);

        setCartao((prev) => ({
          ...prev,
          nome: `${usuarioFormatado.nome || ""} ${usuarioFormatado.sobrenome || ""}`,
        }));
      } catch (error) {
        console.error("❌ ERRO AO CARREGAR USUÁRIO:", error);
      }
    }

    carregarUsuario();
  }, []);

  /* =========================
     PIX
  ========================= */

  async function pagarPix() {
    try {
      setLoading(true);

      const payload = {
        valor: 199.9,
        descricao: "Pedido Universo Império",

        nome: usuario?.nome || "Cliente",
        sobrenome: usuario?.sobrenome || "Checkout",
        email: usuario?.email || "",
        cpf: usuario?.cpf || "",
      };

      console.log("📤 PIX PAYLOAD:", payload);

      const response = await InicioApi.post<ApiResponse>(
        "/mercado/pagamento/pix",
        payload,
        { withCredentials: true }
      );

      console.log("📥 PIX RESPONSE:", response.data);

      const pix =
        response.data?.pix ||
        response.data?.dados?.pix ||
        null;

      console.log("💰 PIX FINAL:", pix);

      setPixData(pix);
    } catch (error: any) {
      console.error("❌ ERRO PIX:", error?.response?.data || error);

      alert(error?.response?.data?.erro || "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     CARTÃO
  ========================= */

  async function pagarCartao() {
    try {
      setLoading(true);

      await InicioApi.post(
        "/mercado/pagamento/cartao",
        cartao,
        { withCredentials: true }
      );

      alert("Pagamento realizado com sucesso!");
    } catch (error: any) {
      console.error("❌ ERRO CARTÃO:", error?.response?.data || error);

      alert("Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     COPIAR PIX
  ========================= */

  async function copiarPix() {
    if (!pixData?.qr_code) return;

    await navigator.clipboard.writeText(pixData.qr_code);

    alert("PIX copiado!");
  }

  /* =========================
     UI
  ========================= */

  return (
    <>
      <Navbar />

      <main className="pagamento-page">
        <div className="pagamento-container">

          {/* HEADER */}
          <div className="pagamento-header">
            <h1>Pagamento</h1>
            <p>Escolha como deseja pagar seu pedido.</p>
          </div>

          {/* STEPS */}
          <div className="checkout-steps">
            <div className="step completed">
              <FiCheckCircle />
              <div>
                <strong>1. Endereço</strong>
                <p>Confirmado</p>
              </div>
            </div>

            <div className="step completed">
              <FiTruck />
              <div>
                <strong>2. Entrega</strong>
                <p>Selecionada</p>
              </div>
            </div>

            <div className="step active">
              <FiCreditCard />
              <div>
                <strong>3. Pagamento</strong>
                <p>Finalizar pedido</p>
              </div>
            </div>
          </div>

          {/* MÉTODOS */}
          <div className="pagamento-metodos">
            <button onClick={() => setMetodo("pix")}>
              PIX
            </button>

            <button onClick={() => setMetodo("cartao")}>
              Cartão
            </button>
          </div>

          {/* PIX */}
          {metodo === "pix" && (
            <div className="pagamento-card">
              <h2>PIX</h2>

              {!pixData && (
                <button onClick={pagarPix} disabled={loading}>
                  {loading ? "Gerando PIX..." : "Gerar PIX"}
                </button>
              )}

              {pixData && (
                <div>
                  <textarea readOnly value={pixData.qr_code || ""} />

                  <button onClick={copiarPix}>
                    <FiCopy /> Copiar PIX
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CARTÃO */}
          {metodo === "cartao" && (
            <div className="pagamento-card">
              <h2>Cartão de Crédito</h2>

              <button onClick={pagarCartao} disabled={loading}>
                Finalizar pagamento
              </button>
            </div>
          )}

          <Link href="/Carrinho/entrega">
            Voltar
          </Link>

        </div>
      </main>

      <Footer />
    </>
  );
}