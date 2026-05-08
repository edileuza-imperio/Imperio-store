"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import { InicioApi } from "@/services/api/api";

import {
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiCheckCircle,
  FiArrowRight,
  FiShoppingBag,
  FiLock,
} from "react-icons/fi";

import { toast } from "react-toastify";

import "./checkout.css";

/* =========================
   TIPOS
========================= */

type ApiResponse<T> = {
  dados?: T;
  data?: T;
  itens?: T;
  carrinho?: any;
  pedido?: any;
} & Record<string, any>;

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
  id_carrinho?: number;
  usuario_id?: number;
  valor_produtos?: number | string;
  valor_desconto?: number | string;
  valor_frete?: number | string;
  valor_total?: number | string;
};

type ItemCarrinho = {
  id?: number | string;
  id_carrinho_item?: number | string;
  produto_id?: number;
  quantidade?: number | string;
  preco_unitario?: number | string;
  preco_promocional_unitario?: number | string | null;
  subtotal?: number | string;
  total?: number | string;
  nome?: string;
  titulo?: string;
  produto_nome?: string;
  imagem?: string;
  miniatura?: string;
  foto?: string;
  produto?: {
    nome?: string;
    titulo?: string;
    imagem?: string;
    foto?: string;
  };
};

type Pedido = {
  id_pedido?: number;
  pedido_id?: number;
  id?: number;
};

/* =========================
   HELPERS
========================= */

function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  if (typeof valor === "string") {
    const limpo = valor.replace(/\./g, "").replace(",", ".");
    const numero = Number(limpo);
    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizarNumero(valor));
}

function extrairLista<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.itens)) return payload.itens;
  if (Array.isArray(payload?.carrinho?.itens)) return payload.carrinho.itens;
  return [];
}

function getEnderecoId(endereco: Endereco) {
  return endereco.id ?? endereco.id_endereco ?? 0;
}

function getItemId(item: ItemCarrinho) {
  return item.id_carrinho_item ?? item.id ?? "";
}

function getItemNome(item: ItemCarrinho) {
  return (
    item.produto?.nome ??
    item.produto?.titulo ??
    item.produto_nome ??
    item.nome ??
    item.titulo ??
    "Produto sem nome"
  );
}

function getItemImagem(item: ItemCarrinho) {
  return (
    item.miniatura ||
    item.imagem ||
    item.foto ||
    item.produto?.imagem ||
    item.produto?.foto ||
    "/images/sem-imagem.png"
  );
}

function getItemQuantidade(item: ItemCarrinho) {
  return Math.max(1, normalizarNumero(item.quantidade) || 1);
}

function getItemSubtotal(item: ItemCarrinho) {
  return normalizarNumero(
    item.subtotal ??
      item.total ??
      (item.preco_promocional_unitario != null
        ? normalizarNumero(item.preco_promocional_unitario) *
          getItemQuantidade(item)
        : normalizarNumero(item.preco_unitario) * getItemQuantidade(item))
  );
}

/* =========================
   PAGE
========================= */

export default function CheckoutPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<number | null>(null);

  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);

        const [enderecoRes, carrinhoRes, itensRes] = await Promise.all([
          InicioApi.get<ApiResponse<Endereco[]>>("/usuario/endereco", {
            withCredentials: true,
          }),
          InicioApi.get<ApiResponse<Carrinho>>("/carrinho", {
            withCredentials: true,
          }),
          InicioApi.get<ApiResponse<ItemCarrinho[]>>("/carrinho/itens", {
            withCredentials: true,
          }),
        ]);

        const listaEnderecos = extrairLista<Endereco>(enderecoRes.data);
        const listaItens = extrairLista<ItemCarrinho>(itensRes.data);

        const carrinhoData: Carrinho | null =
          carrinhoRes.data?.dados ??
          carrinhoRes.data?.data ??
          carrinhoRes.data?.carrinho ??
          null;

        setEnderecos(listaEnderecos);
        setItens(listaItens);
        setCarrinho(carrinhoData);

        const principal = listaEnderecos.find(
          (e) => e.principal === true || e.principal === 1
        );

        if (principal) {
          setEnderecoSelecionado(getEnderecoId(principal));
        } else if (listaEnderecos.length > 0) {
          setEnderecoSelecionado(getEnderecoId(listaEnderecos[0]));
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar checkout");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const subtotalItens = useMemo(() => {
    return itens.reduce((acc, item) => acc + getItemSubtotal(item), 0);
  }, [itens]);

  const valorFrete = normalizarNumero(carrinho?.valor_frete ?? 0);
  const valorDesconto = normalizarNumero(carrinho?.valor_desconto ?? 0);

  const valorTotal =
    normalizarNumero(carrinho?.valor_total ?? 0) ||
    Math.max(0, subtotalItens - valorDesconto + valorFrete);

  async function finalizarCheckout() {
    if (!enderecoSelecionado) return toast.warning("Selecione um endereço.");
    if (!itens.length) return toast.warning("Carrinho vazio.");

    try {
      setProcessando(true);

      const payload = {
        carrinho_id: carrinho?.id_carrinho,
        usuario_id: carrinho?.usuario_id,
        itens: itens.map((item) => ({
          produto_id: item.produto_id,
          quantidade: getItemQuantidade(item),
          preco_unitario: normalizarNumero(item.preco_unitario),
        })),
        endereco_entrega: { endereco_id: enderecoSelecionado },
        valor_total: valorTotal,
      };

      const response = await InicioApi.post<ApiResponse<Pedido>>(
        "/pedido/checkout",
        payload,
        { withCredentials: true }
      );

      const pedido =
        response.data?.pedido ??
        response.data?.dados ??
        response.data;

      const id = pedido?.id_pedido ?? pedido?.pedido_id ?? pedido?.id;

      if (!id) return toast.error("Erro ao gerar pedido");

      router.push(`/Carrinho/pagamento/${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Erro no checkout");
    } finally {
      setProcessando(false);
    }
  }

  /* =========================
     UI
  ========================= */

  return (
    <>
      <Navbar />

      <main className="checkout-page">
        <div className="checkout-shell">

          <header className="checkout-hero">
            <h1>Checkout</h1>
            <p>Finalize sua compra com segurança</p>
          </header>

          {!loading && (
            <div className="checkout-grid">

              {/* ENDEREÇOS */}
              <section>
                <h2>Endereço</h2>

                {enderecos.map((e) => (
                  <button
                    key={getEnderecoId(e)}
                    onClick={() => setEnderecoSelecionado(getEnderecoId(e))}
                    className={enderecoSelecionado === getEnderecoId(e) ? "active" : ""}
                  >
                    {e.rua} - {e.cidade}
                  </button>
                ))}
              </section>

              {/* RESUMO */}
              <aside>
                <h2>Resumo</h2>

                {itens.map((i) => (
                  <div key={getItemId(i)}>
                    {getItemNome(i)} - {formatarMoeda(getItemSubtotal(i))}
                  </div>
                ))}

                <strong>Total: {formatarMoeda(valorTotal)}</strong>

                <button onClick={finalizarCheckout} disabled={processando}>
                  {processando ? "Processando..." : "Pagar agora"}
                </button>
              </aside>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}