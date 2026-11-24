"use client";

import ROTAS from "@/app/constants/rotas";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  CreditCard,
  Eye,
  FileJson,
  Filter,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

type Pedido = {
  status_id?: number | null;
  id_pedido: number;
  codigo?: string | null;
  cliente_id?: number | null;
  carrinho_id?: number | null;
  status?: string | null;
  moeda?: string | null;
  subtotal?: string | number | null;
  desconto?: string | number | null;
  frete?: string | number | null;
  total?: string | number | null;
  observacoes?: string | null;
  pago_em?: string | null;
  cancelado_em?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

type PedidoItem = {
  id_pedido_item?: number | null;
  produto_id?: number | null;
  variacao_id?: number | null;
  sku?: string | null;
  nome_produto?: string | null;
  quantidade?: string | number | null;
  preco_unitario?: string | number | null;
  desconto?: string | number | null;
  total?: string | number | null;
};

type PedidoEndereco = {
  tipo?: string | null;
  destinatario?: string | null;
  documento?: string | null;
  telefone?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pais?: string | null;
  referencia?: string | null;
};

type PedidoHistorico = {
  status_anterior?: string | null;
  status_novo?: string | null;
  observacao?: string | null;
  usuario_id?: number | null;
  criado_em?: string | null;
};

type PedidoDetalhe = {
  pedido?: Pedido;
  itens?: PedidoItem[];
  enderecos?: PedidoEndereco[];
  historico?: PedidoHistorico[];
};

type ApiResposta = {
  sucesso?: boolean;
  mensagem?: string;
  message?: string;
  erro?: string;
  dados?: unknown;
  [chave: string]: unknown;
};

type Filtros = {
  codigo: string;
  status: string;
  cliente_id: string;
  data_inicio: string;
  data_fim: string;
};

type FormularioEdicao = {
  codigo: string;
  cliente_id: string;
  carrinho_id: string;
  moeda: string;
  subtotal: string;
  desconto: string;
  frete: string;
  total: string;
  observacoes: string;
  pago_em: string;
  cancelado_em: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const LIMITE_PAGINA = 20;
const FILTROS_VAZIOS: Filtros = {
  codigo: "",
  status: "",
  cliente_id: "",
  data_inicio: "",
  data_fim: "",
};

const JSON_NOVO_PEDIDO = {
  status_id: null,
  cliente_id: null,
  carrinho_id: null,
  status: "pendente",
  moeda: "BRL",
  frete: "0.00",
  desconto: "0.00",
  observacoes: null,
  itens: [
    {
      produto_id: null,
      nome_produto: "",
      quantidade: "1.000",
      preco_unitario: "0.00",
      desconto: "0.00",
      sku: null,
      variacao_id: null,
    },
  ],
  enderecos: [],
};

function numero(valor: unknown): number {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

function formatarMoeda(valor: unknown, moeda = "BRL"): string {
  return numero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: moeda || "BRL",
  });
}

function formatarData(valor?: string | null): string {
  if (!valor) return "—";
  const data = new Date(valor.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paraDateTimeLocal(valor?: string | null): string {
  if (!valor) return "";
  return valor.replace(" ", "T").slice(0, 16);
}

function paraDataApi(valor: string): string | null {
  const limpo = valor.trim();
  if (!limpo) return null;
  return limpo.length === 16
    ? `${limpo.replace("T", " ")}:00`
    : limpo.replace("T", " ");
}

function textoErro(dados: unknown, fallback: string): string {
  if (dados && typeof dados === "object") {
    const objeto = dados as ApiResposta;
    for (const chave of ["mensagem", "message", "erro"] as const) {
      const valor = objeto[chave];
      if (typeof valor === "string" && valor.trim()) return valor;
    }
  }
  return fallback;
}

async function requisitar<T>(
  rota: string,
  metodo = "GET",
  corpo?: unknown,
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "A variável NEXT_PUBLIC_API_URL não está configurada no ambiente do Next.js.",
    );
  }

  const resposta = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}),
  });

  const texto = await resposta.text();
  let dados: unknown = null;

  if (texto.trim()) {
    const conteudo = texto.trim();

    try {
      dados = JSON.parse(conteudo);
    } catch {
      // Alguns endpoints PHP podem acrescentar um "null" depois do JSON
      // (por exemplo: {...}null). Removemos somente esse sufixo isolado.
      const semNullFinal = conteudo.replace(/null\s*$/, "").trimEnd();

      if (!semNullFinal || semNullFinal === conteudo) {
        throw new Error(
          "A API retornou uma resposta que não é um JSON válido.",
        );
      }

      try {
        dados = JSON.parse(semNullFinal);
      } catch {
        throw new Error(
          "A API retornou uma resposta que não é um JSON válido.",
        );
      }
    }
  }

  const dadosInternos = extrairRaizDados(dados);
  const falhaInterna = dadosInternos.sucesso === false;

  if (
    !resposta.ok ||
    falhaInterna ||
    (dados &&
      typeof dados === "object" &&
      (dados as ApiResposta).sucesso === false)
  ) {
    throw new Error(
      textoErro(
        dadosInternos,
        textoErro(
          dados,
          `A operação não foi concluída. HTTP ${resposta.status}.`,
        ),
      ),
    );
  }

  return dados as T;
}

/**
 * Desembrulha envelopes sucessivos da API.
 * Exemplo real:
 * { status, mensagem, dados: { sucesso, mensagem, dados: { pedidos, paginacao } } }
 */
function extrairRaizDados(resposta: unknown): Record<string, unknown> {
  let atual: unknown = resposta;

  for (let nivel = 0; nivel < 5; nivel += 1) {
    if (!atual || typeof atual !== "object" || Array.isArray(atual)) break;

    const objeto = atual as Record<string, unknown>;
    const proximo = objeto.dados;

    if (!proximo || typeof proximo !== "object") break;
    atual = proximo;
  }

  return atual && typeof atual === "object" && !Array.isArray(atual)
    ? (atual as Record<string, unknown>)
    : {};
}

function statusClass(status?: string | null): string {
  const valor = (status ?? "").toLocaleLowerCase("pt-BR");
  if (/(pago|aprovado|entregue|finalizado|concluido)/.test(valor))
    return "pedidos__status--sucesso";
  if (/(cancelado|rejeitado|falhou|estornado)/.test(valor))
    return "pedidos__status--erro";
  if (/(separando|enviado|transito|processando)/.test(valor))
    return "pedidos__status--info";
  return "pedidos__status--pendente";
}

function formularioDoPedido(pedido: Pedido): FormularioEdicao {
  return {
    codigo: pedido.codigo ?? "",
    cliente_id: pedido.cliente_id != null ? String(pedido.cliente_id) : "",
    carrinho_id: pedido.carrinho_id != null ? String(pedido.carrinho_id) : "",
    moeda: pedido.moeda ?? "BRL",
    subtotal: String(pedido.subtotal ?? "0.00"),
    desconto: String(pedido.desconto ?? "0.00"),
    frete: String(pedido.frete ?? "0.00"),
    total: String(pedido.total ?? "0.00"),
    observacoes: pedido.observacoes ?? "",
    pago_em: paraDateTimeLocal(pedido.pago_em),
    cancelado_em: paraDateTimeLocal(pedido.cancelado_em),
  };
}

function criarPayloadEdicao(formulario: FormularioEdicao) {
  return {
    codigo: formulario.codigo.trim(),
    cliente_id: Number(formulario.cliente_id),
    carrinho_id: formulario.carrinho_id.trim()
      ? Number(formulario.carrinho_id)
      : null,
    moeda: formulario.moeda.trim().toUpperCase(),
    subtotal: formulario.subtotal.trim().replace(",", "."),
    desconto: formulario.desconto.trim().replace(",", "."),
    frete: formulario.frete.trim().replace(",", "."),
    total: formulario.total.trim().replace(",", "."),
    observacoes: formulario.observacoes.trim() || null,
    pago_em: paraDataApi(formulario.pago_em),
    cancelado_em: paraDataApi(formulario.cancelado_em),
  };
}

