import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";
import axios from "axios";

export type ProdutoParaCarrinho = {
  produto_id: number;
  variacao_id?: number | null;
  quantidade?: number;
  preco_unitario: number;
};

export type ItemCarrinhoApi = {
  id_item: number;
  carrinho_id: number;
  produto_id: number;
  variacao_id: number | null;
  quantidade: number;
  preco_unitario: number;
  nome?: string;
  sku?: string;
  slug?: string;
  imagem?: string | null;
  [chave: string]: unknown;
};

export type ResumoCarrinho = {
  carrinho: {
    id_carrinho: number;
    cliente_id?: number | null;
    identificador_sessao?: string;
    status?: string;
    [chave: string]: unknown;
  };
  itens: ItemCarrinhoApi[];
  total_itens: number | string;
  subtotal: number | string;
};

type RespostaApi<T> = {
  sucesso?: boolean;
  mensagem?: string;
  dados?: T;
  id_item?: number;
};

const COOKIE_SESSAO = "ui_carrinho_sessao";
const MAX_AGE_COOKIE = 60 * 60 * 24 * 30;

const EVENTO_CARRINHO_ATUALIZADO = "ui:carrinho-atualizado";

function notificarCarrinhoAtualizado(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_CARRINHO_ATUALIZADO));
  }
}

function lerCookie(nome: string): string | null {
  if (typeof document === "undefined") return null;

  const prefixo = `${nome}=`;

  const parte = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefixo));

  return parte ? decodeURIComponent(parte.slice(prefixo.length)) : null;
}

/**
 * Identifica o carrinho de visitante por cookie first-party.
 */
