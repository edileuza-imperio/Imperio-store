"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Filter,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Registro = Record<string, unknown>;

type Entrega = {
  id: number;
  pedidoId: number | null;
  pedidoCodigo: string;
  clienteId: number | null;
  statusId: number | null;
  status: string;
  transportadora: string;
  servico: string;
  codigoRastreio: string;
  custo: number | null;
  enviadaEm: string;
  entregueEm: string;
  criadaEm: string;
  atualizadaEm: string;
};

type Paginacao = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

const LIMITE_PADRAO = 50;
const ROTA_CADASTRAR = `${ROTAS.PAGINAS.PAINEL.ENTREGAS.LISTAR}/cadastrar`;

function ehRegistro(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** Converte JSON recebido como objeto ou texto, inclusive quando há "null" após o JSON. */
function converterResposta(valor: unknown): unknown {
  if (typeof valor !== "string") return valor;
  const texto = valor.trim();
  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    // Algumas respostas antigas podem trazer um sufixo depois do JSON válido.
    const inicio = texto.search(/[\[{]/);
    if (inicio < 0) return valor;

    const pilha: string[] = [];
    let dentroDeString = false;
    let escape = false;

    for (let i = inicio; i < texto.length; i += 1) {
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
        pilha.push("}");
      } else if (caractere === "[") {
        pilha.push("]");
      } else if (caractere === "}" || caractere === "]") {
        if (pilha[pilha.length - 1] !== caractere) return valor;
        pilha.pop();
        if (pilha.length === 0) {
          try {
            return JSON.parse(texto.slice(inicio, i + 1));
          } catch {
            return valor;
          }
        }
      }
    }
    return valor;
  }
}

function obterCorpoResposta(resposta: unknown): unknown {
  if (!ehRegistro(resposta)) return converterResposta(resposta);
  if ("data" in resposta) return converterResposta(resposta.data);
  return converterResposta(resposta);
}

function encontrarColecao(origem: unknown, profundidade = 0): unknown[] {
  const valor = converterResposta(origem);
  if (Array.isArray(valor)) return valor;
  if (!ehRegistro(valor) || profundidade > 8) return [];

  for (const chave of ["entregas", "itens", "registros"]) {
    if (Array.isArray(valor[chave])) return valor[chave] as unknown[];
  }

  for (const chave of ["dados", "data", "resultado", "result", "payload"]) {
    if (valor[chave] !== undefined && valor[chave] !== null) {
      const encontrados = encontrarColecao(valor[chave], profundidade + 1);
      if (encontrados.length > 0) return encontrados;
    }
  }

  return [];
}

function encontrarPaginacao(origem: unknown, profundidade = 0): Registro | null {
  const valor = converterResposta(origem);
  if (!ehRegistro(valor) || profundidade > 8) return null;
  if (ehRegistro(valor.paginacao)) return valor.paginacao;

  for (const chave of ["dados", "data", "resultado", "result", "payload"]) {
    const resultado = encontrarPaginacao(valor[chave], profundidade + 1);
    if (resultado) return resultado;
  }
  return null;
}

function primeiroTexto(...valores: unknown[]): string {
  for (const valor of valores) {
    if (typeof valor === "string" && valor.trim()) return valor.trim();
    if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  }
  return "";
}

function paraNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const texto = String(valor).trim();
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function normalizarEntrega(valor: unknown): Entrega | null {
  if (!ehRegistro(valor)) return null;

  const id = Number(valor.id_entrega ?? valor.entrega_id ?? valor.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const pedido = ehRegistro(valor.pedido) ? valor.pedido : {};
  const statusObj = ehRegistro(valor.status_dados)
    ? valor.status_dados
    : ehRegistro(valor.status_info)
      ? valor.status_info
      : {};

  return {
    id,
    pedidoId: paraNumero(valor.pedido_id ?? pedido.id_pedido ?? pedido.id),
    pedidoCodigo: primeiroTexto(
      valor.pedido_codigo,
      valor.codigo_pedido,
      pedido.codigo,
      valor.numero_pedido,
    ),
    clienteId: paraNumero(valor.cliente_id ?? pedido.cliente_id),
    statusId: paraNumero(valor.status_id ?? statusObj.id_status),
    status: primeiroTexto(
      typeof valor.status === "object" && ehRegistro(valor.status)
        ? valor.status.nome ?? valor.status.codigo
        : valor.status,
      valor.status_nome,
      statusObj.nome,
      statusObj.codigo,
      valor.status_codigo,
    ) || "Não informado",
    transportadora: primeiroTexto(valor.transportadora, valor.nome_transportadora),
    servico: primeiroTexto(valor.servico, valor.tipo_servico),
    codigoRastreio: primeiroTexto(
      valor.codigo_rastreio,
      valor.codigo_rastreamento,
      valor.rastreio,
    ),
    custo: paraNumero(valor.custo ?? valor.custo_frete),
    enviadaEm: primeiroTexto(valor.enviada_em, valor.data_envio),
    entregueEm: primeiroTexto(valor.entregue_em, valor.data_entrega),
    criadaEm: primeiroTexto(valor.criado_em, valor.created_at),
    atualizadaEm: primeiroTexto(valor.atualizado_em, valor.updated_at),
  };
}

function formatarMoeda(valor: number | null): string {
  if (valor === null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(valor: string): string {
  if (!valor) return "—";
  const data = new Date(valor.includes("T") ? valor : valor.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: valor.includes(":") ? "2-digit" : undefined,
    minute: valor.includes(":") ? "2-digit" : undefined,
  });
}

function classeStatus(status: string): string {
  const texto = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (texto.includes("entregue")) return "entregas-status-entregue";
  if (texto.includes("cancel") || texto.includes("devolv")) return "entregas-status-cancelado";
  if (texto.includes("transito") || texto.includes("enviado") || texto.includes("saiu")) return "entregas-status-transito";
  if (texto.includes("prepar") || texto.includes("pendente")) return "entregas-status-pendente";
  return "entregas-status-neutro";
}

function extrairMensagem(valor: unknown, alternativa: string): string {
  const dados = converterResposta(valor);
  if (ehRegistro(dados)) {
    for (const chave of ["mensagem", "message", "erro"]) {
      if (typeof dados[chave] === "string" && dados[chave].trim()) {
        return dados[chave] as string;
      }
    }
    for (const chave of ["dados", "data", "resultado", "result"]) {
      if (dados[chave] !== undefined) return extrairMensagem(dados[chave], alternativa);
    }
  }
  return alternativa;
}

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [paginacao, setPaginacao] = useState<Paginacao>({
    pagina: 1,
    limite: LIMITE_PADRAO,
    total: 0,
    totalPaginas: 1,
  });

  const carregarEntregas = useCallback(async (paginaSolicitada = 1, silencioso = false) => {
    if (silencioso) setAtualizando(true);
    else setCarregando(true);
    setErro("");

    try {
      const resposta = paginaSolicitada === 1
        ? await conexao.get(ROTAS.ENTREGAS.PAINEL.LISTAR)
        : await conexao.get(ROTAS.ENTREGAS.PAINEL.LISTAR, {
            params: { pagina: paginaSolicitada, limite: LIMITE_PADRAO },
          });

      const corpo = obterCorpoResposta(resposta);
      const registros = encontrarColecao(corpo);
      const normalizadas = registros
        .map(normalizarEntrega)
        .filter((item): item is Entrega => item !== null)
        .sort((a, b) => b.id - a.id);

      const meta = encontrarPaginacao(corpo);
      const limite = Math.max(1, Number(meta?.limite ?? LIMITE_PADRAO) || LIMITE_PADRAO);
      const paginaAtual = Math.max(1, Number(meta?.pagina ?? paginaSolicitada) || paginaSolicitada);
      const total = Math.max(0, Number(meta?.total ?? normalizadas.length) || 0);
      const totalPaginas = Math.max(
        1,
        Number(meta?.total_paginas ?? meta?.totalPaginas ?? Math.ceil(total / limite)) || 1,
      );

      setEntregas(normalizadas);
      setPagina(paginaAtual);
      setPaginacao({ pagina: paginaAtual, limite, total, totalPaginas });

      if (registros.length === 0) {
        console.info("[ENTREGAS] A API respondeu sem uma coleção reconhecida. Corpo recebido:", corpo);
      }
    } catch (falha: unknown) {
      const registro = ehRegistro(falha) ? falha : {};
      const respostaErro = ehRegistro(registro.response) ? registro.response : {};
      setEntregas([]);
      setErro(
        extrairMensagem(
          respostaErro.data,
          typeof registro.message === "string"
            ? registro.message
            : "Não foi possível carregar as entregas. Verifique sua sessão e a permissão entregas.visualizar.",
        ),
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregarEntregas(1);
  }, [carregarEntregas]);

  const statusDisponiveis = useMemo(
    () => Array.from(new Set(entregas.map((entrega) => entrega.status))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [entregas],
  );

  const entregasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return entregas.filter((entrega) => {
      const correspondeStatus = filtroStatus === "todos" || entrega.status === filtroStatus;
      const texto = [
        entrega.id,
        entrega.pedidoId,
        entrega.pedidoCodigo,
        entrega.clienteId,
        entrega.status,
        entrega.transportadora,
        entrega.servico,
        entrega.codigoRastreio,
      ].join(" ").toLocaleLowerCase("pt-BR");
      return correspondeStatus && (!termo || texto.includes(termo));
    });
  }, [entregas, busca, filtroStatus]);

  const indicadores = useMemo(() => {
    const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return {
      total: paginacao.total || entregas.length,
      emTransito: entregas.filter((item) => {
        const status = normalizar(item.status);
        return status.includes("transito") || status.includes("enviado") || status.includes("saiu para entrega");
      }).length,
      entregues: entregas.filter((item) => normalizar(item.status).includes("entregue")).length,
      custo: entregas.reduce((soma, item) => soma + (item.custo ?? 0), 0),
    };
  }, [entregas, paginacao.total]);

  function mudarPagina(novaPagina: number) {
    if (novaPagina < 1 || novaPagina > paginacao.totalPaginas || novaPagina === pagina) return;
    void carregarEntregas(novaPagina);
  }

  return (
    <main className="entregas-lista-pagina">
      <div className="entregas-lista-container">
        <header className="entregas-lista-cabecalho">
          <div className="entregas-lista-titulo-wrap">
            <span className="entregas-lista-eyebrow">PAINEL ADMINISTRATIVO · LOGÍSTICA</span>
            <h1>Entregas</h1>
            <p>Acompanhe os envios, consulte os códigos de rastreio e controle os custos pagos às transportadoras.</p>
          </div>
          <div className="entregas-lista-acoes-topo">
            <button
              type="button"
              className="entregas-lista-botao-secundario"
              onClick={() => void carregarEntregas(pagina, true)}
              disabled={carregando || atualizando}
            >
              <RefreshCw size={16} className={atualizando ? "entregas-lista-girando" : ""} />
              Atualizar
            </button>
            <Link href={ROTA_CADASTRAR} className="entregas-lista-botao-principal">
              <Plus size={17} /> Nova entrega
            </Link>
          </div>
        </header>

        {erro && (
          <div className="entregas-lista-alerta" role="alert">
            <AlertCircle size={19} />
            <span>{erro}</span>
            <button type="button" onClick={() => void carregarEntregas(pagina)} aria-label="Tentar novamente">
              <RefreshCw size={15} /> Tentar novamente
            </button>
          </div>
        )}

        <section className="entregas-lista-indicadores" aria-label="Resumo das entregas">
          <article className="entregas-lista-indicador">
            <span className="entregas-lista-indicador-icone"><ClipboardList size={18} /></span>
            <div><small>Total de entregas</small><strong>{carregando ? "—" : indicadores.total}</strong></div>
          </article>
          <article className="entregas-lista-indicador">
            <span className="entregas-lista-indicador-icone"><Truck size={18} /></span>
            <div><small>Em transporte</small><strong>{carregando ? "—" : indicadores.emTransito}</strong></div>
          </article>
          <article className="entregas-lista-indicador">
            <span className="entregas-lista-indicador-icone"><CheckCircle2 size={18} /></span>
            <div><small>Entregues nesta página</small><strong>{carregando ? "—" : indicadores.entregues}</strong></div>
          </article>
          <article className="entregas-lista-indicador">
            <span className="entregas-lista-indicador-icone"><CircleDollarSign size={18} /></span>
            <div><small>Custo logístico nesta página</small><strong>{carregando ? "—" : formatarMoeda(indicadores.custo)}</strong></div>
          </article>
        </section>

        <section className="entregas-lista-painel">
          <div className="entregas-lista-painel-topo">
            <div>
              <span className="entregas-lista-eyebrow">GESTÃO LOGÍSTICA</span>
              <h2>Entregas cadastradas</h2>
              <p>Os custos exibidos representam o valor pago pela loja à transportadora, não o frete cobrado do cliente.</p>
            </div>
            <span className="entregas-lista-contagem">{carregando ? "Carregando..." : `${entregas.length} registro(s) nesta página`}</span>
          </div>

          <div className="entregas-lista-filtros">
            <label className="entregas-lista-busca">
              <Search size={17} />
              <input
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar por pedido, transportadora ou rastreio..."
                aria-label="Buscar entregas"
              />
              {busca && <button type="button" onClick={() => setBusca("")} aria-label="Limpar busca"><X size={15} /></button>}
            </label>
            <label className="entregas-lista-filtro-status">
              <Filter size={16} />
              <select value={filtroStatus} onChange={(evento) => setFiltroStatus(evento.target.value)} aria-label="Filtrar por status">
                <option value="todos">Todos os status</option>
                {statusDisponiveis.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          </div>

          <div className="entregas-lista-tabela-wrap">
            <table className="entregas-lista-tabela">
              <thead>
                <tr>
                  <th>Entrega</th>
                  <th>Pedido</th>
                  <th>Status</th>
                  <th>Transportadora</th>
                  <th>Rastreamento</th>
                  <th>Custo da loja</th>
                  <th>Enviada em</th>
                  <th>Entregue em</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={8} className="entregas-lista-estado"><span className="entregas-lista-spinner" />Carregando entregas...</td></tr>
                ) : entregasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="entregas-lista-estado-vazio">
                      <span className="entregas-lista-vazio-icone"><PackageCheck size={25} /></span>
                      <strong>{entregas.length === 0 ? "Nenhuma entrega cadastrada" : "Nenhuma entrega encontrada"}</strong>
                      <p>{entregas.length === 0 ? "Cadastre a primeira entrega vinculando-a a um pedido existente." : "Altere a busca ou o filtro de status para ver outros registros."}</p>
                      {entregas.length === 0 && <Link href={ROTA_CADASTRAR} className="entregas-lista-link-vazio"><Plus size={15} /> Cadastrar entrega</Link>}
                    </td>
                  </tr>
                ) : entregasFiltradas.map((entrega) => (
                  <tr key={entrega.id}>
                    <td><strong className="entregas-lista-id">#{entrega.id}</strong><small className="entregas-lista-subtexto">{formatarData(entrega.criadaEm)}</small></td>
                    <td>
                      <strong>{entrega.pedidoCodigo || (entrega.pedidoId ? `Pedido #${entrega.pedidoId}` : "—")}</strong>
                      {entrega.pedidoId && <small className="entregas-lista-subtexto">ID {entrega.pedidoId}{entrega.clienteId ? ` · Cliente #${entrega.clienteId}` : ""}</small>}
                    </td>
                    <td><span className={`entregas-lista-status ${classeStatus(entrega.status)}`}>{entrega.status}</span></td>
                    <td><strong>{entrega.transportadora || "Não informada"}</strong>{entrega.servico && <small className="entregas-lista-subtexto">{entrega.servico}</small>}</td>
                    <td>{entrega.codigoRastreio ? <code className="entregas-lista-rastreio">{entrega.codigoRastreio}</code> : <span className="entregas-lista-sem-dado">Não informado</span>}</td>
                    <td><strong className="entregas-lista-custo">{formatarMoeda(entrega.custo)}</strong></td>
                    <td><span className="entregas-lista-data"><CalendarDays size={14} />{formatarData(entrega.enviadaEm)}</span></td>
                    <td><span className="entregas-lista-data"><CalendarDays size={14} />{formatarData(entrega.entregueEm)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="entregas-lista-rodape">
            <span>Mostrando {entregasFiltradas.length} de {entregas.length} entrega(s) carregada(s) nesta página.</span>
            <div className="entregas-lista-paginacao">
              <button type="button" onClick={() => mudarPagina(pagina - 1)} disabled={carregando || pagina <= 1} aria-label="Página anterior"><ChevronLeft size={17} /></button>
              <span>Página <strong>{pagina}</strong> de <strong>{paginacao.totalPaginas}</strong></span>
              <button type="button" onClick={() => mudarPagina(pagina + 1)} disabled={carregando || pagina >= paginacao.totalPaginas} aria-label="Próxima página"><ChevronRight size={17} /></button>
            </div>
          </footer>
        </section>

        <aside className="entregas-lista-nota">
          <AlertCircle size={16} />
          <p><strong>Controle financeiro:</strong> o campo “Custo da loja” representa o valor pago à transportadora. O frete cobrado do cliente permanece no registro do pedido.</p>
        </aside>
      </div>
    </main>
  );
}
