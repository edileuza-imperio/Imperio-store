export type MenuItem = {
  id_item: number;
  menu_id: number;
  nome: string;
  rota: string;
  icone: string | null;
  posicao: number;
};

export type Menu = {
  id_menu: number;
  nome: string;
  rota: string;
  icone: string | null;
  itens?: MenuItem[];
};

export type Usuario = {
  id_usuario: number;
  nome: string;
  email: string;
};

export type SiteConfig = {
  id_site_config?: number;
  titulo: string;
  subtitulo: string;
};

export type Categoria = {
  id_categoria?: number;
  nome?: string;
  slug?: string;
  icone?: string | null;
  imagem?: string | null;
  ordem?: number;
  status_id?: number;
};

export type BootstrapNavbar = {
  menus?: Menu[];
  site?: SiteConfig | SiteConfig[] | null;
  categorias?: Categoria[];
  usuario?: Usuario | null;
  carrinho_total?: number;
};
