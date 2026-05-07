"use client";

import Link from "next/link";
import "./checkout.css";

import {
  FiCheckCircle,
  FiMapPin,
  FiCreditCard,
  FiTruck,
} from "react-icons/fi";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InicioApi } from "@/services/api/api";

/* =========================
   TIPOS
========================= */

type Endereco = {
  id?: number;
  id_endereco?: number;
  cep?: string;
  rua?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  principal?: boolean | number;
};

type Carrinho = {
  id_carrinho: number;
  usuario_id: number;
  valor_produtos: number;
  valor_desconto: number;
  valor_frete: number;
  valor_total: number;
};

type ItemCarrinho = {
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  preco_promocional_unitario?: number | null;
  subtotal: number;
};

type Pedido = {
  id_pedido: number;
};

/* =========================
   UTIL
========================= */

function getEnderecoId(endereco: Endereco) {
  return endereco.id ?? endereco.id_endereco ?? 0;
}

/* =========================
   COMPONENTE
========================= */

export default function CheckoutPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | ENDEREÇOS
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);

        const response = await InicioApi.get("/usuario/endereco", {
          withCredentials: true,
        });

        const data: any = response.data;

        const lista: Endereco[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.dados)
            ? data.dados
            : Array.isArray(data?.data)
            ? data.data
            : [];

        setEnderecos(lista);

        const principal = lista.find(
          (e) => e.principal === true || e.principal === 1
        );

        if (principal) {
          setEnderecoSelecionado(getEnderecoId(principal));
        } else if (lista.length > 0) {
          setEnderecoSelecionado(getEnderecoId(lista[0]));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CHECKOUT
  |--------------------------------------------------------------------------
  */
  async function continuarEntrega() {
    if (!enderecoSelecionado) {
      alert("Selecione um endereço.");
      return;
    }

    try {
      setProcessando(true);

      // carrinho
      const carrinhoRes = await InicioApi.get("/carrinho", {
        withCredentials: true,
      });

      // itens
      const itensRes = await InicioApi.get("/carrinho/itens", {
        withCredentials: true,
      });

      // 🔥 CORREÇÃO AQUI (unknown → safe cast)
      const carrinho = carrinhoRes.data as Carrinho;
      const itens = itensRes.data as ItemCarrinho[];

      if (!itens || itens.length === 0) {
        alert("Carrinho vazio.");
        return;
      }

      const payload = {
        carrinho_id: carrinho.id_carrinho,
        usuario_id: carrinho.usuario_id,

        itens: itens.map((item) => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          preco_promocional_unitario: item.preco_promocional_unitario,
          subtotal: item.subtotal,
        })),

        endereco_entrega: {
          endereco_id: enderecoSelecionado,
        },

        valor_produtos: carrinho.valor_produtos,
        valor_desconto: carrinho.valor_desconto,
        valor_frete: carrinho.valor_frete,
        valor_total: carrinho.valor_total,
      };

      const res = await InicioApi.post("/pedido/checkout", payload, {
        withCredentials: true,
      });

      // 🔥 CORREÇÃO AQUI (pedido pode vir como unknown)
      const pedido = (res.data as any)?.pedido as Pedido;

      if (!pedido) {
        alert("Erro ao criar pedido.");
        return;
      }

      router.push(`/Carrinho/pagamento/${pedido.id_pedido}`);

    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar pedido.");
    } finally {
      setProcessando(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <main className="checkout-page">
      <div className="checkout-container">

        <div className="checkout-header">
          <h1>Checkout</h1>
          <p>Finalize sua compra em poucos passos.</p>
        </div>

        <div className="checkout-steps">
          <div className="step active">
            <div className="step-icon"><FiMapPin /></div>
            <div>
              <strong>1. Endereço</strong>
              <p>Escolha onde receber</p>
            </div>
          </div>

          <div className="step">
            <div className="step-icon"><FiTruck /></div>
            <div>
              <strong>2. Entrega</strong>
              <p>Método de envio</p>
            </div>
          </div>

          <div className="step">
            <div className="step-icon"><FiCreditCard /></div>
            <div>
              <strong>3. Pagamento</strong>
              <p>Finalizar pedido</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="checkout-loading">
            Carregando endereços...
          </div>
        )}

        {!loading && (
          <div className="checkout-content">

            <div className="checkout-card">

              <div className="card-header">
                <h2>Selecione o endereço</h2>
              </div>

              {enderecos.length === 0 && (
                <p>Nenhum endereço cadastrado.</p>
              )}

              {enderecos.length > 0 && (
                <>
                  <div className="address-list">
                    {enderecos.map((endereco) => {
                      const id = getEnderecoId(endereco);
                      const ativo = enderecoSelecionado === id;

                      return (
                        <button
                          key={id}
                          className={`address-card ${ativo ? "active" : ""}`}
                          onClick={() => setEnderecoSelecionado(id)}
                        >
                          <div>
                            <strong>
                              {endereco.rua || endereco.endereco}, {endereco.numero}
                            </strong>
                            <p>{endereco.bairro}</p>
                            <p>{endereco.cidade} - {endereco.estado}</p>
                          </div>

                          {ativo && <FiCheckCircle />}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="continue-btn"
                    onClick={continuarEntrega}
                    disabled={processando}
                  >
                    {processando ? "Processando..." : "Continuar para pagamento"}
                  </button>
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}