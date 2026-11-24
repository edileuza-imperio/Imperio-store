import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";
import type {
  MensagemTemplate,
  MensagemTemplateListaResponse,
  MensagemTemplatePayload,
  MensagemTemplateResponse,
} from "../Hooks/types/MensagemTemplate";
import type { ValorBooleano } from "../types/Navbar";

// =====================================================
// NORMALIZAÇÃO
// =====================================================

function converterBooleano(valor: ValorBooleano): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;

  if (typeof valor === "string") {
    return ["1", "true", "sim", "ativo", "yes"].includes(
      valor.trim().toLowerCase(),
    );
  }

  return false;
}

function normalizarTemplate(
  registro:
    | MensagemTemplate
    | (Omit<MensagemTemplate, "ativo"> & { ativo: ValorBooleano }),
): MensagemTemplate {
  return {
    ...registro,
    id_template: Number(registro.id_template),
    status_id:
      registro.status_id === null || registro.status_id === undefined
        ? null
        : Number(registro.status_id),
    codigo: String(registro.codigo ?? ""),
    nome: String(registro.nome ?? ""),
    canal: String(registro.canal ?? "email"),
    assunto: registro.assunto ?? null,
    conteudo: String(registro.conteudo ?? ""),
    ativo: converterBooleano(registro.ativo),
  };
}

function validarSucesso<T extends { sucesso?: boolean; mensagem?: string }>(
  resposta: T,
): void {
  if (resposta?.sucesso === false) {
    throw new Error(
      resposta.mensagem || "A API não conseguiu concluir a operação.",
    );
  }
}

/**
 * O Controlador do backend recebe os parâmetros nomeados a partir
 * do objeto raiz "dados". O DAO, por sua vez, recebe os campos desse
 * objeto sem o envelope.
 */
function prepararPayload(payload: MensagemTemplatePayload) {
  const codigo = payload.codigo.trim();
  const nome = payload.nome.trim();
  const canal = payload.canal.trim().toLowerCase();
  const assunto = payload.assunto?.trim() || null;

  if (!codigo || !nome || !canal) {
    throw new Error("Informe código, nome e canal do template.");
  }

  if (!payload.conteudo.trim()) {
    throw new Error("O conteúdo do template é obrigatório.");
  }

  let conteudoValidado: unknown;

  try {
    conteudoValidado = JSON.parse(payload.conteudo);
  } catch {
    throw new Error("O conteúdo precisa ser um JSON válido.");
  }

  if (
    !conteudoValidado ||
    typeof conteudoValidado !== "object" ||
    Array.isArray(conteudoValidado)
  ) {
    throw new Error("O conteúdo precisa ser um objeto JSON.");
  }

  const conteudoObj = conteudoValidado as Record<string, unknown>;

  if (typeof conteudoObj.titulo !== "string" || !conteudoObj.titulo.trim()) {
    throw new Error('O JSON precisa possuir "titulo" preenchido.');
  }

  if (
    typeof conteudoObj.mensagem !== "string" ||
    !conteudoObj.mensagem.trim()
  ) {
    throw new Error('O JSON precisa possuir "mensagem" preenchida.');
  }

  if (
    !conteudoObj.dados ||
    typeof conteudoObj.dados !== "object" ||
    Array.isArray(conteudoObj.dados)
  ) {
    throw new Error(
      'O JSON precisa possuir "dados" como objeto. Use {} quando não houver detalhes.',
    );
  }

  return {
    ...payload,
    codigo,
    nome,
    canal,
    assunto,
    conteudo: JSON.stringify(conteudoObj, null, 2),
    status_id:
      payload.status_id === undefined || payload.status_id === null
        ? null
        : Number(payload.status_id),
    ativo: Boolean(payload.ativo),
  };
}

// =====================================================
// LISTAR
// =====================================================

export async function listarMensagensTemplate(): Promise<MensagemTemplate[]> {
  const { data } = await conexao.get<MensagemTemplateListaResponse>(
    ROTAS.MENSAGENS_TEMPLATES.LISTAR,
  );

  validarSucesso(data);

  const registros = data?.dados?.templates;
  if (!Array.isArray(registros)) {
    throw new Error(
      "A API não retornou a lista de templates no formato esperado.",
    );
  }

  return registros.map(normalizarTemplate);
}

// =====================================================
// BUSCAR POR ID
// =====================================================

export async function buscarMensagemTemplate(
  id: number,
): Promise<MensagemTemplate> {
  const { data } = await conexao.get<MensagemTemplateResponse>(
    ROTAS.MENSAGENS_TEMPLATES.BUSCAR_POR_ID(id),
  );

  validarSucesso(data);

  if (!data?.dados) {
    throw new Error(data?.mensagem || "Template não encontrado.");
  }

  return normalizarTemplate(data.dados);
}

// =====================================================
// BUSCAR POR CÓDIGO
// =====================================================

export async function buscarMensagemTemplatePorCodigo(
  codigo: string,
): Promise<MensagemTemplate> {
  const { data } = await conexao.get<MensagemTemplateResponse>(
    ROTAS.MENSAGENS_TEMPLATES.BUSCAR_POR_CODIGO(codigo),
  );

  validarSucesso(data);

  if (!data?.dados) {
    throw new Error(data?.mensagem || "Template não encontrado.");
  }

  return normalizarTemplate(data.dados);
}

// =====================================================
// CADASTRAR
// =====================================================

export async function cadastrarMensagemTemplate(
  payload: MensagemTemplatePayload,
): Promise<MensagemTemplate | null> {
  const dados = prepararPayload(payload);

  const { data } = await conexao.post<MensagemTemplateResponse>(
    ROTAS.MENSAGENS_TEMPLATES.CADASTRAR,
    { dados },
  );

  validarSucesso(data);
  return data?.dados ? normalizarTemplate(data.dados) : null;
}

// =====================================================
// ATUALIZAR
// =====================================================

export async function atualizarMensagemTemplate(
  id: number,
  payload: MensagemTemplatePayload,
): Promise<MensagemTemplate | null> {
  const dados = prepararPayload(payload);

  const { data } = await conexao.put<MensagemTemplateResponse>(
    ROTAS.MENSAGENS_TEMPLATES.ATUALIZAR(id),
    { dados },
  );

  validarSucesso(data);
  return data?.dados ? normalizarTemplate(data.dados) : null;
}

// =====================================================
// ATIVAR / DESATIVAR
// =====================================================

export async function ativarMensagemTemplate(id: number): Promise<void> {
  const { data } = await conexao.put(ROTAS.MENSAGENS_TEMPLATES.ATIVAR(id));
  validarSucesso(data);
}

export async function desativarMensagemTemplate(id: number): Promise<void> {
  const { data } = await conexao.put(ROTAS.MENSAGENS_TEMPLATES.DESATIVAR(id));
  validarSucesso(data);
}
