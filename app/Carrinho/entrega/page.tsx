"use client";

import "./entrega.css";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FiMapPin,
  FiTruck,
  FiCreditCard,
  FiCheckCircle,
  FiArrowLeft,
  FiShield,
  FiClock,
} from "react-icons/fi";

export default function EntregaPage() {
  const router = useRouter();

  const [enderecoId, setEnderecoId] = useState<string | null>(null);
  const [entregaSelecionada, setEntregaSelecionada] = useState<"padrao" | "expressa">("padrao");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const endereco = localStorage.getItem("checkout_endereco_id");
    setEnderecoId(endereco);
  }, []);

  function continuarPagamento() {
    if (!enderecoId) {
      toast.warning("Selecione um endereço antes de continuar.");
      return;
    }

    try {
      setLoading(true);

      localStorage.setItem("checkout_entrega", entregaSelecionada);

      toast.success("Entrega selecionada com sucesso.");

      setTimeout(() => {
        router.push("/Carrinho/pagamento");
      }, 500);
    } catch (error) {
      console.error("Erro ao avançar para pagamento:", error);
      toast.error("Não foi possível continuar para pagamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="checkout-page">
      <div className="checkout-bg blur-1" />
      <div className="checkout-bg blur-2" />

      <div className="checkout-container">
        <section className="checkout-hero">
          <div className="hero-badge">
            <FiShield />
            Ambiente seguro
          </div>

          <h1>Entrega</h1>
          <p>Escolha o método de envio do seu pedido com rapidez e segurança.</p>
        </section>

        <section className="checkout-steps">
          <div className="step completed">
            <div className="step-icon">
              <FiCheckCircle />
            </div>
            <div>
              <strong>1. Endereço</strong>
              <p>Endereço selecionado</p>
            </div>
          </div>

          <div className="step active">
            <div className="step-icon">
              <FiTruck />
            </div>
            <div>
              <strong>2. Entrega</strong>
              <p>Método de envio</p>
            </div>
          </div>

          <div className="step">
            <div className="step-icon">
              <FiCreditCard />
            </div>
            <div>
              <strong>3. Pagamento</strong>
              <p>Finalizar pedido</p>
            </div>
          </div>
        </section>

        <section className="checkout-content">
          <div className="checkout-card">
            <div className="card-header">
              <div>
                <h2>Método de entrega</h2>
                <p>Escolha a opção que melhor atende ao seu prazo.</p>
              </div>

              <Link href="/Carrinho/checkout" className="change-address">
                Alterar endereço
              </Link>
            </div>

            {!enderecoId ? (
              <div className="empty-address">
                <FiMapPin />
                <h3>Nenhum endereço selecionado</h3>
                <p>Você precisa selecionar um endereço antes de seguir para a entrega.</p>

                <Link href="/Carrinho/checkout" className="address-btn">
                  <FiArrowLeft />
                  Voltar
                </Link>
              </div>
            ) : (
              <>
                <div className="delivery-options">
                  <button
                    type="button"
                    className={`delivery-card ${entregaSelecionada === "padrao" ? "active" : ""}`}
                    onClick={() => setEntregaSelecionada("padrao")}
                  >
                    <div className="delivery-info">
                      <strong>Entrega padrão</strong>
                      <p>Receba em até 7 dias úteis</p>
                    </div>

                    <span className="delivery-price">R$ 19,90</span>
                  </button>

                  <button
                    type="button"
                    className={`delivery-card ${entregaSelecionada === "expressa" ? "active" : ""}`}
                    onClick={() => setEntregaSelecionada("expressa")}
                  >
                    <div className="delivery-info">
                      <strong>Entrega expressa</strong>
                      <p>Receba em até 2 dias úteis</p>
                    </div>

                    <span className="delivery-price">R$ 39,90</span>
                  </button>
                </div>

                <div className="delivery-note">
                  <FiClock />
                  <span>
                    O prazo começa a contar após a confirmação do pagamento.
                  </span>
                </div>

                <div className="checkout-actions">
                  <button
                    className="continue-btn"
                    onClick={continuarPagamento}
                    disabled={loading}
                  >
                    {loading ? "Carregando..." : "Continuar para pagamento"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}