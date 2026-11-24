"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Clock3,
  Edit3,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";
import ROTAS from "@/app/constants/rotas";

type LocalEstoque = {
  status_id: number | null;
  id_estoque_local: number | null;
  nome: string | null;
  codigo: string | null;
  descricao: string | null;
  ativo: boolean | number | string | null;
  criado_em: string | null;
};

type StatusCadastro = {
  id_status: number;
  grupo: string | null;
  codigo: string | null;
  nome: string | null;
  ativo: boolean | number | string | null;
};

type FormularioLocal = {
  nome: string;
  codigo: string;
  descricao: string;
  status_id: string;
  ativo: boolean;
};

type RespostaApi = {
  sucesso?: boolean;
  mensagem?: string;
  message?: string;
  erro?: string;
  dados?: unknown;
  locais?: LocalEstoque[];
  local?: LocalEstoque;
  [chave: string]: unknown;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const FORMULARIO_VAZIO: FormularioLocal = {
  nome: "",
  codigo: "",
  descricao: "",
  status_id: "",
  ativo: true,
};

function ativoComoBooleano(valor: LocalEstoque["ativo"] | StatusCadastro["ativo"]): boolean {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

function formatarData(valor: string | null | undefined): string {
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

function textoErro(dados: unknown, fallback: string): string {
  if (dados && typeof dados === "object") {
    const objeto = dados as RespostaApi;
    if (typeof objeto.mensagem === "string" && objeto.mensagem.trim()) return objeto.mensagem;
    if (typeof objeto.message === "string" && objeto.message.trim()) return objeto.message;
    if (typeof objeto.erro === "string" && objeto.erro.trim()) return objeto.erro;
  }
  return fallback;
}

async function requisitar<T>(rota: string, metodo = "GET", corpo?: unknown): Promise<T> {
  if (!API_URL) {
    throw new Error("A variável NEXT_PUBLIC_API_URL não está configurada no ambiente do Next.js.");
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
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = { mensagem: texto };
    }
  }

  if (!resposta.ok || (dados && typeof dados === "object" && (dados as RespostaApi).sucesso === false)) {
    throw new Error(textoErro(dados, `A operação não foi concluída. HTTP ${resposta.status}.`));
  }

  return dados as T;
}

function extrairLista<T>(resposta: unknown, chave: string): T[] {
  if (Array.isArray(resposta)) return resposta as T[];
  if (!resposta || typeof resposta !== "object") return [];

  const raiz = resposta as Record<string, unknown>;
  const dados = raiz.dados && typeof raiz.dados === "object"
    ? (raiz.dados as Record<string, unknown>)
    : raiz;
  const lista = dados[chave];
  if (!Array.isArray(lista)) {
    throw new Error(`A API não retornou uma lista válida de ${chave}.`);
  }
  return lista as T[];
}

function nomeStatus(status: StatusCadastro): string {
  const partes = [status.grupo, status.nome, status.codigo].filter(Boolean);
  return `${status.id_status} — ${partes.join(" • ") || "Status cadastrado"}`;
}

export default function LocaisEstoquePage() {
  const [locais, setLocais] = useState<LocalEstoque[]>([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusCadastro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [erroStatus, setErroStatus] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [localEditando, setLocalEditando] = useState<LocalEstoque | null>(null);
  const [formulario, setFormulario] = useState<FormularioLocal>(FORMULARIO_VAZIO);

  const carregarLocais = useCallback(async (silencioso = false) => {
    if (silencioso) setAtualizando(true);
    else setCarregando(true);
    setErro("");

    try {
      const resposta = await requisitar<unknown>(ROTAS.ESTOQUE.PAINEL.LOCAIS.LISTAR);
      const lista = extrairLista<LocalEstoque>(resposta, "locais");
      setLocais(lista);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível carregar os locais de estoque.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  const carregarStatus = useCallback(async () => {
    try {
      // O catálogo de status é consultado no banco. Caso o usuário não tenha
      // acesso a esse endpoint, o formulário oferece entrada pelo ID existente.
      const resposta = await requisitar<unknown>(ROTAS.PERMISSOES.STATUS.LISTAR);
      const lista = extrairLista<StatusCadastro>(resposta, "status");
      setStatusDisponiveis(lista.filter((item) => Number.isInteger(Number(item.id_status)) && Number(item.id_status) > 0));
      setErroStatus("");
    } catch (falha) {
      setStatusDisponiveis([]);
      setErroStatus(falha instanceof Error ? falha.message : "Não foi possível consultar o catálogo de status.");
    }
  }, []);

  useEffect(() => {
    void carregarLocais();
    void carregarStatus();
  }, [carregarLocais, carregarStatus]);

  const locaisFiltrados = useMemo(() => {
    const termo = termoBusca.trim().toLocaleLowerCase("pt-BR");
    return locais.filter((local) => {
      const correspondeBusca = !termo || [local.nome, local.codigo, local.descricao]
        .some((valor) => (valor ?? "").toLocaleLowerCase("pt-BR").includes(termo));
      const ativo = ativoComoBooleano(local.ativo);
      const correspondeStatus = filtroAtivo === "todos"
        || (filtroAtivo === "ativos" && ativo)
        || (filtroAtivo === "inativos" && !ativo);
      return correspondeBusca && correspondeStatus;
    });
  }, [locais, termoBusca, filtroAtivo]);

  const totalAtivos = useMemo(() => locais.filter((local) => ativoComoBooleano(local.ativo)).length, [locais]);
  const totalInativos = locais.length - totalAtivos;

  function abrirNovoLocal() {
    setLocalEditando(null);
    setFormulario({
      ...FORMULARIO_VAZIO,
      status_id: statusDisponiveis[0] ? String(statusDisponiveis[0].id_status) : "",
    });
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirEdicao(local: LocalEstoque) {
    setLocalEditando(local);
    setFormulario({
      nome: local.nome ?? "",
      codigo: local.codigo ?? "",
      descricao: local.descricao ?? "",
      status_id: local.status_id != null ? String(local.status_id) : "",
      ativo: ativoComoBooleano(local.ativo),
    });
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setLocalEditando(null);
  }

  async function salvarLocal(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");

    const statusId = Number(formulario.status_id);
    const nome = formulario.nome.trim();
    const codigo = formulario.codigo.trim();

    if (!nome || !codigo) {
      setErro("Nome e código do local são obrigatórios.");
      return;
    }
    if (!Number.isInteger(statusId) || statusId <= 0) {
      setErro("Selecione ou informe um ID de status válido que exista no banco de dados.");
      return;
    }

    // Os nomes das propriedades seguem os parâmetros do EstoqueController.
    const payload = {
      statusId,
      nome,
      codigo,
      descricao: formulario.descricao.trim() || null,
      ativo: formulario.ativo,
    };

    setSalvando(true);
    try {
      if (localEditando?.id_estoque_local) {
        await requisitar(
          ROTAS.ESTOQUE.PAINEL.LOCAIS.ATUALIZAR(localEditando.id_estoque_local),
          "PUT",
          payload,
        );
        setSucesso("Local de estoque atualizado com sucesso.");
      } else {
        await requisitar(ROTAS.ESTOQUE.PAINEL.LOCAIS.CADASTRAR, "POST", payload);
        setSucesso("Local de estoque cadastrado com sucesso.");
      }

      setModalAberto(false);
      setLocalEditando(null);
      setFormulario(FORMULARIO_VAZIO);
      await carregarLocais(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar o local de estoque.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(local: LocalEstoque) {
    if (!local.id_estoque_local) return;
    const novoAtivo = !ativoComoBooleano(local.ativo);
    const acao = novoAtivo ? "ativar" : "desativar";
    if (!window.confirm(`Deseja realmente ${acao} o local “${local.nome ?? local.codigo}”?`)) return;

    setErro("");
    setSucesso("");
    try {
      await requisitar(
        ROTAS.ESTOQUE.PAINEL.LOCAIS.ALTERAR_ATIVO(local.id_estoque_local),
        "PUT",
        { ativo: novoAtivo },
      );
      setSucesso(novoAtivo ? "Local ativado com sucesso." : "Local desativado com sucesso.");
      await carregarLocais(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível alterar a situação do local.");
    }
  }

  async function excluirLocal(local: LocalEstoque) {
    if (!local.id_estoque_local) return;
    const confirmar = window.confirm(
      `Deseja excluir o local “${local.nome ?? local.codigo}”?\n\nO backend impede a exclusão quando existem saldos, reservas ou movimentações vinculadas. Nesses casos, desative o local.`,
    );
    if (!confirmar) return;

    setErro("");
    setSucesso("");
    try {
      await requisitar(ROTAS.ESTOQUE.PAINEL.LOCAIS.EXCLUIR(local.id_estoque_local), "DELETE");
      setSucesso("Local excluído com sucesso.");
      await carregarLocais(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível excluir o local de estoque.");
    }
  }

  return (
    <main className="locais-estoque">
      <div className="locais-estoque__container">
        <nav className="locais-estoque__breadcrumb" aria-label="Caminho de navegação">
          <Link href={ROTAS.PAINEL.INICIO}>Painel</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link href={ROTAS.PAGINAS.PAINEL.ESTOQUE.LISTAR}>Estoque</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span>Locais</span>
        </nav>

        <header className="locais-estoque__cabecalho">
          <div className="locais-estoque__titulo-wrap">
            <span className="locais-estoque__sobretitulo"><MapPin size={13} /> ORGANIZAÇÃO DO ESTOQUE</span>
            <h1>Locais de estoque</h1>
            <p>Cadastre e organize os espaços físicos ou pontos onde seus produtos ficam armazenados.</p>
          </div>
          <div className="locais-estoque__acoes-topo">
            <button className="locais-estoque__botao locais-estoque__botao--secundario" type="button" onClick={() => void carregarLocais(true)} disabled={atualizando || carregando}>
              <RefreshCw size={16} className={atualizando ? "locais-estoque__girando" : ""} />
              Atualizar
            </button>
            <button className="locais-estoque__botao locais-estoque__botao--primario" type="button" onClick={abrirNovoLocal}>
              <Plus size={17} /> Novo local
            </button>
          </div>
        </header>

        {erro && !modalAberto && (
          <div className="locais-estoque__alerta locais-estoque__alerta--erro" role="alert">
            <AlertCircle size={18} /> <span>{erro}</span>
            <button type="button" onClick={() => setErro("")} aria-label="Fechar aviso"><X size={16} /></button>
          </div>
        )}
        {sucesso && (
          <div className="locais-estoque__alerta locais-estoque__alerta--sucesso" role="status">
            <CheckCircle2 size={18} /> <span>{sucesso}</span>
            <button type="button" onClick={() => setSucesso("")} aria-label="Fechar aviso"><X size={16} /></button>
          </div>
        )}

        <section className="locais-estoque__resumo" aria-label="Resumo dos locais">
          <article className="locais-estoque__indicador">
            <span className="locais-estoque__indicador-icone locais-estoque__indicador-icone--vinho"><Warehouse size={19} /></span>
            <div><small>TOTAL CADASTRADO</small><strong>{carregando ? "—" : locais.length}</strong><span>Locais registrados no banco</span></div>
          </article>
          <article className="locais-estoque__indicador">
            <span className="locais-estoque__indicador-icone locais-estoque__indicador-icone--verde"><CheckCircle2 size={19} /></span>
            <div><small>LOCAIS ATIVOS</small><strong>{carregando ? "—" : totalAtivos}</strong><span>Disponíveis para operação</span></div>
          </article>
          <article className="locais-estoque__indicador">
            <span className="locais-estoque__indicador-icone locais-estoque__indicador-icone--cinza"><CircleOff size={19} /></span>
            <div><small>LOCAIS INATIVOS</small><strong>{carregando ? "—" : totalInativos}</strong><span>Fora de uso no momento</span></div>
          </article>
        </section>

        <section className="locais-estoque__painel-lista">
          <div className="locais-estoque__painel-cabecalho">
            <div>
              <span className="locais-estoque__rotulo">CADASTRO E CONSULTA</span>
              <h2>Todos os locais</h2>
              <p>Os registros abaixo são consultados diretamente pela API do estoque.</p>
            </div>
            <span className="locais-estoque__contador">{locaisFiltrados.length} {locaisFiltrados.length === 1 ? "registro" : "registros"}</span>
          </div>

          <div className="locais-estoque__filtros">
            <label className="locais-estoque__busca">
              <Search size={17} />
              <input
                type="search"
                value={termoBusca}
                onChange={(evento) => setTermoBusca(evento.target.value)}
                placeholder="Buscar por nome, código ou descrição..."
                aria-label="Buscar locais"
              />
              {termoBusca && <button type="button" onClick={() => setTermoBusca("")} aria-label="Limpar busca"><X size={15} /></button>}
            </label>
            <label className="locais-estoque__filtro-status">
              <Filter size={16} />
              <select value={filtroAtivo} onChange={(evento) => setFiltroAtivo(evento.target.value)} aria-label="Filtrar pela situação">
                <option value="todos">Todos os locais</option>
                <option value="ativos">Somente ativos</option>
                <option value="inativos">Somente inativos</option>
              </select>
            </label>
          </div>

          <div className="locais-estoque__tabela-wrap">
            <table className="locais-estoque__tabela">
              <thead>
                <tr>
                  <th>Local</th>
                  <th>Código</th>
                  <th>Status ID</th>
                  <th>Criado em</th>
                  <th>Situação</th>
                  <th className="locais-estoque__th-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={6} className="locais-estoque__estado"><RefreshCw size={18} className="locais-estoque__girando" /> Carregando locais do banco de dados...</td></tr>
                ) : locaisFiltrados.length === 0 ? (
                  <tr><td colSpan={6} className="locais-estoque__estado"><Warehouse size={22} /><strong>{locais.length === 0 ? "Nenhum local cadastrado" : "Nenhum resultado encontrado"}</strong><span>{locais.length === 0 ? "Cadastre o primeiro local para começar a organizar seu estoque." : "Tente alterar a busca ou o filtro selecionado."}</span></td></tr>
                ) : locaisFiltrados.map((local) => {
                  const ativo = ativoComoBooleano(local.ativo);
                  return (
                    <tr key={local.id_estoque_local ?? `${local.codigo}-${local.nome}`}>
                      <td>
                        <div className="locais-estoque__nome-local"><span className="locais-estoque__mini-icone"><Warehouse size={16} /></span><div><strong>{local.nome || "Local sem nome"}</strong><small>{local.descricao || "Sem descrição cadastrada"}</small></div></div>
                      </td>
                      <td><span className="locais-estoque__codigo">{local.codigo || "—"}</span></td>
                      <td><span className="locais-estoque__id-status">{local.status_id ?? "—"}</span></td>
                      <td><span className="locais-estoque__data"><Clock3 size={13} />{formatarData(local.criado_em)}</span></td>
                      <td><span className={`locais-estoque__badge ${ativo ? "locais-estoque__badge--ativo" : "locais-estoque__badge--inativo"}`}><i />{ativo ? "Ativo" : "Inativo"}</span></td>
                      <td>
                        <div className="locais-estoque__acoes-linha">
                          <button type="button" className="locais-estoque__acao" onClick={() => abrirEdicao(local)} title="Editar local" aria-label={`Editar ${local.nome}`}><Edit3 size={16} /></button>
                          <button type="button" className="locais-estoque__acao" onClick={() => void alternarAtivo(local)} title={ativo ? "Desativar local" : "Ativar local"} aria-label={ativo ? `Desativar ${local.nome}` : `Ativar ${local.nome}`}>{ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}</button>
                          <button type="button" className="locais-estoque__acao locais-estoque__acao--perigo" onClick={() => void excluirLocal(local)} title="Excluir local" aria-label={`Excluir ${local.nome}`}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="locais-estoque__nota"><AlertCircle size={15} /><span>Locais vinculados a saldos, reservas ou movimentações não podem ser excluídos. Para esses casos, utilize a opção de desativar.</span></div>
        </section>

        <footer className="locais-estoque__rodape">
          <span><Warehouse size={14} /> UNIVERSO IMPÉRIO · GESTÃO DE ESTOQUE</span>
          <Link href={ROTAS.PAGINAS.PAINEL.ESTOQUE.LISTAR}><ArrowLeft size={14} /> Voltar ao painel do estoque</Link>
        </footer>
      </div>

      {modalAberto && (
        <div className="locais-estoque__modal-fundo" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fecharModal(); }}>
          <section className="locais-estoque__modal" role="dialog" aria-modal="true" aria-labelledby="locais-modal-titulo">
            <header className="locais-estoque__modal-cabecalho">
              <div className="locais-estoque__modal-icone"><Warehouse size={20} /></div>
              <div><span className="locais-estoque__rotulo">LOCAL DE ESTOQUE</span><h2 id="locais-modal-titulo">{localEditando ? "Editar local" : "Novo local"}</h2><p>Preencha os dados que serão gravados no banco.</p></div>
              <button type="button" className="locais-estoque__fechar-modal" onClick={fecharModal} disabled={salvando} aria-label="Fechar"><X size={19} /></button>
            </header>

            {erro && <div className="locais-estoque__alerta locais-estoque__alerta--erro" role="alert"><AlertCircle size={17} /><span>{erro}</span></div>}

            <form className="locais-estoque__formulario" onSubmit={salvarLocal}>
              <div className="locais-estoque__campo">
                <label htmlFor="local-nome">Nome do local <b>*</b></label>
                <input id="local-nome" type="text" maxLength={150} required value={formulario.nome} onChange={(evento) => setFormulario((atual) => ({ ...atual, nome: evento.target.value }))} placeholder="Ex.: Estoque principal" />
              </div>
              <div className="locais-estoque__campo">
                <label htmlFor="local-codigo">Código <b>*</b></label>
                <input id="local-codigo" type="text" maxLength={80} required value={formulario.codigo} onChange={(evento) => setFormulario((atual) => ({ ...atual, codigo: evento.target.value.toLocaleUpperCase("pt-BR") }))} placeholder="Ex.: EST-001" />
                <small>O código deve ser único. O backend valida duplicidade.</small>
              </div>
              <div className="locais-estoque__campo locais-estoque__campo--largura-total">
                <label htmlFor="local-descricao">Descrição</label>
                <textarea id="local-descricao" rows={3} maxLength={500} value={formulario.descricao} onChange={(evento) => setFormulario((atual) => ({ ...atual, descricao: evento.target.value }))} placeholder="Descreva a localização ou finalidade deste espaço..." />
              </div>
              <div className="locais-estoque__campo locais-estoque__campo--largura-total">
                <label htmlFor="local-status">Status do cadastro <b>*</b></label>
                {statusDisponiveis.length > 0 ? (
                  <select id="local-status" required value={formulario.status_id} onChange={(evento) => setFormulario((atual) => ({ ...atual, status_id: evento.target.value }))}>
                    <option value="">Selecione o status do banco</option>
                    {statusDisponiveis.map((status) => <option key={status.id_status} value={status.id_status}>{nomeStatus(status)}</option>)}
                  </select>
                ) : (
                  <input id="local-status" type="number" min={1} step={1} required value={formulario.status_id} onChange={(evento) => setFormulario((atual) => ({ ...atual, status_id: evento.target.value }))} placeholder="Informe o ID de status existente" />
                )}
                {erroStatus ? <small className="locais-estoque__ajuda-aviso">Não foi possível carregar o catálogo de status pela API. Informe o ID de um status que já exista no banco. ({erroStatus})</small> : <small>O campo status_id é obrigatório no EstoqueController.</small>}
              </div>
              <label className="locais-estoque__alternador">
                <input type="checkbox" checked={formulario.ativo} onChange={(evento) => setFormulario((atual) => ({ ...atual, ativo: evento.target.checked }))} />
                <span className="locais-estoque__alternador-visual"><Check size={13} /></span>
                <span><strong>Local ativo</strong><small>Permite que este local seja utilizado nas operações de estoque.</small></span>
              </label>
              <div className="locais-estoque__modal-acoes">
                <button type="button" className="locais-estoque__botao locais-estoque__botao--secundario" onClick={fecharModal} disabled={salvando}>Cancelar</button>
                <button type="submit" className="locais-estoque__botao locais-estoque__botao--primario" disabled={salvando}>
                  {salvando ? <RefreshCw size={16} className="locais-estoque__girando" /> : <Check size={16} />}
                  {salvando ? "Salvando..." : localEditando ? "Salvar alterações" : "Cadastrar local"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <style jsx>{`
        .locais-estoque, .locais-estoque * { box-sizing: border-box; }
        .locais-estoque { width: 100%; min-width: 0; padding: clamp(24px, 3vw, 42px) var(--ui-espaco-lateral, 24px) 58px; color: var(--ui-texto); font-family: var(--ui-fonte-base); background: radial-gradient(circle at 92% 0%, var(--ui-borda-suave), transparent 27rem), var(--ui-fundo); }
        .locais-estoque__container { width: min(100%, var(--ui-largura-maxima, 1440px)); min-width: 0; margin-inline: auto; }
        .locais-estoque__breadcrumb { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; margin-bottom: 24px; color: var(--ui-texto-claro); font-size: var(--ui-texto-xs, .75rem); }
        .locais-estoque__breadcrumb a { color: var(--ui-vinho); text-decoration: none; }
        .locais-estoque__breadcrumb a:hover { color: var(--ui-vinho-escuro); text-decoration: underline; }
        .locais-estoque__cabecalho { display: flex; align-items: flex-end; justify-content: space-between; gap: 22px; margin-bottom: 29px; }
        .locais-estoque__titulo-wrap { max-width: 760px; min-width: 0; }
        .locais-estoque__sobretitulo, .locais-estoque__rotulo { display: inline-flex; align-items: center; gap: 8px; color: var(--ui-rosa); font-size: .66rem; font-weight: 850; letter-spacing: .16em; }
        .locais-estoque__cabecalho h1 { margin: 8px 0 7px; color: var(--ui-vinho-escuro); font-family: var(--ui-fonte-titulo, inherit); font-size: clamp(2rem, 4vw, 3.05rem); font-weight: 850; letter-spacing: -.055em; line-height: 1.08; }
        .locais-estoque__cabecalho p { max-width: 680px; margin: 0; color: var(--ui-texto-secundario); font-size: .91rem; line-height: 1.65; }
        .locais-estoque__acoes-topo { display: flex; flex: 0 0 auto; gap: 10px; }
        .locais-estoque__botao { display: inline-flex; min-height: 43px; align-items: center; justify-content: center; gap: 8px; border: 1px solid transparent; border-radius: var(--ui-raio-md, 12px); padding: 0 15px; font: inherit; font-size: .77rem; font-weight: 800; cursor: pointer; text-decoration: none; transition: transform var(--ui-transicao-padrao, 220ms ease), box-shadow var(--ui-transicao-padrao, 220ms ease), border-color var(--ui-transicao-padrao, 220ms ease); }
        .locais-estoque__botao:hover:not(:disabled) { transform: translateY(-2px); }
        .locais-estoque__botao:disabled { opacity: .65; cursor: wait; }
        .locais-estoque__botao--primario { color: var(--ui-branco); background: var(--ui-vinho); box-shadow: 0 8px 18px color-mix(in srgb, var(--ui-vinho) 18%, transparent); }
        .locais-estoque__botao--primario:hover:not(:disabled) { background: var(--ui-vinho-escuro); box-shadow: var(--ui-sombra-card); }
        .locais-estoque__botao--secundario { border-color: var(--ui-borda); color: var(--ui-vinho); background: var(--ui-superficie); box-shadow: var(--ui-sombra-suave); }
        .locais-estoque__botao--secundario:hover:not(:disabled) { border-color: var(--ui-rosa-medio); box-shadow: var(--ui-sombra-card); }
        .locais-estoque__alerta { display: flex; align-items: flex-start; gap: 10px; margin: 0 0 18px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-md, 12px); padding: 12px 14px; font-size: .78rem; line-height: 1.5; }
        .locais-estoque__alerta > svg { flex: 0 0 auto; margin-top: 1px; }
        .locais-estoque__alerta > span { min-width: 0; flex: 1; }
        .locais-estoque__alerta button { display: grid; flex: 0 0 auto; place-items: center; border: 0; padding: 0; color: currentColor; background: transparent; cursor: pointer; }
        .locais-estoque__alerta--erro { border-color: color-mix(in srgb, var(--ui-erro) 25%, var(--ui-borda)); color: var(--ui-erro); background: color-mix(in srgb, var(--ui-erro) 5%, var(--ui-branco)); }
        .locais-estoque__alerta--sucesso { border-color: color-mix(in srgb, var(--ui-sucesso) 25%, var(--ui-borda)); color: var(--ui-sucesso); background: color-mix(in srgb, var(--ui-sucesso) 6%, var(--ui-branco)); }
        .locais-estoque__resumo { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 31px; }
        .locais-estoque__indicador { display: flex; min-width: 0; align-items: center; gap: 14px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-lg, 18px); padding: 17px; background: var(--ui-superficie); box-shadow: var(--ui-sombra-suave); }
        .locais-estoque__indicador-icone { display: grid; width: 43px; height: 43px; flex: 0 0 43px; place-items: center; border-radius: var(--ui-raio-md, 12px); }
        .locais-estoque__indicador-icone--vinho { color: var(--ui-vinho); background: var(--ui-blush); }
        .locais-estoque__indicador-icone--verde { color: var(--ui-sucesso); background: color-mix(in srgb, var(--ui-sucesso) 10%, var(--ui-branco)); }
        .locais-estoque__indicador-icone--cinza { color: var(--ui-texto-secundario); background: var(--ui-superficie-suave); }
        .locais-estoque__indicador > div { min-width: 0; }
        .locais-estoque__indicador small, .locais-estoque__indicador strong, .locais-estoque__indicador span { display: block; }
        .locais-estoque__indicador small { color: var(--ui-texto-claro); font-size: .57rem; font-weight: 850; letter-spacing: .12em; }
        .locais-estoque__indicador strong { margin-top: 4px; color: var(--ui-vinho-escuro); font-size: 1.55rem; font-weight: 850; letter-spacing: -.045em; line-height: 1.1; font-variant-numeric: tabular-nums; }
        .locais-estoque__indicador div > span { margin-top: 4px; color: var(--ui-texto-secundario); font-size: .68rem; }
        .locais-estoque__painel-lista { overflow: hidden; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-xl, 24px); background: var(--ui-superficie); box-shadow: var(--ui-sombra-suave); }
        .locais-estoque__painel-cabecalho { display: flex; align-items: flex-end; justify-content: space-between; gap: 15px; padding: 23px 23px 18px; }
        .locais-estoque__painel-cabecalho h2 { margin: 5px 0 4px; color: var(--ui-vinho-escuro); font-size: 1.35rem; font-weight: 850; letter-spacing: -.04em; }
        .locais-estoque__painel-cabecalho p { margin: 0; color: var(--ui-texto-secundario); font-size: .73rem; line-height: 1.5; }
        .locais-estoque__contador { flex: 0 0 auto; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-pilula, 999px); padding: 7px 11px; color: var(--ui-vinho-suave); background: var(--ui-superficie-suave); font-size: .66rem; font-weight: 800; }
        .locais-estoque__filtros { display: flex; gap: 10px; padding: 0 23px 18px; }
        .locais-estoque__busca, .locais-estoque__filtro-status { display: flex; min-height: 42px; align-items: center; gap: 9px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-md, 12px); padding: 0 12px; color: var(--ui-texto-claro); background: var(--ui-superficie); }
        .locais-estoque__busca { min-width: 0; flex: 1; }
        .locais-estoque__busca input { width: 100%; min-width: 0; border: 0; outline: 0; color: var(--ui-texto); background: transparent; font: inherit; font-size: .75rem; }
        .locais-estoque__busca input::placeholder { color: var(--ui-texto-claro); }
        .locais-estoque__busca button { display: grid; place-items: center; border: 0; padding: 2px; color: var(--ui-texto-claro); background: transparent; cursor: pointer; }
        .locais-estoque__filtro-status { flex: 0 0 auto; }
        .locais-estoque__filtro-status select { max-width: 100%; border: 0; outline: 0; color: var(--ui-texto); background: transparent; font: inherit; font-size: .72rem; cursor: pointer; }
        .locais-estoque__tabela-wrap { width: 100%; overflow-x: auto; }
        .locais-estoque__tabela { width: 100%; min-width: 850px; border-collapse: collapse; text-align: left; }
        .locais-estoque__tabela th { padding: 12px 15px; color: var(--ui-texto-claro); background: var(--ui-superficie-suave); font-size: .58rem; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
        .locais-estoque__tabela td { border-top: 1px solid var(--ui-borda-suave); padding: 13px 15px; color: var(--ui-texto-secundario); font-size: .72rem; vertical-align: middle; }
        .locais-estoque__tabela tbody tr:hover { background: color-mix(in srgb, var(--ui-superficie-suave) 62%, var(--ui-branco)); }
        .locais-estoque__th-acoes { text-align: center; }
        .locais-estoque__nome-local { display: flex; min-width: 190px; align-items: center; gap: 10px; }
        .locais-estoque__mini-icone { display: grid; width: 35px; height: 35px; flex: 0 0 35px; place-items: center; border-radius: var(--ui-raio-sm, 8px); color: var(--ui-vinho); background: var(--ui-blush); }
        .locais-estoque__nome-local > div { min-width: 0; }
        .locais-estoque__nome-local strong, .locais-estoque__nome-local small { display: block; }
        .locais-estoque__nome-local strong { color: var(--ui-vinho-escuro); font-size: .75rem; font-weight: 800; }
        .locais-estoque__nome-local small { max-width: 270px; overflow: hidden; margin-top: 3px; color: var(--ui-texto-claro); font-size: .65rem; text-overflow: ellipsis; white-space: nowrap; }
        .locais-estoque__codigo { display: inline-flex; border: 1px solid var(--ui-borda); border-radius: 6px; padding: 5px 7px; color: var(--ui-vinho-suave); background: var(--ui-superficie-suave); font-size: .67rem; font-weight: 800; }
        .locais-estoque__id-status { color: var(--ui-texto-secundario); font-variant-numeric: tabular-nums; }
        .locais-estoque__data { display: inline-flex; align-items: center; gap: 6px; color: var(--ui-texto-secundario); white-space: nowrap; }
        .locais-estoque__data svg { color: var(--ui-texto-claro); }
        .locais-estoque__badge { display: inline-flex; align-items: center; gap: 7px; border-radius: var(--ui-raio-pilula, 999px); padding: 6px 9px; font-size: .64rem; font-weight: 800; white-space: nowrap; }
        .locais-estoque__badge i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .locais-estoque__badge--ativo { color: var(--ui-sucesso); background: color-mix(in srgb, var(--ui-sucesso) 10%, var(--ui-branco)); }
        .locais-estoque__badge--inativo { color: var(--ui-texto-secundario); background: var(--ui-superficie-suave); }
        .locais-estoque__acoes-linha { display: flex; align-items: center; justify-content: center; gap: 5px; }
        .locais-estoque__acao { display: grid; width: 32px; height: 32px; place-items: center; border: 1px solid transparent; border-radius: var(--ui-raio-sm, 8px); color: var(--ui-vinho); background: transparent; cursor: pointer; transition: color var(--ui-transicao-rapida, 150ms ease), border-color var(--ui-transicao-rapida, 150ms ease), background var(--ui-transicao-rapida, 150ms ease); }
        .locais-estoque__acao:hover { border-color: var(--ui-borda); color: var(--ui-vinho-escuro); background: var(--ui-blush); }
        .locais-estoque__acao--perigo { color: var(--ui-erro); }
        .locais-estoque__acao--perigo:hover { border-color: color-mix(in srgb, var(--ui-erro) 22%, var(--ui-borda)); background: color-mix(in srgb, var(--ui-erro) 6%, var(--ui-branco)); }
        .locais-estoque__estado { height: 170px; color: var(--ui-texto-claro) !important; text-align: center; }
        .locais-estoque__estado > svg { display: inline-block; margin-bottom: 8px; vertical-align: middle; }
        .locais-estoque__estado strong, .locais-estoque__estado span { display: block; }
        .locais-estoque__estado strong { margin-bottom: 4px; color: var(--ui-vinho-escuro); font-size: .8rem; }
        .locais-estoque__estado span { font-size: .7rem; }
        .locais-estoque__nota { display: flex; align-items: flex-start; gap: 8px; margin: 0 23px 21px; border: 1px solid color-mix(in srgb, var(--ui-info) 19%, var(--ui-borda)); border-radius: var(--ui-raio-md, 12px); padding: 11px 13px; color: var(--ui-info); background: color-mix(in srgb, var(--ui-info) 5%, var(--ui-branco)); font-size: .68rem; line-height: 1.5; }
        .locais-estoque__nota svg { flex: 0 0 auto; margin-top: 1px; }
        .locais-estoque__rodape { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 26px; border-top: 1px solid var(--ui-borda); padding-top: 15px; color: var(--ui-texto-claro); font-size: .63rem; font-weight: 800; letter-spacing: .08em; }
        .locais-estoque__rodape span, .locais-estoque__rodape a { display: inline-flex; align-items: center; gap: 7px; }
        .locais-estoque__rodape span { color: var(--ui-vinho-suave); }
        .locais-estoque__rodape a { color: var(--ui-vinho); font-size: .7rem; letter-spacing: 0; text-decoration: none; }
        .locais-estoque__rodape a:hover { color: var(--ui-rosa); }
        .locais-estoque__modal-fundo { position: fixed; z-index: 1000; inset: 0; display: grid; place-items: center; overflow-y: auto; padding: 22px; background: color-mix(in srgb, var(--ui-vinho-escuro) 48%, transparent); backdrop-filter: blur(4px); }
        .locais-estoque__modal { width: min(100%, 620px); max-height: min(92vh, 820px); overflow-y: auto; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-xl, 24px); padding: 24px; background: var(--ui-superficie); box-shadow: var(--ui-sombra-destaque); }
        .locais-estoque__modal-cabecalho { display: flex; align-items: flex-start; gap: 13px; margin-bottom: 20px; }
        .locais-estoque__modal-icone { display: grid; width: 44px; height: 44px; flex: 0 0 44px; place-items: center; border-radius: var(--ui-raio-md, 12px); color: var(--ui-branco); background: var(--ui-vinho); }
        .locais-estoque__modal-cabecalho > div:nth-child(2) { min-width: 0; flex: 1; }
        .locais-estoque__modal-cabecalho h2 { margin: 4px 0 3px; color: var(--ui-vinho-escuro); font-size: 1.35rem; font-weight: 850; letter-spacing: -.04em; }
        .locais-estoque__modal-cabecalho p { margin: 0; color: var(--ui-texto-secundario); font-size: .72rem; }
        .locais-estoque__fechar-modal { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-sm, 8px); color: var(--ui-texto-secundario); background: var(--ui-superficie); cursor: pointer; }
        .locais-estoque__fechar-modal:hover { color: var(--ui-erro); border-color: var(--ui-rosa-medio); }
        .locais-estoque__formulario { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
        .locais-estoque__campo { display: flex; min-width: 0; flex-direction: column; gap: 7px; }
        .locais-estoque__campo--largura-total { grid-column: 1 / -1; }
        .locais-estoque__campo label { color: var(--ui-texto); font-size: .72rem; font-weight: 800; }
        .locais-estoque__campo label b { color: var(--ui-erro); }
        .locais-estoque__campo input, .locais-estoque__campo select, .locais-estoque__campo textarea { width: 100%; min-width: 0; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-md, 12px); outline: 0; padding: 11px 12px; color: var(--ui-texto); background: var(--ui-superficie); font: inherit; font-size: .77rem; transition: border-color var(--ui-transicao-rapida, 150ms ease), box-shadow var(--ui-transicao-rapida, 150ms ease); }
        .locais-estoque__campo input:focus, .locais-estoque__campo select:focus, .locais-estoque__campo textarea:focus { border-color: var(--ui-rosa); box-shadow: 0 0 0 3px var(--ui-borda-suave); }
        .locais-estoque__campo input::placeholder, .locais-estoque__campo textarea::placeholder { color: var(--ui-texto-claro); }
        .locais-estoque__campo textarea { resize: vertical; }
        .locais-estoque__campo small { color: var(--ui-texto-claro); font-size: .63rem; line-height: 1.45; }
        .locais-estoque__campo .locais-estoque__ajuda-aviso { color: var(--ui-alerta); }
        .locais-estoque__alternador { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-md, 12px); padding: 12px; cursor: pointer; }
        .locais-estoque__alternador input { position: absolute; width: 1px; height: 1px; opacity: 0; }
        .locais-estoque__alternador-visual { display: grid; width: 22px; height: 22px; flex: 0 0 22px; place-items: center; border: 1px solid var(--ui-borda); border-radius: 6px; color: transparent; background: var(--ui-superficie); }
        .locais-estoque__alternador input:checked + .locais-estoque__alternador-visual { border-color: var(--ui-vinho); color: var(--ui-branco); background: var(--ui-vinho); }
        .locais-estoque__alternador > span:last-child { min-width: 0; }
        .locais-estoque__alternador strong, .locais-estoque__alternador small { display: block; }
        .locais-estoque__alternador strong { color: var(--ui-vinho-escuro); font-size: .73rem; }
        .locais-estoque__alternador small { margin-top: 3px; color: var(--ui-texto-secundario); font-size: .65rem; }
        .locais-estoque__modal-acoes { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 9px; margin-top: 5px; border-top: 1px solid var(--ui-borda-suave); padding-top: 17px; }
        .locais-estoque__girando { animation: locais-girar 1s linear infinite; }
        @keyframes locais-girar { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .locais-estoque__resumo { grid-template-columns: repeat(2, minmax(0, 1fr)); } .locais-estoque__indicador:last-child { grid-column: 1 / -1; } }
        @media (max-width: 700px) {
          .locais-estoque { padding-inline: max(14px, env(safe-area-inset-left, 0px)); }
          .locais-estoque__cabecalho { align-items: stretch; flex-direction: column; gap: 17px; }
          .locais-estoque__acoes-topo { display: grid; grid-template-columns: 1fr 1fr; }
          .locais-estoque__painel-cabecalho { align-items: flex-start; flex-direction: column; padding: 19px 16px 15px; }
          .locais-estoque__filtros { flex-direction: column; padding-inline: 16px; }
          .locais-estoque__filtro-status { min-height: 40px; }
          .locais-estoque__filtro-status select { width: 100%; }
          .locais-estoque__nota { margin-inline: 16px; }
          .locais-estoque__rodape { align-items: flex-start; flex-direction: column; }
        }
        @media (max-width: 480px) {
          .locais-estoque__resumo { grid-template-columns: minmax(0, 1fr); }
          .locais-estoque__indicador:last-child { grid-column: auto; }
          .locais-estoque__indicador { padding: 14px; }
          .locais-estoque__modal-fundo { place-items: start center; padding: 12px; }
          .locais-estoque__modal { max-height: none; margin-block: auto; padding: 18px; }
          .locais-estoque__formulario { grid-template-columns: minmax(0, 1fr); }
          .locais-estoque__campo--largura-total, .locais-estoque__alternador, .locais-estoque__modal-acoes { grid-column: auto; }
          .locais-estoque__modal-acoes { flex-direction: column-reverse; }
          .locais-estoque__modal-acoes .locais-estoque__botao { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .locais-estoque *, .locais-estoque *::before, .locais-estoque *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }
      `}</style>
    </main>
  );
}
