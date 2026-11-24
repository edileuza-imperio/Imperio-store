"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Info,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Save,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type FormularioEntrega = {
  pedido_id: string;
  status_id: string;
  status: string;
  transportadora: string;
  servico: string;
  codigo_rastreio: string;
  custo: string;
  enviada_em: string;
  entregue_em: string;
};

type PedidoOpcao = {
  id: number;
  codigo: string;
  clienteId: number | null;
  status: string;
  total: number | null;
  criadoEm: string;
};

type StatusOpcao = {
  id: number;
  grupo: string;
  codigo: string;
  nome: string;
  descricao: string;
  ativo: boolean;
};

type Registro = Record<string, unknown>;

const FORMULARIO_INICIAL: FormularioEntrega = {
  pedido_id: "",
  status_id: "",
  status: "",
  transportadora: "",
  servico: "",
  codigo_rastreio: "",
  custo: "0,00",
  enviada_em: "",
  entregue_em: "",
};

const LIMITE_PEDIDOS = 50;

function ehRegistro(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/**
 * Converte uma resposta JSON em texto para objeto.
 * Também tolera um sufixo inválido após o JSON (ex.: `...}}null`),
 * extraindo somente o primeiro objeto/array completo.
 */
function interpretarJson(valor: unknown): unknown {
  if (typeof valor !== "string") return valor;

  const texto = valor.trim();
  if (!texto) return valor;

  try {
    return JSON.parse(texto) as unknown;
  } catch {
    // Algumas respostas/interceptors podem acrescentar conteúdo depois do JSON.
  }

  const inicio = texto.search(/[\[{]/);
  if (inicio < 0) return valor;

  let profundidade = 0;
  let dentroDeString = false;
  let escape = false;

  for (let indice = inicio; indice < texto.length; indice += 1) {
    const caractere = texto[indice];

    if (dentroDeString) {
      if (escape) {
        escape = false;
      } else if (caractere === "\\") {
        escape = true;
      } else if (caractere === '\"') {
        dentroDeString = false;
      }
      continue;
    }

    if (caractere === '\"') {
      dentroDeString = true;
      continue;
    }

    if (caractere === "{" || caractere === "[") {
      profundidade += 1;
    } else if (caractere === "}" || caractere === "]") {
      profundidade -= 1;
      if (profundidade === 0) {
        try {
          return JSON.parse(texto.slice(inicio, indice + 1)) as unknown;
        } catch {
          return valor;
        }
      }
    }
  }

  return valor;
}

/**
 * Aceita tanto a resposta Axios padrão ({ data: ... }) quanto instâncias
 * com interceptor, além de respostas JSON entregues como string.
 */
function obterCorpoResposta(resposta: unknown): unknown {
  const corpo =
    ehRegistro(resposta) && "data" in resposta ? resposta.data : resposta;

  return interpretarJson(corpo);
}

/**
 * A API pode devolver os pedidos em envelopes aninhados, por exemplo:
 * { status, mensagem, dados: { sucesso, dados: { pedidos: [...] } } }.
 * Procura a coleção em qualquer nível sem depender de um único formato.
 */
function extrairColecao(
  origem: unknown,
  chaves: string[],
  profundidade = 0,
): unknown[] {
  origem = interpretarJson(origem);
  if (Array.isArray(origem)) return origem;
  if (!ehRegistro(origem) || profundidade > 8) return [];

  for (const chave of chaves) {
    if (Array.isArray(origem[chave])) return origem[chave] as unknown[];
  }

  for (const valor of Object.values(origem)) {
    if (valor && typeof valor === "object") {
      const resultado = extrairColecao(valor, chaves, profundidade + 1);
      if (resultado.length > 0) return resultado;
    }
  }

  return [];
}

function extrairPaginacao(origem: unknown, profundidade = 0): Registro | null {
  origem = interpretarJson(origem);
  if (!ehRegistro(origem) || profundidade > 8) return null;
  if (ehRegistro(origem.paginacao)) return origem.paginacao;

  for (const valor of Object.values(origem)) {
    if (valor && typeof valor === "object") {
      const resultado = extrairPaginacao(valor, profundidade + 1);
      if (resultado) return resultado;
    }
  }

  return null;
}

function normalizarPedido(item: unknown): PedidoOpcao | null {
  if (!ehRegistro(item)) return null;

  const id = Number(item.id_pedido ?? item.pedido_id ?? item.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const totalBruto = item.total;
  const total =
    totalBruto === null || totalBruto === undefined || totalBruto === ""
      ? null
      : Number(String(totalBruto).replace(",", "."));

  return {
    id,
    codigo: String(item.codigo ?? item.numero_pedido ?? "").trim(),
    clienteId:
      item.cliente_id === null || item.cliente_id === undefined
        ? null
        : Number(item.cliente_id),
    status: String(item.status ?? "Não informado").trim(),
    total: total !== null && Number.isFinite(total) ? total : null,
    criadoEm: String(item.criado_em ?? ""),
  };
}

function normalizarStatus(item: unknown): StatusOpcao | null {
  if (!ehRegistro(item)) return null;

  const id = Number(item.id_status ?? item.status_id ?? item.id);
  const codigo = String(item.codigo ?? item.status ?? "").trim();
  const grupo = String(item.grupo ?? "").trim();

  if (!Number.isInteger(id) || id <= 0 || !codigo || !grupo) return null;

  const ativoBruto = item.ativo;
  const ativo = !(
    ativoBruto === false ||
    ativoBruto === 0 ||
    ativoBruto === "0" ||
    String(ativoBruto).toLowerCase() === "false"
  );

  return {
    id,
    grupo,
    codigo,
    nome: String(item.nome ?? item.descricao ?? codigo).trim(),
    descricao: String(item.descricao ?? "").trim(),
    ativo,
  };
}

function codigoStatusParaApi(codigo: string): string {
  return codigo.trim().toLocaleLowerCase("pt-BR");
}

function dataParaApi(valor: string): string | null {
  if (!valor.trim()) return null;
  return valor.length === 16
    ? `${valor.replace("T", " ")}:00`
    : valor.replace("T", " ");
}

function decimalParaApi(valor: string): string {
  const bruto = valor.trim();
  const normalizado = bruto.includes(",")
    ? bruto.replace(/\./g, "").replace(",", ".")
    : bruto;
  const numero = Number(normalizado || "0");

  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error("Informe um custo válido e não negativo.");
  }

  return numero.toFixed(2);
}

function extrairMensagem(dados: unknown, fallback: string): string {
  if (ehRegistro(dados)) {
    for (const chave of ["mensagem", "message", "erro"]) {
      const valor = dados[chave];
      if (typeof valor === "string" && valor.trim()) return valor;
    }

    for (const chave of ["dados", "data", "resultado", "result"]) {
      if (dados[chave]) return extrairMensagem(dados[chave], fallback);
    }
  }

  return fallback;
}

function formatarMoeda(valor: number | null): string {
  if (valor === null) return "Valor não informado";

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor: string): string {
  if (!valor) return "Data não informada";
  const data = new Date(valor.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return valor;

  return data.toLocaleDateString("pt-BR");
}

export default function CadastrarEntregaPage() {
  const router = useRouter();

  const [formulario, setFormulario] =
    useState<FormularioEntrega>(FORMULARIO_INICIAL);
  const [pedidos, setPedidos] = useState<PedidoOpcao[]>([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusOpcao[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroPedidos, setErroPedidos] = useState("");
  const [erroStatus, setErroStatus] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [versaoCarga, setVersaoCarga] = useState(0);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarPedidos(): Promise<PedidoOpcao[]> {
      // A rota /painel/pedidos já retorna a primeira página por padrão.
      // Não enviamos pagina/limite na primeira consulta porque o endpoint
      // atual pode interpretar esses parâmetros de forma diferente.
      const primeiraResposta = await conexao.get(ROTAS.PEDIDOS.PAINEL.LISTAR);
      const corpoPrimeiraResposta = obterCorpoResposta(primeiraResposta);

      const pedidosIniciais = extrairColecao(corpoPrimeiraResposta, [
        "pedidos",
        "itens",
        "registros",
      ])
        .map(normalizarPedido)
        .filter((pedido): pedido is PedidoOpcao => pedido !== null);

      // Diagnóstico depois da declaração: evita uso antes da inicialização.
      console.info(
        "[ENTREGAS] Quantidade de pedidos reconhecidos:",
        pedidosIniciais.length,
      );

      const paginacao = extrairPaginacao(corpoPrimeiraResposta);
      const totalPaginas = Math.max(
        1,
        Math.min(
          100,
          Number(paginacao?.total_paginas ?? paginacao?.totalPaginas ?? 1) || 1,
        ),
      );

      const todosPedidos = [...pedidosIniciais];

      // Busca as demais páginas em pequenos lotes para não sobrecarregar a API.
      for (let inicio = 2; inicio <= totalPaginas; inicio += 5) {
        const paginas = Array.from(
          { length: Math.min(5, totalPaginas - inicio + 1) },
          (_, indice) => inicio + indice,
        );

        const respostas = await Promise.all(
          paginas.map((pagina) =>
            conexao.get(ROTAS.PEDIDOS.PAINEL.LISTAR, {
              params: { pagina, limite: Number(paginacao?.limite ?? 50) || 50 },
            }),
          ),
        );

        for (const resposta of respostas) {
          const corpoResposta = obterCorpoResposta(resposta);
          todosPedidos.push(
            ...extrairColecao(corpoResposta, ["pedidos", "itens", "registros"])
              .map(normalizarPedido)
              .filter((pedido): pedido is PedidoOpcao => pedido !== null),
          );
        }
      }

      return todosPedidos.sort((a, b) => b.id - a.id);
    }

    async function carregarStatus(): Promise<StatusOpcao[]> {
      const resposta = await conexao.get(ROTAS.PERMISSOES.STATUS.LISTAR);
      const corpoResposta = obterCorpoResposta(resposta);
      const todosStatus = extrairColecao(corpoResposta, [
        "status",
        "statuses",
        "itens",
      ])
        .map(normalizarStatus)
        .filter(
          (status): status is StatusOpcao => status !== null && status.ativo,
        );

      // Não mistura status de pedidos, pagamentos ou cadastros com os de entrega.
      const gruposEntrega = todosStatus.filter((status) => {
        const grupo = status.grupo
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleUpperCase("pt-BR");

        return grupo.includes("ENTREGA") || grupo.includes("LOGISTICA");
      });

      return gruposEntrega.sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR"),
      );
    }

    async function carregarDados() {
      setCarregandoDados(true);
      setErroPedidos("");
      setErroStatus("");

      const [resultadoPedidos, resultadoStatus] = await Promise.allSettled([
        carregarPedidos(),
        carregarStatus(),
      ]);

      if (!componenteAtivo) return;

      if (resultadoPedidos.status === "fulfilled") {
        setPedidos(resultadoPedidos.value);
      } else {
        const falha = ehRegistro(resultadoPedidos.reason)
          ? resultadoPedidos.reason
          : {};
        const resposta = ehRegistro(falha.response) ? falha.response : {};
        setErroPedidos(
          extrairMensagem(
            obterCorpoResposta(resposta),
            typeof falha.message === "string"
              ? falha.message
              : "Não foi possível carregar os pedidos. Verifique sua sessão e a permissão pedidos.visualizar.",
          ),
        );
      }

      if (resultadoStatus.status === "fulfilled") {
        setStatusDisponiveis(resultadoStatus.value);
        if (resultadoStatus.value.length > 0) {
          const preferido =
            resultadoStatus.value.find((status) =>
              status.codigo.toLocaleLowerCase("pt-BR").includes("pendente"),
            ) ?? resultadoStatus.value[0];

          setFormulario((atual) =>
            atual.status_id
              ? atual
              : {
                  ...atual,
                  status_id: String(preferido.id),
                  status: codigoStatusParaApi(preferido.codigo),
                },
          );
        }
      } else {
        const falha = ehRegistro(resultadoStatus.reason)
          ? resultadoStatus.reason
          : {};
        const resposta = ehRegistro(falha.response) ? falha.response : {};
        setErroStatus(
          extrairMensagem(
            obterCorpoResposta(resposta),
            typeof falha.message === "string"
              ? falha.message
              : "Não foi possível carregar o catálogo de status.",
          ),
        );
      }

      setCarregandoDados(false);
    }

    void carregarDados();

    return () => {
      componenteAtivo = false;
    };
  }, [versaoCarga]);

  const pedidoSelecionado = useMemo(
    () =>
      pedidos.find((pedido) => String(pedido.id) === formulario.pedido_id) ??
      null,
    [pedidos, formulario.pedido_id],
  );

  const statusSelecionado = useMemo(
    () =>
      statusDisponiveis.find(
        (status) => String(status.id) === formulario.status_id,
      ) ?? null,
    [statusDisponiveis, formulario.status_id],
  );

  function atualizar<K extends keyof FormularioEntrega>(
    campo: K,
    valor: FormularioEntrega[K],
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function selecionarStatus(statusId: string) {
    const status = statusDisponiveis.find(
      (item) => String(item.id) === statusId,
    );

    setFormulario((atual) => ({
      ...atual,
      status_id: statusId,
      // O campo textual enviado ao backend acompanha o código do status selecionado.
      status: status ? codigoStatusParaApi(status.codigo) : "",
    }));
  }

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");

    const pedidoId = Number(formulario.pedido_id);
    const statusId = Number(formulario.status_id);

    if (!pedidos.some((pedido) => pedido.id === pedidoId)) {
      setErro("Selecione um pedido válido na lista.");
      return;
    }

    if (!statusDisponiveis.some((status) => status.id === statusId)) {
      setErro("Selecione um status de entrega válido na lista.");
      return;
    }

    if (!formulario.status.trim() || formulario.status.trim().length > 40) {
      setErro("O código do status precisa ter entre 1 e 40 caracteres.");
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        pedido_id: pedidoId,
        status_id: statusId,
        status: formulario.status.trim(),
        transportadora: formulario.transportadora.trim() || null,
        servico: formulario.servico.trim() || null,
        codigo_rastreio: formulario.codigo_rastreio.trim() || null,
        custo: decimalParaApi(formulario.custo),
        enviada_em: dataParaApi(formulario.enviada_em),
        entregue_em: dataParaApi(formulario.entregue_em),
      };

      // A API de entregas espera receber os campos dentro da chave "dados".
      // O custo informado aqui representa o valor pago pela loja à transportadora,
      // não o valor de frete cobrado do cliente no pedido.
      const corpoRequisicao = {
        dados: payload,
      };

      const resposta = await conexao.post(
        ROTAS.ENTREGAS.PAINEL.CADASTRAR,
        corpoRequisicao,
      );

      const dados: unknown = obterCorpoResposta(resposta);
      if (ehRegistro(dados) && dados.sucesso === false) {
        throw new Error(
          extrairMensagem(dados, "A API não confirmou o cadastro."),
        );
      }

      const raiz = ehRegistro(dados) ? dados : {};
      const interno = ehRegistro(raiz.dados) ? raiz.dados : {};
      const entrega = ehRegistro(interno.entrega) ? interno.entrega : interno;
      const idEntrega = entrega.id_entrega;

      setSucesso(
        idEntrega
          ? `Entrega #${idEntrega} cadastrada com sucesso. O evento inicial também foi registrado.`
          : "Entrega cadastrada com sucesso. O evento inicial também foi registrado.",
      );

      const statusPadrao =
        statusDisponiveis.find((status) =>
          status.codigo.toLocaleLowerCase("pt-BR").includes("pendente"),
        ) ?? statusDisponiveis[0];

      setFormulario({
        ...FORMULARIO_INICIAL,
        status_id: statusPadrao ? String(statusPadrao.id) : "",
        status: statusPadrao ? codigoStatusParaApi(statusPadrao.codigo) : "",
      });

      window.setTimeout(() => {
        router.push(ROTAS.PAGINAS.PAINEL.ENTREGAS.LISTAR);
      }, 1400);
    } catch (falha: unknown) {
      const registroFalha = ehRegistro(falha) ? falha : {};
      const respostaFalha = ehRegistro(registroFalha.response)
        ? registroFalha.response
        : {};
      const corpoFalha = obterCorpoResposta(respostaFalha);
      const mensagemFallback =
        falha instanceof Error
          ? falha.message
          : typeof registroFalha.message === "string"
            ? registroFalha.message
            : "Ocorreu um erro inesperado ao cadastrar a entrega.";

      setErro(extrairMensagem(corpoFalha, mensagemFallback));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <main className="entrega-pagina">
        <div className="entrega-container">
          <Link
            href={ROTAS.PAGINAS.PAINEL.ENTREGAS.LISTAR}
            className="entrega-voltar"
          >
            <ArrowLeft size={16} />
            Voltar para entregas
          </Link>

          <header className="entrega-cabecalho">
            <div className="entrega-icone-cabecalho">
              <Truck size={25} />
            </div>
            <div>
              <span className="entrega-eyebrow">
                UNIVERSO IMPÉRIO · LOGÍSTICA
              </span>
              <h1>Cadastrar entrega</h1>
              <p>
                Selecione um pedido existente, defina o status logístico e
                informe os dados de transporte.
              </p>
            </div>
          </header>

          {(erroPedidos || erroStatus) && (
            <div className="entrega-alerta entrega-alerta-aviso" role="status">
              <Info size={19} />
              <div>
                {erroPedidos && <p>{erroPedidos}</p>}
                {erroStatus && <p>{erroStatus}</p>}
              </div>
              <button
                type="button"
                className="entrega-botao-recarregar"
                onClick={() => setVersaoCarga((atual) => atual + 1)}
                disabled={carregandoDados}
              >
                <RefreshCw size={15} /> Atualizar listas
              </button>
            </div>
          )}

          {erro && (
            <div className="entrega-alerta entrega-alerta-erro" role="alert">
              <AlertCircle size={19} />
              <span>{erro}</span>
            </div>
          )}
          {sucesso && (
            <div
              className="entrega-alerta entrega-alerta-sucesso"
              role="status"
            >
              <CheckCircle2 size={19} />
              <span>{sucesso}</span>
            </div>
          )}

          <form className="entrega-formulario" onSubmit={cadastrar}>
            <section className="entrega-secao">
              <div className="entrega-secao-titulo">
                <PackageCheck size={19} />
                <div>
                  <h2>Vínculo e situação</h2>
                  <p>
                    Os campos abaixo carregam os registros existentes no banco
                    de dados.
                  </p>
                </div>
              </div>

              <div className="entrega-grade">
                <div className="entrega-campo entrega-campo-largo">
                  <label htmlFor="pedido-id">
                    Pedido <b>*</b>
                  </label>
                  <select
                    id="pedido-id"
                    required
                    value={formulario.pedido_id}
                    onChange={(e) => atualizar("pedido_id", e.target.value)}
                    disabled={carregandoDados || pedidos.length === 0}
                  >
                    <option value="" disabled>
                      {carregandoDados
                        ? "Carregando pedidos..."
                        : pedidos.length === 0
                          ? "Nenhum pedido encontrado"
                          : "Selecione um pedido"}
                    </option>
                    {pedidos.map((pedido) => (
                      <option key={pedido.id} value={pedido.id}>
                        {pedido.codigo ? `${pedido.codigo} · ` : ""}
                        Pedido #{pedido.id}
                        {pedido.clienteId
                          ? ` · Cliente #${pedido.clienteId}`
                          : ""}
                        {pedido.status ? ` · ${pedido.status}` : ""}
                        {pedido.total !== null
                          ? ` · ${formatarMoeda(pedido.total)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  <small>
                    {carregandoDados
                      ? "Buscando os pedidos cadastrados..."
                      : erroPedidos
                        ? "Não foi possível consultar os pedidos. Atualize a lista acima."
                        : pedidos.length === 0
                          ? "A API respondeu, mas não retornou pedidos para esta consulta."
                          : `${pedidos.length} pedido(s) carregado(s) do banco de dados.`}
                  </small>
                </div>

                {pedidoSelecionado && (
                  <div className="entrega-pedido-resumo entrega-campo-largo">
                    <div className="entrega-pedido-resumo-cabecalho">
                      <ClipboardList size={18} />
                      <strong>Pedido selecionado</strong>
                      <span>#{pedidoSelecionado.id}</span>
                    </div>
                    <div className="entrega-pedido-resumo-grade">
                      <div>
                        <small>Código</small>
                        <strong>
                          {pedidoSelecionado.codigo ||
                            `Pedido #${pedidoSelecionado.id}`}
                        </strong>
                      </div>
                      <div>
                        <small>Cliente</small>
                        <strong>
                          {pedidoSelecionado.clienteId
                            ? `#${pedidoSelecionado.clienteId}`
                            : "Não informado"}
                        </strong>
                      </div>
                      <div>
                        <small>Status do pedido</small>
                        <strong>
                          {pedidoSelecionado.status || "Não informado"}
                        </strong>
                      </div>
                      <div>
                        <small>Total</small>
                        <strong>
                          {formatarMoeda(pedidoSelecionado.total)}
                        </strong>
                      </div>
                      <div>
                        <small>Data do pedido</small>
                        <strong>
                          {formatarData(pedidoSelecionado.criadoEm)}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <label className="entrega-campo">
                  <span>
                    Status da entrega <b>*</b>
                  </span>
                  <select
                    required
                    value={formulario.status_id}
                    onChange={(e) => selecionarStatus(e.target.value)}
                    disabled={carregandoDados || statusDisponiveis.length === 0}
                  >
                    <option value="" disabled>
                      {carregandoDados
                        ? "Carregando status..."
                        : "Selecione o status"}
                    </option>
                    {statusDisponiveis.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.nome} · {status.codigo} · ID {status.id}
                      </option>
                    ))}
                  </select>
                  <small>
                    {statusSelecionado
                      ? `ID ${statusSelecionado.id} · ${statusSelecionado.grupo} · código enviado: ${formulario.status}`
                      : erroStatus
                        ? "Não foi possível carregar os status."
                        : statusDisponiveis.length === 0 && !carregandoDados
                          ? "Nenhum status ativo do grupo ENTREGA/LOGISTICA foi encontrado no catálogo."
                          : "O ID e o código são preenchidos automaticamente pela seleção."}
                  </small>
                </label>

                <label className="entrega-campo">
                  <span>Custo pago à transportadora pela loja</span>
                  <div className="entrega-input-prefixo">
                    <span>R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formulario.custo}
                      onChange={(e) => atualizar("custo", e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <small>
                    Valor que a loja paga à transportadora. Não é o frete
                    cobrado do cliente. Use 0,00 quando não houver custo para a
                    loja.
                  </small>
                </label>
              </div>
            </section>

            <section className="entrega-secao">
              <div className="entrega-secao-titulo">
                <Truck size={19} />
                <div>
                  <h2>Dados do transporte</h2>
                  <p>Preencha os dados fornecidos pela transportadora.</p>
                </div>
              </div>

              <div className="entrega-grade">
                <label className="entrega-campo">
                  <span>Transportadora</span>
                  <input
                    value={formulario.transportadora}
                    onChange={(e) =>
                      atualizar("transportadora", e.target.value)
                    }
                    placeholder="Ex.: Correios, Jadlog..."
                    maxLength={120}
                  />
                </label>

                <label className="entrega-campo">
                  <span>Serviço</span>
                  <input
                    value={formulario.servico}
                    onChange={(e) => atualizar("servico", e.target.value)}
                    placeholder="Ex.: PAC, SEDEX, expresso..."
                    maxLength={120}
                  />
                </label>

                <label className="entrega-campo entrega-campo-largo">
                  <span>Código de rastreio</span>
                  <input
                    value={formulario.codigo_rastreio}
                    onChange={(e) =>
                      atualizar("codigo_rastreio", e.target.value)
                    }
                    placeholder="Digite o código de rastreamento"
                    maxLength={150}
                  />
                </label>
              </div>
            </section>

            <section className="entrega-secao">
              <div className="entrega-secao-titulo">
                <CheckCircle2 size={19} />
                <div>
                  <h2>Datas do envio</h2>
                  <p>
                    As datas são opcionais e podem ser preenchidas
                    posteriormente.
                  </p>
                </div>
              </div>

              <div className="entrega-grade">
                <label className="entrega-campo">
                  <span>Enviada em</span>
                  <input
                    type="datetime-local"
                    value={formulario.enviada_em}
                    onChange={(e) => atualizar("enviada_em", e.target.value)}
                  />
                </label>
                <label className="entrega-campo">
                  <span>Entregue em</span>
                  <input
                    type="datetime-local"
                    value={formulario.entregue_em}
                    onChange={(e) => atualizar("entregue_em", e.target.value)}
                  />
                </label>
              </div>
            </section>

            <div className="entrega-rodape">
              <p>
                <b>*</b> Campos obrigatórios.
              </p>
              <div className="entrega-acoes">
                <Link
                  href={ROTAS.PAGINAS.PAINEL.ENTREGAS.LISTAR}
                  className="entrega-botao-cancelar"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="entrega-botao-salvar"
                  disabled={
                    salvando ||
                    carregandoDados ||
                    pedidos.length === 0 ||
                    statusDisponiveis.length === 0
                  }
                >
                  {salvando ? (
                    <LoaderCircle className="entrega-girando" size={17} />
                  ) : (
                    <Save size={17} />
                  )}
                  {salvando ? "Cadastrando..." : "Cadastrar entrega"}
                </button>
              </div>
            </div>
          </form>

          <aside className="entrega-observacao">
            <AlertCircle size={17} />
            <p>
              Ao cadastrar, a API também registra automaticamente o evento
              inicial
              <strong> “Entrega cadastrada.”</strong> no histórico. O campo
              status é enviado junto com o ID do status selecionado no catálogo.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
