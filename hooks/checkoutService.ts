import api from "@/Api/conectar";
import {
  Endereco,
  EnderecoDB,
} from "@/components/Bibioteca/Bibiotecas";
import { pickCarrinho } from "@/components/Bibioteca/functions";

export type CarrinhoItem = {
  id_item: number;
  nome_produto: string;
  preco_unitario: number | string;
  quantidade: number;
  imagem?: string;
};

export type CarrinhoResponse = {
  itens: CarrinhoItem[];
  endereco: any | null;
};

export type CheckoutEnderecoState = {
  enderecos: EnderecoDB[];
  enderecoSelecionadoId: number | null;
  mostrarFormularioEndereco: boolean;
  endereco: Endereco;
};

export type CheckoutInicialState = CheckoutEnderecoState & {
  itens: CarrinhoItem[];
};

export async function buscarUsuarioLogado() {
  return api.get("/me");
}

export async function buscarCarrinho(): Promise<CarrinhoResponse> {
  const resp = await api.get("/carrinho");
  const parsed = pickCarrinho(resp.data);

  return {
    itens: Array.isArray(parsed?.itens) ? parsed.itens : [],
    endereco: parsed?.endereco ?? null,
  };
}

export async function buscarEnderecosCarrinho(): Promise<EnderecoDB[]> {
  const resp = await api.get("/carrinho/enderecos");
  const base = resp.data?.dados ?? resp.data?.data ?? resp.data;

  if (Array.isArray(base)) return base;
  if (Array.isArray(base?.enderecos)) return base.enderecos;

  return [];
}

export async function salvarEnderecoCarrinho(
  payload: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  },
  possuiEnderecos: boolean
) {
  if (possuiEnderecos) {
    return api.put("/carrinho/endereco", payload);
  }

  return api.post("/carrinho/endereco", payload);
}

export async function aplicarEnderecoSalvo(payload: {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}) {
  return api.put("/carrinho/endereco", payload);
}

export async function validarCupom(codigo: string) {
  return api.get(`/cupom/${encodeURIComponent(codigo)}`);
}

export async function finalizarPedidoPix() {
  return api.post("/pedido/finalizar", {
    metodo_pagamento: "pix",
  });
}

export async function finalizarPedidoCartao(payload: {
  nome: string;
  numero: string;
  validade: string;
  cvv: string;
}) {
  return api.post("/pedido/finalizar", {
    metodo_pagamento: "cartao",
    pagamento_info: payload,
  });
}

function enderecoVazio(): Endereco {
  return {
    estado: "SP",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
  };
}

function mapEnderecoDBParaForm(endereco: Partial<EnderecoDB> | null | undefined): Endereco {
  return {
    cep: endereco?.cep ?? "",
    rua: endereco?.rua ?? "",
    numero: endereco?.numero ?? "",
    complemento: endereco?.complemento ?? "",
    bairro: endereco?.bairro ?? "",
    cidade: endereco?.cidade ?? "",
    estado: endereco?.estado ?? "SP",
  };
}

function mesclarEnderecoAtual(
  base: Endereco,
  enderecoCarrinho: any
): Endereco {
  if (!enderecoCarrinho) return base;

  return {
    cep: base.cep || enderecoCarrinho.cep || "",
    rua: base.rua || enderecoCarrinho.rua || "",
    numero: base.numero || enderecoCarrinho.numero || "",
    complemento: base.complemento || enderecoCarrinho.complemento || "",
    bairro: base.bairro || enderecoCarrinho.bairro || "",
    cidade: base.cidade || enderecoCarrinho.cidade || "",
    estado: base.estado || enderecoCarrinho.estado || "SP",
  };
}

export async function carregarEnderecosSalvosState(): Promise<CheckoutEnderecoState> {
  try {
    const enderecos = await buscarEnderecosCarrinho();

    if (enderecos.length > 0) {
      const primeiro = enderecos[0];

      return {
        enderecos,
        enderecoSelecionadoId: primeiro.id_endereco,
        mostrarFormularioEndereco: false,
        endereco: mapEnderecoDBParaForm(primeiro),
      };
    }

    return {
      enderecos: [],
      enderecoSelecionadoId: null,
      mostrarFormularioEndereco: true,
      endereco: enderecoVazio(),
    };
  } catch {
    return {
      enderecos: [],
      enderecoSelecionadoId: null,
      mostrarFormularioEndereco: true,
      endereco: enderecoVazio(),
    };
  }
}

export async function carregarCheckoutInicial(): Promise<CheckoutInicialState> {
  await buscarUsuarioLogado();

  const enderecoState = await carregarEnderecosSalvosState();
  const carrinho = await buscarCarrinho();

  return {
    itens: carrinho.itens || [],
    enderecos: enderecoState.enderecos,
    enderecoSelecionadoId: enderecoState.enderecoSelecionadoId,
    mostrarFormularioEndereco: enderecoState.mostrarFormularioEndereco,
    endereco: mesclarEnderecoAtual(enderecoState.endereco, carrinho.endereco),
  };
}

export function normalizarPayloadEndereco(endereco: Endereco) {
  return {
    cep: (endereco.cep ?? "").replace(/\D/g, "").slice(0, 8),
    rua: endereco.rua ?? "",
    numero: endereco.numero ?? "",
    complemento: endereco.complemento ?? "",
    bairro: endereco.bairro ?? "",
    cidade: endereco.cidade ?? "",
    estado: endereco.estado ?? "SP",
  };
}

export function mapEnderecoSelecionado(endereco: EnderecoDB): Endereco {
  return {
    cep: endereco.cep ?? "",
    rua: endereco.rua ?? "",
    numero: endereco.numero ?? "",
    complemento: endereco.complemento ?? "",
    bairro: endereco.bairro ?? "",
    cidade: endereco.cidade ?? "",
    estado: endereco.estado ?? "SP",
  };
}