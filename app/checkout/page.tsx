"use client";

import React from "react";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import api from "@/Api/conectar";
import "bootstrap/dist/css/bootstrap.min.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatBRL } from "@/components/Bibioteca/functions";
import {
  FiMapPin,
  FiTruck,
  FiShield,
  FiShoppingBag,
  FiHome,
  FiCheckCircle,
} from "react-icons/fi";

type CarrinhoItem = {
  id_item: number;
  id_produto?: number;
  nome_produto: string;
  preco_unitario: number | string;
  preco_promocional_unitario?: number | string | null;
  quantidade: number;
  subtotal?: number | string;
  imagem?: string;
};

type CheckoutForm = {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type CarrinhoResumo = {
  id_carrinho?: number;
  usuario_id?: number;
  status_id?: number;
  valor_produtos?: number | string;
  valor_desconto?: number | string;
  valor_frete?: number | string;
  valor_total?: number | string;
  itens?: any[];
};

type EnderecoUsuario = {
  id_endereco: number;
  usuario_id: number;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  principal?: number;
  criado?: string;
  atualizado?: string;
};

function num(v: any): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const raw = String(v ?? "").trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d,.-]/g, "");

  let normalized = cleaned;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function pickCarrinhoBase(resp: any): any {
  return resp?.dados ?? resp?.data ?? resp ?? {};
}

function pickItensDoCarrinho(resp: any): any[] {
  const base = pickCarrinhoBase(resp);

  if (Array.isArray(base)) return base;
  if (Array.isArray(base?.itens)) return base.itens;
  if (Array.isArray(base?.carrinho?.itens)) return base.carrinho.itens;
  if (Array.isArray(base?.dados?.itens)) return base.dados.itens;

  return [];
}

function normalizarItens(lista: any[]): CarrinhoItem[] {
  return lista.map((item) => {
    const precoPromo =
      item?.preco_promocional_unitario !== undefined &&
      item?.preco_promocional_unitario !== null &&
      item?.preco_promocional_unitario !== ""
        ? item.preco_promocional_unitario
        : null;

    return {
      id_item: Number(item?.id_item ?? item?.id_carrinho_item ?? item?.id ?? 0),
      id_produto:
        Number(item?.produto_id ?? item?.id_produto ?? item?.idProduto ?? 0) ||
        undefined,
      nome_produto: String(
        item?.nome_produto ??
          item?.nome ??
          item?.titulo ??
          item?.produto_nome ??
          "Produto"
      ).trim(),
      preco_unitario: item?.preco_unitario ?? 0,
      preco_promocional_unitario: precoPromo,
      quantidade: Number(item?.quantidade ?? 1),
      subtotal: item?.subtotal ?? null,
      imagem:
        item?.imagem ??
        item?.miniatura ??
        item?.imagem_produto ??
        item?.foto ??
        item?.produto_imagem ??
        item?.produto_miniatura ??
        "",
    };
  });
}

