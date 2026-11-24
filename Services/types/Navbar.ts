// =====================================================
// TIPOS DA NAVEGAÇÃO
// =====================================================

export type ValorBooleano = boolean | number | string | null;

export interface ApiItem {
  id_menu_item: number;
  menu_id: number;
  item_pai_id: number | null;
  nome: string;
  rota: string | null;
  url_externa: ValorBooleano;
  icone: string | null;
  ordem: number;
  ativo: ValorBooleano;
  status_id: number;
}

export interface ApiMenu {
  id_menu: number;
  nome: string;
  codigo: string;
  localizacao: string;
  ativo: ValorBooleano;
  status_id: number;
}

/** Associação entre um grupo de navegação e seus itens. */
export interface ApiNavbarVinculo {
  item: ApiItem;
  papeis_ids?: number[];
  papeis_codigos?: string[];
}

export interface ApiNavbarGrupo {
  menu: ApiMenu;
  itens?: ApiNavbarVinculo[];
}

/** Formato envelopado mais comum retornado pela API. */
export interface ApiResponse {
  status?: number;
  mensagem?: string;
  dados?: {
    mensagem?: string;
    navbar?: ApiNavbarGrupo[];
  };
}

/** Item normalizado pelo serviço para uso nos componentes. */
export interface NavbarItem extends Omit<ApiItem, "url_externa" | "ativo"> {
  url_externa: boolean;
  ativo: boolean;
  papeis_ids: number[];
  papeis_codigos: string[];
  filhos: NavbarItem[];
}

export interface NavbarData {
  tituloLoja: string;
  menus: NavbarItem[];
  categorias: NavbarItem[];
  acoes: NavbarItem[];
}

export interface NavbarState extends NavbarData {
  carregando: boolean;
  erro: boolean;
}
