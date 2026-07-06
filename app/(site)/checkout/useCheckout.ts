"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InicioApi } from "@/services/api/api";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { rotas } from "@/components/Bibioteca/config/rotas";

type AnyRecord = Record<string, any>;

export type Endereco = {
  id?: number;
  id_endereco?: number;
  cep?: string;
  rua?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
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

export type OpcaoEntrega = {
  id: string;
  nome: string;
  descricao?: string;
  valor: number;
  prazo?: string;
  tipo?: string;
  selecionavel?: boolean;
};

type Pedido = {
  id_pedido?: number;
  pedido_id?: number;
  id?: number;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
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

function limparCep(cep: string) {
  return cep.replace(/\D/g, "").slice(0, 8);
}

function formatarCep(cep: string) {
  const limpo = limparCep(cep);
  if (limpo.length <= 5) return limpo;
  return `${limpo.slice(0, 5)}-${limpo.slice(5)}`;
}

function extrairLista<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.itens)) return payload.itens;
  if (Array.isArray(payload?.opcoes)) return payload.opcoes;
  if (Array.isArray(payload?.dados?.itens)) return payload.dados.itens;
  if (Array.isArray(payload?.dados?.opcoes)) return payload.dados.opcoes;
  if (Array.isArray(payload?.carrinho?.itens)) return payload.carrinho.itens;
  return [];
}

function normalizarOpcaoEntrega(opcao: any, index: number): OpcaoEntrega {
  const id =
    String(opcao?.id ?? opcao?.codigo ?? opcao?.tipo ?? `entrega_${index}`)
      .trim()
      .replace(/\s+/g, "_") || `entrega_${index}`;

  return {
    id,
    nome: String(opcao?.nome ?? opcao?.titulo ?? "Entrega").trim(),
    descricao:
      String(opcao?.descricao ?? opcao?.description ?? "").trim() || undefined,
    valor: normalizarNumero(opcao?.valor ?? opcao?.preco ?? opcao?.price ?? 0),
    prazo: String(opcao?.prazo ?? opcao?.tempo ?? "").trim() || undefined,
    tipo: String(opcao?.tipo ?? "").trim() || undefined,
    selecionavel: opcao?.selecionavel !== false,
  };
}

export function getEnderecoId(endereco: Endereco) {
  return endereco.id ?? endereco.id_endereco ?? 0;
}

export function getItemId(item: ItemCarrinho) {
  return item.id_carrinho_item ?? item.id ?? "";
}

export function getItemNome(item: ItemCarrinho) {
  return (
    item.produto?.nome ||
    item.produto?.titulo ||
    item.produto_nome ||
    item.nome ||
    item.titulo ||
    "Produto sem nome"
  );
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
      : normalizarNumero(item.preco_unitario) * getItemQuantidade(item));

  return normalizarNumero(subtotal);
}

