"use client";

import ROTAS from "@/app/constants/rotas";
import CarrinhoService, {
  type ResumoCarrinho,
} from "@/Services/Carrinho/CarrinhoService";
import conexao from "@/Services/Conexao/Conexao";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CartItem = {
  id_item?: number;
  produto_id?: number;
  nome?: string;
  titulo?: string;
  quantidade?: number | string;
  preco_unitario?: number | string;
};

type CartData = {
  carrinho?: {
    id_carrinho?: number;
    cliente_id?: number | null;
    identificador_sessao?: string;
    status?: string;
  };
  itens?: CartItem[];
  subtotal?: number | string;
  total?: number | string;
  frete?: number | string;
  total_itens?: number | string;
  total_pedido?: number | string;
  valor_total?: number | string;
};

type FreightOption = {
  id_regra: number;
  modalidade: string;
  /** Valor bruto da tarifa de entrega, antes do desconto. */
  valor: number;
  desconto_frete: number;
  frete_gratis: boolean;
  prazo_minimo: number;
  prazo_maximo: number;
  total_pedido: number;
  /** Token emitido pelo backend. Sem ele, a opção não pode liberar cobrança. */
  token_cotacao?: string;
};

type FreightQuote = {
  carrinho_id: number;
  cliente_id?: number;
  cep_destino: string;
  subtotal: number;
  modo_frete?: "manual" | "automatico" | string;
  status_frete?: string;
  frete_calculado?: boolean;
  frete_a_combinar?: boolean;
  valor_frete?: number | null;
  total_pedido?: number | null;
  mensagem?: string;
  opcoes: FreightOption[];
  cotado_em?: string;
};

type PaymentResult = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  installments?: number;
  pago_em?: string | null;
  date_approved?: string | null;
  referencia_externa?: string | null;
  transaction_amount?: number | string | null;
  valor?: number | string | null;
  pedido_id?: number | string | null;
  /** true somente depois que o endpoint público confirmou o status no banco. */
  status_validado_api?: boolean;
  /** Carrinho que originou esta cobrança. */
  carrinho_id?: number | string;
  card?: {
    last_four_digits?: string;
    first_six_digits?: string;
  };
  payment_method?: {
    id?: string;
    name?: string;
    payment_type_id?: string;
  };
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  dados?: {
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      };
    };
  };
};

const CHAVE_CHECKOUT = "universo-imperio:checkout:identificacao:v1";
const CHAVE_CUPOM_APLICADO = "universo-imperio:cupom-aplicado:v1";
const CHAVE_PAGAMENTO_ATUAL = "universo-imperio:pagamento-atual:v1";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() || "";
const LOG_PAGAMENTO = process.env.NODE_ENV !== "production";

type PaymentCheckoutSnapshot = {
  subtotal?: number;
  freteBruto?: number;
  descontoFrete?: number;
  freteLiquido?: number;
  totalConfirmado?: number;
  modalidade?: string;
  freteGratis?: boolean;
  prazoMinimo?: number;
  prazoMaximo?: number;
  cep?: string;
  criadoEm?: string;
  /** Itens preservados para o resumo da compra após esvaziar o carrinho. */
  itens?: CartItem[];
};

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function logPagamento(
  etapa: string,
  dados: Record<string, unknown>,
  erro = false,
) {
  if (!LOG_PAGAMENTO && !erro) return;

  const estilo = erro
    ? "color: #dc2626; font-weight: bold;"
    : "color: #AB6F9D; font-weight: bold;";

  console.groupCollapsed(`%c[PAGAMENTO][${etapa}]`, estilo);
  console.log({ dataHora: new Date().toISOString(), ...dados });
  console.groupEnd();
}

function obterMensagemApi(resposta: unknown): string | null {
  const fila: unknown[] = [resposta];
  const visitados = new Set<unknown>();
  const chaves = ["dados", "data", "response", "resultado", "payload", "body"];

  while (fila.length) {
    const atual = fila.shift();
    if (!isRecord(atual) || visitados.has(atual)) continue;
    visitados.add(atual);

    if (atual.sucesso === false && typeof atual.mensagem === "string") {
      return atual.mensagem;
    }

    for (const chave of chaves) {
      const aninhado = atual[chave];
      if (aninhado !== undefined && aninhado !== null) fila.push(aninhado);
    }
  }

  return null;
}

