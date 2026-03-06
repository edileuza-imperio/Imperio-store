export type ApiIndexData = {
  version?: string;
  status?: string;
};

export type ApiIndexResponse = {
  status: number;
  mensagem: string;
  dados?: ApiIndexData;
};

export interface MenuItem {
  id?: number;
  titulo?: string;
  rota?: string | null;
  icone?: string;
  posicao?: number;
  permissoes?: string[];
}

export interface Menu {
  id?: number;
  titulo?: string;
  icone?: string;
  rota?: string | null;
  pesquisa_placeholder?: string | null;
  permissoes?: string[];
  itens?: MenuItem[];
}

export interface Banner {
  id_banner?: number;
  titulo: string;
  descricao: string;
  imagem: string;
  link?: string | null;
  visualizacoes: number;
  cliques: number;
  statusid?: number;
}

export interface Categoria {
  id_categoria: number;
  nome: string;
  icone: string;
  statusid: number;
  criado: string;
}

export type CampanhaApi = {
  titulo?: string;
  slug?: string;
  descricao?: string;
  banner?: string;
  status_nome?: string;
  status_codigo?: string;
};

export type ProdutoApi = {
  id_produto?: number;
  nome?: string;
  slug?: string;
  descricao?: string;
  preco?: string | number;
  imagem?: string;
  ordem?: number;
};

export type CampanhaUI = {
  titulo: string;
  slug: string;
  descricao: string;
  banner: string;
  status_nome?: string;
  status_codigo?: string;
};

export type ProdutoUI = {
  key: string | number;
  id_produto: number;
  nome: string;
  slug: string;
  descricao: string;
  preco: string | number;
  imagem: string;
  ordem: number;
};



export type CarrinhoItem = {
  id_item: number;
  nome_produto: string;
  imagem?: string;
  quantidade: number;
  preco_unitario: string | number;
  
  
};



export type Endereco = {
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
};

export type EnderecoDB = {
  id_endereco: number;
  carrinho_id?: number;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  criado?: string;
  atualizado?: string;
  nome?: string;
};

export type Cupom = {
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  descricao?: string;
};

export type PixPayload = {
  qrUrl?: string;
  payload?: string;
  ticketUrl?: string;
};