export function useCheckout() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [calculandoFrete, setCalculandoFrete] = useState(false);

  const [erroEndereco, setErroEndereco] = useState("");
  const [sucessoEndereco, setSucessoEndereco] = useState("");
  const [erroFrete, setErroFrete] = useState("");

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<number | null>(
    null
  );

  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  const [opcoesEntrega, setOpcoesEntrega] = useState<OpcaoEntrega[]>([]);
  const [entregaSelecionada, setEntregaSelecionada] = useState<string | null>(
    null
  );

  const [formEndereco, setFormEndereco] = useState({
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  function alterarCampoEndereco(campo: string, valor: string) {
    setErroEndereco("");
    setSucessoEndereco("");

    setFormEndereco((prev) => ({
      ...prev,
      [campo]: campo === "cep" ? formatarCep(valor) : valor,
    }));
  }

  async function buscarCep(cepManual?: string) {
    const cepLimpo = limparCep(cepManual ?? formEndereco.cep);

    if (cepLimpo.length !== 8) {
      setErroEndereco("Digite um CEP válido com 8 números.");
      return;
    }

    try {
      setBuscandoCep(true);
      setErroEndereco("");
      setSucessoEndereco("");

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = (await response.json()) as ViaCepResponse;

      if (data.erro) {
        setErroEndereco("CEP não encontrado.");
        return;
      }

      setFormEndereco((prev) => ({
        ...prev,
        cep: formatarCep(data.cep ?? cepLimpo),
        rua: data.logradouro ?? prev.rua,
        complemento: prev.complemento || data.complemento || "",
        bairro: data.bairro ?? prev.bairro,
        cidade: data.localidade ?? prev.cidade,
        estado: data.uf ?? prev.estado,
      }));

      setSucessoEndereco("Endereço preenchido pelo CEP.");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setErroEndereco("Erro ao buscar CEP. Preencha manualmente.");
    } finally {
      setBuscandoCep(false);
    }
  }

  async function carregarCheckout() {
    try {
      setLoading(true);

      const [enderecoRes, carrinhoRes, itensRes] = await Promise.all([
        InicioApi.get<any>(rotas.usuarios.enderecos, { withCredentials: true }),
        InicioApi.get<any>(rotas.carrinho.buscar, { withCredentials: true }),
        InicioApi.get<any>(rotas.carrinho.itens, { withCredentials: true }),
      ]);

      const listaEnderecos = extrairLista<Endereco>(enderecoRes?.data ?? {});
      const listaItens = extrairLista<ItemCarrinho>(itensRes?.data ?? {});

      const carrinhoData: Carrinho =
        carrinhoRes?.data?.dados ??
        carrinhoRes?.data?.data ??
        carrinhoRes?.data ??
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
    const cepLimpo = limparCep(formEndereco.cep);

    if (
      cepLimpo.length !== 8 ||
      !formEndereco.rua ||
      !formEndereco.numero ||
      !formEndereco.bairro ||
      !formEndereco.cidade ||
      !formEndereco.estado
    ) {
      setErroEndereco("Preencha todos os campos obrigatórios do endereço.");
      return;
    }

    try {
      setSalvandoEndereco(true);
      setErroEndereco("");
      setSucessoEndereco("");

      await InicioApi.post(
        rotas.usuarios.enderecos,
        {
          cep: formEndereco.cep,
          endereco: formEndereco.rua,
          rua: formEndereco.rua,
          numero: formEndereco.numero,
          complemento: formEndereco.complemento,
          bairro: formEndereco.bairro,
          cidade: formEndereco.cidade,
          estado: formEndereco.estado,
          principal: 1,
        },
        { withCredentials: true }
      );

      setFormEndereco({
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      });

      setSucessoEndereco("Endereço cadastrado com sucesso.");
      await carregarCheckout();
    } catch (error: any) {
      console.error("Erro ao cadastrar endereço:", error);

      setErroEndereco(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Erro ao cadastrar endereço."
      );
    } finally {
      setSalvandoEndereco(false);
    }
  }

  const subtotalItens = useMemo(() => {
    return itens.reduce((acc, item) => acc + getItemSubtotal(item), 0);
  }, [itens]);

  const valorDesconto = normalizarNumero(carrinho?.valor_desconto ?? 0);

  const entregaSelecionadaDados = useMemo(() => {
    return (
      opcoesEntrega.find((opcao) => opcao.id === entregaSelecionada) ?? null
    );
  }, [opcoesEntrega, entregaSelecionada]);

  const valorFrete = normalizarNumero(
    entregaSelecionadaDados?.valor ?? carrinho?.valor_frete ?? 0
  );

  const valorTotal = Math.max(0, subtotalItens - valorDesconto + valorFrete);

  const enderecoAtual = useMemo(() => {
    return (
      enderecos.find((endereco) => getEnderecoId(endereco) === enderecoSelecionado) ??
      null
    );
  }, [enderecos, enderecoSelecionado]);

  useEffect(() => {
    setOpcoesEntrega([]);
    setEntregaSelecionada(null);
    setErroFrete("");
  }, [enderecoSelecionado]);

  async function calcularFrete(enderecoManual?: Endereco): Promise<OpcaoEntrega[]> {
    const endereco = enderecoManual ?? enderecoAtual;

    if (!endereco) {
      setErroFrete("Selecione um endereço para calcular a entrega.");
      return [];
    }

    try {
      setCalculandoFrete(true);
      setErroFrete("");

      const response = await InicioApi.post<any>(
        "/frete/calcular",
        {
          cep: endereco.cep,
          cidade: endereco.cidade,
          estado: endereco.estado,
          subtotal: subtotalItens,
          itens: itens.map((item) => ({
            produto_id: item.produto_id,
            quantidade: getItemQuantidade(item),
            subtotal: getItemSubtotal(item),
          })),
        },
        { withCredentials: true }
      );

      const payload = response?.data ?? {};
      const dados = payload?.dados ?? payload?.data ?? payload;
      const opcoes = extrairLista<any>(dados?.opcoes ?? dados)
        .map(normalizarOpcaoEntrega)
        .filter((opcao) => opcao.selecionavel !== false);

      if (!opcoes.length) {
        setErroFrete(
          "Não encontramos opções de entrega para esse endereço. Confira os dados informados."
        );
        setOpcoesEntrega([]);
        setEntregaSelecionada(null);
        return [];
      }

      const recomendada = String(dados?.opcao_recomendada ?? "").trim();
      const recomendadaExiste = opcoes.some((opcao) => opcao.id === recomendada);

      setOpcoesEntrega(opcoes);
      setEntregaSelecionada((atual) => {
        const atualExiste = opcoes.some((opcao) => opcao.id === atual);

        if (atualExiste) return atual;
        if (recomendadaExiste) return recomendada;

        return opcoes[0].id;
      });

      return opcoes;
    } catch (error: any) {
      console.error("Erro ao calcular frete:", error);

      const fallback: OpcaoEntrega[] = [
        {
          id: "retirada_combinar",
          nome: "Retirada / combinar entrega",
          descricao: "Combine a retirada ou entrega diretamente com a loja.",
          valor: 0,
          prazo: "Combinar com a loja",
          tipo: "retirada",
          selecionavel: true,
        },
      ];

      setErroFrete(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Não foi possível calcular a entrega agora. Você pode combinar a entrega com a loja."
      );

      setOpcoesEntrega(fallback);
      setEntregaSelecionada(fallback[0].id);

      return fallback;
    } finally {
      setCalculandoFrete(false);
    }
  }

  async function finalizarCheckout() {
    if (!enderecoSelecionado) {
      alert("Selecione ou cadastre um endereço.");
      return;
    }

    if (!itens.length) {
      alert("Carrinho vazio.");
      return;
    }

    if (!entregaSelecionadaDados) {
      alert("Selecione uma forma de entrega.");
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
        entrega: {
          id: entregaSelecionadaDados.id,
          nome: entregaSelecionadaDados.nome,
          descricao: entregaSelecionadaDados.descricao,
          tipo: entregaSelecionadaDados.tipo,
          prazo: entregaSelecionadaDados.prazo,
          valor: valorFrete,
        },
        valor_produtos: normalizarNumero(
          carrinho?.valor_produtos ?? subtotalItens
        ),
        valor_desconto: valorDesconto,
        valor_frete: valorFrete,
        valor_total: valorTotal,
      };

      const response = await InicioApi.post<any>(
        rotas.pedidos.checkout,
        payload,
        { withCredentials: true }
      );

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

      router.push(rotas.paginas.pagamento(pedidoId));
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
    buscandoCep,
    calculandoFrete,
    erroEndereco,
    sucessoEndereco,
    erroFrete,

    enderecos,
    enderecoSelecionado,
    setEnderecoSelecionado,

    formEndereco,
    alterarCampoEndereco,
    buscarCep,
    cadastrarEndereco,

    carrinho,
    itens,
    subtotalItens,
    valorFrete,
    valorDesconto,
    valorTotal,

    opcoesEntrega,
    entregaSelecionada,
    setEntregaSelecionada,
    entregaSelecionadaDados,
    calcularFrete,

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