function obterIdentificadorSessao(): string {
  if (typeof document === "undefined") {
    throw new Error("O carrinho só pode ser acessado no navegador.");
  }

  let sessao = lerCookie(COOKIE_SESSAO);

  if (!sessao) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      sessao = crypto.randomUUID();
    } else {
      sessao = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${Math.random().toString(36).slice(2)}`;
    }

    document.cookie = `${COOKIE_SESSAO}=${encodeURIComponent(
      sessao,
    )}; Max-Age=${MAX_AGE_COOKIE}; Path=/; SameSite=Lax`;
  }

  return sessao;
}

type ObjetoApi = Record<string, unknown>;

function ehObjetoApi(valor: unknown): valor is ObjetoApi {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/**
 * Interpreta respostas JSON que chegam como texto.
 */
function interpretarTextoJson(texto: string): ObjetoApi {
  const inicio = texto.indexOf("{");

  if (inicio < 0) {
    throw new Error("A API não retornou um JSON válido.");
  }

  let profundidade = 0;
  let dentroDeString = false;
  let escape = false;
  let fim = -1;

  for (let i = inicio; i < texto.length; i++) {
    const caractere = texto[i];

    if (dentroDeString) {
      if (escape) {
        escape = false;
      } else if (caractere === "\\") {
        escape = true;
      } else if (caractere === '"') {
        dentroDeString = false;
      }

      continue;
    }

    if (caractere === '"') {
      dentroDeString = true;
    } else if (caractere === "{") {
      profundidade++;
    } else if (caractere === "}") {
      profundidade--;

      if (profundidade === 0) {
        fim = i + 1;
        break;
      }
    }
  }

  if (fim < 0) {
    throw new Error("A resposta JSON da API está incompleta.");
  }

  const resultado: unknown = JSON.parse(texto.slice(inicio, fim));

  if (!ehObjetoApi(resultado)) {
    throw new Error("A resposta da API não possui o formato esperado.");
  }

  return resultado;
}

/**
 * Normaliza AxiosResponse, JSON direto ou texto JSON.
 */
function normalizarResposta(resposta: unknown): ObjetoApi {
  let corpo: unknown = resposta;

  // AxiosResponse: { data, status, headers, config, ... }
  if (ehObjetoApi(corpo) && "data" in corpo) {
    corpo = corpo.data;
  }

  if (typeof corpo === "string") {
    return interpretarTextoJson(corpo);
  }

  if (!ehObjetoApi(corpo)) {
    throw new Error("O servidor não retornou uma resposta válida.");
  }

  return corpo;
}

/**
 * Interpreta o envelope da API PHP:
 *
 * {
 *   status: 200,
 *   mensagem: "Sucesso",
 *   dados: {
 *     sucesso: true,
 *     mensagem: "Operação realizada",
 *     dados: resumo
 *   }
 * }
 */
function extrairDados<T>(resposta: unknown): T {
  const externo = normalizarResposta(resposta);
  const status = Number(externo.status);

  if (Number.isFinite(status) && status >= 400) {
    throw new Error(
      typeof externo.mensagem === "string"
        ? externo.mensagem
        : "A API não conseguiu concluir a operação.",
    );
  }

  let interno: unknown = externo;

  if (ehObjetoApi(externo.dados) && "sucesso" in externo.dados) {
    interno = externo.dados;
  }

  if (!ehObjetoApi(interno)) {
    throw new Error("Não foi possível interpretar a resposta interna da API.");
  }

  if (interno.sucesso !== true) {
    throw new Error(
      typeof interno.mensagem === "string"
        ? interno.mensagem
        : "O backend não confirmou a operação do carrinho.",
    );
  }

  if (interno.dados === undefined || interno.dados === null) {
    throw new Error(
      typeof interno.mensagem === "string"
        ? interno.mensagem
        : "O servidor não retornou os dados do carrinho.",
    );
  }

  return interno.dados as T;
}

export class CarrinhoService {
  private static identificacao() {
    return {
      identificador_sessao: obterIdentificadorSessao(),
    };
  }

  /**
   * Consulta o carrinho da sessão atual.
   *
   * Carrinho inexistente retorna null.
   * Outros erros são propagados normalmente.
   */
  static async buscar(): Promise<ResumoCarrinho | null> {
    const identificacao = this.identificacao();

    try {
      const resposta = await conexao.post<unknown>(
        ROTAS.CARRINHO.BUSCAR,
        identificacao,
      );

      /*
       * O backend pode informar que o carrinho não existe de duas formas:
       *
       * 1. HTTP 404 real;
       * 2. HTTP 200 com { status: 404, mensagem: "Não encontrado" }.
       *
       * Nos dois casos, retornamos null.
       */
      const corpo = normalizarResposta(resposta);

      if (Number(corpo.status) === 404) {
        return null;
      }

      return extrairDados<ResumoCarrinho>(corpo);
    } catch (erro: unknown) {
      const statusHttp = (erro as { response?: { status?: number } })?.response
        ?.status;

      if (statusHttp === 404) {
        return null;
      }

      throw erro;
    }
  }

  /**
   * Busca o carrinho ou cria um novo caso não exista.
   */
  static async buscarOuCriar(): Promise<ResumoCarrinho> {
    const existente = await this.buscar();

    if (existente) {
      return existente;
    }

    const resposta = await conexao.post<
      RespostaApi<ResumoCarrinho["carrinho"]>
    >(ROTAS.CARRINHO.CRIAR, this.identificacao());

    const carrinho = extrairDados<ResumoCarrinho["carrinho"]>(resposta);

    const resumo = await this.buscar();

    if (resumo) {
      return resumo;
    }

    return {
      carrinho,
      itens: [],
      total_itens: 0,
      subtotal: "0.00",
    };
  }

  /**
   * Adiciona um produto ao carrinho.
   */
  static async adicionar(
    produto: ProdutoParaCarrinho,
  ): Promise<ResumoCarrinho> {
    if (!Number.isInteger(produto.produto_id) || produto.produto_id <= 0) {
      throw new Error("Produto inválido para adicionar ao carrinho.");
    }

    const quantidade = Number(produto.quantidade ?? 1);
    const preco = Number(produto.preco_unitario);

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      throw new Error("Informe uma quantidade válida.");
    }

    if (!Number.isFinite(preco) || preco < 0) {
      throw new Error("Preço inválido.");
    }

    const resposta = await conexao.post<RespostaApi<ResumoCarrinho>>(
      ROTAS.CARRINHO.ADICIONAR,
      {
        ...this.identificacao(),
        produto_id: produto.produto_id,
        variacao_id: produto.variacao_id ?? null,
        quantidade,
        preco_unitario: preco.toFixed(2),
      },
    );

    const resumo = extrairDados<ResumoCarrinho>(resposta);

    notificarCarrinhoAtualizado();

    return resumo;
  }

  /**
   * Altera a quantidade de um item.
   */
  static async alterarQuantidade(
    itemId: number,
    quantidade: number,
  ): Promise<ResumoCarrinho> {
    if (!Number.isInteger(itemId) || itemId <= 0) {
      throw new Error("ID do item do carrinho inválido.");
    }

    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 9999) {
      throw new Error(
        "A quantidade deve ser um número inteiro entre 1 e 9999.",
      );
    }

    const rota = ROTAS.CARRINHO.ITENS.ALTERAR_QUANTIDADE(itemId);

    const payload = { quantidade };

    console.groupCollapsed(
      "%c[CARRINHO][PUT QUANTIDADE] Requisição",
      "color: #AB6F9D; font-weight: bold;",
    );

    console.log("Método:", "PUT");
    console.log("Rota:", rota);
    console.log("ID do item:", itemId);
    console.log("Quantidade:", quantidade);
    console.log("Payload:", payload);
    console.log("Payload JSON:", JSON.stringify(payload));

    console.groupEnd();

    try {
      // A rota PHP está registrada com Home::Put.
      const resposta = await conexao.put<unknown>(rota, payload);

      console.groupCollapsed(
        "%c[CARRINHO][PUT QUANTIDADE] Resposta",
        "color: #16803c; font-weight: bold;",
      );

      console.log("Status HTTP:", resposta.status);
      console.log("Status text:", resposta.statusText);
      console.log("Headers:", resposta.headers);
      console.log("Dados recebidos:", resposta.data);
      console.log("Tipo dos dados:", typeof resposta.data);

      console.groupEnd();

      const resumo = extrairDados<ResumoCarrinho>(resposta);

      if (!resumo || !Array.isArray(resumo.itens) || !resumo.carrinho) {
        console.error(
          "[CARRINHO][PUT QUANTIDADE] Resposta sem resumo válido:",
          resumo,
        );

        throw new Error("A API não retornou o resumo atualizado do carrinho.");
      }

      const itemAtualizado = resumo.itens.find(
        (item) => Number(item.id_item) === itemId,
      );

      console.log(
        "[CARRINHO][PUT QUANTIDADE] Quantidade confirmada no resumo:",
        {
          itemId,
          quantidadeSolicitada: quantidade,
          quantidadeRetornada: itemAtualizado?.quantidade,
          subtotal: resumo.subtotal,
          totalItens: resumo.total_itens,
        },
      );

      notificarCarrinhoAtualizado();

      return resumo;
    } catch (erro: unknown) {
      console.group(
        "%c[CARRINHO][PUT QUANTIDADE] ERRO",
        "color: #dc2626; font-weight: bold;",
      );

      if (axios.isAxiosError(erro)) {
        console.error("Mensagem:", erro.message);
        console.error("Código Axios:", erro.code);
        console.error("Status HTTP:", erro.response?.status);
        console.error("Resposta do PHP:", erro.response?.data);
        console.error("Headers da resposta:", erro.response?.headers);
        console.error("URL:", erro.config?.url);
        console.error("Método enviado:", erro.config?.method);
        console.error("Body enviado:", erro.config?.data);
      } else {
        console.error("Erro:", erro);
      }

      console.groupEnd();

      throw erro;
    }
  }

  /**
   * Remove um item do carrinho.
   */
  static async remover(itemId: number): Promise<ResumoCarrinho> {
    const resposta = await conexao.delete<RespostaApi<ResumoCarrinho>>(
      ROTAS.CARRINHO.ITENS.REMOVER(itemId),
    );

    const resumo = extrairDados<ResumoCarrinho>(resposta);

    notificarCarrinhoAtualizado();

    return resumo;
  }

  /**
   * Limpa todos os itens do carrinho.
   */
  static async limpar(carrinhoId: number): Promise<ResumoCarrinho> {
    const resposta = await conexao.delete<RespostaApi<ResumoCarrinho>>(
      ROTAS.CARRINHO.LIMPAR(carrinhoId),
    );

    const resumo = extrairDados<ResumoCarrinho>(resposta);

    notificarCarrinhoAtualizado();

    return resumo;
  }

  /**
   * Altera o status do carrinho.
   */
  static async alterarStatus(
    carrinhoId: number,
    status: "aberto" | "finalizado" | "cancelado",
  ) {
    const resposta = await conexao.put<RespostaApi<ResumoCarrinho["carrinho"]>>(
      ROTAS.CARRINHO.ALTERAR_STATUS(carrinhoId),
      { status },
    );

    return extrairDados<ResumoCarrinho["carrinho"]>(resposta);
  }
}

export default CarrinhoService;
