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
  titulo?: string; // ✅ agora aceita undefined
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