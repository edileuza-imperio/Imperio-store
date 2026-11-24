export type ValorBooleano = boolean | number | string | null;

export interface MensagemTemplate {
  id_template: number;
  status_id: number | null;
  codigo: string;
  nome: string;
  canal: string;
  assunto: string | null;
  conteudo: string;
  ativo: boolean;
  criado_em: string | null;
  atualizado_em: string | null;
}

export interface MensagemTemplatePayload {
  status_id?: number | null;
  codigo: string;
  nome: string;
  canal: string;
  assunto?: string | null;
  conteudo: string;
  ativo: boolean;
}

export interface MensagemTemplateListaResponse {
  sucesso: boolean;
  mensagem?: string;
  dados?: {
    total?: number;
    templates?: MensagemTemplate[];
  };
}

export interface MensagemTemplateResponse {
  sucesso: boolean;
  mensagem?: string;
  dados?: MensagemTemplate;
}
