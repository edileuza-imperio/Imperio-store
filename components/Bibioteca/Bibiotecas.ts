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


export type VitrineItem = {
  id_vitrine_item: number | string;
  vitrine_id?: number | string;
  produto_id?: number | string | null;
  campanha_id?: number | string | null;
  categoria_id?: number | string | null;
  titulo_personalizado?: string | null;
  subtitulo_personalizado?: string | null;
  imagem_personalizada?: string | null;
  status_id?: number | string;
  nivel_id?: number | string;
  criado_em?: string;
  atualizado_em?: string;
};

export type Vitrine = {
  id_vitrine: number | string;
  nome?: string;
  titulo?: string;
  subtitulo?: string | null;
  tipo?: string;
  slug?: string;
  status_id?: number | string;
  nivel_id?: number | string;
  itens?: VitrineItem[];
};

export type EntidadeGenerica = {
  id?: number | string;
  id_produto?: number | string;
  id_campanha?: number | string;
  id_categoria?: number | string;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
  descricao_curta?: string;
  imagem?: string;
  miniatura?: string;
  banner?: string;
  foto?: string;
  desktop?: string;
  mobile?: string;
  slug?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  sku?: string;
  marca?: string;
};

 export type ItemResolvido = VitrineItem & {
  entidade: EntidadeGenerica | null;
  tipo_item: "produto" | "campanha" | "categoria" | "banner" | "custom";
  titulo_final: string;
  subtitulo_final: string;
  descricao_final: string;
  imagem_final: string;
  link_final: string;
  preco_final?: number | string | null;
  preco_original?: number | string | null;
  marca_final?: string;
  sku_final?: string;
  economia_final?: string | null;
};

export type Props = {
  slug?: string;
  vitrine?: Vitrine | null;
  tituloPersonalizado?: string;
  subtituloPersonalizado?: string;
  limite?: number;
  className?: string;
  verMaisHref?: string;
  verMaisTexto?: string;
  onAdicionarCarrinho?: (item: ItemResolvido) => void;
};