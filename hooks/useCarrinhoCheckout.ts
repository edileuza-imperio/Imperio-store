import api from "@/Api/conectar";

/* ===================== TYPES ===================== */
export interface CarrinhoItem {
  id_item: number;
  nome_produto: string;
  imagem?: string;
  quantidade: number;
  preco_unitario: string;
}

export type CupomApi = {
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  descricao?: string;
};

/* ===================== HELPERS ===================== */
export const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;

  const base = api.defaults.baseURL || "";

  // Remove barras duplicadas no início do caminho
  const caminhoLimpo = caminho.replace(/^\/+/, "");

  // Garante que a base termine com barra
  const baseFinal = base.endsWith("/") ? base : `${base}/`;

  return `${baseFinal}${caminhoLimpo}`;
};

// Luhn check
export const isValidCardLuhn = (num: string) => {
  const s = num.replace(/\D/g, "");
  let sum = 0;
  let alternate = false;

  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0 && s.length >= 13 && s.length <= 19;
};

export const maskCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();

export const maskExpiry = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 4)
    .replace(/^(\d{2})(\d{1,2})?/, (_, m, y) => (y ? `${m}/${y}` : m));

/* ===================== API ===================== */
export const CarrinhoService = {
  async listar(usuarioId: number) {
    const resp = await api.get(`/carrinho/${usuarioId}`);
    return resp.data?.dados || [];
  },

  async atualizarQuantidade(idItem: number, quantidade: number) {
    return api.put(`/carrinho/atualizar/${idItem}`, { quantidade });
  },

  async removerItem(idItem: number) {
    return api.delete(`/carrinho/remover/${idItem}`);
  },

  async validarCupom(codigo: string): Promise<CupomApi | null> {
    const resp = await api.get(`/cupom/${encodeURIComponent(codigo)}`);
    return resp.data?.dados || null;
  },

  async finalizarPedido(payload: any) {
    const resp = await api.post("/pedido/finalizar", payload);
    return resp.data?.dados || resp.data;
  },
};
