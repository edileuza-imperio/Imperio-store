export type ApiIndexData = {
  version?: string;
  status?: string;
};

export type ApiIndexResponse = {
  status: number;
  mensagem: string;
  dados?: ApiIndexData;
};
// src/types/menu.ts
export interface Menu {
  id?: number;
  nome: string;
  icone?: string;
  rota?: string;
  pesquisa_placeholder?: string | null;
}
export interface MenuItem {
  id?: number;
  nome: string;
  icone?: string;
  rota?: string;
  posicao?: number;
  menu_id?: number;
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