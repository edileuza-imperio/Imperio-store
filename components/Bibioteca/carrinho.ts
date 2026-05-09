export type Pedido = {
  id_pedido?: number;
  valor_total?: number | string;
  valor_produtos?: number | string;
  valor_frete?: number | string;
  valor_desconto?: number | string;
  status_pagamento?: string;
  status?: string;
};

export type Usuario = {
  id_usuario?: number;
  nome?: string;
  email?: string;
  cpf?: string;
};

export type ApiPedidoResponse = {
  dados?: {
    pedido?: Pedido;
    usuario?: Usuario;
  };

  pedido?: Pedido;
  usuario?: Usuario;
};

export type ApiPixResponse = {
  dados?: {
    pix?: {
      qr_code?: string;
    };
  };

  pix?: {
    qr_code?: string;
  };
};

export type ApiVerificarPagamentoResponse = {
  dados?: {
    pedido?: Pedido;
  };

  pedido?: Pedido;
};

export function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") return valor;

  if (typeof valor === "string") {
    return Number(
      valor.replace(/\./g, "").replace(",", ".")
    );
  }

  return 0;
}

export function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizarNumero(valor));
}

