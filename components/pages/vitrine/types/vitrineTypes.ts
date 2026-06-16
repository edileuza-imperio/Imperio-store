export type Nivel = {
  id_nivel?: number;
  idNivel?: number;
  id?: number;
  nome?: string;
  codigo?: string;
};

export type Status = {
  id_status?: number;
  idStatus?: number;
  id?: number;
  nome?: string;
  codigo?: string;
};

export type ConfiguracoesVitrine = {
  niveis: Nivel[];
  status: Status[];
};

export type PayloadCadastrarVitrine = {
  nome: string;
  slug: string;
  titulo: string;
  subtitulo: string | null;
  tipo: string;
  status_id: number;
  nivel_id: number;
  ordem: number;
};

export type StatusFormulario =
  | "idle"
  | "salvando"
  | "sucesso"
  | "erro";