function validarJsonNovoPedido(valor: unknown): string | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor))
    return "O JSON precisa ser um objeto de pedido.";
  const pedido = valor as Record<string, unknown>;
  const statusId = Number(pedido.status_id);
  const clienteId = Number(pedido.cliente_id);
  if (!Number.isInteger(statusId) || statusId <= 0)
    return "Informe um status_id existente e maior que zero.";
  if (!Number.isInteger(clienteId) || clienteId <= 0)
    return "Informe um cliente_id existente e maior que zero.";
  if (
    pedido.carrinho_id != null &&
    pedido.carrinho_id !== "" &&
    (!Number.isInteger(Number(pedido.carrinho_id)) ||
      Number(pedido.carrinho_id) <= 0)
  ) {
    return "O carrinho_id deve ser um ID positivo ou null.";
  }
  if (typeof pedido.status === "string" && pedido.status.length > 40)
    return "O status não pode ultrapassar 40 caracteres.";
  if (typeof pedido.moeda === "string" && pedido.moeda.trim().length !== 3)
    return "A moeda deve conter exatamente três caracteres, por exemplo BRL.";
  if (!Array.isArray(pedido.itens) || pedido.itens.length === 0)
    return "Informe pelo menos um item no pedido.";
  for (let i = 0; i < pedido.itens.length; i += 1) {
    const item = pedido.itens[i] as Record<string, unknown>;
    if (
      !item ||
      typeof item !== "object" ||
      !Number.isInteger(Number(item.produto_id)) ||
      Number(item.produto_id) <= 0
    )
      return `O item ${i + 1} precisa de um produto_id válido.`;
    if (typeof item.nome_produto !== "string" || !item.nome_produto.trim())
      return `Informe nome_produto no item ${i + 1}.`;
    if (
      !Number.isFinite(Number(item.quantidade)) ||
      Number(item.quantidade) <= 0
    )
      return `A quantidade do item ${i + 1} deve ser maior que zero.`;
    if (
      !Number.isFinite(Number(item.preco_unitario)) ||
      Number(item.preco_unitario) < 0
    )
      return `O preço unitário do item ${i + 1} é inválido.`;
    if (
      item.desconto != null &&
      (!Number.isFinite(Number(item.desconto)) || Number(item.desconto) < 0)
    )
      return `O desconto do item ${i + 1} é inválido.`;
  }
  if (pedido.enderecos != null && !Array.isArray(pedido.enderecos))
    return "O campo enderecos deve ser uma lista.";
  return null;
}