/** Aceita a resposta do Axios e os envelopes usados por Controlador::Resposta(). */
function extrairPagamento(resposta: unknown): PaymentResult {
  const raiz =
    isRecord(resposta) && "data" in resposta ? resposta.data : resposta;
  const fila: unknown[] = [raiz];
  const visitados = new Set<unknown>();
  const chaves = [
    "pagamento",
    "dados",
    "data",
    "response",
    "resultado",
    "payload",
    "body",
  ];

  while (fila.length) {
    const atual = fila.shift();
    if (!isRecord(atual) || visitados.has(atual)) continue;
    visitados.add(atual);

    if ("pagamento" in atual && isRecord(atual.pagamento)) {
      return atual.pagamento as PaymentResult;
    }

    // Não confundir o `status: 200` do envelope HTTP com o status do pagamento.
    if (
      "point_of_interaction" in atual ||
      ("id" in atual &&
        (typeof atual.status === "string" ||
          "status_detail" in atual ||
          "payment_method_id" in atual))
    ) {
      return atual as PaymentResult;
    }

    for (const chave of chaves) {
      const aninhado = atual[chave];
      if (aninhado !== undefined && aninhado !== null) fila.push(aninhado);
    }
  }

  const mensagem = obterMensagemApi(raiz);
  throw new Error(mensagem || "O backend não retornou os dados do pagamento.");
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

/**
 * Recupera apenas o CEP confirmado na etapa de identificação.
 * O endereço oficial continua sendo validado pelo backend no banco de dados;
 * o sessionStorage é usado somente para conferir e exibir o CEP no checkout.
 */
function obterCepIdentificacao(): string {
  try {
    const salvo = window.sessionStorage.getItem(CHAVE_CHECKOUT);
    if (!salvo) return "";

    const dados: unknown = JSON.parse(salvo);
    if (!isRecord(dados) || !isRecord(dados.endereco)) return "";

    const cep = String(dados.endereco.cep ?? "").replace(/\D/g, "");
    return /^\d{8}$/.test(cep) ? cep : "";
  } catch {
    return "";
  }
}

function formatarCep(cep: string): string {
  const digitos = cep.replace(/\D/g, "");
  return digitos.length === 8
    ? digitos.replace(/^(\d{5})(\d{3})$/, "$1-$2")
    : cep;
}

/**
 * Converte respostas JSON que podem vir como objeto ou texto.
 * Alguns endpoints PHP podem enviar o JSON como string ou acrescentar
 * um `null` após o objeto; removemos apenas esse sufixo para tentar
 * recuperar o envelope sem alterar os dados internos.
 */
function desserializarRespostaApi(valor: unknown): unknown {
  if (typeof valor !== "string") return valor;

  const textoOriginal = valor.trim();
  if (!textoOriginal) return valor;

  const candidatos = [
    textoOriginal,
    textoOriginal.replace(/\s*null\s*$/, "").trim(),
  ];

  for (const candidato of candidatos) {
    if (!candidato) continue;
    try {
      return JSON.parse(candidato) as unknown;
    } catch {
      // Tenta o próximo formato conhecido.
    }
  }

  return valor;
}

/** Lê as opções de frete mesmo quando a API utiliza o envelope Resposta(). */
function extrairCotacaoFrete(resposta: unknown): FreightQuote {
  const raizAxios =
    isRecord(resposta) && "data" in resposta ? resposta.data : resposta;
  const raiz = desserializarRespostaApi(raizAxios);
  const fila: unknown[] = [raiz];
  const visitados = new Set<unknown>();
  const chaves = [
    "dados",
    "data",
    "response",
    "resultado",
    "payload",
    "body",
    "cotacao",
    "frete",
  ];

  while (fila.length > 0) {
    const bruto = fila.shift();
    const atual = desserializarRespostaApi(bruto);
    if (!isRecord(atual) || visitados.has(atual)) continue;
    visitados.add(atual);

    if (atual.sucesso === false) {
      const mensagem =
        typeof atual.mensagem === "string" ? atual.mensagem : null;
      if (mensagem) throw new Error(mensagem);
    }

    if (Array.isArray(atual.opcoes)) {
      const opcoes: FreightOption[] = [];

      for (const item of atual.opcoes) {
        if (!isRecord(item)) continue;

        const idRegra = Number(item.id_regra);
        const modalidade = String(item.modalidade ?? "").trim();
        // Compatibilidade com os dois contratos: o antigo usa `valor`;
        // o novo explicita `valor_frete` e `desconto_frete`.
        const valor = toNumber(item.valor_frete ?? item.valor);
        const descontoFrete = toNumber(item.desconto_frete);
        const freteGratis =
          item.frete_gratis === true ||
          item.frete_gratis === 1 ||
          item.frete_gratis === "1" ||
          (valor > 0 && descontoFrete >= valor);
        const prazoMinimo = Number(item.prazo_minimo);
        const prazoMaximo = Number(item.prazo_maximo);
        const totalPedido = toNumber(item.total_pedido);

        if (
          !Number.isInteger(idRegra) ||
          idRegra <= 0 ||
          !modalidade ||
          !Number.isFinite(valor) ||
          valor < 0 ||
          !Number.isFinite(descontoFrete) ||
          descontoFrete < 0 ||
          descontoFrete > valor + 0.01 ||
          !Number.isInteger(prazoMinimo) ||
          prazoMinimo <= 0 ||
          !Number.isInteger(prazoMaximo) ||
          prazoMaximo < prazoMinimo ||
          !Number.isFinite(totalPedido) ||
          totalPedido <= 0
        ) {
          continue;
        }

        opcoes.push({
          id_regra: idRegra,
          modalidade,
          valor,
          desconto_frete: Math.min(descontoFrete, valor),
          frete_gratis: freteGratis,
          prazo_minimo: prazoMinimo,
          prazo_maximo: prazoMaximo,
          total_pedido: totalPedido,
          token_cotacao:
            typeof item.token_cotacao === "string" && item.token_cotacao.trim()
              ? item.token_cotacao.trim()
              : undefined,
        });
      }

      return {
        carrinho_id: Number(atual.carrinho_id ?? 0),
        cliente_id: Number(atual.cliente_id ?? 0) || undefined,
        cep_destino: String(atual.cep_destino ?? ""),
        subtotal: toNumber(atual.subtotal),
        modo_frete:
          typeof atual.modo_frete === "string" ? atual.modo_frete : undefined,
        status_frete:
          typeof atual.status_frete === "string"
            ? atual.status_frete
            : undefined,
        frete_calculado:
          typeof atual.frete_calculado === "boolean"
            ? atual.frete_calculado
            : undefined,
        frete_a_combinar:
          typeof atual.frete_a_combinar === "boolean"
            ? atual.frete_a_combinar
            : undefined,
        valor_frete:
          atual.valor_frete === null || atual.valor_frete === undefined
            ? null
            : toNumber(atual.valor_frete),
        total_pedido:
          atual.total_pedido === null || atual.total_pedido === undefined
            ? null
            : toNumber(atual.total_pedido),
        mensagem:
          typeof atual.mensagem === "string" ? atual.mensagem : undefined,
        opcoes,
        cotado_em:
          typeof atual.cotado_em === "string" ? atual.cotado_em : undefined,
      };
    }

    for (const chave of chaves) {
      const aninhado = atual[chave];
      if (aninhado !== undefined && aninhado !== null) {
        fila.push(desserializarRespostaApi(aninhado));
      }
    }
  }

  const mensagem = obterMensagemApi(raiz);
  const chavesRaiz = isRecord(raiz)
    ? Object.keys(raiz).join(", ")
    : typeof raiz;
  throw new Error(
    mensagem ||
      `A resposta de /frete/cotar não contém o campo "opcoes". Estrutura recebida: ${chavesRaiz || "vazia"}. Confira o retorno do FreteController.`,
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getPixData(result: PaymentResult) {
  const transaction =
    result.point_of_interaction?.transaction_data ??
    result.dados?.point_of_interaction?.transaction_data;

  return {
    qrCode: transaction?.qr_code || "",
    qrCodeBase64: transaction?.qr_code_base64 || "",
    ticketUrl: transaction?.ticket_url || "",
  };
}

const STATUS_PAGAMENTO_CONHECIDOS = new Set([
  "approved",
  "pending",
  "in_process",
  "authorized",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
  "in_mediation",
]);

function normalizarStatusPagamento(status: unknown): string {
  const valor = String(status ?? "")
    .trim()
    .toLowerCase();
  const equivalencias: Record<string, string> = {
    aprovado: "approved",
    pendente: "pending",
    rejeitado: "rejected",
    cancelado: "cancelled",
    reembolsado: "refunded",
    chargeback: "charged_back",
    em_disputa: "in_mediation",
  };
  return equivalencias[valor] ?? valor;
}

/**
 * Lê a resposta pública do pagamento, inclusive quando o controller devolve
 * status no envelope e valor/detalhes dentro de `pagamento`.
 */
function extrairStatusPagamentoPublico(resposta: unknown): {
  status: string;
  pagoEm?: string;
  statusDetail?: string;
  valor?: number;
  pagamentoId?: number | string;
  pedidoId?: number | string;
  carrinhoId?: number | string;
  metodo?: string;
} | null {
  // A resposta já foi comprovada no endpoint de diagnóstico. Aceitamos tanto
  // objeto Axios quanto JSON serializado pelo PHP, inclusive envelopes aninhados.
  const respostaAxios =
    isRecord(resposta) && "data" in resposta ? resposta.data : resposta;
  const raiz = desserializarRespostaApi(respostaAxios);
  const fila: unknown[] = [raiz];
  const visitados = new Set<unknown>();
  const chaves = [
    "pagamento",
    "dados",
    "data",
    "response",
    "resultado",
    "payload",
    "body",
  ];

  while (fila.length > 0) {
    const bruto = fila.shift();
    const valorAtual = desserializarRespostaApi(bruto);
    if (!isRecord(valorAtual) || visitados.has(valorAtual)) continue;
    visitados.add(valorAtual);

    const pagamento = isRecord(valorAtual.pagamento)
      ? valorAtual.pagamento
      : valorAtual;
    const pagoConfirmado =
      valorAtual.pago === true ||
      valorAtual.pago === 1 ||
      valorAtual.pago === "1" ||
      pagamento.pago === true ||
      pagamento.pago === 1 ||
      pagamento.pago === "1";

    const candidatos = [
      // O booleano explícito `pago` da API é a confirmação mais forte.
      pagoConfirmado ? "approved" : undefined,
      pagamento.status,
      valorAtual.status_pagamento,
      valorAtual.status,
    ];

    for (const candidato of candidatos) {
      if (typeof candidato !== "string") continue;
      const status = normalizarStatusPagamento(candidato);
      if (!STATUS_PAGAMENTO_CONHECIDOS.has(status)) continue;

      const valorBruto =
        pagamento.valor ?? pagamento.transaction_amount ?? valorAtual.valor;
      const valor =
        valorBruto === null || valorBruto === undefined
          ? undefined
          : toNumber(valorBruto);

      return {
        status,
        pagoEm:
          typeof pagamento.pago_em === "string"
            ? pagamento.pago_em
            : typeof pagamento.date_approved === "string"
              ? pagamento.date_approved
              : typeof valorAtual.pago_em === "string"
                ? valorAtual.pago_em
                : undefined,
        statusDetail:
          typeof pagamento.status_detail === "string"
            ? pagamento.status_detail
            : typeof valorAtual.status_detail === "string"
              ? valorAtual.status_detail
              : undefined,
        valor:
          valor !== undefined && Number.isFinite(valor) ? valor : undefined,
        pagamentoId: (pagamento.id_pagamento ?? pagamento.id) as
          | number
          | string
          | undefined,
        pedidoId: pagamento.pedido_id as number | string | undefined,
        carrinhoId: pagamento.carrinho_id as number | string | undefined,
        metodo:
          typeof pagamento.metodo === "string" ? pagamento.metodo : undefined,
      };
    }

    for (const chave of chaves) {
      const aninhado = valorAtual[chave];
      if (aninhado !== undefined && aninhado !== null) fila.push(aninhado);
    }
  }

  return null;
}

function salvarReferenciaPagamento(
  cartId: number | undefined,
  result: PaymentResult,
  snapshot: PaymentCheckoutSnapshot,
): boolean {
  if (typeof window === "undefined" || !result.id) {
    logPagamento(
      "COBRANCA:REFERENCIA_NAO_SALVA",
      {
        motivo:
          typeof window === "undefined" ? "ambiente_sem_janela" : "id_ausente",
        cartId: cartId ?? null,
      },
      true,
    );
    return false;
  }

  const pix = getPixData(result);
  const registro = {
    cartId: cartId ?? null,
    id: String(result.id),
    status: normalizarStatusPagamento(result.status) || "pending",
    status_validado_api: false,
    payment_method_id:
      result.payment_method_id ?? result.payment_method?.id ?? null,
    payment_type_id:
      result.payment_type_id ?? result.payment_method?.payment_type_id ?? null,
    payment_method_name: result.payment_method?.name ?? null,
    qr_code: pix.qrCode,
    qr_code_base64: pix.qrCodeBase64,
    ticket_url: pix.ticketUrl,
    last_four_digits: result.card?.last_four_digits ?? null,
    status_detail: result.status_detail ?? null,
    pago_em: result.pago_em ?? result.date_approved ?? null,
    valor:
      result.valor ??
      result.transaction_amount ??
      snapshot.totalConfirmado ??
      null,
    snapshot,
    criado_em: new Date().toISOString(),
  };

  let gravacoes = 0;
  const armazenamentos: Array<{ nome: string; storage: Storage }> = [
    { nome: "localStorage", storage: window.localStorage },
    { nome: "sessionStorage", storage: window.sessionStorage },
  ];

  for (const armazenamento of armazenamentos) {
    try {
      armazenamento.storage.setItem(
        CHAVE_PAGAMENTO_ATUAL,
        JSON.stringify(registro),
      );
      gravacoes += 1;
    } catch (error) {
      logPagamento(
        "COBRANCA:FALHA_AO_SALVAR_REFERENCIA",
        {
          armazenamento: armazenamento.nome,
          mensagem:
            error instanceof Error ? error.message : "Erro desconhecido",
        },
        true,
      );
    }
  }

  logPagamento(
    "COBRANCA:REFERENCIA_SALVA",
    {
      referencia: registro.id,
      cartId: registro.cartId,
      gravacoesConcluidas: gravacoes,
      snapshotSalvo: true,
    },
    gravacoes === 0,
  );

  return gravacoes > 0;
}

function lerReferenciaPagamentoSalva(): ApiRecord | null {
  if (typeof window === "undefined") return null;

  for (const armazenamento of [window.localStorage, window.sessionStorage]) {
    try {
      const salvo = armazenamento.getItem(CHAVE_PAGAMENTO_ATUAL);
      if (!salvo) continue;

      const dados: unknown = JSON.parse(salvo);
      if (isRecord(dados) && String(dados.id ?? "").trim() !== "") {
        return dados;
      }
    } catch (error) {
      console.warn(
        "[PAGAMENTO] Não foi possível ler a referência salva:",
        error,
      );
    }
  }

  return null;
}

/** Atualiza somente o registro da cobrança correspondente, sem apagar a referência. */
function atualizarPagamentoSalvo(
  referencia: string,
  cartId: number,
  alteracoes: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

  for (const armazenamento of [window.localStorage, window.sessionStorage]) {
    try {
      const salvo = armazenamento.getItem(CHAVE_PAGAMENTO_ATUAL);
      if (!salvo) continue;

      const dados: unknown = JSON.parse(salvo);
      if (
        !isRecord(dados) ||
        String(dados.id ?? "") !== referencia ||
        Number(dados.cartId) !== cartId
      ) {
        continue;
      }

      armazenamento.setItem(
        CHAVE_PAGAMENTO_ATUAL,
        JSON.stringify({ ...dados, ...alteracoes }),
      );
    } catch (error) {
      console.warn(
        `[PAGAMENTO] Não foi possível atualizar ${armazenamento === window.localStorage ? "localStorage" : "sessionStorage"}:`,
        error,
      );
    }
  }
}

export default function PagamentoPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartData | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [loadingCart, setLoadingCart] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [pageError, setPageError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [statusConsultaExpirada, setStatusConsultaExpirada] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null,
  );
  // Mantém a última cobrança disponível para o monitor sem reiniciá-lo a cada render.
  const paymentResultRef = useRef<PaymentResult | null>(null);
  paymentResultRef.current = paymentResult;
  const [paymentSnapshot, setPaymentSnapshot] =
    useState<PaymentCheckoutSnapshot | null>(null);
  const [limpezaCarrinhoStatus, setLimpezaCarrinhoStatus] = useState<
    "aguardando" | "processando" | "concluido" | "erro"
  >("aguardando");
  const [limpezaCarrinhoErro, setLimpezaCarrinhoErro] = useState("");
  const [repetirLimpezaCarrinho, setRepetirLimpezaCarrinho] = useState(0);
  const limpezaCarrinhoEmAndamentoRef = useRef<Set<string>>(new Set());
  const [itensPedidoConfirmado, setItensPedidoConfirmado] = useState<
    CartItem[]
  >([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [copied, setCopied] = useState(false);
  const [freightOptions, setFreightOptions] = useState<FreightOption[]>([]);
  const [selectedFreightId, setSelectedFreightId] = useState("");
  const [freightManual, setFreightManual] = useState(false);
  const [freightManualMessage, setFreightManualMessage] = useState(
    "A entrega será combinada com nossa equipe. O valor será informado antes da confirmação do pagamento.",
  );
  const [loadingFreight, setLoadingFreight] = useState(false);
  const [freightError, setFreightError] = useState("");
  const [freightReload, setFreightReload] = useState(0);
  const [freightCep, setFreightCep] = useState("");
  const [cepIdentificacao, setCepIdentificacao] = useState<string | null>(null);
  const [cupomFreteGratis, setCupomFreteGratis] = useState(false);
  const [codigoCupomFrete, setCodigoCupomFrete] = useState("");
  // Mantém a mesma chave em uma repetição da requisição (timeout/rede), mas
  // cria uma nova chave quando o componente é montado para uma nova tentativa.
  const paymentAttemptIdRef = useRef<string | null>(null);

  const cartData = cart;
  const items = cartData?.itens ?? [];
  const subtotal = toNumber(cartData?.subtotal);
  const cartId = cartData?.carrinho?.id_carrinho;
  const pagamentoJaConfirmadoNoBanco =
    paymentResult?.status_validado_api === true &&
    normalizarStatusPagamento(paymentResult.status) === "approved";

  const selectedFreightOption =
    freightOptions.find(
      (option) => String(option.id_regra) === selectedFreightId,
    ) ?? null;

  const shipping = selectedFreightOption?.valor ?? 0;
  const freightDiscount = selectedFreightOption?.desconto_frete ?? 0;
  const total = selectedFreightOption?.total_pedido ?? 0;

  // O Payment Brick só aparece quando a opção selecionada contém o token
  // emitido pelo backend. Preço exibido no frontend nunca libera a cobrança sozinho.
  const tokenFrete = selectedFreightOption?.token_cotacao?.trim() ?? "";
  const pagamentoComFreteValidado = Boolean(
    selectedFreightOption &&
    tokenFrete &&
    !freightManual &&
    !loadingFreight &&
    !freightError &&
    total > 0,
  );

  const paymentInitialization = useMemo(
    () => ({
      amount: Number(total.toFixed(2)),
    }),
    [total],
  );

  // =====================================================
  // RECUPERAR CUPOM APLICADO NO CARRINHO
  // =====================================================

  useEffect(() => {
    try {
      const salvo = window.sessionStorage.getItem(CHAVE_CUPOM_APLICADO);
      if (!salvo) return;

      const dados: unknown = JSON.parse(salvo);
      if (!isRecord(dados)) return;

      const tipo = String(dados.tipo ?? "")
        .trim()
        .toLowerCase();
      const codigo = String(dados.codigo ?? "").trim();

      setCupomFreteGratis(tipo === "frete_gratis");
      setCodigoCupomFrete(tipo === "frete_gratis" ? codigo : "");
    } catch (error) {
      console.warn("[PAGAMENTO] Não foi possível recuperar o cupom:", error);
      setCupomFreteGratis(false);
      setCodigoCupomFrete("");
    }
  }, []);

  // =====================================================
  // RECUPERAR CEP DA ETAPA DE IDENTIFICAÇÃO (VIACEP)
  // =====================================================

  useEffect(() => {
    // A identificação já consultou o ViaCEP e salvou o endereço no backend.
    // Aqui recuperamos apenas o CEP para conferência visual com a cotação.
    setCepIdentificacao(obterCepIdentificacao());
  }, []);

  // =====================================================
  // CARREGAR CARRINHO DIRETAMENTE DO BANCO
  // =====================================================

  useEffect(() => {
    let active = true;

    async function loadCart() {
      setLoadingCart(true);
      setPageError("");

      try {
        if (!conexao.defaults.baseURL) {
          throw new Error(
            "NEXT_PUBLIC_API_URL não está configurada corretamente no .env.local.",
          );
        }

        // O CarrinhoService utiliza a instância Axios `conexao` e envia apenas
        // o identificador da sessão para o backend localizar o registro no MySQL.
        // O CarrinhoService envia somente o identificador de sessão (cookie).
        // Itens, quantidades e preços vêm do MySQL via CarrinhoController + CarrinhoDao.
        const resumo: ResumoCarrinho | null = await CarrinhoService.buscar();

        if (!resumo) {
          // Depois de uma compra aprovada, o carrinho pode já estar convertido.
          // A referência também pode ter chegado diretamente pela URL.
          const referenciaDaUrl =
            new URLSearchParams(window.location.search)
              .get("referencia")
              ?.trim() ?? "";
          const registroEncontrado = lerReferenciaPagamentoSalva();
          const referenciaSalva = String(registroEncontrado?.id ?? "").trim();
          const pagamentoSalvo =
            referenciaDaUrl && referenciaSalva !== referenciaDaUrl
              ? null
              : registroEncontrado;
          const referenciaAcompanhar =
            referenciaDaUrl || String(pagamentoSalvo?.id ?? "").trim();
          const possuiReferencia = Boolean(referenciaAcompanhar);
          if (possuiReferencia) {
            const snapshotSalvo = isRecord(pagamentoSalvo?.snapshot)
              ? pagamentoSalvo.snapshot
              : null;
            if (snapshotSalvo && Array.isArray(snapshotSalvo.itens)) {
              setItensPedidoConfirmado(snapshotSalvo.itens as CartItem[]);
            }

            logPagamento("CARRINHO:SEM_CARRINHO_ABERTO_COM_REFERENCIA", {
              referencia: referenciaAcompanhar,
              origem: referenciaDaUrl ? "parametro_url" : "storage",
              carrinhoConvertido:
                pagamentoSalvo?.carrinho_convertido === true ||
                pagamentoSalvo?.carrinho_finalizado === true, // compatibilidade com registros antigos
              motivo:
                "A cobrança continua sendo consultada pela referência, mesmo sem carrinho aberto.",
            });
            if (active) {
              setCart(null);
              setSessionId("");
            }
            return;
          }

          throw new Error(
            "Não encontramos um carrinho aberto no banco de dados para esta sessão. Volte ao carrinho e confira se os produtos continuam nele.",
          );
        }

        if (!resumo.carrinho || !Number(resumo.carrinho.id_carrinho)) {
          throw new Error(
            "O backend localizou uma resposta, mas não retornou o ID do carrinho salvo no banco.",
          );
        }

        if (
          typeof resumo.carrinho.identificador_sessao !== "string" ||
          resumo.carrinho.identificador_sessao.trim() === ""
        ) {
          throw new Error(
            "O carrinho não retornou o identificador de sessão necessário para consultar o frete.",
          );
        }

        if (!Array.isArray(resumo.itens)) {
          throw new Error(
            "O backend não retornou a lista de itens do carrinho. Verifique o método buscarResumoCarrinho() do CarrinhoDao.",
          );
        }

        const referenciaDaUrl =
          new URLSearchParams(window.location.search)
            .get("referencia")
            ?.trim() ?? "";
        const registroEncontrado = lerReferenciaPagamentoSalva();
        const referenciaSalva = String(registroEncontrado?.id ?? "").trim();
        const pagamentoSalvo =
          referenciaDaUrl && referenciaSalva !== referenciaDaUrl
            ? null
            : registroEncontrado;
        const pertenceAoCarrinhoSalvo =
          Boolean(pagamentoSalvo) &&
          Number(pagamentoSalvo?.cartId) ===
            Number(resumo.carrinho.id_carrinho);
        const retornandoDePagamento = Boolean(referenciaDaUrl);

        if (
          resumo.itens.length === 0 &&
          !pertenceAoCarrinhoSalvo &&
          !retornandoDePagamento
        ) {
          throw new Error(
            `O carrinho ${resumo.carrinho.id_carrinho} existe no banco, mas não possui itens vinculados. Confira a tabela de itens do carrinho.`,
          );
        }

        const cartSubtotal = toNumber(resumo.subtotal);
        if (
          cartSubtotal <= 0 &&
          !pertenceAoCarrinhoSalvo &&
          !retornandoDePagamento
        ) {
          throw new Error(
            "O carrinho foi encontrado no banco, mas o subtotal retornado pelo backend é inválido.",
          );
        }

        if (
          resumo.itens.length === 0 &&
          pagamentoSalvo &&
          isRecord(pagamentoSalvo.snapshot) &&
          Array.isArray(pagamentoSalvo.snapshot.itens)
        ) {
          setItensPedidoConfirmado(pagamentoSalvo.snapshot.itens as CartItem[]);
        }

        logPagamento("CARRINHO:CARREGADO", {
          carrinhoId: resumo.carrinho.id_carrinho,
          clienteId: resumo.carrinho.cliente_id ?? null,
          quantidadeItens: resumo.itens.length,
          totalItens: resumo.total_itens,
          subtotal: resumo.subtotal,
          possuiIdentificadorNoRegistro: Boolean(
            resumo.carrinho.identificador_sessao,
          ),
        });

        if (active) {
          setCart({
            ...resumo,
            itens: resumo.itens,
          });
          // A sessão é lida do registro do carrinho retornado pelo banco.
          setSessionId(resumo.carrinho.identificador_sessao ?? "");
        }
      } catch (error) {
        const apiStatus = axios.isAxiosError(error)
          ? error.response?.status
          : undefined;
        const apiMessage = axios.isAxiosError(error)
          ? obterMensagemApi(error.response?.data)
          : null;

        logPagamento(
          "CARRINHO:ERRO",
          {
            httpStatus: apiStatus ?? null,
            codigoAxios: axios.isAxiosError(error) ? error.code : null,
            mensagem:
              error instanceof Error ? error.message : "Erro desconhecido",
            mensagemApi: apiMessage,
            rota: ROTAS.CARRINHO.BUSCAR,
            dica: "Confira o cookie ui_carrinho_sessao e o retorno de POST /carrinho/buscar no PHP.",
          },
          true,
        );

        if (active) {
          setPageError(
            apiMessage ||
              (error instanceof Error
                ? error.message
                : "Não foi possível consultar o carrinho no banco de dados."),
          );
        }
      } finally {
        if (active) {
          setLoadingCart(false);
        }
      }
    }

    void loadCart();

    return () => {
      active = false;
    };
  }, []);

  // =====================================================
  // RECUPERAR UMA COBRANÇA PELA URL OU PELO ARMAZENAMENTO
  // =====================================================

  useEffect(() => {
    if (typeof window === "undefined" || loadingCart) return;

    // Em retornos do Mercado Pago, a referência pode chegar na URL mesmo
    // quando o navegador não possui mais o registro salvo no storage.
    const referenciaDaUrl =
      new URLSearchParams(window.location.search).get("referencia")?.trim() ??
      "";

    const registroEncontrado = lerReferenciaPagamentoSalva();
    const referenciaSalva = String(registroEncontrado?.id ?? "").trim();
    const referencia = referenciaDaUrl || referenciaSalva;

    // Só reutilizamos dados locais (carrinho, QR Code, snapshot etc.) quando
    // eles pertencem exatamente à referência que estamos consultando.
    const registroSalvo =
      referenciaSalva === referencia ? registroEncontrado : null;

    // IMPORTANTE: se a referência chegou somente pela URL, persistimos um
    // registro mínimo antes da consulta. Assim, se o navegador retirar o
    // parâmetro da URL ou a página for atualizada, ainda saberemos qual
    // pagamento recuperar. Não associamos o carrinho atual automaticamente:
    // isso poderia vincular uma compra antiga ao carrinho errado.
    if (referenciaDaUrl && !registroSalvo) {
      const registroMinimo: ApiRecord = {
        id: referenciaDaUrl,
        cartId: null,
        status: "pending",
        status_validado_api: false,
        origem: "parametro_url",
        criado_em: new Date().toISOString(),
      };
      let gravacoes = 0;

      for (const armazenamento of [
        window.localStorage,
        window.sessionStorage,
      ]) {
        try {
          armazenamento.setItem(
            CHAVE_PAGAMENTO_ATUAL,
            JSON.stringify(registroMinimo),
          );
          gravacoes += 1;
        } catch (erroArmazenamento) {
          logPagamento(
            "RECUPERACAO:FALHA_AO_PERSISTIR_REFERENCIA_DA_URL",
            {
              armazenamento:
                armazenamento === window.localStorage
                  ? "localStorage"
                  : "sessionStorage",
              mensagem:
                erroArmazenamento instanceof Error
                  ? erroArmazenamento.message
                  : "Não foi possível salvar a referência.",
            },
            true,
          );
        }
      }

      logPagamento(
        "RECUPERACAO:REFERENCIA_DA_URL_PERSISTIDA",
        {
          referencia: referenciaDaUrl,
          gravacoesConcluidas: gravacoes,
          carrinhoAssociado: false,
          motivo:
            "A referência fica disponível após atualização ou remoção do parâmetro da URL.",
        },
        gravacoes === 0,
      );
    }

    logPagamento("RECUPERACAO:INICIO", {
      cartIdAtual: cartId ?? null,
      referenciaEncontradaNaUrl: Boolean(referenciaDaUrl),
      referenciaEncontradaNoLocalStorageOuSessao: Boolean(referenciaSalva),
      registroLocalCorrespondeAReferencia: Boolean(registroSalvo),
      cartIdSalvo: registroSalvo?.cartId ?? null,
      referencia: referencia || null,
    });

    if (!referencia) {
      logPagamento("RECUPERACAO:SEM_COBRANCA_SALVA", {
        mensagem:
          "Nenhuma cobrança foi criada/salva nesta sessão. A consulta será iniciada assim que o backend retornar o ID de uma nova cobrança.",
      });
      return;
    }

    // Evita mostrar uma cobrança antiga como se fosse do carrinho atual.
    if (
      cartId &&
      registroSalvo?.cartId !== null &&
      registroSalvo?.cartId !== undefined &&
      Number(registroSalvo.cartId) !== Number(cartId)
    ) {
      logPagamento("RECUPERACAO:REGISTRO_DE_OUTRO_CARRINHO", {
        referencia,
        cartIdSalvo: registroSalvo?.cartId,
        cartIdAtual: cartId,
      });
      return;
    }

    const transaction = {
      qr_code:
        typeof registroSalvo?.qr_code === "string" ? registroSalvo.qr_code : "",
      qr_code_base64:
        typeof registroSalvo?.qr_code_base64 === "string"
          ? registroSalvo.qr_code_base64
          : "",
      ticket_url:
        typeof registroSalvo?.ticket_url === "string"
          ? registroSalvo.ticket_url
          : "",
    };

    const snapshotSalvo = isRecord(registroSalvo?.snapshot)
      ? registroSalvo.snapshot
      : null;

    if (snapshotSalvo) {
      setPaymentSnapshot({
        subtotal: toNumber(snapshotSalvo.subtotal),
        freteBruto: toNumber(snapshotSalvo.freteBruto),
        descontoFrete: toNumber(snapshotSalvo.descontoFrete),
        freteLiquido: toNumber(snapshotSalvo.freteLiquido),
        totalConfirmado: toNumber(snapshotSalvo.totalConfirmado),
        modalidade:
          typeof snapshotSalvo.modalidade === "string"
            ? snapshotSalvo.modalidade
            : undefined,
        freteGratis: snapshotSalvo.freteGratis === true,
        prazoMinimo: Number(snapshotSalvo.prazoMinimo) || undefined,
        prazoMaximo: Number(snapshotSalvo.prazoMaximo) || undefined,
        cep:
          typeof snapshotSalvo.cep === "string" ? snapshotSalvo.cep : undefined,
        criadoEm:
          typeof snapshotSalvo.criadoEm === "string"
            ? snapshotSalvo.criadoEm
            : undefined,
        itens: Array.isArray(snapshotSalvo.itens)
          ? (snapshotSalvo.itens as CartItem[])
          : undefined,
      });
      if (Array.isArray(snapshotSalvo.itens)) {
        setItensPedidoConfirmado(snapshotSalvo.itens as CartItem[]);
      }
    }

    const metodoSalvo =
      typeof registroSalvo?.payment_method_id === "string"
        ? registroSalvo.payment_method_id
        : typeof registroSalvo?.payment_type_id === "string"
          ? registroSalvo.payment_type_id
          : "";

    setSelectedPaymentMethod(metodoSalvo.toLowerCase());
    setPaymentResult({
      id: referencia,
      carrinho_id:
        Number(registroSalvo?.cartId ?? registroSalvo?.carrinho_id) ||
        undefined,
      // O estado salvo nunca confirma pagamento: a API será consultada novamente.
      status: "pending",
      status_validado_api: false,
      status_detail:
        typeof registroSalvo?.status_detail === "string"
          ? registroSalvo.status_detail
          : undefined,
      payment_method_id: metodoSalvo || undefined,
      payment_type_id:
        typeof registroSalvo?.payment_type_id === "string"
          ? registroSalvo.payment_type_id
          : undefined,
      payment_method:
        typeof registroSalvo?.payment_method_name === "string"
          ? {
              id: metodoSalvo || undefined,
              name: registroSalvo.payment_method_name,
            }
          : undefined,
      card:
        typeof registroSalvo?.last_four_digits === "string"
          ? { last_four_digits: registroSalvo.last_four_digits }
          : undefined,
      pago_em:
        typeof registroSalvo?.pago_em === "string"
          ? registroSalvo.pago_em
          : undefined,
      valor:
        registroSalvo?.valor !== undefined
          ? toNumber(registroSalvo.valor)
          : undefined,
      point_of_interaction: { transaction_data: transaction },
    });

    setPaymentError("");
    setStatusConsultaExpirada(false);

    logPagamento("COBRANCA:RECUPERADA_AUTOMATICAMENTE", {
      referencia,
      origem: referenciaDaUrl
        ? "parametro_url"
        : "localStorage_ou_sessionStorage",
      snapshotRecuperado: Boolean(snapshotSalvo),
      metodoRecuperado: metodoSalvo || null,
      proximaEtapa: "consultar_status_na_api_imediatamente",
    });
  }, [loadingCart, cartId]);

  // =====================================================
  // COTAR FRETE PELO CEP DO ENDEREÇO SALVO NO BANCO
  // =====================================================

  useEffect(() => {
    // Depois da confirmação no banco, não recalcula nem limpa o frete da compra paga.
    if (pagamentoJaConfirmadoNoBanco) {
      logPagamento("FRETE:COTACAO:IGNORADA_COMPRA_CONFIRMADA", {
        referencia: paymentResult?.id ?? null,
        motivo: "Preservar o resumo registrado na compra aprovada.",
      });
      return;
    }

    // Aguarda carregar o CEP salvo na etapa de identificação.
    // Se não houver CEP no sessionStorage, o backend continua sendo a fonte
    // oficial e poderá usar o endereço já salvo em cliente_enderecos.
    if (!sessionId || !cartId || cepIdentificacao === null) return;

    let active = true;

    async function cotarFrete() {
      setLoadingFreight(true);
      setFreightError("");
      setFreightOptions([]);
      setSelectedFreightId("");
      setFreightManual(false);
      setFreightManualMessage(
        "A entrega será combinada com nossa equipe. O valor será informado antes da confirmação do pagamento.",
      );

      logPagamento("FRETE:COTACAO:INICIO", {
        rota: ROTAS.FRETE.COTAR,
        carrinhoId: cartId,
        identificadorPresente: true,
      });

      try {
        const response = await conexao.post<unknown>(ROTAS.FRETE.COTAR, {
          identificador_sessao: sessionId,
        });

        const corpoResposta = desserializarRespostaApi(response.data);
        logPagamento("FRETE:COTACAO:RESPOSTA", {
          httpStatus: response.status,
          tipoResposta: typeof corpoResposta,
          chavesRaiz: isRecord(corpoResposta) ? Object.keys(corpoResposta) : [],
          possuiOpcoesNaRaiz: isRecord(corpoResposta)
            ? Array.isArray(corpoResposta.opcoes)
            : false,
        });

        const cotacao = extrairCotacaoFrete(corpoResposta);

        if (cotacao.carrinho_id !== Number(cartId)) {
          throw new Error(
            "A cotação retornada não corresponde ao carrinho atual. Recarregue o checkout.",
          );
        }

        const cepRetornado = cotacao.cep_destino.replace(/\D/g, "");
        if (!/^\d{8}$/.test(cepRetornado)) {
          throw new Error(
            "A API de frete não retornou um CEP de destino válido. Confira o endereço na identificação.",
          );
        }

        // Quando houver CEP salvo pela etapa de identificação, confere se o
        // backend está cotando exatamente para o mesmo endereço.
        if (cepIdentificacao && cepRetornado !== cepIdentificacao) {
          throw new Error(
            "O CEP usado na cotação é diferente do CEP informado na identificação. Volte à etapa anterior, confira o endereço e avance novamente.",
          );
        }

        if (Math.round(cotacao.subtotal * 100) !== Math.round(subtotal * 100)) {
          throw new Error(
            "O subtotal do carrinho mudou durante a cotação. Atualize o carrinho e calcule o frete novamente.",
          );
        }

        // O backend pode responder corretamente em modo manual, sem opções
        // de transportadora. Isso não é uma falha de cotação.
        if (
          cotacao.modo_frete === "manual" ||
          cotacao.frete_a_combinar === true
        ) {
          if (active) {
            setFreightManual(true);
            setFreightOptions([]);
            setSelectedFreightId("");
            setFreightCep(cepRetornado);
            setFreightManualMessage(
              cotacao.mensagem ||
                "A entrega será combinada com nossa equipe. O valor será informado antes da confirmação do pagamento.",
            );

            logPagamento("FRETE:AGUARDANDO_DEFINICAO_MANUAL", {
              carrinhoId: cotacao.carrinho_id,
              cepDestino: cotacao.cep_destino,
              subtotal: cotacao.subtotal,
              statusFrete: cotacao.status_frete ?? "aguardando_definicao",
              freteCalculado: cotacao.frete_calculado ?? false,
            });
          }
          return;
        }

        if (cotacao.opcoes.length === 0) {
          throw new Error(
            "Nenhuma regra de entrega foi encontrada para o CEP do endereço cadastrado.",
          );
        }

        const opcoesConferidas = cotacao.opcoes
          .map((opcao) => {
            const totalConfereComSubtotal =
              Math.round(opcao.total_pedido * 100) ===
              Math.round(cotacao.subtotal * 100);

            // Algumas APIs retornam a tarifa já zerada após aplicar o cupom.
            // Só tratamos isso como frete grátis quando o cupom está salvo
            // nesta sessão e o total retornado pelo backend confirma o subtotal.
            const freteGratisConfirmado =
              opcao.frete_gratis ||
              (cupomFreteGratis &&
                opcao.valor === 0 &&
                totalConfereComSubtotal);

            return { ...opcao, frete_gratis: freteGratisConfirmado };
          })
          .filter((opcao) => {
            const totalEsperado =
              cotacao.subtotal + opcao.valor - opcao.desconto_frete;
            return (
              opcao.desconto_frete <= opcao.valor + 0.01 &&
              Math.round(opcao.total_pedido * 100) ===
                Math.round(totalEsperado * 100)
            );
          });

        if (opcoesConferidas.length === 0) {
          throw new Error(
            "A API retornou opções de frete com total inconsistente. Faça uma nova cotação.",
          );
        }

        if (active) {
          const opcaoFreteGratis = cupomFreteGratis
            ? opcoesConferidas.find((opcao) => opcao.frete_gratis)
            : null;

          if (cupomFreteGratis && !opcaoFreteGratis) {
            throw new Error(
              "O cupom de frete grátis está salvo no carrinho, mas a API não confirmou o benefício nesta cotação. Confira a associação do cupom ao carrinho e a aplicação do desconto no FreteService.",
            );
          }

          setFreightManual(false);
          setFreightOptions(opcoesConferidas);
          setFreightCep(cepRetornado);

          if (opcaoFreteGratis) {
            setSelectedFreightId(String(opcaoFreteGratis.id_regra));
            setPaymentError("");
            logPagamento("FRETE_GRATIS:SELECIONADO_AUTOMATICAMENTE", {
              codigoCupom: codigoCupomFrete || null,
              regraId: opcaoFreteGratis.id_regra,
              valorFrete: opcaoFreteGratis.valor,
              descontoFrete: opcaoFreteGratis.desconto_frete,
              total: opcaoFreteGratis.total_pedido,
              tokenPresente: Boolean(opcaoFreteGratis.token_cotacao),
            });
          }

          logPagamento("FRETE:COTACAO:SUCESSO", {
            carrinhoId: cotacao.carrinho_id,
            cepDestino: cotacao.cep_destino,
            subtotalConfirmado: cotacao.subtotal,
            quantidadeOpcoes: opcoesConferidas.length,
            opcoes: opcoesConferidas.map((opcao) => ({
              regraId: opcao.id_regra,
              modalidade: opcao.modalidade,
              frete: opcao.valor,
              descontoFrete: opcao.desconto_frete,
              freteGratis: opcao.frete_gratis,
              prazoMinimo: opcao.prazo_minimo,
              prazoMaximo: opcao.prazo_maximo,
              total: opcao.total_pedido,
            })),
          });
        }
      } catch (error) {
        const httpStatus = axios.isAxiosError(error)
          ? error.response?.status
          : undefined;
        const mensagemApi = axios.isAxiosError(error)
          ? obterMensagemApi(error.response?.data)
          : null;
        const mensagem =
          mensagemApi ||
          (error instanceof Error
            ? error.message
            : "Não foi possível calcular o frete.");

        logPagamento(
          "FRETE:COTACAO:ERRO",
          {
            httpStatus: httpStatus ?? null,
            codigoAxios: axios.isAxiosError(error) ? error.code : null,
            mensagem,
            rota: ROTAS.FRETE.COTAR,
            tipoResposta: axios.isAxiosError(error)
              ? typeof error.response?.data
              : null,
            chavesResposta:
              axios.isAxiosError(error) && isRecord(error.response?.data)
                ? Object.keys(error.response?.data as Record<string, unknown>)
                : [],
          },
          true,
        );

        if (active) setFreightError(mensagem);
      } finally {
        if (active) setLoadingFreight(false);
      }
    }

    void cotarFrete();

    return () => {
      active = false;
    };
  }, [
    sessionId,
    cartId,
    subtotal,
    freightReload,
    cepIdentificacao,
    cupomFreteGratis,
    codigoCupomFrete,
    pagamentoJaConfirmadoNoBanco,
    paymentResult?.id,
  ]);

  // =====================================================
  // INICIALIZAR MERCADO PAGO
  // =====================================================

  useEffect(() => {
    if (!PUBLIC_KEY) {
      setPageError(
        (current) =>
          current ||
          "NEXT_PUBLIC_MP_PUBLIC_KEY não está configurada no .env.local.",
      );

      return;
    }

    try {
      initMercadoPago(PUBLIC_KEY, {
        locale: "pt-BR",
      });

      logPagamento("SDK:INICIALIZADO", {
        locale: "pt-BR",
        publicKeyConfigurada: true,
      });
      setSdkReady(true);
    } catch (error) {
      logPagamento(
        "SDK:ERRO",
        {
          mensagem:
            error instanceof Error ? error.message : "Falha ao inicializar SDK",
          publicKeyConfigurada: Boolean(PUBLIC_KEY),
        },
        true,
      );
      setPageError(
        "Não foi possível inicializar o Mercado Pago. Confira sua Public Key.",
      );
    }
  }, []);

  // =====================================================
  // PROCESSAR PAGAMENTO
  // =====================================================

  const handlePaymentSubmit = useCallback(
    async (brickData: unknown) => {
      setPaymentError("");
      setPaymentResult(null);
      setPaymentSnapshot(null);
      setStatusConsultaExpirada(false);

      const dadosBrick = isRecord(brickData) ? brickData : {};
      const formData = dadosBrick.formData;
      const formDataValido = isRecord(formData);
      const metodoDoBrick = String(
        dadosBrick.selectedPaymentMethod ??
          (formDataValido ? (formData.payment_method_id ?? "") : ""),
      )
        .trim()
        .toLowerCase();

      setSelectedPaymentMethod(metodoDoBrick);

      if (!cartId) {
        throw new Error(
          "Carrinho não identificado no banco de dados. Atualize a página e tente novamente.",
        );
      }

      if (!sessionId) {
        throw new Error(
          "A sessão do carrinho não foi identificada. Atualize o checkout antes de pagar.",
        );
      }

      if (freightManual) {
        throw new Error(
          "A entrega ainda está aguardando definição do valor pela loja. O pagamento será liberado depois que o frete for registrado.",
        );
      }

      if (!selectedFreightOption) {
        throw new Error("Selecione uma opção de frete antes de continuar.");
      }

      if (!tokenFrete) {
        throw new Error(
          "O backend ainda não forneceu um token válido para esta cotação. Nenhuma cobrança será iniciada até a validação do frete.",
        );
      }

      if (!formDataValido) {
        throw new Error(
          "O Mercado Pago não retornou os dados do formulário de pagamento. Confira os dados e tente novamente.",
        );
      }

      if (!metodoDoBrick && !formData.payment_method_id) {
        throw new Error("Selecione PIX ou cartão para continuar.");
      }

      // Uma tentativa recebe um UUID próprio. Se a mesma chamada for repetida
      // após timeout, a ref mantém o UUID para recuperação idempotente. Ao abrir
      // novamente o checkout, uma nova montagem gera uma tentativa nova.
      if (!paymentAttemptIdRef.current) {
        paymentAttemptIdRef.current =
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `ui-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      }

      // Contrato esperado por MercadoPagoController@criarPagamento e
      // MercadoPagoService::criarPagamento. Não enviamos preço ou frete como fonte
      // de verdade: o backend consulta o banco e recalcula o total.
      const payload = {
        carrinho_id: cartId,
        identificador_sessao: sessionId,
        frete_cotacao_token: tokenFrete,
        selected_payment_method: metodoDoBrick,
        form_data: formData,
        payment_attempt_id: paymentAttemptIdRef.current,
      };

      // Nunca registrar form_data: ele contém token de cartão e dados sensíveis.
      logPagamento("COBRANCA:INICIO", {
        metodo: "POST",
        rota: ROTAS.MERCADO_PAGO.CRIAR_PAGAMENTO,
        carrinhoId: cartId,
        valorExibidoNoBrick: total,
        formaSelecionada: metodoDoBrick || "identificada pelo formulário",
        regraFreteId: selectedFreightOption.id_regra,
        tokenFreteEnviado: true,
        camposFormData: Object.keys(formData),
      });

      try {
        const response = await conexao.post<unknown>(
          ROTAS.MERCADO_PAGO.CRIAR_PAGAMENTO,
          payload,
        );
        const result = extrairPagamento(response.data);

        if (LOG_PAGAMENTO) {
          console.log(
            "%c[PAGAMENTO][COBRANCA:JSON_RECEBIDO]",
            "color: #2563eb; font-weight: bold;",
            response.data,
          );
        }

        if (!result.id) {
          throw new Error(
            "O backend criou uma resposta, mas não retornou o ID da cobrança. Não é possível acompanhar a confirmação sem essa referência.",
          );
        }

        const snapshot: PaymentCheckoutSnapshot = {
          subtotal,
          freteBruto: shipping,
          descontoFrete: freightDiscount,
          freteLiquido: Math.max(0, shipping - freightDiscount),
          totalConfirmado:
            toNumber(result.transaction_amount ?? result.valor) || total,
          modalidade: selectedFreightOption.modalidade,
          freteGratis: selectedFreightOption.frete_gratis,
          prazoMinimo: selectedFreightOption.prazo_minimo,
          prazoMaximo: selectedFreightOption.prazo_maximo,
          cep: freightCep || cepIdentificacao || "",
          criadoEm: new Date().toISOString(),
          itens: items.map((item) => ({ ...item })),
        };

        setItensPedidoConfirmado(items.map((item) => ({ ...item })));

        // A cobrança é exibida como aguardando até o endpoint público confirmar
        // que o webhook já gravou o status e sincronizou o pedido no banco.
        const resultadoParaAcompanhar: PaymentResult = {
          ...result,
          carrinho_id: cartId,
          status: "pending",
          status_validado_api: false,
        };

        logPagamento("COBRANCA:RESPOSTA", {
          httpStatus: response.status,
          pagamentoId: result.id,
          statusRecebidoDoGateway: result.status ?? "não informado",
          statusInicialFrontend: "pending",
          metodoRetornado:
            result.payment_method?.id ??
            result.payment_method_id ??
            result.payment_type_id ??
            metodoDoBrick ??
            "não informado",
          possuiQrCodePix: Boolean(getPixData(result).qrCode),
          valorGateway: result.transaction_amount ?? result.valor ?? null,
          referenciaDisponivel: true,
        });

        // Persistimos primeiro, para que um refresh acidental não perca a referência.
        const referenciaSalva = salvarReferenciaPagamento(
          cartId,
          resultadoParaAcompanhar,
          snapshot,
        );

        setPaymentSnapshot(snapshot);
        setPaymentResult(resultadoParaAcompanhar);
        setSelectedPaymentMethod(
          String(
            result.payment_method?.id ??
              result.payment_method_id ??
              result.payment_type_id ??
              metodoDoBrick,
          ).toLowerCase(),
        );
        setPaymentError("");

        logPagamento("COBRANCA:REFERENCIA_ENTREGUE_AO_MONITOR", {
          referencia: String(result.id),
          carrinhoId: cartId,
          statusInicial: "pending",
          consultaIniciaraAutomaticamente: true,
        });

        logPagamento("COBRANCA:ACOMPANHAMENTO_INICIADO", {
          referencia: String(result.id),
          referenciaSalva,
          consultaAutomatica: true,
          urlPermaneceSemParametro: true,
          snapshotSalvo: true,
        });
      } catch (error) {
        const apiStatus = axios.isAxiosError(error)
          ? error.response?.status
          : undefined;
        const apiMessage = axios.isAxiosError(error)
          ? obterMensagemApi(error.response?.data)
          : null;
        const message =
          apiMessage ||
          (error instanceof Error
            ? error.message
            : "Falha ao processar o pagamento.");

        logPagamento(
          "COBRANCA:ERRO",
          {
            httpStatus: apiStatus ?? null,
            codigoAxios: axios.isAxiosError(error) ? error.code : null,
            mensagem: message,
            rota: ROTAS.MERCADO_PAGO.CRIAR_PAGAMENTO,
          },
          true,
        );

        setPaymentError(message);
        throw error;
      }
    },
    [
      cartId,
      sessionId,
      selectedFreightOption,
      tokenFrete,
      total,
      freightManual,
    ],
  );

  // =====================================================
  // ACOMPANHAR O STATUS REAL DO PAGAMENTO
  // =====================================================

  const referenciaPagamento = String(paymentResult?.id ?? "").trim();

  useEffect(() => {
    if (!referenciaPagamento) return;

    const estadosFinais = new Set([
      "approved",
      "rejected",
      "cancelled",
      "refunded",
      "charged_back",
      "in_mediation",
    ]);

    let ativo = true;
    let encerrado = false;
    let consultaEmAndamento = false;
    let timer: number | undefined;
    let tentativas = 0;
    const maxTentativas = 120;

    const agendarProximaConsulta = () => {
      if (!ativo || encerrado) return;
      if (tentativas >= maxTentativas) {
        encerrado = true;
        setStatusConsultaExpirada(true);
        logPagamento("STATUS:TEMPO_ESGOTADO", {
          referencia: referenciaPagamento,
          tentativas,
          intervaloMs: 5000,
        });
        return;
      }
      timer = window.setTimeout(() => void consultarStatus(), 5000);
    };

    const consultarStatus = async () => {
      if (!ativo || encerrado || consultaEmAndamento) return;

      const estadoAtual = paymentResultRef.current;
      const statusAtual = normalizarStatusPagamento(estadoAtual?.status);

      if (
        estadoAtual?.status_validado_api === true &&
        estadosFinais.has(statusAtual)
      ) {
        encerrado = true;
        logPagamento("STATUS:JA_VALIDADO_NO_BANCO", {
          referencia: referenciaPagamento,
          status: statusAtual,
        });
        return;
      }

      consultaEmAndamento = true;
      tentativas += 1;

      const rotaConsulta =
        ROTAS.PAGAMENTOS.BUSCAR_PUBLICO_POR_REFERENCIA(referenciaPagamento);

      logPagamento("STATUS:CONSULTA_INICIADA", {
        tentativa: tentativas,
        referencia: referenciaPagamento,
        metodo: "GET",
        baseURL: conexao.defaults.baseURL ?? null,
        rota: rotaConsulta,
        urlCompleta: `${conexao.defaults.baseURL ?? ""}${rotaConsulta}`,
        statusAtualNoFrontend: statusAtual || "pending",
      });

      try {
        const response = await conexao.get<unknown>(rotaConsulta, {
          timeout: 12000,
        });

        if (!ativo) return;

        if (LOG_PAGAMENTO) {
          console.groupCollapsed(
            "%c[PAGAMENTO][STATUS:RESPOSTA_BRUTA_DA_API]",
            "color:#2563eb;font-weight:bold;",
          );
          console.log("HTTP:", response.status);
          console.log("Referência consultada:", referenciaPagamento);
          console.log("JSON recebido:", response.data);
          console.groupEnd();
        }

        const statusApi = extrairStatusPagamentoPublico(response.data);

        logPagamento(
          "STATUS:RESULTADO_DA_LEITURA",
          {
            referencia: referenciaPagamento,
            statusExtraido: statusApi?.status ?? null,
            statusNormalizado: statusApi
              ? normalizarStatusPagamento(statusApi.status)
              : null,
            pagoEm: statusApi?.pagoEm ?? null,
            statusDetail: statusApi?.statusDetail ?? null,
            valor: statusApi?.valor ?? null,
            pagamentoId: statusApi?.pagamentoId ?? null,
            pedidoId: statusApi?.pedidoId ?? null,
            extracaoBemSucedida: Boolean(statusApi),
          },
          !statusApi,
        );

        if (!statusApi) {
          throw new Error(
            "A API respondeu, mas não foi possível identificar o status do pagamento. Confira o JSON bruto no Console.",
          );
        }

        const statusNormalizado = normalizarStatusPagamento(statusApi.status);
        const pagoConfirmado = statusNormalizado === "approved";

        logPagamento("STATUS:ATUALIZANDO_ESTADO_REACT", {
          referencia: referenciaPagamento,
          statusRecebidoDaApi: statusApi.status,
          statusNormalizado,
          pago: pagoConfirmado,
          vaiExibirSucesso: pagoConfirmado,
        });

        setPaymentResult((atual) => {
          if (!atual || String(atual.id ?? "").trim() !== referenciaPagamento) {
            return atual;
          }
          return {
            ...atual,
            status: statusNormalizado,
            status_validado_api: true,
            status_detail: statusApi.statusDetail ?? atual.status_detail,
            pago_em: statusApi.pagoEm ?? atual.pago_em,
            valor: statusApi.valor ?? atual.valor,
            pedido_id: statusApi.pedidoId ?? atual.pedido_id,
            carrinho_id: statusApi.carrinhoId ?? atual.carrinho_id,
          };
        });

        if (typeof window !== "undefined") {
          for (const armazenamento of [
            window.localStorage,
            window.sessionStorage,
          ]) {
            try {
              const salvo = armazenamento.getItem(CHAVE_PAGAMENTO_ATUAL);
              if (!salvo) continue;
              const dados: unknown = JSON.parse(salvo);
              if (
                isRecord(dados) &&
                String(dados.id ?? "").trim() === referenciaPagamento
              ) {
                armazenamento.setItem(
                  CHAVE_PAGAMENTO_ATUAL,
                  JSON.stringify({
                    ...dados,
                    status: statusNormalizado,
                    status_validado_api: true,
                    pago_em: statusApi.pagoEm ?? dados.pago_em ?? null,
                    status_detail:
                      statusApi.statusDetail ?? dados.status_detail ?? null,
                    valor: statusApi.valor ?? dados.valor ?? null,
                    pedido_id: statusApi.pedidoId ?? dados.pedido_id ?? null,
                    carrinho_id:
                      statusApi.carrinhoId ?? dados.carrinho_id ?? null,
                    cartId: statusApi.carrinhoId ?? dados.cartId ?? null,
                  }),
                );
              }
            } catch (erroArmazenamento) {
              logPagamento(
                "STATUS:FALHA_AO_ATUALIZAR_CACHE",
                {
                  mensagem:
                    erroArmazenamento instanceof Error
                      ? erroArmazenamento.message
                      : "Falha ao atualizar o armazenamento local.",
                },
                true,
              );
            }
          }
        }

        if (statusApi.valor !== undefined) {
          setPaymentSnapshot((atual) => ({
            ...(atual ?? {}),
            totalConfirmado: statusApi.valor,
          }));
        }

        if (pagoConfirmado) {
          setPageError("");
          logPagamento("STATUS:PAGAMENTO_APROVADO", {
            referencia: referenciaPagamento,
            pedidoId: statusApi.pedidoId ?? null,
            valor: statusApi.valor ?? null,
            mensagem: "A API confirmou pago=true/status=aprovado.",
          });
        } else {
          logPagamento("STATUS:AINDA_NAO_APROVADO", {
            referencia: referenciaPagamento,
            status: statusNormalizado,
            tentativa: tentativas,
            proximaConsultaEmMs: 5000,
          });
        }

        if (estadosFinais.has(statusNormalizado)) {
          encerrado = true;
          logPagamento("STATUS:CONSULTA_ENCERRADA", {
            referencia: referenciaPagamento,
            statusFinal: statusNormalizado,
            tentativas,
          });
          return;
        }
      } catch (error) {
        logPagamento(
          "STATUS:CONSULTA_INDISPONIVEL",
          {
            referencia: referenciaPagamento,
            tentativa: tentativas,
            mensagem:
              error instanceof Error
                ? error.message
                : "Falha desconhecida ao consultar o status.",
            rota: rotaConsulta,
          },
          true,
        );
      } finally {
        consultaEmAndamento = false;
      }

      agendarProximaConsulta();
    };

    logPagamento("STATUS:MONITOR_INICIADO", {
      referencia: referenciaPagamento,
      primeiraConsulta: "imediata",
      intervaloMs: 5000,
      limiteMinutos: 10,
    });
    void consultarStatus();

    return () => {
      ativo = false;
      if (timer !== undefined) window.clearTimeout(timer);
      logPagamento("STATUS:MONITOR_FINALIZADO", {
        referencia: referenciaPagamento,
        motivo: "componente_desmontado_ou_referencia_alterada",
      });
    };
  }, [referenciaPagamento]);

  // =====================================================
  // FINALIZAR E ESVAZIAR O CARRINHO APÓS APROVAÇÃO CONFIRMADA PELA API
  // =====================================================

  useEffect(() => {
    if (!pagamentoJaConfirmadoNoBanco || !referenciaPagamento) return;

    const registroSalvo = lerReferenciaPagamentoSalva();
    const cartIdSalvo =
      registroSalvo && String(registroSalvo.id ?? "") === referenciaPagamento
        ? Number(registroSalvo.cartId)
        : 0;
    // Só limpamos um carrinho identificado pelo próprio pagamento ou por
    // um registro salvo que corresponda à mesma referência. Não usamos o
    // carrinho atualmente aberto como fallback para uma referência da URL,
    // pois ela pode pertencer a uma compra anterior.
    const carrinhoId = Number(
      paymentResult?.carrinho_id ?? (cartIdSalvo > 0 ? cartIdSalvo : 0),
    );

    if (!Number.isInteger(carrinhoId) || carrinhoId <= 0) {
      setLimpezaCarrinhoStatus("erro");
      setLimpezaCarrinhoErro(
        "Pagamento confirmado, mas não foi possível identificar o carrinho para esvaziá-lo.",
      );
      logPagamento(
        "CARRINHO:ID_NAO_ENCONTRADO_PARA_LIMPEZA",
        {
          referencia: referenciaPagamento,
          carrinhoIdAtual: cartId ?? null,
          carrinhoIdNoPagamento: paymentResult?.carrinho_id ?? null,
          carrinhoIdSalvo: cartIdSalvo || null,
        },
        true,
      );
      return;
    }

    if (
      registroSalvo &&
      String(registroSalvo.id ?? "") === referenciaPagamento &&
      Number(registroSalvo.cartId) === carrinhoId &&
      registroSalvo.carrinho_limpo === true &&
      (registroSalvo.carrinho_convertido === true ||
        registroSalvo.carrinho_finalizado === true) // compatibilidade com registros antigos
    ) {
      setLimpezaCarrinhoStatus("concluido");
      setLimpezaCarrinhoErro("");
      logPagamento("CARRINHO:JA_LIMPO_E_CONVERTIDO", {
        referencia: referenciaPagamento,
        carrinhoId,
      });
      return;
    }

    const chaveExecucao = `${referenciaPagamento}:${carrinhoId}`;
    if (limpezaCarrinhoEmAndamentoRef.current.has(chaveExecucao)) return;
    limpezaCarrinhoEmAndamentoRef.current.add(chaveExecucao);

    setLimpezaCarrinhoStatus("processando");
    setLimpezaCarrinhoErro("");

    logPagamento("CARRINHO:LIMPEZA_INICIADA", {
      referencia: referenciaPagamento,
      carrinhoId,
      pagamentoValidadoPeloBackend: true,
      rotaLimpar: ROTAS.CARRINHO.LIMPAR(carrinhoId),
      rotaFinalizar: ROTAS.CARRINHO.ALTERAR_STATUS(carrinhoId),
    });

    void (async () => {
      try {
        // O status aprovado veio da consulta pública ao banco. Só agora
        // apagamos os itens, preservando os dados do pedido e o resumo visual.
        const resumoLimpo = await CarrinhoService.limpar(carrinhoId);

        logPagamento("CARRINHO:ITENS_REMOVIDOS", {
          referencia: referenciaPagamento,
          carrinhoId,
          quantidadeItensRetornada: Array.isArray(resumoLimpo?.itens)
            ? resumoLimpo.itens.length
            : null,
          subtotalRetornado: resumoLimpo?.subtotal ?? null,
        });

        // Converte o carrinho em pedido para que uma próxima compra crie outro
        // carrinho e não reutilize o carrinho já vinculado ao pedido pago.
        const carrinhoConvertido = await CarrinhoService.alterarStatus(
          carrinhoId,
          "convertido",
        );

        // Atualiza também o estado local. O resumo da compra continua usando
        // `itensPedidoConfirmado`, preservado antes da limpeza do carrinho.
        setCart((atual) =>
          atual
            ? {
                ...atual,
                carrinho: {
                  ...atual.carrinho,
                  status: "convertido",
                },
                itens: [],
                subtotal: "0.00",
                total_itens: 0,
              }
            : atual,
        );
        setSessionId("");
        setFreightOptions([]);
        setSelectedFreightId("");
        setFreightManual(false);

        atualizarPagamentoSalvo(referenciaPagamento, carrinhoId, {
          carrinho_limpo: true,
          carrinho_convertido: true,
          carrinho_convertido_em: new Date().toISOString(),
          status: "approved",
          status_validado_api: true,
        });

        // O cupom pertence ao carrinho concluído, não à próxima compra.
        for (const armazenamento of [
          window.localStorage,
          window.sessionStorage,
        ]) {
          try {
            armazenamento.removeItem(CHAVE_CUPOM_APLICADO);
          } catch {
            // A limpeza no banco já foi confirmada; falha de cache não desfaz a compra.
          }
        }
        setCupomFreteGratis(false);
        setCodigoCupomFrete("");
        setLimpezaCarrinhoStatus("concluido");
        setLimpezaCarrinhoErro("");

        logPagamento("CARRINHO:LIMPO_E_CONVERTIDO", {
          referencia: referenciaPagamento,
          carrinhoId,
          statusFinal: carrinhoConvertido?.status ?? "convertido",
          proximaCompraUsaraNovoCarrinho: true,
        });
      } catch (error) {
        limpezaCarrinhoEmAndamentoRef.current.delete(chaveExecucao);
        const mensagem =
          error instanceof Error
            ? error.message
            : "Não foi possível esvaziar o carrinho.";
        setLimpezaCarrinhoStatus("erro");
        setLimpezaCarrinhoErro(mensagem);
        logPagamento(
          "CARRINHO:LIMPEZA_ERRO",
          {
            referencia: referenciaPagamento,
            carrinhoId,
            mensagem,
            pagamentoContinuaAprovado: true,
          },
          true,
        );
      }
    })();
  }, [
    pagamentoJaConfirmadoNoBanco,
    referenciaPagamento,
    paymentResult?.carrinho_id,
    cartId,
    repetirLimpezaCarrinho,
  ]);

  // =====================================================
  // COPIAR PIX
  // =====================================================

  const handleCopyPix = async () => {
    const pixCode = getPixData(paymentResult || {}).qrCode;

    if (!pixCode) return;

    try {
      await navigator.clipboard.writeText(pixCode);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      setPaymentError(
        "Não foi possível copiar o código PIX automaticamente. Selecione e copie o código manualmente.",
      );
    }
  };

  // Mantém os campos do PIX sempre definidos; a UI só os exibe quando há pagamento.
  const pixData = getPixData(paymentResult ?? {});

  // O QR Code é o indicador mais confiável de uma cobrança PIX.
  // Para cartão, usamos o método retornado pelo Mercado Pago e, como fallback,
  // a forma selecionada no Payment Brick.
  const metodoRetornado = (
    paymentResult?.payment_method?.id ??
    paymentResult?.payment_method_id ??
    paymentResult?.payment_type_id ??
    ""
  ).toLowerCase();

  const pagamentoEhPix = Boolean(
    pixData?.qrCode ||
    metodoRetornado.includes("pix") ||
    metodoRetornado.includes("bank_transfer") ||
    selectedPaymentMethod.includes("pix"),
  );

  const nomeMetodoPagamento = pagamentoEhPix
    ? "PIX"
    : paymentResult
      ? "Cartão"
      : "";

  const statusPagamentoAtual = normalizarStatusPagamento(
    paymentResult?.status ?? "pending",
  );
  const pagamentoAprovado =
    paymentResult?.status_validado_api === true &&
    statusPagamentoAtual === "approved";
  const pagamentoNaoAprovado = ["rejected", "cancelled"].includes(
    statusPagamentoAtual,
  );
  const pagamentoEstornado = [
    "refunded",
    "charged_back",
    "in_mediation",
  ].includes(statusPagamentoAtual);
  const itensExibidos =
    pagamentoAprovado && itensPedidoConfirmado.length > 0
      ? itensPedidoConfirmado
      : items;

  // Confirma no Console qual ramo visual do checkout está ativo.
  useEffect(() => {
    logPagamento("UI:ESTADO_DO_CHECKOUT", {
      possuiPaymentResult: Boolean(paymentResult),
      referencia: referenciaPagamento || null,
      statusRecebidoNoState: paymentResult?.status ?? null,
      statusNormalizado: statusPagamentoAtual,
      pagamentoAprovado,
      pagamentoNaoAprovado,
      pagamentoEstornado,
      statusValidadoPeloBackend: paymentResult?.status_validado_api === true,
      telaEsperada: !paymentResult
        ? "formulario_de_pagamento"
        : pagamentoAprovado
          ? "compra_confirmada"
          : pagamentoNaoAprovado
            ? "pagamento_nao_aprovado"
            : pagamentoEstornado
              ? "pagamento_estornado_ou_em_disputa"
              : "aguardando_confirmacao",
    });
  }, [
    paymentResult,
    referenciaPagamento,
    statusPagamentoAtual,
    pagamentoAprovado,
    pagamentoNaoAprovado,
    pagamentoEstornado,
  ]);

  const statusVisual = pagamentoAprovado
    ? {
        classe: "isApproved",
        icone: "✓",
        titulo: "Pagamento efetuado com sucesso!",
        mensagem:
          "O Mercado Pago confirmou o pagamento. Seu pedido está aprovado.",
      }
    : pagamentoNaoAprovado
      ? {
          classe: "isFailed",
          icone: "!",
          titulo: "Pagamento não efetuado",
          mensagem:
            statusPagamentoAtual === "rejected"
              ? "O pagamento foi recusado. Confira os dados ou escolha outra forma de pagamento."
              : "Esta cobrança foi cancelada. Você pode iniciar uma nova tentativa.",
        }
      : pagamentoEstornado
        ? {
            classe: "isAttention",
            icone: "i",
            titulo:
              statusPagamentoAtual === "refunded"
                ? "Pagamento estornado"
                : statusPagamentoAtual === "charged_back"
                  ? "Pagamento contestado"
                  : "Pagamento em análise",
            mensagem:
              "O status desta cobrança foi atualizado pelo Mercado Pago. Consulte o atendimento da loja para mais informações.",
          }
        : {
            classe: "isPending",
            icone: "◷",
            titulo: "Aguardando confirmação do pagamento",
            mensagem: statusConsultaExpirada
              ? "Ainda não conseguimos confirmar o pagamento automaticamente. Consulte seu banco e não faça outro pagamento antes de verificar esta cobrança."
              : "A cobrança foi criada. Estamos consultando o Mercado Pago automaticamente e esta tela será atualizada quando houver confirmação.",
          };

  const iniciarNovaTentativa = () => {
    setPaymentResult(null);
    setPaymentSnapshot(null);
    setPaymentError("");
    setStatusConsultaExpirada(false);
    setLimpezaCarrinhoStatus("aguardando");
    setLimpezaCarrinhoErro("");
    setItensPedidoConfirmado([]);
    setCopied(false);
    paymentAttemptIdRef.current = null;
    try {
      window.localStorage.removeItem(CHAVE_PAGAMENTO_ATUAL);
      window.sessionStorage.removeItem(CHAVE_PAGAMENTO_ATUAL);
    } catch {
      // O checkout continua utilizável mesmo se o armazenamento estiver bloqueado.
    }
  };

  const ultimosDigitosCartao = paymentResult?.card?.last_four_digits;

  // =====================================================
  // RENDERIZAÇÃO
  // =====================================================

  return (
    <main className="uiPayment-page">
      <div className="uiPayment-topBar">
        <button
          className="uiPayment-backButton"
          onClick={() => router.push(ROTAS.PAGINAS.LOJA.CARRINHO)}
          type="button"
        >
          <span aria-hidden="true">←</span> Voltar ao carrinho
        </button>

        <div className="uiPayment-brand">
          <span className="uiPayment-brandMark">U</span>
          <span>
            UNIVERSO <strong>IMPÉRIO</strong>
          </span>
        </div>

        <div className="uiPayment-secureLabel">
          <span aria-hidden="true">▣</span> Ambiente seguro
        </div>
      </div>

      <div className="uiPayment-container">
        <header className="uiPayment-heading">
          <span className="uiPayment-eyebrow">ETAPA FINAL · COMPRA SEGURA</span>
          <h1>
            {pagamentoAprovado ? "Pedido confirmado" : "Finalize seu pedido"}
          </h1>
          <p>
            {pagamentoAprovado
              ? "Seu pagamento foi confirmado e sua compra está registrada."
              : "Escolha a forma de pagamento e conclua sua compra com segurança."}
          </p>
        </header>

        <div className="uiPayment-steps" aria-label="Etapas da compra">
          <div className="uiPayment-stepDone">
            <span>✓</span>
            <small>Carrinho</small>
          </div>

          <i />

          <div className="uiPayment-stepDone">
            <span>✓</span>
            <small>Identificação</small>
          </div>

          <i />

          <div
            className={
              pagamentoAprovado ? "uiPayment-stepDone" : "uiPayment-stepActive"
            }
          >
            <span>{pagamentoAprovado ? "✓" : "3"}</span>
            <small>{pagamentoAprovado ? "Concluído" : "Pagamento"}</small>
          </div>
        </div>

        {((pageError && !paymentResult) || paymentError) && (
          <div className="uiPayment-alert" role="alert">
            <strong>Não foi possível continuar</strong>
            <span>{paymentError || pageError}</span>

            {pageError && (
              <button
                type="button"
                onClick={() => router.push(ROTAS.PAGINAS.LOJA.CARRINHO)}
              >
                Voltar ao carrinho
              </button>
            )}
          </div>
        )}

        <div className="uiPayment-layout">
          <section className="uiPayment-paymentPanel">
            <div className="uiPayment-panelHeading">
              <div>
                <span className="uiPayment-sectionNumber">01</span>
                <h2>Forma de pagamento</h2>
              </div>

              <span className="uiPayment-mercadoPago">
                Processado pelo Mercado Pago
              </span>
            </div>

            {paymentResult ? (
              <div className="uiPayment-resultFlow">
                <div
                  className={`uiPayment-paymentStatus ${statusVisual.classe}`}
                  role="status"
                  aria-live="polite"
                >
                  <span
                    className="uiPayment-paymentStatusIcon"
                    aria-hidden="true"
                  >
                    {statusVisual.icone}
                  </span>
                  <div className="uiPayment-paymentStatusText">
                    <strong>{statusVisual.titulo}</strong>
                    <p>{statusVisual.mensagem}</p>
                    <small>Referência: {referenciaPagamento}</small>
                  </div>
                </div>

                {pagamentoAprovado ? (
                  <div className="uiPayment-finalResult">
                    <div
                      className="uiPayment-finalResultIcon"
                      aria-hidden="true"
                    >
                      ✓
                    </div>
                    <h3>Compra confirmada</h3>
                    <p>
                      Recebemos a confirmação do pagamento pelo Mercado Pago.
                      Você já pode acompanhar seu pedido.
                    </p>
                    {paymentResult.pago_em && (
                      <small>
                        Confirmado em:{" "}
                        {new Date(paymentResult.pago_em).toLocaleString(
                          "pt-BR",
                        )}
                      </small>
                    )}
                    <small role="status" aria-live="polite">
                      {limpezaCarrinhoStatus === "concluido"
                        ? "Seu carrinho foi esvaziado e convertido em pedido. Os itens continuam registrados no pedido."
                        : limpezaCarrinhoStatus === "processando" ||
                            limpezaCarrinhoStatus === "aguardando"
                          ? "Pagamento aprovado. Estamos esvaziando seu carrinho com segurança..."
                          : "Pagamento aprovado, mas não foi possível converter o carrinho automaticamente."}
                    </small>
                    {limpezaCarrinhoStatus === "erro" && (
                      <div>
                        {limpezaCarrinhoErro && (
                          <small>{limpezaCarrinhoErro}</small>
                        )}
                        <button
                          className="uiPayment-copyButton"
                          type="button"
                          onClick={() =>
                            setRepetirLimpezaCarrinho((valor) => valor + 1)
                          }
                        >
                          Tentar esvaziar carrinho novamente
                        </button>
                      </div>
                    )}
                    <button
                      className="uiPayment-copyButton"
                      type="button"
                      onClick={() => router.push(ROTAS.PAGINAS.LOJA.PEDIDOS)}
                    >
                      Ver meus pedidos
                    </button>
                  </div>
                ) : pagamentoNaoAprovado ? (
                  <div className="uiPayment-finalResult">
                    <div
                      className="uiPayment-finalResultIcon isFailed"
                      aria-hidden="true"
                    >
                      !
                    </div>
                    <h3>Não foi possível concluir</h3>
                    <p>
                      Não identificamos um pagamento aprovado para esta
                      cobrança.
                    </p>
                    <button
                      className="uiPayment-copyButton"
                      type="button"
                      onClick={iniciarNovaTentativa}
                    >
                      Tentar outro pagamento
                    </button>
                  </div>
                ) : pagamentoEstornado ? (
                  <div className="uiPayment-finalResult">
                    <h3>Atualização da cobrança</h3>
                    <p>
                      O status atual é <strong>{statusPagamentoAtual}</strong>.
                      Em caso de dúvida, fale com nossa equipe de atendimento.
                    </p>
                    <button
                      className="uiPayment-copyButton"
                      type="button"
                      onClick={() => router.push(ROTAS.PAGINAS.LOJA.PEDIDOS)}
                    >
                      Ver meus pedidos
                    </button>
                  </div>
                ) : pagamentoEhPix ? (
                  <div className="uiPayment-pixResult">
                    <div className="uiPayment-pixIcon">PIX</div>
                    <h3>
                      {pixData.qrCodeBase64 || pixData.qrCode
                        ? "Seu PIX está pronto"
                        : "Cobrança PIX criada"}
                    </h3>
                    <p>
                      Escaneie o QR Code pelo aplicativo do seu banco ou copie o
                      código PIX abaixo. A confirmação será consultada
                      automaticamente.
                    </p>

                    {pixData.qrCodeBase64 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="uiPayment-qrCode"
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                        alt="QR Code PIX para pagamento"
                      />
                    )}

                    {pixData.qrCode && (
                      <>
                        <label
                          className="uiPayment-copyLabel"
                          htmlFor="pix-code"
                        >
                          PIX copia e cola
                        </label>
                        <textarea
                          id="pix-code"
                          className="uiPayment-pixCode"
                          readOnly
                          value={pixData.qrCode}
                        />
                        <button
                          className="uiPayment-copyButton"
                          type="button"
                          onClick={handleCopyPix}
                        >
                          {copied ? "Código copiado!" : "Copiar código PIX"}
                        </button>
                      </>
                    )}

                    {!pixData.qrCodeBase64 && !pixData.qrCode && (
                      <div className="uiPayment-pixMissing" role="status">
                        <strong>
                          Referência da cobrança: {referenciaPagamento}
                        </strong>
                        <span>
                          Não gere outra cobrança enquanto verificamos esta
                          referência.
                        </span>
                      </div>
                    )}

                    {pixData.ticketUrl && (
                      <a
                        className="uiPayment-ticketLink"
                        href={pixData.ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir página do pagamento
                      </a>
                    )}
                    <p className="uiPayment-pendingNote">
                      A confirmação é atualizada automaticamente. Não é
                      necessário recarregar esta página.
                    </p>
                  </div>
                ) : (
                  <div className="uiPayment-finalResult">
                    <div
                      className="uiPayment-pendingSpinner"
                      aria-hidden="true"
                    />
                    <h3>Pagamento enviado para análise</h3>
                    <p>
                      Forma selecionada: <strong>{nomeMetodoPagamento}</strong>
                    </p>
                    {ultimosDigitosCartao && (
                      <p>
                        Cartão final{" "}
                        <strong>•••• {ultimosDigitosCartao}</strong>
                      </p>
                    )}
                    {paymentResult.payment_method?.name && (
                      <p>
                        Bandeira:{" "}
                        <strong>{paymentResult.payment_method.name}</strong>
                      </p>
                    )}
                    <p>
                      Estamos aguardando o retorno definitivo do Mercado Pago.
                    </p>
                  </div>
                )}
              </div>
            ) : loadingCart ? (
              <div className="uiPayment-loadingBox">
                <span className="uiPayment-spinner" />
                Carregando seu pedido...
              </div>
            ) : sdkReady &&
              pagamentoComFreteValidado &&
              selectedFreightOption !== null &&
              !pageError ? (
              <div className="uiPayment-brickWrapper">
                <div className="uiPayment-paymentIntro">
                  <span className="uiPayment-paymentBadge">PIX disponível</span>
                  <span className="uiPayment-paymentBadge">
                    Cartão de crédito disponível
                  </span>
                </div>

                <Payment
                  initialization={paymentInitialization}
                  customization={{
                    paymentMethods: {
                      bankTransfer: ["pix"],
                      creditCard: "all",
                    },
                  }}
                  onSubmit={handlePaymentSubmit}
                  onError={(error) => {
                    const detalhe =
                      error instanceof Error
                        ? error.message
                        : "Erro interno do Payment Brick";

                    logPagamento(
                      "PAYMENT_BRICK:ERRO",
                      { mensagem: detalhe },
                      true,
                    );
                    setPaymentError(
                      "O Mercado Pago encontrou um problema ao carregar ou enviar os dados. Confira o console para o diagnóstico e tente novamente.",
                    );
                  }}
                />
              </div>
            ) : (
              <div className="uiPayment-emptyState">
                <span className="uiPayment-emptyIcon">♡</span>

                <h3>
                  {loadingFreight
                    ? "Validando a entrega pelo CEP"
                    : freightManual
                      ? "Entrega aguardando definição"
                      : freightError
                        ? "Não foi possível cotar o frete"
                        : freightOptions.length > 0 && !selectedFreightOption
                          ? "Escolha uma opção de entrega"
                          : selectedFreightOption
                            ? "Entrega selecionada"
                            : "Seu pagamento será exibido aqui"}
                </h3>

                <p>
                  {loadingFreight
                    ? "Estamos validando o endereço e os dados do seu pedido."
                    : freightManual
                      ? freightManualMessage
                      : freightError
                        ? "Confira o endereço de entrega e os dados de embalagem dos produtos. Depois, tente novamente no resumo do pedido."
                        : freightOptions.length > 0 && !selectedFreightOption
                          ? "Selecione a modalidade e o prazo que preferir. O total será atualizado antes de iniciar o pagamento."
                          : selectedFreightOption && !tokenFrete
                            ? "A opção foi selecionada, mas o backend ainda não forneceu o token de validação da cotação. Nenhuma cobrança será iniciada até que essa validação esteja disponível."
                            : selectedFreightOption
                              ? "Sua cotação foi validada pelo servidor. Estamos preparando as formas de pagamento."
                              : "Precisamos carregar seu carrinho e validar a entrega antes de liberar o pagamento."}
                </p>
                {freightManual && (
                  <span className="uiPayment-manualNoticeLabel">
                    O pagamento ficará disponível após a definição do frete.
                  </span>
                )}
                {selectedFreightOption && !tokenFrete && (
                  <span className="uiPayment-manualNoticeLabel">
                    Pagamento bloqueado até o backend validar a cotação.
                  </span>
                )}
              </div>
            )}

            <div className="uiPayment-trustInfo">
              <span>♢</span>

              <p>
                Seus dados de pagamento são processados com segurança pelo
                Mercado Pago. Os dados completos do cartão não são armazenados
                pela loja.
              </p>
            </div>
          </section>

          <aside className="uiPayment-summaryPanel">
            <div className="uiPayment-summaryHeading">
              <h2>Resumo do pedido</h2>

              <span>
                {itensExibidos.length}{" "}
                {itensExibidos.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {loadingCart ? (
              <div className="uiPayment-summaryLoading">
                Calculando valores...
              </div>
            ) : itensExibidos.length > 0 ? (
              <div className="uiPayment-itemsList">
                {itensExibidos.map((item, index) => (
                  <div
                    className="uiPayment-itemRow"
                    key={
                      item.id_item ?? `${item.produto_id ?? "produto"}-${index}`
                    }
                  >
                    <div className="uiPayment-itemThumb">UI</div>

                    <div className="uiPayment-itemInfo">
                      <strong>
                        {item.nome ||
                          item.titulo ||
                          `Produto ${item.produto_id ?? ""}`}
                      </strong>

                      <span>Quantidade: {item.quantidade ?? 1}</span>
                    </div>

                    <strong>
                      {formatCurrency(
                        toNumber(item.preco_unitario) *
                          toNumber(item.quantidade ?? 1),
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="uiPayment-summaryLoading">Nenhum item carregado.</p>
            )}

            <section
              className="uiPayment-freightSection"
              aria-label="Opções de entrega"
            >
              <div className="uiPayment-freightHeading">
                <div>
                  <strong>Entrega</strong>
                  <small>
                    {formatarCep(freightCep || cepIdentificacao || "")
                      ? `CEP de entrega: ${formatarCep(freightCep || cepIdentificacao || "")}`
                      : "CEP do endereço cadastrado"}
                  </small>
                </div>
                {!pagamentoAprovado && (
                  <button
                    type="button"
                    className="uiPayment-freightRefresh"
                    onClick={() => setFreightReload((value) => value + 1)}
                    disabled={loadingFreight || !sessionId}
                  >
                    {loadingFreight ? "Consultando..." : "Recalcular"}
                  </button>
                )}
              </div>

              {pagamentoAprovado ? (
                <div className="uiPayment-manualFreight" role="status">
                  <span
                    className="uiPayment-manualFreightIcon"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <div>
                    <strong>Entrega vinculada à compra</strong>
                    <small>
                      {paymentSnapshot?.modalidade
                        ? `${paymentSnapshot.modalidade}. `
                        : "Os dados de entrega foram registrados no pedido. "}
                      {paymentSnapshot?.prazoMinimo &&
                      paymentSnapshot?.prazoMaximo
                        ? `Prazo estimado: ${paymentSnapshot.prazoMinimo} a ${paymentSnapshot.prazoMaximo} dias úteis.`
                        : "Consulte os detalhes na área de pedidos."}
                    </small>
                  </div>
                </div>
              ) : loadingFreight ? (
                <div className="uiPayment-freightState">
                  <span className="uiPayment-spinner" />
                  Consultando as opções de entrega para seu CEP...
                </div>
              ) : freightError ? (
                <div className="uiPayment-freightError" role="alert">
                  <span>{freightError}</span>
                  <button
                    type="button"
                    onClick={() => setFreightReload((value) => value + 1)}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : freightManual ? (
                <div className="uiPayment-manualFreight" role="status">
                  <span
                    className="uiPayment-manualFreightIcon"
                    aria-hidden="true"
                  >
                    ♡
                  </span>
                  <div>
                    <strong>Frete a combinar</strong>
                    <small>{freightManualMessage}</small>
                  </div>
                </div>
              ) : cupomFreteGratis && selectedFreightOption?.frete_gratis ? (
                <div className="uiPayment-manualFreight" role="status">
                  <span
                    className="uiPayment-manualFreightIcon"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <div>
                    <strong>Frete grátis aplicado automaticamente</strong>
                    <small>
                      {codigoCupomFrete
                        ? `Cupom ${codigoCupomFrete} confirmado na cotação.`
                        : "O benefício de frete grátis foi confirmado na cotação."}{" "}
                      Prazo: {selectedFreightOption.prazo_minimo} a{" "}
                      {selectedFreightOption.prazo_maximo} dias úteis.
                    </small>
                  </div>
                </div>
              ) : freightOptions.length > 0 ? (
                <div className="uiPayment-freightOptions">
                  {freightOptions.map((option) => {
                    const selecionado =
                      String(option.id_regra) === selectedFreightId;

                    return (
                      <button
                        type="button"
                        key={option.id_regra}
                        className={`uiPayment-freightOption ${selecionado ? "isSelected" : ""}`}
                        aria-pressed={selecionado}
                        onClick={() => {
                          setSelectedFreightId(String(option.id_regra));
                          setPaymentError("");
                          logPagamento("FRETE:OPCAO_SELECIONADA", {
                            regraId: option.id_regra,
                            modalidade: option.modalidade,
                            valorFrete: option.valor,
                            descontoFrete: option.desconto_frete,
                            freteGratis: option.frete_gratis,
                            prazoMinimo: option.prazo_minimo,
                            prazoMaximo: option.prazo_maximo,
                            total: option.total_pedido,
                          });
                        }}
                      >
                        <span className="uiPayment-freightRadio" />
                        <span className="uiPayment-freightOptionInfo">
                          <strong>{option.modalidade}</strong>
                          <small>Entrega provisória</small>
                          <small>
                            Prazo estimado: {option.prazo_minimo} a{" "}
                            {option.prazo_maximo} dias úteis
                          </small>
                        </span>
                        <strong className="uiPayment-freightPrice">
                          {option.frete_gratis
                            ? "Grátis"
                            : formatCurrency(
                                Math.max(
                                  0,
                                  option.valor - option.desconto_frete,
                                ),
                              )}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="uiPayment-freightHint">
                  O frete será cotado usando o CEP do endereço informado na
                  identificação.
                </p>
              )}
            </section>

            <div className="uiPayment-summaryLines">
              <div>
                <span>Subtotal</span>
                <strong>
                  {pagamentoAprovado && paymentSnapshot?.subtotal !== undefined
                    ? formatCurrency(paymentSnapshot.subtotal)
                    : formatCurrency(subtotal)}
                </strong>
              </div>

              <div>
                <span>Frete</span>
                <strong>
                  {pagamentoAprovado
                    ? paymentSnapshot?.freteGratis
                      ? "Grátis"
                      : paymentSnapshot?.freteLiquido !== undefined
                        ? formatCurrency(paymentSnapshot.freteLiquido)
                        : "Registrado no pedido"
                    : selectedFreightOption?.frete_gratis
                      ? "Grátis"
                      : selectedFreightOption
                        ? formatCurrency(
                            Math.max(0, shipping - freightDiscount),
                          )
                        : freightManual
                          ? "A combinar"
                          : "Aguardando cotação"}
                </strong>
              </div>

              {((pagamentoAprovado &&
                (paymentSnapshot?.descontoFrete ?? 0) > 0) ||
                (!pagamentoAprovado &&
                  selectedFreightOption &&
                  freightDiscount > 0)) && (
                <div>
                  <span>Desconto no frete</span>
                  <strong className="uiPayment-freightDiscount">
                    -{" "}
                    {formatCurrency(
                      pagamentoAprovado
                        ? (paymentSnapshot?.descontoFrete ?? 0)
                        : freightDiscount,
                    )}
                  </strong>
                </div>
              )}
            </div>

            <div className="uiPayment-totalRow">
              <span>Total do pedido</span>
              <strong>
                {pagamentoAprovado
                  ? (paymentSnapshot?.totalConfirmado ??
                      toNumber(
                        paymentResult?.valor ??
                          paymentResult?.transaction_amount,
                      )) > 0
                    ? formatCurrency(
                        paymentSnapshot?.totalConfirmado ??
                          toNumber(
                            paymentResult?.valor ??
                              paymentResult?.transaction_amount,
                          ),
                      )
                    : "Pagamento confirmado"
                  : selectedFreightOption
                    ? formatCurrency(total)
                    : "A confirmar"}
              </strong>
            </div>

            <p className="uiPayment-summaryFootnote">
              {pagamentoAprovado
                ? "Pagamento confirmado. O resumo acima preserva os valores registrados no momento da cobrança. Consulte a área de pedidos para acompanhar a entrega."
                : freightManual
                  ? "A loja informará o valor da entrega antes da confirmação do pagamento. Nenhuma cobrança será iniciada enquanto o frete estiver pendente."
                  : cupomFreteGratis && selectedFreightOption?.frete_gratis
                    ? "O cupom de frete grátis foi identificado e a opção foi selecionada automaticamente. O backend ainda validará o token e o total antes de solicitar o pagamento."
                    : selectedFreightOption && !tokenFrete
                      ? "Esta opção ainda não possui token de cotação validado pelo servidor. O valor exibido não será usado para iniciar uma cobrança."
                      : selectedFreightOption
                        ? "O backend validará novamente a cotação, os produtos e o total antes de solicitar o pagamento."
                        : "Selecione uma modalidade de entrega. O pagamento só será liberado após a validação do frete pelo servidor."}
            </p>

            <div className="uiPayment-secureCard">
              <span className="uiPayment-lockIcon">♙</span>

              <div>
                <strong>Compra protegida</strong>
                <small>Pagamento processado em ambiente seguro.</small>
              </div>
            </div>
          </aside>
        </div>

        <footer className="uiPayment-footer">
          <span>© {new Date().getFullYear()} Universo Império</span>
          <span>Feito com carinho para você ♡</span>
        </footer>
      </div>
    </main>
  );
}
