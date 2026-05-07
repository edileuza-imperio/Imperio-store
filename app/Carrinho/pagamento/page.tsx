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
};

type UsuarioResponse = {
  usuario: Usuario;
};

type PixResponse = {
  pix: {
    qr_code: string;
    qr_code_base64: string;
    ticket_url?: string;
  };
};

/* =========================
   COMPONENTE
========================= */

export default function PagamentoPage() {
  const [metodo, setMetodo] = useState<"pix" | "cartao">("pix");
  const [loading, setLoading] = useState(false);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pixData, setPixData] = useState<PixResponse["pix"] | null>(null);

  const [cartao, setCartao] = useState({
    nome: "",
    numero: "",
    validade: "",
    cvv: "",
  });

  /* =========================
     CARREGAR USUÁRIO
  ========================= */

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const response = await InicioApi.get<UsuarioResponse>("/me", {
          withCredentials: true,
        });

        const dados = response.data.usuario;

        setUsuario(dados);

        setCartao((prev) => ({
          ...prev,
          nome: `${dados?.nome || ""} ${dados?.sobrenome || ""}`,
        }));
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }

    carregarUsuario();
  }, []);

  /* =========================
     PAGAMENTO PIX
  ========================= */

  async function pagarPix() {
    try {
      setLoading(true);

      const valorPedido = 199.9;

      const response = await InicioApi.post<PixResponse>(
        "/mercado/pagamento/pix",
        {
          valor: valorPedido,
          descricao: "Pedido Universo Império",
          nome: usuario?.nome || "Cliente",
          sobrenome: usuario?.sobrenome || "Checkout",
          email: usuario?.email || "",
          cpf: usuario?.cpf || "",
        },
        { withCredentials: true }
      );

      setPixData(response.data.pix);
    } catch (error: any) {
      console.error("Erro ao gerar PIX:", error?.response?.data || error);

      alert(
        error?.response?.data?.erro ||
          "Erro ao gerar pagamento PIX"
      );
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
        { ...cartao },
        { withCredentials: true }
      );

      alert("Pagamento realizado com sucesso!");
    } catch (error: any) {
      console.error("Erro cartão:", error?.response?.data || error);

      alert(
        error?.response?.data?.erro ||
          "Erro ao processar pagamento"
      );
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
                <p>Endereço confirmado</p>
              </div>
            </div>

            <div className="step completed">
              <FiTruck />
              <div>
                <strong>2. Entrega</strong>
                <p>Frete selecionado</p>
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
            <button
              className={`metodo-card ${metodo === "pix" ? "active" : ""}`}
              onClick={() => setMetodo("pix")}
            >
              PIX
            </button>

            <button
              className={`metodo-card ${metodo === "cartao" ? "active" : ""}`}
              onClick={() => setMetodo("cartao")}
            >
              Cartão
            </button>
          </div>

          {/* PIX */}
          {metodo === "pix" && (
            <div className="pagamento-card">
              <h2>Pagamento via PIX</h2>

              {!pixData && (
                <button
                  className="btn-finalizar"
                  onClick={pagarPix}
                  disabled={loading}
                >
                  {loading ? "Gerando PIX..." : "Gerar PIX"}
                </button>
              )}

              {pixData && (
                <div className="pix-box">
                  {pixData.qr_code_base64 && (
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      className="pix-image"
                    />
                  )}

                  <textarea readOnly value={pixData.qr_code} />

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

              <input
                placeholder="Nome"
                value={cartao.nome}
                onChange={(e) =>
                  setCartao({ ...cartao, nome: e.target.value })
                }
              />

              <input
                placeholder="Número"
                value={cartao.numero}
                onChange={(e) =>
                  setCartao({ ...cartao, numero: e.target.value })
                }
              />

              <input
                placeholder="Validade"
                value={cartao.validade}
                onChange={(e) =>
                  setCartao({ ...cartao, validade: e.target.value })
                }
              />

              <input
                placeholder="CVV"
                value={cartao.cvv}
                onChange={(e) =>
                  setCartao({ ...cartao, cvv: e.target.value })
                }
              />

              <button
                className="btn-finalizar"
                onClick={pagarCartao}
                disabled={loading}
              >
                {loading ? "Processando..." : "Finalizar pagamento"}
              </button>
            </div>
          )}

          <div className="voltar-box">
            <Link href="/Carrinho/entrega">
              Voltar
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}