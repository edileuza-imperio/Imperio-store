"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InicioApi } from "@/services/api/api";
import { imagemFundo } from "@/components/Bibioteca/imagem";


type AnyRecord = Record<string, any>;

export type Endereco = {
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

export type Carrinho = {
  id_carrinho?: number;
  usuario_id?: number;
  valor_produtos?: number | string;
  valor_desconto?: number | string;
  valor_frete?: number | string;
  valor_total?: number | string;
};

export type ItemCarrinho = {
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
  imagem_url?: string;
  produto?: {
    nome?: string;
    titulo?: string;
    imagem?: string;
    miniatura?: string;
    foto?: string;
    imagem_url?: string;
  };
};

type Pedido = {
  id_pedido?: number;
  pedido_id?: number;
  id?: number;
};

export function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  if (typeof valor === "string") {
    const limpo = valor.replace(/\./g, "").replace(",", ".");
    const numero = Number(limpo);
    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

export function formatarMoeda(valor: unknown) {
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

export function getEnderecoId(endereco: Endereco) {
  return endereco.id ?? endereco.id_endereco ?? 0;
}

export function getItemId(item: ItemCarrinho) {
  return item.id_carrinho_item ?? item.id ?? "";
}

export function getItemNome(item: ItemCarrinho) {
  const nome =
    item.produto?.nome ??
    item.produto?.titulo ??
    item.produto_nome ??
    item.nome ??
    item.titulo;

  return nome?.trim() ? nome : "Produto sem nome";
}

export function getItemImagem(item: ItemCarrinho) {
  return (
    imagemFundo(
      item.imagem_url ||
        item.miniatura ||
        item.imagem ||
        item.foto ||
        item.produto?.imagem_url ||
        item.produto?.miniatura ||
        item.produto?.imagem ||
        item.produto?.foto
    ) || "/images/sem-imagem.png"
  );
}

export function getItemQuantidade(item: ItemCarrinho) {
  return Math.max(1, normalizarNumero(item.quantidade) || 1);
}

export function getItemSubtotal(item: ItemCarrinho) {
  const subtotal =
    item.subtotal ??
    item.total ??
    (item.preco_promocional_unitario != null
      ? normalizarNumero(item.preco_promocional_unitario) *
        getItemQuantidade(item)
      : item.preco_unitario != null
      ? normalizarNumero(item.preco_unitario) * getItemQuantidade(item)
      : 0);

  return normalizarNumero(subtotal);
}

export function useCheckout() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<number | null>(
    null
  );

  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  const [formEndereco, setFormEndereco] = useState({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  function alterarCampoEndereco(campo: string, valor: string) {
    setFormEndereco((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function carregarCheckout() {
    try {
      setLoading(true);

      const [enderecoRes, carrinhoRes, itensRes] = await Promise.all([
        InicioApi.get<any>("/usuario/endereco", { withCredentials: true }),
        InicioApi.get<any>("/carrinho", { withCredentials: true }),
        InicioApi.get<any>("/carrinho/itens", { withCredentials: true }),
      ]);

      const enderecoPayload: AnyRecord = enderecoRes?.data ?? {};
      const carrinhoPayload: AnyRecord = carrinhoRes?.data ?? {};
      const itensPayload: AnyRecord = itensRes?.data ?? {};

      const listaEnderecos = extrairLista<Endereco>(enderecoPayload);
      const listaItens = extrairLista<ItemCarrinho>(itensPayload);

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

  useEffect(() => {
    carregarCheckout();
  }, []);

  async function cadastrarEndereco() {
    if (
      !formEndereco.cep ||
      !formEndereco.rua ||
      !formEndereco.numero ||
      !formEndereco.bairro ||
      !formEndereco.cidade ||
      !formEndereco.estado
    ) {
      alert("Preencha todos os campos do endereço.");
      return;
    }

    try {
      setSalvandoEndereco(true);

      await InicioApi.post(
        "/usuario/endereco",
        {
          cep: formEndereco.cep,
          rua: formEndereco.rua,
          numero: formEndereco.numero,
          bairro: formEndereco.bairro,
          cidade: formEndereco.cidade,
          estado: formEndereco.estado,
          principal: true,
        },
        {
          withCredentials: true,
        }
      );

      setFormEndereco({
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
      });

      await carregarCheckout();
    } catch (error) {
      console.error("Erro ao cadastrar endereço:", error);
      alert("Erro ao cadastrar endereço.");
    } finally {
      setSalvandoEndereco(false);
    }
  }

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
      alert("Selecione ou cadastre um endereço.");
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

      const responseData: AnyRecord = response?.data ?? {};

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

  return {
    loading,
    processando,
    salvandoEndereco,

    enderecos,
    enderecoSelecionado,
    setEnderecoSelecionado,

    formEndereco,
    alterarCampoEndereco,
    cadastrarEndereco,

    carrinho,
    itens,
    subtotalItens,
    valorFrete,
    valorDesconto,
    valorTotal,

    isCarrinhoVazio: !loading && itens.length === 0,
    finalizarCheckout,

    getEnderecoId,
    getItemId,
    getItemNome,
    getItemImagem,
    getItemQuantidade,
    getItemSubtotal,
    formatarMoeda,
  };
}