export default function PedidosPainelPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtrosRascunho, setFiltrosRascunho] =
    useState<Filtros>(FILTROS_VAZIOS);
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<Filtros>(FILTROS_VAZIOS);
  const [modalNovo, setModalNovo] = useState(false);
  const [jsonNovo, setJsonNovo] = useState(
    JSON.stringify(JSON_NOVO_PEDIDO, null, 2),
  );
  const [modalEditar, setModalEditar] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState<Pedido | null>(null);
  const [formularioEdicao, setFormularioEdicao] =
    useState<FormularioEdicao | null>(null);
  const [modalStatus, setModalStatus] = useState(false);
  const [pedidoStatus, setPedidoStatus] = useState<Pedido | null>(null);
  const [statusNovo, setStatusNovo] = useState("");
  const [statusIdNovo, setStatusIdNovo] = useState("");
  const [observacaoStatus, setObservacaoStatus] = useState("");
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [pedidoDetalhe, setPedidoDetalhe] = useState<PedidoDetalhe | null>(
    null,
  );
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const carregarPedidos = useCallback(
    async (
      silencioso = false,
      paginaSolicitada = pagina,
      filtros = filtrosAplicados,
    ) => {
      if (silencioso) setAtualizando(true);
      else setCarregando(true);
      setErro("");
      try {
        const parametros = new URLSearchParams({
          pagina: String(paginaSolicitada),
          limite: String(LIMITE_PAGINA),
        });
        if (filtros.codigo.trim())
          parametros.set("codigo", filtros.codigo.trim());
        if (filtros.status.trim())
          parametros.set("status", filtros.status.trim());
        if (filtros.cliente_id.trim())
          parametros.set("cliente_id", filtros.cliente_id.trim());
        if (filtros.data_inicio)
          parametros.set("data_inicio", filtros.data_inicio);
        if (filtros.data_fim) parametros.set("data_fim", filtros.data_fim);
        const resposta = await requisitar<unknown>(
          `${ROTAS.PEDIDOS.PAINEL.LISTAR}?${parametros.toString()}`,
        );
        const dados = extrairRaizDados(resposta);
        const lista = dados.pedidos;
        if (!Array.isArray(lista))
          throw new Error("A API não retornou a lista de pedidos esperada.");
        setPedidos(lista as Pedido[]);
        const paginacao =
          dados.paginacao && typeof dados.paginacao === "object"
            ? (dados.paginacao as Record<string, unknown>)
            : {};
        setTotalPedidos(numero(paginacao.total));
        setTotalPaginas(Math.max(1, numero(paginacao.total_paginas) || 1));
      } catch (falha) {
        setErro(
          falha instanceof Error
            ? falha.message
            : "Não foi possível carregar os pedidos.",
        );
        setPedidos([]);
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [pagina, filtrosAplicados],
  );

  // Dispara a consulta inicial e refaz a busca quando página ou filtros mudarem.
  // Sem este efeito, carregando permanece true e a API nunca é chamada pela tela.
  useEffect(() => {
    void carregarPedidos(false, pagina, filtrosAplicados);
  }, [carregarPedidos, pagina, filtrosAplicados]);

  const statusExistentes = useMemo(
    () =>
      Array.from(
        new Set(
          pedidos
            .map((pedido) => pedido.status?.trim())
            .filter((status): status is string => Boolean(status)),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [pedidos],
  );

  const totaisPagina = useMemo(
    () => ({
      pedidos: pedidos.length,
      valor: pedidos.reduce((soma, pedido) => soma + numero(pedido.total), 0),
      pendentes: pedidos.filter(
        (pedido) =>
          !/(pago|aprovado|entregue|finalizado|concluido|cancelado)/i.test(
            pedido.status ?? "",
          ),
      ).length,
    }),
    [pedidos],
  );

  function aplicarFiltros(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setPagina(1);
    setFiltrosAplicados({ ...filtrosRascunho });
  }

  function limparFiltros() {
    setFiltrosRascunho(FILTROS_VAZIOS);
    setFiltrosAplicados(FILTROS_VAZIOS);
    setPagina(1);
  }

  function abrirNovoPedido() {
    setJsonNovo(JSON.stringify(JSON_NOVO_PEDIDO, null, 2));
    setErro("");
    setSucesso("");
    setModalNovo(true);
  }

  async function salvarNovoPedido(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    let payload: unknown;
    try {
      payload = JSON.parse(jsonNovo);
    } catch {
      setErro("O JSON está inválido. Revise vírgulas, aspas e chaves.");
      return;
    }
    const validacao = validarJsonNovoPedido(payload);
    if (validacao) {
      setErro(validacao);
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await requisitar(ROTAS.PEDIDOS.PAINEL.CADASTRAR, "POST", payload);
      setModalNovo(false);
      setSucesso("Pedido cadastrado com sucesso.");
      setPagina(1);
      await carregarPedidos(true, 1, filtrosAplicados);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível cadastrar o pedido.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(pedido: Pedido) {
    setPedidoEditando(pedido);
    setFormularioEdicao(formularioDoPedido(pedido));
    setErro("");
    setModalEditar(true);
  }

  async function salvarEdicao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!pedidoEditando || !formularioEdicao) return;
    const payload = criarPayloadEdicao(formularioEdicao);
    if (!Number.isInteger(payload.cliente_id) || payload.cliente_id <= 0) {
      setErro("Informe um cliente_id válido.");
      return;
    }
    if (payload.moeda.length !== 3) {
      setErro("A moeda deve conter exatamente três caracteres.");
      return;
    }
    for (const campo of ["subtotal", "desconto", "frete", "total"] as const) {
      if (
        !Number.isFinite(Number(payload[campo])) ||
        Number(payload[campo]) < 0
      ) {
        setErro(`O campo ${campo} deve ser um número não negativo.`);
        return;
      }
    }
    if (payload.codigo.length > 40) {
      setErro("O código não pode ultrapassar 40 caracteres.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await requisitar(
        ROTAS.PEDIDOS.PAINEL.ATUALIZAR(pedidoEditando.id_pedido),
        "PUT",
        payload,
      );
      setModalEditar(false);
      setPedidoEditando(null);
      setSucesso(
        `Pedido ${pedidoEditando.codigo ?? `#${pedidoEditando.id_pedido}`} atualizado.`,
      );
      await carregarPedidos(true);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível atualizar o pedido.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirAlteracaoStatus(pedido: Pedido) {
    setPedidoStatus(pedido);
    setStatusNovo(pedido.status ?? "");
    setStatusIdNovo(pedido.status_id != null ? String(pedido.status_id) : "");
    setObservacaoStatus("");
    setErro("");
    setModalStatus(true);
  }

  async function salvarStatus(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!pedidoStatus) return;
    if (!statusNovo.trim() || statusNovo.trim().length > 40) {
      setErro("Informe um status com até 40 caracteres.");
      return;
    }
    if (
      statusIdNovo.trim() &&
      (!Number.isInteger(Number(statusIdNovo)) || Number(statusIdNovo) <= 0)
    ) {
      setErro("O status_id deve ser um inteiro positivo ou ficar vazio.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await requisitar(
        ROTAS.PEDIDOS.PAINEL.ALTERAR_STATUS(pedidoStatus.id_pedido),
        "PUT",
        {
          status: statusNovo.trim(),
          status_id: statusIdNovo.trim() ? Number(statusIdNovo) : null,
          observacao: observacaoStatus.trim() || null,
        },
      );
      setModalStatus(false);
      setPedidoStatus(null);
      setSucesso(
        `Status do pedido ${pedidoStatus.codigo ?? `#${pedidoStatus.id_pedido}`} atualizado; histórico registrado.`,
      );
      await carregarPedidos(true);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível atualizar o status.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function abrirDetalhes(pedido: Pedido) {
    setPedidoDetalhe(null);
    setModalDetalhe(true);
    setCarregandoDetalhe(true);
    setErro("");

    try {
      // O endpoint administrativo de detalhe retorna o resumo do pedido.
      // Itens, endereços e histórico possuem endpoints próprios no Site.php.
      const [
        respostaPedido,
        respostaItens,
        respostaEnderecos,
        respostaHistorico,
      ] = await Promise.all([
        requisitar<unknown>(
          ROTAS.PEDIDOS.PAINEL.BUSCAR_POR_ID(pedido.id_pedido),
        ),
        requisitar<unknown>(
          ROTAS.PEDIDOS.PAINEL.LISTAR_ITENS(pedido.id_pedido),
        ),
        requisitar<unknown>(
          ROTAS.PEDIDOS.PAINEL.LISTAR_ENDERECOS(pedido.id_pedido),
        ),
        requisitar<unknown>(
          ROTAS.PEDIDOS.PAINEL.LISTAR_HISTORICO(pedido.id_pedido),
        ),
      ]);

      const dadosPedido = extrairRaizDados(respostaPedido);
      const pedidoApi =
        dadosPedido.pedido && typeof dadosPedido.pedido === "object"
          ? (dadosPedido.pedido as Pedido)
          : (dadosPedido as unknown as Pedido);

      const extrairLista = (resposta: unknown, chave: string): unknown[] => {
        let atual: unknown = resposta;

        for (let nivel = 0; nivel < 5; nivel += 1) {
          if (Array.isArray(atual)) return atual;
          if (!atual || typeof atual !== "object") return [];

          const objeto = atual as Record<string, unknown>;
          if (Array.isArray(objeto[chave])) return objeto[chave] as unknown[];
          if (Array.isArray(objeto.dados)) return objeto.dados;
          if (!objeto.dados || typeof objeto.dados !== "object") return [];

          atual = objeto.dados;
        }

        return [];
      };

      if (!pedidoApi || !pedidoApi.id_pedido) {
        throw new Error("A API não retornou os dados principais do pedido.");
      }

      setPedidoDetalhe({
        pedido: pedidoApi,
        itens: extrairLista(respostaItens, "itens") as PedidoItem[],
        enderecos: extrairLista(
          respostaEnderecos,
          "enderecos",
        ) as PedidoEndereco[],
        historico: extrairLista(
          respostaHistorico,
          "historico",
        ) as PedidoHistorico[],
      });
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível carregar os detalhes do pedido.",
      );
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  return (
    <main className="pedidos">
      <div className="pedidos__container">
        <header className="pedidos__cabecalho">
          <div>
            <Link href={ROTAS.PAINEL.INICIO} className="pedidos__voltar">
              <ArrowLeft size={15} /> Painel administrativo
            </Link>
            <span className="pedidos__eyebrow">
              UNIVERSO IMPÉRIO · COMERCIAL
            </span>
            <h1>Gerenciamento de pedidos</h1>
            <p>
              Acompanhe vendas, consulte os itens, confira endereços e atualize
              o andamento dos pedidos.
            </p>
          </div>
          <div className="pedidos__acoes-cabecalho">
            <button
              type="button"
              className="pedidos__botao pedidos__botao--secundario"
              onClick={() => {
                void carregarPedidos(true);
              }}
              disabled={atualizando}
            >
              <RefreshCw
                size={16}
                className={atualizando ? "pedidos__girando" : ""}
              />{" "}
              Atualizar
            </button>
            <button
              type="button"
              className="pedidos__botao pedidos__botao--primario"
              onClick={abrirNovoPedido}
            >
              <Plus size={17} /> Novo pedido
            </button>
          </div>
        </header>

        {sucesso && (
          <div className="pedidos__alerta pedidos__alerta--sucesso">
            <CheckCircle2 size={17} />
            <span>{sucesso}</span>
            <button
              type="button"
              onClick={() => setSucesso("")}
              aria-label="Fechar aviso"
            >
              <X size={15} />
            </button>
          </div>
        )}
        {erro &&
          !modalNovo &&
          !modalEditar &&
          !modalStatus &&
          !modalDetalhe && (
            <div className="pedidos__alerta pedidos__alerta--erro">
              <AlertCircle size={17} />
              <span>{erro}</span>
              <button
                type="button"
                onClick={() => setErro("")}
                aria-label="Fechar aviso"
              >
                <X size={15} />
              </button>
            </div>
          )}

        <section
          className="pedidos__indicadores"
          aria-label="Resumo dos pedidos"
        >
          <article className="pedidos__indicador">
            <span className="pedidos__indicador-icone">
              <ShoppingBag size={20} />
            </span>
            <div>
              <small>Pedidos nesta página</small>
              <strong>{totaisPagina.pedidos.toLocaleString("pt-BR")}</strong>
              <span>
                {totalPedidos.toLocaleString("pt-BR")} no resultado filtrado
              </span>
            </div>
          </article>
          <article className="pedidos__indicador">
            <span className="pedidos__indicador-icone pedidos__indicador-icone--rosa">
              <CreditCard size={20} />
            </span>
            <div>
              <small>Valor desta página</small>
              <strong>{formatarMoeda(totaisPagina.valor)}</strong>
              <span>Soma dos pedidos exibidos</span>
            </div>
          </article>
          <article className="pedidos__indicador">
            <span className="pedidos__indicador-icone pedidos__indicador-icone--areia">
              <Clock3 size={20} />
            </span>
            <div>
              <small>Em andamento / aguardando</small>
              <strong>{totaisPagina.pendentes.toLocaleString("pt-BR")}</strong>
              <span>Pedidos não finalizados nesta página</span>
            </div>
          </article>
        </section>

        <section className="pedidos__painel">
          <div className="pedidos__painel-topo">
            <div>
              <span className="pedidos__secao-eyebrow">
                CONSULTA E ACOMPANHAMENTO
              </span>
              <h2>Pedidos cadastrados</h2>
              <p>
                Filtre os pedidos e abra um registro para consultar seus itens,
                endereços e histórico.
              </p>
            </div>
            <span className="pedidos__contador">
              <ClipboardList size={15} /> {totalPedidos.toLocaleString("pt-BR")}{" "}
              registros
            </span>
          </div>

          <form className="pedidos__filtros" onSubmit={aplicarFiltros}>
            <label className="pedidos__campo pedidos__campo--busca">
              <span>Buscar pelo código</span>
              <div className="pedidos__input-icone">
                <Search size={16} />
                <input
                  value={filtrosRascunho.codigo}
                  onChange={(evento) =>
                    setFiltrosRascunho({
                      ...filtrosRascunho,
                      codigo: evento.target.value,
                    })
                  }
                  placeholder="Ex.: PED-2026..."
                />
              </div>
            </label>
            <label className="pedidos__campo">
              <span>Status</span>
              <select
                value={filtrosRascunho.status}
                onChange={(evento) =>
                  setFiltrosRascunho({
                    ...filtrosRascunho,
                    status: evento.target.value,
                  })
                }
              >
                <option value="">Todos os status</option>
                {statusExistentes.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="pedidos__campo">
              <span>ID do cliente</span>
              <input
                type="number"
                min="1"
                value={filtrosRascunho.cliente_id}
                onChange={(evento) =>
                  setFiltrosRascunho({
                    ...filtrosRascunho,
                    cliente_id: evento.target.value,
                  })
                }
                placeholder="Todos"
              />
            </label>
            <label className="pedidos__campo">
              <span>Data inicial</span>
              <input
                type="date"
                value={filtrosRascunho.data_inicio}
                onChange={(evento) =>
                  setFiltrosRascunho({
                    ...filtrosRascunho,
                    data_inicio: evento.target.value,
                  })
                }
              />
            </label>
            <label className="pedidos__campo">
              <span>Data final</span>
              <input
                type="date"
                value={filtrosRascunho.data_fim}
                onChange={(evento) =>
                  setFiltrosRascunho({
                    ...filtrosRascunho,
                    data_fim: evento.target.value,
                  })
                }
              />
            </label>
            <div className="pedidos__filtros-acoes">
              <button
                type="submit"
                className="pedidos__botao pedidos__botao--primario"
              >
                <Filter size={15} /> Filtrar
              </button>
              <button
                type="button"
                className="pedidos__botao pedidos__botao--texto"
                onClick={limparFiltros}
              >
                Limpar
              </button>
            </div>
          </form>

          {carregando ? (
            <div className="pedidos__estado">
              <span className="pedidos__spinner" />
              <strong>Carregando pedidos...</strong>
              <small>Consultando os registros do painel.</small>
            </div>
          ) : erro && pedidos.length === 0 ? (
            <div className="pedidos__estado pedidos__estado--erro">
              <AlertCircle size={25} />
              <strong>Não foi possível carregar os pedidos</strong>
              <small>{erro}</small>
              <button
                type="button"
                className="pedidos__botao pedidos__botao--secundario"
                onClick={() => void carregarPedidos()}
              >
                Tentar novamente
              </button>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="pedidos__estado">
              <ShoppingBag size={28} />
              <strong>Nenhum pedido encontrado</strong>
              <small>Altere os filtros ou cadastre um novo pedido.</small>
              <button
                type="button"
                className="pedidos__botao pedidos__botao--secundario"
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="pedidos__tabela-wrap">
                <table className="pedidos__tabela">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Data</th>
                      <th>Status</th>
                      <th className="pedidos__alinha-direita">Total</th>
                      <th className="pedidos__alinha-direita">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id_pedido}>
                        <td>
                          <div className="pedidos__identificador">
                            <span className="pedidos__mini-icone">
                              <ShoppingBag size={16} />
                            </span>
                            <div>
                              <strong>
                                {pedido.codigo || `Pedido #${pedido.id_pedido}`}
                              </strong>
                              <small>
                                #{pedido.id_pedido}
                                {pedido.carrinho_id
                                  ? ` · Carrinho ${pedido.carrinho_id}`
                                  : ""}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong className="pedidos__cliente">
                            Cliente #{pedido.cliente_id ?? "—"}
                          </strong>
                        </td>
                        <td>
                          <span className="pedidos__data">
                            {formatarData(pedido.criado_em)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`pedidos__status ${statusClass(pedido.status)}`}
                          >
                            {pedido.status || "Sem status"}
                          </span>
                        </td>
                        <td className="pedidos__alinha-direita">
                          <strong className="pedidos__valor">
                            {formatarMoeda(pedido.total, pedido.moeda ?? "BRL")}
                          </strong>
                        </td>
                        <td>
                          <div className="pedidos__linha-acoes">
                            <button
                              type="button"
                              className="pedidos__acao"
                              onClick={() => void abrirDetalhes(pedido)}
                              title="Ver detalhes"
                              aria-label={`Ver detalhes do pedido ${pedido.id_pedido}`}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              className="pedidos__acao"
                              onClick={() => abrirEdicao(pedido)}
                              title="Editar dados"
                              aria-label={`Editar pedido ${pedido.id_pedido}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className="pedidos__acao pedidos__acao--status"
                              onClick={() => abrirAlteracaoStatus(pedido)}
                              title="Alterar status"
                              aria-label={`Alterar status do pedido ${pedido.id_pedido}`}
                            >
                              <ArrowUpRight size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer className="pedidos__paginacao">
                <span>
                  Mostrando {pedidos.length} de{" "}
                  {totalPedidos.toLocaleString("pt-BR")} pedidos · Página{" "}
                  {pagina} de {totalPaginas}
                </span>
                <div>
                  <button
                    type="button"
                    className="pedidos__paginacao-botao"
                    onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                    disabled={pagina <= 1 || carregando}
                  >
                    <ChevronLeft size={17} /> Anterior
                  </button>
                  <button
                    type="button"
                    className="pedidos__paginacao-botao"
                    onClick={() =>
                      setPagina((atual) => Math.min(totalPaginas, atual + 1))
                    }
                    disabled={pagina >= totalPaginas || carregando}
                  >
                    Próxima <ChevronRight size={17} />
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>

        <div className="pedidos__nota">
          <AlertCircle size={15} />
          <span>
            Os pedidos não possuem exclusão nesta tela. Alterações de status são
            registradas no histórico pelo backend.
          </span>
        </div>
      </div>

      {modalNovo && (
        <div
          className="pedidos__overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvando)
              setModalNovo(false);
          }}
        >
          <section
            className="pedidos__modal pedidos__modal--amplo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pedido-novo-titulo"
          >
            <header className="pedidos__modal-cabecalho">
              <div>
                <span className="pedidos__eyebrow">CADASTRO COMPLETO</span>
                <h2 id="pedido-novo-titulo">Cadastrar pedido</h2>
                <p>
                  O backend recebe o pedido, seus itens e endereços em uma única
                  operação.
                </p>
              </div>
              <button
                type="button"
                className="pedidos__fechar"
                onClick={() => setModalNovo(false)}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>
            <form onSubmit={salvarNovoPedido}>
              <div className="pedidos__modal-conteudo">
                <div className="pedidos__aviso-json">
                  <FileJson size={18} />
                  <div>
                    <strong>Cadastro por JSON completo</strong>
                    <span>
                      Preencha os IDs reais do cliente e do status e informe
                      pelo menos um item. O código do pedido pode ser omitido: a
                      API gera automaticamente.
                    </span>
                  </div>
                </div>
                <label className="pedidos__campo pedidos__campo--json">
                  <span>
                    Payload JSON <b>*</b>
                  </span>
                  <textarea
                    value={jsonNovo}
                    onChange={(evento) => setJsonNovo(evento.target.value)}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    rows={21}
                  />
                </label>
                <div className="pedidos__dica">
                  <strong>Campos obrigatórios pelo controller:</strong>{" "}
                  <code>status_id</code>, <code>cliente_id</code> e pelo menos
                  um objeto em <code>itens</code>. Cada item exige{" "}
                  <code>produto_id</code>, <code>nome_produto</code>,{" "}
                  <code>quantidade</code> e <code>preco_unitario</code>.
                </div>
              </div>
              {erro && (
                <div className="pedidos__erro-modal">
                  <AlertCircle size={16} />
                  {erro}
                </div>
              )}
              <footer className="pedidos__modal-rodape">
                <button
                  type="button"
                  className="pedidos__botao pedidos__botao--secundario"
                  onClick={() => setModalNovo(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pedidos__botao pedidos__botao--primario"
                  disabled={salvando}
                >
                  {salvando ? (
                    "Cadastrando..."
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Cadastrar pedido
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {modalEditar && formularioEdicao && pedidoEditando && (
        <div
          className="pedidos__overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvando)
              setModalEditar(false);
          }}
        >
          <section
            className="pedidos__modal pedidos__modal--amplo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pedido-editar-titulo"
          >
            <header className="pedidos__modal-cabecalho">
              <div>
                <span className="pedidos__eyebrow">
                  DADOS DO PEDIDO #{pedidoEditando.id_pedido}
                </span>
                <h2 id="pedido-editar-titulo">Editar pedido</h2>
                <p>
                  O status é alterado separadamente para preservar o histórico.
                </p>
              </div>
              <button
                type="button"
                className="pedidos__fechar"
                onClick={() => setModalEditar(false)}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>
            <form onSubmit={salvarEdicao}>
              <div className="pedidos__modal-conteudo">
                <div className="pedidos__grade-form">
                  <label className="pedidos__campo">
                    <span>Código do pedido</span>
                    <input
                      maxLength={40}
                      value={formularioEdicao.codigo}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          codigo: evento.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="pedidos__campo">
                    <span>
                      ID do cliente <b>*</b>
                    </span>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formularioEdicao.cliente_id}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          cliente_id: evento.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="pedidos__campo">
                    <span>ID do carrinho</span>
                    <input
                      type="number"
                      min="1"
                      value={formularioEdicao.carrinho_id}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          carrinho_id: evento.target.value,
                        })
                      }
                      placeholder="Opcional"
                    />
                  </label>
                  <label className="pedidos__campo">
                    <span>
                      Moeda <b>*</b>
                    </span>
                    <input
                      required
                      maxLength={3}
                      value={formularioEdicao.moeda}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          moeda: evento.target.value.toUpperCase(),
                        })
                      }
                    />
                  </label>
                  <label className="pedidos__campo">
                    <span>Subtotal</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formularioEdicao.subtotal}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          subtotal: evento.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="pedidos__campo">
                    <span>Desconto total</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formularioEdicao.desconto}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          desconto: evento.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="pedidos__campo">
                    <span>Frete</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formularioEdicao.frete}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          frete: evento.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="pedidos__campo">
                    <span>Total</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formularioEdicao.total}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          total: evento.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="pedidos__campo">
                    <span>Pago em</span>
                    <input
                      type="datetime-local"
                      value={formularioEdicao.pago_em}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          pago_em: evento.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="pedidos__campo">
                    <span>Cancelado em</span>
                    <input
                      type="datetime-local"
                      value={formularioEdicao.cancelado_em}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          cancelado_em: evento.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="pedidos__campo pedidos__campo--largura-total">
                    <span>Observações</span>
                    <textarea
                      rows={3}
                      value={formularioEdicao.observacoes}
                      onChange={(evento) =>
                        setFormularioEdicao({
                          ...formularioEdicao,
                          observacoes: evento.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <div className="pedidos__dica">
                  Esta operação atualiza os dados principais do pedido. Os itens
                  e endereços são mantidos; o status deve ser alterado pelo
                  botão específico.
                </div>
              </div>
              {erro && (
                <div className="pedidos__erro-modal">
                  <AlertCircle size={16} />
                  {erro}
                </div>
              )}
              <footer className="pedidos__modal-rodape">
                <button
                  type="button"
                  className="pedidos__botao pedidos__botao--secundario"
                  onClick={() => setModalEditar(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pedidos__botao pedidos__botao--primario"
                  disabled={salvando}
                >
                  {salvando ? (
                    "Salvando..."
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Salvar alterações
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {modalStatus && pedidoStatus && (
        <div
          className="pedidos__overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvando)
              setModalStatus(false);
          }}
        >
          <section
            className="pedidos__modal pedidos__modal--medio"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pedido-status-titulo"
          >
            <header className="pedidos__modal-cabecalho">
              <div>
                <span className="pedidos__eyebrow">
                  ATUALIZAÇÃO DE ANDAMENTO
                </span>
                <h2 id="pedido-status-titulo">Alterar status do pedido</h2>
                <p>
                  {pedidoStatus.codigo ?? `Pedido #${pedidoStatus.id_pedido}`}
                </p>
              </div>
              <button
                type="button"
                className="pedidos__fechar"
                onClick={() => setModalStatus(false)}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>
            <form onSubmit={salvarStatus}>
              <div className="pedidos__modal-conteudo">
                <label className="pedidos__campo">
                  <span>
                    Status <b>*</b>
                  </span>
                  <input
                    required
                    list="pedidos-status-existentes"
                    maxLength={40}
                    value={statusNovo}
                    onChange={(evento) => setStatusNovo(evento.target.value)}
                    placeholder="Informe o novo status"
                  />
                  <datalist id="pedidos-status-existentes">
                    {statusExistentes.map((status) => (
                      <option key={status} value={status} />
                    ))}
                  </datalist>
                  <small>
                    O backend aceita texto de até 40 caracteres. As sugestões
                    vêm dos pedidos já cadastrados.
                  </small>
                </label>
                <label className="pedidos__campo">
                  <span>Status ID</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={statusIdNovo}
                    onChange={(evento) => setStatusIdNovo(evento.target.value)}
                    placeholder="Opcional"
                  />
                  <small>
                    Informe um ID de status existente no banco. A API não
                    disponibiliza catálogo de status nesta configuração de
                    rotas.
                  </small>
                </label>
                <label className="pedidos__campo">
                  <span>Observação do histórico</span>
                  <textarea
                    rows={3}
                    value={observacaoStatus}
                    onChange={(evento) =>
                      setObservacaoStatus(evento.target.value)
                    }
                    placeholder="Motivo ou detalhe da alteração (opcional)"
                  />
                </label>
              </div>
              {erro && (
                <div className="pedidos__erro-modal">
                  <AlertCircle size={16} />
                  {erro}
                </div>
              )}
              <footer className="pedidos__modal-rodape">
                <button
                  type="button"
                  className="pedidos__botao pedidos__botao--secundario"
                  onClick={() => setModalStatus(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pedidos__botao pedidos__botao--primario"
                  disabled={salvando}
                >
                  {salvando ? (
                    "Atualizando..."
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Atualizar status
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {modalDetalhe && (
        <div
          className="pedidos__overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setModalDetalhe(false);
          }}
        >
          <section
            className="pedidos__modal pedidos__modal--amplo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pedido-detalhe-titulo"
          >
            <header className="pedidos__modal-cabecalho">
              <div>
                <span className="pedidos__eyebrow">VISUALIZAÇÃO COMPLETA</span>
                <h2 id="pedido-detalhe-titulo">Detalhes do pedido</h2>
                <p>Informações, itens, endereços e histórico de status.</p>
              </div>
              <button
                type="button"
                className="pedidos__fechar"
                onClick={() => setModalDetalhe(false)}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>
            <div className="pedidos__modal-conteudo">
              {carregandoDetalhe ? (
                <div className="pedidos__estado pedidos__estado--compacto">
                  <span className="pedidos__spinner" />
                  <strong>Carregando detalhes...</strong>
                </div>
              ) : pedidoDetalhe?.pedido ? (
                <>
                  <div className="pedidos__detalhe-topo">
                    <div>
                      <span>Pedido</span>
                      <strong>
                        {pedidoDetalhe.pedido.codigo ||
                          `#${pedidoDetalhe.pedido.id_pedido}`}
                      </strong>
                      <small>Registro #{pedidoDetalhe.pedido.id_pedido}</small>
                    </div>
                    <span
                      className={`pedidos__status ${statusClass(pedidoDetalhe.pedido.status)}`}
                    >
                      {pedidoDetalhe.pedido.status || "Sem status"}
                    </span>
                  </div>
                  <div className="pedidos__resumo-grade">
                    <div>
                      <small>Cliente</small>
                      <strong>#{pedidoDetalhe.pedido.cliente_id ?? "—"}</strong>
                    </div>
                    <div>
                      <small>Carrinho</small>
                      <strong>{pedidoDetalhe.pedido.carrinho_id ?? "—"}</strong>
                    </div>
                    <div>
                      <small>Pedido em</small>
                      <strong>
                        {formatarData(pedidoDetalhe.pedido.criado_em)}
                      </strong>
                    </div>
                    <div>
                      <small>Total</small>
                      <strong>
                        {formatarMoeda(
                          pedidoDetalhe.pedido.total,
                          pedidoDetalhe.pedido.moeda ?? "BRL",
                        )}
                      </strong>
                    </div>
                    <div>
                      <small>Subtotal</small>
                      <strong>
                        {formatarMoeda(
                          pedidoDetalhe.pedido.subtotal,
                          pedidoDetalhe.pedido.moeda ?? "BRL",
                        )}
                      </strong>
                    </div>
                    <div>
                      <small>Desconto</small>
                      <strong>
                        {formatarMoeda(
                          pedidoDetalhe.pedido.desconto,
                          pedidoDetalhe.pedido.moeda ?? "BRL",
                        )}
                      </strong>
                    </div>
                    <div>
                      <small>Frete</small>
                      <strong>
                        {formatarMoeda(
                          pedidoDetalhe.pedido.frete,
                          pedidoDetalhe.pedido.moeda ?? "BRL",
                        )}
                      </strong>
                    </div>
                    <div>
                      <small>Pago em</small>
                      <strong>
                        {formatarData(pedidoDetalhe.pedido.pago_em)}
                      </strong>
                    </div>
                  </div>
                  <section className="pedidos__detalhe-secao">
                    <h3>
                      <Package size={17} /> Itens (
                      {pedidoDetalhe.itens?.length ?? 0})
                    </h3>
                    {pedidoDetalhe.itens?.length ? (
                      <div className="pedidos__itens-lista">
                        {pedidoDetalhe.itens.map((item, indice) => (
                          <article
                            key={
                              item.id_pedido_item ??
                              `${item.produto_id}-${indice}`
                            }
                          >
                            <div>
                              <strong>
                                {item.nome_produto ||
                                  `Produto #${item.produto_id ?? "—"}`}
                              </strong>
                              <small>
                                {item.sku ? `${item.sku} · ` : ""}Produto #
                                {item.produto_id ?? "—"}
                                {item.variacao_id
                                  ? ` · Variação #${item.variacao_id}`
                                  : ""}
                              </small>
                            </div>
                            <div className="pedidos__item-numeros">
                              <span>
                                {numero(item.quantidade).toLocaleString(
                                  "pt-BR",
                                  { maximumFractionDigits: 3 },
                                )}{" "}
                                ×{" "}
                                {formatarMoeda(
                                  item.preco_unitario,
                                  pedidoDetalhe.pedido?.moeda ?? "BRL",
                                )}
                              </span>
                              <strong>
                                {formatarMoeda(
                                  item.total,
                                  pedidoDetalhe.pedido?.moeda ?? "BRL",
                                )}
                              </strong>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="pedidos__sem-dados">
                        Este pedido não possui itens retornados pela API.
                      </p>
                    )}
                  </section>
                  <section className="pedidos__detalhe-secao">
                    <h3>
                      <Truck size={17} /> Endereços (
                      {pedidoDetalhe.enderecos?.length ?? 0})
                    </h3>
                    {pedidoDetalhe.enderecos?.length ? (
                      <div className="pedidos__enderecos-lista">
                        {pedidoDetalhe.enderecos.map((endereco, indice) => (
                          <article key={`${endereco.tipo}-${indice}`}>
                            <span className="pedidos__endereco-tipo">
                              {endereco.tipo || "Endereço"}
                            </span>
                            <strong>
                              {endereco.destinatario ||
                                "Destinatário não informado"}
                            </strong>
                            <p>
                              {[
                                endereco.logradouro,
                                endereco.numero,
                                endereco.complemento,
                                endereco.bairro,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                            <small>
                              {[
                                endereco.cidade,
                                endereco.estado,
                                endereco.cep,
                                endereco.pais,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </small>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="pedidos__sem-dados">
                        Nenhum endereço vinculado.
                      </p>
                    )}
                  </section>
                  <section className="pedidos__detalhe-secao">
                    <h3>
                      <Clock3 size={17} /> Histórico (
                      {pedidoDetalhe.historico?.length ?? 0})
                    </h3>
                    {pedidoDetalhe.historico?.length ? (
                      <div className="pedidos__historico">
                        {pedidoDetalhe.historico.map((registro, indice) => (
                          <article key={`${registro.criado_em}-${indice}`}>
                            <span className="pedidos__historico-ponto" />
                            <div>
                              <strong>
                                {registro.status_anterior || "Início"}{" "}
                                <ArrowUpRight size={13} />{" "}
                                {registro.status_novo || "—"}
                              </strong>
                              <p>{registro.observacao || "Sem observação"}</p>
                              <small>
                                {formatarData(registro.criado_em)}
                                {registro.usuario_id
                                  ? ` · Usuário #${registro.usuario_id}`
                                  : ""}
                              </small>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="pedidos__sem-dados">
                        Nenhuma alteração de status registrada.
                      </p>
                    )}
                  </section>
                  {pedidoDetalhe.pedido.observacoes && (
                    <section className="pedidos__detalhe-secao">
                      <h3>Observações</h3>
                      <p className="pedidos__observacoes">
                        {pedidoDetalhe.pedido.observacoes}
                      </p>
                    </section>
                  )}
                </>
              ) : (
                <div className="pedidos__estado pedidos__estado--erro">
                  <AlertCircle size={25} />
                  <strong>Não foi possível exibir os detalhes</strong>
                  <small>
                    Verifique a permissão pedidos.visualizar e tente novamente.
                  </small>
                </div>
              )}
            </div>
            <footer className="pedidos__modal-rodape">
              <button
                type="button"
                className="pedidos__botao pedidos__botao--secundario"
                onClick={() => setModalDetalhe(false)}
              >
                Fechar
              </button>
            </footer>
          </section>
        </div>
      )}

      <style jsx>{`
        .pedidos {
          min-height: 100vh;
          padding: 28px 24px 56px;
          background: var(--ui-fundo, #f8f4f4);
          color: var(--ui-texto, #49363b);
        }
        .pedidos__container {
          width: min(1420px, 100%);
          margin: 0 auto;
        }
        .pedidos__cabecalho {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 26px;
        }
        .pedidos__voltar {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--ui-texto-secundario, #846d74);
          text-decoration: none;
          font-size: 12px;
          margin-bottom: 18px;
        }
        .pedidos__voltar:hover {
          color: var(--ui-vinho, #783d50);
        }
        .pedidos__eyebrow,
        .pedidos__secao-eyebrow {
          display: block;
          color: var(--ui-rosa-medio, #b96c7d);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.15em;
          margin-bottom: 8px;
        }
        .pedidos h1 {
          margin: 0;
          color: var(--ui-vinho-escuro, #542b39);
          font-family: var(--ui-fonte-titulo, inherit);
          font-size: clamp(27px, 3vw, 35px);
          line-height: 1.15;
          letter-spacing: -0.035em;
        }
        .pedidos__cabecalho p,
        .pedidos__painel-topo p {
          margin: 9px 0 0;
          color: var(--ui-texto-secundario, #8a747b);
          font-size: 13px;
          line-height: 1.6;
        }
        .pedidos__acoes-cabecalho {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .pedidos__botao {
          min-height: 42px;
          border: 1px solid transparent;
          border-radius: 11px;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font: 700 12px var(--ui-fonte-base, Arial, sans-serif);
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            background 0.16s ease;
        }
        .pedidos__botao:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .pedidos__botao:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .pedidos__botao--primario {
          color: #fff;
          background: var(--ui-vinho, #783d50);
          box-shadow: 0 5px 14px rgba(105, 48, 67, 0.13);
        }
        .pedidos__botao--primario:hover:not(:disabled) {
          background: var(--ui-vinho-escuro, #602f40);
        }
        .pedidos__botao--secundario {
          color: var(--ui-vinho, #783d50);
          background: var(--ui-branco, #fff);
          border-color: var(--ui-borda, #ead6da);
        }
        .pedidos__botao--texto {
          color: var(--ui-texto-secundario, #846d74);
          background: transparent;
          border-color: transparent;
        }
        .pedidos__alerta {
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 18px;
          font-size: 12px;
        }
        .pedidos__alerta button {
          border: 0;
          background: transparent;
          color: inherit;
          margin-left: auto;
          cursor: pointer;
        }
        .pedidos__alerta--sucesso {
          color: #326b52;
          background: #eaf5ef;
          border: 1px solid #cfe6d8;
        }
        .pedidos__alerta--erro {
          color: #9a3948;
          background: #fff0f1;
          border: 1px solid #f2d0d5;
        }
        .pedidos__indicadores {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .pedidos__indicador {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 19px;
          background: var(--ui-superficie, #fff);
          border: 1px solid var(--ui-borda-suave, #f0e4e6);
          border-radius: 16px;
          box-shadow: var(--ui-sombra-card, 0 5px 18px rgba(70, 35, 45, 0.035));
        }
        .pedidos__indicador-icone {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          border-radius: 14px;
          color: var(--ui-vinho, #783d50);
          background: var(--ui-vinho-suave, #f7ebef);
        }
        .pedidos__indicador-icone--rosa {
          color: #a85c70;
          background: #fff0f3;
        }
        .pedidos__indicador-icone--areia {
          color: #98723c;
          background: #fbf4e8;
        }
        .pedidos__indicador small,
        .pedidos__indicador span:not(.pedidos__indicador-icone) {
          display: block;
          color: var(--ui-texto-secundario, #8a747b);
          font-size: 11px;
        }
        .pedidos__indicador strong {
          display: block;
          color: var(--ui-vinho-escuro, #542b39);
          font-size: 22px;
          margin: 3px 0;
          letter-spacing: -0.03em;
        }
        .pedidos__painel {
          background: var(--ui-superficie, #fff);
          border: 1px solid var(--ui-borda-suave, #f0e4e6);
          border-radius: 17px;
          box-shadow: var(--ui-sombra-card, 0 5px 18px rgba(70, 35, 45, 0.035));
          overflow: hidden;
        }
        .pedidos__painel-topo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 23px 24px 18px;
        }
        .pedidos__painel-topo h2 {
          margin: 0;
          font-size: 18px;
          color: var(--ui-vinho-escuro, #542b39);
          letter-spacing: -0.02em;
        }
        .pedidos__painel-topo p {
          font-size: 12px;
        }
        .pedidos__contador {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--ui-texto-secundario, #8a747b);
          background: var(--ui-superficie-suave, #fbf8f8);
          border: 1px solid var(--ui-borda-suave, #f0e4e6);
          padding: 8px 11px;
          border-radius: 20px;
          font-size: 11px;
        }
        .pedidos__filtros {
          display: grid;
          grid-template-columns:
            minmax(180px, 1.5fr) minmax(150px, 1fr) minmax(110px, 0.75fr)
            minmax(135px, 0.9fr) minmax(135px, 0.9fr) auto;
          gap: 11px;
          align-items: end;
          padding: 16px 24px 20px;
          background: var(--ui-superficie-suave, #fcf9f9);
          border-top: 1px solid var(--ui-borda-suave, #f0e4e6);
          border-bottom: 1px solid var(--ui-borda-suave, #f0e4e6);
        }
        .pedidos__campo {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 7px;
        }
        .pedidos__campo > span {
          color: var(--ui-texto, #513a40);
          font-size: 11px;
          font-weight: 750;
        }
        .pedidos__campo b {
          color: #b34860;
        }
        .pedidos__campo input,
        .pedidos__campo select,
        .pedidos__campo textarea {
          width: 100%;
          min-width: 0;
          border: 1px solid var(--ui-borda, #e9d2d8);
          border-radius: 9px;
          min-height: 40px;
          padding: 9px 11px;
          color: var(--ui-texto, #513a40);
          background: #fff;
          outline: 0;
          font: 12px var(--ui-fonte-base, inherit);
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }
        .pedidos__campo textarea {
          min-height: 100px;
          resize: vertical;
          line-height: 1.5;
        }
        .pedidos__campo input:focus,
        .pedidos__campo select:focus,
        .pedidos__campo textarea:focus {
          border-color: var(--ui-vinho, #783d50);
          box-shadow: 0 0 0 3px rgba(120, 61, 80, 0.1);
        }
        .pedidos__campo input::placeholder,
        .pedidos__campo textarea::placeholder {
          color: #b29da3;
        }
        .pedidos__campo small {
          color: #9b858c;
          font-size: 10px;
          line-height: 1.45;
        }
        .pedidos__input-icone {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--ui-borda, #e9d2d8);
          border-radius: 9px;
          padding-left: 10px;
          background: #fff;
          color: #a28a91;
        }
        .pedidos__input-icone input {
          border: 0;
          box-shadow: none !important;
        }
        .pedidos__filtros-acoes {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .pedidos__filtros-acoes .pedidos__botao {
          min-height: 40px;
          padding: 0 12px;
        }
        .pedidos__tabela-wrap {
          overflow-x: auto;
        }
        .pedidos__tabela {
          width: 100%;
          border-collapse: collapse;
          min-width: 820px;
        }
        .pedidos__tabela th {
          padding: 13px 17px;
          color: #9a848a;
          text-align: left;
          white-space: nowrap;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          background: #fffdfd;
          border-bottom: 1px solid var(--ui-borda-suave, #f0e4e6);
        }
        .pedidos__tabela td {
          padding: 14px 17px;
          border-bottom: 1px solid #f4ecee;
          vertical-align: middle;
          font-size: 12px;
        }
        .pedidos__tabela tbody tr:last-child td {
          border-bottom: 0;
        }
        .pedidos__tabela tbody tr:hover {
          background: #fffafb;
        }
        .pedidos__identificador {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .pedidos__mini-icone {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          flex: 0 0 35px;
          border-radius: 11px;
          color: var(--ui-vinho, #783d50);
          background: #f8edf0;
        }
        .pedidos__identificador strong {
          display: block;
          color: #54343f;
          font-size: 12px;
        }
        .pedidos__identificador small {
          display: block;
          margin-top: 4px;
          color: #a28e94;
          font-size: 10px;
        }
        .pedidos__cliente {
          color: #614d54;
          font-size: 11px;
        }
        .pedidos__data {
          color: #806c73;
          font-size: 11px;
          white-space: nowrap;
        }
        .pedidos__status {
          display: inline-flex;
          align-items: center;
          border-radius: 30px;
          padding: 6px 10px;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          font-weight: 800;
        }
        .pedidos__status--sucesso {
          color: #347452;
          background: #eaf6ef;
        }
        .pedidos__status--erro {
          color: #a94351;
          background: #fff0f1;
        }
        .pedidos__status--info {
          color: #426b91;
          background: #edf5fc;
        }
        .pedidos__status--pendente {
          color: #956d36;
          background: #fbf3e6;
        }
        .pedidos__valor {
          color: var(--ui-vinho-escuro, #542b39);
          white-space: nowrap;
          font-size: 12px;
        }
        .pedidos__alinha-direita {
          text-align: right !important;
        }
        .pedidos__linha-acoes {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }
        .pedidos__acao {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          border: 1px solid #eddde1;
          border-radius: 9px;
          color: #79505e;
          background: #fff;
          cursor: pointer;
        }
        .pedidos__acao:hover {
          color: #fff;
          border-color: var(--ui-vinho, #783d50);
          background: var(--ui-vinho, #783d50);
        }
        .pedidos__acao--status {
          color: #9a6c37;
        }
        .pedidos__paginacao {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 15px 22px;
          border-top: 1px solid var(--ui-borda-suave, #f0e4e6);
          color: #9b858c;
          font-size: 11px;
        }
        .pedidos__paginacao > div {
          display: flex;
          gap: 8px;
        }
        .pedidos__paginacao-botao {
          display: inline-flex;
          gap: 5px;
          align-items: center;
          border: 1px solid #ead8dd;
          border-radius: 9px;
          background: #fff;
          color: #78515d;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 11px;
        }
        .pedidos__paginacao-botao:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pedidos__estado {
          min-height: 245px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 9px;
          padding: 30px;
          color: #a38e94;
          text-align: center;
        }
        .pedidos__estado strong {
          color: #684b55;
          font-size: 13px;
        }
        .pedidos__estado small {
          max-width: 430px;
          color: #9b858c;
          font-size: 11px;
          line-height: 1.5;
        }
        .pedidos__estado--erro {
          color: #b14c5a;
        }
        .pedidos__estado--compacto {
          min-height: 150px;
        }
        .pedidos__spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #f1dfe4;
          border-top-color: var(--ui-vinho, #783d50);
          border-radius: 50%;
          animation: pedidos-spin 0.8s linear infinite;
        }
        .pedidos__girando {
          animation: pedidos-spin 0.8s linear infinite;
        }
        @keyframes pedidos-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .pedidos__nota {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          padding: 10px 3px;
          color: #9b858c;
          font-size: 10px;
        }
        .pedidos__overlay {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(36, 24, 29, 0.48);
          backdrop-filter: blur(5px);
          overflow-y: auto;
        }
        .pedidos__modal {
          width: min(600px, 100%);
          max-height: min(92vh, 960px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #fff;
          border: 1px solid #efdde2;
          border-radius: 19px;
          box-shadow: 0 24px 80px rgba(49, 23, 33, 0.2);
        }
        .pedidos__modal--amplo {
          width: min(860px, 100%);
        }
        .pedidos__modal--medio {
          width: min(530px, 100%);
        }
        .pedidos__modal-cabecalho {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 23px 26px 18px;
          border-bottom: 1px solid #f2e6e9;
        }
        .pedidos__modal-cabecalho h2 {
          margin: 0;
          color: #603341;
          font-size: 21px;
          letter-spacing: -0.03em;
        }
        .pedidos__modal-cabecalho p {
          margin: 7px 0 0;
          color: #98838a;
          font-size: 11px;
          line-height: 1.5;
        }
        .pedidos__fechar {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border: 1px solid #f0e0e4;
          border-radius: 10px;
          color: #805c68;
          background: #fff;
          cursor: pointer;
        }
        .pedidos__modal-conteudo {
          overflow-y: auto;
          padding: 22px 26px;
          display: flex;
          flex-direction: column;
          gap: 17px;
        }
        .pedidos__modal-rodape {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 15px 26px 20px;
          border-top: 1px solid #f2e6e9;
        }
        .pedidos__campo--json textarea {
          min-height: 380px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 11px;
          tab-size: 2;
        }
        .pedidos__aviso-json {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 13px;
          border: 1px solid #efdde2;
          border-radius: 12px;
          color: var(--ui-vinho, #783d50);
          background: #fff9fa;
        }
        .pedidos__aviso-json strong,
        .pedidos__aviso-json span {
          display: block;
        }
        .pedidos__aviso-json strong {
          margin-bottom: 4px;
          font-size: 12px;
        }
        .pedidos__aviso-json span {
          color: #927d84;
          font-size: 10px;
          line-height: 1.55;
        }
        .pedidos__dica {
          padding: 11px 13px;
          border-radius: 10px;
          background: #faf6f7;
          color: #8e777f;
          font-size: 10px;
          line-height: 1.65;
        }
        .pedidos__dica code {
          color: #743b4e;
          font-size: 10px;
        }
        .pedidos__erro-modal {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 0 26px 12px;
          padding: 10px 12px;
          color: #9f3f4c;
          background: #fff1f2;
          border-radius: 9px;
          font-size: 11px;
        }
        .pedidos__grade-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }
        .pedidos__campo--largura-total {
          grid-column: 1 / -1;
        }
        .pedidos__detalhe-topo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 15px;
          border: 1px solid #f0e4e7;
          border-radius: 13px;
          background: #fffafb;
        }
        .pedidos__detalhe-topo span:not(.pedidos__status),
        .pedidos__detalhe-topo small {
          display: block;
          color: #9c858d;
          font-size: 10px;
        }
        .pedidos__detalhe-topo strong {
          display: block;
          margin: 4px 0;
          color: #5b3542;
          font-size: 17px;
        }
        .pedidos__resumo-grade {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
        }
        .pedidos__resumo-grade > div {
          padding: 12px;
          border: 1px solid #f1e7e9;
          border-radius: 10px;
        }
        .pedidos__resumo-grade small,
        .pedidos__resumo-grade strong {
          display: block;
        }
        .pedidos__resumo-grade small {
          color: #a18b92;
          font-size: 10px;
        }
        .pedidos__resumo-grade strong {
          margin-top: 5px;
          color: #60404b;
          font-size: 12px;
          overflow-wrap: anywhere;
        }
        .pedidos__detalhe-secao {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .pedidos__detalhe-secao h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 5px 0 0;
          color: #694552;
          font-size: 13px;
        }
        .pedidos__itens-lista,
        .pedidos__enderecos-lista {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pedidos__itens-lista article {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 12px 13px;
          border: 1px solid #f0e6e8;
          border-radius: 10px;
        }
        .pedidos__itens-lista strong,
        .pedidos__itens-lista small {
          display: block;
        }
        .pedidos__itens-lista strong {
          color: #62424e;
          font-size: 11px;
        }
        .pedidos__itens-lista small {
          margin-top: 4px;
          color: #9f8990;
          font-size: 10px;
        }
        .pedidos__item-numeros {
          display: flex;
          align-items: flex-end;
          flex-direction: column;
          gap: 4px;
          white-space: nowrap;
        }
        .pedidos__item-numeros span {
          color: #9b858c;
          font-size: 10px;
        }
        .pedidos__item-numeros strong {
          color: #63394a;
          font-size: 12px;
        }
        .pedidos__enderecos-lista {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .pedidos__enderecos-lista article {
          padding: 13px;
          border: 1px solid #f0e6e8;
          border-radius: 10px;
        }
        .pedidos__endereco-tipo {
          display: inline-flex;
          margin-bottom: 8px;
          padding: 4px 8px;
          border-radius: 20px;
          color: #85556a;
          background: #f8edf1;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .pedidos__enderecos-lista strong {
          display: block;
          color: #62424e;
          font-size: 11px;
        }
        .pedidos__enderecos-lista p {
          margin: 5px 0;
          color: #7c6970;
          font-size: 10px;
          line-height: 1.5;
        }
        .pedidos__enderecos-lista small {
          color: #9b858c;
          font-size: 10px;
        }
        .pedidos__historico {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pedidos__historico article {
          display: flex;
          gap: 11px;
          align-items: flex-start;
        }
        .pedidos__historico-ponto {
          width: 9px;
          height: 9px;
          flex: 0 0 9px;
          margin-top: 4px;
          border-radius: 50%;
          background: #a95e74;
          box-shadow: 0 0 0 4px #f8edf1;
        }
        .pedidos__historico strong {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #62424e;
          font-size: 11px;
        }
        .pedidos__historico p {
          margin: 4px 0;
          color: #8f7a81;
          font-size: 10px;
        }
        .pedidos__historico small,
        .pedidos__sem-dados {
          color: #a08b92;
          font-size: 10px;
        }
        .pedidos__observacoes {
          margin: 0;
          padding: 12px;
          border-radius: 9px;
          background: #faf6f7;
          color: #78636b;
          font-size: 11px;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        @media (max-width: 1100px) {
          .pedidos__filtros {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .pedidos__filtros-acoes {
            grid-column: 1 / -1;
            justify-content: flex-end;
          }
        }
        @media (max-width: 760px) {
          .pedidos {
            padding: 20px 13px 40px;
          }
          .pedidos__cabecalho {
            align-items: flex-start;
            flex-direction: column;
          }
          .pedidos__acoes-cabecalho {
            width: 100%;
          }
          .pedidos__acoes-cabecalho .pedidos__botao {
            flex: 1;
          }
          .pedidos__indicadores {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .pedidos__indicador {
            padding: 15px;
          }
          .pedidos__painel-topo {
            align-items: flex-start;
            flex-direction: column;
            padding: 19px 17px 15px;
          }
          .pedidos__filtros {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 15px 17px;
          }
          .pedidos__campo--busca {
            grid-column: 1 / -1;
          }
          .pedidos__paginacao {
            align-items: flex-start;
            flex-direction: column;
            padding: 14px 17px;
          }
          .pedidos__overlay {
            align-items: flex-start;
            padding: 12px;
          }
          .pedidos__modal {
            max-height: calc(100vh - 24px);
            border-radius: 15px;
          }
          .pedidos__modal-cabecalho,
          .pedidos__modal-conteudo {
            padding-left: 17px;
            padding-right: 17px;
          }
          .pedidos__modal-rodape {
            padding-left: 17px;
            padding-right: 17px;
          }
          .pedidos__grade-form {
            grid-template-columns: 1fr;
          }
          .pedidos__campo--largura-total {
            grid-column: auto;
          }
          .pedidos__resumo-grade {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .pedidos__enderecos-lista {
            grid-template-columns: 1fr;
          }
          .pedidos__campo--json textarea {
            min-height: 330px;
          }
        }
        @media (max-width: 420px) {
          .pedidos__filtros {
            grid-template-columns: 1fr;
          }
          .pedidos__campo--busca {
            grid-column: auto;
          }
          .pedidos__filtros-acoes {
            grid-column: auto;
            justify-content: flex-start;
          }
          .pedidos__filtros-acoes .pedidos__botao {
            flex: 1;
          }
          .pedidos__modal-rodape {
            flex-wrap: wrap;
          }
          .pedidos__modal-rodape .pedidos__botao {
            flex: 1;
          }
          .pedidos__itens-lista article {
            align-items: flex-start;
            flex-direction: column;
          }
          .pedidos__item-numeros {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