function imagemUrl(path?: string) {
  if (!path) return "/placeholder.png";
  if (/^https?:\/\//i.test(path)) return path;

  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  const clean = String(path).replace(/^\/+/, "");

  if (!clean) return "/placeholder.png";

  if (clean.startsWith("upload/")) return `${base}/${clean}`;

  return `${base}/upload/${clean}`;
}

function precoFinalItem(item: CarrinhoItem) {
  const promo = num(item.preco_promocional_unitario);
  if (promo > 0) return promo;
  return num(item.preco_unitario);
}

function enderecoToForm(endereco?: Partial<EnderecoUsuario> | null): CheckoutForm {
  return {
    cep: endereco?.cep ?? "",
    endereco: endereco?.endereco ?? "",
    numero: endereco?.numero ?? "",
    complemento: endereco?.complemento ?? "",
    bairro: endereco?.bairro ?? "",
    cidade: endereco?.cidade ?? "",
    estado: endereco?.estado ?? "",
  };
}

export default function CheckoutPage() {
  const [loading, setLoading] = React.useState(true);
  const [enviando, setEnviando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [itens, setItens] = React.useState<CarrinhoItem[]>([]);
  const [carrinho, setCarrinho] = React.useState<CarrinhoResumo | null>(null);

  const [form, setForm] = React.useState<CheckoutForm>({
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const [enderecos, setEnderecos] = React.useState<EnderecoUsuario[]>([]);
  const [carregandoEnderecos, setCarregandoEnderecos] = React.useState(true);
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = React.useState<number | null>(null);

  const temEnderecoCadastrado = enderecos.length > 0;

  const subtotalCalculado = React.useMemo(() => {
    return itens.reduce((acc, item) => {
      return acc + precoFinalItem(item) * (item.quantidade || 1);
    }, 0);
  }, [itens]);

  const totalItens = React.useMemo(() => {
    return itens.reduce((acc, item) => acc + item.quantidade, 0);
  }, [itens]);

  const frete = React.useMemo(() => {
    const valor = num(carrinho?.valor_frete);
    if (valor > 0) return valor;
    if (itens.length === 0) return 0;
    return 0;
  }, [carrinho, itens]);

  const subtotal = React.useMemo(() => {
    const valor = num(carrinho?.valor_produtos);
    return valor > 0 ? valor : subtotalCalculado;
  }, [carrinho, subtotalCalculado]);

  const desconto = React.useMemo(() => {
    return num(carrinho?.valor_desconto);
  }, [carrinho]);

  const total = React.useMemo(() => {
    const valor = num(carrinho?.valor_total);
    if (valor > 0) return valor;
    return subtotal - desconto + frete;
  }, [carrinho, subtotal, desconto, frete]);

  async function carregarCarrinho() {
    try {
      setErro(null);

      let carrinhoResumo: CarrinhoResumo | null = null;
      let listaNormalizada: CarrinhoItem[] = [];

      const resp = await api.get("/carrinho");

      console.log("[checkout] resposta /carrinho:", resp.data);

      const base = pickCarrinhoBase(resp.data);
      const listaBruta = pickItensDoCarrinho(resp.data);

      carrinhoResumo = {
        id_carrinho:
          Number(base?.id_carrinho ?? base?.carrinho?.id_carrinho ?? 0) ||
          undefined,
        usuario_id:
          Number(base?.usuario_id ?? base?.carrinho?.usuario_id ?? 0) ||
          undefined,
        status_id:
          Number(base?.status_id ?? base?.carrinho?.status_id ?? 0) ||
          undefined,
        valor_produtos:
          base?.valor_produtos ?? base?.carrinho?.valor_produtos ?? 0,
        valor_desconto:
          base?.valor_desconto ?? base?.carrinho?.valor_desconto ?? 0,
        valor_frete: base?.valor_frete ?? base?.carrinho?.valor_frete ?? 0,
        valor_total: base?.valor_total ?? base?.carrinho?.valor_total ?? 0,
        itens: listaBruta,
      };

      if (Array.isArray(listaBruta) && listaBruta.length > 0) {
        listaNormalizada = normalizarItens(listaBruta);
      } else {
        const respItens = await api.get("/carrinho/itens");

        console.log("[checkout] resposta /carrinho/itens:", respItens.data);

        const listaBrutaItens = pickItensDoCarrinho(respItens.data);
        listaNormalizada = normalizarItens(listaBrutaItens);
      }

      setCarrinho(carrinhoResumo);
      setItens(listaNormalizada);
    } catch (e: any) {
      console.log("[checkout] erro ao carregar carrinho:", e);
      console.log("[checkout] erro response:", e?.response);
      console.log("[checkout] erro response data:", e?.response?.data);

      setErro(e?.response?.data?.mensagem || "Erro ao carregar checkout.");
      setCarrinho(null);
      setItens([]);
    }
  }

  async function carregarEnderecos() {
    try {
      setCarregandoEnderecos(true);

      const response = await api.get("/usuario/endereco");

      console.log("[endereco] resposta GET /usuario/endereco:", response.data);

      const lista = response?.data?.dados ?? response?.data ?? [];
      const enderecosLista = Array.isArray(lista) ? lista : [];

      console.log("[endereco] lista normalizada:", enderecosLista);

      setEnderecos(enderecosLista);

      if (enderecosLista.length > 0) {
        const principal =
          enderecosLista.find((item) => Number(item?.principal) === 1) ??
          enderecosLista[0];

        if (principal) {
          console.log("[endereco] principal selecionado automaticamente:", principal);
          setEnderecoSelecionadoId(Number(principal.id_endereco));
          setForm(enderecoToForm(principal));
        }
      } else {
        setEnderecoSelecionadoId(null);
        setForm({
          cep: "",
          endereco: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
        });
      }
    } catch (error: any) {
      console.log("[endereco] erro ao carregar endereços:", error);
      console.log("[endereco] erro response:", error?.response);
      console.log("[endereco] erro response data:", error?.response?.data);

      setEnderecos([]);
      setEnderecoSelecionadoId(null);
    } finally {
      setCarregandoEnderecos(false);
    }
  }

  React.useEffect(() => {
    let ativo = true;

    async function iniciar() {
      try {
        setLoading(true);
        setErro(null);
        await Promise.all([carregarCarrinho(), carregarEnderecos()]);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    iniciar();

    return () => {
      ativo = false;
    };
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    console.log("[endereco] alterando campo:", name, value);

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function selecionarEndereco(endereco: EnderecoUsuario) {
    console.log("[endereco] card clicado:", endereco);
    setEnderecoSelecionadoId(Number(endereco.id_endereco));
    setForm(enderecoToForm(endereco));
  }

  async function salvarEnderecoUsuario() {
    if (
      !form.cep ||
      !form.endereco ||
      !form.numero ||
      !form.bairro ||
      !form.cidade ||
      !form.estado
    ) {
      console.log("[endereco] formulário inválido:", form);
      toast.warning("Preencha os dados do endereço antes de salvar.");
      return;
    }

    try {
      const payload = {
        cep: form.cep,
        endereco: form.endereco,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        principal: 1,
      };

      console.log("[endereco] payload enviado:", payload);

      const response = await api.post("/usuario/endereco", payload);

      console.log("[endereco] resposta POST /usuario/endereco:", response.data);

      toast.success(response?.data?.mensagem || "Endereço salvo com sucesso.");

      await carregarEnderecos();
    } catch (error: any) {
      console.log("[endereco] erro ao salvar endereço:", error);
      console.log("[endereco] error.message:", error?.message);
      console.log("[endereco] error.response:", error?.response);
      console.log("[endereco] error.response.status:", error?.response?.status);
      console.log("[endereco] error.response.data:", error?.response?.data);
      console.log("[endereco] error.config:", error?.config);

      toast.error(
        error?.response?.data?.mensagem || "Não foi possível salvar o endereço."
      );
    }
  }

  async function handleContinuar(e: React.FormEvent) {
    e.preventDefault();

    if (itens.length === 0) {
      toast.warning("Seu carrinho está vazio.");
      return;
    }

    if (!carrinho?.id_carrinho) {
      toast.error("Não foi possível identificar o carrinho.");
      return;
    }

    if (!carrinho?.usuario_id) {
      toast.error("Não foi possível identificar o usuário do pedido.");
      return;
    }

    if (
      !form.cep ||
      !form.endereco ||
      !form.numero ||
      !form.bairro ||
      !form.cidade ||
      !form.estado
    ) {
      toast.warning("Preencha ou selecione um endereço de entrega.");
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        carrinho_id: carrinho.id_carrinho,
        usuario_id: carrinho.usuario_id,
        status_id: 7,
        status_pagamento: "pendente",
        valor_produtos: subtotal,
        valor_desconto: desconto,
        valor_frete: frete,
        valor_total: total,
        endereco_entrega: {
          cep: form.cep,
          endereco: form.endereco,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
        },
        itens: itens.map((item) => ({
          produto_id: item.id_produto ?? 0,
          nome_produto: item.nome_produto,
          quantidade: item.quantidade,
          preco_unitario: Number(item.preco_unitario ?? 0),
          preco_promocional_unitario:
            item.preco_promocional_unitario !== null &&
            item.preco_promocional_unitario !== undefined &&
            item.preco_promocional_unitario !== ""
              ? Number(item.preco_promocional_unitario)
              : null,
          subtotal:
            item.subtotal !== null &&
            item.subtotal !== undefined &&
            item.subtotal !== ""
              ? Number(item.subtotal)
              : precoFinalItem(item) * item.quantidade,
          imagem: item.imagem ?? "",
        })),
      };

      console.log("[checkout] payload /pedido/checkout:", payload);

      const response = await api.post("/pedido/checkout", payload);

      console.log("[checkout] resposta /pedido/checkout:", response.data);

      const dados = response?.data?.dados ?? response?.data ?? {};

      toast.success(dados?.mensagem || "Pedido cadastrado com sucesso.");

      const pedidoId = dados?.pedido?.id_pedido ?? dados?.pedido_id ?? null;

      if (pedidoId) {
        window.location.href = `/pagamento/${pedidoId}`;
        return;
      }

      if (dados?.redirect) {
        window.location.href = dados.redirect;
        return;
      }

      if (dados?.url) {
        window.location.href = dados.url;
        return;
      }

      window.location.href = "/pagamento";
    } catch (error: any) {
      console.log("[checkout] erro ao finalizar pedido:", error);
      console.log("[checkout] erro response:", error?.response);
      console.log("[checkout] erro response data:", error?.response?.data);

      toast.error(
        error?.response?.data?.dados?.erro ||
          error?.response?.data?.erro ||
          error?.response?.data?.mensagem ||
          "Não foi possível cadastrar o pedido."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="spinner-border text-warning" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" autoClose={2500} theme="dark" />

      <style jsx global>{`
        body {
          background: linear-gradient(180deg, #fffaf6 0%, #fff3ea 100%);
        }

        .checkout-page {
          padding: 40px 0 64px;
        }

        .checkout-surface {
          background: rgba(255, 255, 255, 0.96);
          border-radius: 24px;
          border: 1px solid rgba(226, 214, 207, 0.9);
          box-shadow: 0 18px 45px rgba(115, 82, 62, 0.08);
          backdrop-filter: blur(6px);
        }

        .checkout-hero {
          padding: 24px 26px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .checkout-hero-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .checkout-hero-icon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #d18b72 0%, #b96558 100%);
          color: #fff;
          box-shadow: 0 12px 24px rgba(185, 101, 88, 0.22);
        }

        .checkout-hero h1 {
          margin: 0;
          font-size: 28px;
          color: #3f2d26;
          font-weight: 800;
        }

        .checkout-hero p {
          margin: 4px 0 0;
          color: #7d6358;
          font-size: 14px;
        }

        .checkout-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          background: #fff3ea;
          border: 1px solid #efd8cb;
          color: #8e5f4e;
          font-weight: 700;
        }

        .checkout-card {
          padding: 24px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          font-size: 22px;
          color: #3f2d26;
          font-weight: 800;
        }

        .section-title svg {
          color: #b55f53;
        }

        .field-label {
          font-size: 14px;
          color: #6c564c;
          font-weight: 700;
          margin-bottom: 8px;
          display: block;
        }

        .field-input {
          width: 100%;
          min-height: 48px;
          border-radius: 14px;
          border: 1px solid #e7d6cc;
          background: #fff;
          padding: 0 14px;
          color: #43312a;
          outline: none;
          transition: 0.2s ease;
        }

        .field-input:focus {
          border-color: #d18b72;
          box-shadow: 0 0 0 4px rgba(209, 139, 114, 0.12);
        }

        .produto-mini {
          display: grid;
          grid-template-columns: 72px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1e4dc;
        }

        .produto-mini:last-child {
          border-bottom: none;
        }

        .produto-mini-img {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          overflow: hidden;
          background: #f8eee8;
          border: 1px solid #f1dfd5;
        }

        .produto-mini-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .produto-mini-title {
          margin: 0 0 4px;
          font-size: 15px;
          color: #3f2d26;
          font-weight: 800;
        }

        .produto-mini-meta {
          margin: 0;
          font-size: 13px;
          color: #7d6358;
        }

        .produto-mini-price {
          text-align: right;
          color: #a84f45;
          font-size: 15px;
          font-weight: 800;
        }

        .summaryLine {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 15px;
          color: #6c564c;
          margin-bottom: 14px;
        }

        .summaryLine strong {
          color: #3f2d26;
        }

        .summaryTotal {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #ead9cf;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .summaryTotal span {
          font-size: 16px;
          color: #5f4a42;
          font-weight: 700;
        }

        .summaryTotal strong {
          font-size: 26px;
          color: #a84f45;
          font-weight: 900;
        }

        .summarySticky {
          position: sticky;
          top: 90px;
        }

        .btn-brand {
          background: linear-gradient(135deg, #b55f53 0%, #8f433a 100%);
          color: white;
          border: none;
          border-radius: 16px;
          min-height: 52px;
          font-weight: 800;
          box-shadow: 0 14px 28px rgba(143, 67, 58, 0.2);
        }

        .btn-brand:hover {
          color: white;
          opacity: 0.96;
        }

        .btn-outline-brand {
          border: 1px solid #caa998;
          color: #8b5a49;
          background: #fff;
          border-radius: 16px;
          min-height: 48px;
          font-weight: 800;
        }

        .benefitsGrid {
          margin-top: 18px;
          display: grid;
          gap: 10px;
        }

        .benefitItem {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          border-radius: 16px;
          background: #fffaf7;
          border: 1px solid #f0e4dc;
        }

        .benefitItem svg {
          margin-top: 2px;
          color: #b55f53;
          flex-shrink: 0;
        }

        .benefitItem strong {
          display: block;
          color: #4b372f;
          font-size: 14px;
        }

        .benefitItem p {
          margin: 2px 0 0;
          color: #7d6358;
          font-size: 12px;
        }

        .emptyBox {
          padding: 28px;
          border-radius: 20px;
          background: #fffaf7;
          border: 1px dashed #e7cfc1;
          color: #7e665b;
          text-align: center;
        }

        .prefillInfo {
          margin-top: -4px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #8b6b5d;
          background: #fff8f3;
          border: 1px solid #f0ddd2;
          border-radius: 14px;
          padding: 10px 12px;
        }

        .addressCardsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .addressCard {
          width: 100%;
          text-align: left;
          border: 1px solid #ecd8ce;
          background: #fff;
          border-radius: 18px;
          padding: 16px;
          transition: 0.2s ease;
          cursor: pointer;
        }

        .addressCard:hover {
          border-color: #d9a58f;
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(185, 101, 88, 0.08);
        }

        .addressCard.active {
          border-color: #b55f53;
          background: #fff7f4;
          box-shadow: 0 0 0 4px rgba(181, 95, 83, 0.1);
        }

        .addressCardHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .addressCardTitle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 800;
          color: #4b372f;
        }

        .addressPrincipal {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          color: #8f433a;
          background: #fff1ec;
          border: 1px solid #f0d1c7;
          padding: 6px 10px;
          border-radius: 999px;
        }

        .addressCardText {
          font-size: 13px;
          color: #6c564c;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 992px) {
          .summarySticky {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .produto-mini {
            grid-template-columns: 1fr;
          }

          .produto-mini-img {
            width: 100%;
            height: 180px;
          }

          .produto-mini-price {
            text-align: left;
          }
        }
      `}</style>

      <main className="checkout-page">
        <div className="container">
          <div className="checkout-surface checkout-hero">
            <div className="checkout-hero-left">
              <div className="checkout-hero-icon">
                <FiShoppingBag size={26} />
              </div>
              <div>
                <h1>Checkout</h1>
                <p>Selecione um endereço salvo ou cadastre um novo.</p>
              </div>
            </div>

            <div className="checkout-chip">
              {totalItens} {totalItens === 1 ? "item" : "itens"}
            </div>
          </div>

          {erro ? (
            <div className="alert alert-warning">{erro}</div>
          ) : itens.length === 0 ? (
            <div className="checkout-surface checkout-card">
              <div className="emptyBox">Seu carrinho está vazio.</div>
            </div>
          ) : (
            <form onSubmit={handleContinuar}>
              <div className="row g-4">
                <div className="col-lg-8 d-grid gap-4">
                  <div className="checkout-surface checkout-card">
                    <div className="section-title">
                      <FiMapPin size={20} />
                      <span>Endereços salvos</span>
                    </div>

                    <div className="prefillInfo">
                      Clique em um card para usar o endereço no pedido.
                    </div>

                    {carregandoEnderecos ? (
                      <div className="emptyBox">Carregando endereços...</div>
                    ) : temEnderecoCadastrado ? (
                      <div className="addressCardsGrid">
                        {enderecos.map((endereco) => {
                          const ativo =
                            Number(enderecoSelecionadoId) === Number(endereco.id_endereco);

                          return (
                            <button
                              key={endereco.id_endereco}
                              type="button"
                              className={`addressCard ${ativo ? "active" : ""}`}
                              onClick={() => selecionarEndereco(endereco)}
                            >
                              <div className="addressCardHead">
                                <div className="addressCardTitle">
                                  <FiHome size={16} />
                                  <span>Endereço #{endereco.id_endereco}</span>
                                </div>

                                {Number(endereco.principal) === 1 && (
                                  <span className="addressPrincipal">
                                    <FiCheckCircle size={13} />
                                    Principal
                                  </span>
                                )}
                              </div>

                              <p className="addressCardText">
                                {endereco.endereco || "Endereço não informado"}
                                {endereco.numero ? `, ${endereco.numero}` : ""}
                                <br />
                                {endereco.bairro ? `${endereco.bairro} - ` : ""}
                                {endereco.cidade || ""}
                                {endereco.estado ? `/${endereco.estado}` : ""}
                                <br />
                                CEP: {endereco.cep || "Não informado"}
                                {endereco.complemento
                                  ? ` • ${endereco.complemento}`
                                  : ""}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="emptyBox">
                        Você ainda não possui endereço salvo.
                      </div>
                    )}
                  </div>

                  {!temEnderecoCadastrado && (
                    <div className="checkout-surface checkout-card">
                      <div className="section-title">
                        <FiMapPin size={20} />
                        <span>Cadastrar endereço</span>
                      </div>

                      <div className="prefillInfo">
                        Preencha os dados e clique em salvar para guardar no usuário.
                      </div>

                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="field-label">CEP</label>
                          <input
                            className="field-input"
                            name="cep"
                            value={form.cep}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-md-8">
                          <label className="field-label">Endereço</label>
                          <input
                            className="field-input"
                            name="endereco"
                            value={form.endereco}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-md-3">
                          <label className="field-label">Número</label>
                          <input
                            className="field-input"
                            name="numero"
                            value={form.numero}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-md-9">
                          <label className="field-label">Complemento</label>
                          <input
                            className="field-input"
                            name="complemento"
                            value={form.complemento}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-md-5">
                          <label className="field-label">Bairro</label>
                          <input
                            className="field-input"
                            name="bairro"
                            value={form.bairro}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-md-5">
                          <label className="field-label">Cidade</label>
                          <input
                            className="field-input"
                            name="cidade"
                            value={form.cidade}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-md-2">
                          <label className="field-label">Estado</label>
                          <input
                            className="field-input"
                            name="estado"
                            value={form.estado}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-12">
                          <button
                            type="button"
                            className="btn btn-outline-brand"
                            onClick={salvarEnderecoUsuario}
                          >
                            Salvar endereço
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-lg-4">
                  <div className="checkout-surface checkout-card summarySticky">
                    <h5 className="section-title" style={{ marginBottom: 16 }}>
                      <FiShoppingBag size={20} />
                      <span>Resumo do pedido</span>
                    </h5>

                    <div className="d-grid gap-2 mb-3">
                      {itens.map((item) => {
                        const preco = precoFinalItem(item);
                        const subtotalItem = preco * item.quantidade;

                        return (
                          <div key={item.id_item} className="produto-mini">
                            <div className="produto-mini-img">
                              <img
                                src={imagemUrl(item.imagem)}
                                alt={item.nome_produto}
                              />
                            </div>

                            <div>
                              <h6 className="produto-mini-title">
                                {item.nome_produto}
                              </h6>
                              <p className="produto-mini-meta">
                                Quantidade: {item.quantidade}
                              </p>
                            </div>

                            <div className="produto-mini-price">
                              {formatBRL(subtotalItem)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="summaryLine">
                      <span>Itens</span>
                      <strong>{totalItens}</strong>
                    </div>

                    <div className="summaryLine">
                      <span>Subtotal</span>
                      <strong>{formatBRL(subtotal)}</strong>
                    </div>

                    {desconto > 0 && (
                      <div className="summaryLine">
                        <span>Desconto</span>
                        <strong>- {formatBRL(desconto)}</strong>
                      </div>
                    )}

                    <div className="summaryLine">
                      <span>Frete</span>
                      <strong>{frete > 0 ? formatBRL(frete) : "Grátis"}</strong>
                    </div>

                    <div className="summaryTotal">
                      <span>Total</span>
                      <strong>{formatBRL(total)}</strong>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-brand w-100 mt-4"
                      disabled={enviando || itens.length === 0}
                    >
                      {enviando ? "Salvando pedido..." : "Continuar para pagamento"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-brand w-100 mt-2"
                      onClick={carregarCarrinho}
                    >
                      Atualizar checkout
                    </button>

                    <div className="benefitsGrid">
                      <div className="benefitItem">
                        <FiTruck size={18} />
                        <div>
                          <strong>Entrega segura</strong>
                          <p>Acompanhe seu pedido com mais tranquilidade.</p>
                        </div>
                      </div>

                      <div className="benefitItem">
                        <FiShield size={18} />
                        <div>
                          <strong>Compra protegida</strong>
                          <p>Seus dados e pedido com mais segurança.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}