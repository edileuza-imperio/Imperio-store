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

/* =========================
   TIPOS
========================= */

type AnyRecord = Record<string, any>;

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
          InicioApi.get<any>("/usuario/endereco", { withCredentials: true }),
          InicioApi.get<any>("/carrinho", { withCredentials: true }),
          InicioApi.get<any>("/carrinho/itens", { withCredentials: true }),
        ]);

        const enderecoPayload: AnyRecord = (enderecoRes as any)?.data ?? {};
        const carrinhoPayload: AnyRecord = (carrinhoRes as any)?.data ?? {};
        const itensPayload: AnyRecord = (itensRes as any)?.data ?? {};

        const listaEnderecos: Endereco[] = extrairLista<Endereco>(enderecoPayload);
        const listaItens: ItemCarrinho[] = extrairLista<ItemCarrinho>(itensPayload);

        const carrinhoData: Carrinho =
          carrinhoPayload?.dados ??
          carrinhoPayload?.data ??
          carrinhoPayload ??
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

      const response = await InicioApi.post<any>("/pedido/checkout", payload, {
        withCredentials: true,
      });

      const responseData: AnyRecord = (response as any)?.data ?? {};

      const pedidoData: Pedido =
        responseData?.pedido ??
        responseData?.dados?.pedido ??
        responseData?.data?.pedido ??
        responseData?.data ??
        responseData;

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

  const isCarrinhoVazio = !loading && itens.length === 0;

  return (
    <>
      <Navbar />

      <main className="checkout-page">
        <div className="checkout-shell">
          {isCarrinhoVazio ? (
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
          ) : (
            <>
              <header className="checkout-hero glass">
                <div>
                  <div className="eyebrow">
                    <FiLock />
                    <span>Checkout seguro</span>
                  </div>

                  <h1>Finalize sua compra</h1>
                  <p>Revise endereço, resumo e siga para o pagamento.</p>
                </div>

                <div className="hero-badge">{itens.length} item(ns)</div>
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
                          <Link href="/endereco" className="inline-link">
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
                                    {endereco.rua || endereco.endereco || "Endereço sem nome"},{" "}
                                    {endereco.numero || "S/N"}
                                  </strong>
                                  <span>{endereco.bairro || "Bairro não informado"}</span>
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
                          <strong>
                            {valorFrete > 0 ? formatarMoeda(valorFrete) : "Grátis"}
                          </strong>
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
            </>
          )}
        </div>

        <style jsx global>{`
          .checkout-page {
            min-height: 100vh;
            position: relative;
            overflow: hidden;
            padding: 120px 20px 60px;
            background:
              radial-gradient(circle at top left, rgba(192, 138, 122, 0.18), transparent 28%),
              radial-gradient(circle at top right, rgba(255, 255, 255, 0.55), transparent 24%),
              linear-gradient(180deg, #f7f1e6 0%, #f4eadf 100%);
            color: #2b2b2b;
          }

          .checkout-page::before,
          .checkout-page::after {
            content: "";
            position: absolute;
            border-radius: 999px;
            filter: blur(30px);
            pointer-events: none;
            opacity: 0.42;
          }

          .checkout-page::before {
            width: 260px;
            height: 260px;
            background: rgba(192, 138, 122, 0.22);
            top: 90px;
            right: -70px;
          }

          .checkout-page::after {
            width: 320px;
            height: 320px;
            background: rgba(255, 255, 255, 0.35);
            bottom: -120px;
            left: -90px;
          }

          .checkout-shell {
            position: relative;
            z-index: 1;
            max-width: 1180px;
            margin: 0 auto;
          }

          .glass {
            background: rgba(255, 255, 255, 0.56);
            border: 1px solid rgba(233, 222, 214, 0.82);
            box-shadow:
              0 18px 50px rgba(59, 40, 32, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }

          .checkout-hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding: 24px 26px;
            border-radius: 26px;
            margin-bottom: 20px;
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(192, 138, 122, 0.12);
            color: #8c5a50;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 14px;
          }

          .checkout-hero h1 {
            margin: 0;
            font-size: clamp(28px, 4vw, 42px);
            line-height: 1.05;
            color: #8c5a50;
            letter-spacing: -0.03em;
          }

          .checkout-hero p {
            margin: 10px 0 0;
            color: rgba(43, 43, 43, 0.72);
            font-size: 15px;
          }

          .hero-badge {
            flex-shrink: 0;
            padding: 12px 16px;
            border-radius: 999px;
            background: rgba(247, 241, 230, 0.92);
            border: 1px solid rgba(233, 222, 214, 0.95);
            color: #8c5a50;
            font-weight: 700;
          }

          .steps {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            margin-bottom: 22px;
          }

          .step {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 18px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.45);
            border: 1px solid rgba(233, 222, 214, 0.85);
            color: rgba(43, 43, 43, 0.74);
          }

          .step svg {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            color: #c08a7a;
          }

          .step strong {
            display: block;
            font-size: 14px;
            color: #2b2b2b;
          }

          .step span {
            display: block;
            font-size: 12px;
            margin-top: 2px;
            color: rgba(43, 43, 43, 0.6);
          }

          .step.active {
            background: rgba(192, 138, 122, 0.14);
            border-color: rgba(192, 138, 122, 0.2);
          }

          .loading-card {
            padding: 18px 20px;
            border-radius: 22px;
            text-align: center;
          }

          .checkout-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 360px;
            gap: 26px;
            align-items: start;
          }

          .checkout-main {
            min-width: 0;
          }

          .checkout-aside {
            position: sticky;
            top: 110px;
          }

          .panel,
          .summary-card {
            border-radius: 26px;
            padding: 22px;
          }

          .panel-header h2,
          .summary-header h2 {
            margin: 0;
            font-size: 22px;
            color: #8c5a50;
            letter-spacing: -0.03em;
          }

          .panel-header p,
          .summary-header p {
            margin: 8px 0 0;
            color: rgba(43, 43, 43, 0.65);
            font-size: 14px;
          }

          .address-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 18px;
          }

          .address-card {
            width: 100%;
            padding: 16px;
            border-radius: 18px;
            border: 1px solid rgba(233, 222, 214, 0.9);
            background: rgba(255, 255, 255, 0.58);
            display: flex;
            align-items: flex-start;
            gap: 14px;
            text-align: left;
            cursor: pointer;
            transition: 0.22s ease;
          }

          .address-card:hover {
            transform: translateY(-2px);
            border-color: rgba(192, 138, 122, 0.65);
          }

          .address-card.active {
            border: 2px solid #c08a7a;
            background: rgba(192, 138, 122, 0.12);
          }

          .address-icon {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            background: rgba(192, 138, 122, 0.12);
            color: #8c5a50;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .address-info {
            flex: 1;
            min-width: 0;
          }

          .address-info strong {
            display: block;
            font-size: 14px;
            color: #2b2b2b;
            margin-bottom: 4px;
          }

          .address-info span {
            display: block;
            font-size: 13px;
            color: rgba(43, 43, 43, 0.64);
            line-height: 1.45;
          }

          .address-check {
            margin-left: auto;
            color: #c08a7a;
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }

          .empty-inline {
            margin-top: 18px;
            padding: 18px;
            border-radius: 18px;
            background: rgba(247, 241, 230, 0.8);
            border: 1px solid rgba(233, 222, 214, 0.9);
            color: rgba(43, 43, 43, 0.72);
          }

          .inline-link {
            display: inline-block;
            margin-left: 6px;
            color: #8c5a50;
            font-weight: 700;
            text-decoration: none;
          }

          .panel-actions {
            margin-top: 22px;
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 12px;
          }

          .btn-primary,
          .btn-secondary {
            height: 54px;
            border-radius: 16px;
            text-decoration: none;
            border: none;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            transition: 0.22s ease;
          }

          .btn-primary {
            background: linear-gradient(135deg, #c08a7a 0%, #a96d61 100%);
            color: #fff;
            box-shadow: 0 16px 28px rgba(160, 107, 95, 0.24);
            padding: 0 22px;
          }

          .btn-primary:hover {
            transform: translateY(-2px);
          }

          .btn-primary:disabled {
            opacity: 0.7;
            cursor: progress;
            transform: none;
          }

          .btn-secondary {
            background: rgba(255, 255, 255, 0.7);
            color: #8c5a50;
            border: 1px solid rgba(192, 138, 122, 0.2);
          }

          .btn-secondary:hover {
            transform: translateY(-2px);
            border-color: rgba(192, 138, 122, 0.55);
          }

          .full {
            width: 100%;
            margin-top: 18px;
          }

          .summary-items {
            margin-top: 18px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 260px;
            overflow-y: auto;
            padding-right: 4px;
          }

          .summary-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.5);
            border: 1px solid rgba(192, 138, 122, 0.15);
          }

          .summary-imageWrap {
            width: 52px;
            height: 52px;
            flex: 0 0 52px;
            border-radius: 14px;
            overflow: hidden;
            background: linear-gradient(
              180deg,
              rgba(247, 241, 230, 0.95),
              rgba(233, 222, 214, 0.75)
            );
          }

          .summary-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .summary-info {
            flex: 1;
            min-width: 0;
          }

          .summary-info strong {
            display: block;
            font-size: 13px;
            color: #2b2b2b;
            line-height: 1.35;
          }

          .summary-info span {
            display: block;
            font-size: 11px;
            color: rgba(43, 43, 43, 0.62);
            margin-top: 3px;
          }

          .summary-price {
            font-weight: 700;
            color: #8c5a50;
            font-size: 13px;
            white-space: nowrap;
          }

          .summary-box {
            margin-top: 16px;
            padding-top: 14px;
            border-top: 1px solid rgba(233, 222, 214, 0.9);
          }

          .summary-row,
          .summary-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
          }

          .summary-row {
            margin-bottom: 12px;
            color: rgba(43, 43, 43, 0.82);
          }

          .summary-row strong {
            color: #2b2b2b;
          }

          .summary-total {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid rgba(233, 222, 214, 0.95);
          }

          .summary-total span {
            font-size: 16px;
            font-weight: 700;
            color: #2b2b2b;
          }

          .summary-total strong {
            font-size: 22px;
            color: #8c5a50;
            letter-spacing: -0.03em;
          }

          .summary-note {
            margin: 12px 0 0;
            text-align: center;
            font-size: 12px;
            color: rgba(43, 43, 43, 0.58);
          }

          .empty-card {
            max-width: 520px;
            margin: 0 auto;
            text-align: center;
            border-radius: 28px;
            padding: 34px 26px;
          }

          .empty-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto 16px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #8c5a50;
            background: rgba(192, 138, 122, 0.12);
            border: 1px solid rgba(192, 138, 122, 0.18);
          }

          .empty-card h1 {
            margin: 0;
            font-size: 28px;
            color: #8c5a50;
          }

          .empty-card p {
            margin: 10px 0 0;
            color: rgba(43, 43, 43, 0.72);
          }

          @media (max-width: 1024px) {
            .checkout-grid {
              grid-template-columns: 1fr 320px;
              gap: 20px;
            }
          }

          @media (max-width: 900px) {
            .checkout-grid {
              grid-template-columns: 1fr;
            }

            .checkout-aside {
              position: relative;
              top: 0;
              order: -1;
            }

            .steps {
              grid-template-columns: 1fr;
            }

            .checkout-hero {
              flex-direction: column;
              align-items: flex-start;
            }

            .panel-actions {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .checkout-page {
              padding: 104px 14px 36px;
            }

            .checkout-hero {
              padding: 18px;
              border-radius: 22px;
            }

            .hero-badge {
              align-self: flex-start;
            }

            .panel,
            .summary-card {
              padding: 18px;
              border-radius: 22px;
            }

            .address-card {
              padding: 14px;
            }

            .btn-primary,
            .btn-secondary {
              height: 52px;
            }

            .summary-items {
              max-height: 220px;
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}