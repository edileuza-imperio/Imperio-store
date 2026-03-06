export type PedidoApi = {
  id?: number;
  id_pedido?: number;
  pedido_id?: number;

  usuario_id?: number;

  statusid?: number;
  status_id?: number;
  status?: string;
  status_nome?: string;
  status_codigo?: string;

  total?: number | string;
  frete?: number | string;

  metodo_pagamento?: string;
  pagamento_info?: any;

  criado?: string;
  atualizado?: string;
  created_at?: string;
  data?: string;

  endereco?: any;
};

export type PedidoItemApi = {
  pedido_id?: number;
  produto_id?: number;
  quantidade?: number;
  preco_unitario?: number | string;
  subtotal?: number | string;

  nome?: string;
  titulo?: string;
  nome_produto?: string;
};

export type DetalhesApi = {
  id?: number;
  statusid?: number;
  status_id?: number;
  status?: string;
  status_nome?: string;
  status_codigo?: string;

  total?: number | string;
  frete?: number | string;
  metodo_pagamento?: string;

  endereco?: string;
  itens: PedidoItemApi[];
};