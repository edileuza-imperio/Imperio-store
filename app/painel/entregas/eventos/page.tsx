"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  History,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Registro = Record<string, unknown>;

type EntregaResumo = {
  id: number;
  pedidoId: number | null;
  pedidoCodigo: string;
  status: string;
  transportadora: string;
};

type EventoEntrega = {
  id: number | string;
  entregaId: number;
  pedidoId: number | null;
  pedidoCodigo: string;
  status: string;
  descricao: string;
  criadoEm: string;
  transportadora: string;
};

const LIMITE_ENTREGAS = 50;
const ITENS_POR_PAGINA = 15;
const ROTA_LISTAGEM = ROTAS.PAGINAS.PAINEL.ENTREGAS.LISTAR;

function ehRegistro(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** Aceita respostas Axios como objeto ou JSON serializado em texto. */
function converterResposta(valor: unknown): unknown {
  if (typeof valor !== "string") return valor;
  const texto = valor.trim();
  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    const inicio = texto.search(/[\[{]/);
    if (inicio < 0) return valor;

    const pilha: string[] = [];
    let dentroDeString = false;
    let escape = false;

    for (let i = inicio; i < texto.length; i += 1) {
      const caractere = texto[i];
      if (dentroDeString) {
        if (escape) escape = false;
        else if (caractere === "\\") escape = true;
        else if (caractere === '"') dentroDeString = false;
        continue;
      }

      if (caractere === '"') dentroDeString = true;
      else if (caractere === "{" || caractere === "[") {
        pilha.push(caractere === "{" ? "}" : "]");
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

function corpoResposta(resposta: unknown): unknown {
  if (!ehRegistro(resposta)) return converterResposta(resposta);
  return converterResposta("data" in resposta ? resposta.data : resposta);
}

function encontrarColecao(
  origem: unknown,
  chaves: string[],
  profundidade = 0,
): unknown[] {
  const valor = converterResposta(origem);
  if (Array.isArray(valor)) return valor;
  if (!ehRegistro(valor) || profundidade > 9) return [];

  for (const chave of chaves) {
    if (Array.isArray(valor[chave])) return valor[chave] as unknown[];
  }

  for (const chave of ["dados", "data", "resultado", "result", "payload", "evento"]) {
    const interno = valor[chave];
    if (interno !== undefined && interno !== null) {
      const encontrados = encontrarColecao(interno, chaves, profundidade + 1);
      if (encontrados.length) return encontrados;
    }
  }
  return [];
}

function encontrarPaginacao(origem: unknown, profundidade = 0): Registro | null {
  const valor = converterResposta(origem);
  if (!ehRegistro(valor) || profundidade > 9) return null;
  if (ehRegistro(valor.paginacao)) return valor.paginacao;

  for (const chave of ["dados", "data", "resultado", "result", "payload"]) {
    const resultado = encontrarPaginacao(valor[chave], profundidade + 1);
    if (resultado) return resultado;
  }
  return null;
}

function texto(...valores: unknown[]): string {
  for (const valor of valores) {
    if (typeof valor === "string" && valor.trim()) return valor.trim();
    if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  }
  return "";
}

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function normalizarEntrega(valor: unknown): EntregaResumo | null {
  if (!ehRegistro(valor)) return null;
  const id = Number(valor.id_entrega ?? valor.entrega_id ?? valor.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const pedido = ehRegistro(valor.pedido) ? valor.pedido : {};
  const statusObj = ehRegistro(valor.status_dados)
    ? valor.status_dados
    : ehRegistro(valor.status_info)
      ? valor.status_info
      : {};

  const statusBruto = ehRegistro(valor.status)
    ? valor.status.nome ?? valor.status.codigo
    : valor.status;

  return {
    id,
    pedidoId: numero(valor.pedido_id ?? pedido.id_pedido ?? pedido.id),
    pedidoCodigo: texto(valor.pedido_codigo, valor.codigo_pedido, pedido.codigo),
    status: texto(statusBruto, valor.status_nome, statusObj.nome, statusObj.codigo) || "Não informado",
    transportadora: texto(valor.transportadora, valor.nome_transportadora),
  };
}

function normalizarEvento(valor: unknown, entrega: EntregaResumo): EventoEntrega | null {
  if (!ehRegistro(valor)) return null;

  const idBruto = valor.id_evento ?? valor.evento_id ?? valor.id;
  const id = typeof idBruto === "number" || typeof idBruto === "string"
    ? idBruto
    : `${entrega.id}-${texto(valor.criado_em, valor.data_evento, valor.descricao)}`;

  const statusObj = ehRegistro(valor.status_dados)
    ? valor.status_dados
    : ehRegistro(valor.status_info)
      ? valor.status_info
      : {};
  const statusBruto = ehRegistro(valor.status)
    ? valor.status.nome ?? valor.status.codigo
    : valor.status;

  const data = texto(
    valor.criado_em,
    valor.data_evento,
    valor.registrado_em,
    valor.created_at,
    valor.data,
  );

  return {
    id,
    entregaId: numero(valor.entrega_id ?? valor.id_entrega) ?? entrega.id,
    pedidoId: numero(valor.pedido_id) ?? entrega.pedidoId,
    pedidoCodigo: texto(valor.pedido_codigo, entrega.pedidoCodigo),
    status: texto(statusBruto, valor.status_nome, statusObj.nome, statusObj.codigo, valor.codigo_status) || entrega.status,
    descricao: texto(
      valor.descricao,
      valor.mensagem,
      valor.observacao,
      valor.evento,
      valor.detalhes,
      valor.nome,
    ) || "Atualização registrada no histórico da entrega.",
    criadoEm: data,
    transportadora: texto(valor.transportadora, entrega.transportadora),
  };
}

function dataTimestamp(valor: string): number {
  if (!valor) return 0;
  const data = new Date(valor.includes("T") ? valor : valor.replace(" ", "T"));
  return Number.isNaN(data.getTime()) ? 0 : data.getTime();
}

function formatarData(valor: string): string {
  if (!valor) return "Data não informada";
  const data = new Date(valor.includes("T") ? valor : valor.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function textoBusca(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function classeStatus(status: string): string {
  const valor = textoBusca(status);
  if (valor.includes("entregue")) return "entregas-eventos-status-entregue";
  if (valor.includes("cancel") || valor.includes("devolv")) return "entregas-eventos-status-cancelado";
  if (valor.includes("transito") || valor.includes("enviado") || valor.includes("saiu")) return "entregas-eventos-status-transito";
  if (valor.includes("pendente") || valor.includes("prepar")) return "entregas-eventos-status-pendente";
  return "entregas-eventos-status-neutro";
}

function mensagemErro(valor: unknown, alternativa: string): string {
  const corpo = converterResposta(valor);
  if (!ehRegistro(corpo)) return alternativa;
  for (const chave of ["mensagem", "message", "erro"]) {
    if (typeof corpo[chave] === "string" && corpo[chave].trim()) return corpo[chave] as string;
  }
  for (const chave of ["dados", "data", "resultado", "result"]) {
    if (corpo[chave] !== undefined) return mensagemErro(corpo[chave], alternativa);
  }
  return alternativa;
}

export default function EntregasEventosPage() {
  const [eventos, setEventos] = useState<EventoEntrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [avisos, setAvisos] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroEntrega, setFiltroEntrega] = useState("todas");
  const [pagina, setPagina] = useState(1);

  const carregarEventos = useCallback(async (silencioso = false) => {
    if (silencioso) setAtualizando(true);
    else setCarregando(true);
    setErro("");
    setAvisos([]);

    try {
      // Usa o endpoint de listagem já existente e consulta os eventos
      // pelo endpoint oficial de cada entrega: /painel/entregas/{id}/eventos.
      const primeiraResposta = await conexao.get(ROTAS.ENTREGAS.PAINEL.LISTAR);
      const corpoPrimeiraResposta = corpoResposta(primeiraResposta);
      const registrosIniciais = encontrarColecao(corpoPrimeiraResposta, ["entregas", "itens", "registros"]);
      const meta = encontrarPaginacao(corpoPrimeiraResposta);
      const limite = Math.max(1, Number(meta?.limite ?? LIMITE_ENTREGAS) || LIMITE_ENTREGAS);
      const totalPaginas = Math.max(
        1,
        Math.min(100, Number(meta?.total_paginas ?? meta?.totalPaginas ?? 1) || 1),
      );

      const registrosEntregas: unknown[] = [...registrosIniciais];
      for (let inicio = 2; inicio <= totalPaginas; inicio += 5) {
        const paginas = Array.from(
          { length: Math.min(5, totalPaginas - inicio + 1) },
          (_, indice) => inicio + indice,
        );
        const respostas = await Promise.all(
          paginas.map((pagina) =>
            conexao.get(ROTAS.ENTREGAS.PAINEL.LISTAR, {
              params: { pagina, limite },
            }),
          ),
        );
        respostas.forEach((resposta) => {
          registrosEntregas.push(
            ...encontrarColecao(corpoResposta(resposta), ["entregas", "itens", "registros"]),
          );
        });
      }

      const entregas = registrosEntregas
        .map(normalizarEntrega)
        .filter((item): item is EntregaResumo => item !== null)
        .filter((item, indice, lista) => lista.findIndex((outro) => outro.id === item.id) === indice);

      if (!entregas.length) {
        setEventos([]);
        setAvisos([]);
        return;
      }

      const coletados: EventoEntrega[] = [];
      const falhas: string[] = [];
      const lote = 5;

      for (let inicio = 0; inicio < entregas.length; inicio += lote) {
        const grupo = entregas.slice(inicio, inicio + lote);
        const resultados = await Promise.allSettled(
          grupo.map(async (entrega) => {
            const resposta = await conexao.get(
              ROTAS.ENTREGAS.PAINEL.EVENTOS.LISTAR(entrega.id),
            );
            const corpo = corpoResposta(resposta);
            const registros = encontrarColecao(corpo, ["eventos", "historico", "itens", "registros"]);
            return registros
              .map((item) => normalizarEvento(item, entrega))
              .filter((item): item is EventoEntrega => item !== null);
          }),
        );

        resultados.forEach((resultado, indice) => {
          if (resultado.status === "fulfilled") coletados.push(...resultado.value);
          else falhas.push(`Entrega #${grupo[indice].id}: não foi possível consultar os eventos.`);
        });
      }

      coletados.sort((a, b) => dataTimestamp(b.criadoEm) - dataTimestamp(a.criadoEm));
      setEventos(coletados);
      setAvisos(falhas);

      if (!coletados.length && falhas.length === 0) {
        console.info("[ENTREGAS EVENTOS] Nenhum evento retornado pelos endpoints de histórico.");
      }
    } catch (falha: unknown) {
      const registro = ehRegistro(falha) ? falha : {};
      const respostaErro = ehRegistro(registro.response) ? registro.response : {};
      setEventos([]);
      setErro(
        mensagemErro(
          respostaErro.data,
          typeof registro.message === "string"
            ? registro.message
            : "Não foi possível carregar o histórico. Verifique sua sessão e a permissão entregas.visualizar.",
        ),
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregarEventos();
  }, [carregarEventos]);

  const statusDisponiveis = useMemo(
    () => Array.from(new Set(eventos.map((evento) => evento.status))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [eventos],
  );

  const entregasDisponiveis = useMemo(() => {
    const mapa = new Map<number, string>();
    eventos.forEach((evento) => {
      mapa.set(
        evento.entregaId,
        evento.pedidoCodigo || (evento.pedidoId ? `Pedido #${evento.pedidoId}` : `Entrega #${evento.entregaId}`),
      );
    });
    return Array.from(mapa.entries()).sort((a, b) => b[0] - a[0]);
  }, [eventos]);

  const eventosFiltrados = useMemo(() => {
    const termo = textoBusca(busca.trim());
    return eventos.filter((evento) => {
      const correspondeStatus = filtroStatus === "todos" || evento.status === filtroStatus;
      const correspondeEntrega = filtroEntrega === "todas" || String(evento.entregaId) === filtroEntrega;
      const conteudo = textoBusca([
        evento.id,
        evento.entregaId,
        evento.pedidoId,
        evento.pedidoCodigo,
        evento.status,
        evento.descricao,
        evento.transportadora,
      ].join(" "));
      return correspondeStatus && correspondeEntrega && (!termo || conteudo.includes(termo));
    });
  }, [eventos, busca, filtroStatus, filtroEntrega]);

  const totalPaginas = Math.max(1, Math.ceil(eventosFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const eventosPaginados = eventosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA,
  );

  const indicadores = useMemo(() => {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    return {
      total: eventos.length,
      entregas: new Set(eventos.map((evento) => evento.entregaId)).size,
      hoje: eventos.filter((evento) => {
        const timestamp = dataTimestamp(evento.criadoEm);
        return timestamp >= inicioHoje && timestamp <= Date.now();
      }).length,
    };
  }, [eventos]);

  function alterarBusca(valor: string) {
    setBusca(valor);
    setPagina(1);
  }

  function alterarStatus(valor: string) {
    setFiltroStatus(valor);
    setPagina(1);
  }

  function alterarEntrega(valor: string) {
    setFiltroEntrega(valor);
    setPagina(1);
  }

  return (
    <main className="entregas-eventos-pagina">
      <div className="entregas-eventos-container">
        <Link href={ROTA_LISTAGEM} className="entregas-eventos-voltar">
          <ArrowLeft size={16} /> Voltar para entregas
        </Link>

        <header className="entregas-eventos-cabecalho">
          <div className="entregas-eventos-titulo-wrap">
            <span className="entregas-eventos-eyebrow">PAINEL ADMINISTRATIVO · LOGÍSTICA</span>
            <h1>Histórico de eventos</h1>
            <p>Acompanhe as atualizações registradas nas entregas, consulte mudanças de status e veja quando cada evento foi lançado.</p>
          </div>
          <button
            type="button"
            className="entregas-eventos-botao-atualizar"
            onClick={() => void carregarEventos(true)}
            disabled={carregando || atualizando}
          >
            <RefreshCw size={16} className={atualizando ? "entregas-eventos-girando" : ""} />
            Atualizar histórico
          </button>
        </header>

        {erro && (
          <div className="entregas-eventos-alerta entregas-eventos-alerta-erro" role="alert">
            <AlertCircle size={18} />
            <span>{erro}</span>
            <button type="button" onClick={() => void carregarEventos()} aria-label="Tentar novamente">
              Tentar novamente <RefreshCw size={14} />
            </button>
          </div>
        )}

        {avisos.length > 0 && (
          <div className="entregas-eventos-alerta entregas-eventos-alerta-aviso" role="status">
            <AlertCircle size={18} />
            <div>
              <strong>Alguns históricos não puderam ser consultados.</strong>
              <span>{avisos.length} entrega(s) apresentaram falha. Os demais eventos foram carregados.</span>
            </div>
          </div>
        )}

        <section className="entregas-eventos-indicadores" aria-label="Resumo do histórico">
          <article className="entregas-eventos-indicador">
            <span className="entregas-eventos-indicador-icone"><History size={19} /></span>
            <div><small>Eventos encontrados</small><strong>{carregando ? "—" : indicadores.total}</strong></div>
          </article>
          <article className="entregas-eventos-indicador">
            <span className="entregas-eventos-indicador-icone"><PackageCheck size={19} /></span>
            <div><small>Entregas com histórico</small><strong>{carregando ? "—" : indicadores.entregas}</strong></div>
          </article>
          <article className="entregas-eventos-indicador">
            <span className="entregas-eventos-indicador-icone"><CalendarClock size={19} /></span>
            <div><small>Eventos registrados hoje</small><strong>{carregando ? "—" : indicadores.hoje}</strong></div>
          </article>
        </section>

        <section className="entregas-eventos-painel">
          <div className="entregas-eventos-painel-topo">
            <div>
              <span className="entregas-eventos-eyebrow">RASTREAMENTO E AUDITORIA</span>
              <h2>Eventos das entregas</h2>
              <p>Os registros são consultados pelos históricos individuais de cada entrega.</p>
            </div>
            <span className="entregas-eventos-contagem">{carregando ? "Carregando..." : `${eventosFiltrados.length} evento(s)`}</span>
          </div>

          <div className="entregas-eventos-filtros">
            <label className="entregas-eventos-busca">
              <Search size={17} />
              <input
                type="search"
                value={busca}
                onChange={(evento) => alterarBusca(evento.target.value)}
                placeholder="Buscar por entrega, pedido, status ou descrição..."
                aria-label="Buscar eventos"
              />
              {busca && <button type="button" onClick={() => alterarBusca("")} aria-label="Limpar busca"><X size={15} /></button>}
            </label>
            <label className="entregas-eventos-filtro">
              <Filter size={15} />
              <select value={filtroStatus} onChange={(evento) => alterarStatus(evento.target.value)} aria-label="Filtrar por status">
                <option value="todos">Todos os status</option>
                {statusDisponiveis.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="entregas-eventos-filtro">
              <Truck size={15} />
              <select value={filtroEntrega} onChange={(evento) => alterarEntrega(evento.target.value)} aria-label="Filtrar por entrega">
                <option value="todas">Todas as entregas</option>
                {entregasDisponiveis.map(([id, nome]) => <option key={id} value={id}>Entrega #{id} · {nome}</option>)}
              </select>
            </label>
          </div>

          {carregando ? (
            <div className="entregas-eventos-estado"><span className="entregas-eventos-spinner" />Carregando histórico das entregas...</div>
          ) : eventosPaginados.length === 0 ? (
            <div className="entregas-eventos-vazio">
              <span className="entregas-eventos-vazio-icone"><History size={26} /></span>
              <strong>{eventos.length === 0 ? "Nenhum evento encontrado" : "Nenhum evento corresponde aos filtros"}</strong>
              <p>{eventos.length === 0 ? "Quando uma entrega for cadastrada ou atualizada, seus eventos aparecerão aqui." : "Altere a busca ou os filtros para consultar outros registros."}</p>
              {eventos.length > 0 && <button type="button" onClick={() => { alterarBusca(""); alterarStatus("todos"); alterarEntrega("todas"); }}>Limpar filtros</button>}
            </div>
          ) : (
            <div className="entregas-eventos-lista">
              {eventosPaginados.map((evento, indice) => (
                <article className="entregas-eventos-item" key={`${evento.entregaId}-${evento.id}-${indice}`}>
                  <div className="entregas-eventos-linha-tempo" aria-hidden="true">
                    <span className="entregas-eventos-ponto"><CheckCircle2 size={16} /></span>
                    {indice !== eventosPaginados.length - 1 && <span className="entregas-eventos-linha" />}
                  </div>
                  <div className="entregas-eventos-cartao">
                    <div className="entregas-eventos-item-topo">
                      <div className="entregas-eventos-item-titulo">
                        <strong>{evento.descricao}</strong>
                        <span className={`entregas-eventos-status ${classeStatus(evento.status)}`}>{evento.status}</span>
                      </div>
                      <time>{formatarData(evento.criadoEm)}</time>
                    </div>
                    <div className="entregas-eventos-metadados">
                      <span><PackageCheck size={14} /> Entrega <strong>#{evento.entregaId}</strong></span>
                      {evento.pedidoId && <span><ClipboardList size={14} /> Pedido <strong>{evento.pedidoCodigo || `#${evento.pedidoId}`}</strong></span>}
                      {evento.transportadora && <span><Truck size={14} /> {evento.transportadora}</span>}
                    </div>
                    <small className="entregas-eventos-id">Evento #{evento.id}</small>
                  </div>
                </article>
              ))}
            </div>
          )}

          <footer className="entregas-eventos-rodape">
            <span>Mostrando {eventosPaginados.length} de {eventosFiltrados.length} evento(s).</span>
            <div className="entregas-eventos-paginacao">
              <button type="button" onClick={() => setPagina((atual) => Math.max(1, atual - 1))} disabled={carregando || paginaAtual <= 1} aria-label="Página anterior"><ChevronLeft size={17} /></button>
              <span>Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong></span>
              <button type="button" onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))} disabled={carregando || paginaAtual >= totalPaginas} aria-label="Próxima página"><ChevronRight size={17} /></button>
            </div>
          </footer>
        </section>

        <aside className="entregas-eventos-nota">
          <AlertCircle size={16} />
          <p><strong>Origem dos dados:</strong> esta tela reúne os eventos consultados em <code>/painel/entregas/{"{id}"}/eventos</code> para cada entrega retornada pela listagem administrativa.</p>
        </aside>
      </div>
    </main>
  );
}
