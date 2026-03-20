export type ApiIndexData = {
  version?: string;
  status?: string;
};

export type ApiIndexResponse = {
  status: number;
  mensagem: string;
  dados?: ApiIndexData;
};

export interface Menu {
  id?: number;
  id_menu?: number;
  site_config_id?: number;
  titulo?: string;
  nome?: string;
  icone?: string | null;
  rota?: string | null;
  pesquisa_placeholder?: string | null;
  posicao?: number;
  itens?: MenuItem[];
}

export interface MenuItem {
  id?: number;
  id_item: number;
  id_menu?: number;
  titulo?: string;
  nome?: string;
  icone?: string | null;
  rota?: string | null;
  posicao?: number;
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


export type SiteConfig = {
  id_site_config: number;
  nome_site: string;
  titulo: string;
  subtitulo: string;
  logo: string | null;
  favicon: string | null;
};

export type SiteConfigResponse = {
  status: number;
  mensagem: string;
  dados: SiteConfig[];
};

/**
 * Interface REAL do usuário autenticado
 */
export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  nivel_id: number;
  status_id: number;
  criado: string;
  atualizado: string;
}