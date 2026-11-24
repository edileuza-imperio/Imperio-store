"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit3,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TicketCheck,
  Warehouse,
  X,
} from "lucide-react";
import ROTAS from "@/app/constants/rotas";

type ReservaEstoque = {
  status_id: number | null;
  id_reserva: number | null;
  pedido_id: number | null;
  estoque_local_id: number | null;
  produto_id: number | null;
  variacao_id: number | null;
  quantidade: string | number | null;
  status: string | null;
  expira_em: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type LocalEstoque = {
  id_estoque_local: number;
  nome: string | null;
  codigo: string | null;
  ativo?: boolean | number | string | null;
};

type Produto = {
  id_produto: number;
  nome: string;
  sku?: string | null;
  ativo?: boolean | number | string | null;
};

type StatusCadastro = {
  id_status: number;
  grupo: string | null;
  codigo: string | null;
  nome: string | null;
  ativo: boolean | number | string | null;
};

type ApiResposta = {
  sucesso?: boolean;
  mensagem?: string;
  message?: string;
  erro?: string;
  dados?: unknown;
  [chave: string]: unknown;
};

type FormularioReserva = {
  status_id: string;
  pedido_id: string;
  estoque_local_id: string;
  produto_id: string;
  variacao_id: string;
  quantidade: string;
  status: string;
  expira_em: string;
};

type PayloadReserva = {
  statusId: number;
  pedidoId: number;
  localId: number;
  produtoId: number;
  variacaoId: number | null;
  quantidade: string;
  status: string;
  expiraEm: string | null;
};

type ModoCadastro = "formulario" | "json";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const FORMULARIO_VAZIO: FormularioReserva = {
  status_id: "",
  pedido_id: "",
  estoque_local_id: "",
  produto_id: "",
  variacao_id: "",
  quantidade: "1.000",
  status: "",
  expira_em: "",
};

function ehAtivo(valor: boolean | number | string | null | undefined): boolean {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

function numero(valor: string | number | null | undefined): number {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

function formatarQuantidade(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function formatarData(valor: string | null | undefined): string {
  if (!valor) return "—";
  const data = new Date(valor.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function paraDateTimeLocal(valor: string | null | undefined): string {
  if (!valor) return "";
  return valor.replace(" ", "T").slice(0, 16);
}

function paraDataApi(valor: string): string | null {
  const limpo = valor.trim();
  if (!limpo) return null;
  return limpo.length === 16 ? `${limpo.replace("T", " ")}:00` : limpo.replace("T", " ");
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

async function requisitar<T>(rota: string, metodo = "GET", corpo?: unknown): Promise<T> {
  if (!API_URL) throw new Error("A variável NEXT_PUBLIC_API_URL não está configurada no ambiente do Next.js.");

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
    try { dados = JSON.parse(texto); } catch { dados = { mensagem: texto }; }
  }
  if (!resposta.ok || (dados && typeof dados === "object" && (dados as ApiResposta).sucesso === false)) {
    throw new Error(textoErro(dados, `A operação não foi concluída. HTTP ${resposta.status}.`));
  }
  return dados as T;
}

function extrairLista<T>(resposta: unknown, chave: string): T[] {
  if (Array.isArray(resposta)) return resposta as T[];
  if (!resposta || typeof resposta !== "object") throw new Error(`A API não retornou uma resposta válida para ${chave}.`);
  const raiz = resposta as Record<string, unknown>;
  const dados = raiz.dados && typeof raiz.dados === "object" && !Array.isArray(raiz.dados)
    ? raiz.dados as Record<string, unknown> : raiz;
  const lista = dados[chave];
  if (!Array.isArray(lista)) throw new Error(`A API não retornou uma lista válida de ${chave}.`);
  return lista as T[];
}

function nomeLocal(localId: number | null, locais: LocalEstoque[]): string {
  if (localId == null) return "Local não informado";
  const local = locais.find((item) => Number(item.id_estoque_local) === Number(localId));
  return local ? `${local.nome ?? "Local sem nome"} (${local.codigo ?? local.id_estoque_local})` : `Local #${localId}`;
}

function nomeProduto(produtoId: number | null, produtos: Produto[]): string {
  if (produtoId == null) return "Produto não informado";
  const produto = produtos.find((item) => Number(item.id_produto) === Number(produtoId));
  return produto ? produto.nome : `Produto #${produtoId}`;
}

function statusIdLabel(statusId: number | null, statusDisponiveis: StatusCadastro[]): string {
  if (statusId == null) return "Sem status";
  const item = statusDisponiveis.find((registro) => Number(registro.id_status) === Number(statusId));
  return item ? `${item.nome ?? item.codigo ?? "Status"} (#${statusId})` : `Status #${statusId}`;
}

function converterJsonParaPayload(valor: unknown): PayloadReserva {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    throw new Error("O JSON precisa ser um objeto com os campos da reserva.");
  }
  const obj = valor as Record<string, unknown>;
  const ler = (camel: string, snake: string) => obj[camel] !== undefined ? obj[camel] : obj[snake];
  const expira = ler("expiraEm", "expira_em");
  return {
    statusId: Number(ler("statusId", "status_id")),
    pedidoId: Number(ler("pedidoId", "pedido_id")),
    localId: Number(ler("localId", "estoque_local_id")),
    produtoId: Number(ler("produtoId", "produto_id")),
    variacaoId: ler("variacaoId", "variacao_id") == null || ler("variacaoId", "variacao_id") === ""
      ? null : Number(ler("variacaoId", "variacao_id")),
    quantidade: String(ler("quantidade", "quantidade") ?? ""),
    status: String(ler("status", "status") ?? "").trim(),
    expiraEm: expira == null || String(expira).trim() === "" ? null : String(expira).replace("T", " "),
  };
}

function validarPayload(payload: PayloadReserva): string | null {
  for (const [campo, valor] of [
    ["statusId", payload.statusId], ["pedidoId", payload.pedidoId], ["localId", payload.localId], ["produtoId", payload.produtoId],
  ] as [string, number][]) {
    if (!Number.isInteger(valor) || valor <= 0) return `Informe um ${campo} inteiro e maior que zero.`;
  }
  if (payload.variacaoId !== null && (!Number.isInteger(payload.variacaoId) || payload.variacaoId <= 0)) {
    return "O variacaoId deve ser um inteiro positivo ou null.";
  }
  if (!payload.quantidade.trim() || !Number.isFinite(Number(payload.quantidade.replace(",", "."))) || Number(payload.quantidade.replace(",", ".")) <= 0) {
    return "A quantidade da reserva deve ser numérica e maior que zero.";
  }
  if (!payload.status.trim()) return "Informe o status da reserva conforme o ENUM configurado no banco.";
  return null;
}

function criarJsonPayload(formulario: FormularioReserva): string {
  return JSON.stringify({
    statusId: Number(formulario.status_id),
    pedidoId: Number(formulario.pedido_id),
    localId: Number(formulario.estoque_local_id),
    produtoId: Number(formulario.produto_id),
    variacaoId: formulario.variacao_id.trim() === "" ? null : Number(formulario.variacao_id),
    quantidade: formulario.quantidade.trim().replace(",", "."),
    status: formulario.status.trim(),
    expiraEm: paraDataApi(formulario.expira_em),
  }, null, 2);
}

export default function ReservasEstoquePage() {
  const [reservas, setReservas] = useState<ReservaEstoque[]>([]);
  const [locais, setLocais] = useState<LocalEstoque[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusCadastro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [avisosAuxiliares, setAvisosAuxiliares] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalStatusAberto, setModalStatusAberto] = useState(false);
  const [reservaEditando, setReservaEditando] = useState<ReservaEstoque | null>(null);
  const [reservaStatus, setReservaStatus] = useState<ReservaEstoque | null>(null);
  const [formulario, setFormulario] = useState<FormularioReserva>(FORMULARIO_VAZIO);
  const [modoCadastro, setModoCadastro] = useState<ModoCadastro>("formulario");
  const [jsonReserva, setJsonReserva] = useState("");
  const [novoStatus, setNovoStatus] = useState("");

  const carregarReservas = useCallback(async (silencioso = false) => {
    if (silencioso) setAtualizando(true); else setCarregando(true);
    setErro("");
    try {
      const resposta = await requisitar<unknown>(ROTAS.ESTOQUE.PAINEL.RESERVAS.LISTAR);
      setReservas(extrairLista<ReservaEstoque>(resposta, "reservas"));
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível carregar as reservas de estoque.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  const carregarDadosAuxiliares = useCallback(async () => {
    const avisos: string[] = [];
    const [resultadoLocais, resultadoProdutos, resultadoStatus] = await Promise.allSettled([
      requisitar<unknown>(ROTAS.ESTOQUE.PAINEL.LOCAIS.LISTAR),
      requisitar<unknown>(ROTAS.PRODUTOS.PAINEL.LISTAR),
      requisitar<unknown>(ROTAS.PERMISSOES.STATUS.LISTAR_POR_GRUPO("GERAL")),
    ]);

    if (resultadoLocais.status === "fulfilled") {
      try { setLocais(extrairLista<LocalEstoque>(resultadoLocais.value, "locais")); }
      catch { setLocais([]); avisos.push("Não foi possível interpretar os locais. Você poderá informar o ID manualmente no JSON."); }
    } else { setLocais([]); avisos.push("Não foi possível consultar os locais. Confira a permissão estoque.visualizar."); }

    if (resultadoProdutos.status === "fulfilled") {
      try {
        const resposta = resultadoProdutos.value as { dados?: { produtos?: Produto[] }; produtos?: Produto[] };
        const lista = resposta?.dados?.produtos ?? resposta?.produtos;
        if (!Array.isArray(lista)) throw new Error("Lista de produtos ausente.");
        setProdutos(lista);
      } catch { setProdutos([]); avisos.push("Não foi possível interpretar os produtos. Você poderá informar o ID manualmente no JSON."); }
    } else { setProdutos([]); avisos.push("Não foi possível consultar os produtos. Confira a rota de produtos e a permissão de leitura."); }

    if (resultadoStatus.status === "fulfilled") {
      try { setStatusDisponiveis(extrairLista<StatusCadastro>(resultadoStatus.value, "status")); }
      catch { setStatusDisponiveis([]); avisos.push("Catálogo de status indisponível. Informe o status_id manualmente no JSON."); }
    } else { setStatusDisponiveis([]); avisos.push("Não foi possível consultar o catálogo de status."); }
    setAvisosAuxiliares(avisos);
  }, []);

  useEffect(() => {
    void carregarReservas();
    void carregarDadosAuxiliares();
  }, [carregarReservas, carregarDadosAuxiliares]);

  const statusExistentes = useMemo(() => Array.from(new Set(
    reservas.map((reserva) => reserva.status?.trim()).filter((valor): valor is string => Boolean(valor)),
  )).sort((a, b) => a.localeCompare(b, "pt-BR")), [reservas]);

  const reservasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return reservas.filter((reserva) => {
      const campos = [
        reserva.id_reserva == null ? "" : String(reserva.id_reserva),
        reserva.pedido_id == null ? "" : String(reserva.pedido_id),
        reserva.produto_id == null ? "" : String(reserva.produto_id),
        reserva.variacao_id == null ? "" : String(reserva.variacao_id),
        reserva.status ?? "",
        nomeLocal(reserva.estoque_local_id, locais),
        nomeProduto(reserva.produto_id, produtos),
      ];
      const correspondeBusca = !termo || campos.some((campo) => campo.toLocaleLowerCase("pt-BR").includes(termo));
      const correspondeStatus = filtroStatus === "todos" || (reserva.status ?? "") === filtroStatus;
      return correspondeBusca && correspondeStatus;
    });
  }, [reservas, locais, produtos, busca, filtroStatus]);

  const totais = useMemo(() => ({
    registros: reservas.length,
    quantidade: reservas.reduce((soma, reserva) => soma + numero(reserva.quantidade), 0),
    comExpiracao: reservas.filter((reserva) => Boolean(reserva.expira_em)).length,
  }), [reservas]);

  function abrirNovaReserva() {
    const localPadrao = locais.find((local) => ehAtivo(local.ativo));
    setReservaEditando(null);
    setFormulario({
      ...FORMULARIO_VAZIO,
      status_id: statusDisponiveis.find((item) => ehAtivo(item.ativo))?.id_status
        ? String(statusDisponiveis.find((item) => ehAtivo(item.ativo))?.id_status) : "",
      estoque_local_id: localPadrao ? String(localPadrao.id_estoque_local) : "",
      produto_id: produtos[0]?.id_produto ? String(produtos[0].id_produto) : "",
      status: statusExistentes[0] ?? "",
    });
    setModoCadastro("formulario");
    setJsonReserva("");
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirEdicao(reserva: ReservaEstoque) {
    setReservaEditando(reserva);
    setFormulario({
      status_id: reserva.status_id != null ? String(reserva.status_id) : "",
      pedido_id: reserva.pedido_id != null ? String(reserva.pedido_id) : "",
      estoque_local_id: reserva.estoque_local_id != null ? String(reserva.estoque_local_id) : "",
      produto_id: reserva.produto_id != null ? String(reserva.produto_id) : "",
      variacao_id: reserva.variacao_id != null ? String(reserva.variacao_id) : "",
      quantidade: String(reserva.quantidade ?? "1.000"),
      status: reserva.status ?? "",
      expira_em: paraDateTimeLocal(reserva.expira_em),
    });
    setModoCadastro("formulario");
    setJsonReserva("");
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirAlteracaoStatus(reserva: ReservaEstoque) {
    setReservaStatus(reserva);
    setNovoStatus(reserva.status ?? "");
    setErro("");
    setSucesso("");
    setModalStatusAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setReservaEditando(null);
  }

  function payloadDoFormulario(): PayloadReserva {
    return {
      statusId: Number(formulario.status_id),
      pedidoId: Number(formulario.pedido_id),
      localId: Number(formulario.estoque_local_id),
      produtoId: Number(formulario.produto_id),
      variacaoId: formulario.variacao_id.trim() === "" ? null : Number(formulario.variacao_id),
      quantidade: formulario.quantidade.trim().replace(",", "."),
      status: formulario.status.trim(),
      expiraEm: paraDataApi(formulario.expira_em),
    };
  }

  function alternarModo(novoModo: ModoCadastro) {
    if (novoModo === modoCadastro) return;
    if (novoModo === "json") {
      setJsonReserva(criarJsonPayload(formulario));
      setModoCadastro("json");
      return;
    }
    try {
      const payload = converterJsonParaPayload(JSON.parse(jsonReserva));
      setFormulario({
        status_id: String(payload.statusId || ""),
        pedido_id: String(payload.pedidoId || ""),
        estoque_local_id: String(payload.localId || ""),
        produto_id: String(payload.produtoId || ""),
        variacao_id: payload.variacaoId == null ? "" : String(payload.variacaoId),
        quantidade: payload.quantidade,
        status: payload.status,
        expira_em: paraDateTimeLocal(payload.expiraEm),
      });
      setModoCadastro("formulario");
      setErro("");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Corrija o JSON antes de voltar ao formulário.");
    }
  }

  async function enviarReserva(payload: PayloadReserva) {
    const mensagemValidacao = validarPayload(payload);
    if (mensagemValidacao) { setErro(mensagemValidacao); return; }
    setSalvando(true);
    setErro("");
    try {
      if (reservaEditando?.id_reserva) {
        await requisitar(ROTAS.ESTOQUE.PAINEL.RESERVAS.ATUALIZAR(reservaEditando.id_reserva), "PUT", payload);
        setSucesso("Reserva de estoque atualizada com sucesso.");
      } else {
        await requisitar(ROTAS.ESTOQUE.PAINEL.RESERVAS.CADASTRAR, "POST", payload);
        setSucesso("Reserva de estoque cadastrada com sucesso.");
      }
      setModalAberto(false);
      setReservaEditando(null);
      await carregarReservas(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar a reserva.");
    } finally { setSalvando(false); }
  }

  async function salvarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (modoCadastro === "formulario") {
      await enviarReserva(payloadDoFormulario());
      return;
    }
    try { await enviarReserva(converterJsonParaPayload(JSON.parse(jsonReserva))); }
    catch (falha) { setErro(falha instanceof Error ? falha.message : "JSON inválido."); }
  }

  async function salvarNovoStatus(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!reservaStatus?.id_reserva) return;
    if (!novoStatus.trim()) { setErro("Informe o novo status conforme o ENUM do banco."); return; }
    setSalvando(true);
    setErro("");
    try {
      await requisitar(ROTAS.ESTOQUE.PAINEL.RESERVAS.ALTERAR_STATUS(reservaStatus.id_reserva), "PUT", { status: novoStatus.trim() });
      setModalStatusAberto(false);
      setReservaStatus(null);
      setSucesso(`Status da reserva #${reservaStatus.id_reserva} atualizado com sucesso.`);
      await carregarReservas(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível alterar o status.");
    } finally { setSalvando(false); }
  }

  return (
    <main className="reservas-estoque">
      <div className="reservas-estoque__container">
        <header className="reservas-estoque__cabecalho">
          <div>
            <span className="reservas-estoque__eyebrow">UNIVERSO IMPÉRIO · ESTOQUE</span>
            <h1>Reservas de estoque</h1>
            <p>Controle as quantidades reservadas para pedidos, acompanhe o status e gerencie os prazos de expiração.</p>
          </div>
          <div className="reservas-estoque__cabecalho-acoes">
            <button type="button" className="reservas-estoque__botao reservas-estoque__botao--secundario" onClick={() => { void carregarReservas(true); void carregarDadosAuxiliares(); }} disabled={atualizando}>
              <RefreshCw size={16} className={atualizando ? "reservas-estoque__girando" : ""} /> Atualizar
            </button>
            <button type="button" className="reservas-estoque__botao reservas-estoque__botao--primario" onClick={abrirNovaReserva}>
              <Plus size={17} /> Nova reserva
            </button>
          </div>
        </header>

        {sucesso && <div className="reservas-estoque__alerta reservas-estoque__alerta--sucesso"><CheckCircle2 size={17} /><span>{sucesso}</span><button type="button" onClick={() => setSucesso("")} aria-label="Fechar aviso"><X size={15} /></button></div>}
        {erro && !modalAberto && !modalStatusAberto && <div className="reservas-estoque__alerta reservas-estoque__alerta--erro"><AlertCircle size={17} /><span>{erro}</span><button type="button" onClick={() => setErro("")} aria-label="Fechar aviso"><X size={15} /></button></div>}
        {avisosAuxiliares.length > 0 && <div className="reservas-estoque__avisos">{avisosAuxiliares.map((aviso) => <div key={aviso}><AlertCircle size={15} />{aviso}</div>)}</div>}

        <section className="reservas-estoque__indicadores" aria-label="Resumo das reservas">
          <article className="reservas-estoque__indicador"><span className="reservas-estoque__indicador-icone"><TicketCheck size={19} /></span><div><small>Reservas cadastradas</small><strong>{totais.registros.toLocaleString("pt-BR")}</strong><span>Registros encontrados</span></div></article>
          <article className="reservas-estoque__indicador"><span className="reservas-estoque__indicador-icone reservas-estoque__indicador-icone--rosa"><Package size={19} /></span><div><small>Quantidade reservada</small><strong>{formatarQuantidade(totais.quantidade)}</strong><span>Soma das reservas cadastradas</span></div></article>
          <article className="reservas-estoque__indicador"><span className="reservas-estoque__indicador-icone reservas-estoque__indicador-icone--areia"><CalendarClock size={19} /></span><div><small>Com data de expiração</small><strong>{totais.comExpiracao.toLocaleString("pt-BR")}</strong><span>Reservas com prazo informado</span></div></article>
        </section>

        <section className="reservas-estoque__painel">
          <div className="reservas-estoque__painel-topo">
            <div><span className="reservas-estoque__secao-label">GERENCIAMENTO</span><h2>Reservas cadastradas</h2><p>Pesquise por pedido, produto, local, ID ou status.</p></div>
            <span className="reservas-estoque__contador">{reservasFiltradas.length} {reservasFiltradas.length === 1 ? "registro" : "registros"}</span>
          </div>

          <div className="reservas-estoque__filtros">
            <label className="reservas-estoque__busca"><Search size={17} /><input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar reserva, pedido, produto ou local..." /></label>
            <label className="reservas-estoque__filtro-status"><Filter size={16} /><select value={filtroStatus} onChange={(evento) => setFiltroStatus(evento.target.value)} aria-label="Filtrar por status"><option value="todos">Todos os status</option>{statusExistentes.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          </div>

          <div className="reservas-estoque__tabela-wrap">
            <table className="reservas-estoque__tabela">
              <thead><tr><th>Reserva / Pedido</th><th>Produto</th><th>Local</th><th>Quantidade</th><th>Status</th><th>Expira em</th><th>Criada em</th><th className="reservas-estoque__th-acoes">Ações</th></tr></thead>
              <tbody>
                {carregando ? <tr><td className="reservas-estoque__estado" colSpan={8}><RefreshCw size={20} className="reservas-estoque__girando" /><strong>Carregando reservas…</strong><span>Consultando os registros no banco de dados.</span></td></tr>
                  : erro && reservas.length === 0 ? <tr><td className="reservas-estoque__estado" colSpan={8}><AlertCircle size={22} /><strong>Não foi possível carregar as reservas</strong><span>Confira a conexão com a API e tente atualizar.</span></td></tr>
                    : reservasFiltradas.length === 0 ? <tr><td className="reservas-estoque__estado" colSpan={8}><TicketCheck size={24} /><strong>Nenhuma reserva encontrada</strong><span>Cadastre uma nova reserva ou altere os filtros da pesquisa.</span></td></tr>
                      : reservasFiltradas.map((reserva) => (
                        <tr key={reserva.id_reserva ?? `${reserva.pedido_id}-${reserva.produto_id}-${reserva.criado_em}`}>
                          <td><div className="reservas-estoque__identificacao"><span className="reservas-estoque__mini-icone"><TicketCheck size={16} /></span><div><strong>Reserva #{reserva.id_reserva ?? "—"}</strong><small>Pedido #{reserva.pedido_id ?? "—"}</small></div></div></td>
                          <td><div className="reservas-estoque__produto"><strong>{nomeProduto(reserva.produto_id, produtos)}</strong><small>Produto #{reserva.produto_id ?? "—"}{reserva.variacao_id != null ? ` · Variação #${reserva.variacao_id}` : ""}</small></div></td>
                          <td><span className="reservas-estoque__local"><Warehouse size={14} />{nomeLocal(reserva.estoque_local_id, locais)}</span></td>
                          <td className="reservas-estoque__numero">{formatarQuantidade(numero(reserva.quantidade))}</td>
                          <td><span className="reservas-estoque__status"><i />{reserva.status || "Sem status"}</span></td>
                          <td><span className="reservas-estoque__data"><CalendarClock size={13} />{formatarData(reserva.expira_em)}</span></td>
                          <td><span className="reservas-estoque__data"><Clock3 size={13} />{formatarData(reserva.criado_em)}</span></td>
                          <td><div className="reservas-estoque__acoes-linha"><button className="reservas-estoque__acao reservas-estoque__acao--status" type="button" onClick={() => abrirAlteracaoStatus(reserva)} title="Alterar somente o status" aria-label={`Alterar status da reserva ${reserva.id_reserva}`}><SlidersHorizontal size={15} /></button><button className="reservas-estoque__acao" type="button" onClick={() => abrirEdicao(reserva)} title="Editar reserva" aria-label={`Editar reserva ${reserva.id_reserva}`}><Edit3 size={15} /></button></div></td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>

          <div className="reservas-estoque__nota"><AlertCircle size={16} /><span>O backend não possui rota de exclusão de reservas. A tela disponibiliza edição completa e alteração isolada do status, preservando o histórico vinculado aos pedidos.</span></div>
        </section>

        <footer className="reservas-estoque__rodape"><span><TicketCheck size={14} /> UNIVERSO IMPÉRIO · CONTROLE DE ESTOQUE</span><Link href={ROTAS.PAGINAS.PAINEL.ESTOQUE.LISTAR}><ArrowLeft size={14} /> Voltar ao painel de estoque</Link></footer>
      </div>

      {modalAberto && (
        <div className="reservas-estoque__overlay" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fecharModal(); }}>
          <section className="reservas-estoque__modal" role="dialog" aria-modal="true" aria-labelledby="reserva-modal-titulo">
            <header className="reservas-estoque__modal-cabecalho"><div><span className="reservas-estoque__secao-label">IDENTIFICAÇÃO E CONTROLE</span><h2 id="reserva-modal-titulo">{reservaEditando ? `Editar reserva #${reservaEditando.id_reserva}` : "Cadastrar reserva"}</h2><p>Preencha os dados que vinculam a reserva ao pedido e ao estoque.</p></div><button type="button" onClick={fecharModal} aria-label="Fechar modal"><X size={18} /></button></header>

            <div className="reservas-estoque__alternador"><button type="button" className={modoCadastro === "formulario" ? "ativo" : ""} onClick={() => alternarModo("formulario")}>Formulário</button><button type="button" className={modoCadastro === "json" ? "ativo" : ""} onClick={() => alternarModo("json")}>JSON</button></div>

            <form onSubmit={salvarFormulario} className="reservas-estoque__formulario">
              {modoCadastro === "formulario" ? <>
                <label className="reservas-estoque__campo"><span>Local de estoque <b>*</b></span>{locais.length > 0 ? <select required value={formulario.estoque_local_id} onChange={(evento) => setFormulario({ ...formulario, estoque_local_id: evento.target.value })}><option value="">Selecione um local</option>{locais.map((local) => <option key={local.id_estoque_local} value={String(local.id_estoque_local)}>{local.nome ?? `Local #${local.id_estoque_local}`} — {local.codigo ?? "sem código"}</option>)}</select> : <input required type="number" min="1" value={formulario.estoque_local_id} onChange={(evento) => setFormulario({ ...formulario, estoque_local_id: evento.target.value })} placeholder="ID do local" />}<small>Local onde a quantidade ficará reservada.</small></label>
                <label className="reservas-estoque__campo"><span>Produto <b>*</b></span>{produtos.length > 0 ? <select required value={formulario.produto_id} onChange={(evento) => setFormulario({ ...formulario, produto_id: evento.target.value })}><option value="">Selecione um produto</option>{produtos.map((produto) => <option key={produto.id_produto} value={String(produto.id_produto)}>{produto.nome} — #{produto.id_produto}{produto.sku ? ` · ${produto.sku}` : ""}</option>)}</select> : <input required type="number" min="1" value={formulario.produto_id} onChange={(evento) => setFormulario({ ...formulario, produto_id: evento.target.value })} placeholder="ID do produto" />}<small>Produto relacionado ao pedido.</small></label>
                <label className="reservas-estoque__campo"><span>ID do pedido <b>*</b></span><input required type="number" min="1" step="1" value={formulario.pedido_id} onChange={(evento) => setFormulario({ ...formulario, pedido_id: evento.target.value })} placeholder="Ex.: 125" /><small>Informe o ID de um pedido existente.</small></label>
                <label className="reservas-estoque__campo"><span>ID da variação</span><input type="number" min="1" step="1" value={formulario.variacao_id} onChange={(evento) => setFormulario({ ...formulario, variacao_id: evento.target.value })} placeholder="Opcional" /><small>Deixe vazio quando não houver variação.</small></label>
                <label className="reservas-estoque__campo"><span>Status ID <b>*</b></span>{statusDisponiveis.length > 0 ? <select required value={formulario.status_id} onChange={(evento) => setFormulario({ ...formulario, status_id: evento.target.value })}><option value="">Selecione o status</option>{statusDisponiveis.map((item) => <option key={item.id_status} value={String(item.id_status)}>{item.id_status} — {item.grupo ?? ""} · {item.nome ?? item.codigo ?? "Status"}</option>)}</select> : <input required type="number" min="1" value={formulario.status_id} onChange={(evento) => setFormulario({ ...formulario, status_id: evento.target.value })} placeholder="ID do status" />}<small>ID precisa existir no catálogo de status.</small></label>
                <label className="reservas-estoque__campo"><span>Quantidade <b>*</b></span><input required type="number" min="0.001" step="0.001" value={formulario.quantidade} onChange={(evento) => setFormulario({ ...formulario, quantidade: evento.target.value })} placeholder="1.000" /><small>A quantidade deve ser maior que zero.</small></label>
                <label className="reservas-estoque__campo"><span>Status da reserva (ENUM) <b>*</b></span><input required list="reservas-status-existentes" value={formulario.status} onChange={(evento) => setFormulario({ ...formulario, status: evento.target.value })} placeholder="Digite o status válido do banco" /><datalist id="reservas-status-existentes">{statusExistentes.map((status) => <option key={status} value={status} />)}</datalist><small>Use exatamente um valor permitido em estoque_reservas.status. Sugestões vêm de reservas já cadastradas; os valores do ENUM não foram presumidos.</small></label>
                <label className="reservas-estoque__campo"><span>Expira em</span><input type="datetime-local" value={formulario.expira_em} onChange={(evento) => setFormulario({ ...formulario, expira_em: evento.target.value })} /><small>Opcional. Informe a data e hora limite da reserva.</small></label>
              </> : <label className="reservas-estoque__campo reservas-estoque__campo--json"><span>Payload JSON <b>*</b></span><textarea spellCheck={false} autoCapitalize="off" autoCorrect="off" value={jsonReserva} onChange={(evento) => setJsonReserva(evento.target.value)} rows={15} placeholder={'{\n  "statusId": 1,\n  "pedidoId": 125,\n  "localId": 1,\n  "produtoId": 5,\n  "variacaoId": null,\n  "quantidade": "1.000",\n  "status": "valor_enum_do_banco",\n  "expiraEm": null\n}'} /><small>O JSON aceita camelCase (statusId, pedidoId, localId...) ou snake_case (status_id, pedido_id, estoque_local_id...).</small></label>}

              {erro && <div className="reservas-estoque__erro-formulario"><AlertCircle size={16} />{erro}</div>}
              <div className="reservas-estoque__modal-acoes"><button type="button" className="reservas-estoque__botao reservas-estoque__botao--secundario" onClick={fecharModal} disabled={salvando}>Cancelar</button><button type="submit" className="reservas-estoque__botao reservas-estoque__botao--primario" disabled={salvando}>{salvando ? <RefreshCw size={16} className="reservas-estoque__girando" /> : <CheckCircle2 size={16} />}{salvando ? "Salvando…" : reservaEditando ? "Salvar alterações" : "Cadastrar reserva"}</button></div>
            </form>
          </section>
        </div>
      )}

      {modalStatusAberto && reservaStatus && (
        <div className="reservas-estoque__overlay" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget && !salvando) setModalStatusAberto(false); }}>
          <section className="reservas-estoque__modal reservas-estoque__modal--compacto" role="dialog" aria-modal="true" aria-labelledby="status-modal-titulo">
            <header className="reservas-estoque__modal-cabecalho"><div><span className="reservas-estoque__secao-label">ATUALIZAÇÃO RÁPIDA</span><h2 id="status-modal-titulo">Alterar status</h2><p>Reserva #{reservaStatus.id_reserva} · Pedido #{reservaStatus.pedido_id}</p></div><button type="button" onClick={() => setModalStatusAberto(false)} aria-label="Fechar modal"><X size={18} /></button></header>
            <form onSubmit={salvarNovoStatus} className="reservas-estoque__formulario reservas-estoque__formulario--uma-coluna">
              <label className="reservas-estoque__campo"><span>Novo status (ENUM) <b>*</b></span><input required list="reservas-status-existentes-rapido" value={novoStatus} onChange={(evento) => setNovoStatus(evento.target.value)} placeholder="Digite o status permitido pelo banco" /><datalist id="reservas-status-existentes-rapido">{statusExistentes.map((status) => <option key={status} value={status} />)}</datalist><small>O controller altera somente a coluna status. Informe um valor aceito pelo ENUM do MySQL.</small></label>
              {erro && <div className="reservas-estoque__erro-formulario"><AlertCircle size={16} />{erro}</div>}
              <div className="reservas-estoque__modal-acoes"><button type="button" className="reservas-estoque__botao reservas-estoque__botao--secundario" onClick={() => setModalStatusAberto(false)} disabled={salvando}>Cancelar</button><button type="submit" className="reservas-estoque__botao reservas-estoque__botao--primario" disabled={salvando}>{salvando ? <RefreshCw size={16} className="reservas-estoque__girando" /> : <CheckCircle2 size={16} />}{salvando ? "Salvando…" : "Atualizar status"}</button></div>
            </form>
          </section>
        </div>
      )}

      <style jsx>{`
        .reservas-estoque { min-height: 100vh; padding: 34px 22px 28px; background: var(--ui-fundo); color: var(--ui-texto); }
        .reservas-estoque__container { width: min(100%, var(--ui-largura-maxima, 1440px)); margin: 0 auto; }
        .reservas-estoque__cabecalho { display: flex; align-items: flex-end; justify-content: space-between; gap: 22px; margin-bottom: 26px; }
        .reservas-estoque__eyebrow, .reservas-estoque__secao-label { display: inline-block; color: var(--ui-rosa-medio); font-size: .66rem; font-weight: 850; letter-spacing: .15em; }
        .reservas-estoque__cabecalho h1 { margin: 7px 0 8px; color: var(--ui-vinho-escuro); font-family: var(--ui-fonte-titulo); font-size: clamp(1.8rem, 3vw, 2.55rem); font-weight: 850; letter-spacing: -.055em; }
        .reservas-estoque__cabecalho p { max-width: 690px; margin: 0; color: var(--ui-texto-secundario); font-size: .86rem; line-height: 1.65; }
        .reservas-estoque__cabecalho-acoes { display: flex; flex-wrap: wrap; gap: 9px; }
        .reservas-estoque__botao { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; border: 1px solid transparent; border-radius: var(--ui-raio-md, 12px); padding: 0 15px; font-size: .76rem; font-weight: 800; cursor: pointer; transition: var(--ui-transicao-padrao, .2s ease); }
        .reservas-estoque__botao:disabled { opacity: .6; cursor: not-allowed; }
        .reservas-estoque__botao--primario { color: #fff; background: var(--ui-vinho); box-shadow: var(--ui-sombra-media); }
        .reservas-estoque__botao--primario:hover:not(:disabled) { background: var(--ui-vinho-escuro); transform: translateY(-1px); }
        .reservas-estoque__botao--secundario { color: var(--ui-vinho); border-color: var(--ui-borda); background: var(--ui-superficie); }
        .reservas-estoque__botao--secundario:hover:not(:disabled) { border-color: var(--ui-vinho); background: var(--ui-superficie-suave); }
        .reservas-estoque__alerta, .reservas-estoque__avisos > div { display: flex; align-items: center; gap: 10px; margin: 0 0 13px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-md, 12px); padding: 12px 14px; background: var(--ui-superficie); font-size: .77rem; }
        .reservas-estoque__alerta--sucesso { color: var(--ui-sucesso); border-color: color-mix(in srgb, var(--ui-sucesso) 25%, var(--ui-borda)); }
        .reservas-estoque__alerta--erro { color: var(--ui-erro); border-color: color-mix(in srgb, var(--ui-erro) 25%, var(--ui-borda)); }
        .reservas-estoque__alerta span { flex: 1; }
        .reservas-estoque__alerta button { display: grid; place-items: center; border: 0; color: inherit; background: transparent; cursor: pointer; }
        .reservas-estoque__avisos { margin-bottom: 14px; }
        .reservas-estoque__avisos > div { margin-bottom: 7px; color: var(--ui-alerta); }
        .reservas-estoque__indicadores { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
        .reservas-estoque__indicador { display: flex; align-items: center; gap: 14px; min-height: 112px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-lg, 16px); padding: 17px 19px; background: var(--ui-superficie); box-shadow: var(--ui-sombra-suave); }
        .reservas-estoque__indicador-icone { display: grid; width: 43px; height: 43px; flex: 0 0 43px; place-items: center; border-radius: 14px; color: var(--ui-vinho); background: var(--ui-vinho-suave); }
        .reservas-estoque__indicador-icone--rosa { color: #a64f6d; background: var(--ui-rosa-claro); }
        .reservas-estoque__indicador-icone--areia { color: #96734d; background: var(--ui-blush); }
        .reservas-estoque__indicador div { display: grid; gap: 3px; min-width: 0; }
        .reservas-estoque__indicador small { color: var(--ui-texto-secundario); font-size: .7rem; font-weight: 700; }
        .reservas-estoque__indicador strong { color: var(--ui-vinho-escuro); font-size: 1.55rem; line-height: 1.15; font-weight: 850; letter-spacing: -.045em; }
        .reservas-estoque__indicador span:last-child { color: var(--ui-texto-claro); font-size: .65rem; }
        .reservas-estoque__painel { overflow: hidden; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-lg, 16px); background: var(--ui-superficie); box-shadow: var(--ui-sombra-suave); }
        .reservas-estoque__painel-topo { display: flex; align-items: flex-end; justify-content: space-between; gap: 15px; padding: 21px 22px 17px; }
        .reservas-estoque__painel-topo h2 { margin: 5px 0 4px; color: var(--ui-vinho-escuro); font-size: 1.1rem; font-weight: 850; letter-spacing: -.035em; }
        .reservas-estoque__painel-topo p { margin: 0; color: var(--ui-texto-secundario); font-size: .73rem; }
        .reservas-estoque__contador { border: 1px solid var(--ui-borda); border-radius: 999px; padding: 6px 10px; color: var(--ui-texto-secundario); background: var(--ui-superficie-suave); font-size: .66rem; font-weight: 750; white-space: nowrap; }
        .reservas-estoque__filtros { display: flex; gap: 10px; padding: 0 22px 17px; }
        .reservas-estoque__busca, .reservas-estoque__filtro-status { display: flex; align-items: center; gap: 9px; min-height: 41px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-md, 12px); padding: 0 12px; color: var(--ui-texto-claro); background: var(--ui-superficie); }
        .reservas-estoque__busca { flex: 1; }
        .reservas-estoque__busca input, .reservas-estoque__filtro-status select { width: 100%; min-width: 0; border: 0; outline: 0; color: var(--ui-texto); background: transparent; font: inherit; font-size: .74rem; }
        .reservas-estoque__filtro-status { min-width: 190px; }
        .reservas-estoque__tabela-wrap { overflow-x: auto; }
        .reservas-estoque__tabela { width: 100%; border-collapse: collapse; white-space: nowrap; }
        .reservas-estoque__tabela th { padding: 11px 13px; color: var(--ui-texto-claro); background: var(--ui-superficie-suave); text-align: left; font-size: .62rem; font-weight: 850; letter-spacing: .065em; text-transform: uppercase; }
        .reservas-estoque__tabela td { border-top: 1px solid var(--ui-borda-suave); padding: 13px; color: var(--ui-texto); font-size: .72rem; }
        .reservas-estoque__tabela tbody tr:hover { background: var(--ui-superficie-suave); }
        .reservas-estoque__identificacao, .reservas-estoque__produto { display: flex; align-items: center; gap: 9px; }
        .reservas-estoque__identificacao > div, .reservas-estoque__produto { min-width: 0; }
        .reservas-estoque__identificacao strong, .reservas-estoque__produto strong { display: block; color: var(--ui-vinho-escuro); font-size: .72rem; font-weight: 800; }
        .reservas-estoque__identificacao small, .reservas-estoque__produto small { display: block; margin-top: 3px; color: var(--ui-texto-claro); font-size: .63rem; }
        .reservas-estoque__mini-icone { display: grid; width: 32px; height: 32px; flex: 0 0 32px; place-items: center; border-radius: 10px; color: var(--ui-vinho); background: var(--ui-vinho-suave); }
        .reservas-estoque__local, .reservas-estoque__data { display: inline-flex; align-items: center; gap: 6px; color: var(--ui-texto-secundario); font-size: .68rem; }
        .reservas-estoque__numero { color: var(--ui-vinho-escuro) !important; font-weight: 850; font-variant-numeric: tabular-nums; }
        .reservas-estoque__status { display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--ui-borda); border-radius: 999px; padding: 5px 9px; color: var(--ui-vinho); background: var(--ui-vinho-suave); font-size: .65rem; font-weight: 800; }
        .reservas-estoque__status i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .reservas-estoque__acoes-linha { display: flex; gap: 6px; }
        .reservas-estoque__acao { display: grid; width: 31px; height: 31px; place-items: center; border: 1px solid var(--ui-borda); border-radius: 9px; color: var(--ui-vinho); background: var(--ui-superficie); cursor: pointer; }
        .reservas-estoque__acao:hover { border-color: var(--ui-vinho); background: var(--ui-vinho-suave); }
        .reservas-estoque__acao--status { color: #9a6a34; }
        .reservas-estoque__estado { height: 180px; text-align: center !important; color: var(--ui-texto-claro) !important; }
        .reservas-estoque__estado svg, .reservas-estoque__estado strong, .reservas-estoque__estado span { display: block; margin: 0 auto 8px; }
        .reservas-estoque__estado strong { color: var(--ui-vinho-escuro); font-size: .8rem; }
        .reservas-estoque__estado span { font-size: .69rem; }
        .reservas-estoque__nota { display: flex; align-items: flex-start; gap: 9px; margin: 4px 22px 18px; border: 1px solid var(--ui-borda); border-radius: 11px; padding: 11px 13px; color: var(--ui-texto-secundario); background: var(--ui-superficie-suave); font-size: .68rem; line-height: 1.55; }
        .reservas-estoque__nota svg { flex: 0 0 auto; color: var(--ui-info); }
        .reservas-estoque__rodape { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 18px; color: var(--ui-texto-claro); font-size: .62rem; font-weight: 800; letter-spacing: .07em; }
        .reservas-estoque__rodape span, .reservas-estoque__rodape a { display: inline-flex; align-items: center; gap: 7px; }
        .reservas-estoque__rodape a { color: var(--ui-vinho); text-decoration: none; letter-spacing: 0; }
        .reservas-estoque__overlay { position: fixed; z-index: 1000; inset: 0; display: grid; place-items: center; overflow-y: auto; padding: 22px; background: rgb(35 19 25 / 48%); backdrop-filter: blur(5px); }
        .reservas-estoque__modal { width: min(100%, 700px); max-height: min(92vh, 900px); overflow-y: auto; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-xl, 24px); padding: 23px; background: var(--ui-superficie); box-shadow: var(--ui-sombra-destaque); }
        .reservas-estoque__modal--compacto { width: min(100%, 520px); }
        .reservas-estoque__modal-cabecalho { display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; margin-bottom: 18px; }
        .reservas-estoque__modal-cabecalho h2 { margin: 5px 0 4px; color: var(--ui-vinho-escuro); font-size: 1.35rem; font-weight: 850; letter-spacing: -.04em; }
        .reservas-estoque__modal-cabecalho p { margin: 0; color: var(--ui-texto-secundario); font-size: .72rem; line-height: 1.5; }
        .reservas-estoque__modal-cabecalho > button { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-sm, 8px); color: var(--ui-vinho); background: var(--ui-superficie); cursor: pointer; }
        .reservas-estoque__alternador { display: inline-flex; gap: 4px; margin-bottom: 16px; border: 1px solid var(--ui-borda); border-radius: 11px; padding: 4px; background: var(--ui-superficie-suave); }
        .reservas-estoque__alternador button { border: 0; border-radius: 8px; padding: 8px 13px; color: var(--ui-texto-secundario); background: transparent; font-size: .7rem; font-weight: 800; cursor: pointer; }
        .reservas-estoque__alternador button.ativo { color: #fff; background: var(--ui-vinho); box-shadow: var(--ui-sombra-suave); }
        .reservas-estoque__formulario { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 12px; }
        .reservas-estoque__formulario--uma-coluna { grid-template-columns: 1fr; }
        .reservas-estoque__campo { display: flex; min-width: 0; flex-direction: column; gap: 6px; color: var(--ui-texto); font-size: .68rem; font-weight: 800; }
        .reservas-estoque__campo span b { color: var(--ui-erro); }
        .reservas-estoque__campo input, .reservas-estoque__campo select, .reservas-estoque__campo textarea { width: 100%; min-width: 0; min-height: 42px; box-sizing: border-box; border: 1px solid var(--ui-borda); border-radius: 10px; outline: none; padding: 0 11px; color: var(--ui-texto); background: var(--ui-superficie); font: inherit; font-size: .72rem; font-weight: 500; }
        .reservas-estoque__campo textarea { min-height: 280px; resize: vertical; padding: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72rem; line-height: 1.6; tab-size: 2; }
        .reservas-estoque__campo input:focus, .reservas-estoque__campo select:focus, .reservas-estoque__campo textarea:focus { border-color: var(--ui-vinho); box-shadow: 0 0 0 3px var(--ui-vinho-suave); }
        .reservas-estoque__campo small { color: var(--ui-texto-claro); font-size: .59rem; font-weight: 500; line-height: 1.45; }
        .reservas-estoque__campo--json { grid-column: 1 / -1; }
        .reservas-estoque__erro-formulario { grid-column: 1 / -1; display: flex; align-items: flex-start; gap: 8px; border: 1px solid color-mix(in srgb, var(--ui-erro) 25%, var(--ui-borda)); border-radius: 10px; padding: 10px 12px; color: var(--ui-erro); background: var(--ui-superficie); font-size: .69rem; line-height: 1.45; }
        .reservas-estoque__erro-formulario svg { flex: 0 0 auto; }
        .reservas-estoque__modal-acoes { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 9px; margin-top: 8px; border-top: 1px solid var(--ui-borda); padding-top: 16px; }
        .reservas-estoque__girando { animation: reservas-giro 1s linear infinite; }
        @keyframes reservas-giro { to { transform: rotate(360deg); } }
        @media (max-width: 850px) { .reservas-estoque__indicadores { grid-template-columns: 1fr 1fr; } .reservas-estoque__indicador:last-child { grid-column: 1 / -1; } }
        @media (max-width: 640px) { .reservas-estoque { padding: 23px 13px; } .reservas-estoque__cabecalho { align-items: flex-start; flex-direction: column; } .reservas-estoque__cabecalho-acoes { width: 100%; } .reservas-estoque__cabecalho-acoes .reservas-estoque__botao { flex: 1; } .reservas-estoque__indicadores { grid-template-columns: 1fr; gap: 9px; } .reservas-estoque__indicador:last-child { grid-column: auto; } .reservas-estoque__indicador { min-height: 88px; } .reservas-estoque__painel-topo { align-items: flex-start; padding: 17px 15px 14px; } .reservas-estoque__filtros { flex-direction: column; padding: 0 15px 14px; } .reservas-estoque__filtro-status { min-width: 0; } .reservas-estoque__nota { margin: 4px 14px 15px; } .reservas-estoque__rodape { align-items: flex-start; flex-direction: column; } .reservas-estoque__overlay { align-items: start; padding: 10px; } .reservas-estoque__modal { max-height: none; margin: 12px 0; padding: 17px; } .reservas-estoque__formulario { grid-template-columns: 1fr; } .reservas-estoque__campo--json, .reservas-estoque__modal-acoes, .reservas-estoque__erro-formulario { grid-column: 1; } .reservas-estoque__modal-acoes { flex-direction: column-reverse; } .reservas-estoque__modal-acoes .reservas-estoque__botao { width: 100%; } }
      `}</style>
    </main>
  );
}
