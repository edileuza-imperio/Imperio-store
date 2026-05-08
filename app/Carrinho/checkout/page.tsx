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

import "./checkout.css";

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
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

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

function extrairLista<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.itens)) return payload.itens;
  if (Array.isArray(payload?.dados?.itens)) return payload.dados.itens;
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
  const nome =
    item.produto?.nome ??
    item.produto?.titulo ??
    item.produto_nome ??
    item.nome ??
    item.titulo;

  return nome?.trim() ? nome : "Produto sem nome";
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
  const subtotal =
    item.subtotal ??
    item.total ??
    (item.preco_promocional_unitario != null
      ? normalizarNumero(item.preco_promocional_unitario) * getItemQuantidade(item)
      : item.preco_unitario != null
      ? normalizarNumero(item.preco_unitario) * getItemQuantidade(item)
      : 0);

  return normalizarNumero(subtotal);
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
          InicioApi.get("/usuario/endereco", { withCredentials: true }),
          InicioApi.get("/carrinho", { withCredentials: true }),
          InicioApi.get("/carrinho/itens", { withCredentials: true }),
        ]);

        const listaEnderecos: Endereco[] = extrairLista<Endereco>(enderecoRes.data);
        const listaItens: ItemCarrinho[] = extrairLista<ItemCarrinho>(itensRes.data);

        const carrinhoData: Carrinho =
          carrinhoRes.data?.dados ??
          carrinhoRes.data?.data ??
          carrinhoRes.data ??
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
      } catch (error) {
        console.error("Erro ao carregar checkout:", error);
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
    if (!enderecoSelecionado) {
      alert("Selecione um endereço.");
      return;
    }

    if (!itens.length) {
      alert("Carrinho vazio.");
      return;
    }

    try {
      setProcessando(true);

      const payload = {
        carrinho_id: carrinho?.id_carrinho,
        usuario_id: carrinho?.usuario_id,
        itens: itens.map((item) => ({
          produto_id: item.produto_id,
          quantidade: getItemQuantidade(item),
          preco_unitario: normalizarNumero(item.preco_unitario),
          preco_promocional_unitario:
            item.preco_promocional_unitario != null
              ? normalizarNumero(item.preco_promocional_unitario)
              : null,
          subtotal: getItemSubtotal(item),
        })),
        endereco_entrega: {
          endereco_id: enderecoSelecionado,
        },
        valor_produtos: normalizarNumero(carrinho?.valor_produtos ?? subtotalItens),
        valor_desconto: valorDesconto,
        valor_frete: valorFrete,
        valor_total: valorTotal,
      };

      const response = await InicioApi.post("/pedido/checkout", payload, {
        withCredentials: true,
      });

      const pedidoData: Pedido =
        response.data?.pedido ??
        response.data?.dados?.pedido ??
        response.data?.data?.pedido ??
        response.data?.pedido ??
        response.data;

      const pedidoId =
        pedidoData?.id_pedido ?? pedidoData?.pedido_id ?? pedidoData?.id;

      if (!pedidoId) {
        alert("Pedido criado, mas não foi possível identificar o ID.");
        return;
      }

      router.push(`/Carrinho/pagamento/${pedidoId}`);
    } catch (error) {
      console.error("Erro ao finalizar checkout:", error);
      alert("Erro ao finalizar pedido.");
    } finally {
      setProcessando(false);
    }
  }

  if (!loading && itens.length === 0) {
    return (
      <>
        <Navbar />

        <main className="checkout-page">
          <div className="checkout-shell">
            <section className="empty-card glass">
              <div className="empty-icon">
                <FiShoppingBag size={30} />
              </div>
              <h1>Seu carrinho está vazio</h1>
              <p>Adicione produtos antes de continuar para o checkout.</p>

              <Link href="/" className="btn-primary">
                Explorar coleção
              </Link>
            </section>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="checkout-page">
        <div className="checkout-shell">
          <header className="checkout-hero glass">
            <div>
              <div className="eyebrow">
                <FiLock />
                <span>Checkout seguro</span>
              </div>

              <h1>Finalize sua compra</h1>
              <p>Revise endereço, resumo e siga para o pagamento.</p>
            </div>

            <div className="hero-badge">
              {itens.length} item(ns)
            </div>
          </header>

          <section className="steps">
            <div className="step active">
              <FiMapPin />
              <div>
                <strong>1. Endereço</strong>
                <span>Escolha onde receber</span>
              </div>
            </div>

            <div className="step">
              <FiTruck />
              <div>
                <strong>2. Entrega</strong>
                <span>Envio e prazo</span>
              </div>
            </div>

            <div className="step">
              <FiCreditCard />
              <div>
                <strong>3. Pagamento</strong>
                <span>Concluir pedido</span>
              </div>
            </div>
          </section>

          {loading && (
            <div className="loading-card glass">
              Carregando informações do checkout...
            </div>
          )}

          {!loading && (
            <div className="checkout-grid">
              <section className="checkout-main">
                <div className="panel glass">
                  <div className="panel-header">
                    <h2>Endereço de entrega</h2>
                    <p>Selecione o local para receber seu pedido.</p>
                  </div>

                  {enderecos.length === 0 ? (
                    <div className="empty-inline">
                      Nenhum endereço cadastrado.
                      <Link href="/Perfil/Enderecos" className="inline-link">
                        Cadastrar endereço
                      </Link>
                    </div>
                  ) : (
                    <div className="address-list">
                      {enderecos.map((endereco) => {
                        const id = getEnderecoId(endereco);
                        const ativo = enderecoSelecionado === id;

                        return (
                          <button
                            key={id}
                            type="button"
                            className={`address-card ${ativo ? "active" : ""}`}
                            onClick={() => setEnderecoSelecionado(id)}
                          >
                            <div className="address-icon">
                              <FiMapPin />
                            </div>

                            <div className="address-info">
                              <strong>
                                {endereco.rua || endereco.endereco || "Endereço sem nome"}, {endereco.numero || "S/N"}
                              </strong>
                              <span>
                                {endereco.bairro || "Bairro não informado"}
                              </span>
                              <span>
                                {endereco.cidade || "Cidade"} - {endereco.estado || "UF"}
                              </span>
                            </div>

                            {ativo && <FiCheckCircle className="address-check" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="panel-actions">
                    <Link href="/Carrinho" className="btn-secondary">
                      Voltar ao carrinho
                    </Link>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={finalizarCheckout}
                      disabled={processando || !enderecos.length}
                    >
                      {processando ? "Processando..." : "Ir para pagamento"}
                      <FiArrowRight />
                    </button>
                  </div>
                </div>
              </section>

              <aside className="checkout-aside">
                <div className="summary-card glass">
                  <div className="summary-header">
                    <h2>Resumo do pedido</h2>
                    <p>{itens.length} produto(s) no carrinho</p>
                  </div>

                  <div className="summary-items">
                    {itens.map((item) => {
                      const nome = getItemNome(item);
                      const imagem = getItemImagem(item);
                      const qtd = getItemQuantidade(item);
                      const subtotal = getItemSubtotal(item);

                      return (
                        <div className="summary-item" key={String(getItemId(item))}>
                          <div className="summary-imageWrap">
                            <Image
                              src={imagem}
                              alt={nome}
                              width={52}
                              height={52}
                              className="summary-image"
                            />
                          </div>

                          <div className="summary-info">
                            <strong>{nome}</strong>
                            <span>Qtd: {qtd}</span>
                          </div>

                          <div className="summary-price">
                            {formatarMoeda(subtotal)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="summary-box">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <strong>{formatarMoeda(subtotalItens)}</strong>
                    </div>

                    <div className="summary-row">
                      <span>Frete</span>
                      <strong>{valorFrete > 0 ? formatarMoeda(valorFrete) : "Grátis"}</strong>
                    </div>

                    <div className="summary-row">
                      <span>Desconto</span>
                      <strong>- {formatarMoeda(valorDesconto)}</strong>
                    </div>

                    <div className="summary-total">
                      <span>Total</span>
                      <strong>{formatarMoeda(valorTotal)}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary full"
                    onClick={finalizarCheckout}
                    disabled={processando || !enderecos.length}
                  >
                    {processando ? "Processando..." : "Ir para pagamento"}
                    <FiArrowRight />
                  </button>

                  <p className="summary-note">
                    Pagamento seguro, dados protegidos e experiência premium.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}